/**
 * apiPaths.ts
 *
 * The single source of truth for the backend endpoint paths.
 *
 * WHY THE PATHS LIVE IN THE CLIENT
 * The backend is reached through the same-origin proxy
 * (`/api/backend/...`), so the browser never needs the backend host, the
 * port or the scheme. The path itself is part of the public API contract
 * of the backend and can safely be read from the client bundle.
 *
 * The proxy in `src/pages/api/backend/[...segments].ts` forwards the path
 * to the backend as it is. It can still remap a path on the server with
 * the `API_ROUTE_MAP` environment variable, which is handy when a backend
 * path changes without rebuilding the frontend.
 *
 * WHY THE PATHS ARE CENTRALIZED
 * The same endpoint is used by several services and pages. When the path
 * is written down in one place, a backend change is a one-line fix
 * instead of a search across the whole source tree.
 *
 * THE TEMPLATE SYNTAX
 * `{0}`, `{1}`, ... mark the path parameters, in order. They are replaced
 * by the values passed to `apiPath()`.
 *
 * Example:
 *   apiPath('moviesDetail', 'abc-123') -> '/movies/abc-123'
 */

import { getApiBaseUrl } from './apiBase';

/**
 * The relative path of every backend endpoint.
 *
 * The KEY is semantic, so the call sites stay readable. The VALUE is the
 * real path of the backend.
 */
