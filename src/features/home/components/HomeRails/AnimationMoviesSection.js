import React, { useState, useEffect } from 'react';
import { MovieSection } from '@/components/common/MovieSection';

/**
 * @file AnimationMoviesSection.js
 * @description Preset rail component for Anime & Animation blockbusters.
 * Completely config-driven via section props from homeSectionsConfig.
 *
 * @param {Object} props
 * @param {'sm'|'md'|'lg'} [props.cardSize='md'] - Card size preset.
 * @param {string} [props.title] - Section title
 * @param {string} [props.badge] - Badge label
 * @param {string} [props.viewAllHref] - Target URL for view all link
 * @param {Function} [props.load] - Custom loader function from config
 * @param {Function} [props.onPlayTrailer] - Trailer playback callback.
 */
export default function AnimationMoviesSection({
  cardSize = 'md',
  title = 'Phim Hoạt Hình & Anime Đỉnh Cao',
  badge = 'ANIME & CARTOON',
  viewAllHref = '/the-loai/hoat-hinh',
  load,
  onPlayTrailer
}) {
  const [animationMovies, setAnimationMovies] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isSubscribed = true;

    const fetchAnimationMovies = async () => {
      try {
        setLoading(true);
        const movies = typeof load === 'function' ? await load([]) : [];

        if (Array.isArray(movies) && isSubscribed) {
          setAnimationMovies(movies);
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
}
