/**
 * @file commentService.js
 * @description API service and contract client for Community Comments & Live Buzz.
 * Fully decoupled with automatic resilient fallback to mock data,
 * allowing Frontend to operate smoothly even if Backend has not yet implemented the endpoints.
 */

import {
  mockTopCommentsWeek,
  mockTopCommentsMonth,
  mockTopCommentsAll,
  mockLiveBuzzComments
} from '@/mock/mockComments';
import { MOVIE_CONFIG } from '@/config/movieConfig';

const API_BASE = MOVIE_CONFIG.apiBaseUrl || 'http://localhost:5000/api';

export const commentService = {
  /**
   * Fetches top-ranked community comments sorted by algorithm score.
   * Priority period is 'week' by default.
   *
   * @param {Object} [params]
   * @param {'week'|'month'|'all'} [params.period='week'] - Time scope filter
   * @param {number} [params.limit=6] - Number of comments to return
   * @returns {Promise<{ comments: Array<Object>, total: number, period: string }>}
   */
  getTopComments: async ({ period = 'week', limit = 6 } = {}) => {
    try {
      const res = await fetch(`${API_BASE}/comments/top?period=${period}&limit=${limit}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!res.ok) {
        // Backend returned 404/500: gracefully fallback to mock
        throw new Error(`API returned status ${res.status}`);
      }

      const result = await res.json();
      const comments = result?.data?.comments || result?.comments || [];

      if (comments.length > 0) {
        return {
          comments: comments.slice(0, limit),
          total: result?.total || comments.length,
          period
        };
      }

      throw new Error('Empty comments returned from server');
    } catch (error) {
      // Safe Fallback to Mock Data based on requested period
      let fallbackData = mockTopCommentsWeek;
      if (period === 'month') fallbackData = mockTopCommentsMonth;
      if (period === 'all') fallbackData = mockTopCommentsAll;

      return {
        comments: fallbackData.slice(0, limit),
        total: fallbackData.length,
        period,
        isFallback: true
      };
    }
  },

  /**
   * Fetches realtime live buzz comments stream across concurrent movies.
   *
   * @param {Object} [params]
   * @param {number} [params.limit=12] - Number of comments to stream
   * @returns {Promise<{ comments: Array<Object> }>}
   */
  getLiveBuzzComments: async ({ limit = 12 } = {}) => {
    try {
      const res = await fetch(`${API_BASE}/comments/live-buzz?limit=${limit}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!res.ok) throw new Error(`API returned status ${res.status}`);

      const result = await res.json();
      const comments = result?.data?.comments || result?.comments || [];

      if (comments.length > 0) {
        return {
          comments: comments.slice(0, limit)
        };
      }

      throw new Error('Empty live buzz returned');
    } catch (error) {
      return {
        comments: mockLiveBuzzComments.slice(0, limit),
        isFallback: true
      };
    }
  }
};

export default commentService;
