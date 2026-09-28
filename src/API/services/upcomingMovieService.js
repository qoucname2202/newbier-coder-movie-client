/**
 * @file upcomingMovieService.js
 * @description Service for fetching upcoming movies directly from API with clean empty states.
 */

const API_URL = (process.env.NEXT_PUBLIC_CORE_API_URL || process.env.NEXT_PUBLIC_API_URL || '').replace(/\/+$/, '');

const upcomingMovieService = {
  /**
   * Fetches paginated upcoming movies list.
   * @param {number} [page=1]
   * @param {number} [limit=10]
   * @returns {Promise<{ success: boolean, upcomingMovies: Array, pagination?: Object }>}
   */
  getUpcomingMovies: async (page = 1, limit = 10) => {
    try {
      const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
      const timeoutId = controller ? setTimeout(() => controller.abort(), 1200) : null;

      const response = await fetch(
        `${API_URL}/upcoming-movies?page=${page}&limit=${limit}`,
        controller ? { signal: controller.signal } : {}
      ).catch(() => null);

      if (timeoutId) clearTimeout(timeoutId);

      if (!response || !response.ok) {
        return {
          success: false,
          upcomingMovies: [],
          pagination: { currentPage: 1, totalPages: 1, totalCount: 0 }
        };
      }

      const data = await response.json().catch(() => null);

      if (data && data.success && data.upcomingMovies) {
        const processedMovies = data.upcomingMovies.map(movie => {
          const releaseDate = new Date(movie.release_date);
          const formattedDate = releaseDate.toLocaleDateString('vi-VN');

          const thumb_url = movie.thumb_url?.startsWith('http')
            ? movie.thumb_url
            : `${movie.thumb_url}`;

          const poster_url = movie.poster_url?.startsWith('http')
            ? movie.poster_url
            : `${movie.poster_url}`;

          return {
            ...movie,
            thumb_url,
            poster_url,
            formattedReleaseDate: formattedDate,
            daysUntilRelease: Math.ceil((releaseDate - new Date()) / (1000 * 60 * 60 * 24)),
            countdownText: getCountdownText(releaseDate)
          };
        });

        const sortedMovies = processedMovies.sort((a, b) => {
          const dateA = new Date(a.release_date);
          const dateB = new Date(b.release_date);
          return dateA - dateB;
        });

        return {
          success: true,
          upcomingMovies: sortedMovies,
          pagination: {
            currentPage: data.currentPage,
            totalPages: data.totalPages,
            totalCount: data.totalCount
          }
        };
      }

      return {
        success: false,
        upcomingMovies: [],
        pagination: { currentPage: 1, totalPages: 1, totalCount: 0 }
      };
    } catch {
      return {
        success: false,
        upcomingMovies: [],
        pagination: { currentPage: 1, totalPages: 1, totalCount: 0 }
      };
    }
  },

  /**
   * Fetches single upcoming movie details by ID.
   * @param {string} movieId
   * @returns {Promise<{ success: boolean, upcomingMovie: Object|null }>}
   */
  getUpcomingMovieById: async (movieId) => {
    try {
      const response = await fetch(`${API_URL}/admin/upcoming-movies/${movieId}`).catch(() => null);
      if (!response || !response.ok) {
        return { success: false, upcomingMovie: null };
      }
      const data = await response.json().catch(() => null);

      if (data && data.success && data.upcomingMovie) {
        const movie = data.upcomingMovie;
        const releaseDate = new Date(movie.release_date);

        return {
          success: true,
          upcomingMovie: {
            ...movie,
            formattedReleaseDate: releaseDate.toLocaleDateString('vi-VN'),
            daysUntilRelease: Math.ceil((releaseDate - new Date()) / (1000 * 60 * 60 * 24)),
            countdownText: getCountdownText(releaseDate)
          }
        };
      }

      return { success: false, upcomingMovie: null };
    } catch {
      return { success: false, upcomingMovie: null };
    }
  },

  /**
   * Fetches single upcoming movie details by URL slug.
   * @param {string} slug
   * @returns {Promise<Object>}
   */
  getUpcomingMovieBySlug: async (slug) => {
    try {
      const response = await fetch(`${API_URL}/upcoming-movies/${slug}`).catch(() => null);
      if (!response || !response.ok) {
        return { success: false, movie: null };
      }
      const data = await response.json().catch(() => null);
      return data || { success: false, movie: null };
    } catch {
      return { success: false, movie: null };
    }
  },

  /**
   * Fetches upcoming movies filtered by category slug.
   * @param {string} categorySlug
   * @param {number} [page=1]
   * @param {number} [limit=10]
   * @returns {Promise<Object>}
   */
  getUpcomingMoviesByCategory: async (categorySlug, page = 1, limit = 10) => {
    try {
      const response = await fetch(
        `${API_URL}/upcoming-movies/category/${categorySlug}?page=${page}&limit=${limit}`
      ).catch(() => null);

      if (!response || !response.ok) {
        return { success: false, upcomingMovies: [] };
      }

      const data = await response.json().catch(() => null);
      return data || { success: false, upcomingMovies: [] };
    } catch {
      return { success: false, upcomingMovies: [] };
    }
  }
};

/**
 * Helper to compute human-readable countdown text from release date.
 * @param {Date} releaseDate
 * @returns {string}
 */
function getCountdownText(releaseDate) {
  const now = new Date();
  const timeDiff = releaseDate.getTime() - now.getTime();
  const daysDiff = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));

  if (daysDiff <= 0) {
    return "Đã ra mắt";
  } else if (daysDiff === 1) {
    return "Ra mắt ngày mai";
  } else if (daysDiff <= 7) {
    return `Ra mắt sau ${daysDiff} ngày`;
  } else if (daysDiff <= 30) {
    const weeks = Math.ceil(daysDiff / 7);
    return `Ra mắt sau ${weeks} tuần`;
  } else {
    const months = Math.ceil(daysDiff / 30);
    return `Ra mắt sau ${months} tháng`;
  }
}

export default upcomingMovieService;
