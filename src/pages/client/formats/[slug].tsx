/**
 * @file pages/client/formats/[slug].tsx
 * @description Enterprise Format Landing & Movie Listing Page (Phim Lẻ, Phim Bộ).
 *
 * Features:
 * 1. Synchronized URL query state (/formats/phim-le/movies?page=1&limit=20&sort=newest).
 * 2. High-performance responsive grid: 2 cols (mobile), 3-4 (tablet), 5-6 (desktop).
 * 3. Movie cards with duration badges, language & quality coding, and watch later bookmarking.
 * 4. Microdata Breadcrumb (Trang chủ › Phim Lẻ).
 * 5. Shimmer skeleton loading & accessible smart windowing pagination.
 * 6. User-friendly error recovery and empty states with retry triggers.
 */

import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { FaExclamationTriangle, FaFilm, FaRedoAlt, FaHome } from 'react-icons/fa';
import {
  useFormatMovies,
  FormatBreadcrumb,
  FormatFilterBar,
  FormatMovieCard,
  FormatPagination,
  FormatSkeletonGrid
} from '@/features/client/formats';
import BackToTop from '@/features/shared/components/UI/BackToTop';
import styles from '@/styles/FormatPage.module.css';

export default function FormatPage() {
  const router = useRouter();
  const rawSlug = router.query.slug;
  const slug = typeof rawSlug === 'string' && rawSlug ? rawSlug.trim().toLowerCase() : 'phim-le';

  const {
    movies,
    pagination,
    formatTitle,
    isLoading,
    error,
    sort,
    year,
    page,
    changePage,
    changeSort,
    changeYear,
    retry
  } = useFormatMovies({ slug, defaultLimit: 20 });

  const pageTitle = `${formatTitle} Hay Chọn Lọc Mới Nhất 2026 - Xem Phim Online Vietsub HD`;
  const pageDesc = `Tuyển tập danh sách ${formatTitle} mới nhất, xem online chất lượng cao HD, FullHD, Vietsub, Thuyết minh miễn phí cập nhật liên tục.`;
  const canonicalUrl = `https://xomphim-mocha.vercel.app/formats/${slug}/movies`;

  return (
    <>
      <Head>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDesc} />
        <link rel="canonical" href={canonicalUrl} />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDesc} />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:type" content="video.other" />
      </Head>

      <main className={styles.pageWrapper}>
        <div className={styles.container}>
          {/* Breadcrumb Navigation with Schema.org JSON-LD */}
          <FormatBreadcrumb formatTitle={formatTitle} formatSlug={slug} />

          {/* Header Row: Title & Badge */}
          <div className={styles.headerRow}>
            <div className={styles.titleArea}>
              <h1 className={styles.pageTitle}>{formatTitle}</h1>
              <span className={styles.formatBadge}>ĐỊNH DẠNG</span>
            </div>
          </div>

          {/* Filter Bar with Sort & Year Selectors */}
          <FormatFilterBar
            currentSort={sort}
            currentYear={year}
            totalItems={pagination.totalItems}
            onSortChange={changeSort}
            onYearChange={changeYear}
          />

          {/* Loading Skeleton */}
          {isLoading && <FormatSkeletonGrid count={20} />}

          {/* Error Recovery State */}
          {!isLoading && error && (
            <div className={styles.stateContainer} role="alert">
              <FaExclamationTriangle className={styles.stateIcon} aria-hidden="true" />
              <h2 className={styles.stateTitle}>Đã có lỗi xảy ra</h2>
              <p className={styles.stateDesc}>{error}</p>
              <button type="button" className={styles.actionBtn} onClick={retry}>
                <FaRedoAlt aria-hidden="true" />
                <span>Thử lại</span>
              </button>
            </div>
          )}

          {/* Empty State */}
          {!isLoading && !error && movies.length === 0 && (
            <div className={styles.stateContainer}>
              <FaFilm className={styles.stateIcon} style={{ color: '#64748b' }} aria-hidden="true" />
              <h2 className={styles.stateTitle}>Không có phim nào</h2>
              <p className={styles.stateDesc}>
                Hiện tại chưa tìm thấy danh sách {formatTitle} nào phù hợp với bộ lọc{' '}
                {year !== 'all' ? `năm ${year}` : ''}. Bạn vui lòng chọn lại tiêu chí tìm kiếm khác hoặc quay lại sau.
              </p>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
                {year !== 'all' && (
                  <button
                    type="button"
                    className={styles.actionBtn}
                    onClick={() => changeYear('all')}
                  >
                    Xem tất cả các năm
                  </button>
                )}
                <Link href="/" className={styles.actionBtn} style={{ background: '#334155' }}>
                  <FaHome aria-hidden="true" />
                  <span>Về trang chủ</span>
                </Link>
              </div>
            </div>
          )}

          {/* Movie Grid: 2 cols (mobile), 3-4 (tablet), 5-6 (desktop) */}
          {!isLoading && !error && movies.length > 0 && (
            <>
              <div className={styles.movieGrid}>
                {movies.map((movie) => (
                  <FormatMovieCard key={movie.id || movie.slug} movie={movie} />
                ))}
              </div>

              {/* Accessible Pagination */}
              <FormatPagination
                currentPage={pagination.currentPage}
                totalPages={pagination.totalPages}
                onPageChange={changePage}
              />
            </>
          )}
        </div>
      </main>

      <BackToTop />
    </>
  );
}
