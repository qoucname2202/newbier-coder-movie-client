/**
 * API.ts
 *
 * Central declaration of the backend endpoints.
 *
 * The endpoints are declared with their RELATIVE PATH. The base URL is
 * resolved by `getApiBaseUrl()`, and the proxy in
 * `src/pages/api/backend/[...segments].ts` forwards the request to the
 * backend.
 *
 * WHY THE ENDPOINTS ARE RELATIVE PATHS
 * Every consumer of `endpoints` passes the result to the shared axios
 * instance (`axiosInstance` / `axiosAdminConfig`), which already carries the
 * base URL in its `baseURL` option. When a URL is absolute, axios IGNORES
 * `baseURL`; when it is relative, axios JOINS it with `baseURL`.
 *
 * The endpoints are therefore relative paths (`/movies/...`). That keeps a
 * single source of truth for the base URL and avoids a duplicated prefix
 * such as `/api/backend/api/backend/movies`.
 *
 * `API_URL` is still exported for the few callers that use a plain `fetch()`
 * and therefore need the base URL themselves.
 */

import { getApiBaseUrl } from './apiBase';
import { apiPath, withQuery, type ApiPathKey } from '@/config/apiPaths';

export const API_URL = getApiBaseUrl();

/**
 * Builds an endpoint URL with query parameters.
 *
 * @param base - The endpoint path without a query string.
 * @param params - Optional query parameters. Empty values are skipped.
 * @returns The URL with an encoded query string, or the base URL unchanged.
 */
function buildUrl(base: string, params?: Record<string, string | number>): string {
  return withQuery(base, params);
}

/**
 * Builds the path of an endpoint, with its path parameters.
 *
 * @param key - The endpoint name.
 * @param params - The path parameters, in order.
 * @returns The relative path of the endpoint.
 */
function route(key: ApiPathKey, ...params: (string | number)[]): string {
  return apiPath(key, ...params);
}

export const endpoints = {
  movies: {
    detail: (slug: string) => route('moviesDetail', slug),
    list: (page = 1, limit = 100) => buildUrl(route('moviesList'), { page, limit }),
    related: (category: string, limit: number) =>
      buildUrl(route('moviesList'), { category, limit }),
    search: (query: string) => buildUrl(route('moviesSearch'), { q: query })
  },
  crawl: {
    movies: () => route('crawlMovies'),
    moviesAll: () => route('crawlMoviesAll')
  },
  /**
   * Watch history. The paths were verified directly against the production
   * backend on 2026-10-20. The old `/history/*` routes returned
   * `404 Route not found`.
   *   GET    /users/me/history        -> 401 (list, needs a Bearer token)
   *   POST   /users/me/history        -> 400 (add, needs a Bearer token and a body)
   *   DELETE /users/me/history/:id    -> 401 (remove one item)
   *   DELETE /users/me/history        -> 401 (remove all items)
   * The baseline `/users/me/zzz-nope` returns 404, so the 401 responses here
   * prove the routes exist and are not a false positive of
   * `/users/me/:param`.
   */
  history: {
    getAll: (limit = 10, page = 1) => buildUrl(route('usersMeHistory'), { limit, page }),
    add: () => route('usersMeHistory'),
    addById: (_movieId: string) => route('usersMeHistory'),
    delete: (historyId: string) => route('usersMeHistory', historyId),
    clear: () => route('usersMeHistory'),
    getUserHistory: (userId: string, limit = 10, page = 1) =>
      buildUrl(route('usersHistoryByUser', userId), { limit, page })
  },
  /**
   * Favorites. The paths were verified directly against the production backend
   * on 2026-10-20. The old `/favorites` route returned `404 Route not found`.
   *   GET    /users/me/favorites    -> 401 (exists, needs a Bearer token)
   *   POST   /movies/:slug/favorite -> 401 (exists, needs a Bearer token)
   *   DELETE /movies/:slug/favorite -> 401 (exists, needs a Bearer token)
   * The toggle uses the slug and not the id, which is what
   * `useMovieDetail.ts` already does.
   */
  favorites: {
    getAll: (page = 1, limit = 20) => buildUrl(route('usersMeFavorites'), { page, limit }),
    add: (movieSlug: string) => route('moviesFavorite', movieSlug),
    remove: (movieSlug: string) => route('moviesFavorite', movieSlug),
    check: (movieSlug: string) => buildUrl(route('usersMeFavorites'), { slug: movieSlug })
  },
  search: {
    // Backend v1 has no `/search` route, the real one is `/movies/search`.
    find: () => route('moviesSearch')
  },
  admin: {
    movies: {
      getAll: (page = 1, limit = 10) => buildUrl(route('adminMoviesList'), { page, limit }),
      getById: (id: string) => route('adminMoviesById', id),
      create: () => route('adminMoviesCreate'),
      update: (id: string) => route('adminMoviesUpdate', id),
      delete: (id: string) => route('adminMoviesDelete', id),
      uploadThumbnail: (id: string) => route('adminMoviesThumbnail', id),
      toggleVisibility: (id: string) => route('adminMoviesVisibility', id)
    },
    years: {
      getAll: (page = 1, limit = 20, search?: string) =>
        buildUrl(`${API_URL}/years`, { page, limit, ...(search ? { search } : {}) }),
      getPublicAll: () => `${API_URL}/years`,
      getById: (id: string) => `${API_URL}/admin/years/${id}`,
      create: () => `${API_URL}/admin/years`,
      update: (id: string) => `${API_URL}/admin/years/${id}`,
      delete: (id: string) => `${API_URL}/admin/years/${id}`,
      toggleStatus: (id: string) => `${API_URL}/admin/years/${id}/status`
    },
    users: {
      getAll: (page = 1, limit = 10) => buildUrl(route('adminUsersList'), { page, limit }),
      getById: (id: string) => route('adminUsersById', id),
      create: () => route('adminUsersCreate'),
      update: (id: string) => route('adminUsersUpdate', id),
      delete: (id: string) => route('adminUsersDelete', id),
      updateRole: (id: string) => route('adminUsersRole', id),
      ban: (id: string) => route('adminUsersBan', id),
      unban: (id: string) => route('adminUsersUnban', id),
      toggleStatus: (id: string) => route('adminUsersToggleStatus', id),
      uploadAvatar: (id: string) => route('adminUsersAvatar', id)
    },
    roles: {
      getAll: () => route('adminRolesList')
    },
    accountTypes: {
      getAll: () => route('adminAccountTypes')
    },
    dashboard: {
      stats: () => route('adminDashboardStats'),
      recentMovies: () => route('adminDashboardRecentMovies'),
      topMovies: () => route('adminDashboardTopMovies')
    },
    premium: {
      getAllPackages: () => route('subscriptionPackages'),
      getPackageById: (id: string) => route('subscriptionPackageById', id),
      createPackage: () => route('subscriptionAdminPackages'),
      updatePackage: (id: string) => route('subscriptionAdminPackageById', id),
      deletePackage: (id: string) => route('subscriptionAdminPackageById', id),
      getAllSubscriptions: () => route('subscriptionAdminSubscriptions'),
      getPendingSubscriptions: () => route('subscriptionAdminPendingSubscriptions'),
      approveSubscription: (subscriptionId: string) =>
        route('subscriptionAdminApprove', subscriptionId),
      rejectSubscription: (subscriptionId: string) =>
        route('subscriptionAdminReject', subscriptionId)
    }
  }
} as const;

export default { API_URL, endpoints };
