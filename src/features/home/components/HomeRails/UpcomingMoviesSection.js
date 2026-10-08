import React from 'react';
import { MovieSection } from '@/components/common/MovieSection';

/**
 * @file UpcomingMoviesSection.js
 * @description Preset component for 'Phim Sắp Ra Mắt' carousel rail.
 * Pre-configured with vertical cards and 'SẮP CHIẾU' accent badges.
 *
 * @param {Object} props
 * @param {Array<Object>} props.movies - Array of upcoming movies.
 * @param {'sm'|'md'|'lg'} [props.cardSize='md'] - Card scale preset.
 * @param {Object} [props.cardWidth] - Optional explicit width override.
 * @param {boolean} [props.loading=false] - Loading skeleton state.
 * @param {Function} [props.onPlayTrailer] - Trailer playback callback.
 */
export default function UpcomingMoviesSection({
  movies = [],
  cardSize = 'md',
  cardWidth,
  loading = false,
  onPlayTrailer,
  ...restProps
}) {
  return (
    <MovieSection
      title="Phim Sắp Ra Mắt"
      badge="SẮP CHIẾU"
      viewAllHref="/danh-sach/phim-sap-chieu"
      layout="rail"
      variant="vertical"
      cardSize={cardSize}
      cardWidth={cardWidth}
      movies={movies}
      loading={loading}
      onPlayTrailer={onPlayTrailer}
      {...restProps}
    />
  );
}
