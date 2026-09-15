import React from 'react';
import SectionHeader from './SectionHeader';
import MovieCardVertical from './MovieCardVertical';
import Skeleton from '../UI/Skeleton';

/**
 * @file MovieGridSection.js
 * @description Responsive cinema poster grid for latest catalogue movies with load-more pagination.
 *
 * @param {Object} props
 * @param {string} [props.title='Phim Mới Cập Nhật'] - Section title.
 * @param {Array<Object>} props.movies - Array of movie objects to display in grid.
 * @param {boolean} [props.loading=false] - Initial loading state.
 * @param {boolean} [props.loadingMore=false] - Pagination load more state.
 * @param {boolean} [props.hasMore=true] - Whether more items exist to load.
 * @param {Function} [props.onLoadMore] - Callback to trigger next page load.
 */
export default function MovieGridSection({
  title = 'Phim Mới Cập Nhật',
  movies = [],
  loading = false,
  loadingMore = false,
  hasMore = true,
  onLoadMore
}) {
  return (
    <section className="movie-grid-section mb-5" aria-label={title}>
      <SectionHeader
        title={title}
        badge="MỚI NHẤT"
        viewAllHref="/danh-sach"
        viewAllText="Xem tất cả"
      />

      {/* Grid container */}
      <div className="row g-2 g-sm-3">
        {loading && (!movies || movies.length === 0) ? (
          [...Array(10)].map((_, i) => (
            <div
              key={`grid-skel-${i}`}
              className="col-6 col-sm-4 col-md-3 col-lg-3 col-xl-2-4 mb-3"
            >
              <div className="card h-100 bg-dark border-0">
                <Skeleton height="280px" borderRadius="8px" />
                <div className="card-body p-2">
                  <Skeleton height="18px" width="85%" />
                  <div className="mt-1">
                    <Skeleton height="14px" width="60%" />
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          movies.map((movie, index) => (
            <div
              key={movie._id || movie.slug || index}
              className="col-6 col-sm-4 col-md-3 col-lg-3 col-xl-2-4 mb-3"
            >
              <MovieCardVertical movie={movie} />
            </div>
          ))
        )}
      </div>

      {/* Load more button */}
      {hasMore && onLoadMore && (
        <div className="text-center mt-4">
          <button
            type="button"
            className="btn btn-outline-danger px-4 py-2 load-more-btn"
            onClick={onLoadMore}
            disabled={loadingMore}
          >
            {loadingMore ? (
              <span className="d-flex align-items-center gap-2">
                <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
                <span>Đang tải thêm phim...</span>
              </span>
            ) : (
              <span>Xem thêm phim</span>
            )}
          </button>
        </div>
      )}

      <style jsx global>{`
        .col-xl-2-4 {
          flex: 0 0 20%;
          max-width: 20%;
        }
        @media (max-width: 1200px) {
          .col-xl-2-4 {
            flex: 0 0 25%;
            max-width: 25%;
          }
        }
        @media (max-width: 992px) {
          .col-xl-2-4 {
            flex: 0 0 33.333333%;
            max-width: 33.333333%;
          }
        }
        @media (max-width: 576px) {
          .col-xl-2-4 {
            flex: 0 0 50%;
            max-width: 50%;
          }
        }
        .load-more-btn {
          border-radius: 24px;
          font-weight: 600;
          font-size: 0.95rem;
          transition: all 0.25s ease;
        }
        .load-more-btn:hover:not(:disabled) {
          background-color: #e50914;
          border-color: #e50914;
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(229, 9, 20, 0.4);
        }
      `}</style>
    </section>
  );
}
