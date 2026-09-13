import authService from './authService';

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

const watchlistService = {
  // Lấy danh sách xem sau cho người dùng hiện tại
  getWatchlist: async () => {
    try {
      // Lấy header xác thực với làm mới token nếu cần
      const headers = await authService.getAuthHeader();
      
      console.log("Fetching watchlist from API...");
      
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
      console.log("Watchlist response data:", responseData);
      
      // Cải thiện xử lý dữ liệu cho cấu trúc backend
      // Kiểm tra phim trong responseData.data (từ responseHelper)
      if (responseData.data && responseData.data.movies) {
        console.log("Returning watchlist movies from data.movies:", responseData.data.movies);
        return responseData.data.movies;
      }
      // Sau đó kiểm tra phim trực tiếp trong responseData
      else if (responseData.movies) {
        console.log("Returning watchlist movies from root:", responseData.movies);
        return responseData.movies;
      }
      // Nếu cả hai đều không tồn tại, ghi log và trả về mảng rỗng
      else {
        console.log('Unexpected response format, could not find movies array:', responseData);
        return [];
      }
    } catch (error) {
      console.error('Error fetching watchlist:', error);
      return [];
    }
  },
  
  // Thêm phim vào danh sách xem sau
  addToWatchlist: async (movieData) => {
    try {
      // Lấy header xác thực với làm mới token nếu cần
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
      
      // Truy cập dữ liệu qua đường dẫn phù hợp có thể nằm trong responseData.data
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
  
  // Kiểm tra xem phim có trong danh sách xem sau không
  isInWatchlist: async (movieId) => {
    try {
      // Lấy header xác thực với làm mới token nếu cần
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
      
      // Truy cập dữ liệu qua đường dẫn phù hợp có thể nằm trong responseData.data
      const data = responseData.data || responseData;
      return data.isInWatchlist || false;
    } catch (error) {
      console.error('Error checking watchlist:', error);
      return false;
    }
  },
  
  // Xóa phim khỏi danh sách xem sau
  removeFromWatchlist: async (movieId) => {
    try {
      // Lấy header xác thực với làm mới token nếu cần
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
  
  // Xóa danh sách xem sau
  clearWatchlist: async () => {
    try {
      // Lấy header xác thực với làm mới token nếu cần
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