/**
 * favoritesService.ts
 *
 * Favorites API client - load, add and remove favorite movies.
 *
 * ENDPOINT MAP (verified against production on 2026-10-27)
 * The old route `GET /favorites` does NOT exist. The backend answers
 * `404 {"responseCode":"00000202","responseMessage":"Route not found"}`.
 * The real routes (without a token they all answer `401 Missing Bearer token`,
 * which proves the route exists and only the authentication is missing):
 *
 *   GET    /api/v1/users/me/favorites     -> the favorites of the current user
 *   POST   /api/v1/movies/:slug/favorite  -> adds a movie to the favorites
 *   DELETE /api/v1/movies/:slug/favorite  -> removes a movie from the favorites
 *
 * Every request sends `Authorization: Bearer <access_token>`. The token is
 * read from localStorage (remember me) or from sessionStorage (session
 * login) - see `axiosConfig.readAuthToken`.
 *
 * RESPONSE ENVELOPE
 * The backend uses the v1 envelope of Fastify Enterprise:
 *   { requestTrace, responseDateTime, responseStatus: { responseCode, responseMessage }, responseData }
 * The payload sits in `responseData` and NOT in `data`. The success code is
 * `000000`. That is why `unwrapFavorites` has to dig into `responseData`
 * before it looks for the array.
 */

import axiosInstance, { type AxiosError } from '@/API/config/axiosConfig';
import { endpoints } from '@/config/API';
import { pickMovieImage } from '@/utils/imageSource';
import { forgetMovie, recallMovie, rememberMovie } from '@/utils/movieSnapshotCache';

// ============================================================
// TYPES
// ============================================================

/** A favorite movie, in the normalized shape the UI uses. */
export interface FavoriteMovie {
  /** A stable key for React rendering. It falls back to the slug when the API does not return an id. */
  id: string;
  title: string;
  original_title: string;
  slug: string;
  thumbnail: string;
  year: number | string;
  quality: string;
  rating: number;
  type: string;
  dateAdded: string;
  /**
   * Internal flag: `false` means the favorite row only holds a reference to
   * the movie and has no title or image yet. The UI relies on it to know
   * whether a card is still missing data.
   */
  _hasDetails?: boolean;
  /** The original movie key (`movieId`), used when the backend only returns a reference. */
  _movieRef?: string;
  [key: string]: unknown;
}

/** The raw payload returned by the backend (loose shape). */
export interface FavoriteMovieInput {
  id?: string;
  _id?: string;
  movieId?: string;
  movie_id?: string;
  slug?: string;
  title?: string;
  name?: string;
  origin_name?: string;
  original_title?: string;
  originalName?: string;
  thumb_url?: string;
  thumbUrl?: string;
  poster_url?: string;
  posterUrl?: string;
  thumbnail?: string;
  year?: number | string;
  quality?: string;
  rating?: number;
  vote_average?: number;
  type?: string;
  createdAt?: string;
  updatedAt?: string;
  addedAt?: string;
  [key: string]: unknown;
}

/** The result of an add or remove operation. */
export interface FavoriteOpResult {
  success: boolean;
  message: string;
  alreadyExists?: boolean;
}

/** The error classification, so the UI can show the right state. */
export type FavoritesErrorCode =
  | 'unauthenticated'   // 401 - not signed in, or the token expired
  | 'forbidden'         // 403 - not enough permissions
  | 'not-found'         // 404 - the route does not exist
  | 'server'            // 5xx - a server error
  | 'network'           // the server could not be reached
  | 'parse'             // the response is not JSON
  | 'unknown';

/** A classified error, so the UI does not have to guess. */
export class FavoritesServiceError extends Error {
  readonly code: FavoritesErrorCode;
  readonly status?: number;

  constructor(message: string, code: FavoritesErrorCode, status?: number) {
    super(message);
    this.name = 'FavoritesServiceError';
    this.code = code;
    this.status = status;
  }
}

// ============================================================
// CONSTANTS
// ============================================================

/** The success code of the v1 envelope (see `authConfig.api.successCode`). */
const SUCCESS_CODE = '000000';

