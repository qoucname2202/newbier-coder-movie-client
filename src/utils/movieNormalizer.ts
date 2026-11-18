/**
 * movieNormalizer.ts
 *
 * Defensive data conversion and normalization for the movie entity.
 * It guarantees a consistent object shape, so the UI layout never breaks.
 */

import {
  LOCAL_DEFAULT_BACKDROP,
  LOCAL_DEFAULT_POSTER,
  MOVIE_FALLBACK_DEFAULTS
} from '@/config/movieFallbackConfig';
import { SYSTEM_CONFIG } from '@/config/systemConfig';
import { formatYear } from '@/utils/taxonomy';

/** A normalized category item. */
export interface CategoryItem {
  name: string;
  slug: string;
}

/** A normalized actor item. */
export interface ActorItem {
  name: string;
  role: string;
  slug: string;
  avatar_url?: string;
  [key: string]: unknown;
}

/** A normalized director item. */
export interface DirectorItem {
  name: string;
  role: string;
  slug: string;
  [key: string]: unknown;
}

/** The normalized movie entity. It inherits the raw server shape. */
export interface NormalizedHeroMovie {
  [key: string]: unknown;
  _id: string;
  name: string;
  origin_name: string;
  backdrop_url: string;
  poster_url: string;
  thumb_url: string;
  year: string | number;
  quality: string;
  category: CategoryItem[];
  content: string;
  rating: string | number;
  time: string;
  lang: string;
}

/**
 * Resolves a possibly relative image URL from the backend into a fully
 * qualified URL the browser can load.
 *
 * @param url - The raw URL taken from the API.
 * @returns The full URL, or the original input when it cannot be joined safely.
 */
export const resolveImageUrl = (url: string | null | undefined): string => {
  if (!url || typeof url !== 'string') return '';
  const cleaned = url.trim();
  if (cleaned === '') return '';

  // Already absolute (http, https, data, blob).
  if (/^(https?:|data:|blob:)/i.test(cleaned)) return cleaned;

  // Protocol relative URL.
  if (cleaned.startsWith('//')) {
    const proto = (typeof window !== 'undefined' && window.location?.protocol) || 'https:';
    return `${proto}${cleaned}`;
  }

  // Host relative URL: joined with the configured image origin.
  if (cleaned.startsWith('/')) {
    const origin = SYSTEM_CONFIG.imageOrigin || '';
    if (origin) return `${origin}${cleaned}`;
    return cleaned;
  }

  // Unknown shape: returned as is, so the Network panel shows a clear error.
  return cleaned;
};

/**
 * Safely resolves the best available backdrop or poster URL for a movie.
 * The order of preference is: backdrop_url -> poster_url -> thumb_url ->
 * the default placeholder SVG.
 *
 * @param movie - The raw movie object from the backend API.
 * @param fallbackIndex - Kept for signature compatibility.
 * @returns The validated image URL.
 */
export const resolveMovieBackdrop = (
  movie?: Record<string, unknown> | null,
  fallbackIndex: number = 0
): string => {
  if (!movie) return LOCAL_DEFAULT_BACKDROP;

  const candidates = [
    movie.backdrop_url,
    movie.backdrop,
    movie.backdropUrl,
    movie.image_backdrop,
    movie.imageBackdrop,
    movie.poster_url,
    movie.poster,
    movie.posterUrl,
    movie.thumb_url,
    movie.thumb,
    movie.thumbUrl,
    movie.image,
    movie.imageUrl
  ];
  for (const candidate of candidates) {
    const resolved = resolveImageUrl(candidate as string | null | undefined);
    if (resolved) return resolved;
  }

  // The explicit cast keeps fallbackIndex in use and avoids an "unused"
  // warning.
  void fallbackIndex;
  return LOCAL_DEFAULT_BACKDROP;
};

