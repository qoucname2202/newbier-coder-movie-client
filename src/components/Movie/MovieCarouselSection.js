import React, { useRef, useState, useEffect, useCallback } from 'react';
import SectionHeader from './SectionHeader';
import MovieCardVertical from './MovieCardVertical';
import MovieCardHorizontal from './MovieCardHorizontal';
import Skeleton from '../UI/Skeleton';

/**
 * @file MovieCarouselSection.js
 * @description Ultra-smooth, hardware-accelerated native horizontal scroll rail for movies.
 * Completely eliminates mobile card squishing bugs from react-slick.
 * Features:
 * - Hidden scrollbar across all browsers (Chrome, Safari, Firefox, iOS, Android)
 * - Native touch momentum scrolling (60/120fps) with scroll snap
 * - Desktop hover arrow navigation with bounds detection (disabled at start/end)
 * - Strict flex-shrink: 0 guaranteeing pristine card proportions on any screen
 *
 * @param {Object} props
 * @param {string} props.title - Section title.
 * @param {string} [props.badge] - Category badge (e.g. 'HOT', 'TOP 10', 'SẮP CHIẾU').
 * @param {React.ReactNode} [props.icon] - Optional heading icon.
 * @param {string} [props.viewAllHref] - URL for "Xem tất cả".
 * @param {Array<Object>} props.movies - Array of movies to display.
 * @param {'vertical'|'horizontal'} [props.variant='vertical'] - Card layout style.
 * @param {boolean} [props.loading=false] - If true and movies empty, renders skeleton.
 * @param {Function} [props.onPlayTrailer] - Callback to play trailer.
 */