/** The keys that can hold the movie array, in priority order. */
const ARRAY_KEYS = [
  'responseData',
  'data',
  'favorites',
  'results',
  'items',
  'movies',
  'list'
] as const;

/** The maximum number of movies hydrated in one call, to avoid a request storm. */
const MAX_HYDRATE = 24;

/** The number of detail requests that run in parallel. */
const HYDRATE_CONCURRENCY = 4;

// ============================================================
// HELPERS
// ============================================================

/** Reads the first string found in a list of keys. */
const readString = (source: Record<string, unknown>, keys: readonly string[]): string => {
  for (const key of keys) {
    const value = source[key];
    if (typeof value === 'string' && value.trim() !== '') return value.trim();
  }
  return '';
};

/** Reads the first number found, cast to a valid number. */
const readNumber = (source: Record<string, unknown>, keys: readonly string[]): number => {
  for (const key of keys) {
    const value = source[key];
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (typeof value === 'string' && value.trim() !== '' && Number.isFinite(Number(value))) {
      return Number(value);
    }
  }
  return 0;
};

/** The success code: exactly `000000` (or only zeros). */
const isSuccessCode = (code: string | undefined): boolean => {
  if (!code) return true;
  if (code === SUCCESS_CODE) return true;
  return /^0+$/.test(code);
};

/**
 * Extracts the movie array from every envelope the backend may return.
 *
 * Supported shapes: a raw array, `{ responseData: [...] }`,
 * `{ responseData: { data: [...] } }`, `{ data: { favorites: [...] } }`,
 * `{ favorites: [...] }`, ...
 *
 * @param value - The payload to unpack.
 * @param depth - The current nesting depth, used to stop the recursion.
 * @returns The list of favorite rows, or an empty array.
 */
const collectArray = (value: unknown, depth: number): FavoriteMovieInput[] => {
  if (depth > 4) return [];
  if (Array.isArray(value)) return value as FavoriteMovieInput[];
  if (!value || typeof value !== 'object') return [];

  const record = value as Record<string, unknown>;

  // The v1 envelope (`responseData`) and the array keys of the current level
  // are preferred.
  for (const key of ARRAY_KEYS) {
    const candidate = record[key];
    if (Array.isArray(candidate)) return candidate as FavoriteMovieInput[];
  }

  // One level deeper: `{ responseData: { data: { items: [...] } } }`
  for (const key of ARRAY_KEYS) {
    const candidate = record[key];
    if (candidate && typeof candidate === 'object' && !Array.isArray(candidate)) {
      const nested = collectArray(candidate, depth + 1);
      if (nested.length > 0) return nested;
    }
  }

  return [];
};

/** Extracts the movie array from any payload. */
const unwrapFavorites = (payload: unknown): FavoriteMovieInput[] => collectArray(payload, 0);

/**
 * Reads the error message inside the v1 envelope.
 *
 * @param payload - The envelope to read.
 * @returns The error message, or null when the envelope reports success.
 */
const readEnvelopeError = (payload: unknown): { message: string } | null => {
  if (!payload || typeof payload !== 'object') return null;
  const envelope = payload as { responseStatus?: { responseCode?: string; responseMessage?: string } };
  const status = envelope.responseStatus;
  if (!status || !status.responseCode) return null;
  if (isSuccessCode(status.responseCode)) return null;
  return { message: status.responseMessage || 'Không thể tải danh sách yêu thích' };
};

/** Converts an HTTP status into a meaningful error code. */
const codeFromStatus = (status?: number): FavoritesErrorCode => {
  if (status === 401) return 'unauthenticated';
  if (status === 403) return 'forbidden';
  if (status === 404) return 'not-found';
  if (status !== undefined && status >= 500) return 'server';
  return 'unknown';
};

