import React, { useState, useEffect } from 'react';
import Slider from 'react-slick';
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import SectionHeader from './SectionHeader';
import MovieCardVertical from './MovieCardVertical';
import MovieCardHorizontal from './MovieCardHorizontal';
import Skeleton from '../UI/Skeleton';
import styles from '../../styles/MovieCategory.module.css';

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
        right: -12px;
        z-index: 10;
        width: 38px;
        height: 38px;
        border-radius: 50%;
        background: rgba(15, 15, 20, 0.85);
        color: #ffffff;
        border: 1px solid rgba(255, 255, 255, 0.15);
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: all 0.2s ease;
        box-shadow: 0 4px 12px rgba(0,0,0,0.5);
      }
      .slick-custom-arrow:hover {
        background: #e50914;
        border-color: #e50914;
        transform: translateY(-50%) scale(1.1);
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
        left: -12px;
        z-index: 10;
        width: 38px;
        height: 38px;
        border-radius: 50%;
        background: rgba(15, 15, 20, 0.85);
        color: #ffffff;
        border: 1px solid rgba(255, 255, 255, 0.15);
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: all 0.2s ease;
        box-shadow: 0 4px 12px rgba(0,0,0,0.5);
      }
      .slick-custom-arrow:hover {
        background: #e50914;
        border-color: #e50914;
        transform: translateY(-50%) scale(1.1);
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
 * @file MovieCarouselSection.js
 * @description Standardized, reusable carousel section for movie rails (Vertical posters & Horizontal cards).
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
  const [mounted, setMounted] = useState(false);
  const isHorizontal = variant === 'horizontal';

  useEffect(() => {
    setMounted(true);
  }, []);

  const verticalSettings = {
    dots: false,
    infinite: false,
    speed: 400,
    slidesToShow: 5.5,
    slidesToScroll: 2,
    swipeToSlide: true,
    draggable: true,
    nextArrow: <NextArrow />,
    prevArrow: <PrevArrow />,
    responsive: [
      {
        breakpoint: 1280,
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

  const horizontalSettings = {
    dots: false,
    infinite: false,
    speed: 400,
    slidesToShow: 3.5,
    slidesToScroll: 1,
    swipeToSlide: true,
    draggable: true,
    nextArrow: <NextArrow />,
    prevArrow: <PrevArrow />,
    responsive: [
      {
        breakpoint: 1280,
        settings: { slidesToShow: 3, slidesToScroll: 1 }
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
    <section className="movie-carousel-section mb-5" aria-label={title}>
      <SectionHeader
        title={title}
        badge={badge}
        icon={icon}
        viewAllHref={viewAllHref}
      />

      <div className={styles.sliderContainer}>
        {loading && (!movies || movies.length === 0) ? (
          <div className="d-flex gap-3 overflow-hidden py-2">
            {[...Array(6)].map((_, i) => (
              <div
                key={`skel-${i}`}
                style={{
                  flex: isHorizontal ? '0 0 280px' : '0 0 180px',
                  height: isHorizontal ? '160px' : '270px'
                }}
              >
                <Skeleton height="100%" borderRadius="8px" />
              </div>
            ))}
          </div>
        ) : (
          <Slider
            key={`slider-${variant}-${mounted ? 'client' : 'ssr'}`}
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
                  />
                ) : (
                  <MovieCardVertical
                    movie={movie}
                  />
                )}
              </div>
            ))}
          </Slider>
        )}
      </div>

      <style jsx>{`
        .movie-carousel-section {
          position: relative;
        }
      `}</style>
    </section>
  );
}
