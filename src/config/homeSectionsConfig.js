/**
 * @file homeSectionsConfig.js
 * @description Centralized Section Registry and Fallback Strategy for the Homepage.
 * Configures all layout orders, customizable section props, and localized text labels.
 * 
 * ARCHITECTURE - BATCHED SEQUENTIAL LOADING:
 * - Each section declares `loadAfterScroll: boolean`.
 * - `loadAfterScroll: false`: Loaded in batch together with the preceding section (Tải kèm).
 * - `loadAfterScroll: true`: Defines a scroll breakpoint (Điểm dừng). Pauses loading until user scrolls to it.
 * - `BATCH_LOADING_CONFIG.delayMs`: Configurable waiting time (default: 2000ms = 2s) with spinner before revealing the batch.
 */

import movieService from '@/API/services/movieService';
import { SYSTEM_CONFIG } from './systemConfig';

/**
 * Global Batch Loading Timing Configuration.
 * Customize the waiting duration (in milliseconds) before any scroll batch reveals its content.
 */
export const BATCH_LOADING_CONFIG = {
  // Default waiting delay in milliseconds (2000ms = 2 seconds)
  delayMs: 2000,
};

/**
 * Supported UI language dictionaries.
 * Switch active language by changing NEXT_PUBLIC_LOCALE or editing the dictionary below.
 */
export const HOME_I18N = {
  vi: {
    heroTitle: 'Phim Nổi Bật',
    recommendedTitle: 'Phim Đề Cử Cho Bạn',
    top10Title: 'Phim Được Xem Nhiều Nhất',
    top10Badge: 'TOP 10',
    countryTitle: 'Phim Hàn Quốc & Trung Quốc Đặc Sắc',
    koreanRailTitle: 'Phim Hàn Quốc Mới',
    koreanRailBadge: 'K-DRAMA',
    chineseRailTitle: 'Phim Trung Quốc Mới',
    chineseRailBadge: 'C-DRAMA',
    bigSlideTitle: 'Tiêu Điểm Anime',
    bigSlideBadge: 'ANIME SPOTLIGHT',
    animationTitle: 'Phim Hoạt Hình & Anime Đỉnh Cao',
    animationBadge: 'ANIME & CARTOON',
    latestTitle: 'Phim Mới Cập Nhật',
    radarTitle: 'Radar Xu Hướng Thể Loại',
    communityTitle: 'Cộng Đồng Thảo Luận Trực Tuyến',
    upcomingTitle: 'Phim Sắp Chiếu Đáng Chờ Đợi',
    infiniteLoading: 'Đang tải thêm nội dung...',
    allLoaded: 'Đã hiển thị toàn bộ nội dung'
  },
  en: {
    heroTitle: 'Featured Spotlight',
    recommendedTitle: 'Recommended For You',
    top10Title: 'Most Viewed Movies',
    top10Badge: 'TOP 10',
    countryTitle: 'K-Drama & C-Drama Highlights',
    koreanRailTitle: 'Trending Korean Drama',
    koreanRailBadge: 'K-DRAMA',
    chineseRailTitle: 'Trending Chinese Drama',
    chineseRailBadge: 'C-DRAMA',
    bigSlideTitle: 'Anime Spotlight',
    bigSlideBadge: 'ANIME SPOTLIGHT',
    animationTitle: 'Animation & Anime Showcase',
    animationBadge: 'ANIME & CARTOON',
    latestTitle: 'Recently Added Movies',
    radarTitle: 'Genre Trending Radar',
    communityTitle: 'Live Community Discussion',
    upcomingTitle: 'Anticipated Upcoming Releases',
    infiniteLoading: 'Loading more movies...',
    allLoaded: 'All content loaded'
  }
};

// Current active locale (synchronized with SYSTEM_CONFIG)
export const CURRENT_LOCALE = SYSTEM_CONFIG.locale || 'vi';
export const t = (key) => (HOME_I18N[CURRENT_LOCALE] || HOME_I18N.vi)[key] || key;

/**
 * Sequential Fallback Runner.
 * Executes steps sequentially from top to bottom, returning the first non-empty list.
 * 
 * @param {Array<() => Promise<Array>>} steps - Sequence of fetch tasks by priority
 * @param {Array} [fallback=[]] - Safety mock dataset if all API calls fail
 * @returns {Promise<Array>}
 */
export async function fetchFirstAvailable(steps = [], fallback = []) {
  const mode = SYSTEM_CONFIG.dataMode || 'api_only';
  if (mode === 'mock_only') return fallback;

  for (const step of steps) {
    try {
      const data = await step();
      if (Array.isArray(data) && data.length > 0) return data;
    } catch {
      // Step failed or empty -> proceed to the next fallback step
    }
  }

  return mode === 'api_only' ? [] : fallback;
}

/**
 * Factory for creating Section Configurations with consistent schema defaults.
 *
 * @param {Object} options - Section configuration overrides
 * @returns {Object} Standardized section definition
 */
export function defineSection(options) {
  return {
    enabled: true,
    isFullWidth: false,
    minHeight: 320,
    cardSize: 'md',
    limit: 20,
    loadAfterScroll: false,
    delayMs: BATCH_LOADING_CONFIG.delayMs,
    ...options
  };
}

