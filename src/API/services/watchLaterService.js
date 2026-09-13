// filepath: d:\Web\MovieStreaming\frontend\src\API\services\watchLaterService.js
import axiosInstance from '../config/axiosConfig';

const watchLaterService = {
  // Get all watch later items for the current user
  getWatchLaterList: async () => {
    try {
      console.log('[SERVICE] Bắt đầu gọi API lấy danh sách xem sau');
      
      // Kiểm tra token trước khi gọi API
      const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
      if (!token) {
        console.error('[SERVICE] Token không tồn tại! Không thể gọi API danh sách xem sau');
        return [];
      }
      
      console.log('[SERVICE] Token: ', token ? `${token.substring(0, 15)}...` : 'Không có token');
      
      // Đảm bảo đường dẫn API đúng và không trùng lặp /api
      const response = await axiosInstance.get(`/watchlater`);
      console.log('[SERVICE] Phản hồi API danh sách xem sau:', response.data);
      
      if (response.status === 200) {
        // Kiểm tra cấu trúc phản hồi
        if (response.data.statusCode === 200) {
          console.log('[SERVICE] Số lượng phim xem sau nhận được:', response.data.data?.length || 0);
          
          // Kiểm tra và log chi tiết từng phim để debug
          const watchLaterItems = response.data.data || [];
          watchLaterItems.forEach((movie, index) => {
            console.log(`[SERVICE] Phim ${index + 1}:`, movie);
          });
          
          // Đảm bảo các trường cần thiết đều tồn tại
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
          
          console.log('[SERVICE] Danh sách xem sau đã được xử lý:', mappedItems);
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
      
      // Thử sử dụng phương thức thay thế với fetch API
      try {
        console.log('[SERVICE] Thử sử dụng fetch API');
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
        
        // Lấy token từ localStorage
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
        console.log('[SERVICE] Raw response:', rawData);
        
        const data = JSON.parse(rawData);
        console.log('[SERVICE] Parsed data:', data);
        
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
          
          console.log('[SERVICE] Fetch API thành công, phim:', mappedItems.length);
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

      console.log('Thêm phim vào xem sau với payload:', payload);
      // Đảm bảo đường dẫn API đúng và không trùng lặp /api
      const response = await axiosInstance.post(`/watchlater`, payload);
      console.log('Phản hồi API thêm phim xem sau:', response.data);
      
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
      console.log('Xóa phim khỏi xem sau, ID:', movieId);
      // Đảm bảo đường dẫn API đúng và không trùng lặp /api
      const response = await axiosInstance.delete(`/watchlater/${movieId}`);
      console.log('Phản hồi API xóa phim xem sau:', response.data);
      
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
      console.log('Kiểm tra trạng thái xem sau cho phim:', movieSlug);
      // Đảm bảo đường dẫn API đúng và không trùng lặp /api
      const response = await axiosInstance.get(`/watchlater/check`, {
        params: { movieSlug }
      });
      console.log('Phản hồi API kiểm tra trạng thái xem sau:', response.data);
      
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
  
  // Phương thức thay thế khi không sử dụng được axiosInstance
  getWatchLaterListDirect: async () => {
    try {
      console.log('Gọi API trực tiếp lấy danh sách xem sau');
      
      // Lấy token từ localStorage
      const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
      if (!token) {
        console.error('Token không tồn tại! Không thể gọi API danh sách xem sau');
        return [];
      }
      
      // Lấy API URL từ biến môi trường hoặc sử dụng giá trị mặc định
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
      const watchLaterUrl = `${apiUrl}/watchlater`;
      
      console.log('Gọi API trực tiếp tới URL:', watchLaterUrl);
      
      // Sử dụng fetch API thay vì axios
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
      console.log('Phản hồi API trực tiếp:', data);
      
      if (data.success) {
        console.log('Số lượng phim xem sau nhận được từ API trực tiếp:', data.data?.length || 0);
        
        // Map dữ liệu đảm bảo tính nhất quán
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
        
        console.log('Danh sách xem sau trực tiếp đã xử lý:', mappedItems);
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