/** The message shown for each error code. */
const messageForCode = (code: FavoritesErrorCode, status?: number, fallback?: string): string => {
  switch (code) {
    case 'unauthenticated':
      return 'Bạn cần đăng nhập để xem danh sách yêu thích';
    case 'forbidden':
      return 'Bạn không có quyền xem danh sách yêu thích này';
    case 'not-found':
      return 'Không tìm thấy API danh sách yêu thích trên máy chủ';
    case 'server':
      return `Máy chủ đang gặp sự cố (HTTP ${status ?? 500}). Vui lòng thử lại sau.`;
    case 'network':
      return 'Không thể kết nối tới máy chủ. Vui lòng kiểm tra kết nối mạng rồi thử lại.';
    case 'parse':
      return 'Máy chủ trả về dữ liệu không đúng định dạng JSON';
    default:
      return fallback || 'Không thể tải danh sách yêu thích';
  }
};

/**
 * Finds the real movie object inside a favorite row.
 *
 * WHY THIS EXISTS (the "Untitled" and missing image bug)
 * `GET /users/me/favorites` returns every row in a **join table** shape:
 * ```json
 * { "_id": "665...", "userId": "664...", "movieId": "665f...", "createdAt": "..." }
 * ```
 * The backend has returned two different variants over time:
 *   a) `movieId` is a **populated movie object**: that object is used as is.
 *   b) `movieId` is a **plain id string**: the snapshot has to be looked up,
 *      or `/movies/:slug` has to be called.
 * The mapper used to read the fields at the top level only, so both variants
 * ended up as "Untitled" plus a placeholder poster.
 *
 * @param raw - The raw favorite row.
 * @returns The flattened movie object, the id of the favorite row (so the
 *          right record is deleted) and a `hasDetails` flag that tells the
 *          caller whether the details still have to be fetched.
 */
const resolveMovieObject = (raw: FavoriteMovieInput): {
  movie: Record<string, unknown>;
  rowId: string;
  hasDetails: boolean;
} => {
  const row = raw as Record<string, unknown>;
  const rowId = readString(row, ['_id', 'id']);

  // The keys the backend may use to embed the movie object.
  const NESTED_KEYS = ['movieId', 'movie', 'movieData', 'movieInfo', 'film', 'details'] as const;

  for (const key of NESTED_KEYS) {
    const candidate = row[key];
    if (candidate && typeof candidate === 'object' && !Array.isArray(candidate)) {
      const nested = candidate as Record<string, unknown>;
      // An empty nested object is skipped, so it never maps to a blank card.
      if (Object.keys(nested).length === 0) continue;
      return {
        // `...row` keeps the createdAt of the favorite row, while `...nested`
        // overrides it with the real movie fields (name, slug, posterUrl...).
        movie: { ...row, ...nested },
        rowId,
        hasDetails: true
      };
    }
  }

  // No nested object: check the snapshot saved when the user clicked
  // "Favorite".
  const refId = readString(row, ['movieId', 'movie_id', 'id', '_id']);
  const refSlug = readString(row, ['slug', 'movieSlug', 'movie_slug']);
  const snapshot = recallMovie(refSlug, refId);

  if (snapshot) {
    return {
      movie: {
        ...row,
        _id: snapshot.id,
        slug: snapshot.slug || refSlug,
        name: snapshot.name,
        origin_name: snapshot.origin_name,
        poster_url: snapshot.posterUrl,
        thumb_url: snapshot.thumbUrl,
        year: snapshot.year,
        quality: snapshot.quality,
        type: snapshot.type
      },
      rowId,
      hasDetails: true
    };
  }

  // Only a reference, so the details have to be fetched from the API.
  return {
    movie: { ...row, slug: refSlug, _movieId: refId },
    rowId,
    hasDetails: false
  };
};

/**
 * Normalizes one favorite row into the shape the UI uses.
 *
 * @param raw - The raw row taken from `responseData`.
 * @param index - The position in the array, used as a React key fallback.
 * @returns The favorite movie in the UI shape.
 */
