/**
 * @file genre.types.ts
 * @description Domain models, filter parameters, and pagination types for the Genre/Category feature.
 */

export type GenreFormatFilter = 'all' | 'single' | 'series';

export type GenreSortOption = 'newest' | 'highest-rating' | 'year-desc' | 'a-z';

/**
 * Normalized movie item representation used across genre pages, cards, and trailer player.
 */
export interface GenreMovieItem {
  _id?: string;
  id?: string;
  slug: string;
  name: string;
  origin_name?: string;
  poster_url?: string;
  thumb_url?: string;
  year?: number | string;
  quality?: string;
  lang?: string;
  rating?: number;
  vote_average?: number;
  type?: 'single' | 'series' | string;
  episode_current?: string;
  episode_total?: string;
  time?: string;
  view?: number;
  content?: string;
  trailer_url?: string;
  trailerUrl?: string;
  video_url?: string;
  tmdb?: {
    vote_average?: number;
    trailer_url?: string;
    trailer?: { key?: string; site?: string; name?: string; url?: string };
  };
  episodes?: Array<{ server_data?: Array<{ name?: string }> }>;
  [key: string]: unknown;
}

/**
 * Query parameters for fetching genre movies.
 */
export interface GenreQueryParams {
  slug: string;
  page?: number;
  limit?: number;
  formatType?: GenreFormatFilter;
  sort?: GenreSortOption;
}

/**
 * Standard paginated response envelope for genre movies.
 */
export interface GenrePaginatedResponse {
  items: GenreMovieItem[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
  source?: 'api' | 'search' | 'fallback';
}

/**
 * Thematic aesthetic configuration for each specific genre banner.
 */
export interface GenreThemeConfig {
  slug: string;
  title: string;
  badge: string;
  tagline: string;
  accentColor: string;
  gradient: string;
  glowColor: string;
  searchKeyword?: string;
}
