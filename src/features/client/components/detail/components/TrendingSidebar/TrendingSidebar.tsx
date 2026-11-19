import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import movieService from '@/API/services/movieService';
import { LOCAL_DEFAULT_POSTER, LOCAL_DEFAULT_BACKDROP } from '@/config/movieFallbackConfig';
import { pickImageSrc, POSTER_FIELDS, BACKDROP_FIELDS } from '@/utils/imageSource';
import { formatYear } from '@/utils/taxonomy';
import styles from './TrendingSidebar.module.css';

/**
 * @file TrendingSidebar.tsx
 * @description Revolutionary "Cinema Heat Index" leaderboard UI.
 * Features Top 1 Champion Card with dual-layer ambient blur + top-aligned artwork,
 * holographic rank strips for Top 2-10 with episode progress (tập/tổng số tập),
 * thermal heat-meter bars, and timeframe tabs.
 * Clean, icon-free typography designed for maximum visual clarity.
 */

export interface RecommendedMovie {
  _id?: string;
  slug?: string;
  name?: string;
  origin_name?: string;
  year?: number | string;
  quality?: string;
  episode_current?: string;
  episode_total?: number | string;
  total_episodes?: number | string;
  type?: string;
  time?: string;
  poster_url?: string;
  thumb_url?: string;
  backdrop_url?: string;
  rating?: number | string;
  view?: number;
  episodes?: unknown[];
  [key: string]: unknown;
}

export interface TrendingSidebarProps {
  currentSlug?: string;
  title?: string;
  customMovies?: RecommendedMovie[];
}

// Simulated thermal heat ratings for top 10 movies
const HEAT_INDEX_SCORES = [99.4, 96.8, 93.5, 89.2, 86.4, 82.1, 79.5, 75.8, 72.3, 68.7];

/**
 * Formats episode count as "Tập X/Y" or "Trọn bộ Y/Y" or "Bản Full HD".
 * Resolves the issue where users need to know how many episodes are out of total.
 *
 * @param movie - The movie item to evaluate
 * @returns Clean, user-friendly episode count representation
 */
export const formatEpisodeProgress = (movie: RecommendedMovie | null | undefined): string => {
  if (!movie) return '';

  const epCurrent = typeof movie.episode_current === 'string' ? movie.episode_current.trim() : '';
  const epTotal = movie.total_episodes || movie.episode_total;
  const isSeries =
    movie.type === 'series' ||
    (Array.isArray(movie.episodes) && movie.episodes.length > 0) ||
    (epCurrent && !epCurrent.toLowerCase().includes('full'));

  // If already formatted like "Tập 12/16" or "12/16"
  if (epCurrent.includes('/')) {
    return epCurrent.toLowerCase().startsWith('tập') ? epCurrent : `Tập ${epCurrent}`;
  }

  // Extract pure numbers from episode current (e.g. "Tập 12" -> "12")
  const currentNum = epCurrent ? epCurrent.replace(/\D/g, '') : '';

  if (currentNum && epTotal) {
    return `Tập ${currentNum}/${epTotal}`;
  }

  if (currentNum) {
    return `Tập ${currentNum}`;
  }

  if (epCurrent) {
    return epCurrent.toLowerCase().startsWith('tập') ? epCurrent : `Tập ${epCurrent}`;
  }

  if (isSeries && epTotal) {
    return `Trọn bộ ${epTotal}/${epTotal}`;
  }

  if (isSeries) {
    return 'Phim Bộ';
  }

  return 'Bản Full HD';
};

