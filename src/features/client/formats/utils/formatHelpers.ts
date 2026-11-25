/**
 * @file formatHelpers.ts
 * @description Specialized format and presentation utilities for format-specific movie views.
 */

/**
 * Formats duration into a concise, user-friendly string (e.g. "157 phút" or "2h37").
 *
 * @param duration - The raw duration (number in minutes or string like "157 phút", "110", "2h15m").
 * @param fallback - The fallback label when duration is unavailable.
 * @returns Formatted duration string.
 */
export function formatDuration(duration?: string | number | null, fallback = ''): string {
  // If fallback contains only dots or invalid tokens, neutralize it
  const cleanFallback = String(fallback || '').replace(/[.\s]/g, '') ? fallback : '';

  if (duration === null || duration === undefined || duration === '') {
    return cleanFallback;
  }

  // If already a number
  if (typeof duration === 'number') {
    if (duration <= 0) return cleanFallback;
    const hours = Math.floor(duration / 60);
    const minutes = duration % 60;
    if (hours > 0) {
      return minutes > 0 ? `${hours}h${minutes < 10 ? `0${minutes}` : minutes}` : `${hours}h`;
    }
    return `${minutes} phút`;
  }

  const str = String(duration).trim();
  if (!str || str === '...' || str === '..' || str === '.' || str.toLowerCase() === 'null') {
    return cleanFallback;
  }

  // Extract all digit groups
  const digitsMatch = str.match(/(\d+)/g);
  if (digitsMatch && digitsMatch.length > 0) {
    // If it looks like "2h30" or "2 giờ 30 phút"
    if (digitsMatch.length >= 2 && (str.includes('h') || str.includes('giờ'))) {
      const h = parseInt(digitsMatch[0], 10);
      const m = parseInt(digitsMatch[1], 10);
      return `${h}h${m < 10 ? `0${m}` : m}`;
    }

    // Single number of minutes, e.g. "157" or "157 phút" or "157 min"
    const totalMinutes = parseInt(digitsMatch[0], 10);
    if (totalMinutes > 0) {
      if (totalMinutes >= 60) {
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;
        return minutes > 0 ? `${hours}h${minutes < 10 ? `0${minutes}` : minutes}` : `${hours}h`;
      }
      return `${totalMinutes} phút`;
    }
  }

  // If string contains only dots or no usable text, return cleanFallback
  if (str.replace(/[.\s]/g, '').length === 0) {
    return cleanFallback;
  }

  return str;
}

export type QualityTier = '4k' | 'fhd' | 'hd' | 'cam' | 'trailer' | 'standard';

/**
 * Detects the quality tier of a movie to apply appropriate visual styling.
 */
export function getQualityTier(quality?: string | null): QualityTier {
  if (!quality) return 'standard';
  const q = quality.trim().toLowerCase();
  if (q.includes('4k') || q.includes('uhd')) return '4k';
  if (q.includes('fhd') || q.includes('1080')) return 'fhd';
  if (q.includes('cam') || q.includes('ts') || q.includes('tc')) return 'cam';
  if (q.includes('trailer') || q.includes('sample')) return 'trailer';
  if (q.includes('hd') || q.includes('720')) return 'hd';
  return 'standard';
}

export type LanguageType = 'vietsub' | 'thuyet-minh' | 'long-tieng' | 'raw';

/**
 * Normalizes language strings into standardized badges.
 */
export function getLanguageType(lang?: string | null): LanguageType {
  if (!lang) return 'vietsub';
  const l = lang.trim().toLowerCase();
  if (l.includes('thuyết minh') || l.includes('thuyet minh') || l.includes('thuyet-minh')) {
    return 'thuyet-minh';
  }
  if (l.includes('lồng tiếng') || l.includes('long tieng') || l.includes('dub')) {
    return 'long-tieng';
  }
  if (l.includes('raw') || l.includes('gốc')) {
    return 'raw';
  }
  return 'vietsub';
}

/**
 * Maps format slugs to user-facing Vietnamese display titles.
 */
export function resolveFormatDisplayName(slug: string): string {
  const s = slug.trim().toLowerCase();
  switch (s) {
    case 'phim-le':
    case 'single':
      return 'Phim Lẻ';
    case 'phim-bo':
    case 'series':
      return 'Phim Bộ';
    case 'tv-shows':
    case 'tvshows':
      return 'TV Shows';
    case 'hoat-hinh':
    case 'anime':
      return 'Hoạt Hình & Anime';
    default:
      return s.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  }
}
