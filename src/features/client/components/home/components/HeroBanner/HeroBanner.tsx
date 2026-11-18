/**
 * @file HeroBanner.tsx
 * @description Cinematic hero banner component with spotlight movie rotation and clean data handling.
 */

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Skeleton from '@/features/shared/components/UI/Skeleton';
import styles from '@/styles/HeroBanner.module.css';
import {
  MOVIE_CONFIG,
  normalizeHeroMovie,
  LOCAL_DEFAULT_BACKDROP
} from '@/config/movieConfig';
import { hasValidTrailer } from '@/utils/trailer';
import { formatYear, getTaxonomyName } from '@/utils/taxonomy';

/** A category entry used for the pill chips. */
interface CategoryEntry {
  slug?: string;
  name?: string;
}

/** A raw movie coming from the API. The shape is loose. */
export type HeroMovie = Record<string, unknown> & {
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
  description?: string;
  status?: string;
  type?: string;
  episode_current?: string;
  episode_total?: number;
  category?: CategoryEntry[];
  poster_url?: string;
  thumb_url?: string;
  backdrop_url?: string;
};

/** Props cho HeroBanner */
export interface HeroBannerProps {
  movies?: HeroMovie[];
  loading?: boolean;
  onPlayTrailer?: (movie: HeroMovie) => void;
}

/** Props cho SpotlightDock */
interface SpotlightDockProps {
  movies: HeroMovie[];
  currentIndex: number;
  onSelect: (index: number) => void;
}

/**
 * Skeleton component preserving exact 100vh / 680px hero bounding box while loading.
 */
export const HeroBannerSkeleton: React.FC = () => {
  return (
    <section className={styles.heroBanner} aria-label="Đang tải phim tiêu điểm" style={{ pointerEvents: 'none' }}>
      {/* Background Media Placeholder with shimmer */}
      <div className={styles.heroImage} style={{ background: '#0d1117' }}>
        <div
          className="skeleton-loading"
          style={{
            width: '100%',
            height: '100%',
            background: 'linear-gradient(90deg, #111827 0%, #1c2738 50%, #111827 100%)',
            backgroundSize: '200% 100%',
            animation: 'skeleton-loading 1.8s infinite ease-in-out'
          }}
        />
        <div className={styles.overlay} />
      </div>

      {/* Main Two-Column Container */}
      <div className={styles.heroContainer}>
        {/* Left Column: Movie Details Placeholder */}
        <div className={styles.heroDetails}>
          {/* Badge silhouettes */}
          <div className={styles.badgeGroup} style={{ gap: '0.6rem', display: 'flex' }}>
            <Skeleton width="90px" height="26px" borderRadius="4px" />
            <Skeleton width="55px" height="26px" borderRadius="4px" />
            <Skeleton width="110px" height="26px" borderRadius="4px" />
          </div>

          {/* Title silhouette */}
          <div style={{ margin: '1.2rem 0 0.8rem 0' }}>
            <Skeleton width="65%" height="48px" borderRadius="6px" />
          </div>

          {/* Subtitle silhouette */}
          <div style={{ marginBottom: '1.2rem' }}>
            <Skeleton width="40%" height="22px" borderRadius="4px" />
          </div>

          {/* Meta detail row */}
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.4rem' }}>
            <Skeleton width="60px" height="18px" borderRadius="4px" />
            <Skeleton width="80px" height="18px" borderRadius="4px" />
            <Skeleton width="70px" height="18px" borderRadius="4px" />
          </div>

          {/* Description lines */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginBottom: '2rem', maxWidth: '620px' }}>
            <Skeleton width="100%" height="16px" borderRadius="4px" />
            <Skeleton width="90%" height="16px" borderRadius="4px" />
            <Skeleton width="75%" height="16px" borderRadius="4px" />
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <Skeleton width="150px" height="46px" borderRadius="24px" />
            <Skeleton width="130px" height="46px" borderRadius="24px" />
            <Skeleton width="46px" height="46px" borderRadius="50%" />
          </div>
        </div>

        {/* Right Dock Placeholder */}
        <aside className={styles.spotlightDock} aria-hidden="true">
          <div className={styles.dockTrack}>
            {[1, 2, 3, 4].map((i) => (
              <div
                key={`dock-skel-${i}`}
                style={{
                  width: '90px',
                  height: '52px',
                  borderRadius: '6px',
                  overflow: 'hidden',
                  background: '#161f2e',
                  border: '1px solid rgba(255, 255, 255, 0.08)'
                }}
              >
                <Skeleton width="100%" height="100%" />
              </div>
            ))}
          </div>
        </aside>
      </div>
    </section>
  );
};

/**
 * Truncates text to a specified maximum length with ellipsis.
 */
const truncateText = (text: string | null | undefined, maxLength: number): string => {
  if (!text) return '';
  return text.length > maxLength ? `${text.substring(0, maxLength).trim()}...` : text;
};

/**
 * Resolves episode, series progress, or release status for badges.
 * Gracefully returns null for standalone released movies.
 */
