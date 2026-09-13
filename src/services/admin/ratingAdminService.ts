// src/services/admin/ratingAdminService.ts
import axiosInstance from '../../API/config/axiosConfig';

interface RatingUser {
  _id: string;
  username: string;
  email: string;
  avatar?: string;
}

export interface Rating {
  _id: string;
  userId: string | RatingUser;
  movieId: string;
  rating: number;
  createdAt: string;
  updatedAt: string;
}

export interface RatingStats {
  ratings: Rating[];
  averageRating: number;
  ratingCount: number;
  userRatingsStats: Record<number, number>;
}

/**
 * Lấy danh sách đánh giá cho một phim
 */
export const getMovieRatings = async (movieId: string): Promise<RatingStats> => {
  try {
    const response = await axiosInstance.get(`/admin/ratings/${movieId}`);
    return response.data.data;
  } catch (error) {
    console.error('Error fetching movie ratings:', error);
    throw error;
  }
};

/**
 * Đồng bộ đánh giá cho một phim cụ thể
 */
export const syncMovieRatings = async (movieId: string) => {
  try {
    const response = await axiosInstance.post('/admin/ratings/update-movie-ratings', { movieId });
    return response.data.data;
  } catch (error) {
    console.error('Error syncing movie ratings:', error);
    throw error;
  }
};

/**
 * Đồng bộ đánh giá cho tất cả các phim
 */
export const syncAllMovieRatings = async () => {
  try {
    const response = await axiosInstance.get('/admin/ratings/sync-all');
    return response.data.data;
  } catch (error) {
    console.error('Error syncing all movie ratings:', error);
    throw error;
  }
};
