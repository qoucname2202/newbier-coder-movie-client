// Các hàm API của Movie Service

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

const movieService = {
  // Lấy danh sách phim mới nhất
  getLatestMovies: async () => {
    try {
      const response = await fetch(`${API_URL}/movies`);
      if (!response.ok) {
        throw new Error('Failed to fetch latest movies');
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching latest movies:', error);
      return { movies: [] };
    }
  },

  // Lấy danh sách phim được đánh giá cao nhất
  getTopRatedMovies: async () => {
    try {
      const response = await fetch(`${API_URL}/movies/top-rated`);
      if (!response.ok) {
        throw new Error('Failed to fetch top rated movies');
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching top rated movies:', error);
      return { movies: [] };
    }
  },

  // Lấy danh sách phim theo thể loại
  getMoviesByCategory: async (categoryId) => {
    try {
      const response = await fetch(`${API_URL}/movies/category/${categoryId}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch ${categoryId} movies`);
      }
      return await response.json();
    } catch (error) {
      console.error(`Error fetching ${categoryId} movies:`, error);
      return { movies: [] };
    }
  },

  // Lấy chi tiết phim theo slug
  getMovieDetails: async (slug) => {
    try {
      const response = await fetch(`${API_URL}/movies/${slug}`);
      if (!response.ok) {
        throw new Error('Failed to fetch movie details');
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching movie details:', error);
      throw error;
    }
  },

  // Tìm kiếm phim sử dụng Elasticsearch
  searchMovies: async (query, filters = {}, page = 1, size = 20) => {
    try {
      // Xây dựng query params
      const params = new URLSearchParams();
      if (query) params.append('q', query);
      params.append('page', page);
      params.append('size', size);
      
      // Thêm các filters nếu có
      if (filters.category) params.append('category', filters.category);
      if (filters.country) params.append('country', filters.country);
      if (filters.year) params.append('year', filters.year);
      if (filters.type) params.append('type', filters.type);
      if (filters.duration) params.append('duration', filters.duration); // Thêm tham số duration
      
      // Thêm tham số để tìm kiếm cả trong mô tả phim
      params.append('search_description', 'true');
      
      // Thêm tham số mới hỗ trợ tìm kiếm ngôn ngữ tự nhiên
      params.append('search_all_fields', 'true');
      
      console.log(`Searching with params: ${params.toString()}`);
      const response = await fetch(`${API_URL}/search?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error(`Search failed with status: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('Search API response:', result);
      
      // Kiểm tra cấu trúc phản hồi và xử lý linh hoạt hơn
      let searchHits = [];
      let searchTotal = 0;
      let searchMaxScore = 0;
      
      // Trường hợp 1: API trả về cấu trúc tiêu chuẩn với hits
      if (result.hits && Array.isArray(result.hits)) {
        searchHits = result.hits;
        searchTotal = result.total || result.hits.length;
        searchMaxScore = result.maxScore || 0;
      } 
      // Trường hợp 2: API trả về trực tiếp mảng kết quả
      else if (Array.isArray(result)) {
        searchHits = result;
        searchTotal = result.length;
      } 
      // Trường hợp 3: API trả về cấu trúc với movies hoặc data
      else if (result.movies && Array.isArray(result.movies)) {
        searchHits = result.movies;
        searchTotal = result.total || result.movies.length;
      } 
      else if (result.data && Array.isArray(result.data)) {
        searchHits = result.data;
        searchTotal = result.total || result.data.length;
      }
      // Trường hợp 4: Không có kết quả phù hợp
      else if (result.success === false) {
        console.log('API indicated search failure:', result.message || 'Unknown error');
        return { hits: [], total: 0, maxScore: 0 };
      }
      
      // Loại bỏ các kết quả trùng lặp dựa trên ID hoặc slug
      const uniqueMovies = [];
      const uniqueIds = new Set();
      const uniqueSlugs = new Set();
      
      searchHits.forEach(movie => {
        const movieId = movie.id || movie._id;
        const movieSlug = movie.slug;
        
        // Nếu phim chưa có trong danh sách (theo ID hoặc slug), thêm vào
        if ((!movieId || !uniqueIds.has(movieId)) && (!movieSlug || !uniqueSlugs.has(movieSlug))) {
          if (movieId) uniqueIds.add(movieId);
          if (movieSlug) uniqueSlugs.add(movieSlug);
          uniqueMovies.push(movie);
        }
      });
      
      // Trả về kết quả đã loại bỏ trùng lặp
      return {
        hits: uniqueMovies,
        total: searchTotal,
        maxScore: searchMaxScore
      };
    } catch (error) {
      console.error('Error searching movies:', error);
      return { hits: [], total: 0, maxScore: 0 };
    }
  },
  
  // Lấy phim mới nhất
  getNewestMovies: async (page = 1, size = 20) => {
    try {
      const params = new URLSearchParams();
      params.append('page', page);
      params.append('size', size);
      params.append('sort', 'newest');
      
      console.log(`Fetching newest movies with params: ${params.toString()}`);
      const response = await fetch(`${API_URL}/movies?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch newest movies with status: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('Newest movies API response:', result);
      
      // Kiểm tra cấu trúc phản hồi từ API
      if (result.success === false) {
        throw new Error(result.message || 'Failed to fetch newest movies');
      }
      
      // Nếu API trả về một mảng phim trực tiếp
      if (Array.isArray(result)) {
        return {
          items: result,
          pagination: {
            currentPage: page,
            totalPages: Math.ceil(result.length / size),
            totalItems: result.length
          }
        };
      }
      
      // Nếu API trả về danh sách phim trong thuộc tính data hoặc movies
      if (result.data) {
        return {
          items: result.data,
          pagination: result.pagination || {
            currentPage: page,
            totalPages: Math.ceil(result.data.length / size),
            totalItems: result.data.length
          }
        };
      } else if (result.movies) {
        return {
          items: result.movies,
          pagination: result.pagination || {
            currentPage: page,
            totalPages: Math.ceil(result.movies.length / size),
            totalItems: result.movies.length
          }
        };
      }
      
      // Nếu API trả về dữ liệu phim khác cấu trúc
      // Ưu tiên trả về dữ liệu bất kể cấu trúc
      console.warn('API responded with unexpected structure - attempting to extract movies:', result);
      
      // Tìm thuộc tính nào có thể chứa danh sách phim
      for (const key in result) {
        if (Array.isArray(result[key])) {
          return {
            items: result[key],
            pagination: {
              currentPage: page,
              totalPages: Math.ceil(result[key].length / size),
              totalItems: result[key].length
            }
          };
        }
      }
      
      // Nếu không tìm thấy mảng phim nào, trả về đối tượng kết quả như một mục duy nhất
      return {
        items: [result],
        pagination: {
          currentPage: 1,
          totalPages: 1,
          totalItems: 1
        }
      };
    } catch (error) {
      console.error('Error fetching newest movies:', error);
      throw error;
    }
  }
};

export default movieService;