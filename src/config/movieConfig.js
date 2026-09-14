/**
 * @file movieConfig.js
 * @description Centralized configuration for movie pages, hero banners, and data providers.
 */

/**
 * Movie configuration object.
 * Reads environment variables with safe default fallbacks.
 */
export const MOVIE_CONFIG = {
  // Flag indicating whether to use mock data for instantaneous and stable UI rendering
  useMockData: process.env.NEXT_PUBLIC_USE_MOCK_DATA !== 'false',

  // Base API URL for movie services
  apiBaseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api',

  // Hero banner configurations
  hero: {
    maxDescriptionLength: parseInt(process.env.NEXT_PUBLIC_HERO_DESC_LIMIT || '220', 10),
    autoPlayInterval: parseInt(process.env.NEXT_PUBLIC_HERO_AUTOPLAY_INTERVAL || '6000', 10),
    defaultYear: '2024'
  },

  // Category IDs and default titles
  categories: {
    new: {
      id: 'new',
      title: 'Phim mới cập nhật',
      endpoint: 'danh-sach/phim-moi-cap-nhat'
    },
    series: {
      id: 'series',
      title: 'Phim bộ đặc sắc',
      endpoint: 'danh-sach/phim-bo'
    },
    single: {
      id: 'single',
      title: 'Phim lẻ chiếu rạp',
      endpoint: 'danh-sach/phim-le'
    }
  },

  // UI display defaults
  ui: {
    defaultPoster: '/images/default-poster.jpg',
    defaultBackdrop: '/images/default-backdrop.jpg',
    itemsPerPage: 20
  }
};

/**
 * Retrieves the configured API endpoint for a given category.
 * @param {string} categoryKey - Category identifier key.
 * @returns {string} Full or relative API endpoint.
 */
export const getCategoryEndpoint = (categoryKey) => {
  const category = MOVIE_CONFIG.categories[categoryKey];
  return category ? category.endpoint : MOVIE_CONFIG.categories.new.endpoint;
};

/**
 * Checks whether mock data mode is currently active.
 * @returns {boolean} True if mock data should be used.
 */
export const isMockModeActive = () => {
  return MOVIE_CONFIG.useMockData;
};
