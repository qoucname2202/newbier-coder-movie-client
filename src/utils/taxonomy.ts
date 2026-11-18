/**
 * @file taxonomy.ts
 * @description Safe utilities for extracting and formatting taxonomy labels
 * (categories, genres, countries) from heterogeneous API payloads.
 *
 * In movie APIs (KKPhim, Ophim, TMDB, custom backend), taxonomy entries can arrive as:
 * - Simple strings: `['Hành Động', 'Viễn Tưởng']`
 * - Taxonomy objects: `[{ id: '1', name: 'Hành Động', slug: 'hanh-dong' }]`
 * - Mixed or missing properties.
 *
 * Direct JSX interpolation of objects (`<span>{item}</span>`) causes fatal React
 * runtime crashes: "Objects are not valid as a React child (found: object with keys {id, name, slug})".
 * These utilities guarantee safe primitive string extraction.
 */

export interface TaxonomyObject {
  id?: string | number;
  _id?: string | number;
  name?: string;
  title?: string;
  label?: string;
  slug?: string;
  [key: string]: unknown;
}

export type TaxonomyInput = string | number | TaxonomyObject | null | undefined;

/**
 * Safely extracts a display name from a taxonomy item or primitive.
 * Guaranteed to return a clean string primitive, never an object.
 *
 * @param item - The raw taxonomy item (string, object, number, null, undefined).
 * @param fallback - Optional fallback string if no valid name is found.
 * @returns Clean display name as a string primitive.
 */
export function getTaxonomyName(item: unknown, fallback: string = ''): string {
  if (item == null) return fallback;
  if (typeof item === 'string') {
    const trimmed = item.trim();
    return trimmed.length > 0 ? trimmed : fallback;
  }
  if (typeof item === 'number') {
    return Number.isFinite(item) ? String(item) : fallback;
  }
  if (typeof item === 'object') {
    const rec = item as Record<string, unknown>;
    if (typeof rec.name === 'string' && rec.name.trim().length > 0) {
      return rec.name.trim();
    }
    if (typeof rec.title === 'string' && rec.title.trim().length > 0) {
      return rec.title.trim();
    }
    if (typeof rec.label === 'string' && rec.label.trim().length > 0) {
      return rec.label.trim();
    }
    if (typeof rec.slug === 'string' && rec.slug.trim().length > 0) {
      return rec.slug.trim();
    }
  }
  return fallback;
}

/**
 * Safely extracts a joined list of taxonomy display names.
 * Handles arrays of strings, arrays of taxonomy objects, or single entries.
 *
 * @param items - Array of taxonomy items or single taxonomy item.
 * @param separator - Separator string between items (defaults to ', ').
 * @returns Joined string of valid taxonomy names.
 */
export function getTaxonomyList(items: unknown, separator: string = ', '): string {
  if (!items) return '';
  if (Array.isArray(items)) {
    return items
      .map((item) => getTaxonomyName(item))
      .filter((name) => name.length > 0)
      .join(separator);
  }
  return getTaxonomyName(items);
}

/**
 * Safely extracts a URL-friendly slug from a taxonomy item.
 *
 * @param item - The taxonomy item.
 * @param fallback - Optional fallback slug.
 * @returns The extracted slug string.
 */
export function getTaxonomySlug(item: unknown, fallback: string = ''): string {
  if (!item) return fallback;
  if (typeof item === 'string') return item.trim();
  if (typeof item === 'object') {
    const rec = item as Record<string, unknown>;
    if (typeof rec.slug === 'string' && rec.slug.trim().length > 0) {
      return rec.slug.trim();
    }
    if (typeof rec.name === 'string' && rec.name.trim().length > 0) {
      return rec.name.trim().toLowerCase().replace(/\s+/g, '-');
    }
  }
  return fallback;
}

/**
 * Safely formats and extracts a release year as a string primitive.
 * Handles numbers, strings, and year taxonomy objects ({ id, name, slug }).
 * Guaranteed to return a clean string primitive, never an object.
 *
 * @param year - The raw year value (primitive or object).
 * @param fallback - Optional fallback year.
 * @returns Year as string primitive.
 */
export function formatYear(year: unknown, fallback?: number | string): string {
  const current = fallback !== undefined ? String(fallback) : String(new Date().getFullYear());
  if (year == null) return current;
  if (typeof year === 'number') {
    return Number.isFinite(year) ? String(year) : current;
  }
  if (typeof year === 'string') {
    const trimmed = year.trim();
    return trimmed.length > 0 ? trimmed : current;
  }
  return getTaxonomyName(year, current);
}

