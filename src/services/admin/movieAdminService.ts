// src/services/admin/movieAdminService.ts

// Import axios instance đã cấu hình cho admin - Sửa lại đường dẫn để phù hợp với cấu trúc thư mục
import axiosInstance from '../../API/config/axiosConfig';
// Sửa đường dẫn import để trỏ đến đúng file API.js (không phải API.ts)
import { API_URL, endpoints } from '../../config/API.js';

// Thêm định nghĩa các interface cần thiết ở đây
export interface Movie {
  _id: string;
  name: string;
  origin_name: string;
  slug: string;
  // Thêm các trường khác nếu cần
}

export interface PaginationData {
  totalItems: number;
  totalPages: number;
  currentPage: number;
  itemsPerPage: number;
}

export interface MovieListResponseData {
  movies: Movie[];
  pagination: PaginationData;
}

export interface ElasticsearchStatus {
  status: 'active' | 'inactive' | 'error';
  message: string;
  documentCount?: number;
}

// --- Các hàm Service ---

// Hàm lấy danh sách phim - đã cập nhật để phù hợp với cấu trúc từ API.js
export const getMoviesForAdmin = async (
  page: number = 1, 
  limit: number = 10,
  sortField: string = 'updatedAt',
  sortDirection: string = 'desc',
  category?: string,
  status?: string,
  search?: string,
  year?: number,
  type?: string,
  isHidden?: boolean
): Promise<any> => {
  try {
    console.log('Calling getMoviesForAdmin with params:', { page, limit, sortField, sortDirection, category, status, search, year, type, isHidden });
    
    // Use the endpoints object from API.js for consistent URL building
    let url = endpoints.admin.movies.getAll(page, limit);
    
    // Thêm các tham số tìm kiếm và lọc khác
    if (sortField) url += `&sort=${sortField}`;
    if (sortDirection) url += `&order=${sortDirection}`;
    if (category) url += `&categoryId=${category}`; // Sửa 'category' thành 'categoryId' để backend hiểu đúng
    if (status && status !== 'all') url += `&status=${status}`;
    if (search) url += `&search=${encodeURIComponent(search)}`;
    if (year) url += `&year=${year}`;
    if (type) url += `&type=${type}`;
    if (isHidden !== undefined) url += `&isHidden=${isHidden}`;
    
    console.log('API URL:', url);
    
    const response = await axiosInstance.get(url);
    
    console.log('API Response:', response.data);
    
    // Trả về dữ liệu từ response
    return response.data;
  } catch (error: any) {
    console.error('Error fetching movies:', error);
    // Trả về dữ liệu mặc định để tránh lỗi khi hiển thị UI
    return { 
      movies: [], 
      pagination: { 
        totalItems: 0, 
        totalPages: 1, 
        currentPage: page, 
        itemsPerPage: limit 
      }
    };
  }
};

// Thêm function để tìm kiếm bằng Elasticsearch
export const searchMoviesWithElasticsearch = async (
  page: number = 1, 
  limit: number = 10,
  search: string = '',
  category?: string,
  status?: string,
  year?: number,
  type?: string,
  isHidden?: boolean
): Promise<MovieListResponseData> => {
  try {
    console.log('Searching movies with Elasticsearch:', { page, limit, search, category, status, year, type, isHidden });
    
    // Process status parameter outside the params object
    let statusParam = undefined;
    if (status && status !== 'all') {
      statusParam = status;
    }
    
    const response = await axiosInstance.get(`${API_URL}/admin/search/movies`, { 
      params: { 
        page,
        limit,
        search,
        ...(category && { categoryId: category }), // Sửa category thành categoryId
        ...(statusParam && { status: statusParam }),
        ...(year && { year }),
        ...(type && { type }),
        ...(isHidden !== undefined && { isHidden })
      } 
    });
    
    console.log('Elasticsearch search response:', response.data);
    
    return response.data;
  } catch (error: any) {
    console.error('Error searching movies with Elasticsearch:', error);
    // Trả về dữ liệu mặc định để tránh lỗi khi hiển thị UI
    return { 
      movies: [], 
      pagination: { 
        totalItems: 0, 
        totalPages: 1, 
        currentPage: page, 
        itemsPerPage: limit 
      }
    };
  }
};

// Kiểm tra trạng thái của Elasticsearch
export const checkElasticsearchStatus = async (): Promise<ElasticsearchStatus> => {
  try {
    console.log('Checking Elasticsearch status');
    const response = await axiosInstance.get(`${API_URL}/admin/search/status`);
    
    console.log('Elasticsearch status response:', response);
    
    // Parse the response correctly
    if (response.data && typeof response.data === 'object') {
      return {
        status: response.data.status || 'error',
        message: response.data.message || 'Không có thông tin trạng thái',
        documentCount: response.data.documentCount
      };
    }
    
    return {
      status: 'error',
      message: 'Định dạng phản hồi không hợp lệ'
    };
  } catch (error: any) {
    console.error('Error checking Elasticsearch status:', error);
    
    // Add detailed error information
    const errorMessage = error.response 
      ? `${error.response.status} ${error.response.statusText}: ${JSON.stringify(error.response.data)}` 
      : error.message || 'Lỗi không xác định';
      
    return {
      status: 'error',
      message: 'Không thể kết nối đến Elasticsearch: ' + errorMessage
    };
  }
};

// Hàm xóa phim - đã cập nhật để sử dụng endpoints từ API.js
export const deleteMovieByAdmin = async (movieId: string): Promise<void> => {
  try {
    // Sử dụng endpoints từ API.js
    const url = endpoints.admin.movies.delete(movieId);
    await axiosInstance.delete(url);
  } catch (error: any) {
    console.error(`Error deleting movie ${movieId}:`, error);
    throw error;
  }
};

// Hàm toggle trạng thái ẩn/hiện của phim
export const toggleMovieVisibility = async (movieId: string): Promise<void> => {
  try {
    // Sử dụng endpoint được định nghĩa trong API.js
    const url = endpoints.admin.movies.toggleVisibility(movieId);
    console.log('Toggling movie visibility with URL:', url);
    
    // Sử dụng đúng phương thức PATCH khớp với backend
    const response = await axiosInstance.patch(url, {}, {
      timeout: 10000 // Tăng timeout lên 10 giây
    });
    
    console.log('Toggle visibility response:', response.data);
    return response.data;
  } catch (error: any) {
    console.error(`Error toggling visibility for movie ${movieId}:`, error);
    // Bổ sung thêm log chi tiết để debug
    if (error.response) {
      console.error('Error response data:', error.response.data);
      console.error('Error response status:', error.response.status);
    } else if (error.request) {
      console.error('Error request:', error.request);
    }
    throw error;
  }
};

// Hàm tạo phim mới
export const createMovieByAdmin = async (movieData: Record<string, any>): Promise<{movie: Movie, success: boolean}> => {
  try {
    // Sử dụng endpoint từ API.js
    const url = endpoints.admin.movies.create();
    console.log('Creating movie with URL:', url, 'Data:', movieData);
    
    const response = await axiosInstance.post(url, movieData);
    
    console.log('Create movie response:', response.data);
    return response.data;
  } catch (error: unknown) {
    console.error('Error creating movie:', error);
    // Bổ sung thêm log chi tiết để debug
    if (error && typeof error === 'object' && 'response' in error) {
      const axiosError = error as {response?: {data: any, status: number}};
      console.error('Error response data:', axiosError.response?.data);
      console.error('Error response status:', axiosError.response?.status);
    } else if (error && typeof error === 'object' && 'request' in error) {
      console.error('Error request:', (error as {request: any}).request);
    }
    throw error;
  }
};