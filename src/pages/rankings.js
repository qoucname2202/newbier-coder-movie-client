import React, { useState, useEffect, useCallback } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import radarService from '@/API/services/radarService';
import { TrailerModal } from '@/features/movie-detail';
import BackToTop from '@/components/UI/BackToTop';
import styles from '@/styles/Rankings.module.css';

/**
 * @file rankings.js
 * @description Comprehensive Leaderboard & Top 50 Movie Rankings Grid.
 * Displays high-density cinema rankings based on real-time discussion buzz,
 * favorite ratio, and weekly/monthly viewership metrics.
 */
export default function RankingsPage() {
  const router = useRouter();

  // Query parameters sync
  const queryCategory = router.query.category;
  const queryPeriod = router.query.period;

  const [category, setCategory] = useState('views');
  const [period, setPeriod] = useState('week');
  const [limit, setLimit] = useState(50);
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTrailerMovie, setActiveTrailerMovie] = useState(null);

  // Sync router query when ready
  useEffect(() => {
    if (router.isReady) {
      if (queryCategory && ['discussed', 'favorite', 'views'].includes(queryCategory)) {
        setCategory(queryCategory);
      }
      if (queryPeriod && ['week', 'month'].includes(queryPeriod)) {
        setPeriod(queryPeriod);
      }
    }
  }, [router.isReady, queryCategory, queryPeriod]);

  // Fetch rankings grid data
  const loadRankings = useCallback(async (cat, per, lim) => {
    setLoading(true);
    try {
      const data = await radarService.getTopRankingsGrid({
        category: cat,
        period: per,
        limit: lim
      });
      setMovies(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load rankings:', err);
      setMovies([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRankings(category, period, limit);
  }, [category, period, limit, loadRankings]);

  // Handle category switch
  const handleCategoryChange = (newCat) => {
    if (newCat === category) return;
    setCategory(newCat);
    router.replace(
      { pathname: '/rankings', query: { category: newCat, period } },
      undefined,
      { shallow: true }
    );
  };

  // Handle period switch
  const handlePeriodChange = (newPeriod) => {
    if (newPeriod === period) return;
    setPeriod(newPeriod);
    router.replace(
      { pathname: '/rankings', query: { category, period: newPeriod } },
      undefined,
      { shallow: true }
    );
  };

  // Render Delta Indicator
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

  // Dynamic titles and subtitles based on category
  const categoryTitles = {
    discussed: 'Top Sôi Nổi Nhất',
    favorite: 'Top Được Yêu Thích',
    views: 'Top Lượt Xem Nhiều Nhất'
  };

  const currentCategoryTitle = categoryTitles[category] || 'Bảng Xếp Hạng';

  return (
    <>
      <Head>
        <title>{`${currentCategoryTitle} (${period === 'week' ? 'Tuần Này' : 'Tháng Này'}) - MovieStreaming`}</title>
        <meta
          name="description"
          content={`Khám phá bảng xếp hạng top 50 phim ${currentCategoryTitle.toLowerCase()} trên MovieStreaming cập nhật liên tục.`}
        />
      </Head>

      <main className={styles.rankingsPage}>
        <div className={styles.container}>
          {/* Breadcrumbs */}
          <nav className={styles.breadcrumb} aria-label="Breadcrumb">
            <Link href="/" className={styles.breadcrumbLink}>
              Trang Chủ
            </Link>
            <span className={styles.breadcrumbSep}>/</span>
            <span className={styles.breadcrumbCurrent}>Bảng Xếp Hạng</span>
          </nav>

          {/* Hero Header */}
          <section className={styles.heroHeader}>
            <span className={styles.heroBadge}>CHỈ SỐ TOÀN CẢNH ĐIỆN ẢNH</span>
            <h1 className={styles.heroTitle}>Bảng Xếp Hạng Xu Hướng Thị Trường</h1>
            <p className={styles.heroSubtitle}>
              Tổng hợp và xếp hạng đa chiều theo dữ liệu thảo luận cộng đồng, mức độ đánh giá yêu thích
              và lưu lượng người xem thực tế. Cập nhật liên tục theo chu kỳ tuần và tháng.
            </p>
          </section>

          {/* Filter Toolbar */}
          <div className={styles.filterBar}>
            {/* 3 Categories Tabs */}
            <div className={styles.categoryTabs}>
              <button
                type="button"
                className={`${styles.tabBtn} ${category === 'views' ? styles.tabBtnActive : ''}`}
                onClick={() => handleCategoryChange('views')}
              >
                Lượt Xem
              </button>
              <button
                type="button"
                className={`${styles.tabBtn} ${category === 'favorite' ? styles.tabBtnActive : ''}`}
                onClick={() => handleCategoryChange('favorite')}
              >
                Được Yêu Thích
              </button>
              <button
                type="button"
                className={`${styles.tabBtn} ${category === 'discussed' ? styles.tabBtnActive : ''}`}
                onClick={() => handleCategoryChange('discussed')}
              >
                Sôi Nổi Nhất
              </button>
            </div>

            {/* Controls: Period Switcher & Limit Selector */}
            <div className={styles.controlGroup}>
              {/* Period Switcher */}
              <div className={styles.periodSwitch}>
                <button
                  type="button"
                  className={`${styles.periodBtn} ${period === 'week' ? styles.periodBtnActive : ''}`}
                  onClick={() => handlePeriodChange('week')}
                >
                  Tuần Này
                </button>
                <button
                  type="button"
                  className={`${styles.periodBtn} ${period === 'month' ? styles.periodBtnActive : ''}`}
                  onClick={() => handlePeriodChange('month')}
                >
                  Tháng Này
                </button>
              </div>

              {/* Limit Selector */}
              <div className={styles.limitSelector}>
                <span>Hiển thị:</span>
                <button
                  type="button"
                  className={`${styles.limitBtn} ${limit === 30 ? styles.limitBtnActive : ''}`}
                  onClick={() => setLimit(30)}
                >
                  Top 30
                </button>
                <button
                  type="button"
                  className={`${styles.limitBtn} ${limit === 50 ? styles.limitBtnActive : ''}`}
                  onClick={() => setLimit(50)}
                >
                  Top 50
                </button>
              </div>
            </div>
          </div>

          {/* Grid View of Ranked Movies */}
          {loading ? (
            <div className={styles.rankingsGrid}>
              {Array.from({ length: 12 }).map((_, idx) => (
                <div key={`skel-${idx}`} className={styles.skeletonCard} />
              ))}
            </div>
          ) : (
            <div className={styles.rankingsGrid}>
              {movies.map((movie, idx) => {
                const rankNum = movie.rank || idx + 1;
                const formattedRank = String(rankNum).padStart(2, '0');
                const rankClass =
                  rankNum === 1
                    ? styles.rankBadgeGold
                    : rankNum === 2
                    ? styles.rankBadgeSilver
                    : rankNum === 3
                    ? styles.rankBadgeBronze
                    : styles.rankBadgeNormal;

                return (
                  <article key={movie._id || `rank-${rankNum}`} className={styles.movieCard}>
                    {/* Poster + Badges */}
                    <div className={styles.posterWrapper}>
                      {/* Rank Ribbon */}
                      <div className={`${styles.rankBadge} ${rankClass}`}>
                        #{formattedRank}
                      </div>

                      {/* Movement Delta Badge */}
                      {renderDelta(movie.delta_type, movie.delta_val)}

                      {/* Poster Image */}
                      <img
                        src={movie.poster_url}
                        alt={movie.title}
                        className={styles.posterImg}
                        loading="lazy"
                      />

                      {/* Hover Overlay */}
                      <div className={styles.posterOverlay}>
                        <Link href={`/movie/${movie.slug}`} className={styles.overlayPlayBtn}>
                          Xem Phim
                        </Link>
                        <button
                          type="button"
                          className={styles.overlayTrailerBtn}
                          onClick={() => setActiveTrailerMovie(movie)}
                        >
                          Trailer
                        </button>
                      </div>
                    </div>

                    {/* Movie Information */}
                    <div className={styles.cardBody}>
                      <Link
                        href={`/movie/${movie.slug}`}
                        className={styles.cardTitle}
                        title={movie.title}
                      >
                        {movie.title}
                      </Link>

                      <div className={styles.cardMeta}>
                        <span>{movie.year || 2024}</span>
                        {movie.genres && movie.genres.length > 0 && (
                          <>
                            <span className={styles.metaDot}>•</span>
                            <span>{movie.genres[0]}</span>
                          </>
                        )}
                      </div>

                      {/* Metric Stat Tag */}
                      <div className={styles.metricBadge}>
                        {movie.metric_value} {movie.metric_label || ''}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>

        {/* Global Trailer Modal */}
        <TrailerModal
          movie={activeTrailerMovie}
          onClose={() => setActiveTrailerMovie(null)}
        />

        {/* Back To Top Floating Button */}
        <BackToTop />
      </main>
    </>
  );
}

/**
 * Server/Build config
 */
export async function getStaticProps() {
  return {
    props: {}
  };
}
