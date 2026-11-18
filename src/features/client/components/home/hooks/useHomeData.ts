/**
 * The central data management hook of the home page.
 *
 * It uses `HOME_SECTIONS` to render without flickering, to keep the state
 * clean and to provide a solid fallback.
 *
 * The Zustand store (`useMovieStore`) is used to:
 * - Cache the home page movies by section ('hero', 'top10', 'bigSlide',
 *   'latest').
 * - Read the cache first, so the API is only called on a cache miss or
 *   when the cache expired.
 * - Avoid calling the API again when the user comes back to the home page.
 */

import { useState, useEffect, useCallback, useRef } from 'react';

// The Zustand store used for the movie caching.
import { useMovieStore } from '@/stores/useMovieStore';
import {
  normalizeHeroMovie,
  resolveImageUrl
} from '@/config/movieConfig';
import { SYSTEM_CONFIG } from '@/config/systemConfig';
import { HOME_SECTIONS } from '@/config/homeSectionsConfig';
import {
  resolveMovieBackdrop,
  LOCAL_DEFAULT_BACKDROP,
  LOCAL_DEFAULT_POSTER
} from '@/config/movieFallbackConfig';
import movieService from '@/API/services/movieService';
import upcomingMovieService from '@/API/services/upcomingMovieService';
import { filterMoviesWithValidTrailer } from '@/utils/trailer';
import {
  mockMovies,
  mockAnimationMovies
} from '@/mock/mockMovies';

/** A raw movie coming from the backend. The shape is loose and every field is optional. */
export type RawMovie = Record<string, unknown>;

/** A movie that was already normalized to the standard schema. */
export interface NormalizedMovie extends RawMovie {
  _id: string;
  name: string;
  poster_url: string;
  thumb_url: string;
  backdrop_url: string;
}

/** A movie with a rank, used by the Top 10 list. */
export interface RankedMovie extends NormalizedMovie {
  rank: number;
}

/** The initial snapshot coming from the ISR or the SSR. */
export interface HomeDataSnapshot {
  featuredMovies?: RawMovie[];
  topMovies?: RawMovie[];
  mostViewedMovies?: RawMovie[];
  latestMovies?: RawMovie[];
  animeSpotlightMovies?: RawMovie[];
  [key: string]: unknown;
}

/** The return type of the hook. */
export interface UseHomeDataReturn {
  featuredMovies: NormalizedMovie[];
  topMovies: NormalizedMovie[];
  mostViewedMovies: RankedMovie[];
  upcomingMovies: NormalizedMovie[];
  upcomingLoading: boolean;
  upcomingLoaded: boolean;
  loadUpcoming: () => Promise<void>;
  animeSpotlightMovies: RawMovie[];
  latestMovies: NormalizedMovie[];
  loading: boolean;
  loadingMore: boolean;
  hasMore: boolean;
  page: number;
  loadMore: () => Promise<void>;
  fetchHeroMovies: () => Promise<void>;
  fetchTop10Movies: () => Promise<void>;
  fetchBigSlideMovies: () => Promise<void>;
  fetchMostViewed: () => Promise<void>;
}

// The module level guard makes the diagnostic run only once per page
// load, even when the home page is mounted again or the data is fetched
// again.
let didLogHomeDiagnostic = false;

/**
 * Normalizes the movie data coming from the different backend formats to
 * the standard schema.
 *
 * Every image field goes through `resolveImageUrl`, so a relative path
 * from the API (for example `/uploads/poster.jpg`) is joined with the
 * origin instead of pointing to the current host.
 *
 * @param movie - The raw movie object coming from the API.
 * @param index - The index of the item, used for the diversified fallback
 *                backdrops.
 * @returns The normalized movie, or `null` when it has no real image.
 */
