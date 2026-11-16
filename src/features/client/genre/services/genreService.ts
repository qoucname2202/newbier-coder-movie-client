/**
 * @file genreService.ts
 * @description Enterprise-grade data service for Genre movies with multi-tier fallback,
 * pagination normalization, image aliasing, and resilient error recovery.
 */

import { GenreMovieItem, GenrePaginatedResponse, GenreQueryParams } from '../types/genre.types';
import { resolveCategoryTaxonomy } from '@/config/taxonomyConfig';
import { apiUrl, apiPath } from '@/config/apiPaths';
import { pickMovieImage } from '@/utils/imageSource';
import { safeFetchJson, extractMovieList, RawMovie } from '@/API/services/movieService';
import { LOCAL_DEFAULT_POSTER } from '@/config/movieFallbackConfig';
import { GENRE_PAGE_SIZE } from '../constants/genreThemeConstants';

/**
 * Normalizes an arbitrary backend movie entity into a clean `GenreMovieItem`.
 * Guarantees poster/thumb fallbacks and camelCase/snake_case interoperability.
 *
 * @param raw - Unparsed movie object from API or fallback
 * @returns Clean GenreMovieItem
 */
export function normalizeGenreMovie(raw: Record<string, unknown>): GenreMovieItem {
  const poster = pickMovieImage(raw, 'poster', '') || (raw.poster_url as string) || (raw.posterUrl as string) || '';
  const thumb = pickMovieImage(raw, 'thumb', '') || (raw.thumb_url as string) || (raw.thumbUrl as string) || '';

  const id = String(raw._id || raw.id || '');
  const slug = String(raw.slug || id);
  const name = String(raw.name || raw.title || 'Phim Chưa Đặt Tên');
  const originName = (raw.origin_name as string) || (raw.originName as string) || '';

  // Extract rating
  const rawRating = raw.rating ?? raw.vote_average ?? (raw.tmdb as { vote_average?: number })?.vote_average;
  const rating = typeof rawRating === 'number' ? rawRating : Number(rawRating) || 8.5;

  // Extract year
  const rawYear = raw.year ?? (raw.release_date as string)?.slice(0, 4);
  const year = typeof rawYear === 'number' || typeof rawYear === 'string' ? rawYear : 2024;

  // Extract format type
  const type = (raw.type as string) || (raw.episode_current || (raw.episodes as unknown[])?.length ? 'series' : 'single');

  // Extract episodes info
  const episodeCurrent = (raw.episode_current as string) || (raw.episodeCurrent as string) || (raw.episodes as unknown[])?.length ? `Tập ${(raw.episodes as unknown[])?.length}` : undefined;
  const episodeTotal = (raw.episode_total as string) || (raw.episodeTotal as string) || undefined;

  // Extract trailer info
  const trailerUrl = (raw.trailer_url as string) || (raw.trailerUrl as string) || (raw.video_url as string) || undefined;

  return {
    _id: id,
    id,
    slug,
    name,
    origin_name: originName,
    poster_url: poster || thumb || LOCAL_DEFAULT_POSTER,
    thumb_url: thumb || poster || LOCAL_DEFAULT_POSTER,
    year,
    quality: (raw.quality as string) || 'FHD',
    lang: (raw.lang as string) || (raw.language as string) || 'Vietsub',
    rating,
    vote_average: rating,
    type,
    episode_current: episodeCurrent,
    episode_total: episodeTotal,
    time: (raw.time as string) || '120 phút',
    view: Number(raw.view || raw.views || 0),
    content: (raw.content as string) || (raw.description as string) || '',
    trailer_url: trailerUrl,
    trailerUrl,
    tmdb: raw.tmdb as GenreMovieItem['tmdb'],
    episodes: raw.episodes as GenreMovieItem['episodes']
  };
}

/**
 * Client-side sorter for fallback or unpaginated movie arrays.
 */
function sortMovieList(list: GenreMovieItem[], sort?: string): GenreMovieItem[] {
  const cloned = [...list];
  switch (sort) {
    case 'highest-rating':
      return cloned.sort((a, b) => (Number(b.rating || 0)) - (Number(a.rating || 0)));
    case 'year-desc':
      return cloned.sort((a, b) => (Number(b.year || 0)) - (Number(a.year || 0)));
    case 'a-z':
      return cloned.sort((a, b) => (a.name || '').localeCompare(b.name || '', 'vi'));
    case 'newest':
    default:
      return cloned;
  }
}

/**
 * Filter movie list by format type ('single' | 'series').
 */
function filterMovieListByType(list: GenreMovieItem[], formatType?: string): GenreMovieItem[] {
  if (!formatType || formatType === 'all') return list;
  return list.filter((m) => {
    const isSeries = m.type === 'series' || Boolean(m.episode_total && m.episode_total !== '1');
    return formatType === 'series' ? isSeries : !isSeries;
  });
}

/**
 * Genre service interface.
 */
export interface IGenreService {
  fetchGenreMovies(params: GenreQueryParams, signal?: AbortSignal): Promise<GenrePaginatedResponse>;
}

