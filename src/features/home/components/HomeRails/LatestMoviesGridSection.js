import React from 'react';
import { MovieSection } from '@/components/common/MovieSection';

/**
 * @file LatestMoviesGridSection.js
 * @description Preset component for 'Phim Mới Cập Nhật' responsive cinema grid with pagination.
 * Pre-configured with multi-column layout and 'Xem thêm' load more button.
 *
 * @param {Object} props
 * @param {Array<Object>} props.movies - Array of catalogue movies.
 * @param {number} [props.columns=5] - Number of grid columns on desktop (4, 5, or 6).
 * @param {boolean} [props.loading=false] - Initial loading state.
 * @param {boolean} [props.loadingMore=false] - Pagination loading state.
 * @param {boolean} [props.hasMore=false] - Whether more movies exist to load.
 * @param {Function} [props.onLoadMore] - Callback to fetch next page.
 */
export default function LatestMoviesGridSection({
  movies = [],
  columns = 5,
  loading = false,
  loadingMore = false,
  hasMore = false,
  onLoadMore,
  ...restProps
}) {
  return (
    <MovieSection
      title="Phim Mới Cập Nhật"
      badge="MỚI NHẤT"
      viewAllHref="/danh-sach"
      layout="grid"
      variant="vertical"
      columns={columns}
      movies={movies}
      loading={loading}
      loadingMore={loadingMore}
      hasMore={hasMore}
      onLoadMore={onLoadMore}
      {...restProps}
    />
  );
}
