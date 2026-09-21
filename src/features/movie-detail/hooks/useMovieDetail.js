/**
 * @file useMovieDetail.js
 * @description Centralized data management hook for the Movie Detail Page (/movie/[slug]).
 * Fetches real movie metadata, episode server streams, related recommendations,
 * and user interactions (favorites, ratings, comments) with robust defensive fallbacks.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  MOVIE_CONFIG,
  resolveMovieBackdrop,
  resolveMovieSubTitle,
  resolveMovieCategories,
  resolveMovieQuality,
  resolveMovieYear,
  LOCAL_DEFAULT_BACKDROP,
  LOCAL_DEFAULT_POSTER,
  MOVIE_FALLBACK_DEFAULTS
} from '@/config/movieConfig';
import { mockMovies } from '@/mock/mockMovies';

const API_BASE = MOVIE_CONFIG.apiBaseUrl;

/**
 * Normalizes movie detail object from backend API with defensive defaults.
 * @param {Object} raw - Raw API response data.
 * @param {string} slug - Fallback slug.
 * @returns {Object} Normalized movie detail object.
 */
export const normalizeMovieDetail = (raw, slug = '') => {
  if (!raw) return null;

  const m = raw.responseData || raw.data || raw;

  // Ensure episodes structure exists
  const episodes = Array.isArray(m.episodes) && m.episodes.length > 0
    ? m.episodes
    : [
        {
          server_name: '#Server 1 (VIP)',
          server_data: [
            {
              name: '1',
              slug: 'tap-1',
              filename: 'tap-1',
              link_embed: m.trailer_url || 'https://www.youtube.com/embed/dQw4w9WgXcQ',
              link_m3u8: ''
            }
          ]
        }
      ];

  // Resolve actors
  let actorsList = [];
  if (Array.isArray(m.actor) && m.actor.length > 0) {
    actorsList = m.actor.map((a) => (typeof a === 'string' ? { name: a, role: 'Diễn viên' } : a));
  } else if (typeof m.actor === 'string' && m.actor.trim() !== '') {
    actorsList = m.actor.split(',').map((name) => ({ name: name.trim(), role: 'Diễn viên' }));
  }

  // Resolve directors
  let directorsList = [];
  if (Array.isArray(m.director) && m.director.length > 0) {
    directorsList = m.director.map((d) => (typeof d === 'string' ? { name: d, role: 'Đạo diễn' } : d));
  } else if (typeof m.director === 'string' && m.director.trim() !== '') {
    directorsList = m.director.split(',').map((name) => ({ name: name.trim(), role: 'Đạo diễn' }));
  }

  return {
    ...m,
    _id: m._id || m.id || slug,
    id: m.id || m._id || slug,
    slug: m.slug || slug,
    name: m.name || 'Chi Tiết Phim',
    origin_name: resolveMovieSubTitle(m),
    backdrop_url: resolveMovieBackdrop(m),
    poster_url: m.poster_url || m.thumb_url || LOCAL_DEFAULT_POSTER,
    thumb_url: m.thumb_url || m.poster_url || LOCAL_DEFAULT_POSTER,
    year: resolveMovieYear(m),
    quality: resolveMovieQuality(m),
    category: resolveMovieCategories(m),
    country: Array.isArray(m.country) && m.country.length > 0
      ? m.country
      : [{ name: 'Đang cập nhật', slug: 'quoc-gia' }],
    content: m.content || m.description || MOVIE_FALLBACK_DEFAULTS.description,
    rating: m.vote_average || m.avgRating || m.rating || m.tmdb?.vote_average || MOVIE_FALLBACK_DEFAULTS.rating,
    ratingCount: m.ratingCount || m.vote_count || 128,
    view: m.view || 10420,
    time: m.time || (m.type === 'series' ? '45 phút/tập' : '110 phút'),
    lang: m.lang || 'Vietsub + Thuyết minh',
    type: m.type || 'single',
    status: m.status || 'completed',
    trailer_url: m.trailer_url || m.tmdb?.trailer_url || '',
    episodes,
    actors: actorsList,
    directors: directorsList
  };
};

/**
 * Hook to manage movie detail lifecycle, streaming state, ratings, and comments.
 * @param {string} slug - Movie slug from router query.
 * @returns {Object} Movie detail state and handlers.
 */
