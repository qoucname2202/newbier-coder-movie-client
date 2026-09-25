
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

const movieService = {
  /**
   * Fetches latest movies for Hero banner spotlight.
   * Endpoint: /movies/latest
   * @param {number} [limit=6]
   * @param {AbortSignal} [signal]
   * @returns {Promise<Array<Object>>}
   */
  getHeroMovies: async (limit = 6, signal) => {
    const base = getBaseUrl();
    if (!base) return [];
    try {
      const response = await fetch(`${base}/movies/latest`, { signal });
      if (!response.ok) {
        throw new Error(`Failed to fetch hero movies: status ${response.status}`);
      }
      const json = await response.json();
      const list = extractMovieList(json);
      return list.slice(0, limit);
    } catch (error) {
      if (error.name !== 'AbortError' && process.env.NODE_ENV === 'development') {
        // Silent in production or when aborted
      }
      return [];
    }
  },

  /**
   * Fetches trending movies (phim thịnh hành / xem nhiều).
   * Endpoint: /movies/trending
   * @param {AbortSignal} [signal]
   * @returns {Promise<Array<Object>>}
   */
  getTrendingMovies: async (signal) => {
    const base = getBaseUrl();
    if (!base) return [];
    try {
      const response = await fetch(`${base}/movies/trending`, { signal });
      if (!response.ok) {
        throw new Error(`Failed to fetch trending movies: status ${response.status}`);
      }
      const json = await response.json();
      return extractMovieList(json);
    } catch (error) {
      return [];
    }
  },

  /**
   * Fetches movies by page and limit.
   * Endpoint: /movies?page={page}&limit={limit}
   * @param {number} [page=1]
   * @param {number} [limit=10]
   * @param {AbortSignal} [signal]
   * @returns {Promise<Array<Object>>}
   */
  getMoviesPage: async (page = 1, limit = 10, signal) => {
    const base = getBaseUrl();
    if (!base) return [];
    try {
      const response = await fetch(`${base}/movies?page=${page}&limit=${limit}`, { signal });
      if (!response.ok) {
        throw new Error(`Failed to fetch movies page: status ${response.status}`);
      }
      const json = await response.json();
      return extractMovieList(json);
    } catch (error) {
      return [];
    }
  },

  /**
   * Fetches Top 10 movies for TOP 10 Widescreen Rail.
   * Tries /movies/trending first, then falls back to /movies/top-rated or /movies?limit=10.
   * @param {AbortSignal} [signal]
   * @returns {Promise<Array<Object>>}
   */
  getTop10Movies: async (signal) => {
    const base = getBaseUrl();
    if (!base) return [];
    try {
      // 1. Attempt trending
      let movies = await movieService.getTrendingMovies(signal);
      if (Array.isArray(movies) && movies.length > 0) {
        return movies.slice(0, 10);
      }

      // 2. Attempt top-rated
      const topRatedRes = await fetch(`${base}/movies/top-rated`, { signal });
      if (topRatedRes.ok) {
        const json = await topRatedRes.json();
        movies = extractMovieList(json);
        if (Array.isArray(movies) && movies.length > 0) {
          return movies.slice(0, 10);
        }
      }

      // 3. Fallback to general movies list (10 items)
      movies = await movieService.getMoviesPage(1, 10, signal);
      if (Array.isArray(movies) && movies.length > 0) {
        return movies.slice(0, 10);
      }

      return [];
    } catch (error) {
      return [];
    }
  },

  getLatestMovies: async () => {
    try {
      const response = await fetch(`${getBaseUrl()}/movies`);
      if (!response.ok) {
        throw new Error('Failed to fetch latest movies');
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching latest movies:', error);
      return { movies: [] };
    }
  },

  getTopRatedMovies: async () => {
    try {
      const response = await fetch(`${getBaseUrl()}/movies/top-rated`);
      if (!response.ok) {
        throw new Error('Failed to fetch top rated movies');
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching top rated movies:', error);
      return { movies: [] };
    }
  },

  getMoviesByCategory: async (categoryId) => {
    try {
      const response = await fetch(`${getBaseUrl()}/movies/category/${categoryId}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch ${categoryId} movies`);
      }
      return await response.json();
    } catch (error) {
      console.error(`Error fetching ${categoryId} movies:`, error);
      return { movies: [] };
    }
  },

  getMovieDetails: async (slug) => {
    try {
      const response = await fetch(`${getBaseUrl()}/movies/${slug}`);
      if (!response.ok) {
        throw new Error('Failed to fetch movie details');
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching movie details:', error);
      throw error;
    }
  },

  searchMovies: async (query, filters = {}, page = 1, size = 20) => {
    try {
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

      const response = await fetch(`${getBaseUrl()}/search?${params.toString()}`);

      if (!response.ok) {
        throw new Error(`Search failed with status: ${response.status}`);
      }

      const result = await response.json();

      let searchHits = [];
      let searchTotal = 0;
      let searchMaxScore = 0;

      if (result.hits && Array.isArray(result.hits)) {
        searchHits = result.hits;
        searchTotal = result.total || result.hits.length;
        searchMaxScore = result.maxScore || 0;
      }
      else if (Array.isArray(result)) {
        searchHits = result;
        searchTotal = result.length;
      }
      else if (result.movies && Array.isArray(result.movies)) {
        searchHits = result.movies;
        searchTotal = result.total || result.movies.length;
      }
      else if (result.data && Array.isArray(result.data)) {
        searchHits = result.data;
        searchTotal = result.total || result.data.length;
      }
      else if (result.success === false) {
        return { hits: [], total: 0, maxScore: 0 };
      }

      const uniqueMovies = [];
      const uniqueIds = new Set();
      const uniqueSlugs = new Set();

      searchHits.forEach(movie => {
        const movieId = movie.id || movie._id;
        const movieSlug = movie.slug;

        if ((!movieId || !uniqueIds.has(movieId)) && (!movieSlug || !uniqueSlugs.has(movieSlug))) {
          if (movieId) uniqueIds.add(movieId);
          if (movieSlug) uniqueSlugs.add(movieSlug);
          uniqueMovies.push(movie);
        }
      });

      return {
        hits: uniqueMovies,
        total: searchTotal,
        maxScore: searchMaxScore
      };
    } catch (error) {
      console.error('Error searching movies:', error);
      return { hits: [], total: 0, maxScore: 0 };
    }
  },

  getNewestMovies: async (page = 1, size = 20) => {
    try {
      const params = new URLSearchParams();
      params.append('page', page);
      params.append('size', size);
      params.append('sort', 'newest');

      const response = await fetch(`${getBaseUrl()}/movies?${params.toString()}`);

      if (!response.ok) {
        throw new Error(`Failed to fetch newest movies with status: ${response.status}`);
      }

      const result = await response.json();

      if (result.success === false) {
        throw new Error(result.message || 'Failed to fetch newest movies');
      }

      if (Array.isArray(result)) {
        return {
          items: result,
          pagination: {
            currentPage: page,
            totalPages: Math.ceil(result.length / size),
            totalItems: result.length
          }
        };
      }

      if (result.data) {
        return {
          items: result.data,
          pagination: result.pagination || {
            currentPage: page,
            totalPages: Math.ceil(result.data.length / size),
            totalItems: result.data.length
          }
        };
      } else if (result.movies) {
        return {
          items: result.movies,
          pagination: result.pagination || {
            currentPage: page,
            totalPages: Math.ceil(result.movies.length / size),
            totalItems: result.movies.length
          }
        };
      }

      console.warn('API responded with unexpected structure - attempting to extract movies:', result);

      for (const key in result) {
        if (Array.isArray(result[key])) {
          return {
            items: result[key],
            pagination: {
              currentPage: page,
              totalPages: Math.ceil(result[key].length / size),
              totalItems: result[key].length
            }
          };
        }
      }

      return {
        items: [result],
        pagination: {
          currentPage: 1,
          totalPages: 1,
          totalItems: 1
        }
      };
    } catch (error) {
      console.error('Error fetching newest movies:', error);
      throw error;
    }
  }
};

export default movieService;