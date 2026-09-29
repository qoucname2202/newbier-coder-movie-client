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

/**
 * Retrieves all recent watch records from localStorage.
 * @returns {Array<Object>} List of recent watch items.
 */
export function getAllRecentWatches() {
  if (!isBrowser()) return [];
  try {
    const raw = window.localStorage.getItem(RECENT_LIST_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * Removes an entry from recent watch list and deletes its stored progress.
 * @param {string} slug - Movie slug.
 */
export function removeRecentWatch(slug) {
  if (!isBrowser() || !slug) return;
  try {
    removeWatchProgress(slug);
    const list = getAllRecentWatches().filter((item) => item.slug !== slug);
    window.localStorage.setItem(RECENT_LIST_KEY, JSON.stringify(list));
    window.dispatchEvent(new CustomEvent('watchProgressUpdated', { detail: { slug, removed: true } }));
  } catch {
    // Ignore errors
  }
}

/**
 * Clears all recent watch history from localStorage.
 */
export function clearAllRecentWatches() {
  if (!isBrowser()) return;
  try {
    const list = getAllRecentWatches();
    list.forEach((item) => {
      if (item.slug) {
        removeWatchProgress(item.slug);
      }
    });
    window.localStorage.removeItem(RECENT_LIST_KEY);
    window.dispatchEvent(new CustomEvent('watchProgressUpdated', { detail: { clearedAll: true } }));
  } catch {
    // Ignore errors
  }
}

const PINNED_PREFIX = 'movie_pinned_ep_';

/**
 * Retrieves the pinned episode for a movie slug.
 * @param {string} slug - Movie slug.
 * @returns {Object|null} Pinned episode details or null.
 */
export function getPinnedEpisode(slug) {
  if (!isBrowser() || !slug) return null;
  try {
    const raw = window.localStorage.getItem(`${PINNED_PREFIX}${slug}`);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/**
 * Sets the pinned episode for a movie slug.
 * @param {string} slug - Movie slug.
 * @param {Object} data - Pinned episode data (episodeIndex, epSlug, epName, serverIndex).
 */
export function setPinnedEpisode(slug, data) {
  if (!isBrowser() || !slug) return;
  try {
    window.localStorage.setItem(`${PINNED_PREFIX}${slug}`, JSON.stringify(data));
    window.dispatchEvent(new CustomEvent('pinnedEpisodeChanged', { detail: { slug, data } }));
  } catch {
    // Ignore errors
  }
}

/**
 * Removes the pinned episode for a movie slug.
 * @param {string} slug - Movie slug.
 */
export function removePinnedEpisode(slug) {
  if (!isBrowser() || !slug) return;
  try {
    window.localStorage.removeItem(`${PINNED_PREFIX}${slug}`);
    window.dispatchEvent(new CustomEvent('pinnedEpisodeChanged', { detail: { slug, data: null } }));
  } catch {
    // Ignore errors
  }
}

/**
 * Toggles the pinned episode for a movie.
 * If currently pinned to this episodeIndex, unpins it. Otherwise pins it.
 * @param {string} slug - Movie slug.
 * @param {Object} data - Pinned episode data.
 * @returns {boolean} True if now pinned, false if unpinned.
 */
export function togglePinnedEpisode(slug, data) {
  if (!isBrowser() || !slug) return false;
  const current = getPinnedEpisode(slug);
  if (current && current.episodeIndex === data.episodeIndex) {
    removePinnedEpisode(slug);
    return false;
  }
  setPinnedEpisode(slug, data);
  return true;
}