const mapFavorite = (raw: FavoriteMovieInput, index: number): FavoriteMovie => {
  const { movie, rowId, hasDetails } = resolveMovieObject(raw);

  const slug = readString(movie, ['slug', 'movieSlug', 'movie_slug']);

  // `id` is the key of the FAVORITE ROW (it is used to delete it), NOT the
  // id of the movie.
  const id = rowId || readString(movie, ['_id', 'id', 'movieId', 'movie_id']) || slug || `favorite-${index}`;

  const title =
    readString(movie, ['name', 'title', 'movieName', 'movie_name', 'original_title', 'origin_name']) ||
    'Untitled';

  const originalTitle = readString(movie, ['origin_name', 'original_title', 'originalName']);

  // The poster is preferred and the thumb is the fallback. The helper
  // already handles the relative URLs.
  const thumbnail = pickMovieImage(movie, 'poster', '');

  const rating = readNumber(movie, ['rating', 'vote_average', 'avgRating', 'voteAverage']);

  const type = readString(movie, ['type', 'format']) || 'movie';

  const dateAdded =
    readString(movie, ['createdAt', 'created_at', 'updatedAt', 'updated_at', 'addedAt']) ||
    new Date().toISOString();

  return {
    id,
    title,
    original_title: originalTitle,
    slug,
    thumbnail,
    // The year is a number, so sorting by year always gives the right order.
    // 0 means the backend has no year data, and the UI hides the field.
    year: readNumber(movie, ['year', 'releaseYear', 'release_year']),
    quality: readString(movie, ['quality', 'qualityName', 'quality_name']) || 'HD',
    rating,
    type,
    dateAdded,
    // Internal flag: false means the row only holds a reference, so another
    // API call is needed.
    _hasDetails: hasDetails,
    // The original movie key (`movieId`), used to look up the index when
    // there is no slug.
    _movieRef: readString(movie, ['_movieId', 'movieId', 'movie_id']) || undefined
  };
};

/**
 * Checks whether the movie needs another API call to get its details.
 *
 * The decision is based on the `_hasDetails` flag set by `mapFavorite`:
 *   - `false` -> the favorite row only holds a reference (`movieId` is a
 *     string) and there is no snapshot in the cache, so
 *     `/movies/:slug` MUST be called.
 *   - `true`  -> the backend already populated the movie object (or the
 *     cache had it), so there is enough data and no extra request is spent.
 *
 * The `title` and `thumbnail` are checked as a second layer of defense: a
 * populated object that has no image is hydrated too, because a card
 * without an image looks like a broken movie.
 *
 * @param movie - The favorite movie to inspect.
 * @returns true when the details still have to be fetched.
 */
const needsDetail = (movie: FavoriteMovie): boolean => {
  // The row only holds a reference (`_hasDetails === false`), so it ALWAYS
  // has to be hydrated. The condition used to be `Boolean(movie.slug)`, so a
  // row that only had a `movieId` and no slug was dropped right away: it
  // never entered the target list, the id index branch was never reached,
  // and the card kept showing "Untitled" plus a placeholder image. That was
  // exactly the "movie does not show" bug.
  if (movie._hasDetails === false) {
    return Boolean(movie.slug) || Boolean(movie._movieRef);
  }
  const hasTitle = Boolean(movie.title) && movie.title !== 'Untitled';
  const hasImage = Boolean(movie.thumbnail);
  return (Boolean(movie.slug) || Boolean(movie._movieRef)) && (!hasTitle || !hasImage);
};

/**
 * Fetches the details of one movie from `/movies/:slug`.
 *
 * @param slugOrId - The slug or the id of the movie.
 * @returns The movie, or null when the request fails.
 */
const fetchMovieDetail = async (slugOrId: string): Promise<FavoriteMovieInput | null> => {
  try {
    const response = await axiosInstance.get(endpoints.movies.detail(encodeURIComponent(slugOrId)));
    const payload = response.data as Record<string, unknown>;
    const detail = (payload.responseData as FavoriteMovieInput) ||
      (payload.data as FavoriteMovieInput) ||
      null;
    if (!detail || typeof detail !== 'object') return null;
    return { ...detail, slug: detail.slug || slugOrId };
  } catch {
    return null;
  }
};

/** The maximum number of pages scanned when the id → movie index is built. */
const INDEX_MAX_PAGES = 3;
/** The number of movies loaded per page when the index is built. */
const INDEX_PAGE_SIZE = 100;

