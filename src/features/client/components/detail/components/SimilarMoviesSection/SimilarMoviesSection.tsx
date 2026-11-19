import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import Link from 'next/link';
import movieService from '@/API/services/movieService';
import { pickImageSrc, POSTER_FIELDS } from '@/utils/imageSource';
import { LOCAL_DEFAULT_POSTER } from '@/config/movieFallbackConfig';
import { formatYear } from '@/utils/taxonomy';
import { formatEpisodeProgress, RecommendedMovie } from '@/features/client/components/detail/components/TrendingSidebar/TrendingSidebar';
import styles from './SimilarMoviesSection.module.css';

/**
 * @file SimilarMoviesSection.tsx
 * @description Enterprise-grade Cinema Carousel for Similar & Recommended Movies.
 * Displays exactly 4 items per row on desktop (3 on tablet, 2 on mobile),
 * with buttery-smooth GPU-accelerated transition, auto-play with pause-on-hover,
 * fixed 2:3 poster aspect ratios (preventing height distortion),
 * animated crimson halo borders, filter tabs pinned on the left,
 * navigation arrows pinned flush on the right, and full-area trailer trigger on the play button.
 */

export interface SimilarMovieItem {
  _id?: string;
  id?: string;
  slug?: string;
  name?: string;
  origin_name?: string;
  year?: number | string;
  quality?: string;
  rating?: number | string;
  time?: string;
  type?: string;
  episode_current?: string;
  episode_total?: number | string;
  total_episodes?: number | string;
  poster_url?: string;
  thumb_url?: string;
  backdrop_url?: string;
  trailer_url?: string;
  trailer?: unknown;
  category?: Array<{ name?: string; slug?: string } | string>;
  country?: Array<{ name?: string; slug?: string } | string>;
  [key: string]: unknown;
}

export interface SimilarMoviesSectionProps {
  movies?: SimilarMovieItem[];
  currentMovieName?: string;
  currentMovieCategory?: string;
  currentMovieSlug?: string;
  onPlayTrailer?: (movie: SimilarMovieItem) => void;
}

