/**
 * @file BigSlideBanner.tsx
 * @description Cinematic widescreen anime spotlight banner.
 * Elevated height with minimal filter overlays to highlight vivid anime artwork.
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import Skeleton from '@/features/shared/components/UI/Skeleton';
import SectionHeader from '@/features/shared/components/MovieSection/SectionHeader';
import styles from './BigSlideBanner.module.css';
import {
  pickImageSrc,
  BACKDROP_FIELDS,
  THUMB_FIELDS,
  FALLBACK_BACKDROP,
  FALLBACK_POSTER
} from '@/utils/imageSource';
import { hasValidTrailer } from '@/utils/trailer';
import { formatYear, getTaxonomyName } from '@/utils/taxonomy';

/** A raw movie coming from the API. The shape is loose. */
export type SpotlightMovie = Record<string, unknown> & {
  _id?: string;
  id?: string;
  slug?: string;
  name?: string;
  origin_name?: string;
  rating?: number | string;
  quality?: string;
  lang?: string;
  year?: number | string;
  time?: string;
  content?: string;
  status?: string;
  poster_url?: string;
  thumb_url?: string;
  backdrop_url?: string;
};

/** Props cho BigSlideBanner */
export interface BigSlideBannerProps {
  movies?: SpotlightMovie[];
  loading?: boolean;
  onPlayTrailer?: (movie: SpotlightMovie) => void;
  title?: string;
  badge?: string;
  viewAllHref?: string;
  autoPlayInterval?: number;
}

/** Skeleton export */
export const BigSlideBannerSkeleton: React.FC<{ title?: string }> = ({ title = 'Tiêu Điểm Anime' }) => (
  <section className={styles.bigSlideSection} aria-label="Đang tải anime tiêu điểm">
    {title && (
      <SectionHeader
        title={title}
        viewAllHref="/genre/hoat-hinh"
        viewAllText="Xem tất cả anime"
      />
    )}
    <div
      className={styles.bigSlideContainer}
      style={{
        minHeight: '360px',
        background: '#111827',
        borderRadius: '12px',
        overflow: 'hidden',
        position: 'relative'
      }}
    >
      <Skeleton height="360px" width="100%" borderRadius="12px" />
      <div
        className={styles.contentBox}
        style={{
          position: 'absolute',
          bottom: '2rem',
          left: '2rem',
          zIndex: 3,
          maxWidth: '500px'
        }}
      >
        <Skeleton width="120px" height="24px" borderRadius="4px" />
        <div style={{ margin: '1rem 0' }}>
          <Skeleton width="340px" height="36px" borderRadius="6px" />
        </div>
        <div style={{ display: 'flex', gap: '0.8rem' }}>
          <Skeleton width="130px" height="42px" borderRadius="20px" />
          <Skeleton width="110px" height="42px" borderRadius="20px" />
        </div>
      </div>
    </div>
  </section>
);

