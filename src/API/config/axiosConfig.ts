/**
 * axiosConfig.ts
 *
 * The axios configuration shared by the whole API layer.
 * It groups the base URL resolver, the request and response interceptors,
 * and the refresh-token strategy.
 */

import axios, { AxiosError, AxiosRequestConfig, InternalAxiosRequestConfig } from 'axios';
import { getApiBaseUrl } from '@/config/apiBase';
import { AP } from '@/config/apiPaths';
import { ensureSessionReady, getMemoryAccessToken } from '@/utils/accessTokenStore';

export type { AxiosError };

/**
 * The base URL of the axios instance.
 *
 * This file used to resolve the base URL on its own
 * (`NEXT_PUBLIC_CORE_API_URL` -> `NEXT_PUBLIC_API_URL` ->
 * `http://localhost:5000/api`) while `config/API.ts`, `adService`,
 * `statsService` and others resolved it in a different way, so one app sent
 * its requests to two different base URLs. Everything now shares
 * `getApiBaseUrl()`.
 */
const baseURL = getApiBaseUrl();

const axiosInstance = axios.create({
  baseURL: baseURL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  withCredentials: true
});

/**
 * Reads the Bearer token of the current tab.
 *
 * WHERE THE TOKEN LIVES
 * The access token is kept in the MEMORY of the tab
 * (`src/utils/accessTokenStore.ts`). It is NOT read from `localStorage` or
 * `sessionStorage`: a token in the Web Storage can be read by any script
 * running on the page, so an XSS was enough to steal the session.
 *
 * The refresh token never reaches the browser at all: it lives in an
 * encrypted `HttpOnly` cookie, on the server side. The renewal is done by
 * the local route `/api/auth/refresh`.
 *
 * @returns The token, or null when no usable token is available.
 */
const readAuthToken = (): string | null => {
  if (typeof window === 'undefined') return null;

  const isUsable = (value: string | null): value is string =>
    Boolean(value) && value !== 'undefined' && value !== 'null';

  const memoryToken = getMemoryAccessToken();
  if (isUsable(memoryToken)) return memoryToken;

  return null;
};

/** Extends AxiosRequestConfig with a flag that marks an already retried request. */
interface RetryableRequest extends AxiosRequestConfig {
  _retry?: boolean;
}

/**
 * The paths of the endpoints that need the Bearer token.
 *
 * The request URLs carry the RELATIVE PATH of the endpoint (the base URL is
 * added by axios), so the paths are used to recognize an endpoint here.
 */
const AUTH_REQUIRED_PATHS = new Set<string>([
  AP.subscriptionHistory,
  AP.subscriptionAdminSubscriptions,
  AP.subscriptionAdminPendingSubscriptions,
  AP.userStatsWatch,
  AP.userStatsWeeklyActivity,
  AP.userStatsActivityWeek,
  AP.userStatsGenreDistribution,
  AP.userStatsDailyViewingTime,
  AP.userStatsSeriesProgress,
  AP.userStatsInProgressSeries,
  AP.userStatsAchievements,
  AP.usersMeHistory,
  AP.usersMeFavorites,
  AP.usersHistoryByUser,
  AP.adminUsersList,
  AP.adminUsersById,
  AP.adminUsersCreate,
  AP.adminUsersUpdate,
  AP.adminUsersDelete,
  AP.adminUsersRole,
  AP.adminUsersBan,
  AP.adminUsersUnban,
  AP.adminUsersToggleStatus,
  AP.adminUsersAvatar,
  AP.adminCategoriesList,
  AP.adminCategoriesById,
  AP.adminCategoriesStatus,
  AP.adminCountriesList,
  AP.adminCountriesById,
  AP.adminCountriesStatus,
  AP.adminFormatsList,
  AP.adminFormatsById,
]);

/**
 * The paths of the authentication endpoints.
 *
 * A 401 on one of them must NOT trigger the refresh-and-retry flow: that
 * would loop forever, because the refresh endpoint itself answers 401.
 */
const AUTH_ENDPOINT_PATHS = new Set<string>([
  AP.authLogin,
  AP.authRefreshToken,
  AP.authLogout,
  AP.authRegister,
]);

/**
 * Builds a matcher for a path template.
 *
 * The templates of `AP` use `{0}`, `{1}`, ... for the path parameters, so
 * they are turned into a regular expression that matches any value in
 * their place. The match is anchored, so `/watchlist` does not match
 * `/watchlist/add`.
 *
 * @param template - The path template, for example `/admin/users/{0}`.
 * @returns The regular expression that matches the concrete paths.
 */
const pathMatcher = (template: string): RegExp => {
  const pattern = template
    .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    .replace(/\\\{\d+\\\}/g, '[^/]+');
  return new RegExp(`^${pattern}$`);
};

/**
 * Tells whether a request URL targets a given endpoint.
 *
 * The URLs of the axios instance are relative paths (the base URL is added
 * by axios), so the path of the URL is compared with the template of the
 * endpoint.
 *
 * @param url - The URL of the request.
 * @param template - The path template of the endpoint.
 * @returns `true` when the URL targets the endpoint.
 */
const matchesEndpoint = (url: string | undefined, template: string): boolean => {
  if (!url) return false;
  const path = url.split('?')[0].replace(/\/+$/, '') || '/';
  return pathMatcher(template).test(path);
};

/**
 * Tells whether a request URL targets one of the given endpoints.
 *
 * @param url - The URL of the request.
 * @param templates - The path templates of the endpoints.
 * @returns `true` when the URL targets one of the endpoints.
 */
const matchesAnyEndpoint = (
  url: string | undefined,
  templates: Set<string>
): boolean => {
  for (const template of templates) {
    if (matchesEndpoint(url, template)) return true;
  }
  return false;
};

