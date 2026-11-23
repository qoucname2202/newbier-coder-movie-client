import React, { useState, useEffect, useRef } from 'react';
import Slider from 'react-slick';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
type SliderSettings = import('react-slick').SliderSettings;
import SectionHeader from './SectionHeader';
import { MovieCardVertical, MovieCardHorizontal } from '@/features/shared/components/MovieCard';
import Skeleton from '@/features/shared/components/UI/Skeleton';
import type { MovieLite } from '@/features/shared/components/MovieCard';
import styles from '@/styles/MovieCategory.module.css';

/**
 * @file MovieSection.tsx
 * @description Master Base Component supporting both original slick Carousel and Responsive Grid.
 */

type LayoutMode = 'rail' | 'grid';
type CardVariant = 'vertical' | 'horizontal';

interface SlickArrowProps {
  className?: string;
  onClick?: () => void;
}

const NextArrow: React.FC<SlickArrowProps> = ({ className, onClick }) => {
  const isDisabled = className?.includes('slick-disabled');
  return (
    <button
      type="button"
      className={`slick-custom-arrow slick-custom-next ${isDisabled ? 'slick-disabled' : ''}`}
      onClick={onClick}
      disabled={isDisabled}
      aria-label="Xem tiếp"
    >
      <i className="fas fa-chevron-right" />
      <style jsx>{`
        .slick-custom-arrow {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          right: -10px;
          z-index: 10;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: rgba(15, 18, 24, 0.92);
          color: #ffffff;
          border: 1px solid rgba(255, 255, 255, 0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.25s ease;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.7);
          backdrop-filter: blur(8px);
        }
        .slick-custom-arrow:hover:not(:disabled) {
          background: #e50914;
          border-color: #e50914;
          transform: translateY(-50%) scale(1.1);
          box-shadow: 0 6px 20px rgba(229, 9, 20, 0.5);
        }
        .slick-custom-arrow:disabled,
        .slick-custom-arrow.slick-disabled {
          opacity: 0 !important;
          pointer-events: none !important;
          visibility: hidden !important;
        }
        @media (max-width: 768px) {
          .slick-custom-arrow {
            display: none !important;
          }
        }
      `}</style>
    </button>
  );
};

const PrevArrow: React.FC<SlickArrowProps> = ({ className, onClick }) => {
  const isDisabled = className?.includes('slick-disabled');
  return (
    <button
      type="button"
      className={`slick-custom-arrow slick-custom-prev ${isDisabled ? 'slick-disabled' : ''}`}
      onClick={onClick}
      disabled={isDisabled}
      aria-label="Quay lại"
    >
      <i className="fas fa-chevron-left" />
      <style jsx>{`
        .slick-custom-arrow {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          left: -10px;
          z-index: 10;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: rgba(15, 18, 24, 0.92);
          color: #ffffff;
          border: 1px solid rgba(255, 255, 255, 0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.25s ease;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.7);
          backdrop-filter: blur(8px);
        }
        .slick-custom-arrow:hover:not(:disabled) {
          background: #e50914;
          border-color: #e50914;
          transform: translateY(-50%) scale(1.1);
          box-shadow: 0 6px 20px rgba(229, 9, 20, 0.5);
        }
        .slick-custom-arrow:disabled,
        .slick-custom-arrow.slick-disabled {
          opacity: 0 !important;
          pointer-events: none !important;
          visibility: hidden !important;
        }
        @media (max-width: 768px) {
          .slick-custom-arrow {
            display: none !important;
          }
        }
      `}</style>
    </button>
  );
};

export interface MovieSectionProps {
  layout?: LayoutMode;
  variant?: CardVariant;
  columns?: number;
  title?: string;
  badge?: string;
  showRank?: boolean;
  icon?: React.ReactNode;
  viewAllHref?: string;
  viewAllText?: string;
  movies?: MovieLite[];
  loading?: boolean;
  loadingMore?: boolean;
  hasMore?: boolean;
  onLoadMore?: () => void;
  onPlayTrailer?: (movie: MovieLite) => void;
  className?: string;
}

