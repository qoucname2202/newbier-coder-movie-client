/**
 * @file useHomeData.js
 * @description Centralized data management hook for the Homepage.
 * Initializes instantly with high-quality mock data to prevent white flash,
 * then fetches real data asynchronously from backend API with robust fallbacks.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { mockMovies } from '@/mock/mockMovies';
import { MOVIE_CONFIG } from '@/config/movieConfig';
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
    thumb_url: movie.thumb_url?.startsWith('http') ? movie.thumb_url : `${movie.thumb_url || ''}`,
    poster_url: movie.poster_url?.startsWith('http') ? movie.poster_url : `${movie.poster_url || ''}`,
    backdrop_url: movie.backdrop_url || movie.poster_url || movie.thumb_url || MOVIE_CONFIG.ui.defaultBackdrop
  };
};

export const useHomeData = () => {
  // Initial states with instant mock data (no layout shift / blank screen)
  const [featuredMovies, setFeaturedMovies] = useState(() => mockMovies.slice(0, 5));
  const [topMovies, setTopMovies] = useState(() => mockMovies.slice(4, 12));
  const [mostViewedMovies, setMostViewedMovies] = useState(() => mockMovies.slice(0, 10));
  const [upcomingMovies, setUpcomingMovies] = useState(() => mockMovies.slice(2, 8));
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
   * Fetches latest movies with pagination for the homepage grid.
   */
  const fetchLatestMovies = useCallback(async (pageNumber = 1, isLoadMore = false) => {
    try {
      if (isLoadMore) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }

      const res = await fetch(`${API_BASE}/movies?page=${pageNumber}&limit=24`);
      if (!res.ok) throw new Error('API request failed');

      const result = await res.json();
      const rawMovies = result?.data?.movies || result?.movies || [];

      if (rawMovies.length > 0 && isMountedRef.current) {
        const normalized = rawMovies.map(normalizeMovie);

        if (pageNumber === 1) {
          // Set featured and top recommendations from fresh data
          setFeaturedMovies(normalized.slice(0, 5));
          setTopMovies(normalized.slice(5, 17));
          setLatestMovies(normalized);
        } else {
          setLatestMovies((prev) => [...prev, ...normalized]);
        }

        const pagination = result?.data?.pagination || result?.pagination;
        if (pagination && pagination.currentPage >= pagination.totalPages) {
          setHasMore(false);
        }
      }
    } catch (error) {
      // Backend not running or network issue: keep safe mock data
      console.warn('[useHomeData] Backend API unavailable, utilizing robust mock fallback.');
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
   * Fetches upcoming movies.
   */
  const fetchUpcoming = useCallback(async () => {
    try {
      const result = await upcomingMovieService.getUpcomingMovies(1, 15);
      if (result?.success && result.upcomingMovies?.length > 0 && isMountedRef.current) {
        setUpcomingMovies(result.upcomingMovies.map(normalizeMovie));
      }
    } catch (err) {
      // Keep mockMovies slice
    }
  }, []);

  // Initial fetch on mount
  useEffect(() => {
    fetchLatestMovies(1, false);
    fetchMostViewed();
    fetchUpcoming();
  }, [fetchLatestMovies, fetchMostViewed, fetchUpcoming]);

  /**
   * Loads the next page of movies for the grid.
   */
  const loadMore = useCallback(() => {
    if (loadingMore || !hasMore) return;
    const nextPage = page + 1;
    setPage(nextPage);
    fetchLatestMovies(nextPage, true);
  }, [page, loadingMore, hasMore, fetchLatestMovies]);

  return {
    featuredMovies,
    topMovies,
    mostViewedMovies,
    upcomingMovies,
    latestMovies,
    loading,
    loadingMore,
    hasMore,
    page,
    loadMore
  };
};

export default useHomeData;
