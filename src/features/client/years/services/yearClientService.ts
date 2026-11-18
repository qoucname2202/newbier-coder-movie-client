/**
 * @file yearClientService.ts
 * @description Client-facing Release Year service.
 * Fetches and caches publicly accessible release years, guaranteeing that any inactive
 * years (isActive: false) are filtered out and never displayed in client navigation or filters.
 */

import axios from 'axios';
import { YearEntity } from '@/features/admin/years/types/year.types';
import { extractYearList } from '@/features/admin/years/services/yearAdminService';
import { INITIAL_YEARS } from '@/mock/admin/mockTaxonomies';
import { apiUrl } from '@/config/apiPaths';

export interface IYearClientService {
  getActiveYears(signal?: AbortSignal): Promise<YearEntity[]>;
}

export class YearClientService implements IYearClientService {
  private cachedActiveYears: YearEntity[] | null = null;
  private inFlightPromise: Promise<YearEntity[]> | null = null;

  /**
   * Retrieves all active release years for client navigation and filtering.
   * Strips all inactive years (isActive: false) to comply with business rules.
   *
   * @param signal Optional AbortSignal
   * @returns Array of active YearEntity objects sorted chronologically descending
   */
  async getActiveYears(_signal?: AbortSignal): Promise<YearEntity[]> {
    if (this.cachedActiveYears && this.cachedActiveYears.length > 0) {
      return this.cachedActiveYears;
    }

    // Backend endpoint /years is removed per user request.
    // Static active release years are loaded and cached locally without API calls.
    const activeYears = (INITIAL_YEARS || [])
      .filter((y) => y.isActive !== false)
      .map((y) => ({
        id: String(y.id || y.slug),
        name: String(y.name || y.slug),
        slug: String(y.slug),
        description: y.description || '',
        isActive: true,
        movieCount: typeof y.movieCount === 'number' ? y.movieCount : 0,
      }))
      .sort((a, b) => {
        const numA = parseInt(a.name, 10) || 0;
        const numB = parseInt(b.name, 10) || 0;
        return numB - numA;
      });

    this.cachedActiveYears = activeYears;
    return activeYears;
  }

  /**
   * Clears in-memory client cache (e.g. on manual refresh or socket update).
   */
  clearCache(): void {
    this.cachedActiveYears = null;
    this.inFlightPromise = null;
  }
}

export const yearClientService = new YearClientService();
