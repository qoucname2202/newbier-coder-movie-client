/**
 * @file ratingService.ts
 * @description Movie rating API client. Uses fetch (not the shared axios
 * instance) because some endpoints are public and don't need credentials.
 */
import { apiUrl } from '@/config/apiPaths';
import authService, { getStoredAccessToken } from './authService';

/**
 * Reads the access token from the browser storage.
 *
 * The session storage is checked first, because a session-only login keeps
 * the token there. The local storage is the fallback for the "remember me"
 * mode.
 *
 * @returns The token, or null when the user is not signed in.
 */
const getAuthToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return getStoredAccessToken();
};

/**
 * Reads the id of the signed-in user.
 *
 * The `userId` key was read before, but it was never written anywhere, so
 * every rating call failed with "Authentication info not found". The id is
 * now taken from the stored user payload, with the legacy key as a fallback.
 *
 * @returns The user id, or null when it cannot be resolved.
 */
const getUserId = (): string | null => {
  if (typeof window === 'undefined') return null;

  try {
    const legacy = localStorage.getItem('userId');
    if (legacy) return legacy;
  } catch {
    /* localStorage can be disabled */
  }

  try {
    const user = authService.getCurrentUser();
    const id = user?._id || user?.id || user?.sub;
    if (id) return String(id);
  } catch {
    /* the payload cannot be decoded */
  }

  return null;
};

const authHeader = (token: string): HeadersInit => ({
  Authorization: `Bearer ${token}`,
  'Content-Type': 'application/json'
});

export interface RatingServiceResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
}

export interface MovieRatingStats {
  averageRating: number;
  ratingCount: number;
}

export interface UserRatingItem {
  _id: string;
  userId: string;
  movieId: string;
  movieSlug?: string;
  rating: number;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: unknown;
}

const ratingService = {
  getUserRatings: async (): Promise<RatingServiceResponse<UserRatingItem[]>> => {
    const token = getAuthToken();
    const userId = getUserId();
    if (!token || !userId) {
      return { success: false, message: 'Authentication info not found', data: [] };
    }
    try {
      const res = await fetch(apiUrl(`ratingsUserById`, userId), {
        method: 'GET',
        headers: authHeader(token)
      });
      if (!res.ok) throw new Error(`Failed to fetch user ratings: ${res.status}`);
      return await res.json() as RatingServiceResponse<UserRatingItem[]>;
    } catch (error) {

      return { success: false, message: (error as Error).message, data: [] };
    }
  },

  getUserMovieRating: async (movieSlug: string): Promise<RatingServiceResponse<{ rating: number }>> => {
    const token = getAuthToken();
    const userId = getUserId();
    if (!token || !userId) {
      return { success: false, message: 'Authentication info not found' };
    }
    try {
      const res = await fetch(apiUrl(`ratingsUserMovie`, userId, movieSlug), {
        method: 'GET',
        headers: authHeader(token)
      });
      if (res.status === 404) return { success: true, data: { rating: 0 } };
      if (!res.ok) throw new Error(`Failed to fetch user movie rating: ${res.status}`);
      return await res.json() as RatingServiceResponse<{ rating: number }>;
    } catch (error) {

      return { success: false, message: (error as Error).message, data: { rating: 0 } };
    }
  },

  createOrUpdateRating: async (movieSlug: string, rating: number): Promise<RatingServiceResponse> => {
    const token = getAuthToken();
    if (!token) return { success: false, message: 'Authentication token not found' };
    try {
      const res = await fetch(apiUrl(`ratingsCreate`), {
        method: 'POST',
        headers: authHeader(token),
        body: JSON.stringify({ movieSlug, rating })
      });
      if (!res.ok) throw new Error(`Failed to create/update rating: ${res.status}`);
      return await res.json() as RatingServiceResponse;
    } catch (error) {

      return { success: false, message: (error as Error).message };
    }
  },

  deleteRating: async (ratingId: string): Promise<RatingServiceResponse> => {
    const token = getAuthToken();
    if (!token) return { success: false, message: 'Authentication token not found' };
    try {
      const res = await fetch(apiUrl(`ratingsById`, ratingId), {
        method: 'DELETE',
        headers: authHeader(token)
      });
      if (!res.ok) throw new Error(`Failed to delete rating: ${res.status}`);
      return await res.json() as RatingServiceResponse;
    } catch (error) {

      return { success: false, message: (error as Error).message };
    }
  },

  getMovieRatingStats: async (movieSlug: string): Promise<RatingServiceResponse<MovieRatingStats>> => {
    try {
      // The endpoint needs the Bearer token, so the header is resolved
      // through the shared auth service (it also restores the session and
      // refreshes an expiring token).
      const authHeaders = await authService.getAuthHeader();
      const res = await fetch(apiUrl(`ratingsStats`, movieSlug), {
        method: 'GET',
        headers: { 'Content-Type': 'application/json', ...authHeaders }
      });
      if (!res.ok) throw new Error(`Failed to fetch rating stats: ${res.status}`);
      return await res.json() as RatingServiceResponse<MovieRatingStats>;
    } catch (error) {

      return { success: false, message: (error as Error).message, data: { averageRating: 0, ratingCount: 0 } };
    }
  },

  getMovieRatings: async (movieId: string): Promise<RatingServiceResponse<UserRatingItem[]>> => {
    try {
      // The endpoint needs the Bearer token, so the header is resolved
      // through the shared auth service.
      const authHeaders = await authService.getAuthHeader();
      const res = await fetch(apiUrl(`ratingsMovie`, movieId), {
        method: 'GET',
        headers: { 'Content-Type': 'application/json', ...authHeaders }
      });
      if (!res.ok) throw new Error(`Failed to fetch movie ratings: ${res.status}`);
      return await res.json() as RatingServiceResponse<UserRatingItem[]>;
    } catch (error) {

      return { success: false, message: (error as Error).message, data: [] };
    }
  }
};

export default ratingService;
