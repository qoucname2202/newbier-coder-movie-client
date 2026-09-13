// searchHistoryService.js - Service cho lịch sử tìm kiếm
import axiosInstance from '../config/axiosConfig';

const searchHistoryService = {
  // Lưu truy vấn tìm kiếm vào lịch sử
  saveSearchHistory: async (query, filters = {}) => {
    try {
      const response = await axiosInstance.post('/search-history', {
        query,
        filters
      });
      
      // Đảm bảo trả về cả thông tin của mục lịch sử đã lưu
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

  // Lấy lịch sử tìm kiếm của người dùng
  getSearchHistory: async (limit = 8) => {
    try {
      const response = await axiosInstance.get(`/search-history?limit=${limit}`);
      // Đảm bảo xử lý đúng cấu trúc dữ liệu trả về từ API
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

  // Xóa một mục trong lịch sử tìm kiếm
  deleteSearchHistoryItem: async (id) => {
    try {
      const response = await axiosInstance.delete(`/search-history/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting search history item:', error);
      return { success: false, error: error.response?.data || error.message };
    }
  },

  // Xóa toàn bộ lịch sử tìm kiếm
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