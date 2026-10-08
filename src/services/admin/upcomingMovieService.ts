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

export const getUpcomingMovies = async (
  page = 1,
  limit = 10,
  search = '',
  filters = {}
): Promise<AxiosResponse> => {
  const params = { page, limit, search, ...filters };
  return await axiosInstance.get('/admin/upcoming-movies', { params });
};

export const getUpcomingMovieById = async (id: string): Promise<AxiosResponse> => {
  return await axiosInstance.get(`/admin/upcoming-movies/${id}`);
};

export const createUpcomingMovie = async (movieData: Partial<UpcomingMovie>): Promise<AxiosResponse> => {
  return await axiosInstance.post('/admin/upcoming-movies', movieData);
};

export const updateUpcomingMovie = async (id: string, movieData: Partial<UpcomingMovie>): Promise<AxiosResponse> => {
  return await axiosInstance.put(`/admin/upcoming-movies/${id}`, movieData);
};

export const deleteUpcomingMovie = async (id: string): Promise<AxiosResponse> => {
  return await axiosInstance.delete(`/admin/upcoming-movies/${id}`);
};

export const releaseUpcomingMovie = async (id: string): Promise<AxiosResponse> => {
  return await axiosInstance.put(`/admin/upcoming-movies/${id}/release`);
};
