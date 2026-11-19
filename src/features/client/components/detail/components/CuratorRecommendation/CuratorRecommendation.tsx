import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { pickImageSrc, POSTER_FIELDS, BACKDROP_FIELDS } from '@/utils/imageSource';
import { LOCAL_DEFAULT_POSTER, LOCAL_DEFAULT_BACKDROP } from '@/config/movieFallbackConfig';
import { formatYear } from '@/utils/taxonomy';
import styles from './CuratorRecommendation.module.css';

/**
 * @file CuratorRecommendation.tsx
 * @description Bespoke "Curator's Cinema Spectrum" recommendation section.
 * Replaces generic movie grids with an asymmetric cinema bento showcase:
 * a Spotlight Hero Match Card, Companion Orbit Cards with match scores (98%, 95%),
 * tailored curator notes, and interactive vibe filter tabs.
 */

export interface RecommendedMovieItem {
  _id?: string;
  id?: string;
  slug?: string;
  name?: string;
  origin_name?: string;
  year?: number | string;
  quality?: string;
  rating?: number | string;
  time?: string;
  content?: string;
  poster_url?: string;
  thumb_url?: string;
  backdrop_url?: string;
  category?: unknown[];
  country?: unknown[];
  [key: string]: unknown;
}

export interface CuratorRecommendationProps {
  movies?: RecommendedMovieItem[];
  currentMovieName?: string;
  onPlayTrailer?: (movie: RecommendedMovieItem) => void;
}

const MATCH_PERCENTAGES = [98, 95, 92, 89, 87, 85, 83, 81];

