import React, { useState, useEffect } from 'react';
// MovieSection is currently a .js module, so we cast it to a typed component
// to satisfy strict TypeScript checks until the component itself is migrated.
import { MovieSection as MovieSectionRaw } from '@/features/shared/components/MovieSection';
const MovieSection = MovieSectionRaw as unknown as React.FC<Record<string, unknown>>;

/**
 * @file AnimationMoviesSection.tsx
 * @description Preset rail component for Anime & Animation blockbusters.
 * Completely config-driven via section props from homeSectionsConfig.
 */

export interface AnimationMoviesSectionProps {
  cardSize?: 'sm' | 'md' | 'lg';
  title?: string;
  badge?: string;
  viewAllHref?: string;
  load?: (fallback?: unknown[]) => Promise<unknown[]>;
  onPlayTrailer?: (movie: Record<string, unknown>) => void;
}

const AnimationMoviesSection: React.FC<AnimationMoviesSectionProps> = ({
  cardSize = 'md',
  title = 'Phim Hoạt Hình & Anime',
  badge = 'ANIME & CARTOON',
  viewAllHref = '/genre/hoat-hinh',
  load,
  onPlayTrailer
}) => {
  const [animationMovies, setAnimationMovies] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let isSubscribed = true;

    const fetchAnimationMovies = async (): Promise<void> => {
      try {
        setLoading(true);
        const movies = typeof load === 'function' ? await load([]) : [];

        if (Array.isArray(movies) && isSubscribed) {
          setAnimationMovies(movies as Record<string, unknown>[]);
        }
      } catch {
        if (isSubscribed) setAnimationMovies([]);
      } finally {
        if (isSubscribed) setLoading(false);
      }
    };

    fetchAnimationMovies();

    return () => {
      isSubscribed = false;
    };
  }, [load]);

  return (
    <MovieSection
      title={title}
      badge={badge}
      viewAllHref={viewAllHref}
      layout="rail"
      variant="vertical"
      cardSize={cardSize}
      movies={animationMovies}
      loading={loading}
      onPlayTrailer={onPlayTrailer}
    />
  );
};

export default AnimationMoviesSection;
