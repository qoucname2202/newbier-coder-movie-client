/**
 * @file src/utils/watchProgress.js
 * @description Local watch progress manager. Persists last watched episode,
 * server index, and timestamp per movie slug to allow instant resume
 * and proximity episode navigation.
 */

const STORAGE_PREFIX = 'movie_watch_progress_';
const RECENT_LIST_KEY = 'movie_recent_watches';
const MAX_RECENT_ITEMS = 50;

/**
 * Safe localStorage check for SSR environments
 */
const isBrowser = () => typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';

/**
 * Saves watch progress for a movie.
 * @param {string} slug - Movie slug.
 * @param {Object} data - Watch progress data.
 * @param {number} [data.serverIndex=0] - Active server index.
 * @param {number} [data.episodeIndex=0] - Active episode index.
 * @param {string} [data.epSlug] - Slug of active episode.
 * @param {string} [data.epName] - Display name of active episode.
 * @param {string} [data.movieName] - Name of the movie.
 * @param {string} [data.posterUrl] - Poster URL of the movie.
 */
export function saveWatchProgress(slug, data) {
  if (!isBrowser() || !slug) return;

  try {
    const payload = {
      slug,
      serverIndex: Number(data.serverIndex) || 0,
      episodeIndex: Number(data.episodeIndex) || 0,
      epSlug: data.epSlug || '',
      epName: data.epName || '',
      movieName: data.movieName || '',
      posterUrl: data.posterUrl || '',
      updatedAt: Date.now()
    };

    // Save individual movie progress
    window.localStorage.setItem(`${STORAGE_PREFIX}${slug}`, JSON.stringify(payload));

    // Update recent watch list
    try {
      const rawRecent = window.localStorage.getItem(RECENT_LIST_KEY);
      let recentList = rawRecent ? JSON.parse(rawRecent) : [];
      if (!Array.isArray(recentList)) recentList = [];

      // Filter out existing entry for this slug
      recentList = recentList.filter((item) => item.slug !== slug);
      // Prepend newest
      recentList.unshift(payload);
      if (recentList.length > MAX_RECENT_ITEMS) {
        recentList = recentList.slice(0, MAX_RECENT_ITEMS);
      }
      window.localStorage.setItem(RECENT_LIST_KEY, JSON.stringify(recentList));
    } catch {
      // Ignore recent list errors
    }

    // Dispatch event for reactive updates across components
    window.dispatchEvent(
      new CustomEvent('watchProgressUpdated', {
        detail: { slug, payload }
      })
    );
  } catch {
    // Silent fallback
  }
}

/**
 * Retrieves saved watch progress for a specific movie slug.
 * @param {string} slug - Movie slug.
 * @returns {Object|null} Saved progress object or null.
 */
export function getWatchProgress(slug) {
  if (!isBrowser() || !slug) return null;

  try {
    const raw = window.localStorage.getItem(`${STORAGE_PREFIX}${slug}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object') {
      return parsed;
    }
  } catch {
    return null;
  }
  return null;
}

/**
 * Removes saved progress for a movie slug.
 * @param {string} slug - Movie slug.
 */
export function removeWatchProgress(slug) {
  if (!isBrowser() || !slug) return;
  try {
    window.localStorage.removeItem(`${STORAGE_PREFIX}${slug}`);
  } catch {
    // Ignore errors
  }
}
