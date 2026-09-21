/**
 * @file movieFallbackConfig.js
 * @description Centralized fallback configuration and defensive data normalizers for movies.
 * Ensures the Frontend remains visually stunning, layout-stable, and 100% operational
 * even if the Backend returns empty, partial, or missing fields (e.g. during seeding, migration, or cold start).
 */

/**
 * High-definition, lightweight Cinema Backdrops hosted on global CDN (0 bytes added to Git).
 * Used when the backend movie database does not yet have 'backdrop_url' or 'poster_url' populated.
 */
export const HERO_FALLBACK_BACKDROPS = [
  'https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=1920&auto=format&fit=crop', // Cinema theater atmosphere
  'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=1920&auto=format&fit=crop', // Sci-fi neon cyber aesthetic
  'https://images.unsplash.com/photo-1574267432553-4b4628081c31?q=80&w=1920&auto=format&fit=crop', // Dramatic cinema projector
  'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?q=80&w=1920&auto=format&fit=crop', // Fantasy anime gaming vista
  'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=1920&auto=format&fit=crop'  // Classic movie theater auditorium
];

/**
 * Local fallback backdrop stored inside the repository public assets.
 */
export const LOCAL_DEFAULT_BACKDROP = '/img/background/movies-wall.jpg';

/**
 * Local fallback poster stored inside the repository public assets.
 */
export const LOCAL_DEFAULT_POSTER = '/img/Phim.png';

/**
 * Standard default values when backend attributes are null, undefined, or empty strings.
 */
export const MOVIE_FALLBACK_DEFAULTS = {
  // Default release year when server returns empty string
  year: new Date().getFullYear(),

  // Default video resolution label
  quality: 'FHD',

  // Default rating score when tmdb.vote_average or rating is 0 / missing
  rating: '8.6',

  // Default localized summary text when description / content is missing
  description: 'Khám phá ngay bộ phim hấp dẫn với chất lượng hình ảnh sắc nét, âm thanh sống động và trải nghiệm điện ảnh đỉnh cao.',

  // Default origin/sub-title fallback rule
  // When origin_name is empty, the UI falls back to movie.name to prevent layout collapse
  useNameAsSubTitle: true
};

/**
 * Safely resolves the best available backdrop or poster URL for a movie.
 * Hierarchy: backdrop_url -> poster_url -> thumb_url -> index-based CDN backdrop -> local default.
 *
 * @param {Object} [movie] - Raw movie object from backend API.
 * @param {number} [fallbackIndex=0] - Index used to select diverse backdrops for carousel slides.
 * @returns {string} Validated image URL.
 */
export const resolveMovieBackdrop = (movie, fallbackIndex = 0) => {
  if (!movie) return LOCAL_DEFAULT_BACKDROP;

  // 1. Valid non-empty server-provided backdrop
  if (movie.backdrop_url && typeof movie.backdrop_url === 'string' && movie.backdrop_url.trim() !== '') {
    return movie.backdrop_url.trim();
  }

  // 2. Valid non-empty server-provided poster
  if (movie.poster_url && typeof movie.poster_url === 'string' && movie.poster_url.trim() !== '') {
    return movie.poster_url.trim();
  }

  // 3. Valid non-empty server-provided thumbnail
  if (movie.thumb_url && typeof movie.thumb_url === 'string' && movie.thumb_url.trim() !== '') {
    return movie.thumb_url.trim();
  }

  // 4. Elegant CDN Cinema Backdrop fallback
  const cdnIndex = Math.abs(fallbackIndex) % HERO_FALLBACK_BACKDROPS.length;
  return HERO_FALLBACK_BACKDROPS[cdnIndex] || LOCAL_DEFAULT_BACKDROP;
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

  // Fallback: reuse movie.name if available, otherwise safe non-breaking space
  return movie.name || '\u00A0';
};

/**
 * Safely resolves movie categories.
 * If backend category array is empty, dynamically synthesizes informative badges
 * based on available properties ('type' and 'lang').
 *
 * @param {Object} [movie] - Movie object.
 * @returns {Array<{ name: string, slug: string }>} Array of category items.
 */
export const resolveMovieCategories = (movie) => {
  if (movie?.category && Array.isArray(movie.category) && movie.category.length > 0) {
    return movie.category;
  }

  const synthesized = [];

  // Synthesize category from movie type
  if (movie?.type === 'series') {
    synthesized.push({ name: 'Phim Bộ Đặc Sắc', slug: 'phim-bo' });
  } else {
    synthesized.push({ name: 'Phim Lẻ Chiếu Rạp', slug: 'phim-le' });
  }

  // Synthesize category from language format
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