/**
 * Safely resolves the subtitle, also called the original title.
 * It prevents the layout from jumping when the server has no `origin_name`.
 *
 * @param movie - The movie object.
 * @returns The subtitle text, or a non-breaking space when there is none.
 */
export const resolveMovieSubTitle = (movie?: Record<string, unknown> | null): string => {
  if (!movie) return '\u00A0';

  if (movie.origin_name && typeof movie.origin_name === 'string' && movie.origin_name.trim() !== '') {
    return movie.origin_name.trim();
  }

  return (movie.name as string) || '\u00A0';
};

/**
 * Safely resolves the movie categories.
 * When the backend returns nothing, an info badge is generated from the
 * type and the language.
 *
 * @param movie - The movie object.
 * @returns The list of category items.
 */
export const resolveMovieCategories = (movie?: Record<string, unknown> | null): CategoryItem[] => {
  if (movie?.category && Array.isArray(movie.category) && movie.category.length > 0) {
    return movie.category as CategoryItem[];
  }

  const synthesized: CategoryItem[] = [];

  if (movie?.type === 'series') {
    synthesized.push({ name: 'Phim Bộ Đặc Sắc', slug: 'phim-bo' });
  } else {
    synthesized.push({ name: 'Phim Lẻ Chiếu Rạp', slug: 'phim-le' });
  }

  if (movie?.lang && typeof movie.lang === 'string') {
    synthesized.push({ name: movie.lang, slug: 'ngon-ngu' });
  } else {
    synthesized.push({ name: 'Thịnh Hành', slug: 'thinh-hanh' });
  }

  return synthesized;
};

/**
 * Safely resolves the release year of a movie.
 *
 * @param movie - The movie object.
 * @returns The release year.
 */
export const resolveMovieYear = (movie?: Record<string, unknown> | null): string | number => {
  if (!movie?.year) return MOVIE_FALLBACK_DEFAULTS.year;
  return formatYear(movie.year, MOVIE_FALLBACK_DEFAULTS.year);
};

/**
 * Safely resolves the video quality label of a movie.
 *
 * @param movie - The movie object.
 * @returns The normalized quality label.
 */
export const resolveMovieQuality = (movie?: Record<string, unknown> | null): string => {
  if (movie?.quality && typeof movie.quality === 'string' && movie.quality.trim() !== '') {
    return movie.quality.trim() === '4K' ? '4K Ultra HD' : movie.quality.trim();
  }
  return MOVIE_FALLBACK_DEFAULTS.quality;
};

/**
 * High level normalization for the Hero Spotlight movies.
 * It merges the raw server data with safe fallbacks and produces a fully
 * resilient movie schema.
 *
 * @param rawMovie - The raw movie object from the backend API.
 * @param index - The index of the carousel slide.
 * @returns The normalized movie, or null when the input is empty.
 */
