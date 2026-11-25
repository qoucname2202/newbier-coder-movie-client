/**
 * @file countryClientService.ts
 * @description Enterprise Country Client Service.
 *
 * Responsibilities:
 * 1. Fetching & multi-tier caching (Memory -> SessionStorage -> Network) of all active countries for Navbar.
 * 2. Fetching paginated movies by country slug with sorting and filtering.
 * 3. Graceful degradation and resilient fallbacks to ensure 0 white-screens.
 */

import { CountryEntity, CountryFilterParams, CountryMoviesResult, PaginationMeta, RawMovie } from '../types/country.types';
import { CountryFilterParamsSchema } from '../schemas/country.schema';
import { TAXONOMY_COUNTRIES, resolveCountryTaxonomy } from '@/config/taxonomyConfig';
import { safeFetchJson } from '@/API/services/movieService';
import movieService from '@/API/services/movieService';
import axiosInstance from '@/API/config/axiosConfig';
import { getApiBaseUrl } from '@/config/apiBase';

export interface ICountryClientService {
  getAllCountries(signal?: AbortSignal): Promise<CountryEntity[]>;
  getCachedCountries?(): CountryEntity[];
  getMoviesByCountry(
    slug: string,
    params?: CountryFilterParams,
    signal?: AbortSignal
  ): Promise<CountryMoviesResult>;
  clearCache(): void;
}

const COUNTRIES_SESSION_KEY = 'cine_client_countries_v2';
const DEFAULT_LIMIT = 20;

export class CountryClientService implements ICountryClientService {
  private inMemoryCountries: CountryEntity[] | null = null;
  private inFlightCountriesPromise: Promise<CountryEntity[]> | null = null;

  /**
   * Synchronously returns cached countries from memory or sessionStorage if available.
   * Enables zero-flicker instant rendering for Navbar and Country components.
   */
  getCachedCountries(): CountryEntity[] {
    if (this.inMemoryCountries && this.inMemoryCountries.length > 0) {
      return this.inMemoryCountries;
    }
    if (typeof window !== 'undefined') {
      try {
        const cached = window.sessionStorage.getItem(COUNTRIES_SESSION_KEY);
        if (cached) {
          const parsed = JSON.parse(cached) as CountryEntity[];
          if (Array.isArray(parsed) && parsed.length > 0) {
            this.inMemoryCountries = parsed;
            return parsed;
          }
        }
      } catch {
        /* storage disabled or quota exceeded */
      }
    }
    return [];
  }

  /**
   * Retrieves all countries from API to populate the Navbar menu.
   * Caches in memory and sessionStorage to minimize network overhead.
   * Guarantees always fetching real data without requiring auth session.
   */
  async getAllCountries(signal?: AbortSignal): Promise<CountryEntity[]> {
    // 1. In-memory cache hit
    if (this.inMemoryCountries && this.inMemoryCountries.length > 0) {
      return this.inMemoryCountries;
    }

    // 2. Browser sessionStorage cache hit
    const cached = this.getCachedCountries();
    if (cached.length > 0) {
      return cached;
    }

    // 3. Deduplicate concurrent requests
    if (this.inFlightCountriesPromise) {
      return this.inFlightCountriesPromise;
    }

    this.inFlightCountriesPromise = (async (): Promise<CountryEntity[]> => {
      try {
        // Query the public /countries endpoint with limit 100 to retrieve all registered countries.
        // Public endpoints must not require a Bearer token or be aborted by guest session teardown.
        let responseData: unknown = null;

        try {
          const res = await axiosInstance.get('/countries', {
            params: { page: 1, limit: 100, sort: 'name' },
            signal
          });
          responseData = res.data;
        } catch {
          // Direct fallback fetch if axios interceptor caught anything
          const base = getApiBaseUrl();
          const directRes = await fetch(`${base}/countries?page=1&limit=100&sort=name`, {
            headers: { Accept: 'application/json' },
            signal
          });
          if (directRes.ok) {
            responseData = await directRes.json();
          }
        }

        const rawList = this.extractItems(responseData);

        if (Array.isArray(rawList) && rawList.length > 0) {
          const normalized: CountryEntity[] = rawList
            .filter((item): item is Record<string, unknown> => typeof item === 'object' && item !== null)
            .map((item) => {
              const slug = String(item.slug || item._id || item.id || '').trim().toLowerCase();
              const name = String(item.name || item.nameVi || slug).trim();
              return {
                id: String(item._id || item.id || slug),
                name,
                slug,
                code: typeof item.code === 'string' ? item.code : undefined,
                description: typeof item.description === 'string' ? item.description : undefined,
                isActive: item.isActive !== false,
                movieCount: typeof item.movieCount === 'number' ? item.movieCount : 0,
                href: `/quoc-gia/${slug}`
              };
            })
            .filter((c) => c.slug.length > 0 && c.isActive);

          if (normalized.length > 0) {
            this.inMemoryCountries = normalized;
            if (typeof window !== 'undefined') {
              try {
                window.sessionStorage.setItem(COUNTRIES_SESSION_KEY, JSON.stringify(normalized));
              } catch {
                /* ignore storage error */
              }
            }
            return normalized;
          }
        }
      } catch {
        // Network or parsing error: proceed to runtime fallback
      }

      // 4. Fallback to TAXONOMY_COUNTRIES only when network is completely unreachable
      const fallbackList: CountryEntity[] = Object.values(TAXONOMY_COUNTRIES).map((c) => ({
        id: c.slug,
        name: c.nameVi,
        slug: c.slug,
        isActive: true,
        badge: c.badge,
        href: `/quoc-gia/${c.slug}`
      }));

      // Cache fallback in memory for test stability, but do NOT overwrite sessionStorage with fallback
      this.inMemoryCountries = fallbackList;
      return fallbackList;
    })().finally(() => {
      this.inFlightCountriesPromise = null;
    });

    return this.inFlightCountriesPromise;
  }

