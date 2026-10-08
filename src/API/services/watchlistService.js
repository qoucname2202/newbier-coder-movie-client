import authService from './authService';

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

const watchlistService = {
  getWatchlist: async () => {
    try {
      const headers = await authService.getAuthHeader();

      const response = await fetch(`${API_URL}/watchlist`, {
        headers: {
          ...headers,
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Error in watchlist response:", errorData);
        throw new Error(errorData.message || 'Không thể lấy danh sách xem sau');
      }

      const responseData = await response.json();

      if (responseData.data && responseData.data.movies) {
        return responseData.data.movies;
      }
      else if (responseData.movies) {
        return responseData.movies;
      }
      else {
        return [];
      }
    } catch (error) {
      console.error('Error fetching watchlist:', error);
      return [];
    }
  },

  addToWatchlist: async (movieData) => {
    try {
      const headers = await authService.getAuthHeader();

      const response = await fetch(`${API_URL}/watchlist/add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          ...headers
        },
        body: JSON.stringify(movieData)
      });

      const responseData = await response.json();

      if (!response.ok) {
        console.error("Error adding to watchlist:", responseData);
        return {
          success: false,
          message: responseData.message || 'Không thể thêm vào danh sách xem sau'
        };
      }

      const data = responseData.data || responseData;

      return {
        success: true,
        message: responseData.message || 'Đã thêm vào danh sách xem sau',
        alreadyExists: data.alreadyExists || false
      };
    } catch (error) {
      console.error('Error adding to watchlist:', error);
      return {
        success: false,
        message: error.message || 'Có lỗi xảy ra. Vui lòng thử lại sau'
      };
    }
  },

  isInWatchlist: async (movieId) => {
    try {
      const headers = await authService.getAuthHeader();

      const response = await fetch(`${API_URL}/watchlist/check/${movieId}`, {
        headers: {
          ...headers,
          'Accept': 'application/json'
        }
      });

      const responseData = await response.json();

      if (!response.ok) {
        console.error("Error checking watchlist:", responseData);
        return false;
      }

      const data = responseData.data || responseData;
      return data.isInWatchlist || false;
    } catch (error) {
      console.error('Error checking watchlist:', error);
      return false;
    }
  },

  removeFromWatchlist: async (movieId) => {
    try {
      const headers = await authService.getAuthHeader();

      const response = await fetch(`${API_URL}/watchlist/remove/${movieId}`, {
        method: 'DELETE',
        headers: {
          ...headers,
          'Accept': 'application/json'
        }
      });

      const responseData = await response.json();

      if (!response.ok) {
        console.error("Error removing from watchlist:", responseData);
        return {
          success: false,
          message: responseData.message || 'Không thể xóa khỏi danh sách xem sau'
        };
      }

      return {
        success: true,
        message: responseData.message || 'Đã xóa khỏi danh sách xem sau'
      };
    } catch (error) {
      console.error('Error removing from watchlist:', error);
      return {
        success: false,
        message: error.message || 'Có lỗi xảy ra. Vui lòng thử lại sau'
      };
    }
  },

  clearWatchlist: async () => {
    try {
      const headers = await authService.getAuthHeader();

      const response = await fetch(`${API_URL}/watchlist/clear`, {
        method: 'DELETE',
        headers: {
          ...headers,
          'Accept': 'application/json'
        }
      });

      const responseData = await response.json();

      if (!response.ok) {
        console.error("Error clearing watchlist:", responseData);
        return {
          success: false,
          message: responseData.message || 'Không thể xóa danh sách xem sau'
        };
      }

      return {
        success: true,
        message: responseData.message || 'Đã xóa tất cả phim trong danh sách xem sau'
      };
    } catch (error) {
      console.error('Error clearing watchlist:', error);
      return {
        success: false,
        message: error.message || 'Có lỗi xảy ra. Vui lòng thử lại sau'
      };
    }
  }
};

export default watchlistService;