/** Reads the `_id` or `id` of any movie object. */
const movieKey = (movie: Record<string, unknown>): string[] => {
  const keys: string[] = [];
  for (const key of ['_id', 'id', 'slug', 'movieId', 'movie_id']) {
    const value = movie[key];
    if (typeof value === 'string' && value.trim() !== '') keys.push(value.trim());
  }
  return keys;
};

/**
 * Builds an `id -> movie object` index from the public movie list.
 *
 * WHY THIS IS NEEDED
 * A favorite row may only contain `movieId` as an **ObjectId string** and no
 * `slug` at all. In that case `/movies/:slug` cannot be called (the slug is
 * unknown) and there is no snapshot either. This index allows the reverse
 * lookup from the id to the movie, so the card still shows the right title
 * and image instead of `Untitled`.
 *
 * It only runs when it is really needed (some movies are missing data) and
 * it scans at most `INDEX_MAX_PAGES` pages, so it never creates a request
 * storm.
 *
 * @returns The index, mapping every known key to its movie object.
 */
const buildMovieIndex = async (): Promise<Map<string, Record<string, unknown>>> => {
  const index = new Map<string, Record<string, unknown>>();

  for (let page = 1; page <= INDEX_MAX_PAGES; page += 1) {
    try {
      const response = await axiosInstance.get(endpoints.movies.list(page, INDEX_PAGE_SIZE));
      const payload = response.data as Record<string, unknown>;
      const rows = collectArray(payload, 0);
      if (rows.length === 0) break;

      for (const row of rows) {
        const movie = row as Record<string, unknown>;
        for (const key of movieKey(movie)) {
          if (!index.has(key)) index.set(key, movie);
        }
      }

      // The last page has fewer rows than the page size, so the scan stops
      // here and no extra call is made.
      if (rows.length < INDEX_PAGE_SIZE) break;
    } catch {
      // The index could not be built (401 or a network failure), so it is
      // skipped and the hydration falls back to the slug.
      break;
    }
  }

  return index;
};

/**
 * Fills in the details of the movies the backend only returned as an id or
 * a slug.
 *
 * The strategy has two tiers:
 *   1. A `slug` is available: `/movies/:slug` is called directly. It is
 *      cheap and exact.
 *   2. Only a `movieId` in the ObjectId form is available: the index built
 *      from `/movies` is searched.
 *
 * The calls run in parallel with a fixed limit, so the whole list is never
 * blocked.
 *
 * @param movies - The favorites to hydrate.
 * @returns The favorites, with the details filled in where they were found.
 */
const hydrateMissingDetails = async (movies: FavoriteMovie[]): Promise<FavoriteMovie[]> => {
  const targets = movies
    .map((movie, index) => ({ movie, index }))
    .filter(({ movie }) => needsDetail(movie))
    .slice(0, MAX_HYDRATE);

  if (targets.length === 0) return movies;

  const result = [...movies];

  // Split by what can be looked up: a slug, or only an id.
  const withSlug = targets.filter(({ movie }) => Boolean(movie.slug));
  const idOnly = targets.filter(({ movie }) => !movie.slug);

  // ---- Tier 1: call /movies/:slug ----
  for (let i = 0; i < withSlug.length; i += HYDRATE_CONCURRENCY) {
    const batch = withSlug.slice(i, i + HYDRATE_CONCURRENCY);
    const details = await Promise.all(
      batch.map(({ movie }) => fetchMovieDetail(movie.slug))
    );
    batch.forEach(({ index }, batchIndex) => {
      const detail = details[batchIndex];
      if (!detail) return;
      const mapped = mapFavorite({ ...detail, slug: detail.slug || result[index].slug }, index);
      // The id of the FAVORITE ROW (used to delete it) and the dateAdded are
      // kept unchanged.
      result[index] = {
        ...mapped,
        id: result[index].id,
        dateAdded: result[index].dateAdded,
        _hasDetails: true
      };
    });
  }

  // ---- Tier 2: only a `movieId` (no slug) ----
  if (idOnly.length > 0) {
    // 2a. Try `/movies/:movieId` directly. The backend accepts both the slug
    //     and the ObjectId. It is much cheaper than scanning the whole movie
    //     list to build the index.
    let unresolved: typeof idOnly = [];
    for (let i = 0; i < idOnly.length; i += HYDRATE_CONCURRENCY) {
      const batch = idOnly.slice(i, i + HYDRATE_CONCURRENCY);
      const details = await Promise.all(
        batch.map(({ movie }) => fetchMovieDetail(movie._movieRef || movie.id))
      );
      batch.forEach(({ movie, index: position }, batchIndex) => {
        const detail = details[batchIndex];
        if (!detail) {
          unresolved.push({ movie, index: position });
          return;
        }
        const mapped = mapFavorite({ ...detail }, position);
        result[position] = {
          ...mapped,
          id: movie.id,
          dateAdded: movie.dateAdded,
          _hasDetails: true
        };
      });
    }

    // 2b. Some rows are still unresolved, so the id -> movie index is built
    //     from `/movies`.
    if (unresolved.length > 0) {
      const index = await buildMovieIndex();
      if (index.size > 0) {
        for (const { movie, index: position } of unresolved) {
          const hit =
            (movie._movieRef && index.get(movie._movieRef)) ||
            index.get(movie.id) ||
            (movie.slug ? index.get(movie.slug) : undefined);
          if (!hit) continue;
          const mapped = mapFavorite(hit, position);
          result[position] = {
            ...mapped,
            id: movie.id,
            dateAdded: movie.dateAdded,
            _hasDetails: true
          };
        }
      }
    }
  }

  return result;
};

