import React, { useState, useEffect, useRef, useCallback } from 'react';
import Skeleton from '@/components/UI/Skeleton';

/**
 * @file FeaturedCarousel3D.js
 * @description Pure CSS 3D rotating carousel showcasing top spotlight movies with hardware-accelerated depth.
 * Implemented 100% with Pure CSS 3D transforms & transitions (no external slider/carousel libraries).
 *
 * @param {Object} props
 * @param {Array<Object>} props.movies - Featured movies list (typically 5 items).
 * @param {boolean} [props.loading=false] - Skeleton loading state.
 */
export default function FeaturedCarousel3D({ movies = [], loading = false }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [prevActiveIndex, setPrevActiveIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [windowWidth, setWindowWidth] = useState(1200);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);
  const transitionTimeoutRef = useRef(null);

  const candidateMovies = movies && movies.length > 0 ? movies.slice(0, 5) : [];
  const totalItems = candidateMovies.length;

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const handleResize = () => setWindowWidth(window.innerWidth);
      handleResize();
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, []);

  const changeSlide = useCallback((newIndex) => {
    if (isTransitioning || totalItems <= 1 || newIndex === activeIndex) return;

    setIsTransitioning(true);
    setPrevActiveIndex(activeIndex);
    setActiveIndex(newIndex);

    if (transitionTimeoutRef.current) {
      clearTimeout(transitionTimeoutRef.current);
    }
    transitionTimeoutRef.current = setTimeout(() => {
      setIsTransitioning(false);
    }, 480);
  }, [isTransitioning, totalItems, activeIndex]);

  const handlePrev = useCallback(() => {
    if (totalItems <= 1) return;
    const nextIdx = activeIndex === 0 ? totalItems - 1 : activeIndex - 1;
    changeSlide(nextIdx);
  }, [activeIndex, totalItems, changeSlide]);

  const handleNext = useCallback(() => {
    if (totalItems <= 1) return;
    const nextIdx = activeIndex === totalItems - 1 ? 0 : activeIndex + 1;
    changeSlide(nextIdx);
  }, [activeIndex, totalItems, changeSlide]);

  // Auto-slide every 5.5 seconds
  useEffect(() => {
    if (totalItems <= 1) return;
    const interval = setInterval(() => {
      if (!isTransitioning) {
        handleNext();
      }
    }, 5500);
    return () => clearInterval(interval);
  }, [totalItems, isTransitioning, handleNext]);

  useEffect(() => {
    return () => {
      if (transitionTimeoutRef.current) {
        clearTimeout(transitionTimeoutRef.current);
      }
    };
  }, []);

  const handleTouchStart = (e) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!isTransitioning && touchStart && touchEnd) {
      const diff = touchStart - touchEnd;
      if (diff > 60) {
        handleNext();
      } else if (diff < -60) {
        handlePrev();
      }
    }
    setTouchStart(0);
    setTouchEnd(0);
  };

  if (loading && candidateMovies.length === 0) {
    return (
      <div className="featured-3d-wrapper mb-4">
        <div className="position-relative featured-container skeleton-container">
          <Skeleton height="100%" width="100%" />
        </div>
      </div>
    );
  }

  if (candidateMovies.length === 0) return null;

  const currentMovie = candidateMovies[activeIndex] || candidateMovies[0];

  return (
    <section className="featured-3d-wrapper mb-4 mb-lg-5" aria-label="Phim Nổi Bật 3D">
      <div
        className="position-relative featured-container"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Dynamic ambient backdrop richly reflecting the active movie's colors */}
        {currentMovie && (
          <div className="backdrop-stage">
            <div
              key={currentMovie._id || currentMovie.slug || activeIndex}
              className="backdrop-blur-layer"
              style={{
                backgroundImage: `url(${currentMovie.backdrop_url || currentMovie.poster_url || currentMovie.thumb_url})`
              }}
            />
            <div className="backdrop-gradient-mask" />
            <div className="backdrop-radial-glow" />
          </div>
        )}

        {/* 3D Rotating Cards Track */}
        <div className="cards-3d-stage">
          {candidateMovies.map((movie, index) => {
            let position = (index - activeIndex + totalItems) % totalItems;
            if (position > Math.floor(totalItems / 2)) {
              position = position - totalItems;
            }

            let prevPos = (index - prevActiveIndex + totalItems) % totalItems;
            if (prevPos > Math.floor(totalItems / 2)) {
              prevPos = prevPos - totalItems;
            }

            // Prevent flying across screen when wrapping from edge to edge
            const isWrapping = Math.abs(position - prevPos) > 2;

            const isCenter = position === 0;
            const isMid = Math.abs(position) === 1;

            let zIndex = 2;
            if (isCenter) {
              zIndex = 12;
            } else if (prevPos === 0 && isTransitioning) {
              zIndex = 9;
            } else if (isMid) {
              zIndex = 6;
            } else {
              zIndex = 2;
            }

            const translateZ = isCenter ? 60 : isMid ? -60 : -180;
            const scale = isCenter ? 1 : isMid ? 0.86 : 0.72;

            const translateX = position * (
              windowWidth < 480 ? 95 :
              windowWidth < 768 ? 145 :
              windowWidth < 1200 ? 220 :
              270
            );

            const rotationY = position * (
              windowWidth < 480 ? -4 :
              windowWidth < 768 ? -7 :
              -12
            );

            const opacity = isWrapping ? 0 : isCenter ? 1 : isMid ? 0.82 : 0.45;

            const visibility =
              windowWidth < 480 ? (Math.abs(position) <= 0 ? 'visible' : 'hidden') :
              windowWidth < 768 ? (Math.abs(position) <= 1 ? 'visible' : 'hidden') :
              'visible';

            const cardWidth = windowWidth < 480 ? 220 : windowWidth < 768 ? 270 : 360;
            const cardHeight = windowWidth < 480 ? 320 : windowWidth < 768 ? 400 : 510;

            // Always prioritize high-resolution poster_url over low-res thumb_url
            const posterSrc = movie.poster_url || movie.thumb_url || '/placeholder.jpg';

            return (
              <div
                key={movie._id || movie.slug || index}
                className={`position-absolute card-3d-item ${isCenter ? 'active-card' : ''}`}
                style={{
                  width: `${cardWidth}px`,
                  height: `${cardHeight}px`,
                  visibility,
                  zIndex,
                  transform: `translate3d(${translateX}px, 0, ${translateZ}px) rotateY(${rotationY}deg) scale(${scale})`,
                  transition: isWrapping
                    ? 'none'
                    : 'transform 0.48s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.45s ease',
                  left: '50%',
                  top: '50%',
                  marginTop: `-${cardHeight / 2}px`,
                  marginLeft: `-${cardWidth / 2}px`,
                  opacity,
                  cursor: 'pointer',
                  willChange: 'transform, opacity'
                }}
                onClick={() => {
                  if (!isCenter && !isTransitioning) {
                    changeSlide(index);
                  } else if (isCenter) {
                    window.location.href = `/movie/${movie.slug}`;
                  }
                }}
              >
                {/* Cinema-Grade Rounded Card (8px radius, zero corner bleed) */}
                <div className="poster-card-box">
                  <img
                    src={posterSrc}
                    alt={movie.name}
                    className="poster-card-img"
                    loading={isCenter ? 'eager' : 'lazy'}
                  />

                  {/* 100% Full-Coverage Vignette Overlay */}
                  <div className="poster-vignette-overlay" />

                  {/* Sharp, High-Definition Play Button (No fuzzy pale ring) */}
                  {isCenter && (
                    <div className="center-play-button">
                      <i className="fas fa-play" />
                    </div>
                  )}

                  {/* Card Title & Meta Info at Bottom with Dedicated Solid Vignette */}
                  <div className="poster-info-content">
                    <div className="d-flex align-items-center gap-2 mb-2 flex-wrap">
                      <span className="badge-cinema-hot">SPOTLIGHT</span>
                      {movie.quality && <span className="badge-cinema-quality">{movie.quality}</span>}
                      {movie.year && <span className="badge-cinema-meta">{movie.year}</span>}
                      {movie.episode_current && (
                        <span className="badge-cinema-meta d-none d-sm-inline">
                          • {movie.episode_current}
                        </span>
                      )}
                    </div>
                    <h3 className="poster-title" title={movie.name}>
                      {movie.name}
                    </h3>
                    {movie.origin_name && (
                      <p className="poster-origin-title">
                        {movie.origin_name}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Clean, Minimalist Cinema Dots */}
        {totalItems > 1 && (
          <div className="carousel-dots-row">
            {candidateMovies.map((_, index) => (
              <button
                key={index}
                type="button"
                className={`carousel-dot ${index === activeIndex ? 'active' : ''}`}
                onClick={() => changeSlide(index)}
                aria-label={`Chuyển tới phim ${index + 1}`}
              />
            ))}
          </div>
        )}
      </div>

      <style jsx>{`
        .featured-3d-wrapper {
          position: relative;
          width: 100%;
          overflow: hidden;
        }

        .featured-container {
          height: 620px;
          width: 100%;
          overflow: hidden;
          background: #090c10;
          perspective: 1200px;
          transform-style: preserve-3d;
          user-select: none;
        }

        @media (max-width: 1200px) {
          .featured-container {
            height: 540px;
          }
        }

        @media (max-width: 768px) {
          .featured-container {
            height: 460px;
          }
        }

        @media (max-width: 480px) {
          .featured-container {
            height: 390px;
          }
        }

        /* Ambient Backdrop Stage - Richly reflects active movie colors */
        .backdrop-stage {
          position: absolute;
          inset: 0;
          pointer-events: none;
          overflow: hidden;
          z-index: 1;
        }

        .backdrop-blur-layer {
          position: absolute;
          inset: -30px;
          background-size: cover;
          background-position: center 30%;
          filter: blur(28px) saturate(1.45) brightness(0.6);
          opacity: 0.85;
          transform: translate3d(0, 0, 0) scale(1.08);
          transition: opacity 0.6s ease-in-out;
          will-change: opacity;
        }

        .backdrop-gradient-mask {
          position: absolute;
          inset: 0;
          background: linear-gradient(
            180deg,
            rgba(9, 12, 16, 0.25) 0%,
            rgba(9, 12, 16, 0.45) 45%,
            rgba(9, 12, 16, 0.85) 80%,
            #090c10 100%
          );
        }

        .backdrop-radial-glow {
          position: absolute;
          inset: 0;
          background: radial-gradient(circle at center 40%, rgba(229, 9, 20, 0.16) 0%, transparent 65%);
        }

        /* Navigation Arrows */
        .nav-arrow {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background: rgba(13, 17, 23, 0.65);
          border: 1px solid rgba(255, 255, 255, 0.15);
          color: #ffffff;
          align-items: center;
          justify-content: center;
          font-size: 0.95rem;
          cursor: pointer;
          z-index: 25;
          backdrop-filter: blur(8px);
          transition: all 0.25s ease;
        }

        .nav-prev {
          left: 24px;
        }

        .nav-next {
          right: 24px;
        }

        .nav-arrow:hover {
          background: rgba(229, 9, 20, 0.85);
          border-color: #e50914;
          box-shadow: 0 0 16px rgba(229, 9, 20, 0.5);
          transform: translateY(-50%) scale(1.08);
        }

        /* 3D Stage */
        .cards-3d-stage {
          position: relative;
          width: 100%;
          height: 100%;
          z-index: 5;
          transform-style: preserve-3d;
        }

        .card-3d-item {
          transform-style: preserve-3d;
          backface-visibility: hidden;
          -webkit-backface-visibility: hidden;
        }

        /* Poster Box - Mature Cinema Design, Crisp Resolution & Zero Bleed */
        .poster-card-box {
          position: relative;
          width: 100%;
          height: 100%;
          border-radius: 8px;
          overflow: hidden;
          isolation: isolate;
          background: #05070a;
          box-shadow: 0 12px 32px rgba(0, 0, 0, 0.7), inset 0 0 0 1px rgba(255, 255, 255, 0.08);
          transition: box-shadow 0.3s ease, border-color 0.3s ease;
          backface-visibility: hidden;
          -webkit-backface-visibility: hidden;
        }

        .active-card .poster-card-box {
          box-shadow: 0 20px 48px rgba(0, 0, 0, 0.85), 0 0 32px rgba(229, 9, 20, 0.28), inset 0 0 0 1px rgba(229, 9, 20, 0.45);
        }

        .poster-card-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
          image-rendering: -webkit-optimize-contrast;
          transform: scale(1.01);
          -webkit-user-drag: none;
          user-select: none;
          pointer-events: none;
        }

        /* Full Coverage Vignette Overlay */
        .poster-vignette-overlay {
          position: absolute;
          inset: 0;
          z-index: 2;
          border-radius: inherit;
          pointer-events: none;
          background: linear-gradient(
            180deg,
            rgba(5, 7, 10, 0) 0%,
            rgba(5, 7, 10, 0.08) 35%,
            rgba(5, 7, 10, 0.5) 60%,
            rgba(5, 7, 10, 0.85) 80%,
            #05070a 100%
          );
        }

        /* Sharp, High-Definition Play Button (Zero fuzzy pale ring) */
        .center-play-button {
          position: absolute;
          top: 46%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 54px;
          height: 54px;
          border-radius: 50%;
          background: #e50914;
          color: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.2rem;
          padding-left: 3px;
          box-shadow: 0 4px 18px rgba(0, 0, 0, 0.65), 0 2px 10px rgba(229, 9, 20, 0.5);
          border: none;
          z-index: 4;
          transition: transform 0.25s ease, box-shadow 0.25s ease;
          pointer-events: none;
        }

        .active-card:hover .center-play-button {
          transform: translate(-50%, -50%) scale(1.1);
          box-shadow: 0 6px 24px rgba(0, 0, 0, 0.75), 0 0 16px rgba(229, 9, 20, 0.7);
        }

        /* Content Meta & Dedicated Solid Bottom Vignette */
        .poster-info-content {
          position: absolute;
          bottom: 0;
          left: 0;
          width: 100%;
          padding: 24px 20px 18px;
          color: #ffffff;
          z-index: 3;
          pointer-events: none;
          background: linear-gradient(
            to top,
            #05070a 0%,
            rgba(5, 7, 10, 0.96) 35%,
            rgba(5, 7, 10, 0.75) 65%,
            transparent 100%
          );
        }

        @media (max-width: 480px) {
          .poster-info-content {
            padding: 16px 14px 12px;
          }
        }

        .badge-cinema-hot {
          display: inline-flex;
          align-items: center;
          background: #e50914;
          color: #ffffff;
          font-size: 0.64rem;
          font-weight: 800;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          padding: 2px 6px;
          border-radius: 3px;
          border: none;
          box-shadow: 0 2px 6px rgba(229, 9, 20, 0.45);
        }

        .badge-cinema-quality {
          display: inline-flex;
          align-items: center;
          background: rgba(15, 23, 42, 0.75);
          border: 1px solid rgba(255, 255, 255, 0.2);
          color: #f1f5f9;
          font-size: 0.65rem;
          font-weight: 700;
          padding: 2px 6px;
          border-radius: 3px;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          backdrop-filter: blur(6px);
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.1);
        }

        .badge-cinema-meta {
          color: rgba(255, 255, 255, 0.7);
          font-size: 0.74rem;
          font-weight: 500;
        }

        .poster-title {
          font-size: 1.28rem;
          font-weight: 700;
          line-height: 1.25;
          margin-bottom: 4px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          text-shadow: 0 2px 8px rgba(0, 0, 0, 0.9);
        }

        @media (max-width: 768px) {
          .poster-title {
            font-size: 1.05rem;
          }
        }

        .poster-origin-title {
          font-size: 0.82rem;
          color: rgba(255, 255, 255, 0.65);
          margin-bottom: 0;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        /* Minimalist, Clean Cinema Dots Row (Uncluttered) */
        .carousel-dots-row {
          position: absolute;
          bottom: 20px;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          align-items: center;
          gap: 8px;
          z-index: 20;
        }

        .carousel-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          border: none;
          padding: 0;
          background: rgba(255, 255, 255, 0.35);
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .carousel-dot.active {
          width: 24px;
          border-radius: 4px;
          background: #e50914;
          box-shadow: 0 0 10px rgba(229, 9, 20, 0.8);
        }

        .carousel-dot:hover:not(.active) {
          background: rgba(255, 255, 255, 0.75);
        }
      `}</style>
    </section>
  );
}
