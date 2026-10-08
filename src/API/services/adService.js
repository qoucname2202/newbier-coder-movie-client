/**
 * @file adService.js
 * @description Advertisement client service with safe offline error handling and caching.
 */

import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const requestCache = {
  videoAd: null,
  videoAdTimestamp: 0,
  bannerTopAd: null,
  bannerTopTimestamp: 0,
  bannerBottomAd: null,
  bannerBottomTimestamp: 0,
  cacheDuration: 300000
};

const adService = {
  /**
   * Fetches a random video advertisement with caching.
   * @returns {Promise<Object|null>}
   */
  getRandomVideoAd: async () => {
    try {
      const now = Date.now();
      if (
        requestCache.videoAd &&
        now - requestCache.videoAdTimestamp < requestCache.cacheDuration
      ) {
        return requestCache.videoAd;
      }

      const response = await axios
        .get(`${API_URL}/advertisements/random?type=video`, { timeout: 1200 })
        .catch(() => null);

      if (response?.data?.success && response.data.advertisement) {
        requestCache.videoAd = response.data.advertisement;
        requestCache.videoAdTimestamp = now;
        return response.data.advertisement;
      }
      return null;
    } catch {
      return null;
    }
  },

  /**
   * Fetches top banner advertisement.
   * @returns {Promise<Object|null>}
   */
  getTopBannerAd: async () => {
    try {
      const response = await axios
        .get(`${API_URL}/advertisements/random?type=banner_top`, { timeout: 1200 })
        .catch(() => null);

      if (response?.data?.success && response.data.advertisement) {
        return response.data.advertisement;
      }
      return null;
    } catch {
      return null;
    }
  },

  /**
   * Fetches bottom banner advertisement.
   * @returns {Promise<Object|null>}
   */
  getBottomBannerAd: async () => {
    try {
      const response = await axios
        .get(`${API_URL}/advertisements/random?type=banner_bottom`, { timeout: 1200 })
        .catch(() => null);

      if (response?.data?.success && response.data.advertisement) {
        return response.data.advertisement;
      }
      return null;
    } catch {
      return null;
    }
  },

  /**
   * Fetches multiple banner advertisements by position (top/bottom).
   * @param {'top'|'bottom'} [position='top']
   * @param {number} [limit=3]
   * @returns {Promise<Array<Object>>}
   */
  getMultipleBannerAds: async (position = 'top', limit = 3) => {
    try {
      const type = position === 'top' ? 'banner_top' : 'banner_bottom';
      const response = await axios
        .get(`${API_URL}/advertisements/random?type=${type}&limit=${limit}`, { timeout: 1200 })
        .catch(() => null);

      if (response?.data?.success && Array.isArray(response.data.advertisements) && response.data.advertisements.length > 0) {
        return response.data.advertisements;
      }

      const singleAd = await (position === 'top' ? adService.getTopBannerAd() : adService.getBottomBannerAd());
      return singleAd ? [singleAd] : [];
    } catch {
      return [];
    }
  },

  /**
   * Fetches multiple video advertisements.
   * @param {number} [limit=1]
   * @returns {Promise<Array<Object>>}
   */
  getMultipleVideoAds: async (limit = 1) => {
    try {
      const now = Date.now();
      if (
        limit === 1 &&
        requestCache.videoAd &&
        now - requestCache.videoAdTimestamp < requestCache.cacheDuration
      ) {
        return [requestCache.videoAd];
      }

      const response = await axios
        .get(`${API_URL}/advertisements/random?type=video&limit=${limit}`, { timeout: 1200 })
        .catch(() => null);

      if (response?.data?.success && Array.isArray(response.data.advertisements) && response.data.advertisements.length > 0) {
        requestCache.videoAd = response.data.advertisements[0];
        requestCache.videoAdTimestamp = now;
        return response.data.advertisements;
      }

      const singleAd = await adService.getRandomVideoAd();
      return singleAd ? [singleAd] : [];
    } catch {
      return [];
    }
  },

  /**
   * Tracks ad impression count safely.
   * @param {string} adId
   * @returns {Promise<boolean>}
   */
  trackAdImpression: async (adId) => {
    try {
      const response = await axios
        .post(`${API_URL}/advertisements/view`, { adId }, { timeout: 1200 })
        .catch(() => null);
      return !!response?.data?.success;
    } catch {
      return false;
    }
  },

  /**
   * Tracks ad click count safely.
   * @param {string} adId
   * @returns {Promise<boolean>}
   */
  trackAdClick: async (adId) => {
    try {
      const response = await axios
        .post(`${API_URL}/advertisements/click`, { adId }, { timeout: 1200 })
        .catch(() => null);
      return !!response?.data?.success;
    } catch {
      return false;
    }
  },

  /**
   * Tracks ad skip count safely.
   * @param {string} adId
   * @returns {Promise<boolean>}
   */
  trackAdSkip: async (adId) => {
    try {
      const response = await axios
        .post(`${API_URL}/advertisements/skip`, { adId }, { timeout: 1200 })
        .catch(() => null);
      return !!response?.data?.success;
    } catch {
      return false;
    }
  },

  /**
   * Fetches paginated advertisements for admin panel.
   * @param {number} [page=1]
   * @param {number} [limit=10]
   * @param {string|null} [type=null]
   * @param {boolean|null} [active=null]
   * @returns {Promise<Object>}
   */
  getAllAds: async (page = 1, limit = 10, type = null, active = null) => {
    try {
      let url = `${API_URL}/advertisements?page=${page}&limit=${limit}`;
      if (type) url += `&type=${type}`;
      if (active !== null) url += `&active=${active}`;

      const response = await axios.get(url, { timeout: 1500 }).catch(() => null);
      if (response?.data) return response.data;

      return {
        success: false,
        advertisements: [],
        totalPages: 1,
        error: 'Network error or backend unavailable'
      };
    } catch {
      return {
        success: false,
        advertisements: [],
        totalPages: 1,
        error: 'Network error or backend unavailable'
      };
    }
  },

  /**
   * Fetches single advertisement by ID.
   * @param {string} id
   * @returns {Promise<Object|null>}
   */
  getAdById: async (id) => {
    try {
      const response = await axios
        .get(`${API_URL}/advertisements/${id}`, { timeout: 1500 })
        .catch(() => null);
      return response?.data?.advertisement || null;
    } catch {
      return null;
    }
  },

  /**
   * Creates new advertisement.
   * @param {Object} adData
   * @returns {Promise<Object>}
   */
  createAd: async (adData) => {
    try {
      const response = await axios
        .post(`${API_URL}/advertisements`, adData, { timeout: 2000 })
        .catch(err => err?.response || null);
      return response?.data || { success: false, error: 'Cannot connect to server' };
    } catch (error) {
      return { success: false, error: error.message || 'Cannot connect to server' };
    }
  },

  /**
   * Updates existing advertisement.
   * @param {string} id
   * @param {Object} adData
   * @returns {Promise<Object>}
   */
  updateAd: async (id, adData) => {
    try {
      const response = await axios
        .put(`${API_URL}/advertisements/${id}`, adData, { timeout: 2000 })
        .catch(err => err?.response || null);
      return response?.data || { success: false, error: 'Cannot connect to server' };
    } catch (error) {
      return { success: false, error: error.message || 'Cannot connect to server' };
    }
  },

  /**
   * Deletes advertisement by ID.
   * @param {string} id
   * @returns {Promise<Object>}
   */
  deleteAd: async (id) => {
    try {
      const response = await axios
        .delete(`${API_URL}/advertisements/${id}`, { timeout: 2000 })
        .catch(err => err?.response || null);
      return response?.data || { success: false, error: 'Cannot connect to server' };
    } catch (error) {
      return { success: false, error: error.message || 'Cannot connect to server' };
    }
  },

  /**
   * Clears local in-memory cache.
   * @returns {boolean}
   */
  clearCache: () => {
    requestCache.videoAd = null;
    requestCache.videoAdTimestamp = 0;
    requestCache.bannerTopAd = null;
    requestCache.bannerTopTimestamp = 0;
    requestCache.bannerBottomAd = null;
    requestCache.bannerBottomTimestamp = 0;
    return true;
  }
};

export default adService;
