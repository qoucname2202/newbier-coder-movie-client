import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import movieService from '@/API/services/movieService';
import { LOCAL_DEFAULT_POSTER } from '@/config/movieFallbackConfig';
import { WATCH_CONFIG } from '@/config/watchConfig';
import styles from './TrendingSidebar.module.css';

/**
 * @file TrendingSidebar.js
 * @description Minimalist Cinema Recommended Movies Widget ("Phim Đề Xuất").
 * Features clean movie list without noisy tabs or rank numbers.
 *
 * @param {Object} props
 * @param {string} [props.currentSlug=''] - Current playing movie slug.
 */
export default function TrendingSidebar({ currentSlug = '' }) {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);

  const { limit, title: sectionTitle, emptyText } = WATCH_CONFIG.recommendations;

  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    const fetchRecommended = async () => {
      setLoading(true);
      try {
        const list = await movieService.getTop10Movies(controller.signal);
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
  }, []);

  const displayedMovies = useMemo(() => {
    if (!movies || movies.length === 0) return [];
    // Filter out current movie if present
    const filtered = currentSlug
      ? movies.filter((m) => m.slug !== currentSlug)
      : movies;
    return filtered.slice(0, limit);
  }, [movies, currentSlug, limit]);

  return (
    <aside className={styles.sidebarCard} aria-label="Phim đề xuất">
      {/* 1. Minimalist Header */}
      <div className={styles.headerBlock}>
        <h3 className={styles.sidebarTitle}>
          <i className={`fas fa-film ${styles.titleIcon}`} />
          <span>{sectionTitle}</span>
        </h3>
      </div>

      {/* 2. Movie List / Skeletons */}
      {loading ? (
        <div className={styles.skeletonList}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className={styles.skeletonItem}>
              <div className={styles.skeletonPoster} />
              <div className={styles.skeletonInfo}>
                <div className={styles.skeletonLine} style={{ width: '80%' }} />
                <div className={styles.skeletonLine} style={{ width: '45%' }} />
              </div>
            </div>
          ))}
        </div>
      ) : displayedMovies.length > 0 ? (
        <div className={styles.movieList}>
          {displayedMovies.map((movie, idx) => {
            const posterSrc =
              movie.poster_url || movie.thumb_url || LOCAL_DEFAULT_POSTER;

            const hasDistinctOrigin =
              movie.origin_name &&
              movie.origin_name.trim().toLowerCase() !== movie.name.trim().toLowerCase();

            return (
              <Link
                key={movie._id || movie.slug || idx}
                href={`/movie/${movie.slug}`}
                className={styles.movieItem}
                title={movie.name}
              >
                {/* Poster Thumbnail */}
                <div className={styles.posterWrap}>
                  <img
                    src={posterSrc}
                    alt={movie.name}
                    className={styles.posterImg}
                    loading="lazy"
                    onError={(e) => {
                      e.target.src = LOCAL_DEFAULT_POSTER;
                    }}
                  />
                  {movie.quality && (
                    <span className={styles.qualityBadge}>{movie.quality}</span>
                  )}
                </div>

                {/* Movie Meta Information */}
                <div className={styles.infoCol}>
                  <h4 className={styles.movieName}>{movie.name}</h4>
                  {hasDistinctOrigin && (
                    <p className={styles.originName}>{movie.origin_name}</p>
                  )}
                  <div className={styles.metaRow}>
                    {movie.year && (
                      <span className={styles.metaItem}>
                        <i className="far fa-calendar-alt me-1" />
                        {movie.year}
                      </span>
                    )}
                    {movie.episode_current && (
                      <span className={styles.metaItem}>
                        {movie.episode_current}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className={styles.emptyFallback}>
          <p className="m-0">{emptyText}</p>
        </div>
      )}
    </aside>
  );
}
