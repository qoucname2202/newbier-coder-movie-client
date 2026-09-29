/**
 * @file pages/movie/[slug]/watch.js
 * @description Dedicated Cinema Watch & Streaming Player Page.
 * Features an immersive 16:9 player cockpit, live side-deck episode playlist,
 * quick server switcher, breadcrumb navigation, and in-stream community discussion.
 */

import React, { useState, useEffect, useCallback } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import {
  MoviePlayerSection,
  WatchSidebarPlaylist,
  TrendingSidebar,
  MovieCommentsSection,
  useMovieDetail
} from '@/features/movie-detail';
import { MovieSection } from '@/components/common/MovieSection';
import BackToTop from '@/components/UI/BackToTop';
import { getWatchProgress, saveWatchProgress } from '@/utils/watchProgress';
import { WATCH_CONFIG } from '@/config/watchConfig';
import styles from '@/styles/MovieWatchPage.module.css';

/**
 * Watch Page Component
 * @param {Object} props
 * @param {string} [props.initialSlug] - Extracted slug from getServerSideProps
 * @returns {JSX.Element}
 */
export default function MovieWatchPage({ initialSlug }) {
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

  const [shareCopied, setShareCopied] = useState(false);

  // Sync route query (?ep=... & ?server=...) to active episode/server OR restore saved watch progress
  useEffect(() => {
    if (!router.isReady || !activeServer?.server_data || activeServer.server_data.length === 0) return;

    const { ep, server } = router.query;

    if (server !== undefined && Number(server) !== currentServerIndex) {
      const sIdx = Number(server);
      if (sIdx >= 0 && sIdx < (movie?.episodes?.length || 0)) {
        setCurrentServerIndex(sIdx);
      }
    }

    if (ep) {
      const epIndex = activeServer.server_data.findIndex(
        (item) => item.slug === ep || item.name === ep
      );
      if (epIndex !== -1 && epIndex !== currentEpisodeIndex) {
        setCurrentEpisodeIndex(epIndex);
      }
    } else {
      // If no explicit ?ep= in query, check saved watch progress so it doesn't always default to episode 1!
      const saved = getWatchProgress(slug);
      if (saved) {
        let savedIndex = -1;
        if (saved.epSlug) {
          savedIndex = activeServer.server_data.findIndex(
            (item) => item.slug === saved.epSlug || item.name === saved.epName
          );
        }
        if (savedIndex === -1 && typeof saved.episodeIndex === 'number' && saved.episodeIndex < activeServer.server_data.length) {
          savedIndex = saved.episodeIndex;
        }

        if (savedIndex > 0) {
          setCurrentEpisodeIndex(savedIndex);
          const targetEp = activeServer.server_data[savedIndex];
          if (targetEp?.slug) {
            router.replace(
              {
                pathname: `/movie/${slug}/watch`,
                query: {
                  ep: targetEp.slug,
                  server: currentServerIndex
                }
              },
              undefined,
              { shallow: true }
            );
          }
        }
      }
    }
  }, [router.isReady, router.query, activeServer, currentServerIndex, currentEpisodeIndex, movie?.episodes, setCurrentEpisodeIndex, setCurrentServerIndex, slug]);

  // Persist watch progress whenever active episode changes
  useEffect(() => {
    if (!slug || !activeEpisode) return;
    saveWatchProgress(slug, {
      serverIndex: currentServerIndex,
      episodeIndex: currentEpisodeIndex,
      epSlug: activeEpisode.slug,
      epName: activeEpisode.name,
      movieName: movie?.name,
      posterUrl: movie?.poster_url
    });
  }, [slug, currentServerIndex, currentEpisodeIndex, activeEpisode, movie?.name, movie?.poster_url]);

  // Handle episode change and update URL query smoothly without full reload
  const handleSelectEpisode = useCallback((epIndex) => {
    setCurrentEpisodeIndex(epIndex);
    const targetEp = activeServer?.server_data?.[epIndex];
    if (targetEp?.slug) {
      router.replace(
        {
          pathname: `/movie/${slug}/watch`,
          query: {
            ep: targetEp.slug,
            server: currentServerIndex
          }
        },
        undefined,
        { shallow: true }
      );
    }
  }, [activeServer, currentServerIndex, router, setCurrentEpisodeIndex, slug]);

  // Handle server change
  const handleSelectServer = useCallback((srvIndex) => {
    setCurrentServerIndex(srvIndex);
    setCurrentEpisodeIndex(0);
    const newServer = movie?.episodes?.[srvIndex];
    const firstEp = newServer?.server_data?.[0];
    if (firstEp?.slug) {
      router.replace(
        {
          pathname: `/movie/${slug}/watch`,
          query: {
            ep: firstEp.slug,
            server: srvIndex
          }
        },
        undefined,
        { shallow: true }
      );
    }
  }, [movie?.episodes, router, setCurrentEpisodeIndex, setCurrentServerIndex, slug]);

  // Copy share URL
  const handleShare = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2500);
    }
  };

  // Loading screen
  if (loading && !movie) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner} />
        <p className={styles.loadingText}>Đang nạp dữ liệu rạp chiếu...</p>
      </div>
    );
  }

  // Error / Not found state
  if (!loading && (!movie || error)) {
    return (
      <div className={styles.errorContainer}>
        <div className={styles.errorCard}>
          <i className="fas fa-exclamation-triangle text-danger mb-3" style={{ fontSize: '3rem' }} />
          <h2 className={styles.errorTitle}>Không tìm thấy phim để phát</h2>
          <p className={styles.errorDescription}>
            Nội dung phim này hiện không có sẵn hoặc liên kết phát sóng đã thay đổi.
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

  const epPrefix = WATCH_CONFIG.labels.defaultEpisodePrefix;
  const epTitle = activeEpisode?.name
    ? (activeEpisode.name.toLowerCase().startsWith('tập') ? activeEpisode.name : `${epPrefix} ${activeEpisode.name}`)
    : WATCH_CONFIG.labels.defaultEpisodeName;
  const pageTitle = WATCH_CONFIG.seo.buildPageTitle(movie.name, epTitle);

  return (
    <div className={styles.watchPageWrapper}>
      <Head>
        <title>{pageTitle}</title>
        <meta name="description" content={WATCH_CONFIG.seo.buildDescription(movie.name, epTitle)} />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:image" content={movie?.backdrop_url || movie?.poster_url || WATCH_CONFIG.seo.defaultBackdrop} />
      </Head>

      {/* Top Breadcrumb Bar */}
      <div className={styles.breadcrumbBar}>
        <div className={styles.breadcrumbInner}>
          <Link href={`/movie/${slug}`} className={styles.backLink}>
            <i className="fas fa-arrow-left me-2" />
            <span>{WATCH_CONFIG.labels.backToMovieDetail}</span>
          </Link>
          <div className={styles.breadcrumbs}>
            <Link href="/" className={styles.crumbItem}>{WATCH_CONFIG.labels.homeCrumb}</Link>
            <span className={styles.crumbDivider}>/</span>
            <Link href={`/movie/${slug}`} className={styles.crumbItem}>{movie.name}</Link>
            <span className={styles.crumbDivider}>/</span>
            <span className={styles.crumbActive}>{epTitle}</span>
          </div>
        </div>
      </div>

      {/* Main Cockpit: Player + Live Playlist */}
      <div className={styles.cockpitContainer}>
        <div className={styles.cockpitLayout}>
          {/* Left Column: 16:9 Video Player & Meta */}
          <div className={styles.playerColumn}>
            <MoviePlayerSection
              movie={movie}
              servers={movie.episodes}
              currentServerIndex={currentServerIndex}
              onSelectServer={handleSelectServer}
              activeEpisode={activeEpisode}
              currentEpisodeIndex={currentEpisodeIndex}
              onSelectEpisode={handleSelectEpisode}
            />

            {/* Video Info Header below Player */}
            <div className={styles.videoMetaHeader}>
              <div className={styles.metaTitleGroup}>
                <div className={styles.titleBadgeRow}>
                  <h1 className={styles.movieMainTitle}>
                    {movie.name}
                  </h1>
                  <span className={styles.epSubtleTag}>{epTitle}</span>
                </div>

                {movie.origin_name && movie.origin_name.trim().toLowerCase() !== movie.name.trim().toLowerCase() && (
                  <p className={styles.movieSubTitle}>{movie.origin_name}</p>
                )}

                <div className={styles.tagRow}>
                  {movie.quality && movie.quality.trim() && (
                    <span className={styles.qualityTag}>{movie.quality}</span>
                  )}

                  {movie.year && (
                    <>
                      {movie.quality && movie.quality.trim() && (
                        <span className={styles.metaDot} aria-hidden="true" />
                      )}
                      <span className={styles.infoText}>{movie.year}</span>
                    </>
                  )}

                  {movie.time && (
                    <>
                      {(movie.year || (movie.quality && movie.quality.trim())) && (
                        <span className={styles.metaDot} aria-hidden="true" />
                      )}
                      <span className={styles.infoText}>{movie.time}</span>
                    </>
                  )}

                  {movie.episode_total && (
                    <>
                      {(movie.time || movie.year || (movie.quality && movie.quality.trim())) && (
                        <span className={styles.metaDot} aria-hidden="true" />
                      )}
                      <span className={styles.infoText}>
                        {movie.episode_total} {WATCH_CONFIG.labels.totalEpisodesSuffix}
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className={styles.metaActions}>
                <button
                  type="button"
                  className={`${styles.actionBtn} ${isFavorite ? styles.actionBtnActive : ''}`}
                  onClick={toggleFavorite}
                  disabled={favoriteLoading}
                  title={WATCH_CONFIG.labels.favorite}
                >
                  <i className={isFavorite ? 'fas fa-heart text-danger' : 'far fa-heart'} />
                  <span>{isFavorite ? WATCH_CONFIG.labels.favorited : WATCH_CONFIG.labels.favorite}</span>
                </button>

                <button
                  type="button"
                  className={styles.actionBtn}
                  onClick={handleShare}
                  title={WATCH_CONFIG.labels.share}
                >
                  <i className={shareCopied ? 'fas fa-check text-success' : 'fas fa-share-alt'} />
                  <span>{shareCopied ? WATCH_CONFIG.labels.shareCopied : WATCH_CONFIG.labels.share}</span>
                </button>
              </div>
            </div>

            {/* Lowered Episode Playlist (below Player & Meta Header) */}
            <WatchSidebarPlaylist
              servers={movie.episodes}
              currentServerIndex={currentServerIndex}
              onSelectServer={handleSelectServer}
              currentEpisodeIndex={currentEpisodeIndex}
              onSelectEpisode={handleSelectEpisode}
            />

            {/* Synopsis Peek */}
            {movie.content && (
              <div className={styles.synopsisCard}>
                <h4 className={styles.synopsisHeading}>
                  <i className="fas fa-info-circle text-danger me-2" />
                  {WATCH_CONFIG.labels.synopsisTitle}
                </h4>
                <p className={styles.synopsisText}>{movie.content}</p>
              </div>
            )}

            {/* Discussion & Comments */}
            <div className={styles.commentsWrapper}>
              <MovieCommentsSection
                comments={comments}
                loading={commentsLoading}
                onAddComment={addComment}
              />
            </div>
          </div>

          {/* Right Column: Trending / Featured Top 10 by Day/Month/Year */}
          <div className={styles.playlistColumn}>
            <TrendingSidebar currentSlug={slug} />
          </div>
        </div>

        {/* Related Recommendations Rail */}
        {relatedMovies.length > 0 && (
          <div className={styles.relatedSection}>
            <MovieSection
              layout="rail"
              variant="vertical"
              title="Phim Cùng Thể Loại Đề Xuất"
              movies={relatedMovies}
            />
          </div>
        )}
      </div>

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
