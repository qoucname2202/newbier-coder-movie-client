/**
 * @file formatClientService.test.ts
 * @description Unit tests for Format Client Service, Zod Validation Schemas, and format helpers.
 */

import { formatQueryParamsSchema, formatMoviesApiResponseSchema } from '../schemas/format.schema';
import { formatDuration, getQualityTier, getLanguageType, resolveFormatDisplayName } from '../utils/formatHelpers';

describe('Format Feature & Schema Tests', () => {
  describe('formatQueryParamsSchema', () => {
    it('should validate and parse valid format query params with defaults', () => {
      const parsed = formatQueryParamsSchema.parse({ slug: 'phim-le' });
      expect(parsed.slug).toBe('phim-le');
      expect(parsed.page).toBe(1);
      expect(parsed.limit).toBe(20);
      expect(parsed.sort).toBe('newest');
    });

    it('should coerce string numbers to integer types for query strings', () => {
      const parsed = formatQueryParamsSchema.parse({
        slug: 'phim-le',
        page: '2',
        limit: '20',
        sort: 'highest-rating',
        year: '2026'
      });
      expect(parsed.page).toBe(2);
      expect(parsed.limit).toBe(20);
      expect(parsed.sort).toBe('highest-rating');
      expect(parsed.year).toBe('2026');
    });

    it('should reject missing or empty slug', () => {
      expect(() => formatQueryParamsSchema.parse({ slug: '' })).toThrow();
    });
  });

  describe('formatMoviesApiResponseSchema', () => {
    it('should validate backend response structure accurately', () => {
      const mockResponse = {
        requestTrace: 'test-trace',
        responseDateTime: '2026-11-22T20:47:43+07:00',
        responseStatus: { responseCode: '000000', responseMessage: 'Success' },
        responseData: {
          data: [
            {
              id: '6ac7ab3b8b9bf8972e9987b4',
              slug: 'chuyen-sinh-thanh-kiem-phan-2',
              name: 'Chuyển Sinh Thành Kiếm (Phần 2)',
              originName: 'Reincarnated as a Sword (Season 2)',
              trailerUrl: 'https://www.youtube.com/watch?v=9gYNkmLqi3E',
              posterUrl: 'https://img.nguonc.com/images/img-a129.png',
              thumbUrl: 'https://img.nguonc.com/images/img-6291.png',
              quality: 'HD',
              lang: 'Vietsub',
              episodeCurrent: 'Tập 8',
              status: 'ongoing',
              year: 2026
            }
          ],
          total: 288,
          page: 1,
          limit: 20,
          totalPages: 15,
          hasNext: true,
          hasPrevious: false
        }
      };

      const parsed = formatMoviesApiResponseSchema.parse(mockResponse);
      expect(parsed.responseData.total).toBe(288);
      expect(parsed.responseData.totalPages).toBe(15);
      expect(parsed.responseData.data.length).toBe(1);
      expect(parsed.responseData.data[0].slug).toBe('chuyen-sinh-thanh-kiem-phan-2');
    });
  });

  describe('formatHelpers', () => {
    it('should format duration from minutes or strings correctly', () => {
      expect(formatDuration(157)).toBe('2h37');
      expect(formatDuration(120)).toBe('2h');
      expect(formatDuration(45)).toBe('45 phút');
      expect(formatDuration('157 phút')).toBe('2h37');
      expect(formatDuration('2h30m')).toBe('2h30');
      expect(formatDuration(null, 'Full')).toBe('Full');
    });

    it('should identify quality tiers including warning CAM/Trailer', () => {
      expect(getQualityTier('HD')).toBe('hd');
      expect(getQualityTier('FHD 1080p')).toBe('fhd');
      expect(getQualityTier('4K Ultra HD')).toBe('4k');
      expect(getQualityTier('Bản CAM')).toBe('cam');
      expect(getQualityTier('Trailer')).toBe('trailer');
    });

    it('should identify language types', () => {
      expect(getLanguageType('Vietsub')).toBe('vietsub');
      expect(getLanguageType('Thuyết minh')).toBe('thuyet-minh');
      expect(getLanguageType('Lồng tiếng')).toBe('long-tieng');
    });

    it('should resolve format display names', () => {
      expect(resolveFormatDisplayName('phim-le')).toBe('Phim Lẻ');
      expect(resolveFormatDisplayName('phim-bo')).toBe('Phim Bộ');
      expect(resolveFormatDisplayName('tv-shows')).toBe('TV Shows');
    });
  });
});
