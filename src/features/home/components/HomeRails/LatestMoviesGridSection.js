import React from 'react';
import { MovieSection } from '@/components/common/MovieSection';

/**
 * @file LatestMoviesGridSection.js
 * @description Preset component for 'Phim Mới Cập Nhật' single-row cinema rail.
 * Enforces a single horizontal slider across all home rails, removing multi-row grid and 'Xem thêm'.
 *
 * @param {Object} props
 * @param {Array<Object>} props.movies - Array of catalogue movies.
 * @param {'sm'|'md'|'lg'} [props.cardSize='md'] - Card scale preset.
 * @param {boolean} [props.loading=false] - Initial loading state.
 * @param {Function} [props.onPlayTrailer] - Trailer playback callback.
 */
export default function LatestMoviesGridSection({
  movies = [],
  cardSize = 'md',
  loading = false,
  onPlayTrailer,
  ...restProps
}) {
  return (
    <MovieSection
      title="Phim Mới Cập Nhật"
      badge="MỚI NHẤT"
      viewAllHref="/danh-sach/phim-moi"
      viewAllText="Xem tất cả"
      layout="rail"
      variant="vertical"
      cardSize={cardSize}
      movies={movies}
      loading={loading}
      onPlayTrailer={onPlayTrailer}
      {...restProps}
    />
  );
}
