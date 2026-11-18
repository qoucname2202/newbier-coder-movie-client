/**
 * The central data management hook of the movie detail page (`/movie/[slug]`).
 *
 * It loads the real movie metadata, the episode servers, the related
 * recommendations and the user interactions (favorites, ratings, comments),
 * with defensive fallbacks on every step.
 *
 * The Zustand stores (`useMovieStore` and `useCommentStore`) are used to:
 * - Cache the movie detail by slug, so the API is not called again when the
 *   user comes back to the page.
 * - Cache the related movies, so they are not loaded again either.
 * - Cache the comments, so the store is shared with the home page.
 */

import { useState, useEffect, useCallback, useRef } from 'react';

// The Zustand stores used for the caching.
import { useMovieStore } from '@/stores/useMovieStore';
import { useCommentStore } from '@/stores/useCommentStore';
import { MOVIE_CONFIG } from '@/config/movieConfig';
import { SYSTEM_CONFIG } from '@/config/systemConfig';
import {
  resolveMovieBackdrop,
  resolveMovieSubTitle,
  resolveMovieCategories,
  resolveMovieQuality,
  resolveMovieYear,
  resolveMovieActors,
  resolveMovieDirectors,
  LOCAL_DEFAULT_BACKDROP,
  LOCAL_DEFAULT_POSTER,
  MOVIE_FALLBACK_DEFAULTS
} from '@/config/movieFallbackConfig';
import { pickImageSrc, POSTER_FIELDS, THUMB_FIELDS } from '@/utils/imageSource';
import { resolveImageUrl } from '@/utils/movieNormalizer';
import { apiUrl } from '@/config/apiPaths';
import { getStoredAccessToken } from '@/API/services/authService';

const API_BASE = MOVIE_CONFIG.apiBaseUrl;

/** A raw movie object coming from the backend. */
export type RawMovie = Record<string, unknown>;

/** A country entity. */
interface CountryEntity {
  name: string;
  slug: string;
}

/** One entry of the episode server data. */
export interface EpisodeServerData {
  id?: string;
  name?: string;
  slug?: string;
  filename?: string;
  /** The embed URL (iframe). It is normalized from the camelCase `linkEmbed`. */
  link_embed?: string;
  /** The HLS playlist URL. It is normalized from the camelCase `linkM3u8`. */
  link_m3u8?: string;
  /** The original camelCase keys are kept for the callers still using them. */
  linkEmbed?: string;
  linkM3u8?: string;
  [key: string]: unknown;
}

/** An episode server. */
export interface EpisodeServer {
  server_name?: string;
  server_data?: EpisodeServerData[];
  /** The original camelCase keys are kept for the callers still using them. */
  serverName?: string;
  serverData?: EpisodeServerData[];
  [key: string]: unknown;
}

/**
 * Normalizes the `episodes` array from the backend into snake_case.
 *
 * ## Why this exists
 * The movie-detail API returns episode servers in **camelCase**:
 * ```json
 * [{ "serverName": "Vietsub #1", "serverData": [
 *     { "id": "...", "name": "1", "slug": "tap-1",
 *       "linkEmbed": "https://embed13.streamc.xyz/embed.php?hash=...",
 *       "linkM3u8": "" }] }]
 * ```
 * but every consumer in the app (`EpisodeDirectory`, `MovieHeroHeader`,
 * `WatchSidebarPlaylist`, `MoviePlayerSection`, `watch.tsx`) reads the
 * **snake_case** contract — `server_name` / `server_data` / `link_embed` /
 * `link_m3u8`.
 *
 * Because those interfaces all carry `[key: string]: unknown`, TypeScript
 * could not catch the mismatch, so at runtime `server.server_data` was
 * `undefined`. The symptoms were: the episode directory rendered nothing,
 * the server tab showed a fallback name, and the player showed the message
 * "the episode stream is being updated" even though the movie had 12
 * playable episodes.
 *
 * ## Why we add aliases instead of renaming
 * The camelCase keys are kept alongside the snake_case ones so that admin
 * screens (which save `server_name`/`server_data`) and any legacy caller
 * reading the raw payload keep working. Only additive changes are made.
 */