export const AP = {
  moviesList: '/movies',
  moviesLatest: '/movies/latest',
  moviesTrending: '/movies/trending',
  moviesTopRated: '/movies/top-rated',
  moviesTrendingRadar: '/movies/trending-radar',
  moviesRankingsGrid: '/movies/rankings-grid',
  moviesSearch: '/movies/search',
  moviesDetail: '/movies/{0}',
  moviesRelated: '/movies/related/{0}',
  moviesComments: '/movies/{0}/comments',
  moviesFavorite: '/movies/{0}/favorite',
  moviesVisibility: '/movies/{0}/visibility',
  moviesByCountry: '/countries/{0}/movies',
  moviesByFormat: '/formats/{0}/movies',
  categoriesBySlugMovies: '/categories/{0}/movies',
  actorsDetail: '/actors/{0}',
  authLogin: '/auth/login',
  authRegister: '/auth/register',
  authLogout: '/auth/logout',
  authRefreshToken: '/auth/refresh-token',
  authUpdateProfile: '/auth/update-profile',
  authUploadAvatar: '/auth/upload-avatar',
  authUserDetail: '/auth/user-detail',
  authChangePassword: '/auth/change-password',
  authDeleteAccount: '/auth/delete-account',
  authActivityHistory: '/auth/activity-history',
  authFavorites: '/auth/favorites',
  authStats: '/auth/stats',
  authGoogleLogin: '/auth/google-login',
  authFacebookLogin: '/auth/facebook-login',
  authForgotPassword: '/auth/forgot-password',
  authResetPassword: '/auth/reset-password',
  usersMeHistory: '/users/me/history',
  usersMeFavorites: '/users/me/favorites',
  usersHistoryByUser: '/users/{0}/history',
  userStatsWatch: '/user-stats/watch-stats',
  userStatsWeeklyActivity: '/user-stats/weekly-activity',
  userStatsActivityWeek: '/user-stats/activity-week',
  userStatsGenreDistribution: '/user-stats/genre-distribution',
  userStatsDailyViewingTime: '/user-stats/daily-viewing-time',
  userStatsSeriesProgress: '/user-stats/series-progress/{0}',
  userStatsInProgressSeries: '/user-stats/in-progress-series',
  userStatsAchievements: '/user-stats/achievements',
  ratingsUser: '/ratings/user',
  ratingsUserById: '/ratings/user/{0}',
  ratingsUserMovie: '/ratings/user/{0}/movie/{1}',
  ratingsCreate: '/ratings',
  ratingsById: '/ratings/{0}',
  ratingsStats: '/ratings/stats/{0}',
  ratingsMovie: '/ratings/movie/{0}',
  adminRatingsByMovie: '/admin/ratings/{0}',
  adminRatingsUpdateMovie: '/admin/ratings/update-movie-ratings',
  adminRatingsSyncAll: '/admin/ratings/sync-all',
  subscriptionPackages: '/subscription/packages',
  subscriptionPackageById: '/subscription/packages/{0}',
  subscriptionSubscribe: '/subscription/subscribe',
  subscriptionConfirmPayment: '/subscription/confirm-payment',
  subscriptionCancel: '/subscription/cancel',
  subscriptionHistory: '/subscription/history',
  subscriptionAutoRenewal: '/subscription/auto-renewal',
  subscriptionPending: '/subscription/pending',
  subscriptionAdminSubscriptions: '/subscription/admin/subscriptions',
  subscriptionAdminPendingSubscriptions: '/subscription/admin/pending-subscriptions',
  subscriptionAdminPendingCount: '/subscription/admin/pending-count',
  subscriptionAdminApprove: '/subscription/admin/approve/{0}',
  subscriptionAdminReject: '/subscription/admin/reject/{0}',
  subscriptionAdminCancel: '/subscription/admin/cancel/{0}',
  subscriptionAdminPackages: '/subscription/admin/packages',
  subscriptionAdminPackageById: '/subscription/admin/packages/{0}',
  watchlistList: '/watchlist',
  watchlistAdd: '/watchlist/add',
  watchlistCheck: '/watchlist/check/{0}',
  watchlistRemove: '/watchlist/remove/{0}',
  watchlistClear: '/watchlist/clear',
  watchlaterList: '/watchlater',
  watchlaterCreate: '/watchlater',
  watchlaterDelete: '/watchlater/{0}',
  watchlaterCheck: '/watchlater/check',
  adsView: '/advertisements/view',
  adsClick: '/advertisements/click',
  adsSkip: '/advertisements/skip',
  adsList: '/advertisements',
  adsById: '/advertisements/{0}',
  adsCreate: '/advertisements',
  adsUpdate: '/advertisements/{0}',
  adsDelete: '/advertisements/{0}',
  upcomingList: '/upcoming-movies',
  upcomingBySlug: '/upcoming-movies/{0}',
  upcomingByCategory: '/upcoming-movies/category/{0}',
  upcomingAdminList: '/admin/upcoming-movies',
  upcomingAdminById: '/admin/upcoming-movies/{0}',
  upcomingAdminCreate: '/admin/upcoming-movies',
  upcomingAdminUpdate: '/admin/upcoming-movies/{0}',
  upcomingAdminDelete: '/admin/upcoming-movies/{0}',
  upcomingAdminRelease: '/admin/upcoming-movies/{0}/release',
  adminUsersList: '/admin/users',
  adminUsersById: '/admin/users/{0}',
  adminUsersCreate: '/admin/users',
  adminUsersUpdate: '/admin/users/{0}',
  adminUsersDelete: '/admin/users/{0}',
  adminUsersRole: '/admin/users/{0}/role',
  adminUsersBan: '/admin/users/{0}/ban',
  adminUsersUnban: '/admin/users/{0}/unban',
  adminUsersToggleStatus: '/admin/users/{0}/toggle-status',
  adminUsersAvatar: '/admin/users/{0}/avatar',
  adminMoviesList: '/admin/movies',
  adminMoviesById: '/admin/movies/{0}',
  adminMoviesCreate: '/admin/movies',
  adminMoviesUpdate: '/admin/movies/{0}',
  adminMoviesDelete: '/admin/movies/{0}',
  adminMoviesThumbnail: '/admin/movies/{0}/thumbnail',
  adminMoviesVisibility: '/admin/movies/{0}/visibility',
  adminMoviesCategories: '/admin/movies/categories',
  adminRolesList: '/admin/roles',
  adminRolesById: '/admin/roles/{0}',
  adminAccountTypes: '/admin/account-types',
  adminDashboardStats: '/admin/dashboard/stats',
  adminDashboardRecentMovies: '/admin/dashboard/recent-movies',
  adminDashboardTopMovies: '/admin/dashboard/top-movies',
  adminDashboardViewsByDay: '/admin/dashboard/views-by-day',
  adminDashboardGenreDistribution: '/admin/dashboard/genre-distribution',
  adminDashboardRecentFeedbacks: '/admin/dashboard/recent-feedbacks',
  reportCreate: '/reports',
  reportMyReports: '/reports/my-reports',
  adminReportsList: '/admin/reports',
  adminReportsById: '/admin/reports/{0}',
  adminReportsUpdate: '/admin/reports/{0}',
  adminReportsDelete: '/admin/reports/{0}',
  feedbackList: '/feedback',
  feedbackById: '/feedback/{0}',
  feedbackUpdate: '/feedback/{0}',
  feedbackDelete: '/feedback/{0}',
  feedbackUnreadCount: '/feedback/unread/count',
  feedbackCreate: '/feedback',
  commentsTop: '/comments/top',
  commentsLiveBuzz: '/comments/live-buzz',
  searchSuggestions: '/search/suggestions',
  searchStatus: '/search/status',
  searchHistoryList: '/search-history',
  searchHistoryCreate: '/search-history',
  searchHistoryById: '/search-history/{0}',
  searchHistoryClear: '/search-history',
  crawlMovies: '/crawl/movies',
  crawlMoviesAll: '/crawl/moviesall',
  taxonomyGenres: '/genres',
  taxonomyCategories: '/categories',
  taxonomyCountries: '/countries',
  taxonomyFormats: '/formats',
  taxonomyYears: '/years',
  // ── Admin taxonomy (write) routes ───────────────────────────────────────
  // These routes exist on the backend and require the ADMIN role.
  //   POST   /admin/categories      → create
  //   PUT    /admin/categories/:id  → update
  //   PATCH  /admin/categories/:id/status → toggle active
  //   DELETE /admin/categories/:id  → delete
  // The same shape exists for `/admin/countries` and `/admin/formats`.
  // NOTE: the backend has NO `/genres` route — the genre taxonomy of the
  // website IS the category taxonomy, so the client uses `/categories`.
  adminCategoriesList: '/admin/categories',
  adminCategoriesById: '/admin/categories/{0}',
  adminCategoriesStatus: '/admin/categories/{0}/status',
  adminCountriesList: '/admin/countries',
  adminCountriesById: '/admin/countries/{0}',
  adminCountriesStatus: '/admin/countries/{0}/status',
  adminFormatsList: '/admin/formats',
  adminFormatsById: '/admin/formats/{0}',
  moviesYears: '/movies/years',
  adminYearsList: '/admin/years',
  adminYearsById: '/admin/years/{0}',
  adminYearsToggleStatus: '/admin/years/{0}/status',
  adminActorsList: '/admin/actors',
  adminActorsById: '/admin/actors/{0}',
  formatsSeriesMovies: '/formats/series/movies',
  formatsSingleMovies: '/formats/single/movies',
  notificationsSendMaintenance: '/admin/notifications/send-maintenance',
  notificationsSendCustom: '/admin/notifications/send-custom',
  notificationsHistory: '/admin/notifications/history'
} as const;