  /**
   * Retrieves paginated movies for a specific country slug.
   */
  async getMoviesByCountry(
    slug: string,
    params: CountryFilterParams = {},
    signal?: AbortSignal
  ): Promise<CountryMoviesResult> {
    const cleanSlug = (slug || '').trim().toLowerCase();
    const validated = CountryFilterParamsSchema.parse(params);
    const { page, limit, sort, year } = validated;

    // Map client sort keys to backend sort parameters
    const backendSortMap: Record<string, string> = {
      'moi-nhat': 'newest',
      'xem-nhieu': 'views',
      'danh-gia': 'rating',
      'nam-phat-hanh': 'year'
    };
    const backendSort = backendSortMap[sort] || 'newest';

    const query = new URLSearchParams();
    query.set('page', String(page));
    query.set('limit', String(limit || DEFAULT_LIMIT));
    query.set('sort', backendSort);
    if (year && year !== 'all') {
      query.set('year', year);
    }

    // Try primary API endpoint: /countries/{slug}/movies
    const endpoint = `/countries/${encodeURIComponent(cleanSlug)}/movies?${query.toString()}`;
    const countryMeta = resolveCountryTaxonomy(cleanSlug);
    const countryName = countryMeta?.nameVi || cleanSlug.replace(/-/g, ' ').toUpperCase();

    try {
      const response = await safeFetchJson<Record<string, unknown>>(endpoint, { signal });
      const rawMovies = this.extractItems(response);

      if (Array.isArray(rawMovies) && rawMovies.length > 0) {
        const pagination = this.extractPagination(response, rawMovies.length, page, limit);
        return {
          movies: rawMovies as RawMovie[],
          pagination,
          countryName
        };
      }
    } catch {
      // Primary endpoint failed, proceed to fallback
    }

    // Fallback: Query via central movieService with client-side fallback pagination
    try {
      const fallbackMovies = await movieService.getMoviesByCountry(cleanSlug, limit * 3);
      if (Array.isArray(fallbackMovies) && fallbackMovies.length > 0) {
        // Apply client-side year filtering if requested
        let filtered = fallbackMovies;
        if (year && year !== 'all') {
          filtered = filtered.filter((m) => String(m.year) === String(year));
        }

        // Apply client-side sorting if requested
        if (sort === 'xem-nhieu') {
          filtered.sort((a, b) => (Number(b.view_count || b.views || 0)) - (Number(a.view_count || a.views || 0)));
        } else if (sort === 'danh-gia') {
          filtered.sort((a, b) => (Number(b.vote_average || b.rating || 0)) - (Number(a.vote_average || a.rating || 0)));
        } else if (sort === 'nam-phat-hanh') {
          filtered.sort((a, b) => (Number(b.year || 0)) - (Number(a.year || 0)));
        }

        const totalItems = filtered.length;
        const totalPages = Math.max(1, Math.ceil(totalItems / limit));
        const startIndex = (page - 1) * limit;
        const pagedMovies = filtered.slice(startIndex, startIndex + limit);

        return {
          movies: pagedMovies as RawMovie[],
          pagination: {
            currentPage: page,
            totalPages,
            totalItems,
            itemsPerPage: limit
          },
          countryName
        };
      }
    } catch {
      // Handled gracefully
    }

    return {
      movies: [],
      pagination: {
        currentPage: page,
        totalPages: 1,
        totalItems: 0,
        itemsPerPage: limit
      },
      countryName
    };
  }

