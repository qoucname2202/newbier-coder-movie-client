import React, { useState, useEffect } from 'react';
import Slider from 'react-slick';
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import SectionHeader from './SectionHeader';
import MovieCardVertical from '../MovieCard/MovieCardVertical';
import MovieCardHorizontal from '../MovieCard/MovieCardHorizontal';
import Skeleton from '@/components/UI/Skeleton';
import styles from '@/styles/MovieCategory.module.css';

/**
 * Custom Next Arrow for Slider
 */
const NextArrow = ({ onClick }) => (
  <button
    type="button"
    className="slick-custom-arrow slick-custom-next"
    onClick={onClick}
    aria-label="Xem tiếp"
  >
    <i className="fas fa-chevron-right" />
    <style jsx>{`
      .slick-custom-arrow {
        position: absolute;
        top: 50%;
        transform: translateY(-50%);
        right: -8px;
        z-index: 10;
        width: 38px;
        height: 38px;
        border-radius: 50%;
        background: rgba(15, 18, 24, 0.88);
        color: #ffffff;
        border: 1px solid rgba(255, 255, 255, 0.18);
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: all 0.25s ease;
        box-shadow: 0 4px 14px rgba(0, 0, 0, 0.6);
        backdrop-filter: blur(8px);
      }
      .slick-custom-arrow:hover {
        background: #e50914;
        border-color: #e50914;
        transform: translateY(-50%) scale(1.12);
        box-shadow: 0 6px 20px rgba(229, 9, 20, 0.4);
      }
      @media (max-width: 768px) {
        .slick-custom-arrow {
          display: none !important;
        }
      }
    `}</style>
  </button>
);

/**
 * Custom Prev Arrow for Slider
 */
const PrevArrow = ({ onClick }) => (
  <button
    type="button"
    className="slick-custom-arrow slick-custom-prev"
    onClick={onClick}
    aria-label="Quay lại"
  >
    <i className="fas fa-chevron-left" />
    <style jsx>{`
      .slick-custom-arrow {
        position: absolute;
        top: 50%;
        transform: translateY(-50%);
        left: -8px;
        z-index: 10;
        width: 38px;
        height: 38px;
        border-radius: 50%;
        background: rgba(15, 18, 24, 0.88);
        color: #ffffff;
        border: 1px solid rgba(255, 255, 255, 0.18);
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: all 0.25s ease;
        box-shadow: 0 4px 14px rgba(0, 0, 0, 0.6);
        backdrop-filter: blur(8px);
      }
      .slick-custom-arrow:hover {
        background: #e50914;
        border-color: #e50914;
        transform: translateY(-50%) scale(1.12);
        box-shadow: 0 6px 20px rgba(229, 9, 20, 0.4);
      }
      @media (max-width: 768px) {
        .slick-custom-arrow {
          display: none !important;
        }
      }
    `}</style>
  </button>
);

/**
 * @file MovieSection.js
 * @description Master Base Component supporting both original slick Carousel and Responsive Grid.
 * Preserves 100% original card typography, badges, gradients, and carousel sliding physics.
 *
 * @param {Object} props
 * @param {'rail'|'grid'} [props.layout='rail'] - Display layout ('rail' for Carousel, 'grid' for Catalogue).
 * @param {'vertical'|'horizontal'} [props.variant='vertical'] - Card presentation style.
 * @param {number} [props.columns=5] - Columns for grid layout.
 * @param {string} props.title - Section title.
 * @param {string} [props.badge] - Category accent badge.
 * @param {React.ReactNode} [props.icon] - Optional heading icon.
 * @param {string} [props.viewAllHref] - URL for "Xem tất cả".
 * @param {string} [props.viewAllText='Xem tất cả'] - Label for view all link.
 * @param {Array<Object>} props.movies - Array of movie objects.
 * @param {boolean} [props.loading=false] - Initial loading state.
 * @param {boolean} [props.loadingMore=false] - Load more state.
 * @param {boolean} [props.hasMore=false] - Whether more items exist to load.
 * @param {Function} [props.onLoadMore] - Callback to load more items.
 * @param {string} [props.className=""] - Additional class name.
 */
