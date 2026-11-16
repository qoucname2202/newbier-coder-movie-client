/**
 * @file useGenreMovies.ts
 * @description Production-grade hook managing genre movie lifecycle, filters, deduplication,
 * and throttled IntersectionObserver infinite scrolling with zero-duplicate API call guarantees.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { GenreMovieItem, GenreFormatFilter, GenreSortOption } from '../types/genre.types';
import { genreService, IGenreService } from '../services/genreService';
import { GENRE_PAGE_SIZE, SCROLL_FETCH_THROTTLE_MS } from '../constants/genreThemeConstants';

export interface UseGenreMoviesOptions {
  slug: string;
  initialFormat?: GenreFormatFilter;
  initialSort?: GenreSortOption;
  service?: IGenreService;
}

export interface UseGenreMoviesReturn {
  movies: GenreMovieItem[];
  total: number;
  page: number;
  hasMore: boolean;
  isLoading: boolean;
  isLoadingMore: boolean;
  isError: boolean;
  errorMessage: string | null;
  formatFilter: GenreFormatFilter;
  sortOption: GenreSortOption;
  sentinelRef: React.RefObject<HTMLDivElement | null>;
  activeTrailerMovie: GenreMovieItem | null;
  setFormatFilter: (format: GenreFormatFilter) => void;
  setSortOption: (sort: GenreSortOption) => void;
  retryLoadMore: () => void;
  openTrailer: (movie: GenreMovieItem) => void;
  closeTrailer: () => void;
  resetFilters: () => void;
}

/**
 * Custom hook orchestrating genre movie browsing and controlled infinite scrolling.
 *
 * @param options - Configuration options for genre, filters, and injected service
 * @returns State and event handlers for genre view
 */