/**
 * Reads the result of the toggle endpoints (add and remove).
 *
 * @param status - The HTTP status of the response.
 * @param payload - The response body.
 * @returns The result of the operation.
 */
const readToggleResult = (
  status: number,
  payload: unknown
): FavoriteOpResult => {
  const ok = status === 200 || status === 201 || status === 204;
  const envelopeError = readEnvelopeError(payload);
  const data = (payload && typeof payload === 'object' ? payload : {}) as Record<string, unknown>;
  const inner = (data.responseData && typeof data.responseData === 'object'
    ? data.responseData
    : data) as Record<string, unknown>;

  if (!ok || envelopeError) {
    return {
      success: false,
      message: envelopeError?.message || messageForCode(codeFromStatus(status), status),
      alreadyExists: Boolean(inner.exists || inner.alreadyExists)
    };
  }

  return {
    success: data.success !== false,
    message:
      (typeof data.message === 'string' && data.message) ||
      (typeof inner.message === 'string' && inner.message) ||
      'Cập nhật danh sách yêu thích thành công',
    alreadyExists: Boolean(inner.exists || inner.alreadyExists)
  };
};

/** Normalizes an axios error into a `FavoritesServiceError`. */
const toServiceError = (error: unknown): FavoritesServiceError => {
  const axiosError = error as AxiosError<{
    responseStatus?: { responseMessage?: string };
    message?: string;
    error?: string;
  }>;

  if (axiosError?.response) {
    const status = axiosError.response.status;
    const body = axiosError.response.data as
      | { responseStatus?: { responseMessage?: string }; message?: string; error?: string }
      | undefined;
    const serverMessage =
      body?.responseStatus?.responseMessage || body?.message || body?.error;

    // A 5xx without a server message uses the default text for that code.
    const code = codeFromStatus(status);
    const message = code === 'server'
      ? messageForCode('server', status)
      : serverMessage || messageForCode(code, status);

    return new FavoritesServiceError(message, code, status);
  }

  if (axiosError?.code === 'ECONNABORTED') {
    return new FavoritesServiceError(messageForCode('network'), 'network');
  }

  if (axiosError?.request) {
    return new FavoritesServiceError(messageForCode('network'), 'network');
  }

  return new FavoritesServiceError(messageForCode('unknown'), 'unknown');
};

// ============================================================
// SERVICE
// ============================================================