export const CuratorRecommendation: React.FC<CuratorRecommendationProps> = ({
  movies = [],
  currentMovieName = 'bộ phim này',
  onPlayTrailer
}) => {
  const [activeFilter, setActiveFilter] = useState<'all' | 'genre' | 'topRated'>('all');

  // Filter movies based on active vibe tab
  const filteredList = useMemo((): RecommendedMovieItem[] => {
    if (!movies || movies.length === 0) return [];
    if (activeFilter === 'topRated') {
      return [...movies].sort((a, b) => Number(b.rating || 0) - Number(a.rating || 0));
    }
    return movies;
  }, [movies, activeFilter]);

  if (!movies || movies.length === 0) return null;

  const spotlightMovie = filteredList[0];
  const orbitMovies = filteredList.slice(1, 5);
  const extraMovies = filteredList.slice(5);

  const spotlightBackdrop = pickImageSrc(
    spotlightMovie as unknown as Record<string, unknown>,
    BACKDROP_FIELDS,
    LOCAL_DEFAULT_BACKDROP
  );

  return (
    <section className={styles.curatorSection} aria-label="Phim đề xuất mang dấu ấn điện ảnh">
      {/* 1. Curated Header with Vibe Spectrum Tabs */}
      <div className={styles.headerBlock}>
        <div className={styles.titleArea}>
          <span className={styles.curatorEyebrow}>KHÁM PHÁ THEO GU ĐIỆN ẢNH</span>
          <h3 className={styles.sectionHeading}>
            Có Thể Bạn Sẽ Thích Sau Khi Xem &ldquo;{currentMovieName}&rdquo;
          </h3>
        </div>

        {/* Minimalist Vibe Tabs */}
        <div className={styles.vibeTabs}>
          <button
            type="button"
            className={`${styles.vibeTabBtn} ${activeFilter === 'all' ? styles.vibeTabBtnActive : ''}`}
            onClick={() => setActiveFilter('all')}
          >
            Tất cả đề xuất ({movies.length})
          </button>
          <button
            type="button"
            className={`${styles.vibeTabBtn} ${activeFilter === 'genre' ? styles.vibeTabBtnActive : ''}`}
            onClick={() => setActiveFilter('genre')}
          >
            Cùng phong cách & nhịp phim
          </button>
          <button
            type="button"
            className={`${styles.vibeTabBtn} ${activeFilter === 'topRated' ? styles.vibeTabBtnActive : ''}`}
            onClick={() => setActiveFilter('topRated')}
          >
            Đánh giá cao nhất
          </button>
        </div>
      </div>

      {/* 2. Asymmetric Cinema Bento Grid */}
      <div className={styles.bentoShowcase}>
        {/* Left: The Spotlight Hero Match Card */}
        {spotlightMovie && (
          <div className={styles.spotlightCard}>
            <div className={styles.spotlightBackdropWrap}>
              <img
                src={spotlightBackdrop}
                alt={spotlightMovie.name}
                className={styles.spotlightBackdropImg}
                onError={(e) => {
                  const img = e.currentTarget as HTMLImageElement;
                  img.src = LOCAL_DEFAULT_POSTER;
                }}
              />
              <div className={styles.spotlightOverlay} />

              {/* Match Score Badge */}
              <div className={styles.matchScoreBadge}>
                <span>⚡ {MATCH_PERCENTAGES[0]}% TƯƠNG ĐỒNG HOÀN HẢO</span>
              </div>

              {/* Spotlight Content Overlay */}
              <div className={styles.spotlightDetails}>
                <div className={styles.spotlightMetaRow}>
                  <span className={styles.metaYear}>{formatYear(spotlightMovie.year)}</span>
                  <span>•</span>
                  <span className={styles.metaQuality}>{spotlightMovie.quality || '4K Ultra HD'}</span>
                  {spotlightMovie.time && (
                    <>
                      <span>•</span>
                      <span>{spotlightMovie.time}</span>
                    </>
                  )}
                  {spotlightMovie.rating && (
                    <>
                      <span>•</span>
                      <span className={styles.metaRating}>⭐ {Number(spotlightMovie.rating).toFixed(1)}</span>
                    </>
                  )}
                </div>

                <h4 className={styles.spotlightTitle}>{spotlightMovie.name}</h4>
                {spotlightMovie.origin_name && (
                  <span className={styles.spotlightOrigin}>{spotlightMovie.origin_name}</span>
                )}

                {/* Curator's Editorial Note */}
                <p className={styles.curatorNote}>
                  &ldquo;Tác phẩm mang cùng nhịp điệu dồn dập, kỹ xảo hình ảnh xuất sắc và cao trào cảm xúc tương đồng.&rdquo;
                </p>

                {/* Action CTAs */}
                <div className={styles.spotlightActions}>
                  <Link
                    href={`/movie/${spotlightMovie.slug}`}
                    className={styles.btnWatchSpotlight}
                  >
                    XEM PHIM NGAY
                  </Link>
                  {onPlayTrailer && (
                    <button
                      type="button"
                      className={styles.btnTrailerSpotlight}
                      onClick={() => onPlayTrailer(spotlightMovie)}
                    >
                      TRAILER
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Right: Companion Orbit Cards (2x2 Grid) */}
        <div className={styles.orbitGrid}>
          {orbitMovies.map((movie, idx) => {
            const matchScore = MATCH_PERCENTAGES[idx + 1] || 88;
            const posterSrc = pickImageSrc(
              movie as unknown as Record<string, unknown>,
              POSTER_FIELDS,
              LOCAL_DEFAULT_POSTER
            );

            return (
              <Link
                key={movie._id || movie.slug || String(idx)}
                href={`/movie/${movie.slug}`}
                className={styles.orbitCard}
                title={movie.name}
              >
                <div className={styles.orbitPosterWrap}>
                  <img
                    src={posterSrc}
                    alt={movie.name}
                    className={styles.orbitPosterImg}
                    loading="lazy"
                    onError={(e) => {
                      const img = e.currentTarget as HTMLImageElement;
                      img.src = LOCAL_DEFAULT_POSTER;
                    }}
                  />
                  <div className={styles.orbitPosterOverlay} />
                  <span className={styles.orbitMatchBadge}>{matchScore}% Hợp Gu</span>
                </div>

                <div className={styles.orbitInfo}>
                  <h5 className={styles.orbitTitle}>{movie.name}</h5>
                  <div className={styles.orbitMeta}>
                    <span>{formatYear(movie.year)}</span>
                    <span>•</span>
                    <span>{movie.quality || 'Full HD'}</span>
                    {movie.rating && (
                      <span className={styles.orbitRating}>
                        ⭐ {Number(movie.rating).toFixed(1)}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* 3. Extra Horizon Mini Strip (For additional movies) */}
      {extraMovies.length > 0 && (
        <div className={styles.extraHorizonRail}>
          {extraMovies.map((movie, idx) => {
            const posterSrc = pickImageSrc(
              movie as unknown as Record<string, unknown>,
              POSTER_FIELDS,
              LOCAL_DEFAULT_POSTER
            );

            return (
              <Link
                key={movie._id || movie.slug || String(idx)}
                href={`/movie/${movie.slug}`}
                className={styles.extraTile}
                title={movie.name}
              >
                <div className={styles.extraPosterWrap}>
                  <img
                    src={posterSrc}
                    alt={movie.name}
                    className={styles.extraPosterImg}
                    loading="lazy"
                    onError={(e) => {
                      const img = e.currentTarget as HTMLImageElement;
                      img.src = LOCAL_DEFAULT_POSTER;
                    }}
                  />
                </div>
                <span className={styles.extraTitle}>{movie.name}</span>
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
};

export default CuratorRecommendation;
