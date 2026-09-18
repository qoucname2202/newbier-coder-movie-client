/**
 * @file HeroBanner.js
 * @description Cinematic hero banner component with spotlight movie rotation and clean data handling.
 */

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import styles from '@/styles/HeroBanner.module.css';
import { mockMovies } from '@/mock/mockMovies';
import { MOVIE_CONFIG } from '@/config/movieConfig';

/**
 * Truncates text to a specified maximum length with ellipsis.
 * @param {string} text - Raw input text to truncate.
 * @param {number} maxLength - Maximum character count allowed.
 * @returns {string} Truncated string with trailing ellipsis if needed.
 */
const truncateText = (text, maxLength) => {
  if (!text) return '';
  return text.length > maxLength ? `${text.substring(0, maxLength).trim()}...` : text;
};

/**
 * Resolves the backdrop or thumbnail URL for a given movie object.
 * @param {Object} movie - Movie object containing image attributes.
 * @returns {string} Best available image URL.
 */
const resolveBackdropUrl = (movie) => {
  if (!movie) return MOVIE_CONFIG.ui.defaultBackdrop;
  return movie.backdrop_url || movie.poster_url || movie.thumb_url || MOVIE_CONFIG.ui.defaultBackdrop;
};

/**
 * Formats display quality label into a cinema-grade string.
 * @param {string} quality - Raw quality attribute (e.g. '4K', 'FHD').
 * @returns {string} Formatted quality string.
 */
const formatQualityLabel = (quality) => {
  if (!quality) return 'FHD';
  return quality === '4K' ? '4K Ultra HD' : quality;
};

/**
 * Resolves episode, series progress, or release status for badges.
 * Gracefully returns null for standalone released movies.
 * @param {Object} movie - Movie data object.
 * @returns {string|null} Formatted status label or null.
 */
const resolveSeriesStatus = (movie) => {
  if (!movie) return null;
  if (movie.status === 'upcoming') {
    return 'Sắp khởi chiếu';
  }
  if (movie.type === 'series') {
    if (movie.episode_current) {
      return movie.episode_current;
    }
    if (movie.status === 'completed' && movie.episode_total) {
      return `Trọn bộ ${movie.episode_total} tập`;
    }
    return 'Phim bộ';
  }
  return null;
};

/**
 * Renders an interactive row of clickable category pill chips.
 * Gracefully returns null if no categories exist or if the array is empty.
 * @param {Array<Object>} categories - Array of category objects.
 * @returns {JSX.Element|null} Rendered category navigation container or null.
 */
const renderCategoryPills = (categories) => {
  if (!categories || !Array.isArray(categories) || categories.length === 0) {
    return null;
  }

  return (
    <nav className={styles.categoryRow} aria-label="Thể loại phim">
      {categories.map((cat, idx) => {
        const slug = cat.slug || cat.name || '';
        return (
          <Link
            key={slug || idx}
            href={`/search?category=${encodeURIComponent(slug)}`}
            className={styles.categoryPill}
            title={`Khám phá phim thể loại ${cat.name}`}
          >
            <i className={`fas fa-tag ${styles.categoryPillIcon}`} />
            <span>{cat.name}</span>
          </Link>
        );
      })}
    </nav>
  );
};

/**
 * Renders an Apple TV+ style bottom-right horizontal floating dock for featured spotlight movies.
 * Leaves the entire upper backdrop open, uncluttered, and luminous for character art.
 * @param {Object} props - Component properties.
 * @param {Array<Object>} props.movies - Array of featured playlist movies.
 * @param {number} props.currentIndex - Currently active movie index.
 * @param {Function} props.onSelect - Callback invoked when a movie card is clicked.
 * @returns {JSX.Element|null} Rendered dock element or null.
 */
const SpotlightDock = ({ movies, currentIndex, onSelect }) => {
  if (!movies || movies.length <= 1) return null;

  return (
    <aside className={styles.spotlightDock} aria-label="Danh sách phim tiêu điểm">
      <div className={styles.dockTrack} role="tablist" aria-label="Các phim tiêu điểm">
        {movies.map((movie, idx) => {
          const isActive = idx === currentIndex;
          const cardThumb = movie.thumb_url || movie.poster_url || resolveBackdropUrl(movie);

          return (
            <button
              key={movie._id || idx}
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-label={`Chuyển tới phim ${movie.name}`}
              className={`${styles.dockCard} ${isActive ? styles.dockCardActive : ''}`}
              onClick={() => onSelect(idx)}
            >
              <img
                src={cardThumb}
                alt={movie.name || 'Movie thumbnail'}
                className={styles.dockThumbImg}
                loading="lazy"
              />
              {isActive && (
                <span className={styles.dockPlayBadge}>
                  <i className="fas fa-play" />
                </span>
              )}
              {/* Tooltip on hover */}
              <span className={styles.dockTooltip}>{movie.name}</span>
            </button>
          );
        })}
      </div>
    </aside>
  );
};

/**
 * HeroBanner component for displaying featured cinematic movies.
 * @param {Object} props
 * @param {Array<Object>} [props.movies] - Featured playlist movies passed from page/hook.
 * @param {Function} [props.onPlayTrailer] - Callback to open trailer modal.
 * @returns {JSX.Element} Rendered hero banner.
 */
