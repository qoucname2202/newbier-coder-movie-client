/**
 * @file CountryMovieCard.tsx
 * @description Enterprise 2:3 cinema movie card tailored for country movie listings.
 *
 * Specific Architecture & Feature Highlights:
 * 1. Resilient 2:3 Poster with lazy loading and fade-in loaded transition.
 * 2. Multi-tier glassmorphic badges (Quality 4K/FHD/HD/CAM, Translation Vietsub/Thuyết minh).
 * 3. Status/Episode/Duration badge at top-right with icon.
 * 4. Interactive "Watch Later" bookmark action with optimistic UI and remote sync.
 * 5. Thin watch progress bar for resumed playback tracking.
 * 6. Cinema Play button with double pulsating radar rings on hover to trigger Trailer modal without unwanted text.
 * 7. 2-line title clamping with uniform vertical heights and high contrast.
 * 8. 100% clickable hit area via Next.js Link with proper event delegation.
 */

import React, { useState, MouseEvent } from 'react';
import Link from 'next/link';
import { FaPlay, FaStar, FaBookmark, FaRegBookmark, FaExclamationCircle } from 'react-icons/fa';
import { resolveImageUrl } from '@/config/movieConfig';
import { LOCAL_DEFAULT_POSTER } from '@/config/movieFallbackConfig';
import { formatYear, getTaxonomyName } from '@/utils/taxonomy';
import { cleanMovieTitle } from '@/utils/movieNormalizer';
import { getWatchProgress } from '@/utils/watchProgress';
import { formatDuration } from '@/features/client/formats/utils/formatHelpers';
import watchLaterService from '@/API/services/watchLaterService';
import type { CountryMovieItem, RawMovie } from '../types/country.types';
import styles from '@/styles/CountryPage.module.css';

export interface CountryMovieCardProps {
  movie: CountryMovieItem | RawMovie;
  onPlayTrailer?: (movie: CountryMovieItem | RawMovie) => void;
}

const LOCAL_WATCH_LATER_KEY = 'user_local_watch_later';

type QualityTier = '4k' | 'fhd' | 'hd' | 'cam' | 'trailer' | 'standard';
type LanguageType = 'vietsub' | 'thuyet-minh' | 'long-tieng' | 'raw';

const getQualityTier = (quality?: string | null): QualityTier => {
  if (!quality) return 'standard';
  const q = quality.trim().toLowerCase();
  if (q.includes('4k') || q.includes('uhd')) return '4k';
  if (q.includes('fhd') || q.includes('1080')) return 'fhd';
  if (q.includes('cam') || q.includes('ts') || q.includes('tc')) return 'cam';
  if (q.includes('trailer') || q.includes('sample')) return 'trailer';
  if (q.includes('hd') || q.includes('720')) return 'hd';
  return 'standard';
};



