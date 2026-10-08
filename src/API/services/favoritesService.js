import axiosInstance from '../config/axiosConfig';

const favoritesService = {
  getFavorites: async () => {
    try {

      const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
      if (!token) {
        console.error('[SERVICE] Token không tồn tại! Không thể gọi API danh sách yêu thích');
        return [];
      }

      const response = await axiosInstance.get(`/favorites`);

      if (response.status === 200) {
        if (response.data.statusCode === 200) {

          const favorites = response.data.data || [];
          favorites.forEach((movie, index) => {
          });

          const mappedFavorites = favorites.map(movie => ({
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

          return mappedFavorites;
        } else {
          console.warn('[SERVICE] API trả về lỗi:', response.data.message);
          return [];
        }
      }
      console.warn('[SERVICE] API trả về status khác 200:', response.status);
      return [];
    } catch (error) {
      console.error('[SERVICE] Lỗi khi lấy danh sách yêu thích:', error);
      console.error('[SERVICE] Chi tiết lỗi:', error.response?.data || error.message);

      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

        const token = localStorage.getItem('auth_token') || localStorage.getItem('token');

        const response = await fetch(`${apiUrl}/favorites`, {
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
          const favorites = data.data || [];

          const mappedFavorites = favorites.map(movie => ({
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

          return mappedFavorites;
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

  addToFavorites: async (movieData) => {
    try {
      const payload = {};
      if (movieData.id) {
        payload.movieId = movieData.id;
      } else if (movieData.slug) {
        payload.movieSlug = movieData.slug;
      } else {
        throw new Error('Movie ID or slug is required');
      }

      const response = await axiosInstance.post(`/favorites`, payload);

      return {
        success: response.status === 200,
        message: response.data.message || 'Đã thêm vào danh sách yêu thích',
        alreadyExists: response.data.data?.exists || response.data.data?.alreadyExists || false
      };
    } catch (error) {
      console.error('Lỗi khi thêm phim vào yêu thích:', error);
      console.error('Chi tiết lỗi:', error.response?.data || error.message);
      return {
        success: false,
        message: error.response?.data?.message || 'Không thể thêm vào danh sách yêu thích',
        alreadyExists: false
      };
    }
  },

  removeFromFavorites: async (movieId) => {
    try {
      const response = await axiosInstance.delete(`/favorites/${movieId}`);

      return {
        success: response.status === 200 && response.data.success,
        message: response.data.message || 'Đã xóa khỏi danh sách yêu thích'
      };
    } catch (error) {
      console.error('Lỗi khi xóa phim khỏi yêu thích:', error);
      console.error('Chi tiết lỗi:', error.response?.data || error.message);
      return {
        success: false,
        message: error.response?.data?.message || 'Không thể xóa khỏi danh sách yêu thích'
      };
    }
  },

  checkFavoriteStatus: async (movieSlug) => {
    try {
      const response = await axiosInstance.get(`/favorites/check`, {
        params: { movieSlug }
      });

      if (response.status === 200 && response.data.success) {
        return response.data.data.isFavorite;
      }
      return false;
    } catch (error) {
      console.error('Lỗi khi kiểm tra trạng thái yêu thích:', error);
      console.error('Chi tiết lỗi:', error.response?.data || error.message);
      return false;
    }
  },

  getFavoritesDirect: async () => {
    try {

      const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
      if (!token) {
        console.error('Token không tồn tại! Không thể gọi API danh sách yêu thích');
        return [];
      }

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
      const favoritesUrl = `${apiUrl}/favorites`;

      const response = await fetch(favoritesUrl, {
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

        const mappedFavorites = (data.data || []).map(movie => ({
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

        return mappedFavorites;
      }

      console.warn('API trả về lỗi hoặc không thành công');
      return [];
    } catch (error) {
      console.error('Lỗi khi lấy danh sách yêu thích trực tiếp:', error);
      return [];
    }
  }
};

export default favoritesService;