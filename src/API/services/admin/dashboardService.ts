/**
 * Service cung cấp dữ liệu thống kê cho Dashboard Analytics
 */

import axiosInstance from '../../config/axiosConfig';

/**
 * Interface cho dữ liệu thống kê dashboard
 * @typedef {Object} DashboardStats
 * @property {number} totalMovies - Tổng số phim
 * @property {string} engagementRate - Tỷ lệ tương tác (định dạng phần trăm, ví dụ: "65%")
 * @property {number} newUsers - Số người dùng mới trong 7 ngày qua
 * @property {number} reports - Số báo cáo
 * @property {Object} feedback - Thông tin feedback
 * @property {number} feedback.total - Tổng số feedback
 * @property {number} feedback.unread - Số feedback chưa đọc
 * @property {Object} counts - Các số liệu đếm
 * @property {number} counts.users - Tổng số người dùng
 * @property {number} counts.movies - Tổng số phim
 * @property {number} counts.comments - Tổng số bình luận
 * @property {number} counts.views - Tổng số lượt xem
 */

/**
 * Interface cho dữ liệu phân tích toàn diện
 * @typedef {Object} AnalyticsData
 * @property {DashboardStats} stats - Thống kê tổng quan dashboard
 * @property {Object} viewsByDay - Dữ liệu lượt xem theo ngày
 * @property {string[]} viewsByDay.labels - Nhãn của các ngày
 * @property {number[]} viewsByDay.data - Số lượt xem theo từng ngày
 * @property {Object} genreDistribution - Phân bố theo thể loại phim
 * @property {string[]} genreDistribution.labels - Danh sách tên thể loại
 * @property {number[]} genreDistribution.data - Số lượng phim theo từng thể loại
 * @property {Object[]} recentMovies - Danh sách phim gần đây
 * @property {Object[]} topMovies - Danh sách phim xem nhiều nhất
 * @property {Object} feedback - Thông tin về feedback
 * @property {Object[]} feedback.recent - Danh sách feedback gần đây
 * @property {Object[]} feedback.byType - Thống kê feedback theo loại
 * @property {Object[]} feedback.byStatus - Thống kê feedback theo trạng thái
 */

/**
 * Lấy dữ liệu thống kê cho dashboard
 * @returns {Promise<DashboardStats>}
 */
export const getDashboardStats = async () => {
  try {
    const response = await axiosInstance.get('/admin/dashboard/stats');
    
    // Kiểm tra và xử lý cấu trúc dữ liệu
    if (response.data && response.data.data) {
      return response.data.data;
    }
    
    return response.data;
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    throw error;
  }
};

/**
 * Lấy dữ liệu thống kê phim theo khoảng thời gian
 * @param {string} period - Khoảng thời gian (day, week, month, year)
 * @returns {Promise<any>}
 */
export const getMovieStatsByPeriod = async (period = 'week') => {
  try {
    const response = await axiosInstance.get(`/admin/dashboard/views-by-day`);
    
    if (response.data && response.data.data) {
      return response.data.data;
    }
    
    return response.data;
  } catch (error) {
    console.error(`Error fetching movie stats for period ${period}:`, error);
    throw error;
  }
};

/**
 * Lấy dữ liệu thống kê người dùng theo khoảng thời gian
 * @param {string} period - Khoảng thời gian (day, week, month, year)
 * @returns {Promise<any>}
 */
export const getUserStatsByPeriod = async (period = 'week') => {
  try {
    const response = await axiosInstance.get(`/admin/dashboard/stats`);
    
    if (response.data && response.data.data) {
      return {
        labels: ["Hiện tại"], 
        data: [response.data.data.newUsers || 0]
      };
    }
    
    return response.data;
  } catch (error) {
    console.error(`Error fetching user stats for period ${period}:`, error);
    throw error;
  }
};

/**
 * Lấy thống kê phim theo thể loại
 * @returns {Promise<any>}
 */
export const getMovieStatsByGenre = async () => {
  try {
    const response = await axiosInstance.get('/admin/dashboard/genre-distribution');
    
    if (response.data && response.data.data) {
      return response.data.data;
    }
    
    return response.data;
  } catch (error) {
    console.error('Error fetching movie stats by genre:', error);
    throw error;
  }
};

/**
 * Lấy toàn bộ dữ liệu phân tích cho trang analytics
 * @returns {Promise<AnalyticsData>}
 */
export const getAnalyticsData = async () => {
  try {
    // Sửa đường dẫn, bỏ /api ở đầu vì axiosInstance đã có baseURL với /api
    const response = await axiosInstance.get('/admin/dashboard/analytics');
    
    if (response.data && response.data.data) {
      return response.data.data;
    }
    
    return response.data;
  } catch (error) {
    console.error('Error fetching analytics data:', error);
    throw error;
  }
};

/**
 * Lấy feedback gần đây nhất
 * @param {number} limit - Số lượng feedback muốn lấy (mặc định: 5)
 * @returns {Promise<any>}
 */
export const getRecentFeedbacks = async (limit = 5) => {
  try {
    const response = await axiosInstance.get(`/admin/dashboard/recent-feedbacks?limit=${limit}`);
    
    if (response.data && response.data.data) {
      return response.data.data.recentFeedbacks || [];
    }
    
    return [];
  } catch (error) {
    console.error('Error fetching recent feedbacks:', error);
    throw error;
  }
};

/**
 * Lấy thống kê feedback chi tiết
 * @returns {Promise<any>}
 */
export const getFeedbackStats = async () => {
  try {
    const response = await axiosInstance.get('/admin/dashboard/feedback-stats');
    
    if (response.data && response.data.data) {
      return response.data.data;
    }
    
    return {
      byType: [],
      byStatus: [],
      byDay: {
        labels: [],
        data: []
      }
    };
  } catch (error) {
    console.error('Error fetching feedback stats:', error);
    throw error;
  }
};