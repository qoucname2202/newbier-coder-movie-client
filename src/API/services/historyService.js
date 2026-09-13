import axiosInstance from '../config/axiosConfig';

const getAuthToken = () => {
  // Kiểm tra xem đang ở môi trường trình duyệt không
  if (typeof window !== 'undefined') {
    return localStorage.getItem('auth_token') || localStorage.getItem('token');
  }
  return null;
};

const historyService = {
  // Thêm phim vào lịch sử của người dùng
  addToHistory: async (movieData) => {
    try {
        console.log("Adding to history:", movieData);
      // Đảm bảo token được bao gồm trong yêu cầu
      const token = getAuthToken();
      if (!token) {
        console.warn("No auth token available for history request");
        throw new Error("Bạn cần đăng nhập để lưu lịch sử xem phim");
      }

      const response = await axiosInstance.post('/history', movieData);
      console.log("History add response:", response.data);
      return response.data;
    } catch (error) {
      console.error('Error adding movie to history:', error.response?.data || error.message);
      throw error;
    }
  },
  
  // Thêm phim vào lịch sử theo ID
  addToHistoryById: async (movieId, additionalData = {}) => {
    try {
      console.log(`Adding movie ID ${movieId} to history with additional data:`, additionalData);
      const token = getAuthToken();
      if (!token) {
        console.warn("No auth token available for history request");
        throw new Error("Bạn cần đăng nhập để lưu lịch sử xem phim");
      }

      const response = await axiosInstance.post(`/history/${movieId}`, additionalData);
      console.log("History add by ID response:", response.data);
      return response.data;
    } catch (error) {
      console.error('Error adding movie to history by ID:', error.response?.data || error.message);
      throw error;
    }
  },

  // Lấy lịch sử xem phim của người dùng
  getUserHistory: async (limit = 10, page = 1, filter = 'all', sort = 'newest', searchQuery = '') => {
    try {
      // Kiểm tra trạng thái xác thực
      const token = getAuthToken();
      if (!token) {
        console.warn('No authentication token found');
        return { total: 0, page: 1, pages: 0, histories: [] };
      }

      console.log(`Fetching history with params: limit=${limit}, page=${page}, filter=${filter}, sort=${sort}`);

      // Xây dựng tham số truy vấn
      let url = `/history?limit=${limit}&page=${page}`;
      
      // Thêm bộ lọc cho loại phim nếu không phải 'all'
      if (filter !== 'all') {
        url += `&filter=${filter}`;
      }
      
      // Thêm sắp xếp
      url += `&sort=${sort}`;
      
      // Thêm truy vấn tìm kiếm nếu có
      if (searchQuery) {
        url += `&search=${encodeURIComponent(searchQuery)}`;
      }
      
      console.log("Requesting URL:", url);
      const response = await axiosInstance.get(url);
      console.log("History response data:", response.data);
      
      // Xử lý các định dạng phản hồi khác nhau
      if (response.data && response.data.data) {
        // Định dạng responseHelper
        const historyData = response.data.data;
        console.log("History items received:", historyData.histories?.length || 0);
        return {
          total: historyData.total || 0,
          page: historyData.page || page,
          pages: historyData.pages || 1,
          histories: historyData.histories || []
        };
      } else if (response.data && response.data.histories) {
        // Hỗ trợ định dạng gốc
        const historyData = response.data;
        console.log("History items received:", historyData.histories?.length || 0);
        return {
          total: historyData.total || 0,
          page: historyData.page || page,
          pages: historyData.pages || 1,
          histories: historyData.histories || []
        };
      } else if (response.data && response.data.success && response.data.message === "Lấy lịch sử xem phim thành công") {
        // Hỗ trợ định dạng phản hồi khác, nơi histories có thể nằm trực tiếp trong phản hồi
        console.log("Direct history format detected");
        const histories = response.data.histories || [];
        console.log("Direct history items received:", histories.length);
        return {
          total: response.data.total || histories.length,
          page: response.data.page || page,
          pages: response.data.pages || 1,
          histories: histories
        };
      }
      
      console.warn("Unexpected response format:", response.data);
      // Trả về cấu trúc rỗng nếu không đúng định dạng
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

  // Lấy lịch sử cho một người dùng cụ thể (chức năng admin)
  getUserHistoryById: async (userId, limit = 10, page = 1, filter = 'all', sort = 'newest') => {
    try {
      // Kiểm tra trạng thái xác thực
      const token = getAuthToken();
      if (!token) {
        console.warn('No authentication token found');
        return { total: 0, page: 1, pages: 0, histories: [] };
      }
      
      const url = `/history/users/${userId}?limit=${limit}&page=${page}&filter=${filter}&sort=${sort}`;
      console.log("Requesting URL:", url);
      const response = await axiosInstance.get(url);
      console.log("User history response:", response.data);
      
      // Xử lý các định dạng phản hồi khác nhau
      if (response.data && response.data.data) {
        // Định dạng responseHelper
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

  // Xóa một mục lịch sử
  deleteHistory: async (historyId) => {
    try {
      console.log(`Deleting history item: ${historyId}`);
      const token = getAuthToken();
      if (!token) {
        throw new Error("Bạn cần đăng nhập để xóa lịch sử");
      }

      const response = await axiosInstance.delete(`/history/${historyId}`);
      console.log("Delete history response:", response.data);
      return response.data;
    } catch (error) {
      console.error('Error deleting history:', error.response?.data || error.message);
      throw error;
    }
  },

  // Xóa toàn bộ lịch sử
  clearAllHistory: async () => {
    try {
      console.log("Clearing all history");
      const token = getAuthToken();
      if (!token) {
        throw new Error("Bạn cần đăng nhập để xóa lịch sử");
      }

      const response = await axiosInstance.delete('/history/clear');
      console.log("Clear history response:", response.data);
      return response.data;
    } catch (error) {
      console.error('Error clearing history:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Bắt đầu phiên xem phim mới
   * @param {Object} data - Dữ liệu phiên xem
   * @param {string} data.movieId - ID của phim
   * @param {string} data.movieSlug - Slug của phim (tùy chọn)
   * @param {number} data.currentTime - Vị trí hiện tại (giây) của video
   * @param {number} data.episode - Tập phim (cho phim bộ)
   */
  startWatchSession: async (data) => {
    try {
      console.log("Starting watch session:", data);
      const token = getAuthToken();
      if (!token) {
        console.warn("No auth token available");
        throw new Error("Bạn cần đăng nhập để theo dõi thời gian xem phim");
      }

      const response = await axiosInstance.post('/history/watch-session/start', data);
      console.log("Watch session start response:", response.data);
      return response.data;
    } catch (error) {
      console.error('Error starting watch session:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Kết thúc phiên xem phim
   * @param {Object} data - Dữ liệu phiên xem
   * @param {string} data.movieId - ID của phim
   * @param {number} data.currentTime - Vị trí hiện tại (giây) của video
   * @param {number} data.duration - Tổng thời lượng (giây) của video
   * @param {boolean} data.completed - Đánh dấu đã xem xong video
   * @param {number} data.episode - Tập phim (cho phim bộ)
   */
  endWatchSession: async (data) => {
    try {
      console.log("Ending watch session:", data);
      const token = getAuthToken();
      if (!token) {
        console.warn("No auth token available");
        throw new Error("Bạn cần đăng nhập để lưu thời gian xem phim");
      }

      const response = await axiosInstance.post('/history/watch-session/end', data);
      console.log("Watch session end response:", response.data);
      return response.data;
    } catch (error) {
      console.error('Error ending watch session:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Cập nhật vị trí xem hiện tại
   * @param {Object} data - Dữ liệu vị trí
   * @param {string} data.movieId - ID của phim
   * @param {number} data.currentTime - Vị trí hiện tại (giây) của video
   * @param {number} data.episode - Tập phim (cho phim bộ)
   */
  updateWatchPosition: async (data) => {
    try {
      console.log("Updating watch position:", data);
      const token = getAuthToken();
      if (!token) {
        console.warn("No auth token available");
        throw new Error("Bạn cần đăng nhập để lưu vị trí xem phim");
      }

      const response = await axiosInstance.put('/history/watch-session/update', data);
      console.log("Watch position update response:", response.data);
      return response.data;
    } catch (error) {
      console.error('Error updating watch position:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Lấy tổng thời gian xem phim của người dùng
   */
  getTotalWatchTime: async () => {
    try {
      console.log("Getting total watch time");
      const token = getAuthToken();
      if (!token) {
        console.warn("No auth token available");
        throw new Error("Bạn cần đăng nhập để xem thống kê");
      }

      const response = await axiosInstance.get('/history/total-watch-time');
      console.log("Total watch time response:", response.data);
      return response.data.data;
    } catch (error) {
      console.error('Error getting total watch time:', error.response?.data || error.message);
      // Trả về giá trị mặc định khi có lỗi
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