/**
 * @file format.schema.ts
 * @description Zod runtime validation schemas for movie format API payloads.
 * Single source of truth for runtime validation.
 */

import { z } from 'zod';

export const formatMovieCategorySchema = z.object({
  id: z.string().optional(),
  slug: z.string().optional(),
  name: z.string().optional()
});

export const formatMovieItemSchema = z.object({
  id: z.string().default(''),
  slug: z.string().default(''),
  name: z.string().default(''),
  originName: z.string().default(''),
  trailerUrl: z.string().nullable().optional(),
  posterUrl: z.string().default(''),
  thumbUrl: z.string().default(''),
  quality: z.string().default('HD'),
  lang: z.string().default('Vietsub'),
  episodeCurrent: z.string().nullable().optional(),
  status: z.string().nullable().optional(),
  year: z.number().nullable().optional(),
  duration: z.union([z.string(), z.number()]).nullable().optional(),
  vote_average: z.number().nullable().optional(),
  rating: z.number().nullable().optional(),
  category: z.array(formatMovieCategorySchema).optional()
}).passthrough();

export const formatMoviesPaginationPayloadSchema = z.object({
  data: z.array(formatMovieItemSchema).default([]),
  total: z.number().default(0),
  page: z.number().default(1),
  limit: z.number().default(20),
  totalPages: z.number().default(1),
  hasNext: z.boolean().default(false),
  hasPrevious: z.boolean().default(false)
});

export const formatMoviesApiResponseSchema = z.object({
  requestTrace: z.string().optional().default(''),
  responseDateTime: z.string().optional().default(''),
  responseStatus: z.object({
    responseCode: z.string().default('000000'),
    responseMessage: z.string().default('Success')
  }).default({
    responseCode: '000000',
    responseMessage: 'Success'
  }),
  responseData: formatMoviesPaginationPayloadSchema
});

export const formatQueryParamsSchema = z.object({
  slug: z.string().min(1, 'Format slug is required'),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sort: z.enum([
    'newest',
    'oldest',
    'highest-rating',
    'lowest-rating',
    'a-z',
    'z-a',
    'year-desc',
    'year-asc'
  ]).default('newest'),
  year: z.string().optional(),
  category: z.string().optional()
});

export type ValidatedFormatQueryParams = z.infer<typeof formatQueryParamsSchema>;
export type ValidatedFormatMoviesApiResponse = z.infer<typeof formatMoviesApiResponseSchema>;
