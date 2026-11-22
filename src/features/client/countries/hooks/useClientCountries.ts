/**
 * @file useClientCountries.ts
 * @description Hook to fetch and cache all active countries for client navigation (Navbar).
 */

import { useState, useEffect, useCallback } from 'react';
import { CountryEntity } from '../types/country.types';
import {
  ICountryClientService,
  countryClientService as defaultService,
} from '../services/countryClientService';

export interface UseClientCountriesOptions {
  service?: ICountryClientService;
}

export interface UseClientCountriesReturn {
  countries: CountryEntity[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useClientCountries({
  service = defaultService,
}: UseClientCountriesOptions = {}): UseClientCountriesReturn {
  const [countries, setCountries] = useState<CountryEntity[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadCountries = useCallback(
    async (signal?: AbortSignal) => {
      try {
        setIsLoading(true);
        setError(null);
        const list = await service.getAllCountries(signal);
        setCountries(list.filter((c) => c.isActive !== false));
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Không thể tải danh sách quốc gia';
        setError(msg);
      } finally {
        setIsLoading(false);
      }
    },
    [service]
  );

  useEffect(() => {
    const controller = new AbortController();
    loadCountries(controller.signal);

    return () => {
      controller.abort();
    };
  }, [loadCountries]);

  return {
    countries,
    isLoading,
    error,
    refresh: () => loadCountries(),
  };
}
