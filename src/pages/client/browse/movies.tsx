/**
 * The listing page of the single movies, with category, country and
 * year filters plus a sort option.
 */
import React, { useState, useEffect, MouseEvent } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Skeleton from '@/features/shared/components/UI/Skeleton';
import { FaPlayCircle, FaStar, FaClock, FaChevronDown, FaSync } from 'react-icons/fa';
import { pickMovieImage } from '@/utils/imageSource';
import { getApiBaseUrl } from '@/config/apiBase';
import styles from '@/styles/Movies.module.css';
import { apiUrl } from '@/config/apiPaths';
import authService from '@/API/services/authService';

const CATEGORIES = [
  'Hành Động','Tình Cảm','Hài Hước','Cổ Trang','Tâm Lý','Hình Sự',
  'Chiến Tranh','Thể Thao','Võ Thuật','Viễn Tưởng','Phiêu Lưu',
  'Khoa Học','Kinh Dị','Âm Nhạc','Thần Thoại','Hoạt Hình'
];

const COUNTRIES = [
  'Trung Quốc','Hàn Quốc','Nhật Bản','Thái Lan','Âu Mỹ',
  'Đài Loan','Hồng Kông','Ấn Độ','Việt Nam'
];

type SortOption = 'newest' | 'oldest' | 'a-z' | 'z-a' | 'highest-rating' | 'lowest-rating' | 'year-desc' | 'year-asc';

interface MovieItem {
  slug?: string;
  _id?: string;
  id?: string;
  name?: string;
  origin_name?: string;
  thumb_url?: string;
  poster_url?: string;
  year?: number;
  quality?: string;
  lang?: string;
  rating?: number;
  time?: string;
  modified?: { time?: string | number };
  created_at?: string | number;
  [key: string]: unknown;
}

interface SearchResponse {
  hits?: MovieItem[];
  total?: number;
}

const getSortLabel = (opt: SortOption): string => {
  switch (opt) {
    case 'a-z': return 'A-Z';
    case 'z-a': return 'Z-A';
    case 'highest-rating': return 'Đánh giá cao nhất';
    case 'lowest-rating': return 'Đánh giá thấp nhất';
    case 'newest': return 'Mới nhất';
    case 'oldest': return 'Cũ nhất';
    case 'year-desc': return 'Năm mới nhất';
    case 'year-asc': return 'Năm cũ nhất';
  }
};

const sortMovies = (list: MovieItem[], opt: SortOption): MovieItem[] => {
  const copy = [...list];
  switch (opt) {
    case 'a-z': return copy.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    case 'z-a': return copy.sort((a, b) => (b.name || '').localeCompare(a.name || ''));
    case 'highest-rating': return copy.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    case 'lowest-rating': return copy.sort((a, b) => (a.rating || 0) - (b.rating || 0));
    case 'newest': return copy.sort((a, b) => {
      const aT = typeof a.modified === 'string' ? a.modified : (typeof a.modified === 'object' && a.modified !== null ? (a.modified as Record<string, unknown>).time : undefined) || a.created_at || 0;
      const bT = typeof b.modified === 'string' ? b.modified : (typeof b.modified === 'object' && b.modified !== null ? (b.modified as Record<string, unknown>).time : undefined) || b.created_at || 0;
      return new Date(String(bT)).getTime() - new Date(String(aT)).getTime();
    });
    case 'oldest': return copy.sort((a, b) => {
      const aT = typeof a.modified === 'string' ? a.modified : (typeof a.modified === 'object' && a.modified !== null ? (a.modified as Record<string, unknown>).time : undefined) || a.created_at || 0;
      const bT = typeof b.modified === 'string' ? b.modified : (typeof b.modified === 'object' && b.modified !== null ? (b.modified as Record<string, unknown>).time : undefined) || b.created_at || 0;
      return new Date(String(aT)).getTime() - new Date(String(bT)).getTime();
    });
    case 'year-desc': return copy.sort((a, b) => (b.year || 0) - (a.year || 0));
    case 'year-asc': return copy.sort((a, b) => (a.year || 0) - (b.year || 0));
    default: return copy;
  }
};

