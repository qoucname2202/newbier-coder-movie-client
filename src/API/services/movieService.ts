/**
 * Movie API service.
 *
 * The service is defensive: it never throws an exception to the caller.
 * Every request goes through `safeFetchJson`, which normalizes the backend
 * envelopes and falls back to an empty result instead of crashing the UI.
 */

import { MOVIE_CONFIG } from '@/config/movieConfig';
import { pickMovieImage } from '@/utils/imageSource';
import { apiPath } from '@/config/apiPaths';
import { ensureSessionReady } from '@/utils/accessTokenStore';
import { cachedRequest, invalidateMovieCache } from './movieRequestCache';
import {
  setAccessToken,
  handleSessionHardFailure,
  isSessionTerminated,
} from '@/auth/authToken';

/**
 * Reads the expiry date of a JWT.
 *
 * Only the payload is decoded, the signature is NOT verified. The value is
 * used to refresh the token early, so verifying the signature is not needed.
 *
 * @param token - The JWT to read.
 * @returns The expiry timestamp in milliseconds, or `null` when the token
 *          cannot be parsed.
 */
const readJwtExp = (token: string | null): number | null => {
  if (!token) return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  try {
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const json = atob(base64);
    const payload = JSON.parse(json) as { exp?: number };
    return payload?.exp ? payload.exp * 1000 : null;
  } catch {
    return null;
  }
};

/**
 * Makes sure the access token is still valid before a request is sent.
 *
 * - The session is restored FIRST: the access token lives in the MEMORY of
 *   the tab, so right after a page load it is not there yet. Without this
 *   wait every list request was sent without the `Authorization` header and
 *   the backend answered `401 Missing Bearer token`, so all the rails
 *   (trending, top rated, categories, countries) stayed empty.
 * - The token is still valid for more than 60 seconds: it is returned as is.
 * - The token expires in 60 seconds or less: the refresh runs FIRST.
 * - Single-flight: when many requests run at the same time, only one
 *   refresh is sent.
 * - The refresh fails: the old token is returned, so the request fails on
 *   its own with a 401.
 */
let _tokenRefreshInFlight: Promise<string | null> | null = null;

const ensureFreshToken = async (): Promise<string | null> => {
  if (typeof window === 'undefined') return null;

  if (isSessionTerminated()) return null;

  // The session restore is awaited BEFORE the token is read, so the token
  // of the memory is already there when the request goes out.
  try {
    await ensureSessionReady();
  } catch {
    /* the restore failed: the request goes out without a token */
  }

  // The token is read through the shared helper, so a session-only login
  // (the token lives in `sessionStorage`) is handled the same way as a
  // "remember me" login.
  let token: string | null = null;
  try {
    const mod = await import('./authService');
    token = mod.getStoredAccessToken();
  } catch {
    token = null;
  }

  if (!token) {
    try {
      const { ensureFreshToken: getFreshToken, hasActiveSessionMarker, handleSessionHardFailure } = await import('@/auth/authToken');
      if (hasActiveSessionMarker()) {
        try {
          return await getFreshToken();
        } catch {
          handleSessionHardFailure(true);
          return null;
        }
      }
    } catch {
      return null;
    }
    return null;
  }

  const exp = readJwtExp(token);
  if (!exp) return token;

  const msUntilExpiry = exp - Date.now();
  if (msUntilExpiry <= 0) {
    handleSessionHardFailure(true);
    return null;
  }
  if (msUntilExpiry > 60_000) return token;

  if (_tokenRefreshInFlight) return _tokenRefreshInFlight;

  const refreshPromise = (async (): Promise<string | null> => {
    try {
      const { refreshAccessToken } = await import('@/auth/authToken');
      const refreshed = await refreshAccessToken();
      if (refreshed) invalidateMovieCache();
      return refreshed;
    } catch {
      // Refresh token rejected / expired: clear dead session & redirect to login
      try {
        const { handleSessionHardFailure } = await import('@/auth/authToken');
        handleSessionHardFailure(true);
      } catch {
        // ignore
      }
      return null;
    }
  })();

  _tokenRefreshInFlight = refreshPromise.finally(() => {
    _tokenRefreshInFlight = null;
  });

  return _tokenRefreshInFlight;
};

/** A raw movie entity as it comes from the backend. */
export interface RawMovie {
  [key: string]: unknown;
}

/** The standard v1 envelope returned by the backend. */
export interface EnvelopeResponse<T = unknown> {
  responseStatus?: { responseCode?: string; responseMessage?: string };
  responseData?: T;
  data?: T;
  movies?: T;
  [key: string]: unknown;
}

