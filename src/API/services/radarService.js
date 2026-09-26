/**
 * @file radarService.js
 * @description API service for Cinema Trending Radar & Genre Pulse analytics.
 * Fully decoupled with automatic resilient fallback to mock data,
 * ensuring Frontend runs without disruption if Backend has not yet implemented the endpoints.
 */

import { mockTrendingRadar } from '@/mock/mockTrendingRadar';
import { safeFetchJson } from '@/API/services/movieService';

export const radarService = {
  /**
   * Fetches trending cinema radar metrics by timeframe.
   *
   * @param {Object} [params]
   * @param {'week'|'month'} [params.period='week'] - Timeframe scope
   * @returns {Promise<{
   *   discussed: Array<Object>,
   *   favorite: Array<Object>,
   *   breakthrough: Array<Object>,
   *   genres: Array<Object>,
   *   period: string
   * }>}
   */
  getTrendingRadar: async ({ period = 'week' } = {}) => {
    try {
      const result = await safeFetchJson(`/movies/trending-radar?period=${period}`, {}, null);
      const data = result?.data || result;

      if (data?.discussed && data?.genres) {
        return {
          discussed: data.discussed,
          favorite: data.favorite || [],
          views: data.views || data.breakthrough || [],
          breakthrough: data.views || data.breakthrough || [],
          genres: data.genres,
          period
        };
      }
    } catch {
      // Quietly handled
    }

    // Graceful fallback to verified mock datasets
    const fallbackData = mockTrendingRadar[period] || mockTrendingRadar.week;
    const viewsList = fallbackData.views || fallbackData.breakthrough || [];
    return {
      discussed: fallbackData.discussed,
      favorite: fallbackData.favorite,
      views: viewsList,
      breakthrough: viewsList,
      genres: fallbackData.genres,
      period,
      isFallback: true
    };
  },

  /**
   * Fetches full grid rankings (Top 30-50).
   *
   * @param {Object} [params]
   * @param {'discussed'|'favorite'|'views'} [params.category='discussed']
   * @param {'week'|'month'} [params.period='week']
   * @param {number} [params.limit=50]
   * @returns {Promise<Array<Object>>}
   */
  getTopRankingsGrid: async ({ category = 'discussed', period = 'week', limit = 50 } = {}) => {
    try {
      const result = await safeFetchJson(
        `/movies/rankings-grid?category=${category}&period=${period}&limit=${limit}`,
        {},
        null
      );
      const items = result?.data || result?.movies || result;
      if (Array.isArray(items) && items.length > 0) {
        return items.slice(0, limit);
      }
    } catch {
      // Handled via fallback
    }

    const { getTopRankingsGrid } = await import('@/mock/mockTrendingRadar');
    return getTopRankingsGrid({ category, period, limit });
  }
};

export default radarService;