export default function MovieCarouselSection({
  title,
  badge,
  icon,
  viewAllHref,
  movies = [],
  variant = 'vertical',
  loading = false,
  onPlayTrailer
}) {
  const railRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const isHorizontal = variant === 'horizontal';

  /**
   * Checks scroll position to toggle visibility of navigation arrows.
   */
  const updateScrollBounds = useCallback(() => {
    const el = railRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanScrollLeft(scrollLeft > 10);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
  }, []);

  useEffect(() => {
    const el = railRef.current;
    if (!el) return;
    updateScrollBounds();
    el.addEventListener('scroll', updateScrollBounds, { passive: true });
    window.addEventListener('resize', updateScrollBounds);
    return () => {
      el.removeEventListener('scroll', updateScrollBounds);
      window.removeEventListener('resize', updateScrollBounds);
    };
  }, [movies, updateScrollBounds]);

  /**
   * Smoothly scrolls the rail horizontally by direction.
   */
  const handleScroll = (direction) => {
    const el = railRef.current;
    if (!el) return;
    const distance = el.clientWidth * 0.75;
    el.scrollBy({
      left: direction === 'left' ? -distance : distance,
      behavior: 'smooth'
    });
  };

  if (!loading && (!movies || movies.length === 0)) {
    return null;
  }

  return (
    <section className="movie-rail-section mb-4 mb-md-5" aria-label={title}>
      <SectionHeader
        title={title}
        badge={badge}
        icon={icon}
        viewAllHref={viewAllHref}
      />

      <div className="rail-wrapper">
        {/* Desktop Prev Arrow */}
        {canScrollLeft && (
          <button
            type="button"
            className="rail-nav-btn rail-nav-prev d-none d-md-flex"
            onClick={() => handleScroll('left')}
            aria-label="Cuộn sang trái"
          >
            <i className="fas fa-chevron-left" />
          </button>
        )}

        {/* Horizontal Scroll Track */}
        <div
          ref={railRef}
          className="movie-scroll-track"
          role="region"
          aria-label={`Danh sách ${title}`}
        >
          {loading && (!movies || movies.length === 0) ? (
            [...Array(6)].map((_, i) => (
              <div
                key={`skel-${i}`}
                className={`rail-card-item ${isHorizontal ? 'card-item-horizontal' : 'card-item-vertical'}`}
              >
                <Skeleton
                  height={isHorizontal ? '170px' : '280px'}
                  borderRadius="8px"
                />
              </div>
            ))
          ) : (
            movies.map((movie, index) => (
              <div
                key={movie._id || movie.slug || index}
                className={`rail-card-item ${isHorizontal ? 'card-item-horizontal' : 'card-item-vertical'}`}
              >
                {isHorizontal ? (
                  <MovieCardHorizontal
                    movie={movie}
                    rank={index + 1}
                  />
                ) : (
                  <MovieCardVertical
                    movie={movie}
                  />
                )}
              </div>
            ))
          )}
        </div>

        {/* Desktop Next Arrow */}
        {canScrollRight && (
          <button
            type="button"
            className="rail-nav-btn rail-nav-next d-none d-md-flex"
            onClick={() => handleScroll('right')}
            aria-label="Cuộn sang phải"
          >
            <i className="fas fa-chevron-right" />
          </button>
        )}
      </div>

      <style jsx>{`
        .movie-rail-section {
          position: relative;
        }

        .rail-wrapper {
          position: relative;
          margin: 0 -8px;
        }

        /* Native Horizontal Scroll Track */
        .movie-scroll-track {
          display: flex;
          overflow-x: auto;
          overflow-y: hidden;
          scroll-behavior: smooth;
          -webkit-overflow-scrolling: touch; /* Momentum scrolling on iOS/Safari */
          scroll-snap-type: x proximity;
          gap: 12px;
          padding: 8px 8px 16px 8px;
          user-select: none;

          /* Hide Scrollbar completely across all browsers */
          scrollbar-width: none; /* Firefox */
          -ms-overflow-style: none; /* IE & Edge */
        }

        .movie-scroll-track::-webkit-scrollbar {
          display: none; /* Chrome, Safari, Opera */
          width: 0;
          height: 0;
        }

        /* Card Item - Strict flex-shrink: 0 prevents any squishing */
        .rail-card-item {
          flex: 0 0 auto;
          scroll-snap-align: start;
        }

        /* Vertical Poster Sizing (2:3 Aspect) */
        .card-item-vertical {
          width: 200px;
        }

        @media (max-width: 1400px) {
          .card-item-vertical {
            width: 185px;
          }
        }

        @media (max-width: 992px) {
          .card-item-vertical {
            width: 165px;
          }
        }

        /* Mobile Phone Viewport: 140px ensures ~2.3 cards visible, never squished! */
        @media (max-width: 576px) {
          .card-item-vertical {
            width: 142px;
          }
          .movie-scroll-track {
            gap: 10px;
            padding: 4px 6px 12px 6px;
          }
          .rail-wrapper {
            margin: 0 -4px;
          }
        }

        /* Small mobile screens (iPhone SE, Galaxy A) */
        @media (max-width: 380px) {
          .card-item-vertical {
            width: 132px;
          }
        }

        /* Horizontal Card Sizing (Top 10 View) */
        .card-item-horizontal {
          width: 340px;
        }

        @media (max-width: 1400px) {
          .card-item-horizontal {
            width: 310px;
          }
        }

        @media (max-width: 992px) {
          .card-item-horizontal {
            width: 280px;
          }
        }

        @media (max-width: 576px) {
          .card-item-horizontal {
            width: 260px;
          }
        }

        /* Navigation Arrows (Desktop) */
        .rail-nav-btn {
          position: absolute;
          top: calc(50% - 10px);
          transform: translateY(-50%);
          z-index: 15;
          width: 42px;
          height: 42px;
          border-radius: 50%;
          background: rgba(15, 18, 24, 0.88);
          color: #ffffff;
          border: 1px solid rgba(255, 255, 255, 0.18);
          backdrop-filter: blur(12px);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.65);
        }

        .rail-nav-prev {
          left: -12px;
        }

        .rail-nav-next {
          right: -12px;
        }

        .rail-nav-btn:hover {
          background: #e50914;
          border-color: #e50914;
          transform: translateY(-50%) scale(1.12);
          box-shadow: 0 10px 28px rgba(229, 9, 20, 0.45);
        }

        .rail-nav-btn:active {
          transform: translateY(-50%) scale(0.96);
        }
      `}</style>
    </section>
  );
}
