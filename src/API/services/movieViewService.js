import axiosClient from '../config/axiosConfig';

const movieViewService = {
  // Ghi lại một lượt xem khi người dùng xem phim
  recordMovieView: async (movieId) => {
    try {
      const response = await axiosClient.post('/movie-views/record', { movieId });
      return response.data;
    } catch (error) {
      console.error('Error recording movie view:', error);
      throw error;
    }
  },

  // Lấy danh sách phim được xem nhiều nhất (tùy chọn chỉ định khung thời gian theo ngày)
  getMostViewedMovies: async (days = 1, limit = 10) => {
    try {
      const response = await axiosClient.get(`/movie-views/most-viewed?days=${days}&limit=${limit}`);
      return response.data;
    } catch (error) {
      console.error('Error getting most viewed movies:', error);
      throw error;
    }
  },

  // Lấy số liệu thống kê lượt xem cho một bộ phim cụ thể
  getMovieViewStats: async (movieId) => {
    try {
      const response = await axiosClient.get(`/movie-views/stats/${movieId}`);
      return response.data;
    } catch (error) {
      console.error('Error getting movie view stats:', error);
      throw error;
    }
  }
};

export default movieViewService;