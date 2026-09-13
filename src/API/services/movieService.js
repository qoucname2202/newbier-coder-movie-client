
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

const movieService = {
  getLatestMovies: async () => {
    try {
      const response = await fetch(`${API_URL}/movies`);
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
      const response = await fetch(`${API_URL}/movies/top-rated`);
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
      const response = await fetch(`${API_URL}/movies/category/${categoryId}`);
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
      const response = await fetch(`${API_URL}/movies/${slug}`);
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

      const response = await fetch(`${API_URL}/search?${params.toString()}`);

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

      const response = await fetch(`${API_URL}/movies?${params.toString()}`);

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