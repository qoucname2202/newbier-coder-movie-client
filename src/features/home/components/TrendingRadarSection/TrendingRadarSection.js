import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Skeleton from '@/components/UI/Skeleton';
import SectionHeader from '@/components/common/MovieSection/SectionHeader';
import radarService from '@/API/services/radarService';
import RadarTop10Modal from './RadarTop10Modal';
import styles from './TrendingRadarSection.module.css';

export const TrendingRadarSkeleton = ({ title = "Radar Xu Hướng Thể Loại", badge = "CHỈ SỐ ĐIỆN ẢNH" }) => (
  <section className={styles.radarSection} id="cinema-trending-radar" aria-label="Đang tải radar">
    <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-3">
      <SectionHeader title={title} badge={badge} />
      <div className="d-flex gap-2">
        <Skeleton width="80px" height="32px" borderRadius="4px" />
        <Skeleton width="80px" height="32px" borderRadius="4px" />
      </div>
    </div>
    <div className="row g-3 g-lg-4">
      <div className="col-12 col-xl-8">
        <div className="card bg-dark border-0 p-3 rounded-3" style={{ minHeight: '380px' }}>
          <div className="d-flex gap-2 mb-3">
            <Skeleton width="90px" height="30px" borderRadius="4px" />
            <Skeleton width="110px" height="30px" borderRadius="4px" />
            <Skeleton width="90px" height="30px" borderRadius="4px" />
          </div>
          <div className="row g-3">
            <div className="col-12 col-md-5">
              <Skeleton height="300px" borderRadius="8px" />
            </div>
            <div className="col-12 col-md-7 d-flex flex-column gap-3 justify-content-center">
              {[1, 2, 3, 4].map((i) => (
                <div key={`radar-row-${i}`} className="d-flex align-items-center gap-3 p-2 bg-black rounded-2">
                  <Skeleton width="28px" height="28px" borderRadius="4px" />
                  <Skeleton width="48px" height="64px" borderRadius="4px" />
                  <div className="flex-grow-1">
                    <Skeleton width="70%" height="16px" />
                    <Skeleton width="40%" height="12px" className="mt-1" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className="col-12 col-xl-4">
        <div className="card bg-dark border-0 p-3 rounded-3" style={{ minHeight: '380px' }}>
          <Skeleton width="140px" height="22px" borderRadius="4px" className="mb-3" />
          <div className="d-flex flex-column gap-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={`genre-skel-${i}`}>
                <div className="d-flex justify-content-between mb-1">
                  <Skeleton width="100px" height="14px" />
                  <Skeleton width="40px" height="14px" />
                </div>
                <Skeleton width="100%" height="6px" borderRadius="3px" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  </section>
);

/**
 * @file TrendingRadarSection.js
 * @description Professional Cinema Analytics & Trending Radar dashboard.
 * Features:
 * - Timeframe Toggle: Weekly / Monthly
 * - Category Switcher: Most Discussed / Top Favorited / Views
 * - Bento Layout: Champion #1 Spotlight + Metric Rows #2-#5 + Genre Growth Pulse
 * - Clean, professional metrics without excessive icons/emojis.
 *
 * @param {Object} props
 * @param {Function} [props.onPlayTrailer] - Callback to play trailer modal
 * @param {boolean} [props.enabled=true] - Toggle visibility
 */
export default function TrendingRadarSection({
  onPlayTrailer,
  enabled = true,
  title = "Radar Xu Hướng Thể Loại",
  badge = "CHỈ SỐ ĐIỆN ẢNH",
  defaultPeriod = 'week',
  defaultCategory = 'views'
}) {
  if (!enabled) return null;

  const [period, setPeriod] = useState(defaultPeriod);
  const [activeCategory, setActiveCategory] = useState(defaultCategory);
  const [isTop10Open, setIsTop10Open] = useState(false);
  const [radarData, setRadarData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isSubscribed = true;
    const fetchRadar = async () => {
      setLoading(true);
      try {
        const data = await radarService.getTrendingRadar({ period });
        if (isSubscribed) {
          setRadarData(data);
        }
      } catch (err) {
        // Fallback silently handled in service
      } finally {
        if (isSubscribed) setLoading(false);
      }
    };

    fetchRadar();
    return () => {
      isSubscribed = false;
    };
  }, [period]);

  // Current active movie list based on selected category
  const currentCategoryKey = activeCategory === 'breakthrough' ? 'views' : activeCategory;
  const activeMovies = radarData
    ? radarData[currentCategoryKey] || radarData[activeCategory] || []
    : [];
  const championMovie = activeMovies[0] || null;
  const runnerUpMovies = activeMovies.slice(1, 5);
  const trendingGenres = radarData?.genres || [];

  // Helper for rendering delta rank indicator
  const renderDelta = (deltaType, deltaVal) => {
    let badgeClass = styles.deltaSame;
    let symbol = '—';

    if (deltaType === 'up') {
      badgeClass = styles.deltaUp;
      symbol = `▲ ${deltaVal}`;
    } else if (deltaType === 'down') {
      badgeClass = styles.deltaDown;
      symbol = `▼ ${deltaVal}`;
    } else if (deltaType === 'new') {
      badgeClass = styles.deltaNew;
      symbol = 'NEW';
    }

    return <span className={`${styles.deltaBadge} ${badgeClass}`}>{symbol}</span>;
  };

  if (loading && !championMovie && trendingGenres.length === 0) {
    return <TrendingRadarSkeleton title={title} badge={badge} />;
  }

  if (!loading && !championMovie && trendingGenres.length === 0) {
    return null;
  }

  return (
    <section className={styles.radarSection} id="cinema-trending-radar">
      {/* Standard Section Header matching website cinema rails */}
      <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-3">
        <SectionHeader
          title={title}
          badge={badge}
        />

        {/* Minimalist Timeframe Switcher */}
        <div className={styles.timeframeSwitch}>
          <button
            type="button"
            className={`${styles.timeframeBtn} ${period === 'week' ? styles.timeframeBtnActive : ''}`}
            onClick={() => setPeriod('week')}
          >
            TUẦN NÀY
          </button>
          <button
            type="button"
            className={`${styles.timeframeBtn} ${period === 'month' ? styles.timeframeBtnActive : ''}`}
            onClick={() => setPeriod('month')}
          >
            THÁNG NÀY
          </button>
        </div>
      </div>

      {/* Main Bento Grid: Left (col-xl-8) + Right (col-xl-4) */}
      <div className="row g-3 g-lg-4 align-items-stretch">
        {/* Left Column: Multidimensional Movie Radar */}
        <div className="col-12 col-xl-8">
          <div className={styles.bentoLeftPanel}>
            {/* Category Selector Tabs */}
            <div className={styles.categoryTabs}>
              <button
                type="button"
                className={`${styles.categoryTabBtn} ${activeCategory === 'views' || activeCategory === 'breakthrough' ? styles.categoryTabBtnActive : ''}`}
                onClick={() => setActiveCategory('views')}
              >
                Lượt xem
              </button>
              <button
                type="button"
                className={`${styles.categoryTabBtn} ${activeCategory === 'favorite' ? styles.categoryTabBtnActive : ''}`}
                onClick={() => setActiveCategory('favorite')}
              >
                Được Yêu Thích
              </button>
              <button
                type="button"
                className={`${styles.categoryTabBtn} ${activeCategory === 'discussed' ? styles.categoryTabBtnActive : ''}`}
                onClick={() => setActiveCategory('discussed')}
              >
                Sôi Nổi Nhất
              </button>
              <button
                type="button"
                className={styles.openTop10Btn}
                onClick={() => setIsTop10Open(true)}
                title="Mở bảng xếp hạng Top 10"
              >
                Xem Top 10 →
              </button>
            </div>

            {/* Radar Content Grid: Champion Spotlight + Runner-up Rows */}
            <div className={styles.radarContentGrid}>
              {/* Champion #1 Spotlight Card */}
              {championMovie && (
                <Link
                  href={`/movie/${championMovie.slug}`}
                  className={styles.championCard}
                >
                  <img
                    src={championMovie.backdrop_url || championMovie.poster_url}
                    alt={championMovie.title}
                    className={styles.championBgImg}
                    loading="lazy"
                  />
                  <div className={styles.championOverlay} />

                  <div className={styles.championForeground}>
                    <div className={styles.championTopBar}>
                      <span className={styles.championBadge}>01</span>
                      {renderDelta(championMovie.delta_type, championMovie.delta_val)}
                    </div>

                    <div className={styles.championBottomInfo}>
                      {/* Metric info directly ABOVE movie title */}
                      <div className={styles.championHighlightRow}>
                        <span className={styles.championScoreHighlight}>
                          {championMovie.metric_value} {championMovie.metric_label}
                        </span>
                      </div>

                      <h4 className={styles.championTitle} title={championMovie.title}>
                        {championMovie.title}
                      </h4>

                      <div className={styles.championMeta}>
                        <span>{championMovie.year}</span>
                        <span>•</span>
                        <span>{championMovie.genres?.join(', ')}</span>
                        <span>•</span>
                        <span className="text-warning fw-bold">★ {championMovie.rating}</span>
                      </div>
                    </div>

                    {/* Bottom-right red play button for trailer (only visible on hover) */}
                    {onPlayTrailer && (
                      <button
                        type="button"
                        className={styles.championPlayBtn}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          onPlayTrailer({
                            ...championMovie,
                            name: championMovie.title,
                            trailer_url: championMovie.trailer_url || 'https://www.youtube.com/watch?v=Way9Dexny3w'
                          });
                        }}
                        title={`Xem trailer ${championMovie.title}`}
                        aria-label={`Xem trailer ${championMovie.title}`}
                      >
                        <i className="fas fa-play" />
                      </button>
                    )}
                  </div>
                </Link>
              )}

              {/* Rows #2 -> #5 Metric Rows */}
              <div className={styles.rowsContainer}>
                {runnerUpMovies.map((movie) => (
                  <Link
                    key={movie._id}
                    href={`/movie/${movie.slug}`}
                    className={styles.metricRow}
                  >
                    <span className={styles.rankNumber}>
                      {movie.rank < 10 ? `0${movie.rank}` : movie.rank}
                    </span>

                    <img
                      src={movie.poster_url}
                      alt={movie.title}
                      className={styles.movieThumbnail}
                      loading="lazy"
                    />

                    <div className={styles.movieInfoCol}>
                      <h5 className={styles.rowTitle} title={movie.title}>
                        {movie.title}
                      </h5>

                      <div className={styles.rowMeta}>
                        <span>{movie.year}</span>
                        <span>•</span>
                        <span>{movie.genres?.[0] || 'Phim'}</span>
                        <span>•</span>
                        <span className="fw-semibold text-slate-300">
                          {movie.metric_value}
                        </span>
                      </div>
                    </div>

                    {renderDelta(movie.delta_type, movie.delta_val)}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Trending Genre Growth Index */}
        <div className="col-12 col-xl-4">
          <div className={styles.bentoRightPanel}>
            <div className={styles.genreHeader}>
              <h4 className={styles.genreTitle}>Thể Loại Xu Hướng</h4>
              <span className={styles.genreSubtitle}>Biến động thứ hạng</span>
            </div>

            <div className={styles.genreList}>
              {trendingGenres.map((genre) => (
                <Link
                  key={genre._id}
                  href={`/category/${genre.slug}`}
                  className={styles.genreItem}
                >
                  <span className={styles.genreRankNumber}>
                    {genre.rank < 10 ? `0${genre.rank}` : genre.rank}
                  </span>

                  <div className={styles.genreInfoCol}>
                    <h5 className={styles.genreName} title={genre.name}>
                      {genre.name}
                    </h5>

                    <div className={styles.genreBottomRow}>
                      <span className={styles.genreLeading}>
                        Tiêu biểu: {genre.leading_movie}
                      </span>
                    </div>
                  </div>

                  {renderDelta(genre.delta_type, genre.delta_val)}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Top 10 Detailed Leaderboard Modal */}
      <RadarTop10Modal
        isOpen={isTop10Open}
        onClose={() => setIsTop10Open(false)}
        initialCategory={currentCategoryKey}
        initialPeriod={period}
        onPlayTrailer={onPlayTrailer}
      />
    </section>
  );
}