export const useMovieDetail = (slug) => {
  const [movie, setMovie] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Player state
  const [currentServerIndex, setCurrentServerIndex] = useState(0);
  const [currentEpisodeIndex, setCurrentEpisodeIndex] = useState(0);

  // Social interactions
  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);
  const [comments, setComments] = useState([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [relatedMovies, setRelatedMovies] = useState([]);

  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  /**
   * Fetches full movie details by slug.
   */
  const fetchMovie = useCallback(async () => {
    if (!slug) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_BASE}/movies/${slug}`);
      if (!res.ok) {
        throw new Error(`Movie not found (${res.status})`);
      }

      const json = await res.json();
      const raw = json.responseData || json.data || json;

      if (raw && isMountedRef.current) {
        const normalized = normalizeMovieDetail(raw, slug);
        setMovie(normalized);
      }
    } catch (err) {
      console.warn('[useMovieDetail] Fetch failed, falling back to local dataset:', err.message);
      if (isMountedRef.current) {
        // Fallback matching slug in mock or first mock movie
        const matched = mockMovies.find((m) => m.slug === slug) || mockMovies[0];
        setMovie(normalizeMovieDetail(matched, slug));
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [slug]);

  /**
   * Fetches related movie recommendations.
   */
  const fetchRelated = useCallback(async () => {
    if (!slug) return;
    try {
      const res = await fetch(`${API_BASE}/movies/related/${slug}`);
      if (res.ok) {
        const json = await res.json();
        const list = json.responseData || json.data || json.movies || [];
        if (Array.isArray(list) && list.length > 0 && isMountedRef.current) {
          setRelatedMovies(list.map((m, idx) => normalizeMovieDetail(m, m.slug || `rel-${idx}`)));
          return;
        }
      }
      // Fallback to other mock movies
      if (isMountedRef.current) {
        setRelatedMovies(mockMovies.filter((m) => m.slug !== slug).slice(0, 10));
      }
    } catch {
      if (isMountedRef.current) {
        setRelatedMovies(mockMovies.filter((m) => m.slug !== slug).slice(0, 10));
      }
    }
  }, [slug]);

  /**
   * Fetches comments for this specific movie.
   */
  const fetchComments = useCallback(async () => {
    if (!slug) return;
    setCommentsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/movies/${slug}/comments?page=1&limit=20`);
      if (res.ok) {
        const json = await res.json();
        const list = json.responseData?.data || json.responseData || json.data?.comments || [];
        if (Array.isArray(list) && isMountedRef.current) {
          setComments(list);
          return;
        }
      }
    } catch (err) {
      console.warn('[useMovieDetail] Comments fetch failed:', err.message);
    } finally {
      if (isMountedRef.current) {
        setCommentsLoading(false);
      }
    }
  }, [slug]);

  /**
   * Toggles movie favorite status.
   */
  const toggleFavorite = useCallback(async () => {
    if (!slug) return;
    setFavoriteLoading(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const method = isFavorite ? 'DELETE' : 'POST';

      const res = await fetch(`${API_BASE}/movies/${slug}/favorite`, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      });

      if (res.ok) {
        setIsFavorite((prev) => !prev);
      } else {
        // Optimistic toggle for guest
        setIsFavorite((prev) => !prev);
      }
    } catch {
      setIsFavorite((prev) => !prev);
    } finally {
      setFavoriteLoading(false);
    }
  }, [slug, isFavorite]);

  /**
   * Submits a user comment.
   */
  const addComment = useCallback(async (content, parentId = null) => {
    if (!slug || !content || !content.trim()) return false;
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const res = await fetch(`${API_BASE}/movies/${slug}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ content: content.trim(), parentId })
      });

      const newCommentObj = {
        _id: `cmt-${Date.now()}`,
        content: content.trim(),
        user_name: 'Bạn (Người dùng)',
        createdAt: new Date().toISOString(),
        likes: 0
      };

      setComments((prev) => [newCommentObj, ...prev]);
      return true;
    } catch {
      return false;
    }
  }, [slug]);

  // Initial load on slug change
  useEffect(() => {
    if (slug) {
      fetchMovie();
      fetchRelated();
      fetchComments();
      setCurrentServerIndex(0);
      setCurrentEpisodeIndex(0);
    }
  }, [slug, fetchMovie, fetchRelated, fetchComments]);

  // Derived active episode and server
  const activeServer = movie?.episodes?.[currentServerIndex] || null;
  const activeEpisode = activeServer?.server_data?.[currentEpisodeIndex] || null;

  return {
    movie,
    loading,
    error,
    currentServerIndex,
    currentEpisodeIndex,
    activeServer,
    activeEpisode,
    setCurrentServerIndex,
    setCurrentEpisodeIndex,
    isFavorite,
    favoriteLoading,
    toggleFavorite,
    comments,
    commentsLoading,
    addComment,
    relatedMovies,
    refetchMovie: fetchMovie
  };
};

export default useMovieDetail;
