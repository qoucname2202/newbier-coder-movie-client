/**
 * @file country.types.ts
 * @description Strongly-typed domain and DTO models for the Country client feature.
 */

/**
 * Standard RawMovie loosely typed dictionary representing movie payloads.
 */
export type RawMovie = Record<string, unknown>;

/**
 * Category / Genre reference embedded in movie entities.
 */
export interface MovieCategoryDto {
  name: string;
  slug: string;
}

/**
 * Strongly typed Movie item returned by /api/v1/countries/{slug}/movies.
 */
export interface CountryMovieItem {
  id: string;
  slug: string;
  name: string;
  originName?: string;
  type?: 'series' | 'single' | string;
  status?: 'ongoing' | 'completed' | string;
  isCinemaMovie?: boolean;
  trailerUrl?: string;
  posterUrl: string;
  thumbUrl?: string;
  quality?: string;
  lang?: string;
  episodeCurrent?: string;
  year?: number | string;
  category?: MovieCategoryDto[];
  [key: string]: unknown;
}

/**
 * Standard Country entity representation in the client application.
 */
export interface CountryEntity {
  id: string;
  name: string;
  slug: string;
  code?: string;
  description?: string;
  isActive: boolean;
  movieCount?: number;
  badge?: string;
  href?: string;
  [key: string]: unknown;
}

/**
 * Standard upstream pagination response payload for Country movies.
 */
export interface CountryMoviesApiResponseData {
  data: CountryMovieItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext?: boolean;
  hasPrevious?: boolean;
}

export interface CountryMoviesApiResponse {
  requestTrace?: string;
  responseDateTime?: string;
  responseStatus?: {
    responseCode: string;
    responseMessage: string;
  };
  responseData: CountryMoviesApiResponseData;
}

/**
 * Pagination metadata returned by the upstream backend or fallback calculators.
 */
export interface PaginationMeta {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
}

/**
 * Filter parameters supported by the Country Movies listing page.
 */
export interface CountryFilterParams {
  page?: number;
  limit?: number;
  sort?: CountrySortOption;
  year?: string;
}

/**
 * Allowed sort criteria for country movies.
 */
export type CountrySortOption = 'moi-nhat' | 'xem-nhieu' | 'danh-gia' | 'nam-phat-hanh';

/**
 * Unified return shape for the country movies query.
 */
export interface CountryMoviesResult {
  movies: (CountryMovieItem | RawMovie)[];
  pagination: PaginationMeta;
  countryName: string;
}