export default function MovieSection({
  layout = 'rail',
  variant = 'vertical',
  columns = 5,
  title,
  badge,
  icon,
  viewAllHref,
  viewAllText = 'Xem tất cả',
  movies = [],
  loading = false,
  loadingMore = false,
  hasMore = false,
  onLoadMore,
  onPlayTrailer,
  className = ""
}) {
  const [mounted, setMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const sliderRef = React.useRef(null);

  useEffect(() => {
    setMounted(true);
    if (typeof window !== 'undefined') {
      const handleResize = () => {
        setIsMobile(window.innerWidth < 768);
      };
      handleResize();
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, []);

  const isGrid = layout === 'grid';
  const isHorizontal = variant === 'horizontal';

  // Vertical Card Carousel Settings
  const verticalSettings = {
    dots: false,
    infinite: false,
    speed: 400,
    slidesToShow: mounted && isMobile ? 1.85 : 5.5,
    slidesToScroll: 1,
    swipeToSlide: true,
    draggable: true,
    nextArrow: <NextArrow />,
    prevArrow: <PrevArrow />,
    responsive: [
      {
        breakpoint: 1200,
        settings: { slidesToShow: 4.5, slidesToScroll: 2 }
      },
      {
        breakpoint: 992,
        settings: { slidesToShow: 3.5, slidesToScroll: 2 }
      },
      {
        breakpoint: 768,
        settings: { slidesToShow: 2.3, slidesToScroll: 1, arrows: false }
      },
      {
        breakpoint: 576,
        settings: { slidesToShow: 1.85, slidesToScroll: 1, arrows: false }
      },
      {
        breakpoint: 400,
        settings: { slidesToShow: 1.6, slidesToScroll: 1, arrows: false }
      }
    ]
  };

  // Horizontal Card Carousel Settings (Top 10)
  const horizontalSettings = {
    dots: false,
    infinite: false,
    speed: 400,
    slidesToShow: mounted && isMobile ? 1.3 : 3.5,
    slidesToScroll: 1,
    swipeToSlide: true,
    draggable: true,
    nextArrow: <NextArrow />,
    prevArrow: <PrevArrow />,
    responsive: [
      {
        breakpoint: 1200,
        settings: { slidesToShow: 3, slidesToScroll: 2 }
      },
      {
        breakpoint: 992,
        settings: { slidesToShow: 2.5, slidesToScroll: 1 }
      },
      {
        breakpoint: 768,
        settings: { slidesToShow: 1.8, slidesToScroll: 1, arrows: false }
      },
      {
        breakpoint: 576,
        settings: { slidesToShow: 1.35, slidesToScroll: 1, arrows: false }
      },
      {
        breakpoint: 400,
        settings: { slidesToShow: 1.25, slidesToScroll: 1, arrows: false }
      }
    ]
  };

  const currentSettings = isHorizontal ? horizontalSettings : verticalSettings;

  if (!loading && (!movies || movies.length === 0)) {
    return null;
  }

  return (
    <section className={`movie-section-container mb-4 mb-md-5 ${className}`} aria-label={title}>
      {/* Cinematic Section Header */}
      {title && (
        <SectionHeader
          title={title}
          badge={badge}
          icon={icon}
          viewAllHref={viewAllHref}
          viewAllText={viewAllText}
        />
      )}

      {/* 1. GRID LAYOUT MODE */}
      {isGrid ? (
        <div className="movie-grid-container">
          <div className="row g-2 g-sm-3">
            {loading && (!movies || movies.length === 0) ? (
              [...Array(10)].map((_, i) => (
                <div key={`grid-skel-${i}`} className={`col-item col-cols-${columns} mb-3`}>
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
                  className={`col-item col-cols-${columns} mb-3`}
                >
                  <MovieCardVertical movie={movie} onPlayTrailer={onPlayTrailer} />
                </div>
              ))
            )}
          </div>

          {/* Load More Button */}
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
        </div>
      ) : (
        /* 2. CAROUSEL SLIDER MODE (Original react-slick) */
        <div className={styles.sliderContainer}>
          <Slider
            ref={sliderRef}
            key={`carousel-${variant}-${mounted ? (isMobile ? 'm' : 'd') : 's'}`}
            {...currentSettings}
          >
            {movies.map((movie, index) => (
              <div
                key={movie._id || movie.slug || index}
                className={styles.sliderItem}
              >
                {isHorizontal ? (
                  <MovieCardHorizontal
                    movie={movie}
                    rank={index + 1}
                    onPlayTrailer={onPlayTrailer}
                  />
                ) : (
                  <MovieCardVertical
                    movie={movie}
                    onPlayTrailer={onPlayTrailer}
                  />
                )}
              </div>
            ))}
          </Slider>
        </div>
      )}

      <style jsx global>{`
        /* Hide scrollbars inside slider */
        .slick-list {
          overflow: hidden !important;
          scrollbar-width: none !important;
          -ms-overflow-style: none !important;
        }
        .slick-list::-webkit-scrollbar {
          display: none !important;
          width: 0 !important;
          height: 0 !important;
        }
        .col-item {
          flex: 0 0 50%;
          max-width: 50%;
        }
        @media (min-width: 576px) {
          .col-item {
            flex: 0 0 33.333333%;
            max-width: 33.333333%;
          }
        }
        @media (min-width: 768px) {
          .col-item {
            flex: 0 0 25%;
            max-width: 25%;
          }
        }
        @media (min-width: 1200px) {
          .col-cols-4 {
            flex: 0 0 25%;
            max-width: 25%;
          }
          .col-cols-5 {
            flex: 0 0 20%;
            max-width: 20%;
          }
          .col-cols-6 {
            flex: 0 0 16.666667%;
            max-width: 16.666667%;
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