/** The options accepted by the fetch helpers. */
export interface FetchOptions {
  method?: string;
  headers?: Record<string, string>;
  body?: string;
  signal?: AbortSignal;
  timeout?: number;
}

/** The base URL comes from `movieConfig`, the only place reading the env. */
const getBaseUrl = (): string => MOVIE_CONFIG.apiBaseUrl;

/**
 * Adds snake_case image aliases to a raw movie object.
 *
 * The v1 backend returns images in camelCase (`posterUrl`/`thumbUrl`),
 * but the browse pages render `poster_url`/`thumb_url`. Aliasing here —
 * in the single choke point every list endpoint funnels through — means
 * `/browse/schedule`, the category/country rails, and the home rails all
 * get real posters instead of silently falling back to a placeholder.
 *
 * Original keys are preserved, so any caller reading camelCase still works.
 */
const withImageAliases = (m: RawMovie): RawMovie => {
  const poster = pickMovieImage(m, 'poster', '');
  const thumb = pickMovieImage(m, 'thumb', '');
  if (!poster && !thumb) return m;
  return {
    ...m,
    poster_url: poster || thumb,
    thumb_url: thumb || poster
  };
};

/**
 * Normalizes a movie list coming from different backend envelopes into one
 * clean array.
 *
 * Supported shapes: Fastify Enterprise (`{ responseData: [...] }` or
 * `{ responseData: { data: [...] } }`), the legacy shape
 * (`{ data: { movies: [...] } }`) and a raw array.
 *
 * @param json - The raw JSON response.
 * @returns The normalized array of movies.
 */
export const extractMovieList = (json: unknown): RawMovie[] => {
  if (!json) return [];
  if (Array.isArray(json)) return (json as RawMovie[]).map(withImageAliases);

  const env = json as Record<string, unknown>;

  const tryArray = (v: unknown): RawMovie[] | null =>
    Array.isArray(v) ? (v as RawMovie[]).map(withImageAliases) : null;

  // 1. The array sits directly in one of the known envelope keys.
  const found = tryArray(env.responseData)
    || tryArray((env.responseData as { data?: unknown[] } | undefined)?.data)
    || tryArray((env.responseData as { items?: unknown[] } | undefined)?.items)
    || tryArray((env.responseData as { movies?: unknown[] } | undefined)?.movies)
    || tryArray((env.responseData as { results?: unknown[] } | undefined)?.results)
    || tryArray((env.data as { data?: unknown[] } | undefined)?.data)
    || tryArray((env.data as { items?: unknown[] } | undefined)?.items)
    || tryArray((env.data as { movies?: unknown[] } | undefined)?.movies)
    || tryArray((env.data as { results?: unknown[] } | undefined)?.results)
    || tryArray(env.data)
    || tryArray(env.movies)
    || tryArray(env.items)
    || tryArray(env.results);
  if (found) return found;

  // 2. Sometimes the API nests the array one level deeper, for example
  //    `{ responseData: { items: [...] } }`.
  for (const key of Object.keys(env)) {
    const v = (env as Record<string, unknown>)[key];
    if (v && typeof v === 'object') {
      const arr = tryArray((v as { data?: unknown[] }).data)
        || tryArray((v as { items?: unknown[] }).items)
        || tryArray((v as { movies?: unknown[] }).movies)
        || tryArray((v as { results?: unknown[] }).results);
      if (arr) return arr;
    }
  }
  return [];
};

/**
 * A safe HTTP fetcher that never crashes the app.
 *
 * The function never throws an exception and never floods the console with
 * red errors. It returns the normalized data, or a safe fallback.
 *
 * @param endpoint - The API path.
 * @param options - The custom fetch options (headers, signal, timeout).
 * @param fallback - The value returned when the request fails or does not
 *                   answer with a 2xx status.
 * @returns The parsed data, or the fallback.
 */
