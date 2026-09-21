/**
 * @file useHomeData.js
 * @description Centralized data management hook for the Homepage.
 * Initializes instantly with high-quality mock data to prevent white flash,
 * then fetches real data asynchronously from backend API with robust fallbacks.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { mockMovies } from '@/mock/mockMovies';
import { MOVIE_CONFIG, normalizeHeroMovie } from '@/config/movieConfig';
import upcomingMovieService from '@/API/services/upcomingMovieService';

const API_BASE = MOVIE_CONFIG.apiBaseUrl;

/**
 * Normalizes movie data from various backend API formats into standard schema.
 * @param {Object} movie - Raw movie object from API.
 * @returns {Object} Normalized movie object.
 */
const normalizeMovie = (movie) => {
  if (!movie) return null;
  return {
    ...movie,
    _id: movie._id || movie.id || '',
    thumb_url: movie.thumb_url?.startsWith('http') ? movie.thumb_url : `${movie.thumb_url || ''}`,
    poster_url: movie.poster_url?.startsWith('http') ? movie.poster_url : `${movie.poster_url || ''}`,
    backdrop_url: movie.backdrop_url || movie.poster_url || movie.thumb_url || MOVIE_CONFIG.ui.defaultBackdrop
  };
};

export const useHomeData = () => {
  const [featuredMovies, setFeaturedMovies] = useState(() =>
    mockMovies.slice(0, 5).map((m, idx) => normalizeHeroMovie(m, idx))
  );
  const [topMovies, setTopMovies] = useState(() => mockMovies.slice(4, 12));
  const [mostViewedMovies, setMostViewedMovies] = useState(() => mockMovies.slice(0, 10));
  const [upcomingMovies, setUpcomingMovies] = useState([]);
  const [upcomingLoading, setUpcomingLoading] = useState(false);
  const [upcomingLoaded, setUpcomingLoaded] = useState(false);
  const [latestMovies, setLatestMovies] = useState(() => mockMovies);

  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  /**
   * Fetches latest movies with pagination for the homepage grid and hero spotlight.
   */
  const fetchLatestMovies = useCallback(async (pageNumber = 1, isLoadMore = false) => {
    try {
      if (isLoadMore) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }

      const res = await fetch(`${API_BASE}/movies?page=${pageNumber}&limit=24`);
      if (!res.ok) throw new Error(`API request failed with status ${res.status}`);

      const result = await res.json();
      // Support both Fastify Enterprise envelope (responseData.data or responseData) and legacy (data.movies or movies)
      const rawMovies =
        result?.responseData?.data ||
        (Array.isArray(result?.responseData) ? result.responseData : null) ||
        result?.data?.movies ||
        result?.movies ||
        [];

      if (rawMovies.length > 0 && isMountedRef.current) {
        const normalized = rawMovies.map(normalizeMovie);

        if (pageNumber === 1) {
          // Set featured hero spotlight using defensive normalizer with resilient cinema backdrops
          setFeaturedMovies(rawMovies.slice(0, 5).map((m, idx) => normalizeHeroMovie(m, idx)));
          setTopMovies(normalized.slice(5, 17));
          setLatestMovies(normalized);
        } else {
          setLatestMovies((prev) => [...prev, ...normalized]);
        }

        const pagination = result?.responseData || result?.data?.pagination || result?.pagination;
        if (pagination && pagination.page >= pagination.totalPages) {
          setHasMore(false);
        }
      }
    } catch (error) {
      // Backend not running or network issue: keep safe mock data
      console.warn('[useHomeData] Backend API unavailable or cold starting, utilizing robust mock fallback.', error.message);
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
        setLoadingMore(false);
      }
    }
  }, []);

  /**
   * Fetches top most viewed movies.
   */
  const fetchMostViewed = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/movie-views/most-viewed?days=7&limit=10&sort=createdAt`);
      if (!res.ok) throw new Error('Failed to fetch most viewed');

      const result = await res.json();
      const raw = result?.data?.movies || result?.movies || [];

      if (raw.length > 0 && isMountedRef.current) {
        setMostViewedMovies(raw.map(normalizeMovie));
      }
    } catch (err) {
      // Keep mockMovies slice
    }
  }, []);

  /**
   * Lazily loads upcoming movies on demand with a 2-second visual loading buffer
   * and a 10-second watchdog timeout to stop if no data is found.
   */
  const loadUpcoming = useCallback(async () => {
    if (upcomingLoaded || upcomingLoading) return;
    setUpcomingLoading(true);

    const startTime = Date.now();
    const MIN_LOADING_TIME = 2000; // 2 seconds deliberate loading buffer before rendering
    const MAX_TIMEOUT = 10000; // 10 seconds maximum watchdog timeout

    let timeoutTriggered = false;
    const timeoutTimer = setTimeout(() => {
      timeoutTriggered = true;
      console.warn('[useHomeData] 10s timeout reached searching for upcoming movies. Stopping.');
    }, MAX_TIMEOUT);

    try {
      const result = await upcomingMovieService.getUpcomingMovies(1, 15);
      clearTimeout(timeoutTimer);

      if (timeoutTriggered) {
        // If 10s exceeded, stop and do not render
        return;
      }

      // Ensure at least 2 seconds before rendering
      const elapsed = Date.now() - startTime;
      if (elapsed < MIN_LOADING_TIME) {
        await new Promise((resolve) => setTimeout(resolve, MIN_LOADING_TIME - elapsed));
      }

      if (result?.success && result.upcomingMovies?.length > 0 && isMountedRef.current) {
        setUpcomingMovies(result.upcomingMovies.map(normalizeMovie));
      } else if (isMountedRef.current) {
        setUpcomingMovies(mockMovies.slice(2, 10).map(normalizeMovie));
      }
    } catch (err) {
      clearTimeout(timeoutTimer);
      const elapsed = Date.now() - startTime;
      if (elapsed < MIN_LOADING_TIME) {
        await new Promise((resolve) => setTimeout(resolve, MIN_LOADING_TIME - elapsed));
      }

      if (!timeoutTriggered && isMountedRef.current) {
        setUpcomingMovies(mockMovies.slice(2, 10).map(normalizeMovie));
      }
    } finally {
      if (isMountedRef.current) {
        setUpcomingLoading(false);
        setUpcomingLoaded(true);
      }
    }
  }, [upcomingLoaded, upcomingLoading]);

  // Initial fetch on mount (only essential above-the-fold content)
  useEffect(() => {
    fetchLatestMovies(1, false);
    fetchMostViewed();
  }, [fetchLatestMovies, fetchMostViewed]);

  /**
   * Loads the next batch of movies with a 2-second visual buffer
   * and stops permanently if 10s timeout is reached or no more movies exist.
   */
  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);

    const startTime = Date.now();
    const MIN_LOADING_TIME = 2000; // 2 seconds loading buffer
    const MAX_TIMEOUT = 10000; // 10 seconds timeout

    let timeoutTriggered = false;
    const timeoutTimer = setTimeout(() => {
      timeoutTriggered = true;
      if (isMountedRef.current) {
        setHasMore(false); // Stop permanently after 10s
      }
      console.warn('[useHomeData] 10s timeout reached for loadMore. Halting calls.');
    }, MAX_TIMEOUT);

    try {
      const nextPage = page + 1;
      const res = await fetch(`${API_BASE}/movies?page=${nextPage}&limit=24`);
      clearTimeout(timeoutTimer);

      if (timeoutTriggered) return;

      const elapsed = Date.now() - startTime;
      if (elapsed < MIN_LOADING_TIME) {
        await new Promise((resolve) => setTimeout(resolve, MIN_LOADING_TIME - elapsed));
      }

      if (!res.ok) throw new Error('API failed');

      const result = await res.json();
      const rawMovies = result?.data?.movies || result?.movies || [];

      if (rawMovies.length > 0 && isMountedRef.current) {
        const normalized = rawMovies.map(normalizeMovie);
        setLatestMovies((prev) => [...prev, ...normalized]);
        setPage(nextPage);

        const pagination = result?.data?.pagination || result?.pagination;
        if (pagination && pagination.currentPage >= pagination.totalPages) {
          setHasMore(false);
        }
      } else if (isMountedRef.current) {
        // No more movies found: stop permanently!
        setHasMore(false);
      }
    } catch (error) {
      clearTimeout(timeoutTimer);
      const elapsed = Date.now() - startTime;
      if (elapsed < MIN_LOADING_TIME) {
        await new Promise((resolve) => setTimeout(resolve, MIN_LOADING_TIME - elapsed));
      }

      // If backend is unavailable or error: stop permanently to prevent infinite loops!
      if (isMountedRef.current) {
        setHasMore(false);
      }
    } finally {
      if (isMountedRef.current) {
        setLoadingMore(false);
      }
    }
  }, [page, loadingMore, hasMore]);

  return {
    featuredMovies,
    topMovies,
    mostViewedMovies,
    upcomingMovies,
    upcomingLoading,
    upcomingLoaded,
    loadUpcoming,
    latestMovies,
    loading,
    loadingMore,
    hasMore,
    page,
    loadMore
  };
};

export default useHomeData;
