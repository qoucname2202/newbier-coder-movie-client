/**
 * @file movieConfig.js
 * @description Centralized configuration for movie pages, hero banners, and data providers.
 * Backed by SYSTEM_CONFIG and movieFallbackConfig for unified system architecture.
 */

import { SYSTEM_CONFIG } from './systemConfig';
import {
  LOCAL_DEFAULT_BACKDROP,
  LOCAL_DEFAULT_POSTER,
  MOVIE_FALLBACK_DEFAULTS
} from './movieFallbackConfig';

export {
  HERO_FALLBACK_BACKDROPS,
  LOCAL_DEFAULT_BACKDROP,
  LOCAL_DEFAULT_POSTER,
  MOVIE_FALLBACK_DEFAULTS,
  resolveMovieBackdrop,
  resolveMovieSubTitle,
  resolveMovieCategories,
  resolveMovieYear,
  resolveMovieQuality,
  normalizeHeroMovie,
  resolveMovieActors,
  resolveMovieDirectors
} from './movieFallbackConfig';

/**
 * Movie configuration object.
 * Synchronized with global SYSTEM_CONFIG.
 */
export const MOVIE_CONFIG = {
  useMockData: SYSTEM_CONFIG.useMockData,
  apiBaseUrl: SYSTEM_CONFIG.apiBaseUrl,
  dataMode: SYSTEM_CONFIG.dataMode,

  hero: {
    maxDescriptionLength: SYSTEM_CONFIG.ui.heroDescLimit,
    autoPlayInterval: SYSTEM_CONFIG.ui.heroAutoPlayInterval,
    defaultYear: String(MOVIE_FALLBACK_DEFAULTS.year)
  },

  categories: {
    new: {
      id: 'new',
      title: 'Phim mới',
      endpoint: 'movies/latest'
    },
    series: {
      id: 'series',
      title: 'Phim bộ',
      endpoint: 'formats/series/movies'
    },
    single: {
      id: 'single',
      title: 'Phim lẻ',
      endpoint: 'formats/single/movies'
    }
  },

  ui: {
    defaultPoster: LOCAL_DEFAULT_POSTER,
    defaultBackdrop: LOCAL_DEFAULT_BACKDROP,
    itemsPerPage: SYSTEM_CONFIG.ui.itemsPerPage
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

export default MOVIE_CONFIG;
