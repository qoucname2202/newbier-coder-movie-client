// filepath: d:\Web\MovieStreaming\frontend\src\API\services\watchLaterService.js
import axiosInstance from '../config/axiosConfig';

const watchLaterService = {
  // Get all watch later items for the current user
  getWatchLaterList: async () => {
    try {

      const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
      if (!token) {
        console.error('[SERVICE] Token không tồn tại! Không thể gọi API danh sách xem sau');
        return [];
      }

      const response = await axiosInstance.get(`/watchlater`);

      if (response.status === 200) {
        if (response.data.statusCode === 200) {

          const watchLaterItems = response.data.data || [];
          watchLaterItems.forEach((movie, index) => {
          });

          const mappedItems = watchLaterItems.map(movie => ({
            id: movie.id || movie._id || '',
            title: movie.title || movie.name || 'Không có tiêu đề',
            original_title: movie.original_title || movie.origin_name || '',
            slug: movie.slug || '',
            thumbnail: movie.thumbnail || movie.thumb_url || movie.poster_url || '',
            year: movie.year || new Date().getFullYear(),
            quality: movie.quality || 'HD',
            rating: movie.rating || 0,
            type: movie.type || 'movie'
          }));

          return mappedItems;
        } else {
          console.warn('[SERVICE] API trả về lỗi:', response.data.message);
          return [];
        }
      }
      console.warn('[SERVICE] API trả về status khác 200:', response.status);
      return [];
    } catch (error) {
      console.error('[SERVICE] Lỗi khi lấy danh sách xem sau:', error);
      console.error('[SERVICE] Chi tiết lỗi:', error.response?.data || error.message);

      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

        const token = localStorage.getItem('auth_token') || localStorage.getItem('token');

        const response = await fetch(`${apiUrl}/watchlater`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          credentials: 'include'
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const rawData = await response.text();

        const data = JSON.parse(rawData);

        if (data.statusCode === 200) {
          const watchLaterItems = data.data || [];

          const mappedItems = watchLaterItems.map(movie => ({
            id: movie.id || movie._id || '',
            title: movie.title || movie.name || 'Không có tiêu đề',
            original_title: movie.original_title || movie.origin_name || '',
            slug: movie.slug || '',
            thumbnail: movie.thumbnail || movie.thumb_url || movie.poster_url || '',
            year: movie.year || new Date().getFullYear(),
            quality: movie.quality || 'HD',
            rating: movie.rating || 0,
            type: movie.type || 'movie'
          }));

          return mappedItems;
        } else {
          console.warn('[SERVICE] Fetch API trả về lỗi:', data.message);
          return [];
        }
      } catch (fetchError) {
        console.error('[SERVICE] Cả hai phương thức đều thất bại:', fetchError);
        return [];
      }
    }
  },

  // Add a movie to watch later
  addToWatchLater: async (movieData) => {
    try {
      const payload = {};
      if (movieData.id) {
        payload.movieId = movieData.id;
      } else if (movieData.slug) {
        payload.movieSlug = movieData.slug;
      } else {
        throw new Error('Movie ID or slug is required');
      }

      const response = await axiosInstance.post(`/watchlater`, payload);

      return {
        success: response.status === 200,
        message: response.data.message || 'Đã thêm vào danh sách xem sau',
        alreadyExists: response.data.data?.exists || response.data.data?.alreadyExists || false
      };
    } catch (error) {
      console.error('Lỗi khi thêm phim vào xem sau:', error);
      console.error('Chi tiết lỗi:', error.response?.data || error.message);
      return {
        success: false,
        message: error.response?.data?.message || 'Không thể thêm vào danh sách xem sau',
        alreadyExists: false
      };
    }
  },

  // Remove a movie from watch later
  removeFromWatchLater: async (movieId) => {
    try {
      const response = await axiosInstance.delete(`/watchlater/${movieId}`);

      return {
        success: response.status === 200 && response.data.success,
        message: response.data.message || 'Đã xóa khỏi danh sách xem sau'
      };
    } catch (error) {
      console.error('Lỗi khi xóa phim khỏi xem sau:', error);
      console.error('Chi tiết lỗi:', error.response?.data || error.message);
      return {
        success: false,
        message: error.response?.data?.message || 'Không thể xóa khỏi danh sách xem sau'
      };
    }
  },

  // Check if a movie is in watch later list
  checkWatchLaterStatus: async (movieSlug) => {
    try {
      const response = await axiosInstance.get(`/watchlater/check`, {
        params: { movieSlug }
      });

      if (response.status === 200 && response.data.success) {
        return response.data.data.isInWatchLater;
      }
      return false;
    } catch (error) {
      console.error('Lỗi khi kiểm tra trạng thái xem sau:', error);
      console.error('Chi tiết lỗi:', error.response?.data || error.message);
      return false;
    }
  },

  getWatchLaterListDirect: async () => {
    try {

      const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
      if (!token) {
        console.error('Token không tồn tại! Không thể gọi API danh sách xem sau');
        return [];
      }

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
      const watchLaterUrl = `${apiUrl}/watchlater`;

      const response = await fetch(watchLaterUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {

        const mappedItems = (data.data || []).map(movie => ({
          id: movie.id || movie._id || '',
          title: movie.title || movie.name || 'Không có tiêu đề',
          original_title: movie.original_title || movie.origin_name || '',
          slug: movie.slug || '',
          thumbnail: movie.thumbnail || movie.thumb_url || movie.poster_url || '',
          year: movie.year || new Date().getFullYear(),
          quality: movie.quality || 'HD',
          rating: movie.rating || 0,
          type: movie.type || 'movie'
        }));

        return mappedItems;
      }

      console.warn('API trả về lỗi hoặc không thành công');
      return [];
    } catch (error) {
      console.error('Lỗi khi lấy danh sách xem sau trực tiếp:', error);
      return [];
    }
  }
};

export default watchLaterService;