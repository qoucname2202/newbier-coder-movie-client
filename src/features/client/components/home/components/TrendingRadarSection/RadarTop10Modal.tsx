import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import radarService from '@/API/services/radarService';
import { hasValidTrailer } from '@/utils/trailer';
import { getTaxonomyName, getTaxonomyList, formatYear } from '@/utils/taxonomy';
import styles from './RadarTop10Modal.module.css';
import type { RadarMovie, DeltaType } from './TrendingRadarSection';

/**
 * A compact Top 10 leaderboard modal that fits on a single screen.
 * - Uses a 2-column layout (5 + 5) so no scrolling is needed.
 * - Asks the user for confirmation before opening a movie.
 */

export interface RadarTop10ModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialCategory?: string;
  initialPeriod?: string;
  onPlayTrailer?: (movie: RadarMovie) => void;
}

const RadarTop10Modal: React.FC<RadarTop10ModalProps> = ({
  isOpen,
  onClose,
  initialCategory = 'views',
  initialPeriod = 'week',
  onPlayTrailer
}) => {
  const router = useRouter();
  const [category, setCategory] = useState<string>(initialCategory);
  const [period, setPeriod] = useState<'week' | 'month'>(initialPeriod as 'week' | 'month');
  const [movieList, setMovieList] = useState<RadarMovie[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [confirmMovie, setConfirmMovie] = useState<RadarMovie | null>(null);

  // Sync initial props when modal opens
  useEffect(() => {
    if (isOpen) {
      setCategory(initialCategory);
      setPeriod((initialPeriod as 'week' | 'month'));
      setConfirmMovie(null);
    }
  }, [isOpen, initialCategory, initialPeriod]);

  // Handle ESC key and scroll lock
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') {
        if (confirmMovie) {
          setConfirmMovie(null);
        } else {
          onClose();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen, onClose, confirmMovie]);

  // Fetch or load top 10 data
  useEffect(() => {
    if (!isOpen) return;

    let isSubscribed = true;
    const loadTop10 = async (): Promise<void> => {
      setLoading(true);
      try {
        const radar = (await radarService.getTrendingRadar({ period })) as unknown as Record<string, unknown> | null;
        if (isSubscribed) {
          const list = (radar?.[category] as RadarMovie[] | undefined) || [];
          setMovieList(list.slice(0, 10));
        }
      } catch {
        if (isSubscribed) {
          setMovieList([]);
        }
      } finally {
        if (isSubscribed) setLoading(false);
      }
    };

    loadTop10();
    return () => {
      isSubscribed = false;
    };
  }, [isOpen, category, period]);

  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>): void => {
    if (e.target === e.currentTarget) {
      if (confirmMovie) {
        setConfirmMovie(null);
      } else {
        onClose();
      }
    }
  };

  const handleNavigateToGrid = (): void => {
    onClose();
    router.push(`/rankings?category=${category}&period=${period}`);
  };

  const handleWatchMovie = (movie: RadarMovie): void => {
    onClose();
    router.push(`/movie/${movie.slug}`);
  };

  const renderDelta = (deltaType: DeltaType, deltaVal: number | string | undefined): React.ReactNode => {
    if (deltaType === 'up') {
      return <span className={`${styles.deltaBadge} ${styles.deltaUp}`}>▲ {deltaVal}</span>;
    }
    if (deltaType === 'down') {
      return <span className={`${styles.deltaBadge} ${styles.deltaDown}`}>▼ {deltaVal}</span>;
    }
    if (deltaType === 'new') {
      return <span className={`${styles.deltaBadge} ${styles.deltaNew}`}>NEW</span>;
    }
    return <span className={`${styles.deltaBadge} ${styles.deltaSame}`}>—</span>;
  };

  // Split into two columns of 5 items for single-screen view
  const colLeft: RadarMovie[] = movieList.slice(0, 5);
  const colRight: RadarMovie[] = movieList.slice(5, 10);

  const renderMovieRow = (movie: RadarMovie, idx: number, offset = 0): React.ReactNode => {
    const rankNum: number = movie.rank || offset + idx + 1;
    const formattedRank = String(rankNum).padStart(2, '0');
    const rankClass =
      rankNum === 1
        ? styles.rankGold
        : rankNum === 2
        ? styles.rankSilver
        : rankNum === 3
        ? styles.rankBronze
        : styles.rankNormal;

    return (
      <div
        key={movie._id || `rank-${rankNum}`}
        className={styles.compactRow}
        onClick={() => setConfirmMovie(movie)}
        title={`Bấm để chọn xem phim ${movie.title}`}
        role="button"
        tabIndex={0}
      >
        {/* Rank Number */}
        <span className={`${styles.rankNumber} ${rankClass}`}>
          #{formattedRank}
        </span>

        {/* Thumbnail */}
        <div className={styles.thumbWrapper}>
          <img
            src={movie.poster_url}
            alt={movie.title}
            className={styles.thumbImg}
            loading="lazy"
          />
        </div>

        {/* Title & Info */}
        <div className={styles.movieInfo}>
          <div className={styles.movieTitle} title={movie.title}>
            {movie.title}
          </div>
          <div className={styles.movieMeta}>
            <span>{formatYear(movie.year, 2024)}</span>
            {(() => {
              const genreText = getTaxonomyName(movie.genres?.[0] || (Array.isArray(movie.category) ? movie.category[0] : null));
              if (!genreText) return null;
              return (
                <>
                  <span className={styles.metaDot}>•</span>
                  <span>{genreText}</span>
                </>
              );
            })()}
            <span className={styles.metaDot}>•</span>
            <span className={styles.metricVal}>{movie.metric_value}</span>
          </div>
        </div>

        {/* Delta Indicator */}
        <div className={styles.deltaBox}>
          {renderDelta(movie.delta_type, movie.delta_val)}
        </div>
      </div>
    );
  };

  return (
    <div className={styles.modalOverlay} onClick={handleBackdropClick} role="dialog" aria-modal="true">
      <div className={styles.modalContainer}>
        {/* Compact Header */}
        <div className={styles.modalHeader}>
          <div className={styles.headerLeft}>
            <span className={styles.headerBadge}>BẢNG XẾP HẠNG</span>
          </div>

          {/* Filter Bar Integrated in Header */}
          <div className={styles.headerControls}>
            <div className={styles.categoryTabs}>
              <button
                type="button"
                className={`${styles.tabBtn} ${category === 'views' ? styles.tabBtnActive : ''}`}
                onClick={() => setCategory('views')}
              >
                Lượt Xem
              </button>
              <button
                type="button"
                className={`${styles.tabBtn} ${category === 'favorite' ? styles.tabBtnActive : ''}`}
                onClick={() => setCategory('favorite')}
              >
                Yêu Thích
              </button>
              <button
                type="button"
                className={`${styles.tabBtn} ${category === 'discussed' ? styles.tabBtnActive : ''}`}
                onClick={() => setCategory('discussed')}
              >
                Sôi Nổi
              </button>
            </div>

            <div className={styles.periodSwitch}>
              <button
                type="button"
                className={`${styles.periodBtn} ${period === 'week' ? styles.periodBtnActive : ''}`}
                onClick={() => setPeriod('week')}
              >
                Tuần
              </button>
              <button
                type="button"
                className={`${styles.periodBtn} ${period === 'month' ? styles.periodBtnActive : ''}`}
                onClick={() => setPeriod('month')}
              >
                Tháng
              </button>
            </div>
          </div>

          <button
            type="button"
            className={styles.closeBtn}
            onClick={onClose}
            aria-label="Đóng"
          >
            ✕
          </button>
        </div>

        {/* Modal Body: 2 Columns of 5 items fitting in 1 screen */}
        <div className={styles.modalBody}>
          {loading ? (
            <div className={styles.loadingState}>
              <div className={styles.spinner} />
              <span>Đang tải bảng xếp hạng...</span>
            </div>
          ) : (
            <div className={styles.twoColumnGrid}>
              <div className={styles.columnBlock}>
                {colLeft.map((movie, idx) => renderMovieRow(movie, idx, 0))}
              </div>
              <div className={styles.columnBlock}>
                {colRight.map((movie, idx) => renderMovieRow(movie, idx, 5))}
              </div>
            </div>
          )}
        </div>

        {/* Compact Footer */}
        <div className={styles.modalFooter}>
          <span className={styles.footerHint}>
            Bấm vào phim bất kỳ để xem chi tiết hoặc xem phim
          </span>
          <button
            type="button"
            className={styles.expandGridBtn}
            onClick={handleNavigateToGrid}
          >
            Xem thêm →
          </button>
        </div>

        {/* Confirmation Modal Overlay */}
        {confirmMovie && (
          <div className={styles.confirmOverlay} onClick={() => setConfirmMovie(null)}>
            <div className={styles.confirmCard} onClick={(e) => e.stopPropagation()}>
              <div className={styles.confirmHeader}>
                <span className={styles.confirmQuestionBadge}>XÁC NHẬN</span>
                <h4 className={styles.confirmTitle}>Bạn có muốn xem phim này không?</h4>
              </div>

              <div className={styles.confirmMoviePreview}>
                <img
                  src={confirmMovie.poster_url}
                  alt={confirmMovie.title}
                  className={styles.confirmPoster}
                />
                <div className={styles.confirmInfo}>
                  <div className={styles.confirmMovieName}>{confirmMovie.title}</div>
                  <div className={styles.confirmMeta}>
                    <span>{formatYear(confirmMovie.year, 2024)}</span>
                    {(() => {
                      const genresText = getTaxonomyList(confirmMovie.genres || (confirmMovie as Record<string, unknown>).category);
                      if (!genresText) return null;
                      return (
                        <>
                          <span className={styles.metaDot}>•</span>
                          <span>{genresText}</span>
                        </>
                      );
                    })()}
                  </div>
                  <div className={styles.confirmMetric}>
                    Chỉ số: {confirmMovie.metric_value} {confirmMovie.metric_label || ''}
                  </div>
                </div>
              </div>

              <div className={styles.confirmActions}>
                <button
                  type="button"
                  className={styles.cancelBtn}
                  onClick={() => setConfirmMovie(null)}
                >
                  Hủy
                </button>
                {onPlayTrailer && (
                  <button
                    type="button"
                    className={styles.trailerBtn}
                    onClick={() => {
                      const m = confirmMovie;
                      setConfirmMovie(null);
                      onClose();
                      // Re-check trailer validity at the entry
                      // point so a mis-wired upstream list can
                      // never open the modal for an unplayable
                      // movie. The radar service already filters,
                      // but a future refactor might bypass it.
                      if (onPlayTrailer && hasValidTrailer(m as never)) {
                        onPlayTrailer(m);
                      }
                    }}
                  >
                    Xem Trailer
                  </button>
                )}
                <button
                  type="button"
                  className={styles.watchBtn}
                  onClick={() => handleWatchMovie(confirmMovie)}
                >
                  Xem Phim Ngay
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RadarTop10Modal;
