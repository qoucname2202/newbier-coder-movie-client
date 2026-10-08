/**
 * @file movieFallbackConfig.js
 * @description Declarative Fallback Constants for Movies & Media.
 * Pure configuration only: no imperative transformation logic.
 * Normalizers are cleanly delegated to '@/utils/movieNormalizer'.
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
 * Meticulously designed OS-style missing image / media placeholder (16:9).
 */
export const LOCAL_DEFAULT_BACKDROP = '/img/placeholder-backdrop.svg';

/**
 * Local fallback poster stored inside the repository public assets.
 * Meticulously designed OS-style missing image / media placeholder (2:3).
 */
export const LOCAL_DEFAULT_POSTER = '/img/placeholder-poster.svg';

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

// Re-export normalizer utilities from their dedicated domain in '@/utils/movieNormalizer'
// to ensure seamless backward compatibility across all existing imports.
export {
  resolveMovieBackdrop,
  resolveMovieSubTitle,
  resolveMovieCategories,
  resolveMovieYear,
  resolveMovieQuality,
  normalizeHeroMovie,
  resolveMovieActors,
  resolveMovieDirectors
} from '@/utils/movieNormalizer';