const BigSlideBanner: React.FC<BigSlideBannerProps> = ({
  movies = [],
  loading = false,
  onPlayTrailer,
  title = 'Tiêu Điểm Anime',
  badge = 'ANIME SPOTLIGHT',
  viewAllHref = '/genre/hoat-hinh',
  autoPlayInterval = 7000
}) => {
  const rawMovies: SpotlightMovie[] = Array.isArray(movies) ? movies : [];

  // The defense in depth: only the movies with a valid trailer are shown.
  // The rule used to be applied only in `useHomeData`, so another caller
  // that passed the prop `movies` without the filter could still show a
  // movie without a trailer, and the "Trailer" button opened an empty
  // modal.
  const displayMovies = useMemo(
    () => rawMovies.filter((m) => hasValidTrailer(m as never)),
    [rawMovies]
  );

  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [backdropSrc, setBackdropSrc] = useState<string>(FALLBACK_BACKDROP);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // The index is clamped inside the valid range. When the prop `movies`
  // changes and the filter removes some movies, `currentIndex` never
  // points to a movie that disappeared.
  const safeIndex = displayMovies.length === 0
    ? 0
    : Math.min(currentIndex, displayMovies.length - 1);
  const currentMovie: SpotlightMovie | undefined = displayMovies[safeIndex] || displayMovies[0];

  // The `backdropSrc` is updated every time the `currentMovie` changes.
  useEffect(() => {
    if (!currentMovie) {
      setBackdropSrc(FALLBACK_BACKDROP);
      return;
    }
    const src = pickImageSrc(
      currentMovie as Record<string, unknown>,
      BACKDROP_FIELDS,
      FALLBACK_BACKDROP
    );
    setBackdropSrc(src);
  }, [currentMovie]);

  // Smooth auto-play rotation
  useEffect(() => {
    if (!displayMovies || displayMovies.length <= 1) return;

    if (isPaused) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % displayMovies.length);
    }, autoPlayInterval);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [currentIndex, isPaused, displayMovies, autoPlayInterval]);

  const handleSelectSlide = (index: number): void => {
    if (displayMovies.length === 0) return;
    const safeClamped = Math.max(0, Math.min(index, displayMovies.length - 1));
    setCurrentIndex(safeClamped);
  };

  if (loading && !currentMovie) {
    return <BigSlideBannerSkeleton title={title} />;
  }

  if (!currentMovie) return null;

  const movieRating = currentMovie.rating ? Number(currentMovie.rating).toFixed(1) : '8.5';
  const movieQuality = getTaxonomyName(currentMovie.quality, '4K');
  const movieLang = getTaxonomyName(currentMovie.lang, 'Vietsub');
  const movieYear = formatYear(currentMovie.year, 2024);
  const movieTime = getTaxonomyName(currentMovie.time, '120 phút');

  return (
    <section className={styles.bigSlideSection} aria-label="Tiêu Điểm Anime">
      {/* Section Header */}
      {title && (
        <SectionHeader
          title={title}
          viewAllHref={viewAllHref}
          viewAllText="Xem tất cả anime"
        />
      )}

      <div
        className={styles.bigSlideContainer}
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        <div className={styles.slideWrapper}>
          {/* The background backdrop image.
           *
           * The `src` used to be taken directly from the payload
           * (`currentMovie.backdrop_url || poster_url || thumb_url`). When
           * every URL was empty, `<img src="">` did not trigger the
           * `onError` handler, so the background stayed completely black.
           * The `pickImageSrc` helper is used instead, to:
           *   1. Fall back to `FALLBACK_BACKDROP` when there is no valid
           *      URL.
           *   2. Provide an `onError` handler for a CDN that answers 404
           *      or returns the wrong content type.
           */}
          <img
            key={currentMovie._id || currentMovie.slug}
            src={backdropSrc}
            alt={getTaxonomyName(currentMovie.name)}
            className={styles.backdropImage}
            onError={() => {
              setBackdropSrc(FALLBACK_BACKDROP);
            }}
          />

          {/* Minimalist, Gentle Gradient Overlay */}
          <div className={styles.overlayGradient} />

          {/* Minimalist Content Information */}
          <div className={styles.contentBox}>
            {badge && (
              <div className={styles.badgeHighlight}>
                <span>{getTaxonomyName(badge)}</span>
              </div>
            )}

            <h2 className={styles.title}>{getTaxonomyName(currentMovie.name)}</h2>

            {currentMovie.origin_name && (
              <div className={styles.originTitle}>{getTaxonomyName(currentMovie.origin_name)}</div>
            )}

            <div className={styles.metaRow}>
              <span className={styles.ratingText}>
                <i className="fas fa-star" /> {movieRating}
              </span>
              <span className={styles.metaDot} aria-hidden="true" />
              <span>{movieYear}</span>
              <span className={styles.metaDot} aria-hidden="true" />
              <span>{movieTime}</span>
              <span className={styles.metaDot} aria-hidden="true" />
              <span className={styles.qualityTag}>{movieQuality}</span>
              <span className={styles.metaDot} aria-hidden="true" />
              <span className={styles.langText}>{movieLang}</span>
            </div>

            <p className={styles.synopsis}>{currentMovie.content}</p>

            <div className={styles.actions}>
              <Link href={`/movie/${currentMovie.slug}`} className={styles.btnPlay}>
                <i className="fas fa-play" />
                <span>Xem phim</span>
              </Link>

              {onPlayTrailer && (
                <button
                  type="button"
                  className={styles.btnTrailer}
                  onClick={() => onPlayTrailer(currentMovie)}
                >
                  <i className="fas fa-film" />
                  <span>Trailer</span>
                </button>
              )}
            </div>
          </div>

          {/* Quick-Switch Thumbnails Navigation */}
          {displayMovies.length > 1 && (
            <div className={styles.thumbnailsNav}>
              {displayMovies.slice(0, 5).map((movie, idx) => (
                <div
                  key={movie._id || movie.slug || String(idx)}
                  className={`${styles.thumbItem} ${idx === safeIndex ? styles.thumbItemActive : ''}`}
                  onClick={() => handleSelectSlide(idx)}
                  title={movie.name}
                >
                  <img
                    src={pickImageSrc(
                      movie as Record<string, unknown>,
                      THUMB_FIELDS,
                      FALLBACK_POSTER
                    )}
                    alt={movie.name}
                    className={styles.thumbImg}
                    loading="lazy"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = FALLBACK_POSTER;
                    }}
                  />
                </div>
              ))}
            </div>
          )}

          {/* Auto-Slide Hardware Accelerated Progress Bar */}
          <div
            key={safeIndex}
            className={`${styles.progressBar} ${isPaused ? styles.progressBarPaused : ''}`}
            style={{ animationDuration: `${autoPlayInterval}ms` }}
          />
        </div>
      </div>
    </section>
  );
};

export default BigSlideBanner;
