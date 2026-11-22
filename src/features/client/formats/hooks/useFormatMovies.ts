/**
 * @file useFormatMovies.ts
 * @description Custom hook for managing movie format listings, URL sync, and pagination.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/router';
import { isSessionTerminated } from '@/auth/authToken';
import { formatClientService } from '../services/formatClientService';
import { resolveFormatDisplayName } from '../utils/formatHelpers';
import type {
  FormatMovieItem,
  FormatPaginationInfo,
  FormatSortOption,
  FormatQueryParams
} from '../types/format.types';

export interface UseFormatMoviesOptions {
  slug: string;
  defaultLimit?: number;
}

export interface UseFormatMoviesResult {
  movies: FormatMovieItem[];
  pagination: FormatPaginationInfo;
  formatTitle: string;
  isLoading: boolean;
  error: string | null;
  page: number;
  limit: number;
  sort: FormatSortOption;
  year: string;
  category: string;
  changePage: (newPage: number) => void;
  changeSort: (newSort: FormatSortOption) => void;
  changeYear: (newYear: string) => void;
  changeCategory: (newCategory: string) => void;
  retry: () => void;
}

export function useFormatMovies({
  slug,
  defaultLimit = 20
}: UseFormatMoviesOptions): UseFormatMoviesResult {
  const router = useRouter();

  const [movies, setMovies] = useState<FormatMovieItem[]>([]);
  const [pagination, setPagination] = useState<FormatPaginationInfo>({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    limit: defaultLimit,
    hasNext: false,
    hasPrevious: false
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filter state
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(defaultLimit);
  const [sort, setSort] = useState<FormatSortOption>('newest');
  const [year, setYear] = useState<string>('all');
  const [category, setCategory] = useState<string>('all');

  const abortControllerRef = useRef<AbortController | null>(null);
  const formatTitle = resolveFormatDisplayName(slug);

  // 1. Sync from URL query params when router is ready
  useEffect(() => {
    if (!router.isReady) return;

    const qPage = router.query.page ? parseInt(String(router.query.page), 10) : 1;
    const qLimit = router.query.limit ? parseInt(String(router.query.limit), 10) : defaultLimit;
    const qSort = (router.query.sort as FormatSortOption) || 'newest';
    const qYear = router.query.year ? String(router.query.year) : 'all';
    const qCategory = router.query.category ? String(router.query.category) : 'all';

    setPage(Number.isFinite(qPage) && qPage > 0 ? qPage : 1);
    setLimit(Number.isFinite(qLimit) && qLimit > 0 ? qLimit : defaultLimit);
    setSort(qSort);
    setYear(qYear);
    setCategory(qCategory);
  }, [router.isReady, router.query.page, router.query.limit, router.query.sort, router.query.year, router.query.category, defaultLimit]);

  // 2. Data fetching handler
  const loadData = useCallback(async () => {
    if (isSessionTerminated()) {
      setIsLoading(false);
      return;
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsLoading(true);
    setError(null);

    const queryParams: FormatQueryParams = {
      slug,
      page,
      limit,
      sort,
      year: year !== 'all' ? year : undefined,
      category: category !== 'all' ? category : undefined
    };

    try {
      const result = await formatClientService.getMoviesByFormat(queryParams, controller.signal);

      if (controller.signal.aborted) return;

      setMovies(result.data);
      setPagination({
        currentPage: result.page,
        totalPages: Math.max(result.totalPages, 1),
        totalItems: result.total,
        limit: result.limit,
        hasNext: result.hasNext,
        hasPrevious: result.hasPrevious
      });
    } catch (err: unknown) {
      if (controller.signal.aborted) return;
      const message = err instanceof Error ? err.message : 'Không thể tải danh sách phim';
      setError(message);
      setMovies([]);
    } finally {
      if (!controller.signal.aborted) {
        setIsLoading(false);
      }
    }
  }, [slug, page, limit, sort, year, category]);

  useEffect(() => {
    if (!router.isReady || !slug) return;
    void loadData();

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [router.isReady, slug, loadData]);

  // 3. URL Query synchronizer
  const updateQueryUrl = useCallback(
    (newParams: { page?: number; sort?: string; year?: string; category?: string }) => {
      if (!router.isReady) return;

      const currentQuery = { ...router.query };
      if (newParams.page !== undefined) currentQuery.page = String(newParams.page);
      if (newParams.sort !== undefined) currentQuery.sort = newParams.sort;
      if (newParams.year !== undefined) {
        if (newParams.year === 'all') delete currentQuery.year;
        else currentQuery.year = newParams.year;
      }
      if (newParams.category !== undefined) {
        if (newParams.category === 'all') delete currentQuery.category;
        else currentQuery.category = newParams.category;
      }

      void router.push(
        {
          pathname: router.pathname,
          query: currentQuery
        },
        undefined,
        { shallow: true, scroll: false }
      );
    },
    [router]
  );

  const changePage = useCallback(
    (newPage: number) => {
      if (newPage < 1 || newPage > pagination.totalPages || newPage === page) return;
      setPage(newPage);
      updateQueryUrl({ page: newPage });
      if (typeof window !== 'undefined') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    },
    [page, pagination.totalPages, updateQueryUrl]
  );

  const changeSort = useCallback(
    (newSort: FormatSortOption) => {
      if (newSort === sort) return;
      setSort(newSort);
      setPage(1);
      updateQueryUrl({ sort: newSort, page: 1 });
    },
    [sort, updateQueryUrl]
  );

  const changeYear = useCallback(
    (newYear: string) => {
      if (newYear === year) return;
      setYear(newYear);
      setPage(1);
      updateQueryUrl({ year: newYear, page: 1 });
    },
    [year, updateQueryUrl]
  );

  const changeCategory = useCallback(
    (newCat: string) => {
      if (newCat === category) return;
      setCategory(newCat);
      setPage(1);
      updateQueryUrl({ category: newCat, page: 1 });
    },
    [category, updateQueryUrl]
  );

  const retry = useCallback(() => {
    void loadData();
  }, [loadData]);

  return {
    movies,
    pagination,
    formatTitle,
    isLoading,
    error,
    page,
    limit,
    sort,
    year,
    category,
    changePage,
    changeSort,
    changeYear,
    changeCategory,
    retry
  };
}
