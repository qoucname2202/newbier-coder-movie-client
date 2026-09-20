/**
 * @file radarService.js
 * @description API service for Cinema Trending Radar & Genre Pulse analytics.
 * Fully decoupled with automatic resilient fallback to mock data,
 * ensuring Frontend runs without disruption if Backend has not yet implemented the endpoints.
 */

import { mockTrendingRadar } from '@/mock/mockTrendingRadar';
import { MOVIE_CONFIG } from '@/config/movieConfig';

const API_BASE = MOVIE_CONFIG.apiBaseUrl || 'http://localhost:5000/api';

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
      const res = await fetch(`${API_BASE}/movies/trending-radar?period=${period}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!res.ok) {
        throw new Error(`API returned status ${res.status}`);
      }

      const result = await res.json();
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

      throw new Error('Incomplete radar data from API');
    } catch (error) {
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
    }
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
      const res = await fetch(
        `${API_BASE}/movies/rankings-grid?category=${category}&period=${period}&limit=${limit}`,
        {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        }
      );

      if (!res.ok) throw new Error(`API returned status ${res.status}`);

      const result = await res.json();
      const items = result?.data || result?.movies || result;
      if (Array.isArray(items) && items.length > 0) {
        return items.slice(0, limit);
      }
      throw new Error('Empty rankings grid returned');
    } catch (error) {
      const { getTopRankingsGrid } = await import('@/mock/mockTrendingRadar');
      return getTopRankingsGrid({ category, period, limit });
    }
  }
};

export default radarService;