export const SimilarMoviesSection: React.FC<SimilarMoviesSectionProps> = ({
  movies = [],
  currentMovieName = 'bộ phim này',
  currentMovieCategory = '',
  currentMovieSlug = '',
  onPlayTrailer
}) => {
  const [internalMovies, setInternalMovies] = useState<SimilarMovieItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'all' | 'series' | 'single' | 'topRated'>('all');
  const [currentPage, setCurrentPage] = useState<number>(0);
  const [itemsPerPage, setItemsPerPage] = useState<number>(4);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const touchStartX = useRef<number>(0);

  // Responsive items-per-page detection: 4 on desktop, 3 on tablet, 2 on mobile
  useEffect(() => {
    const handleResize = () => {
      if (typeof window === 'undefined') return;
      const w = window.innerWidth;
      if (w <= 576) {
        setItemsPerPage(2);
      } else if (w <= 991) {
        setItemsPerPage(3);
      } else {
        setItemsPerPage(4);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Fetch similar movies fallback if movies prop is empty
  useEffect(() => {
    if (Array.isArray(movies) && movies.length > 0) {
      setInternalMovies(movies);
      return;
    }

    let isMounted = true;
    const fetchFallback = async (): Promise<void> => {
      setLoading(true);
      try {
        let fetched: unknown[] = [];
        if (currentMovieCategory) {
          fetched = await movieService.getMoviesByCategory(currentMovieCategory, 16);
        }
        if (!fetched || fetched.length === 0) {
          fetched = await movieService.getTrendingMovies();
        }
        if (!fetched || fetched.length === 0) {
          fetched = await movieService.getTopRatedMovies();
        }

        if (isMounted && Array.isArray(fetched) && fetched.length > 0) {
          const clean = (fetched as SimilarMovieItem[]).filter(
            (m) => m && m.slug && m.slug !== currentMovieSlug
          );
          setInternalMovies(clean.slice(0, 16));
        }
      } catch {
        // Safe fallback
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchFallback();
    return () => {
      isMounted = false;
    };
  }, [movies, currentMovieCategory, currentMovieSlug]);

  // Filter movies by active tab
  const displayedMovies = useMemo((): SimilarMovieItem[] => {
    const list = internalMovies.filter((m) => m && m.slug && m.slug !== currentMovieSlug);

    if (activeTab === 'series') {
      return list.filter(
        (m) =>
          m.type === 'series' ||
          (typeof m.episode_current === 'string' && !m.episode_current.toLowerCase().includes('full'))
      );
    }
    if (activeTab === 'single') {
      return list.filter(
        (m) =>
          m.type === 'single' ||
          (typeof m.episode_current === 'string' && m.episode_current.toLowerCase().includes('full'))
      );
    }
    if (activeTab === 'topRated') {
      return [...list].sort((a, b) => Number(b.rating || 0) - Number(a.rating || 0));
    }
    return list;
  }, [internalMovies, currentMovieSlug, activeTab]);

  const totalPages = Math.max(1, Math.ceil(displayedMovies.length / itemsPerPage));

  // Reset to page 0 when filter tab or movie count changes
  useEffect(() => {
    setCurrentPage(0);
  }, [activeTab, displayedMovies.length]);

  // Navigation handlers
  const handlePrev = useCallback(() => {
    setCurrentPage((prev) => (prev - 1 + totalPages) % totalPages);
  }, [totalPages]);

  const handleNext = useCallback(() => {
    setCurrentPage((prev) => (prev + 1) % totalPages);
  }, [totalPages]);

  // Smooth Auto-Play: advances every 4.8 seconds when not hovered
  useEffect(() => {
    if (isPaused || totalPages <= 1 || loading) return;

    const timer = setInterval(() => {
      setCurrentPage((prev) => (prev + 1) % totalPages);
    }, 4800);

    return () => clearInterval(timer);
  }, [isPaused, totalPages, loading]);

  // Touch Swipe handlers for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    setIsPaused(true);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX.current - touchEndX;
    if (Math.abs(diff) > 40) {
      if (diff > 0) {
        handleNext();
      } else {
        handlePrev();
      }
    }
    setTimeout(() => setIsPaused(false), 2500);
  };

  if (!loading && displayedMovies.length === 0) {
    return null;
  }

  // Calculate track transform offset
  const gapPx = itemsPerPage === 4 ? 16 : itemsPerPage === 3 ? 14 : 10;
  const trackTranslate = `calc(-${currentPage} * (100% + ${gapPx}px))`;

  return (
    <section
      className={styles.sectionContainer}
      aria-label="Danh sách phim đề xuất tương tự"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* 1. Header with Title on Left, Filter Tabs on Left, and Navigation Arrows Flush on Right */}
      <div className={styles.headerRow}>
        <div className={styles.headerLeftCol}>
          <div className={styles.titleArea}>
            <div className={styles.badgeRow}>
              <span className={styles.glowDot} />
              <span className={styles.sectionBadge}>GỢI Ý TƯƠNG TỰ DÀNH CHO BẠN</span>
            </div>
            <h3 className={styles.sectionHeading}>Phim Đề Xuất Tương Tự</h3>
            <p className={styles.sectionSubheading}>
              Các bộ phim cùng thể loại, đề tài và phong cách với &ldquo;{currentMovieName}&rdquo;
            </p>
          </div>

          {/* Filter Tabs: Pinned to the Left side per user requirement */}
          <div className={styles.filterTabs}>
            <button
              type="button"
              className={`${styles.filterBtn} ${activeTab === 'all' ? styles.filterBtnActive : ''}`}
              onClick={() => setActiveTab('all')}
            >
              Tất cả ({internalMovies.length})
            </button>
            <button
              type="button"
              className={`${styles.filterBtn} ${activeTab === 'topRated' ? styles.filterBtnActive : ''}`}
              onClick={() => setActiveTab('topRated')}
            >
              Đánh giá cao
            </button>
            <button
              type="button"
              className={`${styles.filterBtn} ${activeTab === 'series' ? styles.filterBtnActive : ''}`}
              onClick={() => setActiveTab('series')}
            >
              Phim bộ
            </button>
            <button
              type="button"
              className={`${styles.filterBtn} ${activeTab === 'single' ? styles.filterBtnActive : ''}`}
              onClick={() => setActiveTab('single')}
            >
              Phim lẻ
            </button>
          </div>
        </div>

        {/* Carousel Arrow Navigation: Pinned on Far Right */}
        {totalPages > 1 && (
          <div className={styles.navArrows}>
            <button
              type="button"
              className={styles.navBtn}
              onClick={handlePrev}
              title="Xem trang trước"
              aria-label="Xem trang trước"
            >
              <i className="fas fa-chevron-left" />
            </button>
            <button
              type="button"
              className={styles.navBtn}
              onClick={handleNext}
              title="Xem trang tiếp theo"
              aria-label="Xem trang tiếp theo"
            >
              <i className="fas fa-chevron-right" />
            </button>
          </div>
        )}
      </div>

      {/* 2. Loading State */}
      {loading ? (
        <div className={styles.skeletonGrid}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className={styles.skeletonCard} />
          ))}
        </div>
      ) : (
        /* 3. Smooth Hardware-Accelerated Sliding Track (With clearance for unclipped hover borders) */
        <div
          className={styles.carouselViewport}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <div
            className={styles.carouselTrack}
            style={{ transform: `translateX(${trackTranslate})` }}
          >
            {displayedMovies.map((movie, index) => {
              const movieSlug = movie.slug || (movie._id as string) || (movie.id as string) || '';
              const movieName = movie.name || 'Phim Đề Xuất';
              const posterSrc = pickImageSrc(
                movie as unknown as Record<string, unknown>,
                POSTER_FIELDS,
                LOCAL_DEFAULT_POSTER
              );
              const episodeText = formatEpisodeProgress(movie as unknown as RecommendedMovie);

              // Safe rating parsing
              const safeRating = (() => {
                if (typeof movie.rating === 'number' && !isNaN(movie.rating)) {
                  return movie.rating.toFixed(1);
                }
                const parsed = parseFloat(String(movie.rating || ''));
                return !isNaN(parsed) && parsed > 0 ? parsed.toFixed(1) : '8.8';
              })();

              return (
                <div key={movieSlug || String(index)} className={styles.carouselItem}>
                  <Link
                    href={movieSlug ? `/movie/${encodeURIComponent(movieSlug)}` : '#'}
                    className={styles.cardLink}
                    title={movieName}
                  >
                    {/* Fixed 2:3 Poster Frame (With mask-image & border-radius on img to guarantee fully rounded corners) */}
                    <div className={styles.posterContainer}>
                      {/* Ambient blur layer for background consistency */}
                      <img
                        src={posterSrc}
                        alt=""
                        className={styles.posterBlurBg}
                        aria-hidden="true"
                      />

                      {/* Sharp top-centered foreground image with explicit corner radius */}
                      <img
                        src={posterSrc}
                        alt={movieName}
                        className={styles.posterImage}
                        loading="lazy"
                        onError={(e) => {
                          const img = e.currentTarget as HTMLImageElement;
                          img.src = LOCAL_DEFAULT_POSTER;
                        }}
                      />

                      {/* Cinematic Gradient Shadow */}
                      <div className={styles.posterOverlay} />

                      {/* Quality Badge (Match Percentage removed per user instruction) */}
                      {movie.quality && (
                        <div className={styles.topBadgesRow}>
                          <span className={styles.qualityBadge}>{movie.quality}</span>
                        </div>
                      )}

                      {/* Episode Status Badge */}
                      {episodeText && (
                        <div className={styles.bottomBadgeWrap}>
                          <span className={styles.epBadge}>{episodeText}</span>
                        </div>
                      )}

                      {/* Hover Play Button Overlay: Entire circle button triggers trailer popup on click */}
                      <div className={styles.hoverOverlay}>
                        <button
                          type="button"
                          className={styles.playTrailerBtn}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            if (onPlayTrailer) {
                              onPlayTrailer(movie);
                            }
                          }}
                          title={`Xem trailer phim ${movieName}`}
                          aria-label={`Xem trailer phim ${movieName}`}
                        >
                          <div className={styles.playIconCircle}>
                            <i className="fas fa-play" />
                          </div>
                          <span className={styles.hoverPlayText}>Trailer</span>
                        </button>
                      </div>
                    </div>

                    {/* Uniform Metadata Block (Guaranteed Equal Card Height) */}
                    <div className={styles.metaContainer}>
                      <h4 className={styles.movieTitle} title={movieName}>
                        {movieName}
                      </h4>

                      <div className={styles.metaRow}>
                        <span className={styles.ratingBadge}>★ {safeRating}</span>
                        <span>•</span>
                        <span className={styles.yearText}>{formatYear(movie.year)}</span>
                        {movie.time && (
                          <>
                            <span>•</span>
                            <span className={styles.durationText}>{movie.time}</span>
                          </>
                        )}
                      </div>

                      {movie.origin_name && (
                        <span className={styles.originTitle} title={movie.origin_name}>
                          {movie.origin_name}
                        </span>
                      )}
                    </div>
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 4. Elegant Page Dots Navigation */}
      {totalPages > 1 && !loading && (
        <div className={styles.pageDotsRow}>
          {Array.from({ length: totalPages }).map((_, idx) => (
            <button
              key={idx}
              type="button"
              className={`${styles.pageDot} ${currentPage === idx ? styles.pageDotActive : ''}`}
              onClick={() => setCurrentPage(idx)}
              title={`Xem trang ${idx + 1}`}
              aria-label={`Chuyển đến trang ${idx + 1}`}
            />
          ))}
        </div>
      )}
    </section>
  );
};

export default SimilarMoviesSection;
