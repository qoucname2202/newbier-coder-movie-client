/**
 * @file movieNormalizer.js
 * @description Defensive data transformers and normalizers for movie entities.
 * Ensures consistent object shapes and prevents layout breaks across all UI components.
 */

import {
  LOCAL_DEFAULT_BACKDROP,
  LOCAL_DEFAULT_POSTER,
  MOVIE_FALLBACK_DEFAULTS
} from '@/config/movieFallbackConfig';

/**
 * Safely resolves the best available backdrop or poster URL for a movie.
 * Hierarchy: backdrop_url -> poster_url -> thumb_url -> OS-style placeholder SVG.
 *
 * @param {Object} [movie] - Raw movie object from backend API.
 * @param {number} [fallbackIndex=0] - Index parameter preserved for signature compatibility.
 * @returns {string} Validated image URL.
 */
export const resolveMovieBackdrop = (movie, fallbackIndex = 0) => {
  if (!movie) return LOCAL_DEFAULT_BACKDROP;

  if (movie.backdrop_url && typeof movie.backdrop_url === 'string' && movie.backdrop_url.trim() !== '') {
    return movie.backdrop_url.trim();
  }

  if (movie.poster_url && typeof movie.poster_url === 'string' && movie.poster_url.trim() !== '') {
    return movie.poster_url.trim();
  }

  if (movie.thumb_url && typeof movie.thumb_url === 'string' && movie.thumb_url.trim() !== '') {
    return movie.thumb_url.trim();
  }

  return LOCAL_DEFAULT_BACKDROP;
};

/**
 * Safely resolves the subtitle / original title.
 * Prevents baseline height jumps if the server has not populated origin_name yet.
 *
 * @param {Object} [movie] - Movie object.
 * @returns {string} Subtitle text or duplicate of movie.name.
 */
export const resolveMovieSubTitle = (movie) => {
  if (!movie) return '\u00A0';

  if (movie.origin_name && typeof movie.origin_name === 'string' && movie.origin_name.trim() !== '') {
    return movie.origin_name.trim();
  }

  return movie.name || '\u00A0';
};

/**
 * Safely resolves movie categories.
 * If backend category array is empty, dynamically synthesizes informative badges.
 *
 * @param {Object} [movie] - Movie object.
 * @returns {Array<{ name: string, slug: string }>} Array of category items.
 */
export const resolveMovieCategories = (movie) => {
  if (movie?.category && Array.isArray(movie.category) && movie.category.length > 0) {
    return movie.category;
  }

  const synthesized = [];

  if (movie?.type === 'series') {
    synthesized.push({ name: 'Phim Bộ Đặc Sắc', slug: 'phim-bo' });
  } else {
    synthesized.push({ name: 'Phim Lẻ Chiếu Rạp', slug: 'phim-le' });
  }

  if (movie?.lang && typeof movie.lang === 'string') {
    synthesized.push({ name: movie.lang, slug: 'ngon-ngu' });
  } else {
    synthesized.push({ name: 'Thịnh Hành', slug: 'thinh-hanh' });
  }

  return synthesized;
};

/**
 * Safely resolves movie release year.
 *
 * @param {Object} [movie] - Movie object.
 * @returns {string|number} Validated year.
 */
export const resolveMovieYear = (movie) => {
  if (movie?.year && String(movie.year).trim() !== '') {
    return movie.year;
  }
  return MOVIE_FALLBACK_DEFAULTS.year;
};

/**
 * Safely resolves movie video quality label.
 *
 * @param {Object} [movie] - Movie object.
 * @returns {string} Standardized quality label.
 */
export const resolveMovieQuality = (movie) => {
  if (movie?.quality && typeof movie.quality === 'string' && movie.quality.trim() !== '') {
    return movie.quality.trim() === '4K' ? '4K Ultra HD' : movie.quality.trim();
  }
  return MOVIE_FALLBACK_DEFAULTS.quality;
};

/**
 * Master Defensive Normalizer for Hero Spotlight Movies.
 * Merges raw server data with safe fallbacks to produce a 100% resilient movie schema.
 *
 * @param {Object} rawMovie - Raw movie object directly from Backend API.
 * @param {number} [index=0] - Carousel slide index.
 * @returns {Object} Fully normalized, battle-tested movie object.
 */
export const normalizeHeroMovie = (rawMovie, index = 0) => {
  if (!rawMovie) return null;

  return {
    ...rawMovie,
    _id: rawMovie._id || rawMovie.id || `hero-${index}`,
    name: rawMovie.name || 'Phim Đang Cập Nhật',
    origin_name: resolveMovieSubTitle(rawMovie),
    backdrop_url: resolveMovieBackdrop(rawMovie, index),
    poster_url: rawMovie.poster_url || rawMovie.thumb_url || LOCAL_DEFAULT_POSTER,
    thumb_url: rawMovie.thumb_url || rawMovie.poster_url || LOCAL_DEFAULT_POSTER,
    year: resolveMovieYear(rawMovie),
    quality: resolveMovieQuality(rawMovie),
    category: resolveMovieCategories(rawMovie),
    content: rawMovie.content || rawMovie.description || MOVIE_FALLBACK_DEFAULTS.description,
    rating: rawMovie.vote_average || rawMovie.rating || rawMovie.tmdb?.vote_average || MOVIE_FALLBACK_DEFAULTS.rating,
    time: rawMovie.time || (rawMovie.type === 'series' ? '45 phút/tập' : '110 phút'),
    lang: rawMovie.lang || 'Vietsub'
  };
};

/**
 * Safely resolves actors array with rich profiles.
 *
 * @param {Object} [movie] - Movie object.
 * @returns {Array<Object>} Array of actor objects { name, role, avatar_url, slug }.
 */
export const resolveMovieActors = (movie) => {
  if (!movie) return [];

  if (Array.isArray(movie.actor) && movie.actor.length > 0) {
    return movie.actor.map((a, i) => (
      typeof a === 'string'
        ? { name: a.trim(), role: 'Diễn viên', slug: `actor-${i}` }
        : { ...a, role: a.role || 'Diễn viên' }
    ));
  }
  if (typeof movie.actor === 'string' && movie.actor.trim() !== '') {
    return movie.actor.split(',').map((name, i) => ({
      name: name.trim(),
      role: 'Diễn viên',
      slug: `actor-${i}`
    }));
  }

  return [];
};

/**
 * Safely resolves directors array.
 *
 * @param {Object} [movie] - Movie object.
 * @returns {Array<Object>} Array of director objects.
 */
export const resolveMovieDirectors = (movie) => {
  if (!movie) return [];

  if (Array.isArray(movie.director) && movie.director.length > 0) {
    return movie.director.map((d, i) => (
      typeof d === 'string'
        ? { name: d.trim(), role: 'Đạo diễn', slug: `director-${i}` }
        : { ...d, role: d.role || 'Đạo diễn' }
    )).filter((d) => d.name);
  }
  if (typeof movie.director === 'string' && movie.director.trim() !== '') {
    return movie.director.split(',').map((name, i) => ({
      name: name.trim(),
      role: 'Đạo diễn',
      slug: `director-${i}`
    })).filter((d) => d.name);
  }

  return [];
};