/**
 * Section Bundles Registry.
 * Centralizes all behaviors, layout modes, props, limits, data loaders, and loading breakpoints.
 */
export const HOME_SECTIONS = {
  // === BATCH 1: CRITICAL INITIAL VIEWPORT (Loaded immediately on page open) ===
  hero: defineSection({
    id: 'hero',
    isFullWidth: true,
    minHeight: 520,
    limit: 6,
    loadAfterScroll: false,
    load: (mock = []) => fetchFirstAvailable([
      () => movieService.getHeroMovies(6),
      () => movieService.getMoviesPage(1, 6)
    ], mock)
  }),

  carousel_3d: defineSection({
    id: 'carousel_3d',
    isFullWidth: true,
    minHeight: 380,
    loadAfterScroll: false
  }),

  recommended: defineSection({
    id: 'recommended',
    minHeight: 320,
    limit: 12,
    loadAfterScroll: false,
    load: (mock = []) => fetchFirstAvailable([
      () => movieService.getMoviesPage(1, 12)
    ], mock)
  }),

  top10: defineSection({
    id: 'top10',
    minHeight: 280,
    limit: 10,
    badge: t('top10Badge'),
    loadAfterScroll: false,
    load: (mock = []) => fetchFirstAvailable([
      () => movieService.getTrendingMovies(),
      () => movieService.getTopRatedMovies(),
      () => movieService.getMoviesPage(1, 10)
    ], mock)
  }),

  // === BATCH 2: SCROLL BREAKPOINT 1 (Pauses until user scrolls past Batch 1) ===
  country: defineSection({
    id: 'country',
    minHeight: 320,
    loadAfterScroll: true, // BREAKPOINT 1: Pauses until scrolled to
    delayMs: 2000,
    rails: [
      {
        id: 'korean',
        countrySlug: 'han-quoc',
        limit: 20,
        title: t('koreanRailTitle'),
        badge: t('koreanRailBadge'),
        viewAllHref: '/quoc-gia/han-quoc',
        load: (fallback = []) => fetchFirstAvailable([
          () => movieService.getMoviesByCountry('han-quoc', 20)
        ], fallback)
      },
      {
        id: 'chinese',
        countrySlug: 'trung-quoc',
        limit: 20,
        title: t('chineseRailTitle'),
        badge: t('chineseRailBadge'),
        viewAllHref: '/quoc-gia/trung-quoc',
        load: (fallback = []) => fetchFirstAvailable([
          () => movieService.getMoviesByCountry('trung-quoc', 20)
        ], fallback)
      }
    ]
  }),

  big_slide: defineSection({
    id: 'big_slide',
    minHeight: 360,
    title: t('bigSlideTitle'),
    badge: t('bigSlideBadge'),
    categorySlug: 'hoat-hinh',
    limit: 6,
    autoPlayInterval: 7000,
    viewAllHref: '/the-loai/hoat-hinh',
    loadAfterScroll: false, // Loads in batch with country
    load: (mock = []) => fetchFirstAvailable([
      () => movieService.getMoviesByCategory('hoat-hinh', 6),
      () => movieService.getHeroMovies(6)
    ], mock)
  }),

  animation: defineSection({
    id: 'animation',
    minHeight: 320,
    title: t('animationTitle'),
    badge: t('animationBadge'),
    categorySlug: 'hoat-hinh',
    limit: 20,
    viewAllHref: '/the-loai/hoat-hinh',
    loadAfterScroll: false, // Loads in batch with country
    load: (mock = []) => fetchFirstAvailable([
      () => movieService.getMoviesByCategory('hoat-hinh', 20)
    ], mock)
  }),

  // === BATCH 3: SCROLL BREAKPOINT 2 (Pauses until user scrolls past Batch 2) ===
  latest: defineSection({
    id: 'latest',
    minHeight: 480,
    limit: 24,
    loadAfterScroll: true, // BREAKPOINT 2: Pauses until scrolled to
    delayMs: 2000,
    load: (page = 1, limit = 24) => movieService.getMoviesPage(page, limit)
  }),

  radar: defineSection({
    id: 'radar',
    minHeight: 320,
    title: t('radarTitle'),
    defaultPeriod: 'week',
    defaultCategory: 'views',
    loadAfterScroll: false // Loads in batch with latest
  }),

  community: defineSection({
    id: 'community',
    minHeight: 320,
    title: t('communityTitle'),
    limit: 10,
    loadAfterScroll: false // Loads in batch with latest
  }),

  // === BATCH 4: BOTTOM LAZY SECTION ===
  upcoming: defineSection({
    id: 'upcoming',
    minHeight: 320,
    limit: 15,
    loadAfterScroll: true, // BREAKPOINT 3: Loads at bottom of page
    delayMs: 2000
  })
};

/**
 * Section Display Order.
 * - Change the array ordering to reorder sections on the homepage.
 * - Remove an ID from this array to temporarily hide that section.
 */
export const HOME_SECTION_ORDER = [
  'hero',
  'carousel_3d',
  'recommended',
  'top10',
  'country',
  'big_slide',
  'animation',
  'latest',
  'radar',
  'community',
  'upcoming'
];
