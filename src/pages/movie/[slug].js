/**
 * @file pages/movie/[slug].js
 * @description Cinema-grade Movie Detail & Streaming Player Page.
 * Orchestrates widescreen backdrop hero header, responsive iframe player stage,
 * smart episode pagination selector, cast & crew showcase, bento metadata grid,
 * community discussion, and related film recommendations.
 */

import React, { useState, useCallback } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import {
  MovieHeroHeader,
  MoviePlayerSection,
  EpisodeSelector,
  CastCrewSection,
  MovieMetaBento,
  MovieCommentsSection,
  TrailerModal,
  useMovieDetail
} from '@/features/movie-detail';
import { MovieSection } from '@/components/common/MovieSection';
import BackToTop from '@/components/UI/BackToTop';
import styles from '@/styles/MovieDetailPage.module.css';

/**
 * Main Movie Detail & Watch Page Component
 * @param {Object} props
 * @param {string} [props.initialSlug] - Slug provided via getServerSideProps
 * @returns {JSX.Element}
 */
export default function MovieDetailPage({ initialSlug }) {
  const router = useRouter();
  const slug = initialSlug || router.query.slug;

  const {
    movie,
    loading,
    error,
    currentServerIndex,
    currentEpisodeIndex,
    activeServer,
    activeEpisode,
    setCurrentServerIndex,
    setCurrentEpisodeIndex,
    isFavorite,
    favoriteLoading,
    toggleFavorite,
    comments,
    commentsLoading,
    addComment,
    relatedMovies
  } = useMovieDetail(slug);

  const [activeTrailerMovie, setActiveTrailerMovie] = useState(null);

  // Smooth scroll down to video player when user clicks "Xem Phim Ngay"
  const handlePlayNow = useCallback(() => {
    if (typeof window !== 'undefined') {
      const playerEl = document.getElementById('movie-streaming-player');
      if (playerEl) {
        playerEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  }, []);

  // Open trailer modal
  const handleOpenTrailer = useCallback((targetMovie) => {
    setActiveTrailerMovie(targetMovie || movie);
  }, [movie]);

  // Loading skeleton screen
  if (loading && !movie) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner} />
        <p className={styles.loadingText}>Đang chuẩn bị không gian rạp chiếu...</p>
      </div>
    );
  }

  // Error / Not found state
  if (!loading && (!movie || error)) {
    return (
      <div className={styles.errorContainer}>
        <div className={styles.errorCard}>
          <i className="fas fa-film text-danger mb-3" style={{ fontSize: '3rem' }} />
          <h2 className={styles.errorTitle}>Không tìm thấy phim</h2>
          <p className={styles.errorDescription}>
            Nội dung phim bạn đang tìm kiếm hiện chưa có trên hệ thống hoặc đường dẫn không khả dụng.
          </p>
          <button
            type="button"
            className="btn btn-danger px-4 py-2 mt-2"
            onClick={() => router.push('/')}
          >
            <i className="fas fa-home me-2" /> Về Trang Chủ
          </button>
        </div>
      </div>
    );
  }

  const pageTitle = movie ? `${movie.name} - Xem Phim HD Online | MovieStreaming` : 'MovieStreaming';
  const pageDescription = movie?.content?.slice(0, 160) || 'Xem phim trực tuyến miễn phí chất lượng cao với tốc độ nhanh nhất.';

  return (
    <div className={styles.movieDetailWrapper}>
      <Head>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDescription} />
        <meta property="og:image" content={movie?.backdrop_url || movie?.poster_url || '/img/background/movies-wall.jpg'} />
        <meta property="og:type" content="video.movie" />
      </Head>

      {/* 1. Cinema 21:9 Hero Header */}
      <MovieHeroHeader
        movie={movie}
        isFavorite={isFavorite}
        favoriteLoading={favoriteLoading}
        onToggleFavorite={toggleFavorite}
        onPlayNow={handlePlayNow}
        onPlayTrailer={handleOpenTrailer}
      />

      {/* 2. Main Content Flow Container */}
      <div className={styles.mainContentContainer}>
        {/* Streaming Video Player */}
        <MoviePlayerSection
          movie={movie}
          servers={movie.episodes}
          currentServerIndex={currentServerIndex}
          onSelectServer={setCurrentServerIndex}
          activeEpisode={activeEpisode}
          currentEpisodeIndex={currentEpisodeIndex}
          onSelectEpisode={setCurrentEpisodeIndex}
        />

        {/* Smart Episode Pagination Selector */}
        {activeServer?.server_data?.length > 1 && (
          <div className={styles.sectionSpacing}>
            <EpisodeSelector
              episodes={activeServer.server_data}
              currentIndex={currentEpisodeIndex}
              onSelectEpisode={setCurrentEpisodeIndex}
            />
          </div>
        )}

        {/* Bento Specifications & Synopsis Overview */}
        <div className={styles.sectionSpacing}>
          <MovieMetaBento movie={movie} />
        </div>

        {/* Cast & Crew Section */}
        <div className={styles.sectionSpacing}>
          <CastCrewSection
            actors={movie.actors}
            directors={movie.directors}
          />
        </div>

        {/* Community Comments Section */}
        <div className={styles.sectionSpacing}>
          <MovieCommentsSection
            comments={comments}
            loading={commentsLoading}
            onAddComment={addComment}
          />
        </div>

        {/* Related & Recommended Movies Rail */}
        {relatedMovies.length > 0 && (
          <div className={styles.sectionSpacing}>
            <MovieSection
              layout="rail"
              variant="vertical"
              title="Phim Cùng Thể Loại"
              movies={relatedMovies}
              onPlayTrailer={handleOpenTrailer}
            />
          </div>
        )}
      </div>

      {/* Trailer Modal */}
      <TrailerModal
        movie={activeTrailerMovie}
        onClose={() => setActiveTrailerMovie(null)}
      />

      <BackToTop />
    </div>
  );
}

/**
 * Server-side props to extract slug before hydration
 */
export async function getServerSideProps(context) {
  const { slug } = context.params;

  return {
    props: {
      initialSlug: slug || null,
    },
  };
}