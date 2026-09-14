/**
 * @file HeroBanner.js
 * @description Cinematic hero banner component with spotlight movie rotation and clean data handling.
 */

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import styles from '../../styles/HeroBanner.module.css';
import { mockMovies } from '../../mock/mockMovies';
import { MOVIE_CONFIG } from '../../config/movieConfig';

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
 * HeroBanner component for displaying featured cinematic movies.
 * @returns {JSX.Element} Rendered hero banner.
 */
const HeroBanner = () => {
  // Use featured candidate movies from mock data
  const candidateMovies = mockMovies && mockMovies.length > 0 ? mockMovies.slice(0, 5) : [];
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

      {/* Hero Content Overlay */}
      <div className={styles.heroContent}>
        {/* Curated Cinema Badges */}
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

          {activeMovie.lang && (
            <span className={styles.langBadge}>{activeMovie.lang}</span>
          )}

          <span className={styles.metaDot} />
          <span className={styles.metaItem}>{activeMovie.year || MOVIE_CONFIG.hero.defaultYear}</span>

          {activeMovie.time && (
            <>
              <span className={styles.metaDot} />
              <span className={styles.metaItem}>{activeMovie.time}</span>
            </>
          )}

          {activeMovie.category?.[0]?.name && (
            <>
              <span className={styles.metaDot} />
              <span className={styles.metaItem}>{activeMovie.category[0].name}</span>
            </>
          )}
        </div>

        {/* Titles */}
        <h1 className={styles.title}>{activeMovie.name}</h1>
        {activeMovie.origin_name && (
          <h2 className={styles.subTitle}>{activeMovie.origin_name}</h2>
        )}

        {/* Description */}
        {activeMovie.content && (
          <p className={styles.description}>
            {truncateText(activeMovie.content, MOVIE_CONFIG.hero.maxDescriptionLength)}
          </p>
        )}

        {/* Action Controls */}
        <div className={styles.actionRow}>
          <Link
            href={`/movie/${activeMovie.slug || '#'}`}
            className={styles.btnPrimary}
            id="hero-btn-play"
          >
            <i className="fas fa-play" /> Xem ngay
          </Link>
          <Link
            href={`/movie/${activeMovie.slug || '#'}`}
            className={styles.btnSecondary}
            id="hero-btn-details"
          >
            <i className="fas fa-circle-info" /> Chi tiết
          </Link>
        </div>

        {/* Navigation Indicator Bars (to be evolved into Right-side Playlist in Task 06) */}
        {candidateMovies.length > 1 && (
          <div className={styles.thumbnailNav} role="tablist" aria-label="Spotlight movies">
            {candidateMovies.map((movie, idx) => (
              <button
                key={movie._id || idx}
                type="button"
                className={`${styles.thumbItem} ${idx === currentIndex ? styles.thumbItemActive : ''}`}
                onClick={() => handleSelectSpotlight(idx)}
                aria-label={`Slide ${idx + 1}: ${movie.name}`}
                aria-selected={idx === currentIndex}
                role="tab"
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default HeroBanner;
