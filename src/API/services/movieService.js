/**
 * @file movieService.js
 * @description Safe & Resilient Movie API Service with zero uncaught exceptions.
 * Automatically handles backend envelope normalization and graceful empty fallbacks.
 */

import { MOVIE_CONFIG } from '@/config/movieConfig';

/**
 * Resolves API Base URL from centralized movieConfig (strictly via environment).
 */
const getBaseUrl = () => MOVIE_CONFIG.apiBaseUrl;

/**
 * Normalizes movie lists from various backend envelope schemas into a clean Array.
 * Supports Fastify Enterprise ({ responseData: [...] } or { responseData: { data: [...] } }),
 * legacy ({ data: { movies: [...] } }), and raw arrays.
 *
 * @param {Object|Array} json - Raw JSON response.
 * @returns {Array<Object>} Normalized array of movies.
 */
export const extractMovieList = (json) => {
  if (!json) return [];
  if (Array.isArray(json)) return json;
  if (Array.isArray(json.responseData)) return json.responseData;
  if (Array.isArray(json.responseData?.data)) return json.responseData.data;
  if (Array.isArray(json.data?.movies)) return json.data.movies;
  if (Array.isArray(json.data)) return json.data;
  if (Array.isArray(json.movies)) return json.movies;
  return [];
};

/**
 * Safe HTTP Fetcher (Zero-Crash & Resilient).
 * Never throws uncaught errors and never spams red logs into the console.
 * Returns normalized data or safe fallback directly.
 * 
 * @param {string} endpoint - API path (e.g. '/movies/latest')
 * @param {Object} [options={}] - Custom fetch options (headers, signal, timeout)
 * @param {*} [fallback=null] - Value returned when request fails or returns non-200
 * @returns {Promise<*>}
 */
export async function safeFetchJson(endpoint, options = {}, fallback = null) {
  const base = getBaseUrl();
  if (!base) return fallback;

  const url = endpoint.startsWith('http')
    ? endpoint
    : `${base}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;

  try {
    const controller = new AbortController();
    const timeoutMs = options.timeout || 8000;
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    const signal = options.signal || controller.signal;

    const response = await fetch(url, { ...options, signal });
    clearTimeout(timeoutId);

    if (!response.ok) {
      // Graceful non-200 handling: returns fallback without throwing Error
      return fallback;
    }

    return await response.json();
  } catch {
    // Network abort, timeout, or unreachable host -> returns fallback quietly
    return fallback;
  }
}

/**
 * Fetches an endpoint and extracts a normalized Array of movies.
 * 
 * @param {string} endpoint - API path
 * @param {number} [limit] - Maximum items to return
 * @param {Object} [options={}] - Fetch options
 * @returns {Promise<Array<Object>>}
 */
export async function safeFetchMovieList(endpoint, limit, options = {}) {
  const json = await safeFetchJson(endpoint, options, []);
  const list = extractMovieList(json);
  return typeof limit === 'number' && limit > 0 ? list.slice(0, limit) : list;
}

const movieService = {
  /**
   * Fetches latest movies for Hero spotlight.
   */
  getHeroMovies: (limit = 6, signal) =>
    safeFetchMovieList('/movies/latest', limit, { signal }),

  /**
   * Fetches trending movies (phim thịnh hành).
   */
  getTrendingMovies: (signal) =>
    safeFetchMovieList('/movies/trending', undefined, { signal }),

  /**
   * Fetches top rated movies (phim đánh giá cao).
   */
  getTopRatedMovies: (signal) =>
    safeFetchMovieList('/movies/top-rated', undefined, { signal }),

  /**
   * Fetches movies by page and limit.
   */
  getMoviesPage: (page = 1, limit = 10, signal) =>
    safeFetchMovieList(`/movies?page=${page}&limit=${limit}`, limit, { signal }),

  /**
   * Fetches latest movies.
   */
  getLatestMovies: (signal) =>
    safeFetchMovieList('/movies', undefined, { signal }),

  /**
   * Fetches movies by category.
   */
  getMoviesByCategory: (categoryId, signal) =>
    safeFetchMovieList(`/movies/category/${categoryId}`, undefined, { signal }),

  /**
   * Fetches full movie details by slug.
   */
  getMovieDetails: (slug, signal) =>
    safeFetchJson(`/movies/${slug}`, { signal }, null),

  /**
   * Multi-source fallback resolution for Top 10 movies.
   */
  getTop10Movies: async (signal) => {
    // 1. Attempt trending
    let movies = await movieService.getTrendingMovies(signal);
    if (Array.isArray(movies) && movies.length > 0) return movies.slice(0, 10);

    // 2. Attempt top-rated
    movies = await movieService.getTopRatedMovies(signal);
    if (Array.isArray(movies) && movies.length > 0) return movies.slice(0, 10);

    // 3. Fallback to general movies page
    movies = await movieService.getMoviesPage(1, 10, signal);
    if (Array.isArray(movies) && movies.length > 0) return movies.slice(0, 10);

    return [];
  },

  /**
   * Searches movies with query and filters.
   */
  searchMovies: async (query, filters = {}, page = 1, size = 20) => {
    const params = new URLSearchParams();
    if (query) params.append('q', query);
    params.append('page', page);
    params.append('size', size);
    if (filters.category) params.append('category', filters.category);
    if (filters.country) params.append('country', filters.country);
    if (filters.year) params.append('year', filters.year);
    if (filters.type) params.append('type', filters.type);
    if (filters.duration) params.append('duration', filters.duration);
    params.append('search_description', 'true');
    params.append('search_all_fields', 'true');

    const result = await safeFetchJson(`/search?${params.toString()}`, {}, { hits: [], total: 0 });
    const list = extractMovieList(result) || result?.hits || [];

    return {
      hits: Array.isArray(list) ? list : [],
      total: result?.total || list.length,
      maxScore: result?.maxScore || 0
    };
  },

  /**
   * Fetches newest movies with pagination metadata.
   */
  getNewestMovies: async (page = 1, size = 20) => {
    const params = new URLSearchParams();
    params.append('page', page);
    params.append('size', size);
    params.append('sort', 'newest');

    const result = await safeFetchJson(`/movies?${params.toString()}`, {}, null);
    const items = extractMovieList(result);

    return {
      items,
      pagination: result?.pagination || {
        currentPage: page,
        totalPages: Math.ceil(items.length / size) || 1,
        totalItems: items.length
      }
    };
  }
};

export default movieService;