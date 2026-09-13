// Các hàm API của Upcoming Movie Service

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"; // Cập nhật URL này với URL API thực tế của bạn

const upcomingMovieService = {
  // Lấy danh sách phim sắp chiếu với các bộ lọc tùy chọn
  getUpcomingMovies: async (page = 1, limit = 10) => {
    try {
      const response = await fetch(
        `${API_URL}/upcoming-movies?page=${page}&limit=${limit}`
      );
      
      if (!response.ok) {
        throw new Error('Không thể lấy danh sách phim sắp chiếu');
      }
      const data = await response.json();
      
      if (data.success && data.upcomingMovies) {        // Xử lý phim để thêm thông tin bổ sung
        const processedMovies = data.upcomingMovies.map(movie => {
          // Định dạng ngày phát hành
          const releaseDate = new Date(movie.release_date);
          const formattedDate = releaseDate.toLocaleDateString('vi-VN');
          
          // Đảm bảo URL là tuyệt đối
          const thumb_url = movie.thumb_url?.startsWith('http') 
            ? movie.thumb_url 
            : `${movie.thumb_url}`;
            
          const poster_url = movie.poster_url?.startsWith('http')
            ? movie.poster_url
            : `${movie.poster_url}`;
          
          return {
            ...movie,
            thumb_url,
            poster_url,
            formattedReleaseDate: formattedDate,
            daysUntilRelease: Math.ceil((releaseDate - new Date()) / (1000 * 60 * 60 * 24)),
            countdownText: getCountdownText(releaseDate)
          };
        });
        
        // Sắp xếp theo ngày phát hành (gần nhất trước)
        const sortedMovies = processedMovies.sort((a, b) => {
          const dateA = new Date(a.release_date);
          const dateB = new Date(b.release_date);
          return dateA - dateB; // Sắp xếp theo ngày phát hành gần nhất
        });
        
        return {
          success: true,
          upcomingMovies: sortedMovies,
          pagination: {
            currentPage: data.currentPage,
            totalPages: data.totalPages,
            totalCount: data.totalCount
          }
        };
      }
      
      return { success: false, upcomingMovies: [] };
    } catch (error) {
      console.error('Lỗi khi lấy danh sách phim sắp chiếu:', error);
      return { success: false, upcomingMovies: [], error: error.message };
    }
  },
  
  // Lấy chi tiết phim sắp chiếu theo ID
  getUpcomingMovieById: async (movieId) => {
    try {
      const response = await fetch(`${API_URL}/admin/upcoming-movies/${movieId}`);
      if (!response.ok) {
        throw new Error('Không thể lấy chi tiết phim sắp chiếu');
      }
      const data = await response.json();
      
      if (data.success && data.upcomingMovie) {
        const movie = data.upcomingMovie;
        const releaseDate = new Date(movie.release_date);
        
        return {
          success: true,
          upcomingMovie: {
            ...movie,
            formattedReleaseDate: releaseDate.toLocaleDateString('vi-VN'),
            daysUntilRelease: Math.ceil((releaseDate - new Date()) / (1000 * 60 * 60 * 24)),
            countdownText: getCountdownText(releaseDate)
          }
        };
      }
      
      return { success: false, upcomingMovie: null };
    } catch (error) {
      console.error('Lỗi khi lấy chi tiết phim sắp chiếu:', error);
      return { success: false, upcomingMovie: null, error: error.message };
    }
  },

  // Lấy phim sắp chiếu theo slug
  getUpcomingMovieBySlug: async (slug) => {
    try {
      const response = await fetch(`${API_URL}/upcoming-movies/${slug}`);
      
      if (!response.ok) {
        throw new Error('Không thể lấy phim sắp chiếu');
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Lỗi trong hàm getUpcomingMovieBySlug:', error);
      return { success: false, error: error.message };
    }
  },

  // Lấy phim sắp chiếu theo thể loại
  getUpcomingMoviesByCategory: async (categorySlug, page = 1, limit = 10) => {
    try {
      const response = await fetch(
        `${API_URL}/upcoming-movies/category/${categorySlug}?page=${page}&limit=${limit}`
      );
      
      if (!response.ok) {
        throw new Error('Không thể lấy phim sắp chiếu theo thể loại');
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Lỗi trong hàm getUpcomingMoviesByCategory:', error);
      return { success: false, error: error.message };
    }
  }
};

// Hàm trợ giúp để tạo văn bản đếm ngược
function getCountdownText(releaseDate) {
  const now = new Date();
  const timeDiff = releaseDate.getTime() - now.getTime();
  const daysDiff = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
  
  if (daysDiff <= 0) {
    return "Đã ra mắt";
  } else if (daysDiff === 1) {
    return "Ra mắt ngày mai";
  } else if (daysDiff <= 7) {
    return `Ra mắt sau ${daysDiff} ngày`;
  } else if (daysDiff <= 30) {
    const weeks = Math.ceil(daysDiff / 7);
    return `Ra mắt sau ${weeks} tuần`;
  } else {
    const months = Math.ceil(daysDiff / 30);
    return `Ra mắt sau ${months} tháng`;
  }
}

export default upcomingMovieService;
