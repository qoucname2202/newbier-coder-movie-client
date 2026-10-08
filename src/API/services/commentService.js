/**
 * @file commentService.js
 * @description API service and contract client for Community Comments & Live Buzz.
 * Returns live backend data or clean empty states without mock dependencies.
 */

import { safeFetchJson } from '@/API/services/movieService';

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
      const result = await safeFetchJson(`/comments/top?period=${period}&limit=${limit}`, {}, null);
      const comments = result?.data?.comments || result?.comments || [];

      if (Array.isArray(comments) && comments.length > 0) {
        return {
          comments: comments.slice(0, limit),
          total: result?.total || comments.length,
          period
        };
      }
    } catch {
      // Quietly handled
    }

    return {
      comments: [],
      total: 0,
      period
    };
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
      const result = await safeFetchJson(`/comments/live-buzz?limit=${limit}`, {}, null);
      const comments = result?.data?.comments || result?.comments || [];

      if (Array.isArray(comments) && comments.length > 0) {
        return {
          comments: comments.slice(0, limit)
        };
      }
    } catch {
      // Quietly handled
    }

    return {
      comments: []
    };
  }
};

export default commentService;
