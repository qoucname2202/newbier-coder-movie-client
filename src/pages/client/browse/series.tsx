/**
 * @file pages/browse/series.tsx
 */
import React, { useState, useEffect, MouseEvent } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Skeleton from '@/features/shared/components/UI/Skeleton';
import type { SkeletonProps } from '@/features/shared/components/UI/Skeleton';
import { FaPlayCircle, FaStar, FaFilm, FaChevronDown, FaSync } from 'react-icons/fa';
import { pickMovieImage, normalizeImageUrl } from '@/utils/imageSource';
import { getApiBaseUrl } from '@/config/apiBase';
import styles from '@/styles/Movies.module.css';
import { apiUrl } from '@/config/apiPaths';

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

interface SeriesModified {
  time?: string | number;
  [key: string]: unknown;
}

interface SeriesMovie {
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
  modified?: SeriesModified;
  created_at?: string | number;
  episodes?: Array<{ server_data?: Array<{ length?: number }> }>;
  [key: string]: unknown;
}

interface Pagination {
  currentPage?: number;
  totalPages?: number;
  totalItems?: number;
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

const sortSeries = (list: SeriesMovie[], opt: SortOption): SeriesMovie[] => {
  const copy = [...list];
  switch (opt) {
    case 'a-z': return copy.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    case 'z-a': return copy.sort((a, b) => (b.name || '').localeCompare(a.name || ''));
    case 'highest-rating': return copy.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    case 'lowest-rating': return copy.sort((a, b) => (a.rating || 0) - (b.rating || 0));
    case 'newest': return copy.sort((a, b) => {
      const aT = a.modified?.time || a.modified || a.created_at || 0;
      const bT = b.modified?.time || b.modified || b.created_at || 0;
      return new Date(bT as string).getTime() - new Date(aT as string).getTime();
    });
    case 'oldest': return copy.sort((a, b) => {
      const aT = a.modified?.time || a.modified || a.created_at || 0;
      const bT = b.modified?.time || b.modified || b.created_at || 0;
      return new Date(aT as string).getTime() - new Date(bT as string).getTime();
    });
    case 'year-desc': return copy.sort((a, b) => (b.year || 0) - (a.year || 0));
    case 'year-asc': return copy.sort((a, b) => (a.year || 0) - (b.year || 0));
    default: return copy;
  }
};

export default function Series() {
  const [series, setSeries] = useState<SeriesMovie[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [page, setPage] = useState<number>(1);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [loadedImages, setLoadedImages] = useState<Record<string, boolean>>({});
  const [totalSeries, setTotalSeries] = useState<number>(0);

  const [filters, setFilters] = useState({ category: '', country: '', year: '', type: 'series' });
  const [showCategoryDropdown, setShowCategoryDropdown] = useState<boolean>(false);
  const [showCountryDropdown, setShowCountryDropdown] = useState<boolean>(false);
  const [showYearDropdown, setShowYearDropdown] = useState<boolean>(false);
  const [sortOption, setSortOption] = useState<SortOption>('newest');
  const [showSortOptions, setShowSortOptions] = useState<boolean>(false);

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: currentYear - 2005 }, (_, i) => currentYear - i);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent): void => {
      const target = e.target as Element;
      const toggles = document.querySelectorAll('.dropdown-toggle');
      const menus = document.querySelectorAll('.dropdown-menu');
      let outside = true;
      toggles.forEach((t) => { if (t.contains(target)) outside = false; });
      menus.forEach((m) => { if (m.contains(target)) outside = false; });
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

  useEffect(() => { fetchSeries(1); }, []);

  const fetchSeries = async (pageNum: number): Promise<void> => {
    try {
      setLoading(true);
      let queryParams = `page=${pageNum}&limit=24&type=series`;
      (Object.keys(filters) as Array<keyof typeof filters>).forEach((k) => {
        if (filters[k]) queryParams += `&${k}=${filters[k]}`;
      });

      const baseUrl = getApiBaseUrl();
      const response = await fetch(apiUrl(`moviesList`) + `?${queryParams}`);
      const result = (await response.json()) as { data?: { movies?: SeriesMovie[]; pagination?: Pagination } };

      if (result.data?.movies) {
        const { movies: newSeries, pagination } = result.data;
        // The old code here was
        //   thumb_url: s.thumb_url?.startsWith('http') ? s.thumb_url : `${s.thumb_url}`
        // which turned a missing field into the literal string "undefined"
        // and shipped it straight into `<img src>`. Resolve both the
        // snake_case and camelCase image fields first, and only fall back
        // when neither exists.
        const processed = newSeries.map((s) => {
          const raw = s as Record<string, unknown>;
          const poster = normalizeImageUrl(pickMovieImage(raw, 'poster', ''));
          const thumb = normalizeImageUrl(pickMovieImage(raw, 'thumb', ''));
          return {
            ...s,
            poster_url: poster || thumb || '/img/Phim.png',
            thumb_url: thumb || poster || '/img/Phim.png'
          };
        });

        const seenSlugs = new Set<string>();
        const seenIds = new Set<string>();
        const unique: SeriesMovie[] = [];
        processed.forEach((s) => {
          const compositeId = !s.slug && !s._id && !s.id ? `${s.name}-${s.year || ''}-${s.origin_name || ''}` : null;
          if (
            (s.slug && seenSlugs.has(s.slug)) ||
            (s._id && seenIds.has(s._id)) ||
            (s.id && seenIds.has(s.id!)) ||
            (compositeId && seenIds.has(compositeId))
          ) return;
          if (s.slug) seenSlugs.add(s.slug);
          if (s._id) seenIds.add(s._id);
          if (s.id) seenIds.add(s.id!);
          if (compositeId) seenIds.add(compositeId);
          unique.push(s);
        });

        const sorted = sortSeries(unique, sortOption);
        if (pageNum === 1) setSeries(sorted);
        else {
          const existingIds = new Set<string>();
          series.forEach((s) => {
            if (s._id) existingIds.add(s._id);
            if (s.id) existingIds.add(s.id!);
            if (s.slug) existingIds.add(s.slug!);
          });
          const merged = sorted.filter((s) =>
            !(s._id && existingIds.has(s._id)) &&
            !(s.id && existingIds.has(s.id!)) &&
            !(s.slug && existingIds.has(s.slug!))
          );
          setSeries((prev) => [...prev, ...merged]);
        }

        setTotalSeries(pagination?.totalItems || 0);
        setHasMore((pagination?.currentPage || 1) < (pagination?.totalPages || 1));
      } else {
        if (pageNum === 1) setSeries([]);
        setHasMore(false);
      }
    } catch (err) {

      if (pageNum === 1) setSeries([]);
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  };

  const loadMore = (): void => {
    if (!loading && hasMore) {
      setLoading(true);
      const nextPage = page + 1;
      setPage(nextPage);
      setTimeout(() => fetchSeries(nextPage), 50);
    }
  };

  const applyFilters = (): void => { setLoading(true); setPage(1); fetchSeries(1); };

  const handleImageLoad = (imageId: string): void =>
    setLoadedImages((prev) => ({ ...prev, [imageId]: true }));

  const handleImageError = (e: MouseEvent<HTMLImageElement>): void => {
    (e.currentTarget as HTMLImageElement).src = '/img/Phim.png';
    const id = (e.currentTarget as HTMLImageElement).dataset.id;
    if (id) handleImageLoad(id);
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

  const clearAllFilters = (): void => {
    setFilters({ category: '', country: '', year: '', type: 'series' });
    setTimeout(() => { setLoading(true); fetchSeries(1); }, 0);
  };

  return (
    <>
      <Head>
        <title>Phim Bộ | Movie Streaming</title>
        <meta name="description" content="Xem phim bộ hay nhất và mới nhất trên Movie Streaming" />
      </Head>

      <div className={styles.container}>
        <div className="container py-5 mt-5">
          <div className="row mb-4">
            <div className="col-12">
              <h1 className="text-white">Phim Bộ</h1>
              <p className="text-secondary">
                Tổng hợp các bộ phim truyền hình, phim bộ hay nhất, cập nhật nhanh nhất
                {totalSeries > 0 && ` (${totalSeries} phim)`}
              </p>
            </div>
          </div>

          <div className="row mb-4">
            <div className="col-12 d-flex flex-wrap gap-3">
              {/* Category */}
              <div className="dropdown">
                <button
                  className={`btn ${filters.category ? 'btn-danger' : 'btn-outline-secondary'} dropdown-toggle d-flex align-items-center rounded-pill`}
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

              {/* Country */}
              <div className="dropdown">
                <button
                  className={`btn ${filters.country ? 'btn-danger' : 'btn-outline-secondary'} dropdown-toggle d-flex align-items-center rounded-pill`}
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

              {/* Year */}
              <div className="dropdown">
                <button
                  className={`btn ${filters.year ? 'btn-danger' : 'btn-outline-secondary'} dropdown-toggle d-flex align-items-center rounded-pill`}
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

              {/* Sort */}
              <div className="dropdown">
                <button
                  className="btn btn-outline-secondary dropdown-toggle d-flex align-items-center rounded-pill"
                  onClick={(e) => toggleDropdown('sort', e)}
                  type="button"
                >
                  {getSortLabel(sortOption)} <FaChevronDown className="ms-2" />
                </button>
                {showSortOptions && (
                  <ul className="dropdown-menu show dropdown-menu-dark" style={{ minWidth: '200px' }}>
                    {(['newest','oldest','a-z','z-a','highest-rating','lowest-rating','year-desc','year-asc'] as SortOption[]).map((opt) => (
                      <li key={opt}>
                        <button
                          className={`dropdown-item ${sortOption === opt ? 'active' : ''}`}
                          onClick={() => { setSortOption(opt); setShowSortOptions(false); setLoading(true); fetchSeries(1); }}
                          type="button"
                        >
                          {getSortLabel(opt)}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <button className="btn btn-danger d-flex align-items-center rounded-pill" onClick={applyFilters} disabled={loading} type="button">Áp dụng bộ lọc</button>
              <button className="btn btn-outline-light d-flex align-items-center ms-auto rounded-pill" onClick={() => { setLoading(true); setPage(1); fetchSeries(1); }} disabled={loading} type="button">
                <FaSync className={`me-2 ${loading ? 'spin' : ''}`} />
                {loading ? 'Đang làm mới...' : 'Làm mới'}
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
                  <button className="btn btn-sm btn-outline-secondary rounded-pill" onClick={clearAllFilters} type="button">Xóa tất cả</button>
                </div>
              </div>
            </div>
          )}

          <div className="row row-cols-2 row-cols-sm-3 row-cols-md-3 row-cols-lg-4 row-cols-xl-5 row-cols-xxl-6 g-3 g-md-4 mb-4">
            {loading && page === 1
              ? [...Array(24)].map((_, i) => (
                  <div key={`skeleton-${i}`} className="col">
                    <div className="card h-100 bg-dark border-0">
                      <Skeleton height="300px" borderRadius="8px" />
                      <div className="card-body p-2">
                        <Skeleton height="18px" width="85%" />
                        <div className="mt-1"><Skeleton height="14px" width="65%" /></div>
                      </div>
                    </div>
                  </div>
                ))
              : series.map((s) => {
                  const imageId = `series-${s.slug}`;
                  const epCount = s.episodes?.[0]?.server_data?.length;
                  return (
                    <div key={s.slug || s._id || s.id || imageId} className="col">
                      <div className={`card h-100 bg-dark border-0 ${styles.movieCard}`}>
                        <div className={`position-relative ${styles.moviePoster}`}>
                          <div className={`blur-load ${loadedImages[imageId] ? 'loaded' : ''}`}
                            style={{
                              backgroundImage: `url(${s.thumb_url}?blur=30)`,
                              backgroundSize: 'cover',
                              filter: loadedImages[imageId] ? 'none' : 'blur(10px)',
                              transition: 'filter 0.3s ease-in-out',
                              height: '300px',
                              borderRadius: '8px'
                            }}>
                            {!loadedImages[imageId] && <Skeleton height="300px" borderRadius="8px" />}
                            <img
                              data-id={imageId}
                              src={s.thumb_url || s.poster_url || '/img/Phim.png'}
                              className={`card-img-top ${styles.movieImage}`}
                              alt={s.name}
                              loading="lazy"
                              style={{ height: '300px', objectFit: 'cover', borderRadius: '8px' }}
                              onLoad={() => handleImageLoad(imageId)}
                              onError={handleImageError}
                            />
                          </div>
                          <div className={styles.overlay}>
                            <Link href={`/movie/${s.slug}`} className={styles.playButton}><FaPlayCircle size={48} /></Link>
                          </div>
                          <div className={styles.movieInfo}>
                            {s.year && <span className="badge bg-danger me-1">{s.year}</span>}
                            {s.quality && <span className="badge bg-primary me-1">{s.quality}</span>}
                            {s.lang && <span className="badge bg-info">{s.lang || 'Vietsub'}</span>}
                          </div>
                          {s.rating && s.rating > 0 && (
                            <div className={styles.ratingBadge}><FaStar /> {s.rating.toFixed(1)}</div>
                          )}
                          {epCount && (
                            <div className={styles.episodeBadge}><FaFilm /> {epCount} tập</div>
                          )}
                        </div>
                        <div className="card-body py-0 px-1" style={{ backgroundColor: '#1a1a1a', minHeight: 'auto' }}>
                          <h6 className={`card-title text-white mb-0 ${styles.movieTitleEllipsis}`}>{s.name}</h6>
                          {s.origin_name && (
                            <p className="card-text small text-muted text-truncate mb-0" style={{ fontSize: '10px', lineHeight: 1, maxHeight: '14px' }}>
                              {s.origin_name}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
          </div>

          {!loading && hasMore && (
            <div className="text-center mt-4 mb-5">
              <button className="btn btn-outline-danger px-4 py-2 rounded-pill" onClick={loadMore} type="button">Xem thêm</button>
            </div>
          )}
          {loading && page > 1 && (
            <div className="text-center mt-4 mb-5">
              <div className="spinner-border text-danger" role="status"><span className="visually-hidden">Loading...</span></div>
              <p className="text-secondary mt-2">Đang tải thêm phim...</p>
            </div>
          )}
          {!loading && series.length === 0 && (
            <div className="text-center py-5">
              <div className="mb-3"><FaPlayCircle size={60} className="text-secondary" /></div>
              <h3 className="text-white">Không tìm thấy phim</h3>
              <p className="text-secondary">
                {(filters.category || filters.country || filters.year)
                  ? 'Không có phim bộ nào phù hợp với bộ lọc hiện tại.'
                  : 'Hiện chưa có phim bộ nào trong hệ thống. Vui lòng quay lại sau.'}
              </p>
              {(filters.category || filters.country || filters.year) && (
                <button className="btn btn-outline-light mt-3 rounded-pill" onClick={clearAllFilters} type="button">Xóa bộ lọc</button>
              )}
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .dropdown-menu { background-color: #212529; color: white; border: 1px solid rgba(255,255,255,0.15); max-height: 300px; overflow-y: auto; z-index: 1030; min-width: 200px; }
        .dropdown-item { color: rgba(255,255,255,0.8); padding: 8px 16px; }
        .dropdown-item:hover { background-color: rgba(255,255,255,0.1); color: white; }
        .dropdown-item.active, .dropdown-item:active { background-color: #dc3545; color: white; }
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        .ms-auto { margin-left: auto !important; }
      `}</style>
    </>
  );
}
