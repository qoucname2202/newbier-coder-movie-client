/**
 * @file pages/movie/[slug].tsx
 * @description Master Movie Detail & Discovery Page.
 * Orchestrates widescreen cinema hero header, episode directory & progress tracker,
 * inline trailer showcase, cast & crew rail, community reviews & discussions,
 * trending sidebar ranking, and similar movie recommendations.
 */
import React, { useState, useCallback, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { toast } from 'react-toastify';
import {
  MovieHeroHeader,
  EpisodeDirectory,
  InlineTrailerSection,
  CastCrewSection,
  MovieCommentsSection,
  TrendingSidebar,
  SimilarMoviesSection,
  TrailerModal,
  useMovieDetail,
  normalizeMovieDetail
} from '@/features/movie-detail';
import type { HeroHeaderMovie } from '@/features/client/components/detail/components/MovieHeroHeader/MovieHeroHeader';
import type { CastCrewPerson } from '@/features/client/components/detail/components/CastCrewSection/CastCrewSection';
import type { TrailerMovie } from '@/features/client/components/detail/components/TrailerModal';
import { hasValidTrailer } from '@/utils/trailer';
import BackToTop from '@/features/shared/components/UI/BackToTop';
import styles from '@/styles/MovieDetailPage.module.css';

interface MovieDetailPageProps {
  initialSlug?: string;
}

export default function MovieDetailPage({ initialSlug }: MovieDetailPageProps) {
  const router = useRouter();
  const slug = initialSlug || (typeof router.query.slug === 'string' ? router.query.slug : '');
  const isPreview = router.query.preview === 'true';

  const {
    movie: fetchedMovie,
    loading: fetchLoading,
    error,
    isFavorite,
    favoriteLoading,
    toggleFavorite,
    comments,
    commentsLoading,
    addComment,
    relatedMovies,
    refetchMovie
  } = useMovieDetail(isPreview ? null : slug);

  // Live draft state when viewed from Admin Live Demo
  const [draftMovie, setDraftMovie] = useState<HeroHeaderMovie | null>(null);

  useEffect(() => {
    if (isPreview && typeof window !== 'undefined') {
      try {
        const stored = sessionStorage.getItem('admin_movie_preview_draft');
        if (stored) {
          const parsed = JSON.parse(stored);
          const normalized = normalizeMovieDetail(parsed, slug);
          setDraftMovie(normalized as unknown as HeroHeaderMovie);
        }
      } catch {
        // Safe fallback for invalid JSON in session storage
      }
    }
  }, [isPreview, slug]);

  const movie = (isPreview && draftMovie) ? draftMovie : fetchedMovie;
  const loading = isPreview ? !draftMovie : fetchLoading;

  const [activeTrailerMovie, setActiveTrailerMovie] = useState<unknown>(null);

  const handleOpenTrailer = useCallback((targetMovie?: unknown) => {
    const candidate = (targetMovie as TrailerMovie | null) || (movie as TrailerMovie | null);
    if (!candidate) return;
    if (!hasValidTrailer(candidate as never)) {
      toast.info('Trailer chính thức đang được cập nhật.');
      return;
    }
    setActiveTrailerMovie(candidate);
  }, [movie]);

  const handleReportMovie = useCallback(() => {
    toast.success('Cảm ơn bạn đã phản hồi! Đội ngũ kỹ thuật sẽ kiểm tra máy chủ phát ngay lập tức.');
  }, []);

  if (loading && !movie) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner} />
        <span className={styles.loadingText}>Đang tải thông tin phim...</span>
      </div>
    );
  }

  // Handle error states with enterprise-grade guidance
  if (!loading && error) {
    if (error === 'auth-required') {
      const handleLogin = (): void => {
        const currentPath = `/movie/${slug || ''}`;
        const redirectParam = encodeURIComponent(currentPath);
        router.push(`/auth/login?redirect=${redirectParam}`);
      };

      return (
        <div className={styles.errorContainer}>
          <div className={styles.errorCard}>
            <i className="fas fa-lock text-warning mb-3" style={{ fontSize: '3rem' }} />
            <h2 className={styles.errorTitle}>Cần đăng nhập để xem phim</h2>
            <p className={styles.errorDescription}>
              Bạn cần đăng nhập tài khoản để xem thông tin chi tiết và trải nghiệm chất lượng phim tốt nhất.
            </p>
            <div className="d-flex gap-2 mt-2 flex-wrap justify-content-center">
              <button
                type="button"
                className="btn btn-danger px-4 py-2"
                onClick={handleLogin}
              >
                <i className="fas fa-sign-in-alt me-2" /> Đăng nhập
              </button>
              <button
                type="button"
                className="btn btn-outline-light px-4 py-2"
                onClick={() => router.push('/')}
              >
                <i className="fas fa-home me-2" /> Về trang chủ
              </button>
            </div>
          </div>
        </div>
      );
    }

    if (error === 'request-error') {
      return (
        <div className={styles.errorContainer}>
          <div className={styles.errorCard}>
            <i className="fas fa-exclamation-triangle text-warning mb-3" style={{ fontSize: '3rem' }} />
            <h2 className={styles.errorTitle}>Không thể tải thông tin phim</h2>
            <p className={styles.errorDescription}>
              Đã xảy ra lỗi khi kết nối tới máy chủ. Vui lòng kiểm tra kết nối mạng hoặc thử lại sau ít phút.
            </p>
            <div className="d-flex gap-2 mt-2 justify-content-center">
              <button
                type="button"
                className="btn btn-danger px-4 py-2"
                onClick={() => { void refetchMovie(); }}
              >
                <i className="fas fa-redo me-2" /> Thử lại
              </button>
              <button
                type="button"
                className="btn btn-outline-light px-4 py-2"
                onClick={() => router.push('/')}
              >
                <i className="fas fa-home me-2" /> Về trang chủ
              </button>
            </div>
          </div>
        </div>
      );
    }

    // error === 'not-found'
    return (
      <div className={styles.errorContainer}>
        <div className={styles.errorCard}>
          <i className="fas fa-film text-danger mb-3" style={{ fontSize: '3rem' }} />
          <h2 className={styles.errorTitle}>Không tìm thấy phim</h2>
          <p className={styles.errorDescription}>
            Bộ phim bạn đang tìm kiếm hiện chưa có trên hệ thống hoặc đường liên kết không chính xác.
          </p>
          <button
            type="button"
            className="btn btn-danger px-4 py-2 mt-2"
            onClick={() => router.push('/')}
          >
            <i className="fas fa-home me-2" /> Về trang chủ
          </button>
        </div>
      </div>
    );
  }

  const typedMovie = movie as (HeroHeaderMovie & { total_episodes?: number }) | null;
  const pageTitle = typedMovie ? `${typedMovie.name} - Thông Tin & Xem Phim Full HD | MovieStreaming` : 'MovieStreaming';
  const pageDescription = (typedMovie?.content && String(typedMovie.content).slice(0, 160))
    || 'Xem phim online miễn phí, thông tin diễn viên, trailer và bình luận phim.';

  const isSeries = typedMovie?.type === 'series' || (typedMovie?.episodes?.[0]?.server_data?.length || 0) > 1;

  return (
    <div className={styles.movieDetailWrapper}>
      <Head>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDescription} />
        <meta property="og:image" content={typedMovie?.backdrop_url || typedMovie?.poster_url || '/img/background/movies-wall.jpg'} />
        <meta property="og:type" content="video.movie" />
      </Head>

      {/* 0. Live Preview Mode Top Banner */}
      {isPreview && draftMovie && (
        <div style={{
          position: 'sticky',
          top: 0,
          zIndex: 9999,
          background: 'rgba(18, 18, 22, 0.96)',
          backdropFilter: 'blur(8px)',
          borderBottom: '1px solid rgba(229, 9, 20, 0.6)',
          color: '#ffffff',
          padding: '0.45rem 1.25rem',
          fontSize: '0.78rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div className="d-flex align-items-center gap-2">
            <span style={{
              background: '#e50914',
              color: '#fff',
              padding: '1px 7px',
              borderRadius: 3,
              fontSize: '0.68rem',
              fontWeight: 700
            }}>
              LIVE DRAFT
            </span>
            <span>Chế độ Xem Thử Dữ Liệu Bản Nháp • Phim chưa lưu vào cơ sở dữ liệu</span>
          </div>
          <button
            type="button"
            className="btn btn-sm btn-outline-light"
            style={{ fontSize: '0.7rem', padding: '0.15rem 0.55rem' }}
            onClick={() => window.close()}
          >
            ✕ Đóng xem thử
          </button>
        </div>
      )}

      {/* 1. Cinema 21:9 Widescreen Hero Header */}
      <MovieHeroHeader
        movie={typedMovie}
        isFavorite={isFavorite}
        onToggleFavorite={toggleFavorite}
        onPlayTrailer={(m) => handleOpenTrailer(m)}
        onReport={handleReportMovie}
      />

      {/* 2. Main Content 2-Column Master Layout */}
      <div className={styles.mainContentContainer}>
        <div className={styles.mainContentGrid}>
          {/* Left Column: Primary Content */}
          <main className={styles.mainColumn}>
            {/* Episode Directory & Process Bar */}
            <EpisodeDirectory
              movieSlug={slug}
              servers={typedMovie?.episodes}
              movieType={typedMovie?.type}
              totalEpisodesExpected={typedMovie?.total_episodes}
            />

            {/* Dedicated Inline Trailer Section */}
            <InlineTrailerSection
              movie={typedMovie as never}
              onOpenModal={(m) => handleOpenTrailer(m)}
            />

            {/* Cast & Crew Section */}
            <CastCrewSection
              actors={typedMovie?.actors as unknown as CastCrewPerson[] | undefined}
              directors={typedMovie?.directors as unknown as CastCrewPerson[] | undefined}
            />

            {/* Similar Movies Recommendation Grid */}
            <SimilarMoviesSection
              movies={relatedMovies as never}
              currentMovieName={typedMovie?.name}
              currentMovieSlug={slug}
              currentMovieCategory={
                Array.isArray(typedMovie?.category) && typedMovie.category.length > 0
                  ? (typeof typedMovie.category[0] === 'object' && typedMovie.category[0] !== null
                      ? (typedMovie.category[0] as { slug?: string }).slug
                      : String(typedMovie.category[0]))
                  : ''
              }
              onPlayTrailer={(m) => handleOpenTrailer(m as never)}
            />

            {/* Community Reviews & Discussion */}
            <MovieCommentsSection
              comments={comments}
              loading={commentsLoading}
              onAddComment={addComment}
              movieSlug={slug}
              movieName={typedMovie?.name}
              rating={typedMovie?.rating}
              ratingCount={typedMovie?.ratingCount}
            />
          </main>

          {/* Right Column: Sidebar */}
          <aside className={styles.sidebarColumn}>
            {/* Top Trending Movies Heat Leaderboard Rail */}
            <TrendingSidebar currentSlug={slug} />
          </aside>
        </div>
      </div>

      {/* Fullscreen Cinematic Trailer Modal */}
      <TrailerModal
        key={(activeTrailerMovie as { _id?: string; slug?: string } | null)?._id
          || (activeTrailerMovie as { slug?: string } | null)?.slug
          || 'trailer-modal'}
        movie={activeTrailerMovie as TrailerMovie | null}
        onClose={() => setActiveTrailerMovie(null)}
      />

      <BackToTop />
    </div>
  );
}

export async function getServerSideProps(context: { params: { slug?: string } }) {
  const { slug } = context.params;
  return {
    props: {
      initialSlug: slug || null
    }
  };
}