const MovieSection: React.FC<MovieSectionProps> = ({
  layout = 'rail',
  variant = 'vertical',
  columns = 5,
  title,
  badge,
  showRank = false,
  icon,
  viewAllHref,
  viewAllText = 'Xem tất cả',
  movies = [],
  loading = false,
  loadingMore = false,
  hasMore = false,
  onLoadMore,
  onPlayTrailer,
  className = ''
}) => {
  const [mounted, setMounted] = useState<boolean>(false);
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const sliderRef = useRef<React.ComponentType<SliderSettings> | null>(null);

  useEffect(() => {
    setMounted(true);
    if (typeof window !== 'undefined') {
      const handleResize = (): void => {
        setIsMobile(window.innerWidth < 768);
      };
      handleResize();
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, []);

  const isGrid: boolean = layout === 'grid';
  const isHorizontal: boolean = variant === 'horizontal';

  // Vertical Card Carousel Settings
  const verticalSettings = {
    dots: false,
    infinite: false,
    speed: 450,
    slidesToShow: mounted && isMobile ? 2 : 6,
    slidesToScroll: mounted && isMobile ? 2 : 6,
    swipeToSlide: false,
    draggable: true,
    nextArrow: <NextArrow />,
    prevArrow: <PrevArrow />,
    responsive: [
      {
        breakpoint: 2200,
        settings: { slidesToShow: 7, slidesToScroll: 7 }
      },
      {
        breakpoint: 1440,
        settings: { slidesToShow: 6, slidesToScroll: 6 }
      },
      {
        breakpoint: 1200,
        settings: { slidesToShow: 5, slidesToScroll: 5 }
      },
      {
        breakpoint: 992,
        settings: { slidesToShow: 4, slidesToScroll: 4 }
      },
      {
        breakpoint: 768,
        settings: { slidesToShow: 3, slidesToScroll: 3, arrows: false }
      },
      {
        breakpoint: 576,
        settings: { slidesToShow: 2, slidesToScroll: 2, arrows: false }
      },
      {
        breakpoint: 400,
        settings: { slidesToShow: 2, slidesToScroll: 2, arrows: false }
      }
    ]
  };

  // Horizontal Card Carousel Settings
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
                  key={movie._id || movie.slug || String(index)}
                  className={`col-item col-cols-${columns} mb-3`}
                >
                  <MovieCardVertical
                    movie={movie}
                    rank={showRank ? index + 1 : undefined}
                    badge={typeof badge === 'string' ? badge : undefined}
                    onPlayTrailer={onPlayTrailer}
                  />
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
        /* 2. CAROUSEL SLIDER MODE */
        loading && (!movies || movies.length === 0) ? (
          <div className="movie-rail-skeleton-track d-flex gap-2 gap-sm-3 overflow-hidden py-1">
            {[...Array(mounted && isMobile ? 2 : (isHorizontal ? 4 : 5))].map((_, i) => (
              <div
                key={`rail-skel-${i}`}
                style={{
                  flex: isHorizontal
                    ? (mounted && isMobile ? '0 0 75%' : '0 0 calc(28.5% - 0.75rem)')
                    : (mounted && isMobile ? '0 0 calc(50% - 0.5rem)' : '0 0 calc(20% - 0.8rem)'),
                  minWidth: 0
                }}
              >
                {isHorizontal ? (
                  <div className="card h-100 bg-dark border-0 rounded-3 overflow-hidden">
                    <Skeleton height="175px" borderRadius="8px" />
                    <div className="p-2">
                      <Skeleton height="18px" width="80%" />
                      <div className="mt-2 d-flex gap-2">
                        <Skeleton height="14px" width="40%" />
                        <Skeleton height="14px" width="30%" />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="card h-100 bg-dark border-0 rounded-3 overflow-hidden">
                    <div style={{ aspectRatio: '2 / 3', width: '100%', overflow: 'hidden' }}>
                      <Skeleton height="100%" width="100%" borderRadius="8px" />
                    </div>
                    <div className="p-2">
                      <Skeleton height="16px" width="85%" />
                      <div className="mt-2 d-flex justify-content-between">
                        <Skeleton height="13px" width="45%" />
                        <Skeleton height="13px" width="30%" />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className={styles.sliderContainer}>
            <Slider
              ref={sliderRef}
              key={`carousel-${variant}-${mounted ? (isMobile ? 'm' : 'd') : 's'}`}
              {...currentSettings}
            >
              {movies.map((movie, index) => (
                <div
                  key={movie._id || movie.slug || String(index)}
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
                      rank={showRank ? index + 1 : undefined}
                      badge={typeof badge === 'string' ? badge : undefined}
                      onPlayTrailer={onPlayTrailer}
                    />
                  )}
                </div>
              ))}
            </Slider>
          </div>
        )
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
};

export default MovieSection;
