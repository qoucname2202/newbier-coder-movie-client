/**
 * @file pages/admin/search.tsx
 * @description Admin movie search & bulk-action management page.
 */
import React, { useState, useEffect, useRef, ChangeEvent, MouseEvent } from 'react';
import type { ReactElement } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import movieService from '@/API/services/movieService';
import searchSuggestionService from '@/API/services/searchSuggestionService';
import { useAuth } from '@/context/AuthContext';
import { formatYear, getTaxonomyList } from '@/utils/taxonomy';
import AdminLayout from '@/layouts/AdminLayout';
import Swal from 'sweetalert2';

function useDebounce(value: string, delay: number): string {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

interface AdminSearchMovie {
  uniqueId?: string;
  id?: string;
  _id?: string;
  slug?: string;
  name?: string;
  origin_name?: string;
  thumb_url?: string;
  poster_url?: string;
  year?: number;
  category?: string[];
  country?: string[];
  view_total?: number;
  [key: string]: unknown;
}

interface SearchFilters {
  category: string;
  country: string;
  year: string;
  duration: string;
}

interface SearchResponse {
  hits?: AdminSearchMovie[];
  total?: number;
}

export default function AdminSearchPage(): ReactElement | null {
  const router = useRouter();
  const { isAuthenticated, isAdmin } = useAuth();

  const [query, setQuery] = useState<string>('');
  const [movies, setMovies] = useState<AdminSearchMovie[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [initialLoad, setInitialLoad] = useState<boolean>(true);
  const [page, setPage] = useState<number>(1);
  const [filters, setFilters] = useState<SearchFilters>({ category: '', country: '', year: '', duration: '' });
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalMovies, setTotalMovies] = useState<number>(0);
  const [pageSize, setPageSize] = useState<number>(20);
  const [selectedMovies, setSelectedMovies] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState<boolean>(false);

  const [searchSuggestions, setSearchSuggestions] = useState<string[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState<boolean>(false);
  const [showSuggestions, setShowSuggestions] = useState<boolean>(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  const categories = [
    'Hành Động','Tình Cảm','Hài Hước','Cổ Trang','Tâm Lý','Hình Sự',
    'Chiến Tranh','Thể Thao','Võ Thuật','Viễn Tưởng','Phiêu Lưu',
    'Khoa Học','Kinh Dị','Âm Nhạc','Thần Thoại','Hoạt Hình'
  ];
  const countries = [
    'Trung Quốc','Hàn Quốc','Nhật Bản','Thái Lan','Âu Mỹ',
    'Đài Loan','Hồng Kông','Ấn Độ','Việt Nam'
  ];
  const years = Array.from({ length: 17 }, (_, i) => 2026 - i);
  const durations = [
    { value: 'short', label: 'Ngắn (< 60 phút)' },
    { value: 'medium', label: 'Trung bình (60-120 phút)' },
    { value: 'long', label: 'Dài (> 120 phút)' }
  ];

  useEffect(() => {
    if (isAuthenticated === false || (isAuthenticated && !isAdmin)) {
      router.replace('/login');
    }
  }, [isAuthenticated, isAdmin, router]);

  const fetchMovies = async (searchQuery?: string, pageNumber = 1): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      const currentQuery = searchQuery !== undefined ? searchQuery : query;
      const searchFilters: Record<string, string | undefined> = {
        category: filters.category || undefined,
        country: filters.country || undefined,
        year: filters.year || undefined,
        duration: filters.duration || undefined
      };
      const response = (await movieService.searchMovies(
        currentQuery,
        { ...searchFilters, search_description: true, search_all_fields: true } as unknown as Record<string, unknown>,
        pageNumber,
        pageSize
      )) as SearchResponse;

      if (response?.hits) {
        const processed = response.hits.map((m) => ({
          ...m,
          uniqueId: (m.id || m._id || m.slug) as string,
          thumb_url: (m.thumb_url || m.poster_url || '/img/Phim.png') as string
        }));
        setMovies(processed);
        setTotalMovies(response.total || 0);
        setTotalPages(Math.ceil((response.total || 0) / pageSize));
        setSelectedMovies([]);
        setSelectAll(false);
      } else {
        setError('Không nhận được dữ liệu phim hợp lệ từ máy chủ');
        setMovies([]);
      }
      setInitialLoad(false);
    } catch (err) {

      setError(`Lỗi khi tìm kiếm phim: ${(err as Error).message}`);
      setMovies([]);
      setInitialLoad(false);
    } finally {
      setLoading(false);
    }
  };

  const fetchSearchSuggestions = async (searchQuery: string): Promise<void> => {
    if (searchQuery.trim().length < 2) {
      setSearchSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    try {
      setLoadingSuggestions(true);
      setShowSuggestions(true);
      const response = (await searchSuggestionService.getSuggestions(searchQuery)) as { success?: boolean; suggestions?: string[] };
      if (response?.success && Array.isArray(response.suggestions)) setSearchSuggestions(response.suggestions);
      else setSearchSuggestions([]);
    } catch {
      setSearchSuggestions([]);
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const handleSuggestionClick = (suggestion: string): void => {
    setQuery(suggestion);
    setShowSuggestions(false);
    fetchMovies(suggestion, 1);
    updateUrlWithQueryAndFilters(suggestion);
  };

  const debouncedQuery = useDebounce(query, 800);

  const updateUrlWithQueryAndFilters = (searchQuery: string): void => {
    const queryParams: Record<string, string> = {};
    if (searchQuery.trim()) queryParams.q = searchQuery.trim();
    if (filters.category) queryParams.category = filters.category;
    if (filters.country) queryParams.country = filters.country;
    if (filters.year) queryParams.year = filters.year;
    if (filters.duration) queryParams.duration = filters.duration;
    if (page > 1) queryParams.page = String(page);
    router.push({ pathname: '/admin/search', query: queryParams }, undefined, { shallow: true });
  };

  const handleSearchInputChange = (e: ChangeEvent<HTMLInputElement>): void => {
    const newQuery = e.target.value;
    setQuery(newQuery);
    setPage(1);
    if (newQuery === '') {
      const qp: Record<string, string> = {};
      if (filters.category) qp.category = filters.category;
      if (filters.country) qp.country = filters.country;
      if (filters.year) qp.year = filters.year;
      if (filters.duration) qp.duration = filters.duration;
      if (Object.keys(qp).length > 0) {
        router.push({ pathname: '/admin/search', query: qp }, undefined, { shallow: true });
      } else {
        router.push('/admin/search', undefined, { shallow: true });
      }
    } else {
      fetchSearchSuggestions(newQuery);
    }
  };

  const handleSearch = async (e: MouseEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setPage(1);
    updateUrlWithQueryAndFilters(query);
    await fetchMovies(query, 1);
  };

  const handleFilterChange = (filterType: keyof SearchFilters, value: string): void => {
    setLoading(true);
    setFilters((prev) => {
      const updated = { ...prev, [filterType]: value };
      const qp: Record<string, string> = {};
      if (query.trim()) qp.q = query.trim();
      if (updated.category) qp.category = updated.category;
      if (updated.country) qp.country = updated.country;
      if (updated.year) qp.year = updated.year;
      if (updated.duration) qp.duration = updated.duration;
      router.push({ pathname: '/admin/search', query: qp }, undefined, { shallow: true });
      setPage(1);
      fetchMovies(query, 1);
      return updated;
    });
  };

  const handlePageChange = (newPage: number): void => {
    if (newPage < 1 || newPage > totalPages) return;
    setPage(newPage);
    const queryParams: Record<string, string | undefined> = { ...router.query as Record<string, string> };
    if (newPage === 1) delete queryParams.page;
    else queryParams.page = String(newPage);
    router.push({ pathname: '/admin/search', query: queryParams }, undefined, { shallow: true });
    fetchMovies(query, newPage);
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePageSizeChange = (e: ChangeEvent<HTMLSelectElement>): void => {
    const newPageSize = parseInt(e.target.value, 10);
    setPageSize(newPageSize);
    setPage(1);
    fetchMovies(query, 1);
  };

  useEffect(() => {
    if (router.isReady) {
      const urlQuery = (router.query.q as string) || '';
      const urlCategory = (router.query.category as string) || '';
      const urlCountry = (router.query.country as string) || '';
      const urlYear = (router.query.year as string) || '';
      const urlDuration = (router.query.duration as string) || '';
      const urlPage = parseInt((router.query.page as string) || '1', 10) || 1;

      if (urlQuery !== query) setQuery(urlQuery);

      const shouldUpdate =
        urlCategory !== filters.category ||
        urlCountry !== filters.country ||
        urlYear !== filters.year ||
        urlDuration !== filters.duration;
      if (shouldUpdate) {
        setFilters({ category: urlCategory, country: urlCountry, year: urlYear, duration: urlDuration });
      }
      if (urlPage !== page) setPage(urlPage);

      const hasSearch = urlQuery || urlCategory || urlCountry || urlYear || urlDuration;
      if (hasSearch || !initialLoad) fetchMovies(urlQuery, urlPage);
    }
  }, [router.isReady, router.query]);

  const highlightSearchTerms = (text: string, searchQuery: string): string => {
    if (!searchQuery || !text) return text;
    const escaped = searchQuery.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    return text.replace(new RegExp(`(${escaped})`, 'gi'), '<span class="highlight-match">$1</span>');
  };

  const getPageNumbers = (): Array<number | string> => {
    const result: Array<number | string> = [];
    const maxPageButtons = 5;
    if (totalPages <= maxPageButtons) {
      for (let i = 1; i <= totalPages; i++) result.push(i);
    } else {
      result.push(1);
      let startPage = Math.max(2, page - Math.floor(maxPageButtons / 2));
      let endPage = Math.min(totalPages - 1, startPage + maxPageButtons - 3);
      if (endPage - startPage < maxPageButtons - 3) startPage = Math.max(2, endPage - (maxPageButtons - 3));
      if (startPage > 2) result.push('...');
      for (let i = startPage; i <= endPage; i++) result.push(i);
      if (endPage < totalPages - 1) result.push('...');
      result.push(totalPages);
    }
    return result;
  };

  const handleSelectMovie = (movieId: string): void => {
    setSelectedMovies((prev) => (prev.includes(movieId) ? prev.filter((id) => id !== movieId) : [...prev, movieId]));
  };

  const handleSelectAll = (): void => {
    if (selectAll) setSelectedMovies([]);
    else setSelectedMovies(movies.map((m) => m.uniqueId || m.id || m._id || '').filter(Boolean));
    setSelectAll(!selectAll);
  };

  const handleDeleteSelected = async (): Promise<void> => {
    if (selectedMovies.length === 0) {
      await Swal.fire({ title: 'Lỗi', text: 'Vui lòng chọn ít nhất một phim để xóa', icon: 'error', confirmButtonColor: '#dc3545' });
      return;
    }
    const result = await Swal.fire({
      title: 'Xác nhận xóa',
      text: `Bạn có chắc chắn muốn xóa ${selectedMovies.length} phim đã chọn?`,
      icon: 'warning', showCancelButton: true,
      confirmButtonColor: '#dc3545', cancelButtonColor: '#6c757d',
      confirmButtonText: 'Xóa', cancelButtonText: 'Hủy'
    });
    if (result.isConfirmed) {
      try {
        await Swal.fire({ title: 'Đã xóa!', text: `Đã xóa ${selectedMovies.length} phim thành công`, icon: 'success', confirmButtonColor: '#28a745' });
        fetchMovies(query, page);
      } catch (err) {

        await Swal.fire({ title: 'Lỗi', text: 'Đã xảy ra lỗi khi xóa phim', icon: 'error', confirmButtonColor: '#dc3545' });
      }
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: globalThis.MouseEvent): void => {
      if (
        suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node) &&
        searchInputRef.current && !searchInputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!isAuthenticated || !isAdmin) return null;

  return (
    <AdminLayout>
      <div className="admin-search-page">
        <div className="container-fluid py-4">
          <div className="row mb-4">
            <div className="col">
              <h2 className="mb-3">Quản lý phim</h2>
              <form onSubmit={handleSearch} className="mb-4">
                <div className="input-group">
                  <input
                    type="text" className="form-control" placeholder="Tìm kiếm phim..."
                    value={query} onChange={handleSearchInputChange}
                    autoComplete="off" ref={searchInputRef}
                  />
                  <button type="submit" className="btn btn-primary" disabled={loading}>
                    {loading ? <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" /> : <i className="fas fa-search me-2" />}
                    Tìm kiếm
                  </button>
                </div>
                {showSuggestions && searchSuggestions.length > 0 && (
                  <div className="search-suggestions bg-white border p-3 rounded" ref={suggestionsRef}>
                    <ul className="list-unstyled mb-0">
                      {searchSuggestions.map((s, i) => (
                        <li key={i} className="suggestion-item py-2 px-3 rounded mb-2 cursor-pointer hover-bg-light" onClick={() => handleSuggestionClick(s)}>{s}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </form>

              <div className="row mb-4">
                <div className="col-md-3 mb-3">
                  <select className="form-select" value={filters.category} onChange={(e) => handleFilterChange('category', e.target.value)}>
                    <option value="">Tất cả thể loại</option>
                    {categories.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="col-md-3 mb-3">
                  <select className="form-select" value={filters.country} onChange={(e) => handleFilterChange('country', e.target.value)}>
                    <option value="">Tất cả quốc gia</option>
                    {countries.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="col-md-3 mb-3">
                  <select className="form-select" value={filters.year} onChange={(e) => handleFilterChange('year', e.target.value)}>
                    <option value="">Tất cả năm</option>
                    {years.map((y) => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
                <div className="col-md-3 mb-3">
                  <select className="form-select" value={filters.duration} onChange={(e) => handleFilterChange('duration', e.target.value)}>
                    <option value="">Tất cả độ dài</option>
                    {durations.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
                  </select>
                </div>
              </div>

              {(filters.category || filters.country || filters.year || filters.duration) && (
                <div className="mb-4">
                  <div className="d-flex flex-wrap gap-2 align-items-center">
                    <span className="text-muted">Bộ lọc đang áp dụng:</span>
                    {filters.category && (
                      <span className="badge bg-primary p-2">Thể loại: {filters.category}
                        <button className="btn btn-sm ms-2 p-0 text-white" onClick={() => handleFilterChange('category', '')}><i className="fas fa-times" /></button>
                      </span>
                    )}
                    {filters.country && (
                      <span className="badge bg-primary p-2">Quốc gia: {filters.country}
                        <button className="btn btn-sm ms-2 p-0 text-white" onClick={() => handleFilterChange('country', '')}><i className="fas fa-times" /></button>
                      </span>
                    )}
                    {filters.year && (
                      <span className="badge bg-primary p-2">Năm: {filters.year}
                        <button className="btn btn-sm ms-2 p-0 text-white" onClick={() => handleFilterChange('year', '')}><i className="fas fa-times" /></button>
                      </span>
                    )}
                    {filters.duration && (
                      <span className="badge bg-primary p-2">Độ dài: {durations.find((d) => d.value === filters.duration)?.label || filters.duration}
                        <button className="btn btn-sm ms-2 p-0 text-white" onClick={() => handleFilterChange('duration', '')}><i className="fas fa-times" /></button>
                      </span>
                    )}
                    <button className="btn btn-sm btn-outline-secondary" onClick={() => { setFilters({ category: '', country: '', year: '', duration: '' }); fetchMovies(query, 1); }}>
                      Xóa tất cả
                    </button>
                  </div>
                </div>
              )}

              <div className="d-flex justify-content-between align-items-center mb-3">
                <div>
                  <button className="btn btn-success me-2" onClick={() => router.push('/admin/movies/add')}>
                    <i className="fas fa-plus me-2" />Thêm phim mới
                  </button>
                  <button className="btn btn-danger" onClick={handleDeleteSelected} disabled={selectedMovies.length === 0}>
                    <i className="fas fa-trash me-2" />Xóa phim đã chọn ({selectedMovies.length})
                  </button>
                </div>
                <div className="d-flex align-items-center">
                  <span className="me-2">Hiển thị:</span>
                  <select className="form-select form-select-sm" style={{ width: '80px' }} value={pageSize} onChange={handlePageSizeChange}>
                    <option value="10">10</option><option value="20">20</option><option value="50">50</option><option value="100">100</option>
                  </select>
                </div>
              </div>

              {loading ? (
                <div className="text-center py-5"><div className="spinner-border text-primary" role="status"><span className="visually-hidden">Đang tìm kiếm...</span></div></div>
              ) : (
                <>
                  {error && <div className="alert alert-danger">{error}</div>}
                  {!loading && movies.length === 0 && <div className="alert alert-warning">Không tìm thấy phim phù hợp với tiêu chí tìm kiếm</div>}

                  {movies.length > 0 && (
                    <>
                      <div className="mb-3 text-muted">
                        {query && <span>Kết quả tìm kiếm cho "{query}": </span>}
                        Tìm thấy {totalMovies} kết quả
                      </div>
                      <div className="table-responsive">
                        <table className="table table-hover">
                          <thead>
                            <tr>
                              <th><div className="form-check"><input className="form-check-input" type="checkbox" checked={selectAll} onChange={handleSelectAll} /></div></th>
                              <th style={{ width: '80px' }}>Hình ảnh</th>
                              <th>Tên phim</th>
                              <th>Thể loại</th>
                              <th>Quốc gia</th>
                              <th>Năm</th>
                              <th>Lượt xem</th>
                              <th>Tác vụ</th>
                            </tr>
                          </thead>
                          <tbody>
                            {movies.map((m) => {
                              const id = m.uniqueId || m.id || m._id || '';
                              return (
                                <tr key={id}>
                                  <td><div className="form-check"><input className="form-check-input" type="checkbox" checked={selectedMovies.includes(id)} onChange={() => handleSelectMovie(id)} /></div></td>
                                  <td><img src={m.thumb_url || m.poster_url || '/img/Phim.png'} alt={m.name} className="img-thumbnail" style={{ width: '60px', height: '80px', objectFit: 'cover' }} /></td>
                                  <td>
                                    <div dangerouslySetInnerHTML={{ __html: query ? highlightSearchTerms(m.name || '', query) : (m.name || '') }} />
                                    <small className="text-muted d-block">{m.origin_name}</small>
                                  </td>
                                  <td>{getTaxonomyList(m.category)}</td>
                                  <td>{getTaxonomyList(m.country)}</td>
                                  <td>{formatYear(m.year)}</td>
                                  <td>{m.view_total || 0}</td>
                                  <td>
                                    <Link href={`/admin/movies/edit/${m.slug}`} className="btn btn-sm btn-primary me-2"><i className="fas fa-edit" /></Link>
                                    <Link href={`/movie/${m.slug}`} target="_blank" className="btn btn-sm btn-info me-2"><i className="fas fa-eye" /></Link>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>

                      {totalPages > 1 && (
                        <div className="pagination-container text-center mt-4">
                          <nav aria-label="Page navigation">
                            <ul className="pagination justify-content-center">
                              <li className={`page-item ${page <= 1 ? 'disabled' : ''}`}>
                                <button className="page-link" onClick={() => handlePageChange(page - 1)} disabled={page <= 1}>&laquo; Trước</button>
                              </li>
                              {getPageNumbers().map((n, i) => (
                                <li key={i} className={`page-item ${n === page ? 'active' : ''} ${n === '...' ? 'disabled' : ''}`}>
                                  {n === '...' ? <span className="page-link">...</span> : <button className="page-link" onClick={() => handlePageChange(Number(n))}>{n}</button>}
                                </li>
                              ))}
                              <li className={`page-item ${page >= totalPages ? 'disabled' : ''}`}>
                                <button className="page-link" onClick={() => handlePageChange(page + 1)} disabled={page >= totalPages}>Sau &raquo;</button>
                              </li>
                            </ul>
                          </nav>
                        </div>
                      )}
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .search-suggestions { position: absolute; z-index: 1000; width: calc(100% - 128px); max-height: 300px; overflow-y: auto; box-shadow: 0 5px 15px rgba(0,0,0,0.1); margin-top: -1rem; }
        .suggestion-item { transition: all 0.2s ease; cursor: pointer; border-left: 3px solid transparent; }
        .suggestion-item:hover { background-color: #f8f9fa; border-left: 3px solid #0d6efd; padding-left: 10px; }
        .cursor-pointer { cursor: pointer; }
        .hover-bg-light:hover { background-color: #f8f9fa; }
        .highlight-match { color: #0d6efd; font-weight: bold; background-color: rgba(13,110,253,0.1); padding: 0 2px; border-radius: 2px; }
      `}</style>
    </AdminLayout>
  );
}

AdminSearchPage.getLayout = (page: ReactElement): ReactElement => page;
