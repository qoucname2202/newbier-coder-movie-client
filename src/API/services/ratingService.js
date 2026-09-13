import { API_URL } from '../../config/API';

const ratingService = {
  // Lấy danh sách đánh giá của người dùng hiện tại
  getUserRatings: async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const userId = localStorage.getItem('userId');
      
      if (!token || !userId) {
        return { success: false, message: 'Không tìm thấy thông tin xác thực', data: [] };
      }

      const response = await fetch(`${API_URL}/ratings/user/${userId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch user ratings: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching user ratings:', error);
      return { success: false, message: error.message, data: [] };
    }
  },

  // Lấy đánh giá của người dùng cho một phim cụ thể
  getUserMovieRating: async (movieSlug) => {
    try {
      const token = localStorage.getItem('auth_token');
      const userId = localStorage.getItem('userId');
      
      if (!token || !userId) {
        return { success: false, message: 'Không tìm thấy thông tin xác thực' };
      }

      const response = await fetch(`${API_URL}/ratings/user/${userId}/movie/${movieSlug}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        if (response.status === 404) {
          return { success: true, data: { rating: 0 } };
        }
        throw new Error(`Failed to fetch user movie rating: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching user movie rating:', error);
      return { success: false, message: error.message, data: { rating: 0 } };
    }
  },

  // Tạo hoặc cập nhật đánh giá cho một phim
  createOrUpdateRating: async (movieSlug, rating) => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        return { success: false, message: 'Không tìm thấy token xác thực' };
      }

      const response = await fetch(`${API_URL}/ratings`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          movieSlug,
          rating
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to create/update rating: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error creating/updating rating:', error);
      return { success: false, message: error.message };
    }
  },

  // Xóa đánh giá cho một phim
  deleteRating: async (ratingId) => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        return { success: false, message: 'Không tìm thấy token xác thực' };
      }

      const response = await fetch(`${API_URL}/ratings/${ratingId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to delete rating: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error deleting rating:', error);
      return { success: false, message: error.message };
    }
  },

  // Lấy thống kê đánh giá cho một phim
  getMovieRatingStats: async (movieSlug) => {
    try {
      const response = await fetch(`${API_URL}/ratings/stats/${movieSlug}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch rating stats: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching rating stats:', error);
      return { success: false, message: error.message, data: { averageRating: 0, ratingCount: 0 } };
    }
  },

  // Lấy tất cả đánh giá cho một phim
  getMovieRatings: async (movieId) => {
    try {
      const response = await fetch(`${API_URL}/ratings/movie/${movieId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch movie ratings: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching movie ratings:', error);
      return { success: false, message: error.message, data: [] };
    }
  }
};

export default ratingService;