const normalizeMovie = (movie: RawMovie | null | undefined, index = 0): NormalizedMovie | null => {
  if (!movie) return null;

  // The first candidate field that can be resolved is used.
  const resolveFirstUsable = (candidates: unknown[]): string => {
    for (const c of candidates) {
      const r = resolveImageUrl(c as string | null | undefined);
      if (r) return r;
    }
    return '';
  };

  const posterCandidates = [
    movie.poster_url, movie.poster, movie.posterUrl, movie.image
  ];
  const thumbCandidates = [
    movie.thumb_url, movie.thumb, movie.thumbUrl, movie.thumbnail
  ];

  const posterResolved = resolveFirstUsable(posterCandidates);
  const thumbResolved = resolveFirstUsable(thumbCandidates);

  // ONLY MOVIES WITH A REAL IMAGE ARE SHOWN: when both the poster and the
  // thumbnail are empty in the API answer, `null` is returned, so the
  // caller can skip the movie. The code used to fall back to
  // `LOCAL_DEFAULT_POSTER`, which produced a grey strip (the placeholder
  // SVG) on the home page. The new rule is: a movie without an image is
  // hidden completely.
  //
  // Three kinds of displayable URL are accepted:
  //   1. http(s)://…            — an absolute URL from the CDN or the
  //      backend.
  //   2. data:image/…           — an inline base64 image.
  //   3. /uploads/…, /img/…     — a host relative path. When the
  //      `imageOrigin` environment variable is empty, `resolveImageUrl`
  //      keeps the relative path as it is. The browser still loads it, so
  //      it must NOT be treated as "no image", otherwise the movie would
  //      be hidden by mistake when the environment variable is missing.
  const hasRealPoster = (v: string): boolean => {
    if (!v) return false;
    const s = v.trim();
    if (/^https?:\/\//i.test(s)) return true;
    if (/^data:image\//i.test(s)) return true;
    if (/^\/uploads\//i.test(s) || /^\/img\//i.test(s)) return true;
    return false;
  };
  const posterHasReal = hasRealPoster(posterResolved);
  const thumbHasReal = hasRealPoster(thumbResolved);
  if (!posterHasReal && !thumbHasReal) {
    return null;
  }

  const poster = posterResolved || thumbResolved || LOCAL_DEFAULT_POSTER;
  const thumb = thumbResolved || posterResolved || poster || LOCAL_DEFAULT_POSTER;
  const backdrop = resolveMovieBackdrop(movie as never, index) || LOCAL_DEFAULT_BACKDROP;

  // A controlled diagnostic, enabled by `NEXT_PUBLIC_DEBUG_MOVIES=true`.
  // Only the raw fields and the resolved URLs of the FIRST movie are
  // logged, once per page load.
  if (SYSTEM_CONFIG.debugMovies && index === 0 && !didLogHomeDiagnostic) {
    didLogHomeDiagnostic = true;
    // The debug mode only: uncomment the line below when the movie data
    // has to be diagnosed.
    // console.log('[HomeData] First movie raw:', JSON.stringify(movie, null, 2));
  }

  const id = (movie._id as string) || (movie.id as string) || `movie-${index}`;
  const name = (movie.name as string) || 'Phim Đang Cập Nhật';

  return {
    ...movie,
    _id: id,
    name,
    poster_url: poster,
    thumb_url: thumb,
    backdrop_url: backdrop
  };
};

/**
 * Applies `normalizeMovie` to an array of movies and, at the same time,
 * removes the movies that have no poster (because `normalizeMovie` now
 * returns `null` for them). The original order is kept.
 *
 * It is used by every call site of `setTopMovies`, `setMostViewedMovies`,
 * `setLatestMovies` and `setUpcomingMovies`, so the rule "a movie without
 * a real image is hidden" is applied everywhere without fixing each call
 * site one by one.
 */
const normalizeAndCompact = <T>(
  movies: readonly T[],
  rankOffset?: (index: number) => number
): NormalizedMovie[] => {
  const out: NormalizedMovie[] = [];
  movies.forEach((m, idx) => {
    const norm = normalizeMovie(m as unknown as RawMovie, idx);
    if (!norm) return;
    out.push(rankOffset ? { ...norm, rank: rankOffset(idx) } : norm);
  });
  return out;
};

/**
 * Works like `normalizeAndCompact`, but it uses `normalizeHeroMovie` for
 * the `HeroBanner`.
 *
 * The same rule applies: the movies without a real image are removed,
 * because both the poster and the thumbnail are local placeholders.
 */
const compactHeroMovies = (movies: readonly unknown[]): NormalizedMovie[] => {
  const out: NormalizedMovie[] = [];
  movies.forEach((m, idx) => {
    const norm = normalizeHeroMovie(m as never, idx) as unknown as NormalizedMovie | null;
    if (!norm) return;
    const isLocal = (v: unknown): boolean => typeof v === 'string' && v.startsWith('/img/');
    if (isLocal(norm.poster_url) && isLocal(norm.thumb_url)) return;
    out.push(norm);
  });
  return out;
};


/**
 * Loads the data of the home page.
 *
 * @param initialSnapshot - The snapshot built by the ISR or the SSR. It is
 *                          only used when the snapshot feature is enabled.
 * @returns The movies of every section, plus the loading states and the
 *          handlers of the page.
 */
export const useHomeData = (initialSnapshot: HomeDataSnapshot | null = null): UseHomeDataReturn => {
  const isSnapshotEnabled = process.env.NEXT_PUBLIC_ENABLE_HOMEPAGE_SNAPSHOT === 'true';
  const effectiveSnapshot: HomeDataSnapshot | null = isSnapshotEnabled ? initialSnapshot : null;
  const snap = effectiveSnapshot as HomeDataSnapshot | null;

  // ---- The Zustand cache selectors ----
  // A selector is used for each action, so the whole component does not
  // re-render when an unrelated part of the cache changes.
  const getHomeCache = useMovieStore((s) => s.getCachedHomeMovies);
  const setHomeCache = useMovieStore((s) => s.setCachedHomeMovies);
  const setHomeLoading = useMovieStore((s) => s.setLoadingHome);

  // The states hold the real data of the API. They are initialized from
  // the ISR snapshot when it is available and enabled.
  // Every initializer runs the trailer aware filter, so the home page
  // never starts with a list that contains movies without a playable
  // trailer. The same `filterMoviesWithValidTrailer` helper used by the
  // network fetchers is reused here, so the rule stays in one place: a
  // movie without a valid trailer must not appear in any rail that shows
  // a "watch trailer" button.
  //
  // The cache is checked first in the Zustand store, and the snapshot is
  // the fallback.
  const [featuredMovies, setFeaturedMovies] = useState<NormalizedMovie[]>(() => {
    const cached = getHomeCache('hero');
    if (cached && cached.length > 0) {
      return compactHeroMovies(filterMoviesWithValidTrailer(cached));
    }
    const list = snap && (snap.featuredMovies?.length ?? 0) > 0
      ? (snap.featuredMovies ?? [])
      : [];
    const filtered = filterMoviesWithValidTrailer(list);
    return compactHeroMovies(filtered);
  });
  const [topMovies, setTopMovies] = useState<NormalizedMovie[]>(() => {
    const cached = getHomeCache('top10');
    if (cached && cached.length > 0) {
      return normalizeAndCompact(cached);
    }
    const list = snap && (snap.topMovies?.length ?? 0) > 0
      ? (snap.topMovies ?? [])
      : [];
    const filtered = filterMoviesWithValidTrailer(list);
    return normalizeAndCompact(filtered);
  });
  const [mostViewedMovies, setMostViewedMovies] = useState<RankedMovie[]>(() => {
    const cached = getHomeCache('mostViewed');
    if (cached && cached.length > 0) {
      return normalizeAndCompact(cached, (idx) => idx + 1) as unknown as RankedMovie[];
    }
    const list = snap && (snap.mostViewedMovies?.length ?? 0) > 0
      ? (snap.mostViewedMovies ?? [])
      : [];
    const filtered = filterMoviesWithValidTrailer(list);
    return normalizeAndCompact(filtered, (idx) => {
      const r = (list[idx] as { rank?: number } | undefined)?.rank;
      return (typeof r === 'number' ? r : idx) + 1;
    }) as unknown as RankedMovie[];
  });
  const [upcomingMovies, setUpcomingMovies] = useState<NormalizedMovie[]>([]);
  const [upcomingLoading, setUpcomingLoading] = useState<boolean>(false);
  const [upcomingLoaded, setUpcomingLoaded] = useState<boolean>(false);
  const [animeSpotlightMovies, setAnimeSpotlightMovies] = useState<RawMovie[]>(
    () => filterMoviesWithValidTrailer(snap?.animeSpotlightMovies || [])
  );
  const [latestMovies, setLatestMovies] = useState<NormalizedMovie[]>(() => {
    const list = snap && (snap.latestMovies?.length ?? 0) > 0
      ? (snap.latestMovies ?? [])
      : [];
    const filtered = filterMoviesWithValidTrailer(list);
    return normalizeAndCompact(filtered);
  });

  const [loading, setLoading] = useState<boolean>(() => !(snap?.featuredMovies?.length ?? 0));
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const [page, setPage] = useState<number>(1);
  const [hasMore, setHasMore] = useState<boolean>(true);

  const isMountedRef = useRef<boolean>(true);
  // The counter tracks how many of the 4 initial fetches are still in
  // flight. `loading` only turns off when the counter reaches zero, so a
  // single hanging fetch can no longer trap the page in the skeleton
  // state forever. It is also used as a hard safety net: a timeout is
  // enforced on every fetch below, so the counter can never stay above
  // zero.
  const initialFetchesPendingRef = useRef<number>(0);
  // The id of the master timeout, so it can be cleared once the page is
  // rendered.
  const loadingSafetyNetRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (loadingSafetyNetRef.current) {
        clearTimeout(loadingSafetyNetRef.current);
        loadingSafetyNetRef.current = null;
      }
    };
  }, []);

  /**
   * Decrements the in-flight counter and, when it reaches zero, unsticks
   * the page by setting `loading=false`.
   *
   * This is the single source of truth for the loading state of the
   * initial load: every fetcher that takes part in the first paint has
   * to call it.
   */
  const finishInitialFetch = useCallback((): void => {
    initialFetchesPendingRef.current = Math.max(0, initialFetchesPendingRef.current - 1);
    if (
      isMountedRef.current
      && initialFetchesPendingRef.current === 0
      ) {
      if (loadingSafetyNetRef.current) {
        clearTimeout(loadingSafetyNetRef.current);
        loadingSafetyNetRef.current = null;
      }
      setLoading(false);
    }
  }, []);

  /**
   * Fetches the movies of the hero spotlight through the `HOME_SECTIONS`
   * bundle.
   *
   * The local `mockMovies` are used as a fallback when the API returns
   * an empty list (for example on a 401).
   *
   * The result is written to the Zustand store after a successful fetch.
   */
  const fetchHeroMovies = useCallback(async (): Promise<void> => {
    try {
      const heroSection = HOME_SECTIONS['hero'];
      const movies = heroSection?.load ? await heroSection.load([]) : [];
      let finalList = movies;
      if (!Array.isArray(movies) || movies.length === 0) {
        finalList = mockMovies as unknown as typeof movies;
      }
      if (isMountedRef.current && finalList.length > 0) {
        const filtered = filterMoviesWithValidTrailer(finalList);

        // Only the movies WITH a trailer are shown. There is no fallback
        // on a list without a trailer. When the filter removes every
        // movie, the hero renders `null` (it is handled by the
        // `HeroBanner` when `!activeMovie`). At most 6 movies are kept
        // after the filter, so the carousel layout stays compact.
        const finalHeroList = filtered.slice(0, 6);

        // The state is not set when the list is empty, so React does not
        // re-render for nothing.
        if (finalHeroList.length > 0) {
          setFeaturedMovies(compactHeroMovies(finalHeroList));
          // The cache of the 'hero' section is written.
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          setHomeCache('hero', finalHeroList as any);
        }
      }
    } catch (err) {
      if (isMountedRef.current) {
        const filtered = filterMoviesWithValidTrailer(mockMovies as unknown as RawMovie[]);
        setFeaturedMovies(compactHeroMovies(filtered));
      }
    } finally {
      finishInitialFetch();
    }
  }, [finishInitialFetch, getHomeCache, setHomeCache]);

  /**
   * Fetches the Top 10 movies through the `HOME_SECTIONS` bundle.
   *
   * The local `mockMovies` are used as a fallback when the API returns
   * an empty list (for example on a 401).
   */
  const fetchTop10Movies = useCallback(async (): Promise<void> => {
    try {
      const top10Section = HOME_SECTIONS['top10'];
      const movies = top10Section?.load ? await top10Section.load([]) : [];
      let finalList = movies;
      if (!Array.isArray(movies) || movies.length === 0) {
        finalList = mockMovies as unknown as typeof movies;
      }
      if (isMountedRef.current && finalList.length > 0) {
        const filtered = filterMoviesWithValidTrailer(finalList);
        const compact = normalizeAndCompact(filtered.slice(0, 10));
        const normalized: RankedMovie[] = compact.map((m, idx) => ({
          ...m,
          rank: idx + 1
        }));
        setMostViewedMovies(normalized);
        // The cache is written.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setHomeCache('mostViewed', normalized as any);
        setTopMovies(compact);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setHomeCache('top10', compact as any);
      }
    } catch (err) {
      if (isMountedRef.current) {
        const filtered = filterMoviesWithValidTrailer(mockMovies as unknown as RawMovie[]);
        const normalized: RankedMovie[] = normalizeAndCompact(filtered.slice(0, 10)).map((m, idx) => ({
          ...m,
          rank: idx + 1
        }));
        setMostViewedMovies(normalized);
      }
    } finally {
      finishInitialFetch();
    }
  }, [finishInitialFetch, setHomeCache]);

  /**
   * Fetches the movie list of the home page (`page=1`, `limit=20`) on the
   * first paint, and the next pages for the infinite scroll.
   *
   * The local `mockMovies` are used as a fallback when the API returns an
   * empty list (for example a 401 "Missing Bearer token" on the
   * production deployment).
   */
  const fetchLatestMovies = useCallback(async (pageNumber = 1, isLoadMore = false): Promise<void> => {
    try {
      if (isLoadMore) {
        setLoadingMore(true);
      }

      // The first page uses the dedicated `getHomeMovies()`, which follows
      // the exact spec `GET /api/v1/movies?page=1&limit=20`. The next
      // pages reuse `getMoviesPage`, so the pagination stays continuous.
      let rawMovies = pageNumber === 1
        ? await movieService.getHomeMovies()
        : await movieService.getMoviesPage(pageNumber, 24);

      // The fallback: the backend returns an empty list or a 401, so the
      // local mock movies are used. This keeps the home page visible
      // during a maintenance of the backend authentication.
      if ((!Array.isArray(rawMovies) || rawMovies.length === 0) && pageNumber === 1) {
        rawMovies = mockMovies as unknown as RawMovie[];
      }

      if (rawMovies.length > 0 && isMountedRef.current) {
        // The movies without a valid trailer are removed BEFORE they reach
        // the rails. The home page shows a play button on every movie of
        // these lists, so a movie without a usable trailer must never
        // appear here. It would either do nothing when it is clicked, or
        // it would show a "the trailer is not available" panel for a
        // movie the user thought they could watch.
        const filteredRaw = filterMoviesWithValidTrailer(rawMovies);
        // `normalizeAndCompact` also removes the movies without a real
        // image, so the grey placeholder strip never shows on the home
        // page.
        const normalized = normalizeAndCompact(filteredRaw);

        if (pageNumber === 1) {
          setTopMovies(normalized.slice(0, 12));
          setLatestMovies(normalized);
          // The cache of the 'latest' section is written.
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          setHomeCache('latest', normalized as any);
        } else {
          setLatestMovies((prev) => [...prev, ...normalized]);
        }
      }
    } catch {
      // The current state is kept silently.
    } finally {
      if (isMountedRef.current) {
        setLoadingMore(false);
        // The requests of the first page take part in the initial loading
        // counter. The "load more" requests are tracked separately and
        // never change the initial skeleton state.
        if (pageNumber === 1) {
          finishInitialFetch();
        } else {
          setLoading(false);
        }
      }
    }
  }, [finishInitialFetch]);

  /**
   * Loads the upcoming movies lazily, on demand, with a deliberate
   * loading buffer.
   */
  const loadUpcoming = useCallback(async (): Promise<void> => {
    if (upcomingLoaded || upcomingLoading) return;
    setUpcomingLoading(true);

    const startTime = Date.now();
    const MIN_LOADING_TIME = 150;
    const MAX_TIMEOUT = 3000;

    let timeoutTriggered = false;
    const timeoutTimer: ReturnType<typeof setTimeout> = setTimeout(() => {
      timeoutTriggered = true;
    }, MAX_TIMEOUT);

    try {
      const result = await upcomingMovieService.getUpcomingMovies(1, 15) as {
        success?: boolean;
        upcomingMovies?: RawMovie[];
      };
      clearTimeout(timeoutTimer);

      if (timeoutTriggered) return;

      const elapsed = Date.now() - startTime;
      if (elapsed < MIN_LOADING_TIME) {
        await new Promise<void>((resolve) => setTimeout(resolve, MIN_LOADING_TIME - elapsed));
      }

      if (result?.success && (result.upcomingMovies?.length ?? 0) > 0 && isMountedRef.current) {
        // The same trailer aware filter as the other rails. The upcoming
        // movies also show a "watch trailer" button on their card.
        const filtered = filterMoviesWithValidTrailer(result.upcomingMovies || []);
        setUpcomingMovies(normalizeAndCompact(filtered));
      } else if (isMountedRef.current) {
        setUpcomingMovies([]);
      }
    } catch {
      clearTimeout(timeoutTimer);
      const elapsed = Date.now() - startTime;
      if (elapsed < MIN_LOADING_TIME) {
        await new Promise<void>((resolve) => setTimeout(resolve, MIN_LOADING_TIME - elapsed));
      }

      if (!timeoutTriggered && isMountedRef.current) {
        setUpcomingMovies([]);
      }
    } finally {
      if (isMountedRef.current) {
        setUpcomingLoading(false);
        setUpcomingLoaded(true);
      }
    }
  }, [upcomingLoaded, upcomingLoading]);

  /**
   * Fetches the movies of the Anime Spotlight through the `HOME_SECTIONS`
   * bundle.
   *
   * The local `mockAnimationMovies` are used as a fallback when the API
   * returns an empty list (for example on a 401).
   */
  const fetchBigSlideMovies = useCallback(async (): Promise<void> => {
    try {
      const bigSlideSection = HOME_SECTIONS['big_slide'];
      const movies = bigSlideSection?.load
        ? ((await bigSlideSection.load([])) as unknown as RawMovie[])
        : undefined;
      let finalList = movies;
      if (!Array.isArray(movies) || movies.length === 0) {
        finalList = mockAnimationMovies as unknown as RawMovie[];
      }
      if (isMountedRef.current && Array.isArray(finalList) && finalList.length > 0) {
        // The Anime Spotlight also shows a "watch trailer" button on its
        // card, so only the items with a resolvable trailer are kept.
        const filtered = filterMoviesWithValidTrailer(finalList);
        setAnimeSpotlightMovies(filtered);
        // The cache of the 'bigSlide' section is written.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setHomeCache('bigSlide', filtered as any);
      }
    } catch (err) {
      if (isMountedRef.current) {
        const filtered = filterMoviesWithValidTrailer(mockAnimationMovies as unknown as RawMovie[]);
        setAnimeSpotlightMovies(filtered);
      }
    } finally {
      finishInitialFetch();
    }
  }, [finishInitialFetch, setHomeCache]);

  // The initial fetch, run when the component is mounted. It is only
  // triggered when the initial snapshot is missing or empty.
  // A counter stored in a ref (`initialFetchesPendingRef`) is used
  // together with a hard safety timeout of 2 seconds, so the page can
  // never stay on the skeleton when one fetcher hangs. Even if the network
  // never answers, the safety net forces `loading=false` and the page
  // renders the data it already has (the mock fallback).
  //
  // The cache is checked first in the Zustand store. When every section
  // already has its cache, the fetch is skipped and `loading` is `false`
  // right away.
  useEffect(() => {
    if (initialSnapshot?.featuredMovies?.length) {
      // eslint-disable-next-line no-console

      return;
    }

    // The cache is checked first: the sections that already have a cache
    // are counted.
    const cachedHero = getHomeCache('hero');
    const cachedTop10 = getHomeCache('top10');
    const cachedBigSlide = getHomeCache('bigSlide');
    const cachedLatest = getHomeCache('latest');

    const hasAllCache = cachedHero && cachedTop10 && cachedBigSlide && cachedLatest;
    if (hasAllCache) {
      return; // `loading` is already false, because the state was
              // initialized from the cache above.
    }
    // eslint-disable-next-line no-console

    // The 4 fetches always run in parallel. The counter starts at 4 and
    // is decremented in the `finally` of each fetcher by
    // `finishInitialFetch()`. When the counter reaches 0, `loading` turns
    // off.
    initialFetchesPendingRef.current = 4;

    // The hard safety net: if the counter is still above zero after 2
    // seconds, `loading` is forced to false anyway. The `finally` of the
    // fetcher still runs when it finally answers, and it only finds the
    // counter already at zero, so it does nothing.
    if (loadingSafetyNetRef.current) clearTimeout(loadingSafetyNetRef.current);
    loadingSafetyNetRef.current = setTimeout(() => {
      if (!isMountedRef.current) return;
      if (initialFetchesPendingRef.current > 0) {
        initialFetchesPendingRef.current = 0;
        setLoading(false);
      }
    }, 2000);

    Promise.allSettled([
      fetchHeroMovies(),
      fetchTop10Movies(),
      fetchBigSlideMovies(),
      fetchLatestMovies(1, false)
    ]);
  }, [initialSnapshot, fetchHeroMovies, fetchTop10Movies, fetchBigSlideMovies, fetchLatestMovies]);

  /**
   * Loads the next batch of movies for the infinite scroll.
   *
   * The local `mockMovies` are used as a fallback, in a loop, when the API
   * returns an empty list.
   */
  const loadMore = useCallback(async (): Promise<void> => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);

    try {
      const nextPage = page + 1;
      let rawMovies = await movieService.getMoviesPage(nextPage, 24);

      if ((!Array.isArray(rawMovies) || rawMovies.length === 0) && mockMovies.length > 0) {
        // eslint-disable-next-line no-console

        // The mock movies are cycled, so the infinite scroll always has
        // data to show.
        const cycleIdx = ((nextPage - 2) * 24) % mockMovies.length;
        const cycled: RawMovie[] = [];
        for (let i = 0; i < 24; i++) {
          cycled.push(mockMovies[(cycleIdx + i) % mockMovies.length] as unknown as RawMovie);
        }
        rawMovies = cycled;
      }

      if (rawMovies && rawMovies.length > 0 && isMountedRef.current) {
        // The same trailer aware filter as the first page. Without it, the
        // infinite scroll keeps appending movies that the home page rails
        // then show a play button for, which leads to the "the trailer is
        // not available" panel on the movie detail page.
        const filteredRaw = filterMoviesWithValidTrailer(rawMovies);
        // The movies without a real image are removed, so the grey
        // placeholder strip never shows on the home page.
        const normalized = normalizeAndCompact(filteredRaw);
        setLatestMovies((prev) => [...prev, ...normalized]);
        setPage(nextPage);
      } else if (isMountedRef.current) {
        setHasMore(false);
      }
    } catch {
      if (isMountedRef.current) {
        setHasMore(false);
      }
    } finally {
      if (isMountedRef.current) {
        setLoadingMore(false);
      }
    }
  }, [page, loadingMore, hasMore]);

  return {
    featuredMovies,
    topMovies,
    mostViewedMovies,
    upcomingMovies,
    upcomingLoading,
    upcomingLoaded,
    loadUpcoming,
    animeSpotlightMovies,
    latestMovies,
    loading,
    loadingMore,
    hasMore,
    page,
    loadMore,
    fetchHeroMovies,
    fetchTop10Movies,
    fetchBigSlideMovies,
    fetchMostViewed: fetchTop10Movies
  };
};

export default useHomeData;