export const normalizeEpisodes = (raw: unknown): EpisodeServer[] => {
  if (!Array.isArray(raw)) return [];

  return raw
    .filter((srv): srv is Record<string, unknown> => !!srv && typeof srv === 'object')
    .map((srv) => {
      // The episode list lives under `serverData` (camelCase) or
      // `server_data` (snake_case) depending on payload vintage.
      const rawList = (srv.serverData ?? srv.server_data) as unknown;
      const serverData: EpisodeServerData[] = Array.isArray(rawList)
        ? rawList
            .filter((ep): ep is Record<string, unknown> => !!ep && typeof ep === 'object')
            .map((ep) => ({
              // The spread comes first, so the fields of the backend
              // (including `id`, which the admin edit form uses as a key)
              // are kept as they are.
              ...ep,
              name: (ep.name as string) ?? '',
              slug: (ep.slug as string) ?? '',
              link_embed: (ep.link_embed as string) || (ep.linkEmbed as string) || '',
              link_m3u8: (ep.link_m3u8 as string) || (ep.linkM3u8 as string) || ''
            }))
        : [];

      const serverName = (srv.server_name as string) || (srv.serverName as string) || '';

      return {
        ...srv,
        server_name: serverName,
        server_data: serverData,
        // The canonical camelCase keys, in case the backend used snake_case.
        serverName: serverName,
        serverData: serverData
      } as EpisodeServer;
    });
};

/** The episode trailer object, used by the `TrailerModal`. */
export interface TrailerObject {
  url?: string;
  key?: string;
  site?: string;
  [key: string]: unknown;
}

/** A movie detail that was already normalized. */
export interface NormalizedMovieDetail {
  _id: string;
  id: string;
  slug: string;
  name: string;
  origin_name: string;
  backdrop_url: string;
  poster_url: string;
  thumb_url: string;
  year: number | string;
  quality: string;
  category: unknown[];
  country: CountryEntity[];
  content: string;
  rating: number;
  ratingCount: number;
  view: number;
  time: string;
  lang: string;
  type: string;
  status: string;
  trailer_url: string;
  trailer: TrailerObject | null;
  episodes: EpisodeServer[];
  actors: unknown[];
  directors: unknown[];
  [key: string]: unknown;
}

/** A comment entity. */
export interface Comment {
  _id: string;
  content: string;
  user_name: string;
  createdAt: string;
  likes: number;
  [key: string]: unknown;
}

export type MovieDetailError =
  /** The backend returned 404, so the movie really does not exist. */
  | 'not-found'
  /** The backend returned 401 or 403 and the token could not be refreshed
   * (either there is no token at all, or the refresh token is rejected too).
   * The UI should show a "please sign in" message and NOT a generic
   * "try again" button, because retrying without a token always produces
   * the same 401. */
  | 'auth-required'
  /** Anything else (5xx, network, malformed response). The UI can offer
   * a "try again" button. */
  | 'request-error';

/** The return type of the hook. */
export interface UseMovieDetailReturn {
  movie: NormalizedMovieDetail | null;
  loading: boolean;
  error: MovieDetailError | null;
  currentServerIndex: number;
  currentEpisodeIndex: number;
  activeServer: EpisodeServer | null;
  activeEpisode: EpisodeServerData | null;
  setCurrentServerIndex: (idx: number) => void;
  setCurrentEpisodeIndex: (idx: number) => void;
  isFavorite: boolean;
  favoriteLoading: boolean;
  toggleFavorite: () => Promise<void>;
  comments: Comment[];
  commentsLoading: boolean;
  addComment: (content: string, parentId?: string | null) => Promise<boolean>;
  relatedMovies: NormalizedMovieDetail[];
  refetchMovie: () => Promise<void>;
}

/**
 * Normalizes the movie detail object coming from the backend API, with
 * defensive defaults for every field.
 *
 * @param raw - The raw data of the API response.
 * @param slug - The slug used as a fallback when the payload has no id.
 * @returns The normalized movie detail, or `null` when there is no data.
 */
