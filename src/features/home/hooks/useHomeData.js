/**
 * @file useHomeData.js
 * @description Centralized data management hook for the Homepage.
 * Seamlessly integrates with HOME_SECTIONS to provide zero-flicker instant render,
 * clean state updates, and resilient fallbacks.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { mockMovies, mockAnimationMovies } from '@/mock/mockMovies';
import {
  normalizeHeroMovie,
  resolveMovieBackdrop,
  LOCAL_DEFAULT_POSTER
} from '@/config/movieConfig';
import { HOME_SECTIONS } from '@/config/homeSectionsConfig';
import movieService from '@/API/services/movieService';
import upcomingMovieService from '@/API/services/upcomingMovieService';

/**
 * Normalizes movie data from various backend API formats into standard schema.
 * @param {Object} movie - Raw movie object from API.
 * @param {number} [index=0] - Item index for diversified fallback backdrops.
 * @returns {Object} Normalized movie object.
 */
const normalizeMovie = (movie, index = 0) => {
  if (!movie) return null;
  const poster = movie.poster_url && typeof movie.poster_url === 'string' && movie.poster_url.trim() !== ''
    ? (movie.poster_url.startsWith('http') ? movie.poster_url : movie.poster_url)
    : (movie.thumb_url && typeof movie.thumb_url === 'string' && movie.thumb_url.trim() !== ''
        ? movie.thumb_url
        : LOCAL_DEFAULT_POSTER);
  const thumb = movie.thumb_url && typeof movie.thumb_url === 'string' && movie.thumb_url.trim() !== ''
    ? (movie.thumb_url.startsWith('http') ? movie.thumb_url : movie.thumb_url)
    : poster;

  return {
    ...movie,
    _id: movie._id || movie.id || `movie-${index}`,
    name: movie.name || 'Phim Đang Cập Nhật',
    poster_url: poster,
    thumb_url: thumb,
    backdrop_url: resolveMovieBackdrop(movie, index)
  };
};

