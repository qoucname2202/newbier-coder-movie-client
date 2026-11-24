/**
 * upcomingMovieService.ts
 *
 * Public upcoming-movie reads (list / by-id / by-slug / by-category).
 *
 * This file used to build the base URL from the environment on its own, with
 * an empty string as the fallback. Without the environment variable every
 * request became `/upcoming-movies?...`, a relative URL, so it was sent to
 * the Next.js server itself and answered with HTML instead of JSON. It now
 * uses `getApiBaseUrl()`.
 */
import { getApiBaseUrl } from '@/config/apiBase';
import { apiUrl } from '@/config/apiPaths';
import authService from '@/API/services/authService';

const API_URL = getApiBaseUrl();

export interface UpcomingMovie {
  _id: string;
  name: string;
  origin_name?: string;
  thumb_url: string;
  poster_url: string;
  release_date: string | Date;
  formattedReleaseDate?: string;
  daysUntilRelease?: number;
  countdownText?: string;
  [key: string]: unknown;
}

export interface UpcomingPagination {
  currentPage: number;
  totalPages: number;
  totalCount: number;
}

export interface UpcomingListResult {
  success: boolean;
  upcomingMovies: UpcomingMovie[];
  pagination?: UpcomingPagination;
}

const emptyList = (): UpcomingListResult => ({
  success: false,
  upcomingMovies: [],
  pagination: { currentPage: 1, totalPages: 1, totalCount: 0 }
});

const formatMovie = (movie: UpcomingMovie): UpcomingMovie => {
  const releaseDate = new Date(movie.release_date);
  return {
    ...movie,
    formattedReleaseDate: releaseDate.toLocaleDateString('en-GB'),
    daysUntilRelease: Math.ceil((releaseDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
    countdownText: getCountdownText(releaseDate)
  };
};

/** Human-readable countdown label for a future release date. */
function getCountdownText(releaseDate: Date): string {
  const daysDiff = Math.ceil((releaseDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  if (daysDiff <= 0) return 'Released';
  if (daysDiff === 1) return 'Releases tomorrow';
  if (daysDiff <= 7) return `Releases in ${daysDiff} days`;
  if (daysDiff <= 30) {
    const weeks = Math.ceil(daysDiff / 7);
    return `Releases in ${weeks} weeks`;
  }
  const months = Math.ceil(daysDiff / 30);
  return `Releases in ${months} months`;
}

const fetchJson = async (url: string, init?: RequestInit): Promise<unknown> => {
  try {
    // The endpoints of the backend need the Bearer token, so the header is
    // resolved through the shared auth service (it also restores the session
    // and refreshes an expiring token).
    const authHeaders = await authService.getAuthHeader();
    const res = await fetch(url, {
      ...init,
      headers: { Accept: 'application/json', ...authHeaders, ...(init?.headers || {}) }
    });
    if (!res.ok) {
      if (res.status === 401 || res.status === 403) {
        try {
          const { handleSessionHardFailure } = await import('@/auth/authToken');
          handleSessionHardFailure(true);
        } catch {
          // ignore
        }
      }
      return null;
    }
    return await res.json();
  } catch {
    return null;
  }
};

const upcomingMovieService = {
  getUpcomingMovies: async (page = 1, limit = 10): Promise<UpcomingListResult> => {
    const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
    const timeoutId = controller ? setTimeout(() => controller.abort(), 1200) : null;
    const data = await fetchJson(
      apiUrl(`upcomingList`) + `?page=${page}&limit=${limit}`,
      controller ? { signal: controller.signal } : undefined
    );
    if (timeoutId) clearTimeout(timeoutId);

    if (!data || typeof data !== 'object') return emptyList();
    const payload = data as { success?: boolean; upcomingMovies?: UpcomingMovie[]; currentPage?: number; totalPages?: number; totalCount?: number };
    if (payload.success && Array.isArray(payload.upcomingMovies)) {
      const processed = payload.upcomingMovies
        .map(formatMovie)
        .sort((a, b) => new Date(a.release_date).getTime() - new Date(b.release_date).getTime());
      return {
        success: true,
        upcomingMovies: processed,
        pagination: {
          currentPage: payload.currentPage || 1,
          totalPages: payload.totalPages || 1,
          totalCount: payload.totalCount || processed.length
        }
      };
    }
    return emptyList();
  },

  getUpcomingMovieById: async (movieId: string): Promise<{ success: boolean; upcomingMovie: UpcomingMovie | null }> => {
    const data = await fetchJson(apiUrl(`upcomingAdminById`, movieId));
    if (!data || typeof data !== 'object') return { success: false, upcomingMovie: null };
    const payload = data as { success?: boolean; upcomingMovie?: UpcomingMovie };
    if (payload.success && payload.upcomingMovie) {
      return { success: true, upcomingMovie: formatMovie(payload.upcomingMovie) };
    }
    return { success: false, upcomingMovie: null };
  },

  getUpcomingMovieBySlug: async (slug: string): Promise<{ success: boolean; movie: UpcomingMovie | null }> => {
    const data = await fetchJson(apiUrl(`upcomingBySlug`, slug));
    if (!data || typeof data !== 'object') return { success: false, movie: null };
    return data as { success: boolean; movie: UpcomingMovie | null };
  },

  getUpcomingMoviesByCategory: async (categorySlug: string, page = 1, limit = 10): Promise<{ success: boolean; upcomingMovies: UpcomingMovie[] }> => {
    const data = await fetchJson(apiUrl(`upcomingByCategory`, categorySlug) + `?page=${page}&limit=${limit}`);
    if (!data || typeof data !== 'object') return { success: false, upcomingMovies: [] };
    return data as { success: boolean; upcomingMovies: UpcomingMovie[] };
  }
};

export default upcomingMovieService;