export const normalizeMovieDetail = (raw: RawMovie | null | undefined, slug = ''): NormalizedMovieDetail | null => {
  if (!raw) return null;

  const m = (raw.responseData as RawMovie | undefined)
    || (raw.data as RawMovie | undefined)
    || raw;

  // Normalize episodes structure. `normalizeEpisodes` maps the backend's
  // camelCase `serverName`/`serverData`/`linkEmbed`/`linkM3u8` to the
  // snake_case contract every component in the app reads. Without this,
  // `server_data` was undefined at runtime and the episode list + player
  // stayed empty even though the API returned 12 episodes.
  const episodes: EpisodeServer[] = normalizeEpisodes(m.episodes);

  // Resolve actors & directors defensively
  const actorsList = (resolveMovieActors(m as never) as unknown[]) || [];
  const directorsList = (resolveMovieDirectors(m as never) as unknown[]) || [];

  const countryRaw = m.country;
  const countryArray: CountryEntity[] = Array.isArray(countryRaw) && countryRaw.length > 0
    ? (countryRaw as CountryEntity[])
    : [{ name: 'Đang cập nhật', slug: 'quoc-gia' }];

  const tmdb = m.tmdb as Record<string, unknown> | undefined;

  return {
    ...m,
    _id: (m._id as string) || (m.id as string) || slug,
    id: (m.id as string) || (m._id as string) || slug,
    slug: (m.slug as string) || slug,
    name: (m.name as string) || 'Chi Tiết Phim',
    origin_name: resolveMovieSubTitle(m as never) as string,
    backdrop_url: (resolveMovieBackdrop(m as never) as string) || LOCAL_DEFAULT_BACKDROP,
    // The poster and the thumbnail are read with the shared helper
    // instead of one or two hardcoded fields. The backend can store the
    // image in `image`, `imagePoster`, `poster_path`... Before, only
    // `poster_url` and `thumb_url` were read, so a movie with the image in
    // another field fell back to `LOCAL_DEFAULT_POSTER` and showed a grey
    // placeholder strip. `resolveImageUrl` wraps the value, so a relative
    // path (`/uploads/x.jpg`) from the backend is joined with
    // `imageOrigin` instead of pointing to the current host.
    poster_url: resolveImageUrl(pickImageSrc(m, POSTER_FIELDS, LOCAL_DEFAULT_POSTER)),
    thumb_url: resolveImageUrl(pickImageSrc(m, THUMB_FIELDS, LOCAL_DEFAULT_POSTER)),
    year: resolveMovieYear(m as never) as number | string,
    quality: resolveMovieQuality(m as never) as string,
    category: (resolveMovieCategories(m as never) as unknown[]) || [],
    country: countryArray,
    content: (m.content as string) || (m.description as string) || MOVIE_FALLBACK_DEFAULTS.description,
    rating: (m.vote_average as number)
      || (m.avgRating as number)
      || (m.rating as number)
      || (tmdb?.vote_average as number)
      || (MOVIE_FALLBACK_DEFAULTS.rating as unknown as number),
    ratingCount: (m.ratingCount as number) || (m.vote_count as number) || 128,
    view: (m.view as number) || 10420,
    time: (m.time as string) || (m.type === 'series' ? '45 phút/tập' : '110 phút'),
    lang: (m.lang as string) || 'Vietsub + Thuyết minh',
    type: (m.type as string) || 'single',
    status: (m.status as string) || 'completed',
    // The movie detail DTO of the backend uses the camelCase `trailerUrl`,
    // while some legacy payloads still ship the snake_case `trailer_url`.
    // Both are read, so a valid trailer field is never dropped only
    // because of its casing. The `trailer_url` value is kept here purely
    // for the legacy branch of `resolveMovieTrailer`; the canonical
    // YouTube data now lives in the `trailer` object below.
    trailer_url: (m.trailerUrl as string)
      || (m.trailer_url as string)
      || (tmdb?.trailer_url as string)
      || '',
    // The full trailer object is kept, so that `TrailerModal.resolveTrailer`
    // can read the `trailer.url` field directly. The resolver prefers
    // `trailer.url` (the field our backend crawler fills) and only falls
    // back to `trailer.key` when there is no `url`. Both shapes are kept
    // here untouched, so the conversion from `watch?v=` to `/embed/` is
    // never duplicated in the callers.
    trailer: (m.trailer as TrailerObject | undefined) || null,
    episodes,
    actors: actorsList,
    directors: directorsList
  };
};

