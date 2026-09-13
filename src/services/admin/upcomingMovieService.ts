// src/services/admin/upcomingMovieService.ts
import axiosInstance from '@/config/axiosAdminConfig';
import { AxiosResponse } from 'axios';

export interface UpcomingMovie {
  _id?: string;
  name: string;
  origin_name: string;
  content: string;
  type: string;
  status: string;
  thumb_url: string;
  poster_url: string;
  trailer_url: string;
  year: number;
  quality: string;
  lang: string;
  category: Array<{ id: string; name: string; slug: string }>;
  country: Array<{ id: string; name: string; slug: string }>;
  actor: string[];
  director: string[];
  release_date: string | Date;
  is_released: boolean;
  chieurap: boolean;
  isHidden: boolean;
}

// Lấy danh sách phim sắp ra mắt với phân trang
export const getUpcomingMovies = async (
  page = 1, 
  limit = 10, 
  search = '', 
  filters = {}
): Promise<AxiosResponse> => {
  const params = { page, limit, search, ...filters };
  return await axiosInstance.get('/admin/upcoming-movies', { params });
};

// Lấy chi tiết một phim sắp ra mắt theo ID
export const getUpcomingMovieById = async (id: string): Promise<AxiosResponse> => {
  return await axiosInstance.get(`/admin/upcoming-movies/${id}`);
};

// Tạo phim sắp ra mắt mới
export const createUpcomingMovie = async (movieData: Partial<UpcomingMovie>): Promise<AxiosResponse> => {
  return await axiosInstance.post('/admin/upcoming-movies', movieData);
};

// Cập nhật phim sắp ra mắt
export const updateUpcomingMovie = async (id: string, movieData: Partial<UpcomingMovie>): Promise<AxiosResponse> => {
  return await axiosInstance.put(`/admin/upcoming-movies/${id}`, movieData);
};

// Xóa phim sắp ra mắt
export const deleteUpcomingMovie = async (id: string): Promise<AxiosResponse> => {
  return await axiosInstance.delete(`/admin/upcoming-movies/${id}`);
};

// Chuyển trạng thái phim từ sắp ra mắt thành đã phát hành
export const releaseUpcomingMovie = async (id: string): Promise<AxiosResponse> => {
  return await axiosInstance.put(`/admin/upcoming-movies/${id}/release`);
};