export function useGenreMovies({
  slug,
  initialFormat = 'all',
  initialSort = 'newest',
  service = genreService
}: UseGenreMoviesOptions): UseGenreMoviesReturn {
  const [movies, setMovies] = useState<GenreMovieItem[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [page, setPage] = useState<number>(1);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
  const [isError, setIsError] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [formatFilter, setFormatFilterState] = useState<GenreFormatFilter>(initialFormat);
  const [sortOption, setSortOptionState] = useState<GenreSortOption>(initialSort);
  const [activeTrailerMovie, setActiveTrailerMovie] = useState<GenreMovieItem | null>(null);

  // ---------------------------------------------------------------------------
  // Guard Rails: Refs for synchronous concurrency control & scroll throttling
  // ---------------------------------------------------------------------------
  const isFetchingRef = useRef<boolean>(false);
  const lastFetchTimeRef = useRef<number>(0);
  const abortControllerRef = useRef<AbortController | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const seenKeysRef = useRef<Set<string>>(new Set());

  // Keep latest state in refs for observer callback without recreating observer
  const pageRef = useRef<number>(1);
  pageRef.current = page;

  const hasMoreRef = useRef<boolean>(true);
  hasMoreRef.current = hasMore;

  const formatFilterRef = useRef<GenreFormatFilter>(formatFilter);
  formatFilterRef.current = formatFilter;

  const sortOptionRef = useRef<GenreSortOption>(sortOption);
  sortOptionRef.current = sortOption;

  /**
   * Generates a unique deduplication key for a movie.
   */
  const getMovieKey = (m: GenreMovieItem): string => {
    return m.slug || m._id || m.id || `${m.name}-${m.year}`;
  };

  /**
   * Resets all filters and fetches page 1.
   */
  const resetFilters = useCallback(() => {
    setFormatFilterState('all');
    setSortOptionState('newest');
  }, []);

  /**
   * Sets format filter and resets page to 1.
   */
  const setFormatFilter = useCallback((newFormat: GenreFormatFilter) => {
    setFormatFilterState((prev) => (prev === newFormat ? prev : newFormat));
  }, []);

  /**
   * Sets sort option and resets page to 1.
   */
  const setSortOption = useCallback((newSort: GenreSortOption) => {
    setSortOptionState((prev) => (prev === newSort ? prev : newSort));
  }, []);

  /**
   * Opens the trailer modal for a movie.
   */
  const openTrailer = useCallback((movie: GenreMovieItem) => {
    setActiveTrailerMovie(movie);
  }, []);

  /**
   * Closes the trailer modal.
   */
  const closeTrailer = useCallback(() => {
    setActiveTrailerMovie(null);
  }, []);

  // ---------------------------------------------------------------------------
  // Primary Fetch: Page 1 when slug, format, or sort changes
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!slug) return;

    // Abort any ongoing in-flight request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    // Reset pagination state
    isFetchingRef.current = true;
    setIsLoading(true);
    setIsLoadingMore(false);
    setIsError(false);
    setErrorMessage(null);
    setPage(1);
    seenKeysRef.current.clear();

    const fetchInitialPage = async () => {
      try {
        const response = await service.fetchGenreMovies(
          {
            slug,
            page: 1,
            limit: GENRE_PAGE_SIZE,
            formatType: formatFilter,
            sort: sortOption
          },
          controller.signal
        );

        if (controller.signal.aborted) return;

        const uniqueItems: GenreMovieItem[] = [];
        for (const item of response.items) {
          const key = getMovieKey(item);
          if (!seenKeysRef.current.has(key)) {
            seenKeysRef.current.add(key);
            uniqueItems.push(item);
          }
        }

        setMovies(uniqueItems);
        setTotal(response.total);
        setHasMore(response.hasMore && uniqueItems.length > 0);
      } catch (err: unknown) {
        if ((err as Error)?.name === 'AbortError') return;
        setIsError(true);
        setErrorMessage('Không thể tải danh sách phim. Vui lòng thử lại sau.');
        setMovies([]);
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
          isFetchingRef.current = false;
        }
      }
    };

    fetchInitialPage();

    return () => {
      controller.abort();
    };
  }, [slug, formatFilter, sortOption, service]);

  // ---------------------------------------------------------------------------
  // Secondary Fetch: Load more movies on scroll (Throttled & Guarded)
  // ---------------------------------------------------------------------------
  const loadMoreMovies = useCallback(async () => {
    // CRITICAL GUARD RAILS:
    // 1. Prevent concurrent fetches
    if (isFetchingRef.current) return;
    // 2. Prevent fetching beyond catalog end
    if (!hasMoreRef.current) return;
    // 3. Enforce minimum throttle interval between requests
    const now = Date.now();
    if (now - lastFetchTimeRef.current < SCROLL_FETCH_THROTTLE_MS) return;

    isFetchingRef.current = true;
    lastFetchTimeRef.current = now;
    setIsLoadingMore(true);

    const nextPage = pageRef.current + 1;
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const response = await service.fetchGenreMovies(
        {
          slug,
          page: nextPage,
          limit: GENRE_PAGE_SIZE,
          formatType: formatFilterRef.current,
          sort: sortOptionRef.current
        },
        controller.signal
      );

      if (controller.signal.aborted) return;

      if (!response.items || response.items.length === 0) {
        setHasMore(false);
      } else {
        const newUniqueItems: GenreMovieItem[] = [];
        for (const item of response.items) {
          const key = getMovieKey(item);
          if (!seenKeysRef.current.has(key)) {
            seenKeysRef.current.add(key);
            newUniqueItems.push(item);
          }
        }

        if (newUniqueItems.length === 0) {
          // If no new unique movies arrived, prevent infinite looping
          setHasMore(false);
        } else {
          setMovies((prev) => [...prev, ...newUniqueItems]);
          setPage(nextPage);
          setTotal(Math.max(response.total, seenKeysRef.current.size));
          setHasMore(response.hasMore && newUniqueItems.length >= GENRE_PAGE_SIZE);
        }
      }
    } catch (err: unknown) {
      if ((err as Error)?.name === 'AbortError') return;
      // Soft failure on load-more: keep existing list, let user retry
    } finally {
      if (!controller.signal.aborted) {
        setIsLoadingMore(false);
        isFetchingRef.current = false;
      }
    }
  }, [slug, service]);

  const retryLoadMore = useCallback(() => {
    loadMoreMovies();
  }, [loadMoreMovies]);

  // ---------------------------------------------------------------------------
  // Controlled IntersectionObserver: Observes bottom sentinel element
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const sentinelEl = sentinelRef.current;
    if (!sentinelEl) return;

    // Disconnect when loading or when there are no more movies
    if (!hasMore || isLoading) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry && entry.isIntersecting) {
          loadMoreMovies();
        }
      },
      {
        root: null,
        // Trigger 280px before viewport bottom for buttery smooth streaming
        rootMargin: '280px',
        threshold: 0.05
      }
    );

    observer.observe(sentinelEl);

    return () => {
      observer.disconnect();
    };
  }, [hasMore, isLoading, loadMoreMovies]);

  return {
    movies,
    total,
    page,
    hasMore,
    isLoading,
    isLoadingMore,
    isError,
    errorMessage,
    formatFilter,
    sortOption,
    sentinelRef,
    activeTrailerMovie,
    setFormatFilter,
    setSortOption,
    retryLoadMore,
    openTrailer,
    closeTrailer,
    resetFilters
  };
}
