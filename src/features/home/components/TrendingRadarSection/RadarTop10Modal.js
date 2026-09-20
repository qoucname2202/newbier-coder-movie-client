import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { mockTrendingRadar } from '@/mock/mockTrendingRadar';
import radarService from '@/API/services/radarService';
import styles from './RadarTop10Modal.module.css';

/**
 * @file RadarTop10Modal.js
 * @description Compact, Single-Screen Top 10 Leaderboard Modal.
 * Features:
 * - 2-column layout (5 + 5) perfectly fitting in a single screen without scrolling.
 * - Minimalist, uncluttered rows without redundant buttons.
 * - Confirmation prompt on movie click asking "Bạn có muốn xem phim này không?".
 */
export default function RadarTop10Modal({
  isOpen,
  onClose,
  initialCategory = 'views',
  initialPeriod = 'week',
  onPlayTrailer
}) {
  const router = useRouter();
  const [category, setCategory] = useState(initialCategory);
  const [period, setPeriod] = useState(initialPeriod);
  const [movieList, setMovieList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [confirmMovie, setConfirmMovie] = useState(null); // Movie selected for "Muốn xem phim không?"

  // Sync initial props when modal opens
  useEffect(() => {
    if (isOpen) {
      setCategory(initialCategory);
      setPeriod(initialPeriod);
      setConfirmMovie(null);
    }
  }, [isOpen, initialCategory, initialPeriod]);

  // Handle ESC key and scroll lock
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
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
    const loadTop10 = async () => {
      setLoading(true);
      try {
        const radar = await radarService.getTrendingRadar({ period });
        if (isSubscribed) {
          const list = (radar && radar[category]) || [];
          if (list.length > 0) {
            setMovieList(list.slice(0, 10));
          } else {
            const fallback = mockTrendingRadar[period]?.[category] || [];
            setMovieList(fallback.slice(0, 10));
          }
        }
      } catch (err) {
        if (isSubscribed) {
          const fallback = mockTrendingRadar[period]?.[category] || [];
          setMovieList(fallback.slice(0, 10));
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

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      if (confirmMovie) {
        setConfirmMovie(null);
      } else {
        onClose();
      }
    }
  };

  const handleNavigateToGrid = () => {
    onClose();
    router.push(`/rankings?category=${category}&period=${period}`);
  };

  const handleWatchMovie = (movie) => {
    onClose();
    router.push(`/movie/${movie.slug}`);
  };

  const renderDelta = (deltaType, deltaVal) => {
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
  const colLeft = movieList.slice(0, 5);
  const colRight = movieList.slice(5, 10);

  const renderMovieRow = (movie, idx, offset = 0) => {
    const rankNum = movie.rank || offset + idx + 1;
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
            <span>{movie.year || 2024}</span>
            {movie.genres && movie.genres.length > 0 && (
              <>
                <span className={styles.metaDot}>•</span>
                <span>{movie.genres[0]}</span>
              </>
            )}
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

        {/* Confirmation Modal Overlay: "Bạn có muốn xem phim không?" */}
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
                    <span>{confirmMovie.year || 2024}</span>
                    {confirmMovie.genres && confirmMovie.genres.length > 0 && (
                      <>
                        <span className={styles.metaDot}>•</span>
                        <span>{confirmMovie.genres.join(', ')}</span>
                      </>
                    )}
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
                      onPlayTrailer(m);
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
}