export const normalizeHeroMovie = (
  rawMovie?: Record<string, unknown> | null,
  index: number = 0
): NormalizedHeroMovie | null => {
  if (!rawMovie) return null;

  const posterCandidates = [
    rawMovie.poster_url,
    rawMovie.poster,
    rawMovie.posterUrl,
    rawMovie.image
  ];
  const thumbCandidates = [
    rawMovie.thumb_url,
    rawMovie.thumb,
    rawMovie.thumbUrl,
    rawMovie.thumbnail
  ];
  const backdropCandidates = [
    rawMovie.backdrop_url,
    rawMovie.backdrop,
    rawMovie.backdropUrl,
    rawMovie.cover
  ];

  /**
   * Returns the first candidate that resolves into a usable URL.
   *
   * @param candidates - The candidate values, in priority order.
   * @returns The first usable URL, or an empty string.
   */
  const resolveFirstUsable = (candidates: unknown[]): string => {
    for (const c of candidates) {
      const r = resolveImageUrl(c as string | null | undefined);
      if (r) return r;
    }
    return '';
  };

  const resolvedBackdrop = resolveFirstUsable(backdropCandidates)
    || resolveMovieBackdrop(rawMovie, index);
  const resolvedPoster = resolveFirstUsable(posterCandidates)
    || resolveFirstUsable(thumbCandidates)
    || LOCAL_DEFAULT_POSTER;
  const resolvedThumb = resolveFirstUsable(thumbCandidates)
    || resolveFirstUsable(posterCandidates)
    || resolvedPoster
    || LOCAL_DEFAULT_POSTER;

  return {
    ...rawMovie,
    _id: (rawMovie._id as string) || (rawMovie.id as string) || `hero-${index}`,
    name: (rawMovie.name as string) || 'Phim Đang Cập Nhật',
    origin_name: resolveMovieSubTitle(rawMovie),
    backdrop_url: resolvedBackdrop || LOCAL_DEFAULT_BACKDROP,
    poster_url: resolvedPoster,
    thumb_url: resolvedThumb,
    year: resolveMovieYear(rawMovie),
    quality: resolveMovieQuality(rawMovie),
    category: resolveMovieCategories(rawMovie),
    content: (rawMovie.content as string) || (rawMovie.description as string) || MOVIE_FALLBACK_DEFAULTS.description,
    rating: (rawMovie.vote_average as string | number)
      || (rawMovie.rating as string | number)
      || ((rawMovie.tmdb as { vote_average?: string | number } | undefined)?.vote_average)
      || MOVIE_FALLBACK_DEFAULTS.rating,
    time: (rawMovie.time as string) || (rawMovie.type === 'series' ? '45 phút/tập' : '110 phút'),
    lang: (rawMovie.lang as string) || 'Vietsub'
  };
};

/**
 * Safely resolves the actors array with rich profiles.
 *
 * @param movie - The movie object.
 * @returns The list of actor objects: { name, role, slug, avatar_url }.
 */
export const resolveMovieActors = (movie?: Record<string, unknown> | null): ActorItem[] => {
  if (!movie) return [];

  if (Array.isArray(movie.actor) && movie.actor.length > 0) {
    return (movie.actor as unknown[]).map((a, i) => {
      if (typeof a === 'string') {
        return { name: a.trim(), role: 'Diễn viên', slug: `actor-${i}` } satisfies ActorItem;
      }
      const obj = a as Record<string, unknown>;
      return {
        ...obj,
        name: (obj.name as string) || '',
        role: (obj.role as string) || 'Diễn viên',
        slug: (obj.slug as string) || `actor-${i}`
      } satisfies ActorItem;
    });
  }

  if (typeof movie.actor === 'string' && movie.actor.trim() !== '') {
    return movie.actor.split(',').map((name, i) => ({
      name: name.trim(),
      role: 'Diễn viên',
      slug: `actor-${i}`
    }));
  }

  return [];
};

/**
 * Safely resolves the directors array.
 *
 * @param movie - The movie object.
 * @returns The list of director objects.
 */
export const resolveMovieDirectors = (movie?: Record<string, unknown> | null): DirectorItem[] => {
  if (!movie) return [];

  if (Array.isArray(movie.director) && movie.director.length > 0) {
    return (movie.director as unknown[])
      .map((d, i) => {
        if (typeof d === 'string') {
          return { name: d.trim(), role: 'Đạo diễn', slug: `director-${i}` } satisfies DirectorItem;
        }
        const obj = d as Record<string, unknown>;
        return {
          ...obj,
          name: (obj.name as string) || '',
          role: (obj.role as string) || 'Đạo diễn',
          slug: (obj.slug as string) || `director-${i}`
        } satisfies DirectorItem;
      })
      .filter((d) => d.name);
  }

  if (typeof movie.director === 'string' && movie.director.trim() !== '') {
    return movie.director
      .split(',')
      .map((name, i) => ({
        name: name.trim(),
        role: 'Đạo diễn',
        slug: `director-${i}`
      }))
      .filter((d) => d.name);
  }

  return [];
};
