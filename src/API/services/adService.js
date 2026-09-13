
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
  getRandomVideoAd: async () => {
    try {
      const now = Date.now();
      if (requestCache.videoAd &&
          (now - requestCache.videoAdTimestamp) < requestCache.cacheDuration) {
        return requestCache.videoAd;
      }

      const response = await axios.get(`${API_URL}/advertisements/random?type=video`);
      if (response.data.success && response.data.advertisement) {
        requestCache.videoAd = response.data.advertisement;
        requestCache.videoAdTimestamp = now;
        return response.data.advertisement;
      }
      return null;
    } catch (error) {
      console.error('Error fetching video ad:', error);
      return null;
    }
  },

  getTopBannerAd: async () => {
    try {
      const response = await axios.get(`${API_URL}/advertisements/random?type=banner_top`);
      if (response.data.success && response.data.advertisement) {
        return response.data.advertisement;
      }
      return null;
    } catch (error) {
      console.error('Error fetching top banner ad:', error);
      return null;
    }
  },

  getBottomBannerAd: async () => {
    try {
      const response = await axios.get(`${API_URL}/advertisements/random?type=banner_bottom`);
      if (response.data.success && response.data.advertisement) {
        return response.data.advertisement;
      }
      return null;
    } catch (error) {
      console.error('Error fetching bottom banner ad:', error);
      return null;
    }
  },
  getMultipleBannerAds: async (position = 'top', limit = 3) => {
    try {
      const type = position === 'top' ? 'banner_top' : 'banner_bottom';
      const response = await axios.get(`${API_URL}/advertisements/random?type=${type}&limit=${limit}`);
      if (response.data.success && response.data.advertisements && response.data.advertisements.length > 0) {
        return response.data.advertisements;
      }
      const singleAd = await (position === 'top' ? adService.getTopBannerAd() : adService.getBottomBannerAd());
      return singleAd ? [singleAd] : [];
    } catch (error) {
      console.error(`Error fetching multiple ${position} banner ads:`, error);
      return [];
    }
  },
  getMultipleVideoAds: async (limit = 1) => {
    try {
      const now = Date.now();
      if (limit === 1 && requestCache.videoAd &&
          (now - requestCache.videoAdTimestamp) < requestCache.cacheDuration) {
        return [requestCache.videoAd];
      }

      const response = await axios.get(`${API_URL}/advertisements/random?type=video&limit=${limit}`);
      if (response.data.success && response.data.advertisements && response.data.advertisements.length > 0) {
        if (response.data.advertisements.length > 0) {
          requestCache.videoAd = response.data.advertisements[0];
          requestCache.videoAdTimestamp = now;
        }
        return response.data.advertisements;
      }

      const singleAd = await adService.getRandomVideoAd();
      return singleAd ? [singleAd] : [];
    } catch (error) {
      console.error('Error fetching multiple video ads:', error);
      return [];
    }
  },
  trackAdImpression: async (adId) => {
    try {
      const response = await axios.post(`${API_URL}/advertisements/view`, { adId });
      return response.data.success;
    } catch (error) {
      console.error('Error tracking ad impression:', error);
      return false;
    }
  },

  trackAdClick: async (adId) => {
    try {
      const response = await axios.post(`${API_URL}/advertisements/click`, { adId });
      return response.data.success;
    } catch (error) {
      console.error('Error tracking ad click:', error);
      return false;
    }
  },

  trackAdSkip: async (adId) => {
    try {
      const response = await axios.post(`${API_URL}/advertisements/skip`, { adId });
      return response.data.success;
    } catch (error) {
      console.error('Error tracking ad skip:', error);
      return false;
    }
  },
  getAllAds: async (page = 1, limit = 10, type = null, active = null) => {
    try {
      let url = `${API_URL}/advertisements?page=${page}&limit=${limit}`;
      if (type) url += `&type=${type}`;
      if (active !== null) url += `&active=${active}`;

      // await new Promise(resolve => setTimeout(resolve, 500));

      const response = await axios.get(url);
      return response.data;
    } catch (error) {
      console.error('Error fetching all ads:', error);

      if (error.response) {
      } else if (error.request) {
      } else {
      }

      return {
        success: false,
        advertisements: [],
        totalPages: 1,
        error: error.message || 'Network error when fetching advertisements'
      };
    }
  },

  getAdById: async (id) => {
    try {
      const response = await axios.get(`${API_URL}/advertisements/${id}`);
      return response.data.advertisement;
    } catch (error) {
      console.error('Error fetching ad by ID:', error);
      throw error;
    }
  },
  createAd: async (adData) => {
    try {
      const response = await axios.post(`${API_URL}/advertisements`, adData);
      return response.data;
    } catch (error) {
      console.error('Error creating ad:', error);

      if (error.response) {
        return {
          success: false,
          error: error.response.data?.message || `Server error: ${error.response.status}`,
          details: error.response.data
        };
      } else if (error.request) {
        return {
          success: false,
          error: 'No response received from server'
        };
      } else {
        return {
          success: false,
          error: error.message || 'Unknown error when creating advertisement'
        };
      }
    }
  },

  updateAd: async (id, adData) => {
    try {
      const response = await axios.put(`${API_URL}/advertisements/${id}`, adData);
      return response.data;
    } catch (error) {
      console.error('Error updating ad:', error);
      return {
        success: false,
        error: error.message || 'Network error when updating advertisement'
      };
    }  },

  deleteAd: async (id) => {
    try {
      const response = await axios.delete(`${API_URL}/advertisements/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting ad:', error);
      return {
        success: false,
        error: error.message || 'Network error when deleting advertisement'
      };
    }
  },

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
