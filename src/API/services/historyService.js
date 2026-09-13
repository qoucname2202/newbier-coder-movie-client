import axiosInstance from '../config/axiosConfig';

const getAuthToken = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('auth_token') || localStorage.getItem('token');
  }
  return null;
};

const historyService = {
  addToHistory: async (movieData) => {
    try {
      const token = getAuthToken();
      if (!token) {
        console.warn("No auth token available for history request");
        throw new Error("Bạn cần đăng nhập để lưu lịch sử xem phim");
      }

      const response = await axiosInstance.post('/history', movieData);
      return response.data;
    } catch (error) {
      console.error('Error adding movie to history:', error.response?.data || error.message);
      throw error;
    }
  },

  addToHistoryById: async (movieId, additionalData = {}) => {
    try {
      const token = getAuthToken();
      if (!token) {
        console.warn("No auth token available for history request");
        throw new Error("Bạn cần đăng nhập để lưu lịch sử xem phim");
      }

      const response = await axiosInstance.post(`/history/${movieId}`, additionalData);
      return response.data;
    } catch (error) {
      console.error('Error adding movie to history by ID:', error.response?.data || error.message);
      throw error;
    }
  },

  getUserHistory: async (limit = 10, page = 1, filter = 'all', sort = 'newest', searchQuery = '') => {
    try {
      const token = getAuthToken();
      if (!token) {
        console.warn('No authentication token found');
        return { total: 0, page: 1, pages: 0, histories: [] };
      }

      let url = `/history?limit=${limit}&page=${page}`;

      if (filter !== 'all') {
        url += `&filter=${filter}`;
      }

      url += `&sort=${sort}`;

      if (searchQuery) {
        url += `&search=${encodeURIComponent(searchQuery)}`;
      }

      const response = await axiosInstance.get(url);

      if (response.data && response.data.data) {
        const historyData = response.data.data;
        return {
          total: historyData.total || 0,
          page: historyData.page || page,
          pages: historyData.pages || 1,
          histories: historyData.histories || []
        };
      } else if (response.data && response.data.histories) {
        const historyData = response.data;
        return {
          total: historyData.total || 0,
          page: historyData.page || page,
          pages: historyData.pages || 1,
          histories: historyData.histories || []
        };
      } else if (response.data && response.data.success && response.data.message === "Lấy lịch sử xem phim thành công") {
        const histories = response.data.histories || [];
        return {
          total: response.data.total || histories.length,
          page: response.data.page || page,
          pages: response.data.pages || 1,
          histories: histories
        };
      }

      console.warn("Unexpected response format:", response.data);
      return {
        total: 0,
        page: page,
        pages: 1,
        histories: []
      };
    } catch (error) {
      console.error('Error fetching user history:', error.response?.data || error.message);
      if (error.response?.status === 401) {
        console.warn('Authentication required for history');
      }
      return { total: 0, page: 1, pages: 0, histories: [] };
    }
  },

  getUserHistoryById: async (userId, limit = 10, page = 1, filter = 'all', sort = 'newest') => {
    try {
      const token = getAuthToken();
      if (!token) {
        console.warn('No authentication token found');
        return { total: 0, page: 1, pages: 0, histories: [] };
      }

      const url = `/history/users/${userId}?limit=${limit}&page=${page}&filter=${filter}&sort=${sort}`;
      const response = await axiosInstance.get(url);

      if (response.data && response.data.data) {
        const historyData = response.data.data;
        return {
          total: historyData.total || 0,
          page: historyData.page || page,
          pages: historyData.pages || 1,
          histories: historyData.histories || []
        };
      } else if (response.data) {
        const historyData = response.data;
        return {
          total: historyData.total || 0,
          page: historyData.page || page,
          pages: historyData.pages || 1,
          histories: historyData.histories || []
        };
      }

      console.warn("Unexpected response format:", response.data);
      return {
        total: 0,
        page: page,
        pages: 1,
        histories: []
      };
    } catch (error) {
      console.error('Error fetching user history by ID:', error.response?.data || error.message);
      if (error.response?.status === 401) {
        console.warn('Authentication required for history');
      }
      return { total: 0, page: 1, pages: 0, histories: [] };
    }
  },

  deleteHistory: async (historyId) => {
    try {
      const token = getAuthToken();
      if (!token) {
        throw new Error("Bạn cần đăng nhập để xóa lịch sử");
      }

      const response = await axiosInstance.delete(`/history/${historyId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting history:', error.response?.data || error.message);
      throw error;
    }
  },

  clearAllHistory: async () => {
    try {
      const token = getAuthToken();
      if (!token) {
        throw new Error("Bạn cần đăng nhập để xóa lịch sử");
      }

      const response = await axiosInstance.delete('/history/clear');
      return response.data;
    } catch (error) {
      console.error('Error clearing history:', error.response?.data || error.message);
      throw error;
    }
  },

  startWatchSession: async (data) => {
    try {
      const token = getAuthToken();
      if (!token) {
        console.warn("No auth token available");
        throw new Error("Bạn cần đăng nhập để theo dõi thời gian xem phim");
      }

      const response = await axiosInstance.post('/history/watch-session/start', data);
      return response.data;
    } catch (error) {
      console.error('Error starting watch session:', error.response?.data || error.message);
      throw error;
    }
  },

  endWatchSession: async (data) => {
    try {
      const token = getAuthToken();
      if (!token) {
        console.warn("No auth token available");
        throw new Error("Bạn cần đăng nhập để lưu thời gian xem phim");
      }

      const response = await axiosInstance.post('/history/watch-session/end', data);
      return response.data;
    } catch (error) {
      console.error('Error ending watch session:', error.response?.data || error.message);
      throw error;
    }
  },

  updateWatchPosition: async (data) => {
    try {
      const token = getAuthToken();
      if (!token) {
        console.warn("No auth token available");
        throw new Error("Bạn cần đăng nhập để lưu vị trí xem phim");
      }

      const response = await axiosInstance.put('/history/watch-session/update', data);
      return response.data;
    } catch (error) {
      console.error('Error updating watch position:', error.response?.data || error.message);
      throw error;
    }
  },

  getTotalWatchTime: async () => {
    try {
      const token = getAuthToken();
      if (!token) {
        console.warn("No auth token available");
        throw new Error("Bạn cần đăng nhập để xem thống kê");
      }

      const response = await axiosInstance.get('/history/total-watch-time');
      return response.data.data;
    } catch (error) {
      console.error('Error getting total watch time:', error.response?.data || error.message);
      return {
        totalWatchTimeSeconds: 0,
        totalWatchTimeFormatted: "0 giờ 0 phút 0 giây",
        totalWatchTimeHours: 0,
        totalWatchTimeMinutes: 0,
        totalMoviesWatched: 0,
        totalSeriesWatched: 0,
        totalMoviesCompleted: 0
      };
    }
  }
};

export default historyService;