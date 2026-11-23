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

import React, { useState } from 'react';
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
  FormatSkeletonGrid,
  type FormatMovieItem
} from '@/features/client/formats';
import { TrailerModal } from '@/features/movie-detail';
import type { TrailerMovie } from '@/features/client/components/detail/components/TrailerModal';
import movieService from '@/API/services/movieService';
import BackToTop from '@/features/shared/components/UI/BackToTop';
import styles from '@/styles/FormatPage.module.css';

export default function FormatPage() {
  const router = useRouter();
  const rawSlug = router.query.slug;
  const slug = typeof rawSlug === 'string' && rawSlug ? rawSlug.trim().toLowerCase() : 'phim-le';

  const [activeTrailerMovie, setActiveTrailerMovie] = useState<TrailerMovie | null>(null);

  const {
    movies,
    pagination,
    formatTitle,
    isLoading,
    error,
    sort,
    year,
    changePage,
    changeSort,
    changeYear,
    retry
  } = useFormatMovies({ slug, defaultLimit: 20 });

  const handleOpenTrailer = async (movie: FormatMovieItem): Promise<void> => {
    const initialTrailer: TrailerMovie = {
      _id: movie.id,
      slug: movie.slug,
      name: movie.name,
      title: movie.name,
      origin_name: movie.originName,
      poster_url: movie.posterUrl,
      thumb_url: movie.thumbUrl,
      trailer_url: movie.trailerUrl || undefined,
      trailerUrl: movie.trailerUrl || undefined,
      year: movie.year || undefined,
      duration: movie.duration || undefined,
      quality: movie.quality || undefined
    };

    setActiveTrailerMovie(initialTrailer);

    // Eagerly resolve full detail if trailerUrl was missing from listing payload
    if (!movie.trailerUrl) {
      try {
        const detailRes = await movieService.getMovieDetails(movie.slug);
        const data = detailRes?.responseData;
        const moviePayload = (data as { movie?: Record<string, unknown> })?.movie ||
                             (data as Record<string, unknown>) ||
                             (detailRes as { movie?: Record<string, unknown> })?.movie;
        if (moviePayload && typeof moviePayload === 'object') {
          const trailerUrl = (moviePayload as { trailer_url?: string; trailerUrl?: string }).trailer_url ||
                             (moviePayload as { trailerUrl?: string }).trailerUrl;
          if (trailerUrl) {
            setActiveTrailerMovie((prev) => {
              if (!prev || prev.slug !== movie.slug) return prev;
              return {
                ...prev,
                trailer_url: trailerUrl,
                trailerUrl: trailerUrl,
                ...moviePayload
              };
            });
          }
        }
      } catch {
        // Keep initialTrailer
      }
    }
  };

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
                  <FormatMovieCard
                    key={movie.id || movie.slug}
                    movie={movie}
                    onPlayTrailer={handleOpenTrailer}
                  />
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

        {/* Cinema Interactive Trailer Modal */}
        {activeTrailerMovie && (
          <TrailerModal
            movie={activeTrailerMovie}
            onClose={() => setActiveTrailerMovie(null)}
          />
        )}
      </main>

      <BackToTop />
    </>
  );
}
