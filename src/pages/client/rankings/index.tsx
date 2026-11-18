/**
 * @file pages/rankings.tsx
 * @description Comprehensive leaderboard and top-50 movie rankings grid.
 */
import React, { useState, useEffect, useCallback } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import radarService from '@/API/services/radarService';
import { TrailerModal } from '@/features/movie-detail';
import type { TrailerMovie } from '@/features/client/components/detail/components/TrailerModal';
import { hasValidTrailer } from '@/utils/trailer';
import { getTaxonomyName, formatYear } from '@/utils/taxonomy';
import BackToTop from '@/features/shared/components/UI/BackToTop';
import styles from '@/styles/Rankings.module.css';

type Category = 'discussed' | 'favorite' | 'views';
type Period = 'week' | 'month';

interface RankedMovie {
  _id?: string;
  slug?: string;
  title?: string;
  poster_url?: string;
  year?: number;
  genres?: Array<string | { id?: string | number; name?: string; slug?: string }>;
  category?: Array<string | { id?: string | number; name?: string; slug?: string }>;
  rank?: number;
  delta_type?: 'up' | 'down' | 'new' | 'same';
  delta_val?: number | string;
  metric_value?: number | string;
  metric_label?: string;
}

const CATEGORY_TITLES: Record<Category, string> = {
  discussed: 'Top Sôi Nổi Nhất',
  favorite: 'Top Được Yêu Thích',
  views: 'Top Lượt Xem Nhiều Nhất'
};

