import React, { useState, useEffect } from 'react';
import { MovieSection } from '@/components/common/MovieSection';
import { mockAnimationMovies } from '@/mock/mockMovies';
import { MOVIE_CONFIG } from '@/config/movieConfig';

const API_BASE = MOVIE_CONFIG.apiBaseUrl;

/**
 * @file AnimationMoviesSection.js
 * @description Preset rail component for Anime & Animation blockbusters.
 * Uses unified single-row carousel powered by MovieSection.
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
        // Try fetching animation/anime category or search
        const res = await fetch(`${API_BASE}/movies?category=hoat-hinh&page=1&limit=20`);
        if (!res.ok) throw new Error('Failed to fetch animation movies');
        const data = await res.json();
        const movies = data?.data?.movies || data?.movies || [];

        if (movies.length > 0 && isSubscribed) {
          setAnimationMovies(movies);
        }
      } catch (err) {
        // Fallback gracefully to high-res mock data
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
