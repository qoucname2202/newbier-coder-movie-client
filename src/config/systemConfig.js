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
    'https://core-movie-service.onrender.com/api/v1'
  ).replace(/\/+$/, ''),

  // Data fetching strategy mode:
  // - 'auto': Calls live API first, falls back gracefully to mock if empty/failed
  // - 'api_only': Strict live API, empty array if failed
  // - 'mock_only': Disables live network requests, uses local mock directly
  dataMode: process.env.NEXT_PUBLIC_DATA_MODE || 'auto',

  // Flag indicating whether to use mock data for instantaneous rendering
  useMockData: process.env.NEXT_PUBLIC_USE_MOCK_DATA !== 'false',

  // Global HTTP Request Timeout in milliseconds
  networkTimeoutMs: parseInt(process.env.NEXT_PUBLIC_API_TIMEOUT || '8000', 10),

  // UI pagination and display defaults
  ui: {
    itemsPerPage: 20,
    defaultPoster: LOCAL_DEFAULT_POSTER,
    defaultBackdrop: LOCAL_DEFAULT_BACKDROP,
    heroAutoPlayInterval: parseInt(process.env.NEXT_PUBLIC_HERO_AUTOPLAY_INTERVAL || '6000', 10),
    heroDescLimit: parseInt(process.env.NEXT_PUBLIC_HERO_DESC_LIMIT || '220', 10)
  }
};

export default SYSTEM_CONFIG;