export default function RankingsPage() {
  const router = useRouter();
  const queryCategory = router.query.category as string | undefined;
  const queryPeriod = router.query.period as string | undefined;

  const [category, setCategory] = useState<Category>('views');
  const [period, setPeriod] = useState<Period>('week');
  const [limit, setLimit] = useState<number>(50);
  const [movies, setMovies] = useState<RankedMovie[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTrailerMovie, setActiveTrailerMovie] = useState<TrailerMovie | null>(null);

  useEffect(() => {
    if (router.isReady) {
      if (queryCategory && ['discussed', 'favorite', 'views'].includes(queryCategory)) {
        setCategory(queryCategory as Category);
      }
      if (queryPeriod && ['week', 'month'].includes(queryPeriod)) {
        setPeriod(queryPeriod as Period);
      }
    }
  }, [router.isReady, queryCategory, queryPeriod]);

  const loadRankings = useCallback(async (cat: Category, per: Period, lim: number): Promise<void> => {
    setLoading(true);
    try {
      const data = (await radarService.getTopRankingsGrid({
        category: cat,
        period: per,
        limit: lim
      })) as RankedMovie[];
      setMovies(Array.isArray(data) ? data : []);
    } catch (err) {

      setMovies([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRankings(category, period, limit);
  }, [category, period, limit, loadRankings]);

  const handleCategoryChange = (newCat: Category): void => {
    if (newCat === category) return;
    setCategory(newCat);
    router.replace(
      { pathname: '/rankings', query: { category: newCat, period } },
      undefined,
      { shallow: true }
    );
  };

  const handlePeriodChange = (newPer: Period): void => {
    if (newPer === period) return;
    setPeriod(newPer);
    router.replace(
      { pathname: '/rankings', query: { category, period: newPer } },
      undefined,
      { shallow: true }
    );
  };

  const renderDelta = (deltaType?: string, deltaVal?: number | string): React.ReactNode => {
    if (deltaType === 'up') return <span className={`${styles.deltaBadge} ${styles.deltaUp}`}>▲ {deltaVal}</span>;
    if (deltaType === 'down') return <span className={`${styles.deltaBadge} ${styles.deltaDown}`}>▼ {deltaVal}</span>;
    if (deltaType === 'new') return <span className={`${styles.deltaBadge} ${styles.deltaNew}`}>NEW</span>;
    return <span className={`${styles.deltaBadge} ${styles.deltaSame}`}>—</span>;
  };

  const currentCategoryTitle = CATEGORY_TITLES[category] || 'Bảng Xếp Hạng';

  return (
    <>
      <Head>
        <title>{`${currentCategoryTitle} (${period === 'week' ? 'Tuần Này' : 'Tháng Này'}) - MovieStreaming`}</title>
        <meta name="description" content={`Khám phá bảng xếp hạng top 50 phim ${currentCategoryTitle.toLowerCase()} trên MovieStreaming cập nhật liên tục.`} />
      </Head>

      <main className={styles.rankingsPage}>
        <div className={styles.container}>
          <nav className={styles.breadcrumb} aria-label="Breadcrumb">
            <Link href="/" className={styles.breadcrumbLink}>Trang Chủ</Link>
            <span className={styles.breadcrumbSep}>/</span>
            <span className={styles.breadcrumbCurrent}>Bảng Xếp Hạng</span>
          </nav>

          <section className={styles.heroHeader}>
            <span className={styles.heroBadge}>CHỈ SỐ TOÀN CẢNH ĐIỆN ẢNH</span>
            <h1 className={styles.heroTitle}>Bảng Xếp Hạng Xu Hướng Thị Trường</h1>
            <p className={styles.heroSubtitle}>
              Tổng hợp và xếp hạng đa chiều theo dữ liệu thảo luận cộng đồng, mức độ đánh giá yêu thích
              và lưu lượng người xem thực tế. Cập nhật liên tục theo chu kỳ tuần và tháng.
            </p>
          </section>

          <div className={styles.filterBar}>
            <div className={styles.categoryTabs}>
              {(['views', 'favorite', 'discussed'] as Category[]).map((cat) => (
                <button
                  key={cat}
                  type="button"
                  className={`${styles.tabBtn} ${category === cat ? styles.tabBtnActive : ''}`}
                  onClick={() => handleCategoryChange(cat)}
                >
                  {cat === 'views' ? 'Lượt Xem' : cat === 'favorite' ? 'Được Yêu Thích' : 'Sôi Nổi Nhất'}
                </button>
              ))}
            </div>

            <div className={styles.controlGroup}>
              <div className={styles.periodSwitch}>
                {(['week', 'month'] as Period[]).map((per) => (
                  <button
                    key={per}
                    type="button"
                    className={`${styles.periodBtn} ${period === per ? styles.periodBtnActive : ''}`}
                    onClick={() => handlePeriodChange(per)}
                  >
                    {per === 'week' ? 'Tuần Này' : 'Tháng Này'}
                  </button>
                ))}
              </div>

              <div className={styles.limitSelector}>
                <span>Hiển thị:</span>
                {([30, 50] as const).map((lim) => (
                  <button
                    key={lim}
                    type="button"
                    className={`${styles.limitBtn} ${limit === lim ? styles.limitBtnActive : ''}`}
                    onClick={() => setLimit(lim)}
                  >
                    Top {lim}
                  </button>
                ))}
              </div>
            </div>
          </div>

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
                  rankNum === 1 ? styles.rankBadgeGold :
                  rankNum === 2 ? styles.rankBadgeSilver :
                  rankNum === 3 ? styles.rankBadgeBronze :
                  styles.rankBadgeNormal;

                return (
                  <article key={movie._id || `rank-${rankNum}`} className={styles.movieCard}>
                    <div className={styles.posterWrapper}>
                      <div className={`${styles.rankBadge} ${rankClass}`}>#{formattedRank}</div>
                      {renderDelta(movie.delta_type, movie.delta_val)}
                      <img src={movie.poster_url} alt={movie.title} className={styles.posterImg} loading="lazy" />
                      <div className={styles.posterOverlay}>
                        <Link href={`/movie/${movie.slug}`} className={styles.overlayPlayBtn}>Xem Phim</Link>
                        <button
                          type="button"
                          className={styles.overlayTrailerBtn}
                          onClick={() => {
                            // Guard: the grid has already been
                            // filtered by radarService, but re-check
                            // here so a future wiring change can
                            // never bypass the filter.
                            if (!hasValidTrailer(movie as never)) return;
                            setActiveTrailerMovie(movie as unknown as TrailerMovie);
                          }}
                        >
                          Trailer
                        </button>
                      </div>
                    </div>
                    <div className={styles.cardBody}>
                      <Link href={`/movie/${movie.slug}`} className={styles.cardTitle} title={movie.title}>
                        {movie.title}
                      </Link>
                      <div className={styles.cardMeta}>
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
                      </div>
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

        <TrailerModal
          key={activeTrailerMovie?._id || activeTrailerMovie?.slug || 'trailer-modal'}
          movie={activeTrailerMovie}
          onClose={() => setActiveTrailerMovie(null)}
        />

        <BackToTop />
      </main>
    </>
  );
}

export async function getStaticProps() {
  return { props: {} };
}
