/**
 * @file countryClientService.test.ts
 * @description Unit tests for Country Client Service and Zod Validation Schemas.
 */

import { CountryClientService } from '../services/countryClientService';
import { CountryFilterParamsSchema } from '../schemas/country.schema';

describe('Country Client Feature & Service Tests', () => {
  let service: CountryClientService;

  beforeEach(() => {
    service = new CountryClientService();
    service.clearCache();
  });

  describe('CountryFilterParamsSchema', () => {
    it('should validate and parse valid filter params with defaults', () => {
      const parsed = CountryFilterParamsSchema.parse({});
      expect(parsed.page).toBe(1);
      expect(parsed.limit).toBe(20);
      expect(parsed.sort).toBe('moi-nhat');
    });

    it('should coerce string numbers to integer types for query strings', () => {
      const parsed = CountryFilterParamsSchema.parse({
        page: '3',
        limit: '15',
        sort: 'xem-nhieu',
        year: '2024',
      });
      expect(parsed.page).toBe(3);
      expect(parsed.limit).toBe(15);
      expect(parsed.sort).toBe('xem-nhieu');
      expect(parsed.year).toBe('2024');
    });

    it('should reject invalid sort options', () => {
      expect(() =>
        CountryFilterParamsSchema.parse({
          sort: 'invalid-sort',
        })
      ).toThrow();
    });
  });

  describe('CountryClientService.getAllCountries fallback resilience', () => {
    it('should return normalized country list even when network fetch fails', async () => {
      const countries = await service.getAllCountries();
      expect(Array.isArray(countries)).toBe(true);
      expect(countries.length).toBeGreaterThan(0);

      // Verify every country has clean slug, name, and correct /quoc-gia/ link
      countries.forEach((country) => {
        expect(country.slug).toBeTruthy();
        expect(country.name).toBeTruthy();
        expect(country.href).toMatch(/^\/quoc-gia\//);
      });
    });

    it('should cache results in memory for consecutive calls', async () => {
      const firstCall = await service.getAllCountries();
      const secondCall = await service.getAllCountries();
      expect(firstCall).toBe(secondCall); // Exact same object reference from in-memory cache
    });
  });
});