export async function safeFetchJson<T = unknown>(
  endpoint: string,
  options: FetchOptions = {},
  fallback: T | null = null
): Promise<T | null> {
  const base = getBaseUrl();
  if (!base) return fallback;

  try {
    const { isSessionTerminated } = await import('@/auth/authToken');
    if (isSessionTerminated()) {
      return fallback;
    }
  } catch {
    // ignore
  }

  const url = endpoint.startsWith('http')
    ? endpoint
    : `${base}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;

  try {
    const controller = new AbortController();
    const timeoutMs = options.timeout || 8000;
    const timeoutId: ReturnType<typeof setTimeout> = setTimeout(() => controller.abort(), timeoutMs);
    const signal = options.signal || controller.signal;

    // The token is refreshed before sending, so a request rarely fails with
    // an expired token.
    // - The token is read from localStorage and from sessionStorage, because
    //   `authService.login` stores it in sessionStorage when the user does
    //   not tick "Remember me".
    // - When the token expires in 60 seconds or less, `/auth/refresh-token`
    //   runs FIRST.
    // - When the refresh fails, the old token is used and the request fails
    //   on its own with a 401.
    const token = await ensureFreshToken();

    if (isSessionTerminated()) {
      return fallback;
    }

    const headers: Record<string, string> = {
      Accept: 'application/json',
      ...(options.headers || {})
    };
    if (token && token !== 'undefined' && token !== 'null') {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
      signal
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      if (response.status === 401 || response.status === 403 || (response.status === 500 && (Boolean(headers.Authorization) || url.includes('/api/backend')))) {
        // Backend answered 401 Unauthorized, 403 Forbidden, or 500 Internal Server Error (expired/invalid JWT on backend):
        // Under strict enterprise session policy, clear entire browser storage, terminate session, and force login immediately.
        setAccessToken(null, false);
        delete headers.Authorization;
        handleSessionHardFailure(true);
        return fallback;
      }
      return fallback;
    }

    const json = (await response.json()) as EnvelopeResponse;

    return json as unknown as T;
  } catch (err) {
    return fallback;
  }
}

/**
 * Fetches an endpoint and extracts the normalized array of movies.
 *
 * @param endpoint - The API path.
 * @param limit - The maximum number of movies returned.
 * @param options - The fetch options.
 * @returns The array of movies.
 */
export async function safeFetchMovieList(
  endpoint: string,
  limit?: number,
  options: FetchOptions = {}
): Promise<RawMovie[]> {
  const json = await safeFetchJson<unknown>(endpoint, options, []);
  const list = extractMovieList(json);
  return typeof limit === 'number' && limit > 0 ? list.slice(0, limit) : list;
}

/**
 * Awaits a promise, but gives up as soon as the signal is aborted.
 *
 * The underlying promise is NOT cancelled: it keeps running and it still
 * fills the cache, so the next caller benefits from it.
 *
 * ON ABORT THE EMPTY LIST IS RETURNED (the promise is NOT rejected)
 * The previous behaviour of `safeFetchJson` was to swallow the abort and
 * return the fallback (an empty list). This helper keeps that behaviour, so
 * the callers do not have to handle a new error type they never saw before.
 *
 * @param promise - The promise to await.
 * @param signal - The abort signal of the caller.
 * @returns The resolved value of the promise, or an empty list on abort.
 */
const raceWithAbort = async <T>(promise: Promise<T>, signal?: AbortSignal): Promise<T> => {
  if (!signal) return promise;
  if (signal.aborted) return [] as T;

  return new Promise<T>((resolve) => {
    const onAbort = (): void => {
      signal.removeEventListener('abort', onAbort);
      resolve([] as T);
    };

    signal.addEventListener('abort', onAbort, { once: true });

    promise
      .then((value) => {
        signal.removeEventListener('abort', onAbort);
        resolve(value);
      })
      .catch(() => {
        signal.removeEventListener('abort', onAbort);
        resolve([] as T);
      });
  });
};

/**
 * The same as `safeFetchMovieList`, but the result goes through the shared
 * cache (see `movieRequestCache`).
 *
 * WHY
 * Several call sites ask for the SAME list at the same time:
 * - the `big_slide` and the `animation` section both load the "hoat-hinh"
 *   category;
 * - the country rails are preloaded by the page AND loaded again by the
 *   rail component;
 * - React StrictMode runs every effect twice in development.
 *
 * Without the cache, every one of those call sites produced its own HTTP
 * request, even though the backend answers the exact same payload.
 *
 * THE CACHE KEY IS THE ENDPOINT
 * The limit is NOT part of the key, because it is applied AFTER the cache
 * is read. Two callers with a different limit (`6` for the banner and `20`
 * for the rail) therefore share ONE request instead of sending two.
 *
 * THE ABORT SIGNAL
 * The signal of the caller only cancels the WAIT of that caller. It never
 * cancels the shared request, because that request may be serving other
 * callers at the same time.
 *
 * @param endpoint - The API path.
 * @param limit - The maximum number of movies returned.
 * @param options - The fetch options.
 * @returns The array of movies.
 */
export async function cachedFetchMovieList(
  endpoint: string,
  limit?: number,
  options: FetchOptions = {}
): Promise<RawMovie[]> {
  // The shared request is sent WITHOUT the signal of the caller: the
  // request may be shared, so one caller must not be able to cancel it for
  // everybody else.
  const shared = cachedRequest(
    `list:${endpoint}`,
    async () => {
      const json = await safeFetchJson<unknown>(endpoint, { ...options, signal: undefined }, []);
      return extractMovieList(json);
    }
  );

  const list = await raceWithAbort(shared, options.signal);
  return typeof limit === 'number' && limit > 0 ? list.slice(0, limit) : list;
}

/** The main service object for the movie API. */
const movieService = {
  /**
   * Loads the latest movies for the hero spotlight.
   *
   * The service over-fetches (4 times the limit, or at least 24 movies) so
   * there are still enough movies left after the trailer filter.
   *
   * ONLY MOVIES WITH A TRAILER ARE SHOWN: most of the movies returned by
   * `/movies/latest` have `trailer: null` (in the real payload the first 6
   * movies are null and only the 7th and 8th have a trailer). Asking for
   * exactly `limit=6` and filtering would return 0 movies, which would leave
   * the HeroBannerSkeleton spinning forever.
   *
   * @param limit - The number of movies the caller wants.
   * @param signal - The abort signal of the caller.
   * @returns The list of movies.
   */
  getHeroMovies: (limit = 6, signal?: AbortSignal): Promise<RawMovie[]> =>
    cachedFetchMovieList(apiPath(`moviesLatest`), Math.max(limit * 4, 24), { signal }),

  /** Loads the trending movies. */
  getTrendingMovies: (signal?: AbortSignal): Promise<RawMovie[]> =>
    cachedFetchMovieList(apiPath(`moviesTrending`), undefined, { signal }),

  /** Loads the top rated movies. */
  getTopRatedMovies: (signal?: AbortSignal): Promise<RawMovie[]> =>
    cachedFetchMovieList(apiPath(`moviesTopRated`), undefined, { signal }),

  /** Loads one page of movies. */
  getMoviesPage: (page = 1, limit = 10, signal?: AbortSignal): Promise<RawMovie[]> =>
    cachedFetchMovieList(apiPath(`moviesList`) + `?page=${page}&limit=${limit}`, limit, { signal }),

  /** Loads the latest movies without a limit. */
  getLatestMovies: (signal?: AbortSignal): Promise<RawMovie[]> =>
    cachedFetchMovieList(apiPath(`moviesList`), undefined, { signal }),

  /**
   * Loads the home page movie list.
   *
   * Endpoint: `GET /api/v1/movies?page=1&limit=20`.
   *
   * @param signal - The abort signal of the caller.
   * @returns The normalized array of movies, or an empty array on failure.
   */
  getHomeMovies: (signal?: AbortSignal): Promise<RawMovie[]> =>
    cachedFetchMovieList(apiPath(`moviesList`) + '?page=1&limit=20', 20, { signal }),

  /**
   * Loads the movies of a country with a multi-level fallback:
   * 1. Query the slug registered in the backend through `taxonomyConfig`.
   * 2. Search by the keyword defined in `taxonomyConfig`.
   * 3. Filter the general list on the client side.
   *
   * @param countrySlug - The slug of the country.
   * @param limit - The maximum number of movies returned.
   * @param signal - The abort signal of the caller.
   * @returns The list of movies.
   */
  getMoviesByCountry: async (countrySlug: string, limit = 20, signal?: AbortSignal): Promise<RawMovie[]> => {
    if (!countrySlug) return [];

    try {
      const { isSessionTerminated } = await import('@/auth/authToken');
      if (isSessionTerminated()) return [];
    } catch {
      // ignore
    }

    const cleanSlug = countrySlug.trim().toLowerCase();
    const fetchLimit = Math.max(limit * 2, 20);

    const list = await cachedFetchMovieList(
      apiPath(`moviesByCountry`, cleanSlug),
      fetchLimit,
      { signal }
    );
    return Array.isArray(list) ? list : [];
  },

  /**
   * Loads the movies of a category by slug.
   *
   * @param categorySlug - The slug of the category.
   * @param limit - The maximum number of movies returned.
   * @param signal - The abort signal of the caller.
   * @returns The list of movies.
   */
  getMoviesByCategory: async (categorySlug: string, limit = 20, signal?: AbortSignal): Promise<RawMovie[]> => {
    if (!categorySlug) return [];

    try {
      const { isSessionTerminated } = await import('@/auth/authToken');
      if (isSessionTerminated()) return [];
    } catch {
      // ignore
    }

    const cleanSlug = categorySlug.trim().toLowerCase();
    const fetchLimit = Math.max(limit * 2, 24);

    const list = await cachedFetchMovieList(
      apiPath(`categoriesBySlugMovies`, cleanSlug),
      fetchLimit,
      { signal }
    );
    return Array.isArray(list) ? list : [];
  },

  /** Loads the details of a movie by slug. */
  getMovieDetails: (slug: string, signal?: AbortSignal): Promise<EnvelopeResponse | null> =>
    safeFetchJson<EnvelopeResponse>(apiPath(`moviesDetail`, slug), { signal }, null),

  /**
   * Multi-source resolution cho Top 10 movies:
   * 1. Trending movies
   * 2. Top-rated movies
   */
  getTop10Movies: async (signal?: AbortSignal): Promise<RawMovie[]> => {
    try {
      const { isSessionTerminated } = await import('@/auth/authToken');
      if (isSessionTerminated()) return [];
    } catch {
      // ignore
    }

    // 1. The trending movies.
    let movies = await movieService.getTrendingMovies(signal);
    if (Array.isArray(movies) && movies.length > 0) return movies.slice(0, 10);

    // 2. The top rated movies.
    movies = await movieService.getTopRatedMovies(signal);
    if (Array.isArray(movies) && movies.length > 0) return movies.slice(0, 10);

    return [];
  },

  /**
   * Searches the movies with a query and a set of filters.
   *
   * @param query - The text typed by the user.
   * @param filters - The optional filters (category, country, year, type,
   *                  duration).
   * @param page - The page to load, starting at 1.
   * @param size - The number of results per page.
   * @returns The hits of the search, plus the total and the max score.
   */
  searchMovies: async (
    query: string,
    filters: { category?: string; country?: string; year?: string; type?: string; duration?: string } = {},
    page = 1,
    size = 20
  ): Promise<{ hits: RawMovie[]; total: number; maxScore: number }> => {
    const params = new URLSearchParams();
    if (query) params.append('q', query);
    params.append('page', String(page));
    params.append('size', String(size));
    if (filters.category) params.append('category', filters.category);
    if (filters.country) params.append('country', filters.country);
    if (filters.year) params.append('year', filters.year);
    if (filters.type) params.append('type', filters.type);
    if (filters.duration) params.append('duration', filters.duration);
    params.append('search_description', 'true');
    params.append('search_all_fields', 'true');

    // Backend v1: the search route is `/movies/search` (verified: `/search`
    // answers 404 "Route not found", `/movies/search` answers 401 "Missing
    // Bearer token"). The route `/search` used to be called here, so every
    // search page received an empty list.
    const result = await safeFetchJson<EnvelopeResponse<{ hits?: RawMovie[]; total?: number; maxScore?: number }>>(
      apiPath(`moviesSearch`) + `?${params.toString()}`,
      {},
      { hits: [], total: 0, maxScore: 0 }
    );
    const fallbackList = result?.hits || [];
    const list = extractMovieList(result) || fallbackList;

    return {
      hits: Array.isArray(list) ? list : [],
      total: (result as { total?: number } | null)?.total || list.length,
      maxScore: (result as { maxScore?: number } | null)?.maxScore || 0
    };
  },

  /**
   * Loads the newest movies with the pagination metadata.
   *
   * @param page - The page to load, starting at 1.
   * @param size - The number of movies per page.
   * @returns The movies of the page and the pagination metadata.
   */
  getNewestMovies: async (page = 1, size = 20): Promise<{ items: RawMovie[]; pagination: { currentPage: number; totalPages: number; totalItems: number } }> => {
    const params = new URLSearchParams();
    params.append('page', String(page));
    params.append('size', String(size));
    params.append('sort', 'newest');

    const result = await safeFetchJson<EnvelopeResponse>(apiPath(`moviesList`) + `?${params.toString()}`, {}, null);
    const items = extractMovieList(result);

    return {
      items,
      pagination: (result as { pagination?: { currentPage: number; totalPages: number; totalItems: number } } | null)?.pagination || {
        currentPage: page,
        totalPages: Math.ceil(items.length / size) || 1,
        totalItems: items.length
      }
    };
  }
};

export default movieService;