/** The name of an endpoint. */
export type ApiPathKey = keyof typeof AP;

/**
 * Substitutes the path parameters into a path template.
 *
 * @param template - The template, for example `/movies/{0}`.
 * @param params - The parameter values, in order.
 * @returns The path, and the number of consumed parameters.
 */
const applyParams = (
  template: string,
  params: (string | number | undefined)[]
): { path: string; consumed: number } => {
  let consumed = 0;
  const path = template.replace(/\{(\d+)\}/g, (match) => {
    const value = params[consumed];
    consumed += 1;
    return value === undefined ? match : encodeURIComponent(String(value));
  });
  return { path, consumed };
};

/**
 * Builds the RELATIVE path of an endpoint.
 *
 * The result always starts with a slash, so it can be joined with any base
 * URL. The parameters that the template does not consume are appended, so a
 * route can accept a variable number of them.
 *
 * @param key - The endpoint name.
 * @param params - The path parameters, in order.
 * @returns The relative path of the endpoint.
 */
export const apiPath = (
  key: ApiPathKey,
  ...params: (string | number | undefined)[]
): string => {
  const template = AP[key];
  const { path, consumed } = applyParams(template, params);
  const extra = params
    .slice(consumed)
    .filter((value) => value !== undefined && value !== null)
    .map((value) => encodeURIComponent(String(value)));
  return extra.length ? `${path}/${extra.join('/')}` : path;
};

/**
 * Builds the FULL URL of an endpoint.
 *
 * It joins the relative path of `apiPath()` with the base URL of the
 * current runtime, so it works for a plain `fetch()` in both runtimes.
 *
 * @param key - The endpoint name.
 * @param params - The path parameters, in order.
 * @returns The full URL of the endpoint.
 */
export const apiUrl = (
  key: ApiPathKey,
  ...params: (string | number | undefined)[]
): string => {
  const base = getApiBaseUrl();
  const path = apiPath(key, ...params);
  if (!base) return path;
  return `${base.replace(/\/+$/, '')}/${path.replace(/^\/+/, '')}`;
};

/**
 * Appends a query string to a URL.
 *
 * @param url - The URL.
 * @param params - The query parameters. Empty values are skipped.
 * @returns The URL with an encoded query string.
 */
export const withQuery = (
  url: string,
  params?: Record<string, string | number | undefined | null>
): string => {
  if (!params) return url;
  const query = Object.entries(params)
    .filter(([, value]) => value !== undefined && value !== null && value !== '')
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
    .join('&');
  return query ? `${url}?${query}` : url;
};

export default apiPath;