axiosInstance.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  // The session is restored before the first request of the tab. The
  // restore asks the server for the access token, using only the encrypted
  // `HttpOnly` cookie, so the token is never read from the Web Storage.
  await ensureSessionReady();

  const token = readAuthToken();

  // The Bearer token is attached to EVERY request, so the backend can
  // answer 401 on the endpoints that need it.
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  if (config.method === 'patch' || config.method === 'PATCH') {
    config.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, PATCH, OPTIONS';
    config.headers['Access-Control-Allow-Origin'] = '*';
  }

  return config;
}, (error: AxiosError) => {

  return Promise.reject(error);
});

axiosInstance.interceptors.response.use(
  (response) => {
    // The favorites endpoint is recognized by its path.
    if (matchesEndpoint(response.config.url, AP.usersMeFavorites)) {
      // Silent diagnostics. The path and the payload are never logged.
    }
    return response;
  },
  async (error: AxiosError) => {
    // Build a minimal diagnostic — NEVER log the request body, headers
    // (which may carry a Bearer token), or full error object. Browsers
    // also hide the underlying cause for Network Errors.
    const cfg = (error.config || {}) as RetryableRequest;
    const method = (cfg.method || 'get').toUpperCase();
    const url = cfg.url || '<unknown>';
    const status = error.response?.status; // undefined for Network Error
    const code = error.code; // e.g. 'ERR_NETWORK', 'ECONNABORTED'

    if (status) {
      const data = error.response?.data as
        | { responseStatus?: { responseMessage?: string } }
        | undefined;

    } else {
      // Network Error / timeout / CORS preflight failed. We log method+url
      // only; the browser hides the underlying reason.

    }

    // ---- MOCK-MODE 404 SHIM -----------------------------------------------
    // The deployed backend is missing a handful of admin endpoints. Rather
    // than letting every page spew 404s and break their error handlers, we
    // recognise the known-missing routes here, fabricate a realistic empty
    // response, and resolve the original request as if it had succeeded.
    // Each branch documents the shape the caller expects so it's easy to
    // remove when the real endpoint ships.
    //
    // NOTE: the endpoints are recognized by their PATH.
    if (status === 404) {
      // GET /admin/movies/categories -> empty list. The page already has its
      // own mock categories (INITIAL_CATEGORIES) as a fallback.
      if (matchesEndpoint(url, AP.adminMoviesCategories)) {
        return { data: { categories: [] }, status: 200, statusText: 'OK (mock-empty)', headers: {}, config: cfg } as never;
      }
    }
    // ---- END MOCK-MODE 404 SHIM -------------------------------------------


    const originalRequest = cfg as RetryableRequest;

    // Account-locked signal from the backend: bounce to the locked page.
    const responseData = error.response?.data as { isAccountLocked?: boolean } | undefined;
    if (status === 403 && responseData?.isAccountLocked === true) {
      if (typeof window !== 'undefined') {
        localStorage.setItem('isAccountLocked', 'true');
        window.location.href = '/common/account-locked';
      }
      return Promise.reject(error);
    }

    // 401: try a single silent refresh, then retry the original request.
    // We never retry auth endpoints themselves (login/refresh/logout) to
    // avoid infinite refresh loops.
    const isAuthEndpoint = matchesAnyEndpoint(url, AUTH_ENDPOINT_PATHS);

    if (status === 401 && !originalRequest._retry && !isAuthEndpoint) {
      originalRequest._retry = true;
      try {
        const { default: authService } = await import('../services/authService');
        await authService.refreshToken();
        // Retry the original request with the freshly-stored token.
        const newToken = readAuthToken();
        if (newToken) {
          originalRequest.headers = originalRequest.headers || {};
          (originalRequest.headers as Record<string, string>).Authorization = `Bearer ${newToken}`;
        }
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        // Refresh was rejected (refresh token expired/invalid) — full logout.
        const refreshErr = refreshError as { code?: string };
        if (refreshErr?.code === 'REFRESH_REJECTED') {
          const { default: authService } = await import('../services/authService');
          try { await authService.logout(); } catch { /* noop */ }
          if (typeof window !== 'undefined') {
            window.location.href = '/auth/login';
          }
        }
        return Promise.reject(error);
      }
    }

    // 401 on auth endpoints, or refresh already failed: hard logout.
    if (status === 401) {
      if (typeof window !== 'undefined') {
        // The cleanup is centralized in `authService._clearLocalSession`, so
        // every logout path removes exactly the same keys (including the
        // persisted user store and the legacy token keys).
        try {
          const { default: authService } = await import('../services/authService');
          authService._clearLocalSession();
        } catch {
          // Fallback: the keys are removed one by one.
          try { localStorage.removeItem('auth_token'); } catch { /* noop */ }
          try { localStorage.removeItem('token'); } catch { /* noop */ }
          try { localStorage.removeItem('refresh_token'); } catch { /* noop */ }
          try { localStorage.removeItem('user'); } catch { /* noop */ }
          try { localStorage.removeItem('remember_me'); } catch { /* noop */ }
          try { localStorage.removeItem('authToken'); } catch { /* noop */ }
          try { localStorage.removeItem('user-store'); } catch { /* noop */ }
          if (window.sessionStorage) {
            try { window.sessionStorage.removeItem('auth_token'); } catch { /* noop */ }
            try { window.sessionStorage.removeItem('token'); } catch { /* noop */ }
            try { window.sessionStorage.removeItem('user'); } catch { /* noop */ }
            try { window.sessionStorage.removeItem('backendToken'); } catch { /* noop */ }
          }
        }
        window.location.href = '/auth/login';
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
