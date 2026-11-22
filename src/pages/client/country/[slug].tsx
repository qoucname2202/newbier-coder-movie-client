/**
 * @file pages/country/[slug].tsx
 * @description Enterprise Country Landing & Movie Listing Page.
 *
 * Features:
 * 1. Synchronized URL query state (/quoc-gia/han-quoc?page=2&sort=moi-nhat&year=2024).
 * 2. High-performance responsive grid: 2 cols (mobile), 3-4 (tablet), 5-6 (desktop).
 * 3. Core info movie cards with WebP/AVIF support and fallback image resiliency.
 * 4. Microdata Breadcrumb (Trang chủ › Quốc gia › [Tên quốc gia]).
 * 5. Shimmer skeleton loading & accessible pagination.
 * 6. User-friendly error recovery with retry trigger.
 */

import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { FaExclamationTriangle, FaFilm, FaRedoAlt } from 'react-icons/fa';
import {
  useCountryMovies,
  CountryBreadcrumb,
  CountryFilterBar,
  CountryMovieCard,
  CountryPagination,
  CountrySkeletonGrid
} from '@/features/client/countries';
import BackToTop from '@/features/shared/components/UI/BackToTop';
import styles from '@/styles/CountryPage.module.css';

export default function CountryPage() {
  const router = useRouter();
  const rawSlug = router.query.slug;
  const slug = typeof rawSlug === 'string' ? rawSlug.trim().toLowerCase() : '';

  const {
    movies,
    pagination,
    countryName,
    isLoading,
    error,
    sort,
    year,
    page,
    changePage,
    changeSort,
    changeYear,
    retry,
  } = useCountryMovies({ slug });

  const displayName = countryName || slug.replace(/-/g, ' ').toUpperCase() || 'Quốc gia';
  const pageTitle = `Phim ${displayName} Mới Nhất - Tuyển Tập Phim ${displayName} Hay Chọn Lọc`;
  const pageDesc = `Xem danh sách phim ${displayName} mới nhất, phim ${displayName} hay chọn lọc, chất lượng cao HD Vietsub và Thuyết minh cập nhật liên tục.`;
  const canonicalUrl = `https://xomphim-mocha.vercel.app/quoc-gia/${slug}`;

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
          <CountryBreadcrumb countryName={displayName} countrySlug={slug} />

          {/* Header Row: Title & Badge */}
          <div className={styles.headerRow}>
            <div className={styles.titleArea}>
              <h1 className={styles.pageTitle}>Phim {displayName}</h1>
              <span className={styles.countryBadge}>QUỐC GIA</span>
            </div>
          </div>

          {/* Filter Bar with Sort & Year Selectors */}
          <CountryFilterBar
            currentSort={sort}
            currentYear={year}
            totalItems={pagination.totalItems}
            onSortChange={changeSort}
            onYearChange={changeYear}
          />

          {/* Loading Skeleton */}
          {isLoading && <CountrySkeletonGrid count={18} />}

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
                Hiện tại chưa tìm thấy danh sách phim nào thuộc quốc gia {displayName}{' '}
                {year !== 'all' ? `trong năm ${year}` : ''}. Bạn vui lòng chọn lại tiêu chí tìm kiếm khác hoặc quay lại sau.
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
                  <span>Về trang chủ</span>
                </Link>
              </div>
            </div>
          )}

          {/* Success Movie Grid */}
          {!isLoading && !error && movies.length > 0 && (
            <>
              <div className={styles.movieGrid} aria-label={`Danh sách phim ${displayName}`}>
                {movies.map((movie) => (
                  <CountryMovieCard
                    key={String(movie._id || movie.slug || movie.id)}
                    movie={movie}
                  />
                ))}
              </div>

              {/* Accessible Pagination */}
              <CountryPagination
                currentPage={page}
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