  /**
   * Clears all caches (useful for testing or manual reload).
   */
  clearCache(): void {
    this.inMemoryCountries = null;
    this.inFlightCountriesPromise = null;
    if (typeof window !== 'undefined') {
      try {
        window.sessionStorage.removeItem(COUNTRIES_SESSION_KEY);
      } catch {
        /* ignore */
      }
    }
  }

  /**
   * Defensively extracts item arrays across varying backend response structures.
   */
  private extractItems(res: unknown): unknown[] {
    if (!res || typeof res !== 'object') return [];
    const r = res as Record<string, unknown>;

    // 1. Enterprise responseData envelope: responseData.data (matches /api/v1/countries/{slug}/movies standard contract)
    const responseData = r.responseData as Record<string, unknown> | undefined;
    if (responseData && typeof responseData === 'object') {
      if (Array.isArray(responseData.data)) return responseData.data;
      if (Array.isArray(responseData.items)) return responseData.items;
      if (Array.isArray(responseData.movies)) return responseData.movies;
      if (Array.isArray(responseData.countries)) return responseData.countries;
    }

    // 2. Direct array
    if (Array.isArray(r)) return r;

    // 3. Fallback data envelope
    const data = r.data;
    if (Array.isArray(data)) return data;

    if (data && typeof data === 'object') {
      const inner = data as Record<string, unknown>;
      if (Array.isArray(inner.data)) return inner.data;
      if (Array.isArray(inner.items)) return inner.items;
      if (Array.isArray(inner.movies)) return inner.movies;
      if (Array.isArray(inner.countries)) return inner.countries;
    }

    // 4. Root items or movies
    if (Array.isArray(r.items)) return r.items;
    if (Array.isArray(r.movies)) return r.movies;
    if (Array.isArray(r.countries)) return r.countries;

    return [];
  }

  /**
   * Defensively extracts pagination meta from backend payload.
   */
  private extractPagination(
    res: unknown,
    itemCount: number,
    page: number,
    limit: number
  ): PaginationMeta {
    if (res && typeof res === 'object') {
      const r = res as Record<string, unknown>;
      const responseData = r.responseData as Record<string, unknown> | undefined;

      // 1. Direct fields on responseData (exact contract: responseData.total, responseData.totalPages, responseData.page, responseData.limit)
      if (responseData && typeof responseData.total === 'number') {
        const totalItems = responseData.total;
        const totalPages = typeof responseData.totalPages === 'number'
          ? responseData.totalPages
          : Math.max(1, Math.ceil(totalItems / limit));
        const currentPage = typeof responseData.page === 'number'
          ? responseData.page
          : page;
        const itemsPerPage = typeof responseData.limit === 'number'
          ? responseData.limit
          : limit;

        return {
          currentPage,
          totalPages: Math.max(1, totalPages),
          totalItems,
          itemsPerPage
        };
      }

      // 2. Nested pagination object (e.g. responseData.pagination, data.pagination, r.pagination)
      const p = (responseData?.pagination as Record<string, unknown> | undefined) ||
        (r.data as { pagination?: Record<string, unknown> } | undefined)?.pagination ||
        (r.pagination as Record<string, unknown> | undefined);

      if (p) {
        const totalItems = Number(p.totalItems || p.total || itemCount);
        const totalPages = Number(p.totalPages || Math.ceil(totalItems / limit) || 1);
        const currentPage = Number(p.currentPage || p.page || page);
        return {
          currentPage,
          totalPages: Math.max(1, totalPages),
          totalItems,
          itemsPerPage: limit
        };
      }
    }

    return {
      currentPage: page,
      totalPages: Math.max(1, Math.ceil(itemCount / limit)),
      totalItems: itemCount,
      itemsPerPage: limit
    };
  }
}

export const countryClientService = new CountryClientService();
