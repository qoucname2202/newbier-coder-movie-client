import axiosInstance from '../config/axiosConfig';

// Lưu ý API_URL đã được cấu hình trong axiosInstance, không cần import

const favoritesService = {
  // Lấy tất cả các mục yêu thích cho người dùng hiện tại
  getFavorites: async () => {
    try {
      console.log('[SERVICE] Bắt đầu gọi API lấy danh sách yêu thích');
      
      // Kiểm tra token trước khi gọi API
      const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
      if (!token) {
        console.error('[SERVICE] Token không tồn tại! Không thể gọi API danh sách yêu thích');
        return [];
      }
      
      console.log('[SERVICE] Token: ', token ? `${token.substring(0, 15)}...` : 'Không có token');
      
      // Đảm bảo đường dẫn API đúng và không trùng lặp /api
      const response = await axiosInstance.get(`/favorites`);
      console.log('[SERVICE] Phản hồi API danh sách yêu thích:', response.data);
      
      if (response.status === 200) {
        // Kiểm tra cấu trúc phản hồi, đảm bảo phù hợp với responseHelper.js từ backend
        if (response.data.statusCode === 200) {
          console.log('[SERVICE] Số lượng phim yêu thích nhận được:', response.data.data?.length || 0);
          
          // Kiểm tra và log chi tiết từng phim để debug
          const favorites = response.data.data || [];
          favorites.forEach((movie, index) => {
            console.log(`[SERVICE] Phim ${index + 1}:`, movie);
          });
          
          // Đảm bảo các trường cần thiết đều tồn tại
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
          
          console.log('[SERVICE] Danh sách yêu thích đã được xử lý:', mappedFavorites);
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
      
      // Thử sử dụng phương thức thay thế với fetch API
      try {
        console.log('[SERVICE] Thử sử dụng fetch API');
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
        
        // Lấy token từ localStorage
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
        console.log('[SERVICE] Raw response:', rawData);
        
        const data = JSON.parse(rawData);
        console.log('[SERVICE] Parsed data:', data);
        
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
          
          console.log('[SERVICE] Fetch API thành công, phim:', mappedFavorites.length);
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

  // Thêm một bộ phim vào danh sách yêu thích
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

      console.log('Thêm phim vào yêu thích với payload:', payload);
      // Đảm bảo đường dẫn API đúng và không trùng lặp /api
      const response = await axiosInstance.post(`/favorites`, payload);
      console.log('Phản hồi API thêm phim yêu thích:', response.data);
      
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

  // Xóa một bộ phim khỏi danh sách yêu thích
  removeFromFavorites: async (movieId) => {
    try {
      console.log('Xóa phim khỏi yêu thích, ID:', movieId);
      // Đảm bảo đường dẫn API đúng và không trùng lặp /api
      const response = await axiosInstance.delete(`/favorites/${movieId}`);
      console.log('Phản hồi API xóa phim yêu thích:', response.data);
      
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

  // Kiểm tra xem một bộ phim có trong danh sách yêu thích không
  checkFavoriteStatus: async (movieSlug) => {
    try {
      console.log('Kiểm tra trạng thái yêu thích cho phim:', movieSlug);
      // Đảm bảo đường dẫn API đúng và không trùng lặp /api
      const response = await axiosInstance.get(`/favorites/check`, {
        params: { movieSlug }
      });
      console.log('Phản hồi API kiểm tra trạng thái yêu thích:', response.data);
      
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
  
  // Phương thức thay thế để gọi API trực tiếp không qua instance
  getFavoritesDirect: async () => {
    try {
      console.log('Gọi API trực tiếp lấy danh sách yêu thích');
      
      // Lấy token từ localStorage
      const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
      if (!token) {
        console.error('Token không tồn tại! Không thể gọi API danh sách yêu thích');
        return [];
      }
      
      // Lấy API URL từ biến môi trường hoặc sử dụng giá trị mặc định
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
      const favoritesUrl = `${apiUrl}/favorites`;
      
      console.log('Gọi API trực tiếp tới URL:', favoritesUrl);
      
      // Sử dụng fetch API thay vì axios
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
      console.log('Phản hồi API trực tiếp:', data);
      
      if (data.success) {
        console.log('Số lượng phim yêu thích nhận được từ API trực tiếp:', data.data?.length || 0);
        
        // Map dữ liệu đảm bảo tính nhất quán
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
        
        console.log('Danh sách yêu thích trực tiếp đã xử lý:', mappedFavorites);
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