const favoritesService = {
  /**
   * Loads the favorites of the current user.
   *
   * Endpoint: `GET {API}/users/me/favorites`. It needs a Bearer token.
   *
   * A `FavoritesServiceError` is thrown on failure (401, 403, 404, 5xx or a
   * network problem), so the UI can tell "the user has to sign in" apart
   * from "the data could not be loaded".
   *
   * @returns The list of favorite movies, in the UI shape.
   */
  getFavorites: async (page: number = 1, limit: number = 20): Promise<FavoriteMovie[]> => {
    try {
      const response = await axiosInstance.get(endpoints.favorites.getAll(page, limit));
      const payload = response.data;

      const envelopeError = readEnvelopeError(payload);
      if (envelopeError) {
        throw new FavoritesServiceError(
          envelopeError.message,
          'unknown',
          response.status
        );
      }

      const raw = unwrapFavorites(payload);
      if (raw.length === 0) return [];

      const mapped = raw.map(mapFavorite);
      return await hydrateMissingDetails(mapped);
    } catch (error) {
      if (error instanceof FavoritesServiceError) throw error;
      throw toServiceError(error);
    }
  },

  /**
   * Adds a movie to the favorites.
   *
   * The backend toggles by **slug** and not by id, so the caller has to pass
   * the slug.
   *
   * @param movieData - The movie to add. It also holds the title and the
   *                    image used for the local snapshot.
   * @returns The result of the operation.
   */
  addToFavorites: async (movieData: FavoriteMovieInput): Promise<FavoriteOpResult> => {
    const slug = movieData.slug;
    if (!slug) {
      return {
        success: false,
        message: 'Thiếu slug phim, không thể yêu thích',
        alreadyExists: false
      };
    }
    // The snapshot is saved right away, because the caller has the full title
    // and image at this moment. Without it, the next time the favorites page
    // opens the backend only returns the `movieId` (without the movie
    // object), and the card would show "Untitled" plus a placeholder image.
    rememberMovie(movieData as Record<string, unknown>);
    try {
      const response = await axiosInstance.post(endpoints.favorites.add(slug));
      const result = readToggleResult(response.status, response.data);
      if (result.success || result.alreadyExists) {
        if (typeof window !== 'undefined') {
          window.dispatchEvent(
            new CustomEvent('favorites_changed', { detail: { slug, isFavorite: true } })
          );
        }
      }
      return result;
    } catch (error) {
      const serviceError = toServiceError(error);
      return {
        success: false,
        message: serviceError.message,
        alreadyExists: false
      };
    }
  },

  /**
   * Removes a movie from the favorites.
   *
   * The slug is preferred because it matches the toggle route, and the id is
   * used as a fallback.
   *
   * @param movieIdOrSlug - The movie id, used as a fallback when no slug is given.
   * @param slug - The movie slug, used for the request.
   * @returns The result of the operation.
   */
  removeFromFavorites: async (movieIdOrSlug: string, slug?: string): Promise<FavoriteOpResult> => {
    const target = slug || movieIdOrSlug;
    if (!target) {
      return {
        success: false,
        message: 'Thiếu định danh phim, không thể xóa yêu thích'
      };
    }
    try {
      const response = await axiosInstance.delete(endpoints.favorites.remove(target));
      const result = readToggleResult(response.status, response.data);
      // The removal worked, so the snapshot is cleared. This keeps the cache
      // from keeping a movie that is no longer a favorite.
      if (result.success) {
        forgetMovie(target, movieIdOrSlug);
        if (typeof window !== 'undefined') {
          window.dispatchEvent(
            new CustomEvent('favorites_changed', { detail: { slug: target, isFavorite: false } })
          );
        }
      }
      return result;
    } catch (error) {
      const serviceError = toServiceError(error);
      return {
        success: false,
        message: serviceError.message
      };
    }
  },

  /**
   * Tells whether a movie is already a favorite.
   *
   * The list is the only source of truth (the backend has no `/check` route),
   * so the list is loaded and the slug is compared.
   *
   * @param movieSlug - The slug of the movie to look for.
   * @returns `true` when the movie is a favorite, `false` otherwise.
   */
  checkFavoriteStatus: async (movieSlug: string): Promise<boolean> => {
    if (!movieSlug) return false;
    try {
      const list = await favoritesService.getFavorites();
      return list.some((item) => item.slug === movieSlug);
    } catch {
      return false;
    }
  }
};

export default favoritesService;