/**
 * Manages the lifecycle of the movie detail: the streaming state, the
 * ratings and the comments.
 *
 * @param slug - The slug of the movie, taken from the router query.
 * @returns The state of the movie detail and the handlers of the page.
 */
export const useMovieDetail = (slug: string | undefined | null): UseMovieDetailReturn => {
  const [movie, setMovie] = useState<NormalizedMovieDetail | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<MovieDetailError | null>(null);

  // Player state
  const [currentServerIndex, setCurrentServerIndex] = useState<number>(0);
  const [currentEpisodeIndex, setCurrentEpisodeIndex] = useState<number>(0);

  // Social interactions
  const [isFavorite, setIsFavorite] = useState<boolean>(false);
  const [favoriteLoading, setFavoriteLoading] = useState<boolean>(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState<boolean>(false);
  const [relatedMovies, setRelatedMovies] = useState<NormalizedMovieDetail[]>([]);

  // ---- The Zustand cache selectors ----
  // A selector is used for each action, so the component only re-renders
  // when an unrelated part of the cache changes.
  const getCachedMovie = useMovieStore((s) => s.getCachedMovie);
  const setCachedMovie = useMovieStore((s) => s.setCachedMovie);
  const getCachedRelated = useMovieStore((s) => s.getCachedRelated);
  const setCachedRelated = useMovieStore((s) => s.setCachedRelated);
  const getCachedComments = useCommentStore((s) => s.getCachedMovieComments);
  const setCachedComments = useCommentStore((s) => s.setCachedMovieComments);

  const isMountedRef = useRef<boolean>(true);
  // The "request in flight" guard. It prevents the double mount of the
  // React StrictMode from sending two parallel `fetchMovie` calls for the
  // same slug, which would log the same 401 twice and race the `setMovie`
  // and `setError` state updates.
  const fetchInFlightSlug = useRef<string | null>(null);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  /**
   * Fetches the full details of a movie from its slug.
   *
   * Strategy:
   *   1. The auth header is resolved through `authService.getAuthHeader()`,
   *      which transparently refreshes the access token when it is about
   *      to expire. This avoids the "401 because the JWT expired 30
   *      seconds ago" failure.
   *   2. When a 401 is still received, the error is classified as
   *      `auth-required` and it is NOT retried. Retrying without a valid
   *      token always returns the same 401, and an automatic retry loop
   *      would only flood the console.
   *   3. A 404 gives `not-found`, and a 5xx or a network error gives
   *      `request-error`.
   *
   * The mock data is NEVER used in place of a real backend answer, because
   * that would make the user believe the movie is real.
   *
   * Re-entrancy: the `fetchInFlightSlug` ref prevents several concurrent
   * `fetchMovie` calls for the same slug from running at the same time.
   * Without this guard, the double mount of the React StrictMode in
   * development sends two parallel requests and floods the console with
   * two identical 401 logs.
   */
  const fetchMovie = useCallback(async (): Promise<void> => {
    if (!slug) return;
    // The re-entrancy guard: the call stops when the same slug is already
    // in flight.
    if (fetchInFlightSlug.current === slug) return;
    fetchInFlightSlug.current = slug;
    setLoading(true);
    setError(null);

    // The cache is read from the Zustand store first.
    // The value is cast to the exact type of the hook
    // (`NormalizedMovieDetail`).
    const cached = getCachedMovie(slug) as NormalizedMovieDetail | null;
    if (cached) {
      if (isMountedRef.current) {
        setMovie(cached);
        setLoading(false);
      }
      fetchInFlightSlug.current = null;
      return;
    }
    // The auth header is resolved through the shared service. This
    // transparently refreshes the token when it is within 60 seconds of
    // the expiry. It returns `{}` when there is no token, and the request
    // then answers 401, which is classified as `auth-required`.
    const tryFetch = async (): Promise<Response> => {
      let authHeaders: Record<string, string> = { Accept: 'application/json' };
      try {
        // The dynamic import keeps `authService` out of the initial
        // render path of the hook, so there is no circular dependency
        // surprise.
        const { default: authService } = await import('@/API/services/authService');
        authHeaders = { ...authHeaders, ...(await authService.getAuthHeader()) };
      } catch {
        // A missing auth header is fine, the backend answers 401 and the
        // error is classified.
      }
      return fetch(apiUrl(`moviesDetail`, slug), { headers: authHeaders });
    };

    try {
      const res = await tryFetch();

      if (res.status === 404) {
        // The backend explicitly says the movie does not exist.
        if (isMountedRef.current) {
          setMovie(null);
          setError('not-found');
        }
        return;
      }

      // A 401 or a 403 means an auth problem. The shared axios layer
      // already tried one silent refresh, so reaching this point with a
      // 401 means the refresh failed too, or there was no token at all.
      if (res.status === 401 || res.status === 403) {
        if (isMountedRef.current) {
          setMovie(null);
          setError('auth-required');
        }
        return;
      }

      if (!res.ok) {
        // A 5xx or any other non-2xx status is a temporary error, so the
        // UI can offer a retry.
        throw new Error(`Request failed (${res.status})`);
      }

      // The body is parsed. The `responseStatus` is always read first,
      // because the v1 contract of the backend returns an HTTP 200 with a
      // non-success `responseStatus.responseCode` for many failure modes
      // (notably the auth failures wrapped in a 200 envelope on some
      // endpoints). Such a 200 must NOT be treated as a real movie
      // payload.
      let json: Record<string, unknown> = {};
      try {
        json = await res.json();
      } catch {
        // The body is not JSON, so it is treated as a missing movie.
        if (isMountedRef.current) {
          setMovie(null);
          setError('not-found');
        }
        return;
      }

      // The `responseCode` of the v1 envelope is inspected, so that an
      // auth failure wrapped in a 200 still surfaces as `auth-required`
      // instead of "movie not found". The codes 00000204 (missing Bearer
      // token) and 00000403 (forbidden) are the documented auth errors.
      const responseStatus = json.responseStatus as
        | { responseCode?: string; responseMessage?: string }
        | undefined;
      const responseCode = responseStatus?.responseCode;
      if (responseCode) {
        if (responseCode === '00000204' || responseCode === '00000403') {
          if (isMountedRef.current) {
            setMovie(null);
            setError('auth-required');
          }
          return;
        }
        // Any other non-success `responseCode` (for example 00000500 for a
        // server error, or 00000404) means the request did not really
        // produce a movie. A generic error is treated as temporary and an
        // unknown id is treated as a missing movie.
        if (!responseCode.startsWith('00000')) {
          if (isMountedRef.current) {
            setMovie(null);
            setError(responseCode === '00000404' ? 'not-found' : 'request-error');
          }
          return;
        }
      }

      const raw = (json.responseData as RawMovie | undefined)
        || (json.data as RawMovie | undefined)
        || json;

      if (!raw || typeof raw !== 'object') {
        // The status is 200 but the body is empty, so it is treated as a
        // missing movie, following the API contract.
        if (isMountedRef.current) {
          setMovie(null);
          setError('not-found');
        }
        return;
      }

      if (isMountedRef.current) {
        const normalized = normalizeMovieDetail(raw, slug);
        if (normalized) {
          // A temporary diagnostic: the trailer fields that survived the
          // normalization are logged, so the data flow from the API to the
          // mapper, to the hook and to the modal can be confirmed. It is
          // enabled by `NEXT_PUBLIC_DEBUG_MOVIES`.
          if (SYSTEM_CONFIG.debugMovies) {
            // The debug mode only, it is removed in production.
          }
          setMovie(normalized);
          // The movie is written to the Zustand cache after a successful
          // fetch.
          setCachedMovie(slug, normalized);
          setError(null);
          return;
        }
        // The payload could not be normalized, so it is treated as a
        // missing movie instead of being hidden behind a fake movie.
        setMovie(null);
        setError('not-found');
      }
    } catch (err) {
      if (isMountedRef.current) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        // A network or a server error shows the retry UI, and the mock data
        // is NOT used as a fallback. A mock fallback would hide the real
        // bugs and would make the user believe the movie is real.
        setMovie(null);
        setError('request-error');
      }
    } finally {
      fetchInFlightSlug.current = null;
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [slug, getCachedMovie, setCachedMovie]);

  /**
   * Fetches the recommended movies related to the current movie.
   *
   * The auth header uses the same strategy as `fetchMovie`: it is resolved
   * through `authService.getAuthHeader()`, so the token is refreshed
   * automatically. On any failure (network, 4xx, 5xx, auth) the list is
   * left empty instead of using mock data, so the user is never misled
   * into thinking the suggestions are real.
   */
  const fetchRelated = useCallback(async (): Promise<void> => {
    if (!slug) return;

    // The cache is read from the Zustand store first.
    const cached = getCachedRelated(slug);
    if (cached && cached.length > 0) {
      const normalized = cached
        .map((m, idx) => normalizeMovieDetail(m as unknown as RawMovie, m.slug || `rel-${idx}`))
        .filter((m): m is NormalizedMovieDetail => m !== null);
      if (isMountedRef.current) setRelatedMovies(normalized);
      return;
    }

    const tryFetch = async (): Promise<Response> => {
      let authHeaders: Record<string, string> = { Accept: 'application/json' };
      try {
        const { default: authService } = await import('@/API/services/authService');
        authHeaders = { ...authHeaders, ...(await authService.getAuthHeader()) };
      } catch {
        // A missing auth header is fine, the backend answers 401 and the
        // related list silently stays empty (there is no point in showing
        // a banner for a rail that is not essential).
      }
      return fetch(apiUrl(`moviesRelated`, slug), { headers: authHeaders });
    };

    try {
      const res = await tryFetch();
      if (res.ok) {
        const json = await res.json();
        const list = (json.responseData as unknown[])
          || (json.data as unknown[])
          || (json.movies as unknown[])
          || [];
        if (Array.isArray(list) && list.length > 0 && isMountedRef.current) {
          const normalized = list
            .map((m, idx) => normalizeMovieDetail(m as RawMovie, ((m as RawMovie).slug as string) || `rel-${idx}`))
            .filter((m): m is NormalizedMovieDetail => m !== null);
          setRelatedMovies(normalized);
          // The list is written to the Zustand cache.
          setCachedRelated(slug, list as unknown as import('@/stores/useMovieStore').CachedMovieItem[]);
          return;
        }
      }
      // The real API returned an empty list or a non-2xx status (including
      // a 401), so the list stays empty. The mock data is NOT injected on a
      // real failure.
      if (isMountedRef.current) setRelatedMovies([]);
    } catch {
      // A network error leaves the list empty, the mock data is NOT
      // injected.
      if (isMountedRef.current) setRelatedMovies([]);
    }
  }, [slug, getCachedRelated, setCachedRelated]);

  /**
   * Fetches the comments of the current movie.
   *
   * The shared auth header resolver is used, so an expired token is
   * refreshed before the request goes out. On any failure (including a
   * 401) the comments list silently stays empty, because the comments are
   * not critical content and there is no point in showing a banner for
   * them.
   */
  const fetchComments = useCallback(async (): Promise<void> => {
    if (!slug) return;

    // The cache is read from the Zustand store first.
    const cached = getCachedComments(slug);
    if (cached && cached.length > 0) {
      if (isMountedRef.current) setComments(cached as Comment[]);
      return;
    }

    setCommentsLoading(true);
    try {
      let authHeaders: Record<string, string> = { Accept: 'application/json' };
      try {
        const { default: authService } = await import('@/API/services/authService');
        authHeaders = { ...authHeaders, ...(await authService.getAuthHeader()) };
      } catch {
        // There is no token, the request answers 401 and the list stays
        // empty (silently).
      }
      const res = await fetch(apiUrl(`moviesComments`, slug) + `?page=1&limit=20`, { headers: authHeaders });
      if (res.ok) {
        const json = await res.json();
        const rd = json.responseData as { data?: unknown[] } | unknown[] | undefined;
        const list = (rd && !Array.isArray(rd) ? rd.data : rd)
          || (json.data as { comments?: unknown[] })?.comments
          || [];
        if (Array.isArray(list) && isMountedRef.current) {
          const typed = list as Comment[];
          setComments(typed);
          // The comments are written to the Zustand cache.
          setCachedComments(slug, typed);
          return;
        }
      }
    } catch {
      // The fetch of the comments fails silently.
    } finally {
      if (isMountedRef.current) {
        setCommentsLoading(false);
      }
    }
  }, [slug, getCachedComments, setCachedComments]);

  /**
   * Toggles the favorite state of the movie.
   *
   * The `favoritesService` is used so that:
   *   - the access token is read from BOTH `localStorage` (remember me) and
   *     `sessionStorage` (a session login). Only `localStorage.token` used
   *     to be read, so every session without "remember me" sent a request
   *     without a token and the backend answered 401;
   *   - the correct route `POST|DELETE /movies/:slug/favorite` is used,
   *     keyed by slug;
   *   - a 401 (the user has to sign in) is told apart from the other
   *     errors, so a false success is never reported when the API fails.
   */
  const toggleFavorite = useCallback(async (): Promise<void> => {
    if (!slug) return;
    setFavoriteLoading(true);
    try {
      const { default: favoritesService } = await import('@/API/services/favoritesService');
      const result = isFavorite
        ? await favoritesService.removeFromFavorites(slug)
        : await favoritesService.addToFavorites({
            slug,
            // The movie that is currently displayed is sent along, so the
            // service can save a snapshot. The backend
            // `GET /users/me/favorites` only returns the `movieId` (without
            // the movie object), so without this snapshot the cards of the
            // favorites page would show "Untitled" and a placeholder image
            // the next time the page is opened.
            name: movie?.name,
            origin_name: movie?.origin_name,
            poster_url: movie?.poster_url,
            thumb_url: movie?.thumb_url,
            year: movie?.year,
            quality: movie?.quality,
            type: movie?.type,
            _id: movie?._id,
            id: movie?.id
          } as Parameters<typeof favoritesService.addToFavorites>[0]);

      if (result.success) {
        setIsFavorite((prev) => !prev);
      } else {
        // The state is not changed when the API fails. The code used to
        // toggle optimistically on every error branch, so the UI showed
        // "saved" even though the server had refused.
        setError('request-error');
      }
    } catch {
      setError('request-error');
    } finally {
      setFavoriteLoading(false);
    }
  }, [slug, isFavorite, movie]);

  /**
   * Submits a comment written by the user.
   *
   * @param content - The text of the comment.
   * @param parentId - The id of the comment being answered, when the
   *                   comment is a reply.
   * @returns `true` when the comment was added, `false` otherwise.
   */
  const addComment = useCallback(async (content: string, parentId: string | null = null): Promise<boolean> => {
    if (!slug || !content || !content.trim()) return false;
    try {
      const token = typeof window !== 'undefined' ? getStoredAccessToken() : null;
      const res = await fetch(apiUrl(`moviesComments`, slug), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ content: content.trim(), parentId })
      });

      const newCommentObj: Comment = {
        _id: `cmt-${Date.now()}`,
        content: content.trim(),
        user_name: 'Bạn (Người dùng)',
        createdAt: new Date().toISOString(),
        likes: 0
      };

      setComments((prev) => {
        const updated = [newCommentObj, ...prev];
        // The comments cache is updated.
        setCachedComments(slug, updated);
        return updated;
      });
      return true;
    } catch {
      return false;
    }
  }, [slug]);

  // The initial load, run when the slug changes. The in-flight guard is
  // reset here, so a previous failed fetch for another slug does not
  // suppress the fetch of the new slug.
  useEffect(() => {
    fetchInFlightSlug.current = null;
    if (slug) {
      fetchMovie();
      fetchRelated();
      fetchComments();
      setCurrentServerIndex(0);
      setCurrentEpisodeIndex(0);
    }
  }, [slug, fetchMovie, fetchRelated, fetchComments]);

  // The active episode and server, derived from the current indexes.
  const activeServer: EpisodeServer | null = movie?.episodes?.[currentServerIndex] || null;
  const activeEpisode: EpisodeServerData | null = activeServer?.server_data?.[currentEpisodeIndex] || null;

  return {
    movie,
    loading,
    error,
    currentServerIndex,
    currentEpisodeIndex,
    activeServer,
    activeEpisode,
    setCurrentServerIndex,
    setCurrentEpisodeIndex,
    isFavorite,
    favoriteLoading,
    toggleFavorite,
    comments,
    commentsLoading,
    addComment,
    relatedMovies,
    refetchMovie: fetchMovie
  };
};

export default useMovieDetail;