export default function Movies() {
  const router = useRouter();
  const [movies, setMovies] = useState<MovieItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [page, setPage] = useState<number>(1);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [loadedImages, setLoadedImages] = useState<Record<string, boolean>>({});
  const [totalMovies, setTotalMovies] = useState<number>(0);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // Read the initial filters from the URL so each "See all" deep link
  // opens the right slice. The defaults below preserve the previous
  // single-movie view for any direct visitor to /browse/movies without
  // query params.
  const [filters, setFilters] = useState<{ category: string; country: string; year: string; type: string }>({ category: '', country: '', year: '', type: 'single' });
  const [showCategoryDropdown, setShowCategoryDropdown] = useState<boolean>(false);
  const [showCountryDropdown, setShowCountryDropdown] = useState<boolean>(false);
  const [showYearDropdown, setShowYearDropdown] = useState<boolean>(false);
  const [sortOption, setSortOption] = useState<SortOption>('newest');
  const [showSortOptions, setShowSortOptions] = useState<boolean>(false);

  // Apply query params exactly once when the router becomes ready.
  // We use `router.isReady` so SSR + client hydration stay consistent
  // and `router.query` is populated.
  useEffect(() => {
    if (!router.isReady) return;
    const { type, sort, category, country, year } = router.query;
    setFilters((prev) => ({
      ...prev,
      type: typeof type === 'string' && type ? type : prev.type,
      category: typeof category === 'string' ? category : prev.category,
      country: typeof country === 'string' ? country : prev.country,
      year: typeof year === 'string' ? year : prev.year
    }));
    if (typeof sort === 'string' && sort) {
      const allowed: SortOption[] = ['newest','oldest','a-z','z-a','highest-rating','lowest-rating','year-desc','year-asc'];
      if (allowed.includes(sort as SortOption)) {
        setSortOption(sort as SortOption);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router.isReady]);

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: currentYear - 2005 }, (_, i) => currentYear - i);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent): void => {
      const target = e.target as Element;
      let outside = true;
      document.querySelectorAll('.dropdown-toggle').forEach((t) => { if (t.contains(target)) outside = false; });
      document.querySelectorAll('.dropdown-menu').forEach((m) => { if (m.contains(target)) outside = false; });
      if (outside) {
        setShowCategoryDropdown(false);
        setShowCountryDropdown(false);
        setShowYearDropdown(false);
        setShowSortOptions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside as unknown as EventListener);
    return () => document.removeEventListener('mousedown', handleClickOutside as unknown as EventListener);
  }, []);

  useEffect(() => { fetchMovies(1, false); }, [filters.type, filters.category, filters.country, filters.year, sortOption]);

  const fetchMovies = async (pageNumber: number, isLoadMore = false): Promise<void> => {
    try {
      setLoading(true);
      if (refreshing || (pageNumber === 1 && !isLoadMore)) setMovies([]);

      const baseUrl = getApiBaseUrl();
      const params = new URLSearchParams();
      params.append('q', '');
      params.append('page', String(pageNumber));
      params.append('size', '24');
      // `type=all` means "no type filter". The "See all" section links
      // send this to mean "all movies, both single and series".
      // The backend's /search endpoint treats a missing or empty `type`
      // as "no type constraint", so we just skip the param.
      if (filters.type && filters.type !== 'all') params.append('type', filters.type);
      if (filters.category) params.append('category', filters.category);
      if (filters.country) params.append('country', filters.country);
      if (filters.year) params.append('year', filters.year);
      if (sortOption) params.append('sort', sortOption);

      // The search endpoint needs the Bearer token, so the header is
      // resolved through the shared auth service (it also refreshes an
      // expiring token and restores the session).
      const headers = await authService.getAuthHeader();
      const response = await fetch(apiUrl(`moviesSearch`) + `?${params.toString()}`, { headers });
      const result = (await response.json()) as SearchResponse;

      if (result?.hits && Array.isArray(result.hits)) {
        // The v1 API returns images as camelCase `posterUrl`/`thumbUrl`,
        // but this page renders `poster_url`/`thumb_url`. Resolve both
        // casings here — otherwise every card fell back to a placeholder
        // because `m.poster_url` was `undefined`.
        const processed = result.hits.map((m) => {
          const poster = pickMovieImage(m as Record<string, unknown>, 'poster', '');
          const thumb = pickMovieImage(m as Record<string, unknown>, 'thumb', '');
          return {
            ...m,
            poster_url: poster || thumb || '/img/Phim.png',
            thumb_url: thumb || poster || '/img/Phim.png'
          };
        });

        const seenSlugs = new Set<string>();
        const seenIds = new Set<string>();
        const unique: MovieItem[] = [];
        processed.forEach((m) => {
          const compositeId = !m.slug && !m._id && !m.id ? `${m.name}-${m.year || ''}-${m.origin_name || ''}` : null;
          if (
            (m.slug && seenSlugs.has(m.slug)) ||
            (m._id && seenIds.has(m._id)) ||
            (m.id && seenIds.has(m.id!)) ||
            (compositeId && seenIds.has(compositeId))
          ) return;
          if (m.slug) seenSlugs.add(m.slug);
          if (m._id) seenIds.add(m._id);
          if (m.id) seenIds.add(m.id!);
          if (compositeId) seenIds.add(compositeId);
          unique.push(m);
        });

        const sorted = sortMovies(unique, sortOption);

        if (pageNumber === 1 || !isLoadMore || refreshing) {
          setMovies(sorted);
        } else {
          const existingIds = new Set<string>();
          movies.forEach((m) => {
            if (m._id) existingIds.add(m._id);
            if (m.id) existingIds.add(m.id!);
            if (m.slug) existingIds.add(m.slug!);
          });
          const merged = sorted.filter((m) =>
            !(m._id && existingIds.has(m._id)) &&
            !(m.id && existingIds.has(m.id!)) &&
            !(m.slug && existingIds.has(m.slug!))
          );
          setMovies((prev) => [...prev, ...merged]);
        }

        const totalItems = result.total || 0;
        const totalPagesCount = Math.ceil(totalItems / 24);
        setTotalMovies(totalItems);
        setHasMore(pageNumber < totalPagesCount);
        setPage(pageNumber);
      } else {
        if (pageNumber === 1 || refreshing) setMovies([]);
        setHasMore(false);
        setTotalMovies(0);
      }
    } catch (err) {

      if (pageNumber === 1 || refreshing) setMovies([]);
      setHasMore(false);
      setTotalMovies(0);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadMore = (): void => {
    if (!loading && hasMore) {
      setLoading(true);
      const nextPage = page + 1;
      setTimeout(() => fetchMovies(nextPage, true), 50);
    }
  };

  const handleImageLoad = (imageId: string): void =>
    setLoadedImages((prev) => ({ ...prev, [imageId]: true }));

  const handleRefresh = (): void => {
    setRefreshing(true);
    setPage(1);
    fetchMovies(1, false);
  };

  const toggleDropdown = (type: 'category' | 'country' | 'year' | 'sort', e: MouseEvent): void => {
    e.stopPropagation();
    setShowCategoryDropdown(type === 'category' ? !showCategoryDropdown : false);
    setShowCountryDropdown(type === 'country' ? !showCountryDropdown : false);
    setShowYearDropdown(type === 'year' ? !showYearDropdown : false);
    setShowSortOptions(type === 'sort' ? !showSortOptions : false);
  };

  const selectFilter = (key: keyof typeof filters, value: string): void => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    if (key === 'category') setShowCategoryDropdown(false);
    if (key === 'country') setShowCountryDropdown(false);
    if (key === 'year') setShowYearDropdown(false);
  };

  const applyFilters = (): void => {
    setLoading(true);
    setPage(1);
    fetchMovies(1, false);
  };

  const clearAllFilters = (): void => {
    // Keep the deep-link `type` so the user stays on the right
    // section (for example "All movies" or "Single movies") and only
    // clear category, country and year.
    setFilters((prev) => ({ category: '', country: '', year: '', type: prev.type }));
    setTimeout(() => { setLoading(true); fetchMovies(1, false); }, 0);
  };

  // The title shown to the user depends on which deep link sent them
  // here. The default ("Single movies") is preserved for direct visitors to
  // /browse/movies without query params.
  const pageTitle = filters.type === 'all'
    ? 'Tất cả phim'
    : filters.type === 'series'
      ? 'Phim Bộ'
      : 'Phim Lẻ';
  const pageDescription = filters.type === 'all'
    ? 'Tổng hợp tất cả phim, cập nhật liên tục'
    : filters.type === 'series'
      ? 'Tổng hợp phim bộ hay nhất, cập nhật nhanh nhất'
      : 'Tổng hợp các bộ phim lẻ, phim chiếu rạp hay nhất, cập nhật nhanh nhất';

  return (
    <>
      <Head>
        <title>{pageTitle} | Movie Streaming</title>
        <meta name="description" content={`Xem ${pageDescription.toLowerCase()} trên Movie Streaming`} />
      </Head>

      <div className={styles.container}>
        <div className="container py-5 mt-5">
          <div className="row mb-4">
            <div className="col-12">
              <h1 className="text-white">{pageTitle}</h1>
              <p className="text-secondary">
                {pageDescription}
                {totalMovies > 0 && ` (${totalMovies} phim)`}
              </p>
            </div>
          </div>

          <div className="row mb-4">
            <div className="col-12 d-flex flex-wrap gap-3 align-items-center">
              <div className="dropdown">
                <button
                  className={`btn ${filters.category ? 'btn-danger' : 'btn-outline-secondary'} dropdown-toggle d-flex align-items-center`}
                  onClick={(e) => toggleDropdown('category', e)}
                  type="button"
                >
                  {filters.category || 'Thể loại'} <FaChevronDown className="ms-2" />
                </button>
                {showCategoryDropdown && (
                  <ul className="dropdown-menu show dropdown-menu-dark">
                    <li><button className={`dropdown-item ${!filters.category ? 'active' : ''}`} onClick={() => selectFilter('category', '')} type="button">Tất cả thể loại</button></li>
                    {CATEGORIES.map((c) => (
                      <li key={c}><button className={`dropdown-item ${filters.category === c ? 'active' : ''}`} onClick={() => selectFilter('category', c)} type="button">{c}</button></li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="dropdown">
                <button
                  className={`btn ${filters.country ? 'btn-danger' : 'btn-outline-secondary'} dropdown-toggle d-flex align-items-center`}
                  onClick={(e) => toggleDropdown('country', e)}
                  type="button"
                >
                  {filters.country || 'Quốc gia'} <FaChevronDown className="ms-2" />
                </button>
                {showCountryDropdown && (
                  <ul className="dropdown-menu show dropdown-menu-dark">
                    <li><button className={`dropdown-item ${!filters.country ? 'active' : ''}`} onClick={() => selectFilter('country', '')} type="button">Tất cả quốc gia</button></li>
                    {COUNTRIES.map((c) => (
                      <li key={c}><button className={`dropdown-item ${filters.country === c ? 'active' : ''}`} onClick={() => selectFilter('country', c)} type="button">{c}</button></li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="dropdown">
                <button
                  className={`btn ${filters.year ? 'btn-danger' : 'btn-outline-secondary'} dropdown-toggle d-flex align-items-center`}
                  onClick={(e) => toggleDropdown('year', e)}
                  type="button"
                >
                  {filters.year || 'Năm'} <FaChevronDown className="ms-2" />
                </button>
                {showYearDropdown && (
                  <ul className="dropdown-menu show dropdown-menu-dark">
                    <li><button className={`dropdown-item ${!filters.year ? 'active' : ''}`} onClick={() => selectFilter('year', '')} type="button">Tất cả năm</button></li>
                    {years.map((y) => (
                      <li key={y}><button className={`dropdown-item ${filters.year === String(y) ? 'active' : ''}`} onClick={() => selectFilter('year', String(y))} type="button">{y}</button></li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="dropdown">
                <button
                  className="btn btn-outline-secondary dropdown-toggle d-flex align-items-center"
                  onClick={(e) => toggleDropdown('sort', e)}
                  type="button"
                >
                  {getSortLabel(sortOption)} <FaChevronDown className="ms-2" />
                </button>
                {showSortOptions && (
                  <ul className="dropdown-menu show dropdown-menu-dark" style={{ minWidth: '200px' }}>
                    {(['newest','oldest','a-z','z-a','highest-rating','lowest-rating','year-desc','year-asc'] as SortOption[]).map((opt) => (
                      <li key={opt}>
                        <button className={`dropdown-item ${sortOption === opt ? 'active' : ''}`} onClick={() => { setSortOption(opt); setShowSortOptions(false); setLoading(true); fetchMovies(1, false); }} type="button">
                          {getSortLabel(opt)}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <button className="btn btn-danger d-flex align-items-center" onClick={applyFilters} disabled={loading} type="button">Áp dụng bộ lọc</button>
              <button className="btn btn-outline-light d-flex align-items-center ms-auto" onClick={handleRefresh} disabled={loading || refreshing} type="button">
                <FaSync className={`me-2 ${refreshing ? 'spin' : ''}`} />
                {refreshing ? 'Đang làm mới...' : 'Làm mới'}
              </button>
            </div>
          </div>

          {(filters.category || filters.country || filters.year) && (
            <div className="row mb-4">
              <div className="col-12">
                <div className="d-flex flex-wrap gap-2 align-items-center">
                  <span className="text-white me-2">Lọc theo:</span>
                  {filters.category && <span className="badge bg-danger p-2">Thể loại: {filters.category}</span>}
                  {filters.country && <span className="badge bg-danger p-2">Quốc gia: {filters.country}</span>}
                  {filters.year && <span className="badge bg-danger p-2">Năm: {filters.year}</span>}
                  <button className="btn btn-sm btn-outline-secondary" onClick={clearAllFilters} type="button">Xóa tất cả</button>
                </div>
              </div>
            </div>
          )}

          <div className="row row-cols-2 row-cols-sm-3 row-cols-md-3 row-cols-lg-4 row-cols-xl-5 row-cols-xxl-6 g-3 g-md-4 mb-4">
            {(loading && page === 1 && !refreshing) || refreshing ? (
              [...Array(24)].map((_, i) => (
                <div key={`skeleton-${i}`} className="col mb-4">
                  <div className="card h-100 bg-dark border-0">
                    <Skeleton height={300} borderRadius={8} />
                    <div className="card-body p-2">
                      <Skeleton height={18} width="85%" />
                      <div className="mt-1"><Skeleton height={14} width="65%" /></div>
                    </div>
                  </div>
                </div>
              ))
            ) : movies.length > 0 ? (
              movies.map((movie, index) => {
                const movieUniqueId = movie.slug || movie._id || movie.id || `movie-${index}-${movie.name}-${movie.year || ''}`;
                const imageId = `movie-${movieUniqueId}`;
                return (
                  <div key={movieUniqueId} className="col mb-4">
                    <div className={`card h-100 bg-dark border-0 ${styles.movieCard}`}>
                      <div className={`position-relative ${styles.moviePoster}`}>
                        <img
                          src={movie.thumb_url || movie.poster_url || '/img/Phim.png'}
                          className={`card-img-top ${styles.movieImage}`}
                          alt={movie.name}
                          loading="lazy"
                          style={{ height: '300px', objectFit: 'cover', borderRadius: '8px' }}
                          onLoad={() => handleImageLoad(imageId)}
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).src = '/img/Phim.png';
                            handleImageLoad(imageId);
                          }}
                        />
                        <div className={styles.overlay}>
                          <Link href={`/movie/${movie.slug}`} className={styles.playButton}>
                            <FaPlayCircle size={48} />
                          </Link>
                        </div>
                        <div className={styles.movieInfo}>
                          {movie.year && <span className="badge bg-danger me-1">{movie.year}</span>}
                          {movie.quality && <span className="badge bg-primary me-1">{movie.quality}</span>}
                          {movie.lang && <span className="badge bg-info">{movie.lang || 'Vietsub'}</span>}
                        </div>
                        {(movie.rating ?? 0) > 0 && (
                          <div className={styles.ratingBadge}>
                            <FaStar /> {movie.rating!.toFixed(1)}
                          </div>
                        )}
                        {movie.time && (
                          <div className={styles.durationBadge}>
                            <FaClock /> {movie.time}
                          </div>
                        )}
                      </div>
                      <div className="card-body py-0 px-1" style={{ backgroundColor: '#1a1a1a', minHeight: 'auto' }}>
                        <h6 className={`card-title text-white mb-0 ${styles.movieTitleEllipsis}`}>
                          <Link href={`/movie/${movie.slug}`} legacyBehavior>
                            <a className="text-decoration-none stretched-link" style={{ color: 'inherit' }}>
                              {movie.name}
                            </a>
                          </Link>
                        </h6>
                        {movie.origin_name && (
                          <p className="card-text small text-muted text-truncate mb-0" style={{ fontSize: '10px', lineHeight: 1, maxHeight: '14px' }} title={movie.origin_name}>
                            {movie.origin_name}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="col-12">
                <div className="text-center py-5">
                  <div className="mb-3"><FaPlayCircle size={60} className="text-secondary" /></div>
                  <h3 className="text-white">Không tìm thấy phim</h3>
                  <p className="text-secondary">
                    Không có phim lẻ nào phù hợp với bộ lọc hiện tại.
                  </p>
                  <button className="btn btn-outline-light mt-3" onClick={clearAllFilters} type="button">Xóa bộ lọc</button>
                </div>
              </div>
            )}
          </div>

          {!loading && hasMore && (
            <div className="text-center mt-4 mb-5">
              <button className="btn btn-outline-danger px-4 py-2" onClick={loadMore} disabled={loading} type="button">Xem thêm</button>
            </div>
          )}
          {loading && page > 1 && !refreshing && (
            <div className="text-center mt-4 mb-5">
              <div className="spinner-border text-danger" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="text-secondary mt-2">Đang tải thêm phim...</p>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .dropdown-menu { background-color: #212529; color: white; border: 1px solid rgba(255,255,255,0.15); max-height: 300px; overflow-y: auto; }
        .dropdown-item { color: rgba(255,255,255,0.8); }
        .dropdown-item:hover { background-color: rgba(255,255,255,0.1); color: white; }
        .dropdown-item.active, .dropdown-item:active { background-color: #dc3545; color: white; }
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        .ms-auto { margin-left: auto !important; }
      `}</style>
    </>
  );
}
