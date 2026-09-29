/**
 * @file systemConfig.js
 * @description Single Source of Truth for Global Application Environment and System Settings.
 * Centralizes API base URLs, network timeouts, data modes, and global UI pagination standards.
 */

import {
  LOCAL_DEFAULT_BACKDROP,
  LOCAL_DEFAULT_POSTER
} from './movieFallbackConfig';

/**
 * Global System Configuration.
 */
export const SYSTEM_CONFIG = {
  // Application identity
  appName: 'NewbieCoder Movies',
  appVersion: '1.0.0',

  // Active locale (defaults to 'vi')
  locale: process.env.NEXT_PUBLIC_LOCALE || 'vi',

  // Base API endpoint for backend service - strictly read from environment
  apiBaseUrl: (
    process.env.NEXT_PUBLIC_CORE_API_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    ''
  ).replace(/\/+$/, ''),

  // Data fetching strategy mode:
  // - 'api_only': Strict live API, empty array if failed
  dataMode: process.env.NEXT_PUBLIC_DATA_MODE || 'api_only',

  // Homepage Snapshot mechanism toggle
  enableHomepageSnapshot: process.env.NEXT_PUBLIC_ENABLE_HOMEPAGE_SNAPSHOT === 'true',

  // Flag indicating whether to use mock data
  useMockData: process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true',

  // Global HTTP Request Timeout in milliseconds
  networkTimeoutMs: parseInt(process.env.NEXT_PUBLIC_API_TIMEOUT || '8000', 10),

  // UI pagination and display defaults
  ui: {
    itemsPerPage: 20,
    defaultPoster: LOCAL_DEFAULT_POSTER,
    defaultBackdrop: LOCAL_DEFAULT_BACKDROP,
    heroAutoPlayInterval: parseInt(process.env.NEXT_PUBLIC_HERO_AUTOPLAY_INTERVAL || '6000', 10),
    heroDescLimit: parseInt(process.env.NEXT_PUBLIC_HERO_DESC_LIMIT || '220', 10)
  },

  // TMDB External API Configuration
  tmdb: {
    apiKey: process.env.NEXT_PUBLIC_TMDB_API_KEY || '5739ebb7d66fa1dd775f806325ab4067',
    authToken: process.env.NEXT_PUBLIC_TMDB_AUTH_TOKEN || '',
    baseUrl: (process.env.NEXT_PUBLIC_TMDB_BASE_URL || 'https://api.themoviedb.org/3').replace(/\/+$/, ''),
    imageBaseUrl: (process.env.NEXT_PUBLIC_TMDB_IMAGE_URL || 'https://image.tmdb.org/t/p').replace(/\/+$/, ''),
    imageSizes: {
      avatar: 'w185',
      poster: 'w500',
      backdrop: 'w1280',
      original: 'original'
    },
    // Helper to get formatted TMDB image URL with fallback
    getImageUrl: (path, size = 'w500', fallback = '/img/default-poster.jpg') => {
      if (!path) return fallback;
      if (path.startsWith('http')) return path;
      const cleanPath = path.startsWith('/') ? path : `/${path}`;
      const base = (process.env.NEXT_PUBLIC_TMDB_IMAGE_URL || 'https://image.tmdb.org/t/p').replace(/\/+$/, '');
      return `${base}/${size}${cleanPath}`;
    }
  },

  // YouTube Configuration
  youtube: {
    embedBaseUrl: 'https://www.youtube.com/embed',
    watchBaseUrl: 'https://www.youtube.com/watch?v=',
    getEmbedUrl: (videoKey, params = 'autoplay=1&rel=0&modestbranding=1') => {
      if (!videoKey) return '';
      return `https://www.youtube.com/embed/${videoKey}?${params}`;
    }
  }
};

export const TMDB_CONFIG = SYSTEM_CONFIG.tmdb;
export const YOUTUBE_CONFIG = SYSTEM_CONFIG.youtube;

export default SYSTEM_CONFIG;
