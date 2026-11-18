import React, { useState } from 'react';
import Link from 'next/link';
import { formatYear, getTaxonomyName } from '@/utils/taxonomy';
import styles from '@/styles/MovieCards.module.css';
import type { MovieLite } from './MovieCardVertical';

/**
 * An avant-garde 16:9 cinema widescreen card with a giant outlined rank number.
 */

/**
 * Picks a usable backdrop URL from the many fields the API may return.
 * Only `http(s)` and `data:image` sources are accepted, everything else
 * falls back to the placeholder image.
 */
const resolveBackdropSrc = (
  movie: Record<string, unknown> | null | undefined,
  fallback: string
): string => {
  if (!movie || typeof movie !== 'object') return fallback;
  const candidates = [
    movie.backdrop_url,
    movie.backdropUrl,
    movie.poster_url,
    movie.posterUrl,
    movie.thumb_url,
    movie.thumbUrl,
    movie.imagePoster,
    movie.poster_path,
    movie.posterPath
  ];
  for (const raw of candidates) {
    if (typeof raw !== 'string') continue;
    const v = raw.trim();
    if (!v) continue;
    if (/^https?:\/\//i.test(v)) return v;
    if (/^data:image\//i.test(v)) return v;
  }
  return fallback;
};

export interface MovieCardHorizontalProps {
  movie?: MovieLite | null;
  rank?: number;
  badge?: string;
  onMouseEnter?: (movie: MovieLite) => void;
  onMouseLeave?: (movie: MovieLite) => void;
  onPlayTrailer?: (movie: MovieLite) => void;
  className?: string;
}

const MovieCardHorizontal: React.FC<MovieCardHorizontalProps> = ({
  movie,
  rank,
  badge,
  onMouseEnter,
  onMouseLeave,
  onPlayTrailer,
  className = ''
}) => {
  const [imgSrc, setImgSrc] = useState<string>(() =>
    resolveBackdropSrc(movie as Record<string, unknown>, '/img/placeholder-backdrop.svg')
  );

  if (!movie) return null;

  // Format rank number with leading zero: "01", "02", ...
  const formattedRank: string | null = typeof rank === 'number' ? String(rank).padStart(2, '0') : null;

  // Extract rating
  const rawRating: number | string | undefined = movie?.vote_average || movie?.rating || movie?.tmdb?.vote_average;
  const ratingText: string | null = rawRating ? Number(rawRating).toFixed(1) : null;

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
          onError={() => {
            setImgSrc('/img/placeholder-backdrop.svg');
          }}
        />

        {/* Bottom Ambient Vignette Gradient */}
        <div className={styles.wideBottomFade} aria-hidden="true" />

        {/* Radar Pulse Play Button */}
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
          <h4 className={styles.wideTitle} title={getTaxonomyName(movie?.name)}>
            {getTaxonomyName(movie?.name)}
          </h4>
          <div className={styles.wideMetaRow}>
            {badge && (
              <span className={styles.wideBadge}>
                {getTaxonomyName(badge)}
              </span>
            )}
            {ratingText && (
              <span style={{ color: '#fbbf24', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                ★ {ratingText}
              </span>
            )}
            <span>{formatYear(movie?.year)}</span>
            <span className={styles.metaDot} aria-hidden="true" />
            <span className="text-truncate" style={{ maxWidth: '140px' }}>
              {getTaxonomyName(movie?.origin_name) || (movie?.type === 'series' ? 'Phim bộ' : 'Phim lẻ')}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default MovieCardHorizontal;
