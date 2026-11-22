/**
 * @file format.types.ts
 * @description Domain types and DTOs for the movie format listing feature.
 * Strictly typed with zero `any` usage.
 */

export type RawMovie = Record<string, unknown>;

export interface FormatMovieCategoryDto {
  id?: string;
  slug?: string;
  name?: string;
}

export interface FormatMovieItem {
  id: string;
  slug: string;
  name: string;
  originName: string;
  trailerUrl?: string | null;
  posterUrl: string;
  thumbUrl: string;
  quality: string;
  lang: string;
  episodeCurrent?: string | null;
  status?: string | null;
  year?: number | null;
  duration?: string | number | null;
  vote_average?: number | null;
  rating?: number | null;
  category?: FormatMovieCategoryDto[];
  [key: string]: unknown;
}

export interface FormatMoviesPaginationPayload {
  data: FormatMovieItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export interface FormatMoviesApiResponse {
  requestTrace: string;
  responseDateTime: string;
  responseStatus: {
    responseCode: string;
    responseMessage: string;
  };
  responseData: FormatMoviesPaginationPayload;
}

export interface FormatPaginationInfo {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  limit: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export type FormatSortOption =
  | 'newest'
  | 'oldest'
  | 'highest-rating'
  | 'lowest-rating'
  | 'a-z'
  | 'z-a'
  | 'year-desc'
  | 'year-asc';

export interface FormatQueryParams {
  slug: string;
  page?: number;
  limit?: number;
  sort?: FormatSortOption;
  year?: string;
  category?: string;
}
