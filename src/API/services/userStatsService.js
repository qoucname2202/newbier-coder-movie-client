// Dịch vụ cung cấp các API liên quan đến thống kê cá nhân người dùng

import axiosInstance from '../config/axiosConfig';

/**
 * Lấy thống kê tổng quan về hoạt động xem phim của người dùng
 * @returns {Promise<Object>} Thông tin thống kê tổng quan
 */
export const getUserWatchStats = async () => {
  try {
    // Đảm bảo URL chính xác với tiền tố /api/
    const response = await axiosInstance.get('/api/user-stats/watch-stats');
    
    if (response.data && response.data.data) {
      return response.data.data;
    }
    
    return {
      totalWatchedMovies: 0,
      totalWatchedSeries: 0,
      totalWatchTime: {
        hours: 0,
        minutes: 0,
        displayText: "0 giờ 0 phút"
      },
      favoriteGenres: [],
      recentHistory: []
    };
  } catch (error) {
    console.error('Error fetching user watch stats:', error);
    // Trả về dữ liệu mặc định để tránh lỗi
    return {
      totalWatchedMovies: 0,
      totalWatchedSeries: 0,
      totalWatchTime: {
        hours: 0,
        minutes: 0,
        displayText: "0 giờ 0 phút"
      },
      favoriteGenres: [],
      recentHistory: []
    };
  }
};

/**
 * Lấy dữ liệu hoạt động trong tuần
 * @returns {Promise<Object>} Dữ liệu hoạt động theo từng ngày trong tuần
 */
export const getUserActivityByWeek = async () => {
  try {
    // Đảm bảo URL chính xác với tiền tố /api/
    const response = await axiosInstance.get('/api/user-stats/activity-week');
    
    if (response.data && response.data.data) {
      return response.data.data;
    }
    
    // Trả về dữ liệu mặc định nếu không có dữ liệu
    return {
      'CN': 0,
      'T2': 0,
      'T3': 0,
      'T4': 0,
      'T5': 0,
      'T6': 0,
      'T7': 0
    };
  } catch (error) {
    console.error('Error fetching user activity by week:', error);
    // Trả về dữ liệu mặc định để tránh lỗi
    return {
      'CN': 0,
      'T2': 0,
      'T3': 0,
      'T4': 0,
      'T5': 0,
      'T6': 0,
      'T7': 0
    };
  }
};

/**
 * Lấy phân bố thể loại phim yêu thích của người dùng
 * @returns {Promise<Array>} Danh sách thể loại và tỷ lệ phần trăm
 */
export const getUserGenreDistribution = async () => {
  try {
    // Đảm bảo URL chính xác với tiền tố /api/
    const response = await axiosInstance.get('/api/user-stats/genre-distribution');
    
    if (response.data && response.data.data) {
      return response.data.data;
    }
    
    return []; // Trả về mảng rỗng nếu không có dữ liệu
  } catch (error) {
    console.error('Error fetching user genre distribution:', error);
    return []; // Trả về mảng rỗng nếu có lỗi
  }
};