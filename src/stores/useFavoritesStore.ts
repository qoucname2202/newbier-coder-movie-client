/**
 * @file useFavoritesStore.ts
 * @description Centralized Zustand store for user favorite movies.
 * Keeps favorite state reactive and synchronized across MovieCard, MovieHeroHeader, and Favorites page.
 */

import { create } from 'zustand';
import favoritesService, { type FavoriteMovie, type FavoriteMovieInput } from '@/API/services/favoritesService';
import { getStoredAccessToken } from '@/API/services/authService';

const LOCAL_FAVORITE_SLUGS_KEY = 'c_fav_slugs';

const readCachedSlugs = (): string[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(LOCAL_FAVORITE_SLUGS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const saveCachedSlugs = (slugs: string[]): void => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LOCAL_FAVORITE_SLUGS_KEY, JSON.stringify(slugs));
  } catch {
    // Ignore storage quota errors
  }
};

export interface FavoritesState {
  favorites: FavoriteMovie[];
  favoriteSlugs: string[];
  loading: boolean;
  initialized: boolean;
  fetchFavorites: (page?: number, limit?: number) => Promise<FavoriteMovie[]>;
  isFavorite: (slug: string) => boolean;
  addFavorite: (movie: FavoriteMovieInput) => Promise<boolean>;
  removeFavorite: (slug: string) => Promise<boolean>;
  toggleFavorite: (movie: FavoriteMovieInput) => Promise<boolean>;
  syncWithEvent: (slug: string, isFav: boolean) => void;
}

export const useFavoritesStore = create<FavoritesState>((set, get) => {
  // Listen to window event for cross-component sync
  if (typeof window !== 'undefined') {
    window.addEventListener('favorites_changed', ((e: CustomEvent<{ slug: string; isFavorite: boolean }>) => {
      const { slug, isFavorite } = e.detail || {};
      if (slug) {
        get().syncWithEvent(slug, isFavorite);
      }
    }) as EventListener);
  }

  return {
    favorites: [],
    favoriteSlugs: readCachedSlugs(),
    loading: false,
    initialized: false,

    isFavorite: (slug: string): boolean => {
      if (!slug) return false;
      return get().favoriteSlugs.includes(slug);
    },

    syncWithEvent: (slug: string, isFav: boolean) => {
      const current = get().favoriteSlugs;
      let nextSlugs: string[];
      if (isFav) {
        nextSlugs = current.includes(slug) ? current : [...current, slug];
      } else {
        nextSlugs = current.filter((s) => s !== slug);
      }
      saveCachedSlugs(nextSlugs);
      set((state) => ({
        favoriteSlugs: nextSlugs,
        favorites: isFav
          ? state.favorites
          : state.favorites.filter((m) => m.slug !== slug && m.id !== slug)
      }));
    },

    fetchFavorites: async (page = 1, limit = 50): Promise<FavoriteMovie[]> => {
      const token = typeof window !== 'undefined' ? getStoredAccessToken() : null;
      if (!token) {
        set({ favorites: [], favoriteSlugs: [], loading: false, initialized: true });
        saveCachedSlugs([]);
        return [];
      }

      set({ loading: true });
      try {
        const list = await favoritesService.getFavorites(page, limit);
        const slugs = list
          .map((m) => m.slug || '')
          .filter((s): s is string => Boolean(s));

        saveCachedSlugs(slugs);
        set({
          favorites: list,
          favoriteSlugs: slugs,
          loading: false,
          initialized: true
        });
        return list;
      } catch (err) {
        set({ loading: false, initialized: true });
        return [];
      }
    },

    addFavorite: async (movie: FavoriteMovieInput): Promise<boolean> => {
      const slug = movie.slug;
      if (!slug) return false;

      // Optimistic update
      const prevSlugs = get().favoriteSlugs;
      const nextSlugs = prevSlugs.includes(slug) ? prevSlugs : [...prevSlugs, slug];
      saveCachedSlugs(nextSlugs);
      set({ favoriteSlugs: nextSlugs });

      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('favorites_changed', { detail: { slug, isFavorite: true } })
        );
      }

      try {
        const res = await favoritesService.addToFavorites(movie);
        if (!res.success && !res.alreadyExists) {
          // Rollback on failure
          saveCachedSlugs(prevSlugs);
          set({ favoriteSlugs: prevSlugs });
          if (typeof window !== 'undefined') {
            window.dispatchEvent(
              new CustomEvent('favorites_changed', { detail: { slug, isFavorite: false } })
            );
          }
          return false;
        }
        return true;
      } catch {
        saveCachedSlugs(prevSlugs);
        set({ favoriteSlugs: prevSlugs });
        return false;
      }
    },

    removeFavorite: async (slug: string): Promise<boolean> => {
      if (!slug) return false;

      // Optimistic update
      const prevSlugs = get().favoriteSlugs;
      const prevFavorites = get().favorites;
      const nextSlugs = prevSlugs.filter((s) => s !== slug);
      saveCachedSlugs(nextSlugs);
      set({
        favoriteSlugs: nextSlugs,
        favorites: prevFavorites.filter((m) => m.slug !== slug && m.id !== slug)
      });

      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('favorites_changed', { detail: { slug, isFavorite: false } })
        );
      }

      try {
        const res = await favoritesService.removeFromFavorites(slug, slug);
        if (!res.success) {
          // Rollback on failure
          saveCachedSlugs(prevSlugs);
          set({ favoriteSlugs: prevSlugs, favorites: prevFavorites });
          if (typeof window !== 'undefined') {
            window.dispatchEvent(
              new CustomEvent('favorites_changed', { detail: { slug, isFavorite: true } })
            );
          }
          return false;
        }
        return true;
      } catch {
        saveCachedSlugs(prevSlugs);
        set({ favoriteSlugs: prevSlugs, favorites: prevFavorites });
        return false;
      }
    },

    toggleFavorite: async (movie: FavoriteMovieInput): Promise<boolean> => {
      const slug = movie.slug;
      if (!slug) return false;
      const isFav = get().isFavorite(slug);
      if (isFav) {
        return await get().removeFavorite(slug);
      } else {
        return await get().addFavorite(movie);
      }
    }
  };
});

export default useFavoritesStore;

