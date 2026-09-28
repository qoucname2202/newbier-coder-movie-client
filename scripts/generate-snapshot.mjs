/**
 * @file scripts/generate-snapshot.mjs
 * @description Offline & Cold-Start Snapshot Generator for Dashboard.
 * Strictly reads API URL from environment variables (.env.local or process.env).
 * Zero hardcoded backend URLs in code.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read .env.local if running standalone
try {
  const envPath = path.resolve(__dirname, '../.env.local');
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf-8').split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx !== -1) {
        const key = trimmed.slice(0, eqIdx).trim();
        const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '');
        if (!process.env[key]) {
          process.env[key] = val;
        }
      }
    }
  }
} catch {
  // Silent ignore
}

const API_BASE = (process.env.NEXT_PUBLIC_CORE_API_URL || process.env.NEXT_PUBLIC_API_URL || '').replace(/\/+$/, '');
const OUTPUT_DIR = path.resolve(__dirname, '../public/data');
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'dashboard-snapshot.json');

async function safeFetchJson(endpoint) {
  if (!API_BASE) return null;
  try {
    const url = `${API_BASE}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
    const res = await fetch(url, { headers: { Accept: 'application/json' } });
    if (!res.ok) return null;
    const data = await res.json();
    return data.responseData?.data || data.responseData || data.data?.movies || data.data || data.movies || data;
  } catch {
    return null;
  }
}

async function run() {
  if (!API_BASE) {
    console.error('[Snapshot] Error: NEXT_PUBLIC_CORE_API_URL is missing in environment.');
    process.exit(1);
  }

  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  // 1. Fetch dashboard sections in parallel
  const [latestList, trendingList, topRatedList, seriesList] = await Promise.all([
    safeFetchJson('/movies/latest'),
    safeFetchJson('/movies/trending'),
    safeFetchJson('/movies/top-rated'),
    safeFetchJson('/formats/series/movies?page=1&limit=15')
  ]);

  const featured = Array.isArray(latestList) ? latestList.slice(0, 6) : [];
  const top10 = Array.isArray(trendingList) ? trendingList.slice(0, 10) : [];
  const latest = Array.isArray(latestList) ? latestList.slice(0, 24) : [];
  const topRated = Array.isArray(topRatedList) ? topRatedList.slice(0, 12) : [];
  const animeOrSeries = Array.isArray(seriesList) ? seriesList.slice(0, 10) : [];

  // 2. Fetch full detail (with episodes & stream links) for key movies
  const slugsToFetch = new Set();
  featured.forEach((m) => m?.slug && slugsToFetch.add(m.slug));
  top10.forEach((m) => m?.slug && slugsToFetch.add(m.slug));
  latest.slice(0, 8).forEach((m) => m?.slug && slugsToFetch.add(m.slug));

  const moviesDetail = {};

  await Promise.all(
    Array.from(slugsToFetch).map(async (slug) => {
      const detail = await safeFetchJson(`/movies/${slug}`);
      if (detail && (detail.slug || detail._id)) {
        moviesDetail[slug] = detail;
      }
    })
  );

  const snapshot = {
    version: '1.0',
    generatedAt: new Date().toISOString(),
    dashboard: {
      featuredMovies: featured,
      topMovies: topRated.length > 0 ? topRated : latest.slice(0, 12),
      mostViewedMovies: top10.map((m, idx) => ({ ...m, rank: idx + 1 })),
      latestMovies: latest,
      animeSpotlightMovies: animeOrSeries
    },
    moviesDetail
  };

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(snapshot, null, 2), 'utf-8');
}

run().catch((err) => {
  console.error('[Snapshot] Failed:', err?.message);
  process.exit(1);
});
