/**
 * @file homeSectionsConfig.js
 * @description Centralized Section Registry and Fallback Strategy for the Homepage.
 * Configures all layout orders, customizable section props, and localized text labels.
 * 
 * IMPORTANT FOR AI / DEVELOPERS:
 * - Edit THIS file to change section ordering, card sizing, limits, badges, or languages.
 * - DO NOT modify the core rendering pipeline in src/pages/index.js unless altering component architecture.
 */

import movieService from '@/API/services/movieService';

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
    bigSlideBadge: 'ANIME SPOTLIGHT',
    animationTitle: 'Phim Hoạt Hình & Anime Đỉnh Cao',
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
    bigSlideBadge: 'ANIME SPOTLIGHT',
    animationTitle: 'Animation & Anime Showcase',
    latestTitle: 'Recently Added Movies',
    radarTitle: 'Genre Trending Radar',
    communityTitle: 'Live Community Discussion',
    upcomingTitle: 'Anticipated Upcoming Releases',
    infiniteLoading: 'Loading more movies...',
    allLoaded: 'All content loaded'
  }
};

// Current active locale (defaults to 'vi')
export const CURRENT_LOCALE = process.env.NEXT_PUBLIC_LOCALE || 'vi';
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
  const mode = process.env.NEXT_PUBLIC_DATA_MODE || 'auto';
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
 * Section Bundles Registry.
 * Centralizes all behaviors, props, limits, and data loaders for each homepage section.
 */
export const HOME_SECTIONS = {
  hero: {
    id: 'hero',
    limit: 6,
    load: (mock = []) => fetchFirstAvailable([
      () => movieService.getHeroMovies(6),
      () => movieService.getMoviesPage(1, 6)
    ], mock)
  },

  carousel_3d: {
    id: 'carousel_3d'
  },

  recommended: {
    id: 'recommended',
    cardSize: 'md',
    limit: 12,
    load: (mock = []) => fetchFirstAvailable([
      () => movieService.getMoviesPage(1, 12)
    ], mock)
  },

  top10: {
    id: 'top10',
    cardSize: 'md',
    limit: 10,
    badge: t('top10Badge'),
    load: (mock = []) => fetchFirstAvailable([
      () => movieService.getTrendingMovies(),
      () => movieService.getTopRatedMovies(),
      () => movieService.getMoviesPage(1, 10)
    ], mock)
  },

  country: {
    id: 'country',
    cardSize: 'md'
  },

  big_slide: {
    id: 'big_slide',
    badge: t('bigSlideBadge')
  },

  animation: {
    id: 'animation',
    cardSize: 'md'
  },

  latest: {
    id: 'latest',
    cardSize: 'md',
    limit: 24,
    load: (page = 1, limit = 24) => movieService.getMoviesPage(page, limit)
  },

  radar: {
    id: 'radar',
    enabled: true
  },

  community: {
    id: 'community',
    enabled: true
  },

  upcoming: {
    id: 'upcoming',
    cardSize: 'md'
  }
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
