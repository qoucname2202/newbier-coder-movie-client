/**
 * @file routesConfig.js
 * @description Centralized application routes and route-level feature configurations.
 */

/**
 * Standard application route definitions.
 */
export const ROUTES = {
  HOME: '/',
  MOVIES: '/movies',
  SERIES: '/series',
  SEARCH: '/search',
  PREMIUM: '/premium',
  PROFILE: '/profile',
  NO_ACCESS: '/noaccess',
  AUTH_PREFIX: '/auth/',
  ADMIN_PREFIX: '/admin/',
  ACCOUNT_PREFIX: '/account/',
  PAYMENT_PREFIX: '/payment/',
  MOVIE_PREFIX: '/movie/'
};

/**
 * Default route prefixes where banner advertisements should be suppressed.
 */
export const DEFAULT_AD_EXCLUDED_PATHS = [
  ROUTES.AUTH_PREFIX,
  ROUTES.ADMIN_PREFIX,
  ROUTES.ACCOUNT_PREFIX,
  ROUTES.PAYMENT_PREFIX,
  ROUTES.NO_ACCESS,
  ROUTES.PROFILE,
  ROUTES.PREMIUM,
  ROUTES.SEARCH
];

/**
 * Retrieves the list of route paths where ads are suppressed.
 * Prioritizes comma-separated environment configuration over defaults.
 * @returns {Array<string>} Array of route path prefixes to exclude from ads.
 */
export const getAdExcludedPaths = () => {
  const envConfig = process.env.NEXT_PUBLIC_AD_EXCLUDED_PATHS;
  if (envConfig && typeof envConfig === 'string') {
    return envConfig
      .split(',')
      .map((path) => path.trim())
      .filter(Boolean);
  }
  return DEFAULT_AD_EXCLUDED_PATHS;
};

/**
 * Checks whether advertisement banners should be suppressed for a given pathname.
 * @param {string} pathname - Current route path (e.g. '/admin/dashboard').
 * @param {boolean} hideHomepageAds - Flag from AdContext to suppress ads on homepage.
 * @returns {boolean} True if ads are allowed on the current page, false otherwise.
 */
export const isAdVisibleForPath = (pathname, hideHomepageAds) => {
  if (hideHomepageAds) return false;
  if (!pathname) return false;

  const excludedPaths = getAdExcludedPaths();
  const isExcluded = excludedPaths.some((prefix) => pathname.startsWith(prefix));

  return !isExcluded;
};