const HeroBanner = ({ movies = [], onPlayTrailer }) => {
  // Use passed movies with fallback to mock data
  const candidateMovies = movies && movies.length > 0 ? movies.slice(0, 5) : (mockMovies ? mockMovies.slice(0, 5) : []);
  const [currentIndex, setCurrentIndex] = useState(0);

  const activeMovie = candidateMovies[currentIndex] || candidateMovies[0];

  /**
   * Advances the hero spotlight to the next featured movie.
   * @returns {void}
   */
  const handleNextSpotlight = useCallback(() => {
    if (candidateMovies.length <= 1) return;
    setCurrentIndex((prev) => (prev + 1) % candidateMovies.length);
  }, [candidateMovies.length]);

  /**
   * Sets up auto-cycling of spotlight movies.
   */
  useEffect(() => {
    if (candidateMovies.length <= 1) return;
    const interval = setInterval(handleNextSpotlight, MOVIE_CONFIG.hero.autoPlayInterval);
    return () => clearInterval(interval);
  }, [candidateMovies.length, handleNextSpotlight]);

  /**
   * Selects a specific featured movie by index.
   * @param {number} index - Index of candidate movie to activate.
   * @returns {void}
   */
  const handleSelectSpotlight = (index) => {
    setCurrentIndex(index);
  };

  if (!activeMovie) return null;

  const seriesStatusText = resolveSeriesStatus(activeMovie);

  return (
    <section className={styles.heroBanner} aria-label="Featured Movie Spotlight">
      {/* Background Media */}
      <div className={styles.heroImage}>
        <img
          key={activeMovie._id || currentIndex}
          src={resolveBackdropUrl(activeMovie)}
          alt={activeMovie.name || 'Featured Movie'}
          className={styles.bannerImage}
        />
        <div className={styles.overlay} />
      </div>

      {/* Main Two-Column Container */}
      <div className={styles.heroContainer}>
        {/* Left Column: Movie Details */}
        <div className={styles.heroDetails}>
          {/* Tier 1: Technical & Release Badges (Read-only) */}
          <div className={styles.badgeGroup}>
            {activeMovie.rating && (
              <span className={styles.ratingBadge}>
                <i className={`fas fa-star ${styles.ratingIcon}`} />
                IMDb {activeMovie.rating}
              </span>
            )}

            <span className={styles.qualityBadge}>
              {formatQualityLabel(activeMovie.quality)}
            </span>

            {seriesStatusText && (
              <span className={styles.seriesBadge}>
                <i className="fas fa-layer-group me-1" />
                {seriesStatusText}
              </span>
            )}

            {activeMovie.lang && (
              <span className={styles.langBadge}>{activeMovie.lang}</span>
            )}

            {activeMovie.year && (
              <>
                <span className={styles.metaDot} />
                <span className={styles.metaItem}>{activeMovie.year}</span>
              </>
            )}

            {activeMovie.time && (
              <>
                <span className={styles.metaDot} />
                <span className={styles.metaItem}>{activeMovie.time}</span>
              </>
            )}
          </div>

          {/* Primary Titles: Fixed container preventing baseline drift */}
          <div className={styles.titleContainer}>
            <h1 className={styles.title} title={activeMovie.name}>
              {activeMovie.name}
            </h1>
            <h2 className={styles.subTitle}>
              {activeMovie.origin_name || '\u00A0'}
            </h2>
          </div>

          {/* Tier 2: Interactive Category Pills */}
          <div className={styles.categoryContainer}>
            {renderCategoryPills(activeMovie.category)}
          </div>

          {/* Description: Exactly 3 lines reserved height so action buttons never jump */}
          <p className={styles.description}>
            {truncateText(
              activeMovie.content || activeMovie.description || 'Khám phá ngay bộ phim hấp dẫn với chất lượng hình ảnh sắc nét và âm thanh sống động.',
              MOVIE_CONFIG.hero.maxDescriptionLength || 250
            )}
          </p>

          {/* Action Control */}
          <div className={styles.actionRow}>
            {activeMovie.status === 'upcoming' && onPlayTrailer ? (
              <button
                type="button"
                className={styles.btnPrimary}
                id="hero-btn-play"
                onClick={() => onPlayTrailer(activeMovie)}
              >
                <i className="fas fa-play" /> Xem Trailer
              </button>
            ) : (
              <Link
                href={`/movie/${activeMovie.slug || '#'}`}
                className={styles.btnPrimary}
                id="hero-btn-play"
              >
                <i className="fas fa-play" /> {activeMovie.status === 'upcoming' ? 'Xem Trailer' : 'Xem ngay'}
              </Link>
            )}
            <Link
              href={`/movie/${activeMovie.slug || '#'}`}
              className={styles.btnSecondary}
              id="hero-btn-details"
            >
              <i className="fas fa-circle-info" /> Chi tiết
            </Link>
          </div>
        </div>

        {/* Right Corner */}
        <SpotlightDock
          movies={candidateMovies}
          currentIndex={currentIndex}
          onSelect={handleSelectSpotlight}
        />
      </div>
    </section>
  );
};

export default HeroBanner;
