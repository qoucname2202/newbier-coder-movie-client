/**
 * @file country.schema.ts
 * @description Zod runtime validation schemas for Country feature contracts.
 */

import { z } from 'zod';

export const MovieCategoryDtoSchema = z.object({
  name: z.string(),
  slug: z.string(),
});

export const CountryMovieItemSchema = z.object({
  id: z.string(),
  slug: z.string(),
  name: z.string(),
  originName: z.string().optional(),
  type: z.string().optional(),
  status: z.string().optional(),
  isCinemaMovie: z.boolean().optional(),
  trailerUrl: z.string().optional(),
  posterUrl: z.string(),
  thumbUrl: z.string().optional(),
  quality: z.string().optional(),
  lang: z.string().optional(),
  episodeCurrent: z.string().optional(),
  year: z.union([z.number(), z.string()]).optional(),
  category: z.array(MovieCategoryDtoSchema).optional(),
}).passthrough();

export const CountryMoviesApiResponseSchema = z.object({
  requestTrace: z.string().optional(),
  responseDateTime: z.string().optional(),
  responseStatus: z.object({
    responseCode: z.string(),
    responseMessage: z.string(),
  }).optional(),
  responseData: z.object({
    data: z.array(CountryMovieItemSchema),
    total: z.number().int().nonnegative(),
    page: z.number().int().positive(),
    limit: z.number().int().positive(),
    totalPages: z.number().int().positive(),
    hasNext: z.boolean().optional(),
    hasPrevious: z.boolean().optional(),
  }),
});

export const CountryEntitySchema = z.object({
  id: z.string().optional(),
  _id: z.string().optional(),
  name: z.string().min(1, 'Country name is required'),
  slug: z.string().min(1, 'Country slug is required'),
  code: z.string().optional(),
  description: z.string().optional(),
  isActive: z.boolean().optional().default(true),
  movieCount: z.number().optional().default(0),
}).passthrough();

export const CountryFilterParamsSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().default(20),
  sort: z.enum(['moi-nhat', 'xem-nhieu', 'danh-gia', 'nam-phat-hanh']).default('moi-nhat'),
  year: z.string().optional(),
});

export const PaginationMetaSchema = z.object({
  currentPage: z.number().int().positive().default(1),
  totalPages: z.number().int().nonnegative().default(1),
  totalItems: z.number().int().nonnegative().default(0),
  itemsPerPage: z.number().int().positive().default(20),
});

export type ValidatedCountryFilterParams = z.infer<typeof CountryFilterParamsSchema>;
