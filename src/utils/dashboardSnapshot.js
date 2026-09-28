/**
 * @file src/utils/dashboardSnapshot.js
 * @description Centralized Snapshot & ISR Data Manager for Dashboard & Movies.
 * Supports Next.js ISR (Incremental Static Regeneration), local static snapshot fallback,
 * and resilient offline/cold-start streaming data resolution.
 */

import snapshotJson from '../../public/data/dashboard-snapshot.json';

/**
 * Returns static pre-built snapshot fallback
 */
export function getLocalSnapshot() {
  return snapshotJson || null;
}

/**
 * Fetches snapshot via HTTP (works in client browser or edge)
 */
export async function getClientSnapshot() {
  if (typeof window === 'undefined') {
    return snapshotJson;
  }

  try {
    const res = await fetch(`/data/dashboard-snapshot.json?t=${Math.floor(Date.now() / 60000)}`, {
      cache: 'default'
    });
    if (res.ok) {
      return await res.json();
    }
  } catch {
    // Silent fallback to bundled snapshot
  }
  return snapshotJson;
}

/**
 * Server-side ISR fetcher called inside getStaticProps.
 * Strictly reads API_BASE from environment variables without hardcoded fallbacks.
 * Attempts to load fresh data from API with a safe timeout;
 * falls back to pre-built snapshot if backend is asleep or unreachable.
 */
export async function getDashboardDataForISR() {
  const fallback = snapshotJson;
  const API_BASE = (process.env.NEXT_PUBLIC_CORE_API_URL || process.env.NEXT_PUBLIC_API_URL || '').replace(/\/+$/, '');

  if (API_BASE) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 6000); // 6s safe timeout

      const fetchEndpoint = async (ep) => {
        try {
          const res = await fetch(`${API_BASE}${ep}`, {
            signal: controller.signal,
            headers: { Accept: 'application/json' }
          });
          if (!res.ok) return [];
          const json = await res.json();
          return json.responseData?.data || json.responseData || json.data?.movies || json.data || json.movies || [];
        } catch {
          return [];
        }
      };

      const [latest, trending, topRated] = await Promise.all([
        fetchEndpoint('/movies/latest'),
        fetchEndpoint('/movies/trending'),
        fetchEndpoint('/movies/top-rated')
      ]);

      clearTimeout(timeout);

      const hasLiveData = Array.isArray(latest) && latest.length > 0;

      if (hasLiveData) {
        const featured = latest.slice(0, 6);
        const top10 = Array.isArray(trending) && trending.length > 0 ? trending.slice(0, 10) : latest.slice(0, 10);
        const mostViewed = top10.map((m, idx) => ({ ...m, rank: idx + 1 }));
        const topMovies = Array.isArray(topRated) && topRated.length > 0 ? topRated.slice(0, 12) : latest.slice(0, 12);

        return {
          featuredMovies: featured,
          topMovies,
          mostViewedMovies: mostViewed,
          latestMovies: latest.slice(0, 24),
          animeSpotlightMovies: fallback?.dashboard?.animeSpotlightMovies || [],
          moviesDetail: fallback?.moviesDetail || {},
          source: 'live_api',
          generatedAt: new Date().toISOString()
        };
      }
    } catch {
      // Quietly fall back to bundled snapshot without polluting console
    }
  }

  // Fallback to pre-built snapshot
  if (fallback?.dashboard) {
    return {
      ...fallback.dashboard,
      moviesDetail: fallback.moviesDetail || {},
      source: 'disk_snapshot',
      generatedAt: fallback.generatedAt || new Date().toISOString()
    };
  }

  return null;
}