export const TrendingSidebar: React.FC<TrendingSidebarProps> = ({
  currentSlug = '',
  title = 'BẢNG ĐO NHIỆT LƯỢNG',
  customMovies
}) => {
  const [movies, setMovies] = useState<RecommendedMovie[]>([]);
  const [loading, setLoading] = useState<boolean>(!customMovies);
  const [timeframe, setTimeframe] = useState<'day' | 'week' | 'month'>('day');

  useEffect(() => {
    if (customMovies && customMovies.length > 0) {
      setMovies(customMovies);
      setLoading(false);
      return;
    }

    let isMounted = true;
    const controller = new AbortController();

    const fetchRecommended = async (): Promise<void> => {
      setLoading(true);
      try {
        const list = (await movieService.getTop10Movies(controller.signal)) as RecommendedMovie[];
        if (isMounted) {
          setMovies(Array.isArray(list) ? list : []);
        }
      } catch {
        if (isMounted) {
          setMovies([]);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchRecommended();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [customMovies]);

  const displayedMovies = useMemo((): RecommendedMovie[] => {
    if (!movies || movies.length === 0) return [];
    const filtered = currentSlug
      ? movies.filter((m) => m.slug !== currentSlug)
      : movies;
    return filtered.slice(0, 10);
  }, [movies, currentSlug]);

  const championMovie = displayedMovies[0];
  const runnerUpMovies = displayedMovies.slice(1);

  return (
    <aside className={styles.leaderboardContainer} aria-label="Bảng đo nhiệt lượng phim">
      {/* 1. Header with Live Pulse and Timeframe Tabs */}
      <div className={styles.headerBlock}>
        <div className={styles.headerTopRow}>
          <div className={styles.titleWrap}>
            <span className={styles.liveIndicator} />
            <h3 className={styles.leaderboardTitle}>{title}</h3>
          </div>
          <span className={styles.liveBadgeText}>HOT 24H</span>
        </div>

        {/* Minimalist Timeframe Switcher */}
        <div className={styles.timeframeTabs}>
          <button
            type="button"
            className={`${styles.timeBtn} ${timeframe === 'day' ? styles.timeBtnActive : ''}`}
            onClick={() => setTimeframe('day')}
          >
            Hôm nay
          </button>
          <button
            type="button"
            className={`${styles.timeBtn} ${timeframe === 'week' ? styles.timeBtnActive : ''}`}
            onClick={() => setTimeframe('week')}
          >
            Theo Tuần
          </button>
          <button
            type="button"
            className={`${styles.timeBtn} ${timeframe === 'month' ? styles.timeBtnActive : ''}`}
            onClick={() => setTimeframe('month')}
          >
            Theo Tháng
          </button>
        </div>
      </div>

      {loading ? (
        <div className={styles.skeletonContainer}>
          <div className={styles.skeletonChampion} />
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className={styles.skeletonStrip} />
          ))}
        </div>
      ) : displayedMovies.length > 0 ? (
        <div className={styles.contentWrap}>
          {/* 2. Top #1 Spotlight Champion Card with Top-Aligned Thumbnail */}
          {championMovie && (
            <Link
              href={`/movie/${championMovie.slug}`}
              className={styles.championCard}
              title={`Quán quân: ${championMovie.name}`}
            >
              <div className={styles.championCoverWrap}>
                {/* Ambient Blurred Background to prevent distortion */}
                <img
                  src={pickImageSrc(
                    championMovie as unknown as Record<string, unknown>,
                    BACKDROP_FIELDS,
                    LOCAL_DEFAULT_BACKDROP
                  )}
                  alt=""
                  className={styles.championBlurBg}
                  aria-hidden="true"
                />

                {/* Sharp Foreground Image with Top Center Alignment (Never crops off faces/titles) */}
                <img
                  src={pickImageSrc(
                    championMovie as unknown as Record<string, unknown>,
                    BACKDROP_FIELDS,
                    LOCAL_DEFAULT_BACKDROP
                  )}
                  alt={championMovie.name}
                  className={styles.championImg}
                  loading="lazy"
                  onError={(e) => {
                    const img = e.currentTarget as HTMLImageElement;
                    img.src = LOCAL_DEFAULT_POSTER;
                  }}
                />
                <div className={styles.championOverlay} />

                {/* Massive 01 Typography Watermark */}
                <span className={styles.watermarkRank}>01</span>

                {/* Champion Badge */}
                <div className={styles.championBadgeRow}>
                  <span className={styles.championPill}>TOP 1 THỊNH HÀNH</span>
                  <span className={styles.heatBadge}>{HEAT_INDEX_SCORES[0]}° HOT</span>
                </div>

                {/* Champion Info with Episode Progress */}
                <div className={styles.championDetails}>
                  <h4 className={styles.championTitle}>{championMovie.name}</h4>
                  <div className={styles.championMeta}>
                    <span className={styles.championEpHighlight}>
                      {formatEpisodeProgress(championMovie)}
                    </span>
                    <span>•</span>
                    <span>{formatYear(championMovie.year)}</span>
                    <span>•</span>
                    <span>{championMovie.quality || '4K Ultra HD'}</span>
                  </div>
                </div>
              </div>
            </Link>
          )}

          {/* 3. Top #2 - #10 Holographic Ranked Strips with Episode Progress */}
          <div className={styles.rankedStripsList}>
            {runnerUpMovies.map((movie, idx) => {
              const rank = idx + 2;
              const rankFormatted = rank < 10 ? `0${rank}` : `${rank}`;
              const heatScore = HEAT_INDEX_SCORES[idx + 1] || (60 - idx * 2);
              const posterSrc = pickImageSrc(
                movie as unknown as Record<string, unknown>,
                POSTER_FIELDS,
                LOCAL_DEFAULT_POSTER
              );
              const episodeProgress = formatEpisodeProgress(movie);

              return (
                <Link
                  key={movie._id || movie.slug || String(idx)}
                  href={`/movie/${movie.slug}`}
                  className={styles.stripCard}
                  title={`Hạng ${rank}: ${movie.name}`}
                >
                  {/* Clean Numeric Rank */}
                  <span
                    className={`${styles.rankNumber} ${
                      rank === 2 ? styles.rankSilver : rank === 3 ? styles.rankBronze : styles.rankNormal
                    }`}
                  >
                    {rankFormatted}
                  </span>

                  {/* Thumbnail Poster with Top Center Alignment */}
                  <div className={styles.stripPosterWrap}>
                    <img
                      src={posterSrc}
                      alt={movie.name}
                      className={styles.stripPosterImg}
                      loading="lazy"
                      onError={(e) => {
                        const img = e.currentTarget as HTMLImageElement;
                        img.src = LOCAL_DEFAULT_POSTER;
                      }}
                    />
                  </div>

                  {/* Movie Info with Episode Progress & Heat Meter */}
                  <div className={styles.stripInfo}>
                    <div className={styles.stripTitleRow}>
                      <h5 className={styles.stripTitle}>{movie.name}</h5>
                    </div>

                    <div className={styles.stripBottomRow}>
                      <div className={styles.stripMetaLeft}>
                        {episodeProgress && (
                          <span className={styles.stripEpisodeBadge}>{episodeProgress}</span>
                        )}
                        <span className={styles.stripYear}>{formatYear(movie.year)}</span>
                      </div>
                      <span className={styles.stripHeatScore}>{heatScore}°</span>
                    </div>

                    {/* Dynamic Thermal Meter Bar */}
                    <div className={styles.heatMeterTrack}>
                      <div
                        className={styles.heatMeterFill}
                        style={{ width: `${heatScore}%` }}
                      />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      ) : (
        <div className={styles.emptyFallback}>
          <span>Dữ liệu nhiệt lượng đang được đồng bộ hóa.</span>
        </div>
      )}
    </aside>
  );
};

export default TrendingSidebar;
