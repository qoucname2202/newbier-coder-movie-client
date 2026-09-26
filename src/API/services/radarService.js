/**
 * @file radarService.js
 * @description API service for Cinema Trending Radar & Genre Pulse analytics.
 * Returns live data or clean empty structures without mock dependencies.
 */

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
   *   views: Array<Object>,
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

    return {
      discussed: [],
      favorite: [],
      views: [],
      breakthrough: [],
      genres: [],
      period
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
      // Handled silently
    }

    return [];
  }
};

export default radarService;
