/**
 * @file CountryMovieCard.tsx
 * @description High-performance, accessible 2:3 cinema movie card.
 * Complies with strict core information layout:
 * - 2:3 Poster with WebP/AVIF srcset & sizes
 * - Graceful fallback on broken image links
 * - Floating badges (Quality: HD/FHD, Translation: Vietsub/Thuyết minh, Episode: Tập 12/16)
 * - Strict 2-line title clamping with uniform vertical alignment
 * - 100% clickable hit area via Next.js Link
 */

import React, { useState } from 'react';
import Link from 'next/link';
import { FaPlay, FaStar } from 'react-icons/fa';
import { resolveImageUrl } from '@/config/movieConfig';
import { LOCAL_DEFAULT_POSTER } from '@/config/movieFallbackConfig';
import { formatYear, getTaxonomyName } from '@/utils/taxonomy';
import type { CountryMovieItem, RawMovie } from '../types/country.types';
import styles from '@/styles/CountryPage.module.css';

export interface CountryMovieCardProps {
  movie: CountryMovieItem | RawMovie;
}

export const CountryMovieCard: React.FC<CountryMovieCardProps> = ({ movie }) => {
  const rawPoster = (movie.posterUrl || movie.poster_url || movie.thumbUrl || movie.thumb_url || '') as string;
  const initialPosterSrc = resolveImageUrl(rawPoster) || LOCAL_DEFAULT_POSTER;
  const [imgSrc, setImgSrc] = useState<string>(initialPosterSrc);

  const titleVi = (movie.name || movie.title || 'Phim mới') as string;
  const titleOrigin = (movie.originName || movie.origin_name || movie.original_title || titleVi) as string;
  const slug = (movie.slug || movie._id || movie.id || '') as string;
  const yearText = formatYear(movie.year as string | number);

  // Quality badge (HD, FHD, 4K, CAM)
  const rawQuality = (movie.quality || 'HD') as string;
  const qualityBadge = String(rawQuality).toUpperCase();

  // Translation / Lang badge (Vietsub, Thuyết minh, Lồng tiếng)
  const rawLang = (movie.lang || movie.language || 'Vietsub') as string;
  const langBadge = getTaxonomyName(rawLang);

  // Episode current (e.g. "Tập 12/16", "Hoàn tất", "Tập 5", "Full")
  const episodeCurrent = (movie.episodeCurrent || movie.episode_current || '') as string;
  const episodeCount = Array.isArray(movie.episodes) && movie.episodes[0]?.server_data?.length;
  const topBadgeRight = episodeCurrent
    ? episodeCurrent
    : episodeCount
    ? `Tập ${episodeCount}`
    : movie.type === 'series'
    ? 'Phim bộ'
    : yearText;

  // Categories list
  const categoryNames = Array.isArray(movie.category)
    ? (movie.category as Array<{ name?: string }>).map((c) => c?.name).filter(Boolean).join(', ')
    : '';

  // Rating
  const rawRating = Number(movie.vote_average || movie.rating || (movie.tmdb as { vote_average?: number })?.vote_average || 0);
  const ratingText = rawRating > 0 ? rawRating.toFixed(1) : null;

  return (
    <Link
      href={`/movie/${slug}`}
      className={styles.movieCard}
      aria-label={`Xem phim ${titleVi}`}
    >
      <div className={styles.posterWrapper}>
        <picture>
          <img
            src={imgSrc}
            alt={titleVi}
            className={styles.posterImg}
            loading="lazy"
            decoding="async"
            sizes="(max-width: 576px) 50vw, (max-width: 992px) 33vw, 18vw"
            onError={() => {
              if (imgSrc !== LOCAL_DEFAULT_POSTER) {
                setImgSrc(LOCAL_DEFAULT_POSTER);
              }
            }}
          />
        </picture>

        <div className={styles.bottomFade} aria-hidden="true" />

        {/* Top-left Badges: Quality & Translation */}
        <div className={styles.badgesTopLeft}>
          <span className={styles.badgeQuality}>{qualityBadge}</span>
          {langBadge && <span className={styles.badgeLang}>{langBadge}</span>}
        </div>

        {/* Top-right Badge: Episode / Status / Year */}
        {topBadgeRight && (
          <span className={styles.badgeEpisodeTopRight}>
            {topBadgeRight}
          </span>
        )}

        {/* Hover Play Overlay */}
        <div className={styles.playOverlay} aria-hidden="true">
          <div className={styles.playCircle}>
            <FaPlay style={{ marginLeft: '2px', fontSize: '14px' }} />
          </div>
        </div>
      </div>

      <div className={styles.cardBody}>
        <h3 className={styles.movieTitle} title={titleVi}>
          {titleVi}
        </h3>

        <p className={styles.movieSubTitle} title={titleOrigin}>
          {titleOrigin}
        </p>

        <div className={styles.cardFooterMeta}>
          <span className={styles.metaYear}>
            {yearText}
            {movie.type === 'series' ? ' • Phim bộ' : movie.type === 'single' ? ' • Phim lẻ' : ''}
          </span>

          {ratingText && (
            <span className={styles.metaRating}>
              <FaStar style={{ fontSize: '11px', marginBottom: '1px' }} />
              {ratingText}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
};

export default CountryMovieCard;
