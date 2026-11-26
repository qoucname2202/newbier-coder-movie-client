/**
 * @file formatClientService.ts
 * @description Enterprise client service for fetching movie lists by format (e.g. phim-le, phim-bo).
 * Adheres to strict Zero-Any, Circuit Breaker, and Zod validation patterns.
 */

import { apiPath } from '@/config/apiPaths';
import { getApiBaseUrl } from '@/config/apiBase';
import { isSessionTerminated, getAccessToken, ensureFreshToken, handleSessionHardFailure } from '@/auth/authToken';
import { AppError, parseApiError } from '@/utils/errors/appError';
import {
  formatQueryParamsSchema,
  formatMoviesApiResponseSchema,
  type ValidatedFormatQueryParams
} from '../schemas/format.schema';
import type { FormatMoviesPaginationPayload, FormatQueryParams } from '../types/format.types';

export class FormatClientService {
  private static instance: FormatClientService | null = null;

  public static getInstance(): FormatClientService {
    if (!FormatClientService.instance) {
      FormatClientService.instance = new FormatClientService();
    }
    return FormatClientService.instance;
  }

  /**
   * Fetches movies for a given format slug with pagination and sorting.
   *
   * @param params - Query parameters (slug, page, limit, sort, year).
   * @param signal - Optional AbortSignal for request cancellation.
   * @returns Validated pagination payload with movie list.
   */
  public async getMoviesByFormat(
    params: FormatQueryParams,
    signal?: AbortSignal
  ): Promise<FormatMoviesPaginationPayload> {
    const emptyFallback: FormatMoviesPaginationPayload = {
      data: [],
      total: 0,
      page: params.page || 1,
      limit: params.limit || 20,
      totalPages: 1,
      hasNext: false,
      hasPrevious: false
    };

    if (isSessionTerminated()) {
      return emptyFallback;
    }

    const parseResult = formatQueryParamsSchema.safeParse(params);
    if (!parseResult.success) {
      return emptyFallback;
    }

    const validated: ValidatedFormatQueryParams = parseResult.data;
    const cleanSlug = validated.slug.trim().toLowerCase();
    const baseUrl = getApiBaseUrl();

    const query = new URLSearchParams();
    query.set('page', String(validated.page));
    query.set('limit', String(validated.limit));
    if (validated.sort) query.set('sort', validated.sort);
    if (validated.year && validated.year !== 'all') query.set('year', validated.year);
    if (validated.category && validated.category !== 'all') query.set('category', validated.category);

    const endpointPath = apiPath('moviesByFormat', cleanSlug);
    const fullUrl = `${baseUrl}${endpointPath.startsWith('/') ? '' : '/'}${endpointPath}?${query.toString()}`;

    const headers: Record<string, string> = {
      Accept: 'application/json'
    };

    const token = getAccessToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    try {
      let response = await fetch(fullUrl, {
        method: 'GET',
        headers,
        signal
      });

      // Handle 401: attempt single proactive refresh
      if (response.status === 401 && !isSessionTerminated()) {
        try {
          const freshToken = await ensureFreshToken(0);
          if (freshToken) {
            headers.Authorization = `Bearer ${freshToken}`;
            response = await fetch(fullUrl, {
              method: 'GET',
              headers,
              signal
            });
          }
        } catch {
          handleSessionHardFailure(true);
          return emptyFallback;
        }
      }

      if (!response.ok) {
        throw new AppError(
          `Không thể tải danh sách phim (${response.status})`,
          response.status,
          'FETCH_FORMAT_ERROR'
        );
      }

      const json: unknown = await response.json();
      const parsed = formatMoviesApiResponseSchema.safeParse(json);

      if (parsed.success) {
        return parsed.data.responseData;
      }

      // If envelope wrapper was flattened or returned loose payload
      const looseData = (json as { responseData?: FormatMoviesPaginationPayload })?.responseData;
      if (looseData && Array.isArray(looseData.data)) {
        return {
          data: looseData.data,
          total: looseData.total || looseData.data.length,
          page: looseData.page || validated.page,
          limit: looseData.limit || validated.limit,
          totalPages: looseData.totalPages || Math.ceil((looseData.total || looseData.data.length) / validated.limit) || 1,
          hasNext: Boolean(looseData.hasNext),
          hasPrevious: Boolean(looseData.hasPrevious)
        };
      }

      return emptyFallback;
    } catch (err: unknown) {
      if (signal?.aborted) {
        return emptyFallback;
      }
      if (err instanceof AppError) {
        throw err;
      }
      throw parseApiError(err, 'Không thể kết nối đến máy chủ. Vui lòng thử lại sau.');
    }
  }
}

export const formatClientService = FormatClientService.getInstance();
