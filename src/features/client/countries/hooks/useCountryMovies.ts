/**
 * @file useCountryMovies.ts
 * @description State orchestrator hook for the Country Movies page.
 * Synchronizes with URL query params (?page=&sort=&year=) and manages pagination,
 * sorting, filtering, loading, and error states.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/router';
import { CountryFilterParams, CountryMoviesResult, CountrySortOption, PaginationMeta, RawMovie } from '../types/country.types';
import {
  ICountryClientService,
  countryClientService as defaultService,
} from '../services/countryClientService';

export interface UseCountryMoviesOptions {
  slug: string;
  initialParams?: CountryFilterParams;
  service?: ICountryClientService;
}

export interface UseCountryMoviesReturn {
  movies: RawMovie[];
  pagination: PaginationMeta;
  countryName: string;
  isLoading: boolean;
  error: string | null;
  sort: CountrySortOption;
  year: string;
  page: number;
  changePage: (newPage: number) => void;
  changeSort: (newSort: CountrySortOption) => void;
  changeYear: (newYear: string) => void;
  retry: () => void;
}

const DEFAULT_PAGINATION: PaginationMeta = {
  currentPage: 1,
  totalPages: 1,
  totalItems: 0,
  itemsPerPage: 20,
};

export function useCountryMovies({
  slug,
  service = defaultService,
}: UseCountryMoviesOptions): UseCountryMoviesReturn {
  const router = useRouter();

  // Read initial filter values from URL query string
  const rawPage = Number(router.query.page);
  const initialPage = Number.isInteger(rawPage) && rawPage > 0 ? rawPage : 1;
  const initialSort = (typeof router.query.sort === 'string' ? router.query.sort : 'moi-nhat') as CountrySortOption;
  const initialYear = typeof router.query.year === 'string' ? router.query.year : 'all';

  const [page, setPage] = useState<number>(initialPage);
  const [sort, setSort] = useState<CountrySortOption>(initialSort);
  const [year, setYear] = useState<string>(initialYear);

  const [movies, setMovies] = useState<RawMovie[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta>(DEFAULT_PAGINATION);
  const [countryName, setCountryName] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const activeAbortController = useRef<AbortController | null>(null);

  // Sync state if user navigates back/forward via browser history
  useEffect(() => {
    if (!router.isReady) return;
    const qPage = Number(router.query.page);
    const validPage = Number.isInteger(qPage) && qPage > 0 ? qPage : 1;
    const qSort = (typeof router.query.sort === 'string' ? router.query.sort : 'moi-nhat') as CountrySortOption;
    const qYear = typeof router.query.year === 'string' ? router.query.year : 'all';

    setPage(validPage);
    setSort(qSort);
    setYear(qYear);
  }, [router.isReady, router.query.page, router.query.sort, router.query.year]);

  // Push filter mutations to URL for shareable / bookmarkable URLs (SEO friendly)
  const syncUrlParams = useCallback(
    (nextPage: number, nextSort: CountrySortOption, nextYear: string) => {
      if (!router.isReady) return;

      const newQuery: Record<string, string> = {};
      if (nextPage > 1) newQuery.page = String(nextPage);
      if (nextSort !== 'moi-nhat') newQuery.sort = nextSort;
      if (nextYear && nextYear !== 'all') newQuery.year = nextYear;

      // Preserve existing pathname (e.g. /quoc-gia/han-quoc or /country/han-quoc)
      const currentPath = router.asPath.split('?')[0];

      router.push(
        {
          pathname: router.pathname,
          query: { ...router.query, ...newQuery }
        },
        `${currentPath}${Object.keys(newQuery).length > 0 ? `?${new URLSearchParams(newQuery).toString()}` : ''}`,
        { shallow: true, scroll: false }
      );
    },
    [router]
  );

  const loadMovies = useCallback(
    async (targetPage: number, targetSort: CountrySortOption, targetYear: string) => {
      if (!slug) return;

      // Cancel previous in-flight request
      if (activeAbortController.current) {
        activeAbortController.current.abort();
      }
      const controller = new AbortController();
      activeAbortController.current = controller;

      try {
        setIsLoading(true);
        setError(null);

        const result: CountryMoviesResult = await service.getMoviesByCountry(
          slug,
          {
            page: targetPage,
            limit: 20,
            sort: targetSort,
            year: targetYear !== 'all' ? targetYear : undefined,
          },
          controller.signal
        );

        setMovies(result.movies);
        setPagination(result.pagination);
        setCountryName(result.countryName);
      } catch (err) {
        if (controller.signal.aborted) return;
        const msg = err instanceof Error ? err.message : 'Không thể tải danh sách phim';
        setError(msg);
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    },
    [slug, service]
  );

  // Trigger loading whenever slug, page, sort, or year changes
  useEffect(() => {
    if (!slug) return;
    loadMovies(page, sort, year);

    return () => {
      if (activeAbortController.current) {
        activeAbortController.current.abort();
      }
    };
  }, [slug, page, sort, year, loadMovies]);

  const changePage = useCallback(
    (newPage: number) => {
      if (newPage === page || newPage < 1 || newPage > pagination.totalPages) return;
      setPage(newPage);
      syncUrlParams(newPage, sort, year);

      // Smooth scroll to top of movie grid
      if (typeof window !== 'undefined') {
        const gridEl = document.getElementById('country-movies-section');
        if (gridEl) {
          gridEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else {
          window.scrollTo({ top: 120, behavior: 'smooth' });
        }
      }
    },
    [page, pagination.totalPages, sort, year, syncUrlParams]
  );

  const changeSort = useCallback(
    (newSort: CountrySortOption) => {
      if (newSort === sort) return;
      setSort(newSort);
      setPage(1);
      syncUrlParams(1, newSort, year);
    },
    [sort, year, syncUrlParams]
  );

  const changeYear = useCallback(
    (newYear: string) => {
      if (newYear === year) return;
      setYear(newYear);
      setPage(1);
      syncUrlParams(1, sort, newYear);
    },
    [sort, year, syncUrlParams]
  );

  const retry = useCallback(() => {
    loadMovies(page, sort, year);
  }, [loadMovies, page, sort, year]);

  return {
    movies,
    pagination,
    countryName,
    isLoading,
    error,
    sort,
    year,
    page,
    changePage,
    changeSort,
    changeYear,
    retry,
  };
}
