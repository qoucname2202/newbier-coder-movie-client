import axiosInstance from '../config/axiosConfig';

const searchHistoryService = {
  saveSearchHistory: async (query, filters = {}) => {
    try {
      const response = await axiosInstance.post('/search-history', {
        query,
        filters
      });

      if (response.data && response.data.success) {
        return {
          success: true,
          savedItem: response.data.savedItem || response.data.data,
          message: response.data.message
        };
      }
      return response.data;
    } catch (error) {
      console.error('Error saving search history:', error);
      return { success: false, error: error.response?.data || error.message };
    }
  },

  getSearchHistory: async (limit = 8) => {
    try {
      const response = await axiosInstance.get(`/search-history?limit=${limit}`);
      if (response.data && response.data.success) {
        return {
          success: true,
          searchHistory: response.data.data?.searchHistory || []
        };
      }
      return { success: false, searchHistory: [] };
    } catch (error) {
      console.error('Error fetching search history:', error);
      return { success: false, searchHistory: [] };
    }
  },

  deleteSearchHistoryItem: async (id) => {
    try {
      const response = await axiosInstance.delete(`/search-history/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting search history item:', error);
      return { success: false, error: error.response?.data || error.message };
    }
  },

  clearSearchHistory: async () => {
    try {
      const response = await axiosInstance.delete('/search-history');
      return response.data;
    } catch (error) {
      console.error('Error clearing search history:', error);
      return { success: false, error: error.response?.data || error.message };
    }
  }
};

export default searchHistoryService;