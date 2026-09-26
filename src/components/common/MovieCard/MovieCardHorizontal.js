import React, { useState } from 'react';
import Link from 'next/link';
import styles from '@/styles/MovieCards.module.css';

/**
 * @file MovieCardHorizontal.js
 * @description Avant-garde 16:9 Cinema Wide Panorama Card with giant typographic outline rank,
 * shimmer light sheen reflection on hover, radar-pulse play button, and ambient bottom glow.
 * 
 * @param {Object} props
 * @param {Object} props.movie - Movie data object
 * @param {number} [props.rank] - Ranking index (1, 2, 3...) for giant outline number
 * @param {string} [props.badge] - Optional custom badge (e.g. "TOP 1", "MỚI", countdown)
 * @param {Function} [props.onMouseEnter] - Optional hover handler
 * @param {Function} [props.onMouseLeave] - Optional unhover handler
 * @param {string} [props.className=""] - Additional class name
 * @returns {JSX.Element}
 */
const MovieCardHorizontal = ({
  movie,
  rank,
  badge,
  onMouseEnter,
  onMouseLeave,
  onPlayTrailer,
  className = ""
}) => {
  const [imgSrc, setImgSrc] = useState(
    movie?.backdrop_url || movie?.poster_url || movie?.thumb_url || '/img/placeholder-backdrop.svg'
  );

  if (!movie) return null;

  // Format rank number with leading zero: "01", "02", ...
  const formattedRank = typeof rank === 'number' ? String(rank).padStart(2, '0') : null;

  // Extract rating
  const rawRating = movie?.vote_average || movie?.rating || movie?.tmdb?.vote_average;
  const ratingText = rawRating ? Number(rawRating).toFixed(1) : null;

  return (
    <Link
      href={`/movie/${movie?.slug || ''}`}
      className={`${styles.cardHorizontal} ${className}`}
      onMouseEnter={() => onMouseEnter && onMouseEnter(movie)}
      onMouseLeave={() => onMouseLeave && onMouseLeave(movie)}
      aria-label={movie?.name || 'Xem phim'}
    >
      <div className={styles.wideContainer}>
        {/* Giant Typographic Outline Rank */}
        {formattedRank && (
          <span className={styles.rankNumber} aria-hidden="true">
            {formattedRank}
          </span>
        )}

        {/* Shimmer Light Sheen Reflection across the card */}
        <span className={styles.shimmerSheen} aria-hidden="true" />

        {/* 16:9 Cinema Backdrop */}
        <img
          src={imgSrc}
          alt={movie?.name || 'Banner phim'}
          className={styles.wideBackdropImg}
          loading="lazy"
          onError={() => setImgSrc('/img/placeholder-backdrop.svg')}
        />

        {/* Bottom Ambient Vignette Gradient */}
        <div className={styles.wideBottomFade} aria-hidden="true" />

        {/* Radar Pulse Play Button (Trailer Trigger on Hover) */}
        <button
          type="button"
          className={styles.radarPulseBtn}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (onPlayTrailer) {
              onPlayTrailer(movie);
            }
          }}
          aria-label={`Xem trailer ${movie?.name}`}
          title="Xem trailer"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <polygon points="5 3 19 12 5 21 5 3" />
          </svg>
        </button>

        {/* Overlaid Movie Information */}
        <div className={styles.wideInfoOverlay}>
          <h4 className={styles.wideTitle} title={movie?.name}>
            {movie?.name}
          </h4>
          <div className={styles.wideMetaRow}>
            {badge && (
              <span className={styles.wideBadge}>
                {badge}
              </span>
            )}
            {ratingText && (
              <span style={{ color: '#fbbf24', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                ★ {ratingText}
              </span>
            )}
            <span>{movie?.year || new Date().getFullYear()}</span>
            <span className={styles.metaDot} aria-hidden="true" />
            <span className="text-truncate" style={{ maxWidth: '140px' }}>
              {movie?.origin_name || (movie?.type === 'series' ? 'Phim bộ' : 'Phim lẻ')}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default MovieCardHorizontal;