export const useHomeData = () => {
  // Instant initial states preventing white-flash
  const [featuredMovies, setFeaturedMovies] = useState(() =>
    mockMovies.slice(0, 5).map((m, idx) => normalizeHeroMovie(m, idx))
  );
  const [topMovies, setTopMovies] = useState(() => mockMovies.slice(4, 12));
  const [mostViewedMovies, setMostViewedMovies] = useState(() => mockMovies.slice(0, 10));
  const [upcomingMovies, setUpcomingMovies] = useState([]);
  const [upcomingLoading, setUpcomingLoading] = useState(false);
  const [upcomingLoaded, setUpcomingLoaded] = useState(false);
  const [animeSpotlightMovies, setAnimeSpotlightMovies] = useState(() => mockAnimationMovies);
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
   * Fetches hero spotlight movies via HOME_SECTIONS bundle.
   */
  const fetchHeroMovies = useCallback(async () => {
    try {
      const fallback = mockMovies.slice(0, HOME_SECTIONS.hero.limit);
      const movies = await HOME_SECTIONS.hero.load(fallback);
      if (isMountedRef.current && movies.length > 0) {
        setFeaturedMovies(movies.map((m, idx) => normalizeHeroMovie(m, idx)));
      }
    } catch {
      // Fallback is gracefully handled inside HOME_SECTIONS.hero.load
    }
  }, []);

  /**
   * Fetches Top 10 movies via HOME_SECTIONS bundle.
   */
  const fetchTop10Movies = useCallback(async () => {
    try {
      const fallback = mockMovies.slice(0, HOME_SECTIONS.top10.limit);
      const movies = await HOME_SECTIONS.top10.load(fallback);
      if (isMountedRef.current && movies.length > 0) {
        const normalized = movies.map((m, idx) => ({
          ...normalizeMovie(m, idx),
          rank: idx + 1
        }));
        setMostViewedMovies(normalized);
      }
    } catch {
      // Fallback is gracefully handled inside HOME_SECTIONS.top10.load
    }
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

      const rawMovies = await movieService.getMoviesPage(pageNumber, 24);

      if (rawMovies.length > 0 && isMountedRef.current) {
        const normalized = rawMovies.map((m, idx) => normalizeMovie(m, idx));

        if (pageNumber === 1) {
          setTopMovies(normalized.slice(0, 12));
          setLatestMovies(normalized);
        } else {
          setLatestMovies((prev) => [...prev, ...normalized]);
        }
      }
    } catch {
      // Retain existing state silently
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
        setLoadingMore(false);
      }
    }
  }, []);

  /**
   * Lazily loads upcoming movies on demand with a deliberate loading buffer.
   */
  const loadUpcoming = useCallback(async () => {
    if (upcomingLoaded || upcomingLoading) return;
    setUpcomingLoading(true);

    const startTime = Date.now();
    const MIN_LOADING_TIME = 1500;
    const MAX_TIMEOUT = 8000;

    let timeoutTriggered = false;
    const timeoutTimer = setTimeout(() => {
      timeoutTriggered = true;
    }, MAX_TIMEOUT);

    try {
      const result = await upcomingMovieService.getUpcomingMovies(1, 15);
      clearTimeout(timeoutTimer);

      if (timeoutTriggered) return;

      const elapsed = Date.now() - startTime;
      if (elapsed < MIN_LOADING_TIME) {
        await new Promise((resolve) => setTimeout(resolve, MIN_LOADING_TIME - elapsed));
      }

      if (result?.success && result.upcomingMovies?.length > 0 && isMountedRef.current) {
        setUpcomingMovies(result.upcomingMovies.map(normalizeMovie));
      } else if (isMountedRef.current) {
        setUpcomingMovies(mockMovies.slice(2, 10).map(normalizeMovie));
      }
    } catch {
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

  /**
   * Fetches Anime Spotlight movies via HOME_SECTIONS bundle.
   */
  const fetchBigSlideMovies = useCallback(async () => {
    try {
      const fallback = mockAnimationMovies.slice(0, HOME_SECTIONS.big_slide?.limit || 6);
      const movies = await HOME_SECTIONS.big_slide?.load(fallback);
      if (isMountedRef.current && Array.isArray(movies) && movies.length > 0) {
        if (movies.length < 4) {
          setAnimeSpotlightMovies([...movies, ...mockAnimationMovies.slice(movies.length)]);
        } else {
          setAnimeSpotlightMovies(movies);
        }
      }
    } catch {
      // Fallback handled gracefully
    }
  }, []);

  // Initial fetch on mount (Hero spotlight, Top 10 rail, anime spotlight, and latest movies)
  useEffect(() => {
    fetchHeroMovies();
    fetchTop10Movies();
    fetchBigSlideMovies();
    fetchLatestMovies(1, false);
  }, [fetchHeroMovies, fetchTop10Movies, fetchBigSlideMovies, fetchLatestMovies]);

  /**
   * Loads the next batch of movies for infinite scrolling.
   */
  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);

    try {
      const nextPage = page + 1;
      const rawMovies = await movieService.getMoviesPage(nextPage, 24);

      if (rawMovies && rawMovies.length > 0 && isMountedRef.current) {
        const normalized = rawMovies.map((m, idx) => normalizeMovie(m, idx));
        setLatestMovies((prev) => [...prev, ...normalized]);
        setPage(nextPage);
      } else if (isMountedRef.current) {
        setHasMore(false);
      }
    } catch {
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
    animeSpotlightMovies,
    latestMovies,
    loading,
    loadingMore,
    hasMore,
    page,
    loadMore,
    fetchHeroMovies,
    fetchTop10Movies,
    fetchBigSlideMovies,
    fetchMostViewed: fetchTop10Movies
  };
};

export default useHomeData;