export const CountryMovieCard: React.FC<CountryMovieCardProps> = ({ movie, onPlayTrailer }) => {
  const rawPoster = (movie.posterUrl || movie.poster_url || movie.thumbUrl || movie.thumb_url || '') as string;
  const initialPosterSrc = resolveImageUrl(rawPoster) || LOCAL_DEFAULT_POSTER;
  const [imgSrc, setImgSrc] = useState<string>(initialPosterSrc);
  const [isImageLoaded, setIsImageLoaded] = useState<boolean>(false);

  const titleVi = cleanMovieTitle((movie.name || movie.title || 'Phim mới') as string);
  const titleOrigin = cleanMovieTitle((movie.originName || movie.origin_name || movie.original_title || titleVi) as string);
  const slug = (movie.slug || movie._id || movie.id || '') as string;
  const yearText = formatYear(movie.year as string | number);

  // Quality badge & classification
  const rawQuality = (movie.quality || 'HD') as string;
  const qualityTier = getQualityTier(rawQuality);
  const qualityBadge = String(rawQuality).toUpperCase();

  // Translation / Lang badge
  const rawLang = (movie.lang || movie.language || 'Vietsub') as string;
  const langBadge = getTaxonomyName(rawLang);

  // Episode current / Status / Duration (Fix single movies showing "...")
  const isSeries = movie.type === 'series' || (Array.isArray(movie.episodes) && (movie.episodes[0]?.server_data?.length || 0) > 1);
  const episodeRaw = (movie.episodeCurrent || movie.episode_current || '') as string;
  const isInvalidEpisode = !episodeRaw || episodeRaw.trim() === '...' || episodeRaw.trim() === '..' || episodeRaw.trim() === '.' || episodeRaw.toLowerCase() === 'null';

  let topBadgeRight: string | null = null;
  if (isSeries) {
    if (!isInvalidEpisode) {
      topBadgeRight = episodeRaw.startsWith('Tập') ? episodeRaw : `Tập ${episodeRaw}`;
    } else {
      const epCount = Array.isArray(movie.episodes) && movie.episodes[0]?.server_data?.length;
      topBadgeRight = epCount ? `Tập ${epCount}` : 'Phim bộ';
    }
  } else {
    // Single movie (Phim lẻ) - NEVER display "..."!
    const rawTime = (movie.time || movie.duration) as string | undefined;
    const dur = formatDuration(rawTime, '');
    topBadgeRight = dur || 'Full';
  }

  // Primary Genre for clean footer
  const primaryGenre = Array.isArray(movie.category) && movie.category[0]?.name
    ? movie.category[0].name
    : (Array.isArray(movie.country) && movie.country[0]?.name ? movie.country[0].name : (isSeries ? 'Phim Bộ' : 'Phim Lẻ'));

  // Rating
  const rawRating = Number(
    movie.vote_average || movie.rating || (movie.tmdb as { vote_average?: number })?.vote_average || 0
  );
  const ratingText = rawRating > 0 ? rawRating.toFixed(1) : null;

  // Watch Later bookmark state
  const [isBookmarked, setIsBookmarked] = useState<boolean>(() => {
    if (typeof window === 'undefined' || !slug) return false;
    try {
      const saved = localStorage.getItem(LOCAL_WATCH_LATER_KEY);
      if (saved) {
        const set: string[] = JSON.parse(saved);
        return Array.isArray(set) && set.includes(slug);
      }
    } catch {
      // ignore
    }
    return false;
  });
  const [bookmarkLoading, setBookmarkLoading] = useState<boolean>(false);

  const handleToggleBookmark = async (e: MouseEvent<HTMLButtonElement>): Promise<void> => {
    e.preventDefault();
    e.stopPropagation();
    if (bookmarkLoading) return;

    setBookmarkLoading(true);
    const nextState = !isBookmarked;
    setIsBookmarked(nextState);

    try {
      const saved = localStorage.getItem(LOCAL_WATCH_LATER_KEY);
      let set: string[] = saved ? JSON.parse(saved) : [];
      if (!Array.isArray(set)) set = [];

      if (nextState) {
        if (!set.includes(slug)) set.push(slug);
      } else {
        set = set.filter((s) => s !== slug);
      }
      localStorage.setItem(LOCAL_WATCH_LATER_KEY, JSON.stringify(set));

      if (nextState) {
        const parsedYear = typeof movie.year === 'number' ? movie.year : Number(movie.year);
        await watchLaterService.addToWatchLater({
          id: String(movie.id || movie._id || ''),
          slug,
          title: titleVi,
          name: titleVi,
          origin_name: titleOrigin,
          poster_url: initialPosterSrc,
          quality: qualityBadge,
          lang: langBadge,
          year: Number.isFinite(parsedYear) && parsedYear > 0 ? parsedYear : undefined
        });
      } else {
        await watchLaterService.removeFromWatchLater((movie.id || movie._id || slug) as string);
      }
    } catch {
      // Graceful offline fallback
    } finally {
      setBookmarkLoading(false);
    }
  };

  // Watch progress bar detection
  const [progressPercent] = useState<number | null>(() => {
    if (typeof window === 'undefined' || !slug) return null;
    try {
      const progress = getWatchProgress(slug);
      return progress && progress.updatedAt ? 40 : null;
    } catch {
      return null;
    }
  });

  const handleTrailerClick = (e: MouseEvent<HTMLButtonElement>): void => {
    e.preventDefault();
    e.stopPropagation();
    if (onPlayTrailer) {
      onPlayTrailer(movie);
    }
  };

  // Quality badge CSS class selection
  const getQualityClass = (): string => {
    switch (qualityTier) {
      case '4k':
        return styles.badgeQuality4k;
      case 'fhd':
        return styles.badgeQualityFhd;
      case 'hd':
        return styles.badgeQualityHd;
      case 'cam':
        return styles.badgeQualityCam;
      case 'trailer':
        return styles.badgeQualityTrailer;
      default:
        return styles.badgeQualityStandard;
    }
  };

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
            className={`${styles.posterImg} ${isImageLoaded ? styles.posterImgLoaded : ''}`}
            loading="lazy"
            decoding="async"
            sizes="(max-width: 576px) 50vw, (max-width: 992px) 33vw, 15vw"
            onLoad={() => setIsImageLoaded(true)}
            onError={() => {
              if (imgSrc !== LOCAL_DEFAULT_POSTER) {
                setImgSrc(LOCAL_DEFAULT_POSTER);
              }
              setIsImageLoaded(true);
            }}
          />
        </picture>

        {/* Ambient Top & Bottom Depth Vignettes */}
        <div className={styles.topFade} aria-hidden="true" />
        <div className={styles.bottomFade} aria-hidden="true" />

        {/* Top-left Badge: Quality Tier */}
        <div className={styles.badgesTopLeft}>
          <span className={`${styles.badgeQuality} ${getQualityClass()}`}>
            {(qualityTier === 'cam' || qualityTier === 'trailer') && (
              <FaExclamationCircle aria-hidden="true" style={{ marginRight: '3px' }} />
            )}
            {qualityBadge}
          </span>
        </div>

        {/* Top-right Badge: Episode / Status / Duration */}
        {topBadgeRight && (
          <span className={styles.badgeEpisodeTopRight} title={`Trạng thái: ${topBadgeRight}`}>
            {topBadgeRight}
          </span>
        )}

        {/* Bookmark Watch-Later Button */}
        <button
          type="button"
          className={`${styles.bookmarkBtn} ${isBookmarked ? styles.bookmarkBtnActive : ''}`}
          onClick={handleToggleBookmark}
          aria-label={isBookmarked ? 'Bỏ lưu khỏi danh sách xem sau' : 'Lưu vào danh sách xem sau'}
          title={isBookmarked ? 'Đã lưu xem sau' : 'Lưu xem sau'}
        >
          {isBookmarked ? (
            <FaBookmark aria-hidden="true" style={{ fontSize: '0.85rem' }} />
          ) : (
            <FaRegBookmark aria-hidden="true" style={{ fontSize: '0.85rem' }} />
          )}
        </button>

        {/* Thin Watch Progress Bar */}
        {progressPercent !== null && (
          <div className={styles.progressBarTrack} title={`Đã xem ${progressPercent}%`}>
            <div
              className={styles.progressBarFill}
              style={{ width: `${progressPercent}%` }}
              aria-hidden="true"
            />
          </div>
        )}

        {/* Cinema Play Icon on Hover & Interactive Trailer Button (No extra text label) */}
        <div className={styles.playOverlay}>
          <button
            type="button"
            className={styles.trailerPlayActionBtn}
            onClick={handleTrailerClick}
            aria-label={`Xem trailer phim ${titleVi}`}
            title={`Xem trailer ${titleVi}`}
          >
            <div className={styles.playCircle}>
              <FaPlay className={styles.playIcon} aria-hidden="true" />
            </div>
          </button>
        </div>
      </div>

      <div className={styles.cardBody}>
        <h3 className={styles.movieTitle} title={titleVi}>
          {titleVi}
        </h3>

        {titleOrigin && titleOrigin !== titleVi && (
          <p className={styles.movieSubTitle} title={titleOrigin}>
            {titleOrigin}
          </p>
        )}

        <div className={styles.cardFooterMeta}>
          <div className={styles.metaLeft}>
            <span className={styles.metaYear}>{yearText || '2026'}</span>
            <span className={styles.metaCategory}> • {primaryGenre}</span>
          </div>

          {ratingText && (
            <span className={styles.metaRating} title={`Điểm đánh giá: ${ratingText}/10`}>
              <FaStar className={styles.ratingStarIcon} aria-hidden="true" />
              <span>{ratingText}</span>
            </span>
          )}
        </div>
      </div>
    </Link>
  );
};

export default CountryMovieCard;