const resolveSeriesStatus = (movie: HeroMovie | null | undefined): string | null => {
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
 */
const renderCategoryPills = (categories: CategoryEntry[] | undefined | null): React.ReactNode => {
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
 */
const SpotlightDock: React.FC<SpotlightDockProps> = ({ movies, currentIndex, onSelect }) => {
  if (!movies || movies.length <= 1) return null;

  return (
    <aside className={styles.spotlightDock} aria-label="Danh sách phim tiêu điểm">
      <div className={styles.dockTrack} role="tablist" aria-label="Các phim tiêu điểm">
        {movies.map((movie, idx) => {
          const isActive = idx === currentIndex;
          const cardThumb = movie.thumb_url || movie.poster_url || movie.backdrop_url || LOCAL_DEFAULT_BACKDROP;

          return (
            <button
              key={movie._id || String(idx)}
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
                onError={(e) => {
                  const img = e.currentTarget as HTMLImageElement;
                  img.onerror = null;
                  img.src = LOCAL_DEFAULT_BACKDROP;
                }}
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
 */
const HeroBanner: React.FC<HeroBannerProps> = ({ movies = [], loading = false, onPlayTrailer }) => {
  // Use passed movies normalized defensively.
  const rawList = movies && Array.isArray(movies) && movies.length > 0 ? movies.slice(0, 5) : [];
  const candidateMovies = rawList.map((m, idx) => normalizeHeroMovie(m as never, idx) as unknown as HeroMovie);

  // The defense in depth: the new hero only shows the movies that have a
  // valid trailer. The rule used to be applied only in
  // `useHomeData.compactHeroMovies`, so when another caller passed `movies`
  // without that filter, a movie without a trailer could still reach the
  // hero and the "Trailer" button opened an empty modal. The same single
  // source of truth helper (`hasValidTrailer`) is used, so the behavior of
  // the hero always matches the other rails.
  const trailerableMovies = candidateMovies.filter((m) => hasValidTrailer(m as never));

  const [currentIndex, setCurrentIndex] = useState<number>(0);

  // The `currentIndex` can already point to a movie that was removed
  // after the prop `movies` changed (for example: at the start there were
  // the movies A, B and C, and after the filter only A is left). The index
  // is always kept inside the remaining list.
  const safeIndex = trailerableMovies.length === 0
    ? 0
    : Math.min(currentIndex, trailerableMovies.length - 1);
  const activeMovie = trailerableMovies[safeIndex] || trailerableMovies[0];

  /**
   * Advances the hero spotlight to the next featured movie.
   */
  const handleNextSpotlight = useCallback((): void => {
    if (trailerableMovies.length <= 1) return;
    setCurrentIndex((prev) => (prev + 1) % trailerableMovies.length);
  }, [trailerableMovies.length]);

  /**
   * Sets up auto-cycling of spotlight movies.
   */
  useEffect(() => {
    if (trailerableMovies.length <= 1) return;
    const interval = setInterval(handleNextSpotlight, MOVIE_CONFIG.hero.autoPlayInterval);
    return () => clearInterval(interval);
  }, [trailerableMovies.length, handleNextSpotlight]);

  /**
   * Selects a specific featured movie by index.
   */
  const handleSelectSpotlight = (index: number): void => {
    // The index is clamped inside the valid range of the current list.
    if (trailerableMovies.length === 0) return;
    const safeClamped = Math.max(0, Math.min(index, trailerableMovies.length - 1));
    setCurrentIndex(safeClamped);
  };

  // IMPORTANT: the skeleton is only shown while the data is REALLY
  // loading. The condition used to be `loading || !activeMovie`, which
  // left the hero on the skeleton FOREVER when the list was empty (for
  // example when every returned movie had `trailer: null` and was removed
  // by `filterMoviesWithValidTrailer`). When the load is finished and
  // there is no movie at all, `null` is rendered instead, so the user
  // never stares at a permanent skeleton block.
  if (loading) {
    return <HeroBannerSkeleton />;
  }

  if (!activeMovie) {
    return null;
  }

  const seriesStatusText = resolveSeriesStatus(activeMovie);

  return (
    <section className={styles.heroBanner} aria-label="Featured Movie Spotlight">
      {/* Background Media */}
      <div className={styles.heroImage}>
        <img
          key={activeMovie._id || String(currentIndex)}
          src={activeMovie.backdrop_url}
          alt={activeMovie.name || 'Featured Movie'}
          className={styles.bannerImage}
          onError={(e) => {
            const img = e.currentTarget as HTMLImageElement;
            img.onerror = null;
            img.src = LOCAL_DEFAULT_BACKDROP;
          }}
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
              {activeMovie.quality || 'FHD'}
            </span>

            {seriesStatusText && (
              <span className={styles.seriesBadge}>
                <i className="fas fa-layer-group me-1" />
                {seriesStatusText}
              </span>
            )}

            {activeMovie.lang && (
              <span className={styles.langBadge}>{getTaxonomyName(activeMovie.lang)}</span>
            )}

            {activeMovie.year && (
              <>
                <span className={styles.metaDot} />
                <span className={styles.metaItem}>{formatYear(activeMovie.year)}</span>
              </>
            )}

            {activeMovie.time && (
              <>
                <span className={styles.metaDot} />
                <span className={styles.metaItem}>{getTaxonomyName(activeMovie.time)}</span>
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
            {onPlayTrailer && activeMovie.status !== 'upcoming' && (
              <button
                type="button"
                className={styles.btnSecondary}
                id="hero-btn-trailer"
                onClick={() => onPlayTrailer(activeMovie)}
                title={`Xem trailer ${activeMovie.name}`}
              >
                <i className="fas fa-film text-danger" /> Trailer
              </button>
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
          movies={trailerableMovies}
          currentIndex={safeIndex}
          onSelect={handleSelectSpotlight}
        />
      </div>
    </section>
  );
};

export default HeroBanner;