export class GenreService implements IGenreService {
  /**
   * Fetches paginated movies belonging to a specific genre/category.
   * Utilizes a multi-tier fallback architecture:
   * Tier 1: Unified search endpoint `/movies/search` with category & pagination parameters
   * Tier 2: Category movies endpoint `/categories/{slug}/movies`
   * Tier 3: Keyword search endpoint `/movies/search?q={searchKeyword}`
   *
   * @param params - Query parameters including slug, page, limit, formatType, and sort
   * @param signal - Optional AbortSignal for request cancellation
   * @returns Standardized GenrePaginatedResponse
   */
  async fetchGenreMovies(params: GenreQueryParams, signal?: AbortSignal): Promise<GenrePaginatedResponse> {
    const { slug, page = 1, limit = GENRE_PAGE_SIZE, formatType = 'all', sort = 'newest' } = params;

    if (!slug) {
      return { items: [], total: 0, page, limit, hasMore: false, source: 'fallback' };
    }

    const taxonomy = resolveCategoryTaxonomy(slug);
    const backendCandidates: string[] = taxonomy?.backendSlugs && taxonomy.backendSlugs.length > 0
      ? taxonomy.backendSlugs
      : [slug];

    // -------------------------------------------------------------------------
    // Tier 1: Query `/movies/search` with category parameter
    // -------------------------------------------------------------------------
    for (const backendSlug of backendCandidates) {
      try {
        const queryParams = new URLSearchParams();
        queryParams.append('q', '');
        queryParams.append('page', String(page));
        queryParams.append('size', String(limit));
        queryParams.append('category', backendSlug);

        if (formatType && formatType !== 'all') {
          queryParams.append('type', formatType);
        }
        if (sort) {
          queryParams.append('sort', sort);
        }

        const endpoint = `${apiUrl('moviesSearch')}?${queryParams.toString()}`;
        const searchEnvelope = await safeFetchJson<Record<string, unknown>>(endpoint, { signal }, null);

        if (searchEnvelope) {
          const rawItems = extractMovieList(searchEnvelope) || (searchEnvelope.hits as RawMovie[]) || [];
          if (Array.isArray(rawItems) && rawItems.length > 0) {
            const normalizedItems = rawItems.map((item) => normalizeGenreMovie(item as Record<string, unknown>));

            const total = Number(
              searchEnvelope.total ||
              (searchEnvelope.responseData as { total?: number })?.total ||
              (searchEnvelope.data as { total?: number })?.total ||
              (page * limit + (rawItems.length === limit ? limit : 0))
            );

            const hasMore = rawItems.length >= limit && (total ? page * limit < total : true);

            return {
              items: normalizedItems,
              total: Math.max(total, normalizedItems.length),
              page,
              limit,
              hasMore,
              source: 'api'
            };
          }
        }
      } catch (err) {
        if ((err as Error)?.name === 'AbortError') throw err;
        // Continue to next tier on non-abort failure
      }
    }

    // -------------------------------------------------------------------------
    // Tier 2: Query `/categories/{slug}/movies`
    // -------------------------------------------------------------------------
    for (const backendSlug of backendCandidates) {
      try {
        const categoryEndpoint = `${apiPath('categoriesBySlugMovies', encodeURIComponent(backendSlug))}?page=${page}&limit=${limit}`;
        const rawEnvelope = await safeFetchJson<Record<string, unknown>>(categoryEndpoint, { signal }, null);

        if (rawEnvelope) {
          const rawItems = extractMovieList(rawEnvelope) || [];
          if (Array.isArray(rawItems) && rawItems.length > 0) {
            let normalized = rawItems.map((item) => normalizeGenreMovie(item as Record<string, unknown>));

            // Apply client-side filters if the category endpoint doesn't support them natively
            normalized = filterMovieListByType(normalized, formatType);
            normalized = sortMovieList(normalized, sort);

            // Handle client-side pagination slicing if backend returned unpaginated list
            const isFullList = rawItems.length > limit;
            const paginatedItems = isFullList
              ? normalized.slice((page - 1) * limit, page * limit)
              : normalized;

            const total = isFullList ? normalized.length : Math.max(rawItems.length, page * limit);
            const hasMore = isFullList ? (page * limit < total) : rawItems.length >= limit;

            return {
              items: paginatedItems,
              total,
              page,
              limit,
              hasMore,
              source: 'api'
            };
          }
        }
      } catch (err) {
        if ((err as Error)?.name === 'AbortError') throw err;
      }
    }

    // -------------------------------------------------------------------------
    // Tier 3: Search by keyword fallback
    // -------------------------------------------------------------------------
    const keyword = taxonomy?.searchKeyword || slug.replace(/-/g, ' ');
    if (keyword) {
      try {
        const queryParams = new URLSearchParams();
        queryParams.append('q', keyword);
        queryParams.append('page', String(page));
        queryParams.append('size', String(limit));
        if (formatType && formatType !== 'all') {
          queryParams.append('type', formatType);
        }
        if (sort) {
          queryParams.append('sort', sort);
        }

        const endpoint = `${apiUrl('moviesSearch')}?${queryParams.toString()}`;
        const searchEnvelope = await safeFetchJson<Record<string, unknown>>(endpoint, { signal }, null);

        if (searchEnvelope) {
          const rawItems = extractMovieList(searchEnvelope) || (searchEnvelope.hits as RawMovie[]) || [];
          if (Array.isArray(rawItems) && rawItems.length > 0) {
            const normalizedItems = rawItems.map((item) => normalizeGenreMovie(item as Record<string, unknown>));
            const total = Number(searchEnvelope.total || normalizedItems.length);
            const hasMore = rawItems.length >= limit && (page * limit < total);

            return {
              items: normalizedItems,
              total,
              page,
              limit,
              hasMore,
              source: 'search'
            };
          }
        }
      } catch (err) {
        if ((err as Error)?.name === 'AbortError') throw err;
      }
    }

    // Default empty envelope
    return {
      items: [],
      total: 0,
      page,
      limit,
      hasMore: false,
      source: 'fallback'
    };
  }
}

export const genreService = new GenreService();
