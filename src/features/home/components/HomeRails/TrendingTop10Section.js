import React from 'react';
import { MovieSection } from '@/components/common/MovieSection';

/**
 * @file TrendingTop10Section.js
 * @description Preset component for 'Phim Được Xem Nhiều Nhất (TOP 10)' carousel rail.
 * Pre-configured with widescreen horizontal cards and oversized numeric rank badges (01, 02...).
 *
 * @param {Object} props
 * @param {Array<Object>} props.movies - Array of most viewed movies.
 * @param {'sm'|'md'|'lg'} [props.cardSize='md'] - Card scale preset.
 * @param {Object} [props.cardWidth] - Optional explicit width override.
 * @param {boolean} [props.loading=false] - Loading skeleton state.
 * @param {Function} [props.onPlayTrailer] - Trailer playback callback.
 */
export default function TrendingTop10Section({
  movies = [],
  cardSize = 'md',
  cardWidth,
  loading = false,
  onPlayTrailer,
  ...restProps
}) {
  return (
    <MovieSection
      title="Phim Được Xem Nhiều Nhất"
      badge="TOP 10"
      viewAllHref="/danh-sach/phim-hot"
      layout="rail"
      variant="horizontal"
      showRank={true}
      cardSize={cardSize}
      cardWidth={cardWidth}
      movies={movies}
      loading={loading}
      onPlayTrailer={onPlayTrailer}
      {...restProps}
    />
  );
}
