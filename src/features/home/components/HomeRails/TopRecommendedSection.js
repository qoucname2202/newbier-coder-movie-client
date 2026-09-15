import React from 'react';
import { MovieSection } from '@/components/common/MovieSection';

/**
 * @file TopRecommendedSection.js
 * @description Preset component for 'Phim Đề Xuất (HOT)' carousel rail.
 * Pre-configured with cinema-grade vertical cards and accent badges.
 *
 * @param {Object} props
 * @param {Array<Object>} props.movies - Array of recommended movies.
 * @param {'sm'|'md'|'lg'} [props.cardSize='md'] - Card scale preset.
 * @param {Object} [props.cardWidth] - Optional explicit width override { desktop, tablet, mobile }.
 * @param {boolean} [props.loading=false] - Loading skeleton state.
 * @param {Function} [props.onPlayTrailer] - Trailer playback callback.
 */
export default function TopRecommendedSection({
  movies = [],
  cardSize = 'md',
  cardWidth,
  loading = false,
  onPlayTrailer,
  ...restProps
}) {
  return (
    <MovieSection
      title="Phim Đề Xuất"
      badge="HOT"
      viewAllHref="/danh-sach/phim-de-xuat"
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
