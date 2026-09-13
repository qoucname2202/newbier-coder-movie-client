// src/services/admin/movieAdminService.ts

import axiosInstance from '../../API/config/axiosConfig';
import { API_URL, endpoints } from '../../config/API.js';

export interface Movie {
  _id: string;
  name: string;
  origin_name: string;
  slug: string;
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
    let url = endpoints.admin.movies.getAll(page, limit);

    if (sortField) url += `&sort=${sortField}`;
    if (sortDirection) url += `&order=${sortDirection}`;
    if (category) url += `&categoryId=${category}`;
    if (status && status !== 'all') url += `&status=${status}`;
    if (search) url += `&search=${encodeURIComponent(search)}`;
    if (year) url += `&year=${year}`;
    if (type) url += `&type=${type}`;
    if (isHidden !== undefined) url += `&isHidden=${isHidden}`;

    const response = await axiosInstance.get(url);

    return response.data;
  } catch (error: any) {
    console.error('Error fetching movies:', error);
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
    let statusParam = undefined;
    if (status && status !== 'all') {
      statusParam = status;
    }

    const response = await axiosInstance.get(`${API_URL}/admin/search/movies`, {
      params: {
        page,
        limit,
        search,
        ...(category && { categoryId: category }),
        ...(statusParam && { status: statusParam }),
        ...(year && { year }),
        ...(type && { type }),
        ...(isHidden !== undefined && { isHidden })
      }
    });

    return response.data;
  } catch (error: any) {
    console.error('Error searching movies with Elasticsearch:', error);
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

export const checkElasticsearchStatus = async (): Promise<ElasticsearchStatus> => {
  try {
    const response = await axiosInstance.get(`${API_URL}/admin/search/status`);

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

export const deleteMovieByAdmin = async (movieId: string): Promise<void> => {
  try {
    const url = endpoints.admin.movies.delete(movieId);
    await axiosInstance.delete(url);
  } catch (error: any) {
    console.error(`Error deleting movie ${movieId}:`, error);
    throw error;
  }
};

export const toggleMovieVisibility = async (movieId: string): Promise<void> => {
  try {
    const url = endpoints.admin.movies.toggleVisibility(movieId);

    const response = await axiosInstance.patch(url, {}, {
      timeout: 10000
    });

    return response.data;
  } catch (error: any) {
    console.error(`Error toggling visibility for movie ${movieId}:`, error);
    if (error.response) {
      console.error('Error response data:', error.response.data);
      console.error('Error response status:', error.response.status);
    } else if (error.request) {
      console.error('Error request:', error.request);
    }
    throw error;
  }
};

export const createMovieByAdmin = async (movieData: Record<string, any>): Promise<{movie: Movie, success: boolean}> => {
  try {
    const url = endpoints.admin.movies.create();
    const response = await axiosInstance.post(url, movieData);
    return response.data;
  } catch (error: unknown) {
    console.error('Error creating movie:', error);
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