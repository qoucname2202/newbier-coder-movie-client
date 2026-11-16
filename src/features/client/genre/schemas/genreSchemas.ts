/**
 * @file genreSchemas.ts
 * @description Zod runtime validation schemas for Genre requests, filters, and responses.
 */

import { z } from 'zod';

export const genreFormatFilterSchema = z.enum(['all', 'single', 'series']).default('all');

export const genreSortOptionSchema = z.enum(['newest', 'highest-rating', 'year-desc', 'a-z']).default('newest');

export const genreQueryParamsSchema = z.object({
  slug: z.string().min(1, 'Slug is required'),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(24),
  formatType: genreFormatFilterSchema.optional().default('all'),
  sort: genreSortOptionSchema.optional().default('newest')
});

export type ValidatedGenreQueryParams = z.infer<typeof genreQueryParamsSchema>;

export const genreMovieItemSchema = z.object({
  _id: z.string().optional(),
  id: z.string().optional(),
  slug: z.string().default(''),
  name: z.string().default('Phim chưa đặt tên'),
  origin_name: z.string().optional().default(''),
  poster_url: z.string().optional().default(''),
  thumb_url: z.string().optional().default(''),
  year: z.union([z.number(), z.string()]).optional(),
  quality: z.string().optional().default('FHD'),
  lang: z.string().optional().default('Vietsub'),
  rating: z.number().optional().default(0),
  vote_average: z.number().optional().default(0),
  type: z.string().optional().default('single'),
  episode_current: z.string().optional(),
  episode_total: z.string().optional(),
  time: z.string().optional(),
  trailer_url: z.string().optional()
}).passthrough();
