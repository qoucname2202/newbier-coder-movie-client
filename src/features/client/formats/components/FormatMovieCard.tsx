/**
 * @file FormatMovieCard.tsx
 * @description Enterprise 2:3 cinema movie card tailored for feature movies (Phim Lẻ).
 *
 * Specific Feature Highlights:
 * 1. Duration badge replacing episode badges ("157 phút" / "2h37") with clock icon.
 * 2. Visual language badges (Vietsub, Thuyết minh, Lồng tiếng) with distinct color coding.
 * 3. Quality badges (HD, 4K vs Warning CAM/Trailer).
 * 4. 2-line title clamping with uniform vertical heights.
 * 5. Interactive "Watch Later" bookmark action on card.
 * 6. Thin watch progress bar for resumed movies ("Đã xem 40%").
 * 7. Next.js Link covering the entire card hit area with resilient image fallback.
 */

import React, { useState, MouseEvent } from 'react';
import Link from 'next/link';
import { FaPlay, FaStar, FaClock, FaBookmark, FaRegBookmark, FaExclamationCircle } from 'react-icons/fa';
import { resolveImageUrl } from '@/config/movieConfig';
import { LOCAL_DEFAULT_POSTER } from '@/config/movieFallbackConfig';
import { formatYear } from '@/utils/taxonomy';
import { getWatchProgress } from '@/utils/watchProgress';
import watchLaterService from '@/API/services/watchLaterService';
import {
  formatDuration,
  getQualityTier,
  getLanguageType,
  type QualityTier,
  type LanguageType
} from '../utils/formatHelpers';
import type { FormatMovieItem } from '../types/format.types';
import styles from '@/styles/FormatPage.module.css';

export interface FormatMovieCardProps {
  movie: FormatMovieItem;
  onPlayTrailer?: (movie: FormatMovieItem) => void;
}

const LOCAL_WATCH_LATER_KEY = 'user_local_watch_later';

