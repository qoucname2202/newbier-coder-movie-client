import { mockMovies } from '../../mock/mockMovies';

/**
 * @file upcomingMovieService.js
 * @description Service for fetching upcoming movies with safe offline fallback to mock data.
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

/**
 * Generates formatted fallback upcoming movies from mock dataset.
 * @returns {Array<Object>}
 */
const getFallbackUpcomingMovies = () => {
  return (mockMovies || []).slice(2, 7).map((movie, index) => {
    const futureDate = new Date(Date.now() + (index + 2) * 86400000);
    return {
      ...movie,
      release_date: futureDate.toISOString(),
      formattedReleaseDate: futureDate.toLocaleDateString('vi-VN'),
      daysUntilRelease: index + 2,
      countdownText: `Ra mắt sau ${index + 2} ngày`
    };
  });
};

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
          success: true,
          upcomingMovies: getFallbackUpcomingMovies(),
          pagination: { currentPage: 1, totalPages: 1, totalCount: 5 }
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
        success: true,
        upcomingMovies: getFallbackUpcomingMovies(),
        pagination: { currentPage: 1, totalPages: 1, totalCount: 5 }
      };
    } catch {
      return {
        success: true,
        upcomingMovies: getFallbackUpcomingMovies(),
        pagination: { currentPage: 1, totalPages: 1, totalCount: 5 }
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
        const fallback = getFallbackUpcomingMovies()[0] || null;
        return { success: !!fallback, upcomingMovie: fallback };
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
      const fallback = getFallbackUpcomingMovies()[0] || null;
      return { success: !!fallback, upcomingMovie: fallback };
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
        const fallback = (mockMovies || []).find(m => m.slug === slug) || getFallbackUpcomingMovies()[0] || null;
        return { success: !!fallback, movie: fallback };
      }
      const data = await response.json().catch(() => null);
      return data || { success: false };
    } catch {
      const fallback = (mockMovies || []).find(m => m.slug === slug) || getFallbackUpcomingMovies()[0] || null;
      return { success: !!fallback, movie: fallback };
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
        return { success: true, upcomingMovies: getFallbackUpcomingMovies() };
      }

      const data = await response.json().catch(() => null);
      return data || { success: true, upcomingMovies: getFallbackUpcomingMovies() };
    } catch {
      return { success: true, upcomingMovies: getFallbackUpcomingMovies() };
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
