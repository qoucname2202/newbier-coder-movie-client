/**
 * @file src/utils/dashboardSnapshot.js
 * @description Centralized Snapshot & ISR Data Manager for Dashboard & Movies.
 * Supports Next.js ISR (Incremental Static Regeneration), local static snapshot fallback,
 * and resilient offline/cold-start streaming data resolution.
 * Toggleable via NEXT_PUBLIC_ENABLE_HOMEPAGE_SNAPSHOT environment variable.
 */

/**
 * Checks whether homepage snapshot / ISR caching mechanism is enabled.
 * Controlled via NEXT_PUBLIC_ENABLE_HOMEPAGE_SNAPSHOT in .env.local
 * @returns {boolean}
 */
export function isHomepageSnapshotEnabled() {
  const envVal = process.env.NEXT_PUBLIC_ENABLE_HOMEPAGE_SNAPSHOT ?? process.env.ENABLE_HOMEPAGE_SNAPSHOT;
  return envVal === 'true';
}

const DEFAULT_SNAPSHOT_STRUCTURE = {
  version: '1.0',
  generatedAt: null,
  dashboard: {
    featuredMovies: [],
    topMovies: [],
    mostViewedMovies: [],
    latestMovies: [],
    animeSpotlightMovies: []
  },
  moviesDetail: {}
};

let cachedSnapshot = null;

function loadSnapshotFromDisk() {
  if (cachedSnapshot) return cachedSnapshot;
  if (!isHomepageSnapshotEnabled()) return null;

  if (typeof window === 'undefined') {
    try {
      const fs = require('fs');
      const path = require('path');
      const snapshotPath = path.join(process.cwd(), 'public', 'data', 'dashboard-snapshot.json');
      if (fs.existsSync(snapshotPath)) {
        cachedSnapshot = JSON.parse(fs.readFileSync(snapshotPath, 'utf8'));
        return cachedSnapshot;
      }
    } catch {
      // Fallback cleanly
    }
  }

  return null;
}

/**
 * Returns static pre-built snapshot fallback
 */
export function getLocalSnapshot() {
  if (!isHomepageSnapshotEnabled()) return null;
  return loadSnapshotFromDisk() || DEFAULT_SNAPSHOT_STRUCTURE;
}

/**
 * Fetches snapshot via HTTP (works in client browser or edge)
 */
export async function getClientSnapshot() {
  if (!isHomepageSnapshotEnabled()) return null;

  if (typeof window === 'undefined') {
    return loadSnapshotFromDisk();
  }

  try {
    const res = await fetch(`/data/dashboard-snapshot.json?t=${Math.floor(Date.now() / 60000)}`, {
      cache: 'default'
    });
    if (res.ok) {
      return await res.json();
    }
  } catch {
    // Silent fallback
  }
  return null;
}

/**
 * Server-side ISR fetcher called inside getStaticProps.
 * Strictly reads API_BASE from environment variables without hardcoded fallbacks.
 * Attempts to load fresh data from API with a safe timeout;
 * falls back to pre-built snapshot if backend is asleep or unreachable.
 * If NEXT_PUBLIC_ENABLE_HOMEPAGE_SNAPSHOT is false, returns null immediately.
 */
export async function getDashboardDataForISR() {
  if (!isHomepageSnapshotEnabled()) {
    return null;
  }

  const fallback = loadSnapshotFromDisk() || DEFAULT_SNAPSHOT_STRUCTURE;
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

  // Fallback to pre-built snapshot if available and enabled
  if (fallback?.dashboard && fallback?.generatedAt) {
    return {
      ...fallback.dashboard,
      moviesDetail: fallback.moviesDetail || {},
      source: 'disk_snapshot',
      generatedAt: fallback.generatedAt || new Date().toISOString()
    };
  }

  return null;
}
