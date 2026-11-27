/**
 * @file actorService.ts
 * @description Client-side service for Actor / Performer details and filmography.
 * Calls GET /api/v1/actors/:slug and normalizes response from Fastify enterprise envelope.
 */

import axiosInstance from '@/API/config/axiosConfig';
import { endpoints } from '@/config/API';
import movieService from '@/API/services/movieService';

export interface ActorDetailData {
  id: string;
  name: string;
  slug: string;
  birthName?: string;
  dateOfBirth?: string | null;
  placeOfBirth?: string;
  nationality?: string;
  gender?: 'male' | 'female' | 'other' | 'unknown' | string;
  height?: number | null;
  profileImage?: string;
  coverImage?: string;
  biography?: string;
  knownFor?: string;
  debutYear?: number | null;
  socialMedia?: Record<string, string>;
  movieCount?: number;
  popularity?: number;
  viewCount?: number;
  source?: string;
  externalId?: string;
  awards?: string[];
}

export interface ActorMovieCredit {
  id: string;
  slug: string;
  name: string;
  title?: string;
  origin_name?: string;
  poster_url?: string;
  thumb_url?: string;
  year?: number | string;
  quality?: string;
  rating?: number;
  type?: string;
  character?: string;
  role?: string;
}

const SUCCESS_CODE = '000000';

const actorService = {
  /**
   * Fetches actor profile details by slug from GET /api/v1/actors/:slug
   */
  getActorDetail: async (slug: string): Promise<ActorDetailData | null> => {
    if (!slug) return null;
    try {
      const response = await axiosInstance.get(endpoints.actors.getDetail(slug));
      const payload = response.data as {
        responseStatus?: { responseCode?: string; responseMessage?: string };
        responseData?: Record<string, unknown>;
      };

      if (
        payload &&
        payload.responseStatus &&
        payload.responseStatus.responseCode &&
        payload.responseStatus.responseCode !== SUCCESS_CODE
      ) {
        return null;
      }

      const data = (payload?.responseData || payload) as Record<string, unknown>;
      if (!data || typeof data !== 'object') return null;

      return {
        id: String(data.id || data._id || slug),
        name: String(data.name || slug.replace(/-/g, ' ')),
        slug: String(data.slug || slug),
        birthName: data.birthName ? String(data.birthName) : undefined,
        dateOfBirth: data.dateOfBirth ? String(data.dateOfBirth) : null,
        placeOfBirth: data.placeOfBirth ? String(data.placeOfBirth) : '',
        nationality: data.nationality ? String(data.nationality) : '',
        gender: String(data.gender || 'unknown'),
        height: typeof data.height === 'number' ? data.height : null,
        profileImage: String(data.profileImage || data.avatar || data.poster_url || ''),
        coverImage: String(data.coverImage || data.backdrop || ''),
        biography: String(data.biography || data.bio || ''),
        knownFor: String(data.knownFor || ''),
        debutYear: typeof data.debutYear === 'number' ? data.debutYear : null,
        socialMedia:
          data.socialMedia && typeof data.socialMedia === 'object'
            ? (data.socialMedia as Record<string, string>)
            : {},
        movieCount: typeof data.movieCount === 'number' ? data.movieCount : 0,
        popularity: typeof data.popularity === 'number' ? data.popularity : 1,
        viewCount: typeof data.viewCount === 'number' ? data.viewCount : 1,
        source: String(data.source || 'manual'),
        externalId: String(data.externalId || ''),
        awards: Array.isArray(data.awards) ? (data.awards as string[]) : []
      };
    } catch {
      return null;
    }
  },

  /**
   * Fetches movies associated with an actor (by searching catalog by actor name/slug)
   */
  getActorFilmography: async (actorName: string): Promise<ActorMovieCredit[]> => {
    if (!actorName) return [];
    try {
      const searchResult = await movieService.searchMovies(actorName, {}, 1, 30);
      const items = (searchResult as any)?.hits || (searchResult as any)?.data || (searchResult as any)?.items || searchResult || [];

      if (!Array.isArray(items)) return [];

      return items.map((m: any, index: number) => ({
        id: String(m.id || m._id || `m-${index}`),
        slug: String(m.slug || m._id || ''),
        name: String(m.name || m.title || 'Phim'),
        title: String(m.title || m.name || 'Phim'),
        origin_name: String(m.origin_name || m.original_name || ''),
        poster_url: m.poster_url || m.thumb_url || m.poster || '',
        thumb_url: m.thumb_url || m.poster_url || '',
        year: m.year,
        quality: m.quality || 'HD',
        rating: Number(m.rating || m.vote_average || 8.6),
        type: m.type || 'single'
      }));
    } catch {
      return [];
    }
  }
};

export default actorService;

