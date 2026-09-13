import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// Helper để lấy token từ localStorage
const getAuthHeader = () => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) {
      return { Authorization: `Bearer ${token}` };
    }
  }
  return {};
};

const statsService = {
  /**
   * Lấy thống kê xem phim của người dùng
   */
  getUserWatchStats: async () => {
    try {
      const response = await axios.get(`${API_URL}/user-stats/watch-stats`, {
        headers: getAuthHeader()
      });
      return response.data.data;
    } catch (error) {
      console.error('Error fetching watch stats:', error);
      return null;
    }
  },
  
  /**
   * Lấy hoạt động xem phim trong tuần
   */
  getUserWeeklyActivity: async () => {
    try {
      const response = await axios.get(`${API_URL}/user-stats/weekly-activity`, {
        headers: getAuthHeader()
      });
      return response.data.data;
    } catch (error) {
      console.error('Error fetching weekly activity:', error);
      // Trả về null thay vì mảng mặc định để frontend có thể xử lý phù hợp
      return null;
    }
  },
  
  /**
   * Lấy phân bố thể loại phim đã xem
   */
  getUserGenreDistribution: async () => {
    try {
      const response = await axios.get(`${API_URL}/user-stats/genre-distribution`, {
        headers: getAuthHeader()
      });
      return response.data.data;
    } catch (error) {
      console.error('Error fetching genre distribution:', error);
      return null;
    }
  },
  
  /**
   * Lấy thời gian xem phim theo ngày
   */
  getUserDailyViewingTime: async () => {
    try {
      const response = await axios.get(`${API_URL}/user-stats/daily-viewing-time`, {
        headers: getAuthHeader()
      });
      return response.data.data;
    } catch (error) {
      console.error('Error fetching daily viewing time:', error);
      return null;
    }
  },
  
  /**
   * Lấy tiến độ xem series cụ thể
   */
  getUserSeriesProgress: async (seriesId) => {
    try {
      const response = await axios.get(`${API_URL}/user-stats/series-progress/${seriesId}`, {
        headers: getAuthHeader()
      });
      return response.data.data;
    } catch (error) {
      console.error('Error fetching series progress:', error);
      return null;
    }
  },
  
  /**
   * Lấy danh sách series đang xem
   */
  getUserInProgressSeries: async () => {
    try {
      const response = await axios.get(`${API_URL}/user-stats/in-progress-series`, {
        headers: getAuthHeader()
      });
      return response.data.data;
    } catch (error) {
      console.error('Error fetching in-progress series:', error);
      return null;
    }
  },
  
  /**
   * Lấy thành tựu xem phim
   */
  getUserAchievements: async () => {
    try {
      const response = await axios.get(`${API_URL}/user-stats/achievements`, {
        headers: getAuthHeader()
      });
      return response.data.data;
    } catch (error) {
      console.error('Error fetching achievements:', error);
      return null;
    }
  },
  
  /**
   * Lấy phim đã đánh giá của người dùng
   */
  getUserRatedMovies: async () => {
    try {
      const headers = getAuthHeader();
      if (!Object.keys(headers).length) {
        throw new Error('Bạn chưa đăng nhập');
      }
      
      const response = await axios.get(`${API_URL}/ratings/user`, {
        headers: headers
      });
      
      // Kiểm tra và xử lý dữ liệu phản hồi
      if (response.data.success) {
        return response.data.data || null;
      } else {
        console.warn('API responded with error:', response.data.message);
        return null;
      }
    } catch (error) {
      console.error('Error fetching user rated movies:', error);
      return null;
    }
  }
};

export default statsService;