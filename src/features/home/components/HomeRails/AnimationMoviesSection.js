import React, { useState, useEffect } from 'react';
import { MovieSection } from '@/components/common/MovieSection';
import { mockAnimationMovies } from '@/mock/mockMovies';
import movieService from '@/API/services/movieService';

/**
 * @file AnimationMoviesSection.js
 * @description Preset rail component for Anime & Animation blockbusters.
 * Uses unified single-row carousel powered by MovieSection with resilient API service fetching.
 *
 * @param {Object} props
 * @param {'sm'|'md'|'lg'} [props.cardSize='md'] - Card size preset.
 * @param {Function} [props.onPlayTrailer] - Trailer playback callback.
 */
export default function AnimationMoviesSection({
  cardSize = 'md',
  onPlayTrailer
}) {
  const [animationMovies, setAnimationMovies] = useState(mockAnimationMovies);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let isSubscribed = true;

    const fetchAnimationMovies = async () => {
      try {
        setLoading(true);
        const movies = await movieService.getMoviesByCategory('hoat-hinh', 20);

        if (Array.isArray(movies) && movies.length > 0 && isSubscribed) {
          // If less than 6 items returned from search, blend with high-res mock data for a full aesthetic rail
          if (movies.length < 6) {
            const combined = [...movies, ...mockAnimationMovies.slice(movies.length)];
            setAnimationMovies(combined);
          } else {
            setAnimationMovies(movies);
          }
        }
      } catch {
        // Fallback gracefully retains verified mock data
      } finally {
        if (isSubscribed) setLoading(false);
      }
    };

    fetchAnimationMovies();

    return () => {
      isSubscribed = false;
    };
  }, []);

  return (
    <MovieSection
      title="Phim Hoạt Hình & Anime Đỉnh Cao"
      badge="ANIME & CARTOON"
      viewAllHref="/the-loai/hoat-hinh"
      layout="rail"
      variant="vertical"
      cardSize={cardSize}
      movies={animationMovies}
      loading={loading}
      onPlayTrailer={onPlayTrailer}
    />
  );
}
