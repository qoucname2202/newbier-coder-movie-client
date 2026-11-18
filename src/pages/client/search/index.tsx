/**
 * @file pages/search.tsx
 * @description Full-text search page with autocomplete suggestions, filters, and lazy-load.
 */
import React, { useState, useEffect, useRef, ChangeEvent, MouseEvent } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import movieService from '@/API/services/movieService';
import searchHistoryService from '@/API/services/searchHistoryService';
import searchSuggestionService from '@/API/services/searchSuggestionService';
import { useAuth } from '@/context/AuthContext';
import BackToTop from '@/features/shared/components/UI/BackToTop';
import MovieFilter, { INITIAL_MOVIE_FILTER_STATE, MovieFilterState } from '@/components/Movie/MovieFilter';
import { filterStateToQueryParams } from '@/components/Movie/MovieFilter';

function useDebounce(value: string, delay: number): string {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

interface SearchMovie {
  uniqueId?: string;
  id?: string;
  _id?: string;
  slug?: string;
  name?: string;
  thumb_url?: string;
  poster_url?: string;
  year?: number;
  quality?: string;
  type?: string;
  episode_current?: string;
  episodes?: Array<{ server_data?: Array<unknown> }>;
  [key: string]: unknown;
}

interface SearchResponse {
  hits?: SearchMovie[];
  total?: number;
}

export default function SearchPage() {
  const router = useRouter();
  const [query, setQuery] = useState<string>('');
  const [movies, setMovies] = useState<SearchMovie[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [, setInitialLoad] = useState<boolean>(true);
  const [page, setPage] = useState<number>(1);
  const [filterState, setFilterState] = useState(INITIAL_MOVIE_FILTER_STATE);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalMovies, setTotalMovies] = useState<number>(0);
  const [imageLoading, setImageLoading] = useState<Record<string, boolean>>({});

  const [searchSuggestions, setSearchSuggestions] = useState<string[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState<boolean>(false);
  const [showSuggestions, setShowSuggestions] = useState<boolean>(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  const { isAuthenticated } = useAuth();
  const [typingTimeout, setTypingTimeout] = useState<ReturnType<typeof setTimeout> | null>(null);

  const debouncedQuery = useDebounce(query, 800);
  const [enableAutoSearch, setEnableAutoSearch] = useState<boolean>(true);

  const fetchMovies = async (
    searchQuery: string,
    pageOrFilters: number | MovieFilterState = 1,
    maybePage?: number,
    isLoadMore = false
  ): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      let actualFilters: MovieFilterState = filterState;
      let actualPage = 1;
      let actualLoadMore = isLoadMore;

      if (typeof pageOrFilters === 'number') {
        actualPage = pageOrFilters;
        actualLoadMore = Boolean(maybePage);
      } else {
        actualFilters = pageOrFilters;
        if (maybePage !== undefined) {
          actualPage = maybePage;
          actualLoadMore = isLoadMore;
        }
      }

      const searchFilters = filterStateToQueryParams(actualFilters);
      const response = (await movieService.searchMovies(
        searchQuery,
        { ...searchFilters, search_description: true, search_all_fields: true } as unknown as Record<string, unknown>,
        actualPage,
        24
      )) as SearchResponse & { hits?: SearchMovie[]; total?: number };

      if ((!response || !response.hits || response.hits.length === 0) && !searchQuery) {
        const fallbackRes = (await movieService.getNewestMovies(actualPage, 24)) as { items?: SearchMovie[]; pagination?: { totalItems?: number } };
        if (fallbackRes?.items && fallbackRes.items.length > 0) {
          response.hits = fallbackRes.items;
          response.total = fallbackRes.pagination?.totalItems || fallbackRes.items.length;
        }
      }

      if (response?.hits) {
        const processedMovies = response.hits.map((m) => ({
          ...m,
          uniqueId: (m.id || m._id || m.slug) as string,
          thumb_url: (m.thumb_url || m.poster_url || '/img/Phim.png') as string
        }));

        const newImageLoadingState: Record<string, boolean> = {};
        processedMovies.forEach((m) => {
          const id = m.uniqueId || m.id || m._id || m.slug;
          newImageLoadingState[id as string] = true;
        });
        setImageLoading((prev) => ({ ...prev, ...newImageLoadingState }));

        if (actualLoadMore) {
          setMovies((prevMovies) => {
            const existingIds = new Set(prevMovies.map((m) => m.uniqueId || m.id || m._id || m.slug));
            const newUnique = processedMovies.filter((m) => !existingIds.has(m.uniqueId || m.id || m._id || m.slug));
            return [...prevMovies, ...newUnique];
          });
        } else {
          setMovies(processedMovies);
        }

        setTotalMovies(response.total || 0);
        setTotalPages(Math.ceil((response.total || 0) / 20));
      } else {
        setError('Không nhận được dữ liệu phim hợp lệ từ máy chủ');
        if (!actualLoadMore) setMovies([]);
      }
      setInitialLoad(false);
    } catch (err) {

      setError(`Lỗi khi tìm kiếm phim: ${(err as Error).message}`);
      if (!isLoadMore) setMovies([]);
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
      if (response?.success && Array.isArray(response.suggestions)) {
        setSearchSuggestions(response.suggestions);
      } else {
        setSearchSuggestions([]);
      }
    } catch {
      setSearchSuggestions([]);
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const handleSuggestionClick = (suggestion: string): void => {
    setQuery(suggestion);
    setShowSuggestions(false);
    if (isAuthenticated) {
      searchHistoryService.saveSearchHistory(suggestion, filterState as unknown as Record<string, unknown>).catch(() => {});
    }
    localStorage.removeItem('lastSearchQuery');
    fetchMovies(suggestion, filterState, 1, false);
    updateUrlWithQueryAndFilters(suggestion);
  };

  const updateUrlWithQueryAndFilters = (searchQuery: string): void => {
    const queryParams: Record<string, string> = {};
    if (searchQuery.trim()) queryParams.q = searchQuery.trim();
    if (filterState.categories?.length) queryParams.category = filterState.categories[0];
    if (filterState.country) queryParams.country = filterState.country;
    if (filterState.year) queryParams.year = filterState.year;
    router.push({ pathname: '/search', query: queryParams }, undefined, { shallow: true });
  };

  const handleSearchInputChange = (e: ChangeEvent<HTMLInputElement>): void => {
    const newQuery = e.target.value;
    setQuery(newQuery);
    setPage(1);

    if (typeof window !== 'undefined') {
      (window as unknown as { userIsTyping?: boolean }).userIsTyping = true;
    }
    if (typingTimeout) clearTimeout(typingTimeout);
    const newTimeout = setTimeout(() => {
      if (typeof window !== 'undefined') {
        (window as unknown as { userIsTyping?: boolean }).userIsTyping = false;
      }
    }, 3000);
    setTypingTimeout(newTimeout);

    if (newQuery.length < query.length) setEnableAutoSearch(false);
    setTimeout(() => setEnableAutoSearch(true), 3000);

    if (newQuery === '') {
      if (typeof window !== 'undefined') localStorage.removeItem('lastSearchQuery');
      const qp: Record<string, string> = {};
      if (filterState.categories?.length) qp.category = filterState.categories[0];
      if (filterState.country) qp.country = filterState.country;
      if (filterState.year) qp.year = filterState.year;
      if (Object.keys(qp).length > 0) {
        router.push({ pathname: '/search', query: qp }, undefined, { shallow: true });
      } else {
        router.push('/search', undefined, { shallow: true });
      }
    } else {
      fetchSearchSuggestions(newQuery);
    }
  };

  const handleSearch = async (e: MouseEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setPage(1);
    const qp: Record<string, string> = {};
    if (query.trim()) qp.q = query.trim();
    if (filterState.categories?.length) qp.category = filterState.categories[0];
    if (filterState.country) qp.country = filterState.country;
    if (filterState.year) qp.year = filterState.year;
    router.push({ pathname: '/search', query: qp }, undefined, { shallow: true });
    await fetchMovies(query, filterState, 1, false);
    if (isAuthenticated && query.trim()) {
      try { await searchHistoryService.saveSearchHistory(query, filterState as unknown as Record<string, unknown>); } catch {}
    }
  };

  const handleFilterChange = (newFilters: typeof filterState): void => {
    setLoading(true);
    setFilterState(newFilters);
    const qp: Record<string, string> = { q: query.trim() };
    if (newFilters.categories?.length) qp.category = newFilters.categories[0];
    if (newFilters.country) qp.country = newFilters.country;
    if (newFilters.year) qp.year = newFilters.year;
    router.push({ pathname: '/search', query: qp }, undefined, { shallow: true });
    setPage(1);
    fetchMovies(query, newFilters, 1, false);
  };

  const loadMore = (): void => {
    if (page < totalPages) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchMovies(query, nextPage, 1, true);
    }
  };

  const handleImageLoaded = (movieId: string): void => {
    // The "already loaded" flag is kept in the component state only. It was
    // written to `localStorage` before, which created one key per movie
    // (never read again) and grew the storage without any benefit.
    setImageLoading((prev) => ({ ...prev, [movieId]: false }));
  };

  const highlightSearchTerms = (text: string, searchQuery: string): string => {
    if (!searchQuery || !text) return text;
    const escaped = searchQuery.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    const regex = new RegExp(`(${escaped})`, 'gi');
    return text.replace(regex, '<span class="highlight-match">$1</span>');
  };

  useEffect(() => {
    if (debouncedQuery !== undefined && enableAutoSearch && debouncedQuery.length > 1) {
      updateUrlWithQueryAndFilters(debouncedQuery);
      fetchMovies(debouncedQuery, filterState, 1, false);
    }
  }, [debouncedQuery, enableAutoSearch]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent): void => {
      if (
        suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node) &&
        searchInputRef.current && !searchInputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside as unknown as EventListener);
    return () => document.removeEventListener('mousedown', handleClickOutside as unknown as EventListener);
  }, []);

  useEffect(() => {
    if (!router.isReady) return;
    if ((window as unknown as { userIsTyping?: boolean }).userIsTyping) return;

    const urlQuery = (typeof router.query.q === 'string' ? router.query.q : '') || '';
    const urlCategory = (typeof router.query.category === 'string' ? router.query.category : '') || '';
    const urlCountry = (typeof router.query.country === 'string' ? router.query.country : '') || '';
    const urlYear = (typeof router.query.year === 'string' ? router.query.year : '') || '';

    if (urlQuery !== query) setQuery(urlQuery);

    let initialFilters = { ...INITIAL_MOVIE_FILTER_STATE };
    if (urlCategory) initialFilters.categories = [urlCategory];
    if (urlCountry) initialFilters.country = urlCountry;
    if (urlYear) initialFilters.year = urlYear;
    if (urlCategory || urlCountry || urlYear) setFilterState(initialFilters);

    fetchMovies(urlQuery, initialFilters, 1, false);
  }, [router.isReady, router.query]);

  const showLoadMore = !loading && movies.length > 0 && page < totalPages;

  return (
    <div className="bg-black min-vh-100 text-white">
      <Head>
        <title>Duyệt tìm phim | Movie Streaming</title>
      </Head>
      <div className="container pt-3 pb-5">
        {/* Search Bar */}
        <div className="mb-3">
          <form onSubmit={handleSearch} className="position-relative" style={{ maxWidth: '640px' }}>
            <div className="input-group" style={{ background: '#141416', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '6px', overflow: 'hidden' }}>
              <span className="input-group-text border-0" style={{ background: 'transparent', color: '#9ca3af', paddingLeft: '14px', fontSize: '0.9rem' }}>
                <i className="fas fa-search" />
              </span>
              <input
                type="text"
                className="form-control text-white border-0"
                style={{ backgroundColor: 'transparent', fontSize: '0.9rem', padding: '9px 12px', boxShadow: 'none' }}
                placeholder="Gõ tên phim, diễn viên, từ khóa tìm kiếm..."
                value={query}
                onChange={handleSearchInputChange}
                autoComplete="off"
                ref={searchInputRef}
              />
              {query && (
                <button
                  type="button"
                  className="btn border-0 text-secondary"
                  style={{ background: 'transparent', padding: '0 10px', fontSize: '0.85rem' }}
                  onClick={() => {
                    setQuery('');
                    if (searchInputRef.current) searchInputRef.current.focus();
                    fetchMovies('', filterState, 1, false);
                  }}
                  title="Xóa tìm kiếm"
                >
                  <i className="fas fa-times" />
                </button>
              )}
              <button
                type="submit"
                className="btn d-flex align-items-center"
                style={{ background: '#e50914', color: '#ffffff', fontWeight: 600, fontSize: '0.86rem', padding: '0 20px', border: 'none', borderRadius: '0 5px 5px 0' }}
                disabled={loading}
              >
                {loading ? <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" /> : null}
                Tìm kiếm
              </button>
            </div>

            {showSuggestions && searchSuggestions.length > 0 && (
              <div className="search-suggestions text-white p-2" style={{ position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, zIndex: 1050, backgroundColor: '#141416', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', boxShadow: '0 8px 24px rgba(0,0,0,0.6)' }} ref={suggestionsRef}>
                <ul className="list-unstyled mb-0">
                  {searchSuggestions.map((sugg, idx) => (
                    <li key={idx} className="suggestion-item py-2 px-3 rounded mb-1 cursor-pointer" onClick={() => handleSuggestionClick(sugg)}>
                      <i className="fas fa-search me-2 text-muted" style={{ fontSize: '0.75rem' }} />
                      {sugg}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </form>
        </div>

        {/* Filters */}
        <MovieFilter
          value={filterState}
          onChange={(newFilters) => setFilterState(newFilters)}
          onSubmit={(newFilters: MovieFilterState) => { setPage(1); fetchMovies(query, newFilters, 1, false); }}
          onReset={() => { setFilterState(INITIAL_MOVIE_FILTER_STATE); setPage(1); fetchMovies(query, INITIAL_MOVIE_FILTER_STATE, 1, false); }}
          showTitleHeader={false}
          themeColor="red"
        />

        {/* Skeleton Loading */}
        {loading && movies.length === 0 ? (
          <div className="row g-4">
            {Array.from({ length: 12 }).map((_, idx) => (
              <div key={idx} className="col-6 col-sm-4 col-md-3 col-lg-2">
                <div className="skeleton-card h-100">
                  <div className="skeleton-poster position-relative">
                    <div className="skeleton-shimmer" />
                    <div className="skeleton-badges year-quality">
                      <div className="skeleton-badge" />
                      <div className="skeleton-badge ms-1" />
                    </div>
                    <div className="skeleton-badges episode-status">
                      <div className="skeleton-badge-wide" />
                    </div>
                  </div>
                  <div className="skeleton-info p-2">
                    <div className="skeleton-title" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <>
            {error && <div className="alert alert-danger">{error}</div>}

            {!loading && movies.length === 0 && (
              <div className="text-center py-5 my-3">
                <i className="fas fa-film mb-2 text-secondary opacity-50" style={{ fontSize: '2.4rem' }} />
                <div className="fw-semibold text-white mb-1" style={{ fontSize: '1.05rem' }}>
                  Không tìm thấy phim phù hợp với tiêu chí
                </div>
                <p className="text-secondary small mb-3">
                  Vui lòng thử chọn tiêu chí khác hoặc đặt lại bộ lọc để xem toàn bộ danh sách phim.
                </p>
                <button
                  type="button"
                  className="btn btn-sm btn-outline-secondary px-3"
                  onClick={() => { setFilterState(INITIAL_MOVIE_FILTER_STATE); setPage(1); fetchMovies(query, INITIAL_MOVIE_FILTER_STATE, 1, false); }}
                >
                  Đặt lại bộ lọc
                </button>
              </div>
            )}

            {movies.length > 0 && (
              <>
                <div className="mb-3 d-flex align-items-center justify-content-between flex-wrap gap-2" style={{ color: '#94a3b8', fontSize: '0.94rem' }}>
                  <div>
                    {query ? (
                      <span>Kết quả tìm kiếm cho <strong style={{ color: '#f87171' }}>"{query}"</strong>: </span>
                    ) : <span>Danh sách phim: </span>}
                    Tìm thấy <strong style={{ color: '#f8fafc' }}>{totalMovies}</strong> kết quả
                  </div>
                </div>

                <div className="row g-4">
                  {movies.map((movie) => {
                    const uid = movie.uniqueId || movie.id || movie._id || movie.slug || '';
                    const imgLoaded = !imageLoading[uid];
                    return (
                      <div key={uid} className="col-6 col-sm-4 col-md-3 col-lg-2">
                        <div className="movie-card h-100" onClick={() => router.push(`/movie/${movie.slug}`)}>
                          <div className="position-relative movie-poster-container">
                            <img
                              src={movie.thumb_url || movie.poster_url || '/img/Phim.png'}
                              alt={movie.name}
                              className={`w-100 rounded movie-poster ${imgLoaded ? 'loaded' : 'loading'}`}
                              onLoad={() => handleImageLoaded(uid)}
                              onError={(e) => { (e as unknown as { onerror: null }).onerror = null; (e.target as HTMLImageElement).src = '/img/Phim.png'; handleImageLoaded(uid); }}
                              loading="lazy"
                            />
                            <div className="overlay position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center">
                              <button className="play-button"><i className="bi bi-play-fill" /></button>
                            </div>
                            <div className="movie-badges year-quality">
                              {movie.year && <span className="badge bg-danger">{movie.year}</span>}
                              {movie.quality && <span className="badge bg-primary ms-1">{movie.quality}</span>}
                            </div>
                            <div className="movie-badges episode-status">
                              {movie.type === 'series' ? (
                                movie.episode_current ? (
                                  <span className="badge bg-success">
                                    {movie.episode_current === 'Full' ? 'Full' :
                                      movie.episode_current.includes('/') ? `Hoàn Tất (${movie.episode_current})` :
                                      `Hoàn Tất (${movie.episode_current}/??)`}
                                  </span>
                                ) : movie.episodes?.[0]?.server_data ? (
                                  <span className="badge bg-success">Hoàn Tất ({movie.episodes[0].server_data.length}/?)</span>
                                ) : (
                                  <span className="badge bg-success">Tập 1/?</span>
                                )
                              ) : (
                                <span className="badge bg-success">Full</span>
                              )}
                            </div>
                          </div>
                          <div className="movie-info p-2">
                            <h3
                              className="h6 mb-1 movie-title"
                              dangerouslySetInnerHTML={{ __html: query ? highlightSearchTerms(movie.name || '', query) : (movie.name || '') }}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {loading && movies.length > 0 && (
                  <div className="row g-4 mt-2">
                    {Array.from({ length: 6 }).map((_, idx) => (
                      <div key={`loadmore-${idx}`} className="col-6 col-sm-4 col-md-3 col-lg-2">
                        <div className="skeleton-card h-100">
                          <div className="skeleton-poster position-relative">
                            <div className="skeleton-shimmer" />
                            <div className="skeleton-badges year-quality">
                              <div className="skeleton-badge" />
                              <div className="skeleton-badge ms-1" />
                            </div>
                            <div className="skeleton-badges episode-status">
                              <div className="skeleton-badge-wide" />
                            </div>
                          </div>
                          <div className="skeleton-info p-2">
                            <div className="skeleton-title" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {showLoadMore && (
                  <div className="text-center mt-4">
                    <button className="btn btn-outline-danger px-4" onClick={loadMore} disabled={loading}>
                      {loading ? <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" /> : null}
                      Xem thêm
                    </button>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>

      <BackToTop />

      <style jsx global>{`
        .form-control::placeholder, input::placeholder { color: #94a3b8 !important; opacity: 1 !important; }
        .form-control:focus { background-color: #161824 !important; border-color: #ef4444 !important; color: #ffffff !important; box-shadow: 0 0 0 2px rgba(229,9,20,0.25) !important; }
        .movie-card { background: #1a1a1a; border-radius: 10px; overflow: hidden; cursor: pointer; transition: transform 0.3s, box-shadow 0.3s; }
        .movie-card:hover { transform: translateY(-5px); box-shadow: 0 5px 15px rgba(220,53,69,0.3); }
        ::-webkit-scrollbar { width: 4px; height: 6px; }
        ::-webkit-scrollbar-track { background: rgba(0,0,0,0.2); border-radius: 10px; }
        ::-webkit-scrollbar-thumb { background: rgba(99,97,97,0.5); border-radius: 10px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(126,121,121,0.8); }
        * { scrollbar-width: thin; scrollbar-color: rgba(95,94,94,0.5) rgba(0,0,0,0.2); }
        @media (max-width: 767px) {
          .container { padding-left: 10px; padding-right: 10px; }
          .movie-poster-container { height: 200px; }
          .movie-title { font-size: 0.8rem; }
          .row.g-4 { row-gap: 10px !important; }
          .col-6 { padding-left: 5px; padding-right: 5px; }
        }
        @media (max-width: 400px) {
          .movie-poster-container { height: 180px; }
          .play-button { width: 40px; height: 40px; }
        }
        .movie-poster-container { height: 250px; width: 100%; position: relative; background-color: #2a2a2a; overflow: hidden; border-radius: 8px; }
        .movie-poster.loading { opacity: 1; filter: blur(15px); transition: opacity 0.3s ease, filter 0.5s ease; animation: pulseImage 2s infinite ease-in-out; }
        .movie-poster.loaded { opacity: 1; filter: blur(0); transition: opacity 0.3s ease, filter 0.3s ease; }
        @keyframes pulseImage { 0% { opacity: 0.7; } 50% { opacity: 0.9; } 100% { opacity: 0.7; } }
        .overlay { position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: linear-gradient(0deg,rgba(0,0,0,0.8) 0%,rgba(0,0,0,0.4) 50%,rgba(0,0,0,0.2) 100%); z-index: 2; opacity: 0; transition: opacity 0.3s ease; border-radius: 3px; }
        .movie-card:hover .overlay { opacity: 1; }
        .play-button { position: absolute; top: 50%; left: 50%; transform: translate(-50%,-50%); background-color: rgba(0,0,0,0.6); color: rgba(169,143,146,0.69); border: none; width: 60px; height: 60px; border-radius: 50%; z-index: 3; opacity: 0; transition: all 0.3s cubic-bezier(0.175,0.885,0.32,1.275); display: flex; align-items: center; justify-content: center; padding: 0; box-shadow: 0 0 20px rgba(220,195,197,0.4); backdrop-filter: blur(5px); }
        .play-button i { font-size: 40px; margin-left: 5px; }
        .play-button:hover { opacity: 1; color: #fff; background-color: rgba(152,148,148,0.36); transform: translate(-50%,-50%) scale(1.3); }
        @keyframes pulse { 0% { box-shadow: 0 0 0 0 rgba(180,177,178,0.46); } 70% { box-shadow: 0 0 0 10px rgba(162,149,150,0); } 100% { box-shadow: 0 0 0 0 rgba(177,159,160,0); } }
        .movie-card:hover .play-button { opacity: 1; animation: pulse 1.5s infinite; }
        .movie-info { background: #1a1a1a; }
        .movie-title { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .highlight-match { color: #e50914; font-weight: bold; background-color: rgba(229,9,20,0.1); padding: 0 2px; border-radius: 2px; }
        .movie-badges { position: absolute; z-index: 3; }
        .movie-badges.year-quality { top: 0; right: 0; margin: 0.5rem; }
        .movie-badges.episode-status { bottom: 0; left: 0; margin: 0.5rem; }
        .cursor-pointer { cursor: pointer; }
        .skeleton-card { background: #1a1a1a; border-radius: 10px; overflow: hidden; animation: pulse 2s infinite ease-in-out; }
        .skeleton-poster { height: 250px; width: 100%; background: linear-gradient(90deg,#2a2a2a 25%,#3a3a3a 50%,#2a2a2a 75%); background-size: 200% 100%; border-radius: 8px; position: relative; overflow: hidden; }
        .skeleton-shimmer { position: absolute; top: 0; left: -100%; width: 100%; height: 100%; background: linear-gradient(90deg,transparent,rgba(255,255,255,0.1),transparent); animation: shimmer 1.5s infinite; }
        @keyframes shimmer { 0% { left: -100%; } 100% { left: 100%; } }
        .skeleton-badges { position: absolute; z-index: 3; }
        .skeleton-badges.year-quality { top: 0; right: 0; margin: 0.5rem; display: flex; gap: 0.25rem; }
        .skeleton-badges.episode-status { bottom: 0; left: 0; margin: 0.5rem; }
        .skeleton-badge { width: 35px; height: 20px; background: #3a3a3a; border-radius: 3px; animation: skeletonPulse 1.5s infinite; }
        .skeleton-badge-wide { width: 60px; height: 20px; background: #3a3a3a; border-radius: 3px; animation: skeletonPulse 1.5s infinite; }
        .skeleton-info { background: #1a1a1a; padding: 0.5rem; }
        .skeleton-title { height: 16px; background: #3a3a3a; border-radius: 3px; width: 80%; animation: skeletonPulse 1.5s infinite; }
        @keyframes skeletonPulse { 0% { opacity: 1; } 50% { opacity: 0.6; } 100% { opacity: 1; } }
        @media (max-width: 767px) { .skeleton-poster { height: 200px; } .skeleton-badge { width: 30px; height: 18px; } .skeleton-badge-wide { width: 50px; height: 18px; } }
        @media (max-width: 400px) { .skeleton-poster { height: 180px; } .skeleton-badge { width: 25px; height: 16px; } .skeleton-badge-wide { width: 40px; height: 16px; } .skeleton-title { height: 14px; } }
        .search-suggestions { position: absolute; z-index: 1050; width: 100%; max-height: 300px; overflow-y: auto; box-shadow: 0 10px 30px rgba(0,0,0,0.7); margin-top: 4px; border: 1px solid rgba(255,255,255,0.12); }
        .suggestion-item { transition: all 0.2s ease; cursor: pointer; border-left: 3px solid transparent; }
        .suggestion-item:hover { background-color: rgba(229,9,20,0.1); border-left: 3px solid #e50914; padding-left: 10px; }
      `}</style>
    </div>
  );
}