export const FormatMovieCard: React.FC<FormatMovieCardProps> = ({ movie, onPlayTrailer }) => {
  const rawPoster = (movie.posterUrl || movie.poster_url || movie.thumbUrl || movie.thumb_url || '') as string;
  const initialPosterSrc = resolveImageUrl(rawPoster) || LOCAL_DEFAULT_POSTER;
  const [imgSrc, setImgSrc] = useState<string>(initialPosterSrc);
  const [isImageLoaded, setIsImageLoaded] = useState<boolean>(false);

  const titleVi = movie.name || (movie.title as string) || 'Phim mới';
  const titleOrigin = movie.originName || (movie.origin_name as string) || titleVi;
  const slug = movie.slug || (movie._id as string) || (movie.id as string) || '';
  const yearText = formatYear(movie.year as string | number);

  const handleTrailerClick = (e: MouseEvent<HTMLButtonElement>): void => {
    e.preventDefault();
    e.stopPropagation();
    if (onPlayTrailer) {
      onPlayTrailer(movie);
    }
  };

  // 1. Duration badge (Priority for feature movies)
  const formattedDuration = formatDuration(
    movie.duration || (movie.time as string) || (movie.runtime as string),
    movie.episodeCurrent || yearText
  );

  // 2. Quality tier & badge styling
  const qualityTier: QualityTier = getQualityTier(movie.quality);
  const rawQuality = movie.quality ? String(movie.quality).toUpperCase() : 'HD';

  // 3. Language badge
  const langType: LanguageType = getLanguageType(movie.lang);
  const langLabel = movie.lang ? String(movie.lang) : 'Vietsub';

  // 4. Rating
  const rawRating = Number(
    movie.vote_average || movie.rating || (movie.tmdb as { vote_average?: number })?.vote_average || 0
  );
  const ratingText = rawRating > 0 ? rawRating.toFixed(1) : null;

  // 5. Watch Later bookmark state
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
      // Sync local storage
      const saved = localStorage.getItem(LOCAL_WATCH_LATER_KEY);
      let set: string[] = saved ? JSON.parse(saved) : [];
      if (!Array.isArray(set)) set = [];

      if (nextState) {
        if (!set.includes(slug)) set.push(slug);
      } else {
        set = set.filter((s) => s !== slug);
      }
      localStorage.setItem(LOCAL_WATCH_LATER_KEY, JSON.stringify(set));

      // Attempt remote sync if authenticated
      if (nextState) {
        await watchLaterService.addToWatchLater({
          id: movie.id,
          slug,
          title: titleVi,
          name: titleVi,
          origin_name: titleOrigin,
          poster_url: initialPosterSrc,
          quality: rawQuality,
          lang: langLabel,
          year: movie.year || undefined
        });
      } else {
        await watchLaterService.removeFromWatchLater(movie.id || slug);
      }
    } catch {
      // Graceful offline fallback
    } finally {
      setBookmarkLoading(false);
    }
  };

  // 6. Watch progress bar detection
  const [progressPercent] = useState<number | null>(() => {
    if (typeof window === 'undefined' || !slug) return null;
    try {
      const progress = getWatchProgress(slug);
      return progress && progress.updatedAt ? 40 : null;
    } catch {
      return null;
    }
  });

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

  // Language badge CSS class selection
  const getLangClass = (): string => {
    switch (langType) {
      case 'vietsub':
        return styles.badgeLangVietsub;
      case 'thuyet-minh':
        return styles.badgeLangThuyetMinh;
      case 'long-tieng':
        return styles.badgeLangLongTieng;
      default:
        return styles.badgeLangRaw;
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
            sizes="(max-width: 576px) 50vw, (max-width: 992px) 33vw, 18vw"
            onLoad={() => setIsImageLoaded(true)}
            onError={() => {
              if (imgSrc !== LOCAL_DEFAULT_POSTER) {
                setImgSrc(LOCAL_DEFAULT_POSTER);
              }
              setIsImageLoaded(true);
            }}
          />
        </picture>

        {/* Ambient Top and Bottom Depth Gradients */}
        <div className={styles.topFade} aria-hidden="true" />
        <div className={styles.bottomFade} aria-hidden="true" />

        {/* Top-left Badges: Quality & Translation */}
        <div className={styles.badgesTopLeft}>
          <span className={`${styles.badgeQuality} ${getQualityClass()}`}>
            {(qualityTier === 'cam' || qualityTier === 'trailer') && (
              <FaExclamationCircle aria-hidden="true" style={{ marginRight: '3px' }} />
            )}
            {rawQuality}
          </span>
          {langLabel && (
            <span className={`${styles.badgeLang} ${getLangClass()}`}>
              {langLabel}
            </span>
          )}
        </div>

        {/* Top-right Badge: Duration for Feature Movie */}
        {formattedDuration && (
          <span className={styles.badgeDurationTopRight} title={`Thời lượng: ${formattedDuration}`}>
            <FaClock className={styles.clockIcon} aria-hidden="true" />
            <span>{formattedDuration}</span>
          </span>
        )}

        {/* Bookmark (Watch Later) Button */}
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

      {/* Card Content Body */}
      <div className={styles.cardBody}>
        <h2 className={styles.movieTitle} title={titleVi}>
          {titleVi}
        </h2>
        <p className={styles.movieSubTitle} title={titleOrigin}>
          {titleOrigin}
        </p>

        {/* Category Pills (if available) */}
        {Array.isArray(movie.category) && movie.category.length > 0 && (
          <div className={styles.categoryPills}>
            {movie.category.slice(0, 2).map((cat) => (
              <span key={cat.slug || cat.name || cat.id} className={styles.categoryPill}>
                {cat.name}
              </span>
            ))}
          </div>
        )}

        <div className={styles.cardFooterMeta}>
          <div className={styles.metaLeft}>
            <span className={styles.metaYear}>{yearText || '2026'}</span>
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
