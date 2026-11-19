/**
 * @file pages/movie/[slug]/watch.tsx
 * @description Cinema Watch & Streaming Player Page. Immersive 16:9 player,
 * side-deck episode playlist, server switcher, breadcrumb navigation, and
 * in-stream community discussion.
 */
import React, { useCallback, useEffect, useState } from 'react';
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
import { MovieSection } from '@/features/shared/components/MovieSection';
import BackToTop from '@/features/shared/components/UI/BackToTop';
import {
  getWatchProgress,
  saveWatchProgress,
  getPinnedEpisode,
  togglePinnedEpisode
} from '@/utils/watchProgress';
import { formatYear } from '@/utils/taxonomy';
import { WATCH_CONFIG } from '@/config/watchConfig';
import styles from '@/styles/MovieWatchPage.module.css';

interface MovieWatchPageProps {
  initialSlug?: string;
}

interface EpisodeItem {
  slug?: string;
  name?: string;
  [key: string]: unknown;
}

interface ServerItem {
  server_data?: EpisodeItem[];
  [key: string]: unknown;
}

interface PinnedChangeDetail {
  slug?: string;
  data?: { episodeIndex?: number } | null;
}

const MovieWatchPage: React.FC<MovieWatchPageProps> = ({ initialSlug }) => {
  const router = useRouter();
  const slug = initialSlug || (typeof router.query.slug === 'string' ? router.query.slug : '');

  const {
    movie: rawMovie,
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

  const movie = rawMovie as {
    name?: string;
    origin_name?: string;
    quality?: string;
    year?: unknown;
    time?: unknown;
    episode_total?: unknown;
    type?: string;
    poster_url?: string;
    thumb_url?: string;
    backdrop_url?: string;
    episodes?: unknown;
    slug?: string;
    content?: string;
    [key: string]: unknown;
  } | null;

  interface WatchEpisode {
    name?: string;
    slug?: string;
    link?: { embed?: string; m3u8?: string };
    [key: string]: unknown;
  }
  interface WatchServer {
    server_name?: string;
    items?: WatchEpisode[];
    [key: string]: unknown;
  }

  const [shareCopied, setShareCopied] = useState<boolean>(false);
  const [pinnedEpisodeIndex, setPinnedEpisodeIndex] = useState<number>(-1);

  useEffect(() => {
    if (!slug) return;
    const pinned = getPinnedEpisode(slug);
    if (pinned && typeof pinned.episodeIndex === 'number') {
      setPinnedEpisodeIndex(pinned.episodeIndex);
    } else {
      setPinnedEpisodeIndex(-1);
    }

    const handlePinnedChange = (e: Event) => {
      const customEvent = e as CustomEvent<PinnedChangeDetail>;
      if (customEvent.detail?.slug === slug) {
        if (customEvent.detail.data && typeof customEvent.detail.data.episodeIndex === 'number') {
          setPinnedEpisodeIndex(customEvent.detail.data.episodeIndex);
        } else {
          setPinnedEpisodeIndex(-1);
        }
      }
    };

    window.addEventListener('pinnedEpisodeChanged', handlePinnedChange);
    return () => window.removeEventListener('pinnedEpisodeChanged', handlePinnedChange);
  }, [slug]);

  const handleTogglePinEpisode = useCallback(() => {
    if (!slug || !activeEpisode) return;
    const isNowPinned = togglePinnedEpisode(slug, {
      episodeIndex: currentEpisodeIndex,
      epSlug: (activeEpisode as { slug?: string }).slug,
      epName: (activeEpisode as { name?: string }).name,
      serverIndex: currentServerIndex
    });
    setPinnedEpisodeIndex(isNowPinned ? currentEpisodeIndex : -1);
  }, [slug, activeEpisode, currentEpisodeIndex, currentServerIndex]);

  useEffect(() => {
    if (!router.isReady) return;
    const server = activeServer as ServerItem | undefined | null;
    if (!server?.server_data || server.server_data.length === 0) return;

    const { ep } = router.query;

    if (ep) {
      const epIndex = server.server_data.findIndex(
        (item) => item.slug === ep || item.name === ep
      );
      if (epIndex !== -1 && epIndex !== currentEpisodeIndex) {
        setCurrentEpisodeIndex(epIndex);
      }
    } else {
      // No explicit ?ep= in query: restore from saved watch progress.
      const saved = getWatchProgress(slug);
      if (saved) {
        let savedIndex = -1;
        if (saved.epSlug) {
          savedIndex = server.server_data.findIndex(
            (item) => item.slug === saved.epSlug || item.name === saved.epName
          );
        }
        if (savedIndex === -1 && typeof saved.episodeIndex === 'number' && saved.episodeIndex < server.server_data.length) {
          savedIndex = saved.episodeIndex;
        }

        if (savedIndex > 0) {
          setCurrentEpisodeIndex(savedIndex);
          const targetEp = server.server_data[savedIndex];
          if (targetEp?.slug) {
            router.replace(
              {
                pathname: `/movie/${slug}/watch`,
                query: { ep: targetEp.slug, server: currentServerIndex }
              },
              undefined,
              { shallow: true }
            );
          }
        }
      }
    }
    // We intentionally do not depend on `movie?.episodes` here to avoid re-running the effect
    // when server-side data is normalized; `activeServer` already reflects the current state.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router.isReady, router.query.ep, activeServer, slug]);

  useEffect(() => {
    if (!slug || !activeEpisode) return;
    saveWatchProgress(slug, {
      serverIndex: currentServerIndex,
      episodeIndex: currentEpisodeIndex,
      epSlug: (activeEpisode as { slug?: string }).slug,
      epName: (activeEpisode as { name?: string }).name,
      movieName: movie?.name as string | undefined,
      posterUrl: movie?.poster_url as string | undefined
    });
  }, [slug, currentServerIndex, currentEpisodeIndex, activeEpisode, movie?.name, movie?.poster_url]);

  const handleSelectEpisode = useCallback((epIndex: number) => {
    setCurrentEpisodeIndex(epIndex);
    const server = activeServer as ServerItem | undefined | null;
    const targetEp = server?.server_data?.[epIndex];
    if (targetEp?.slug) {
      router.replace(
        {
          pathname: `/movie/${slug}/watch`,
          query: { ep: targetEp.slug, server: currentServerIndex }
        },
        undefined,
        { shallow: true }
      );
    }
  }, [activeServer, currentServerIndex, router, setCurrentEpisodeIndex, slug]);

  const handleSelectServer = useCallback((srvIndex: number) => {
    setCurrentServerIndex(srvIndex);
    setCurrentEpisodeIndex(0);
    const newServer = (movie?.episodes as ServerItem[] | undefined)?.[srvIndex];
    const firstEp = newServer?.server_data?.[0];
    if (firstEp?.slug) {
      router.replace(
        {
          pathname: `/movie/${slug}/watch`,
          query: { ep: firstEp.slug, server: srvIndex }
        },
        undefined,
        { shallow: true }
      );
    }
  }, [movie?.episodes, router, setCurrentEpisodeIndex, setCurrentServerIndex, slug]);

  const handleShare = (): void => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2500);
    }
  };

  if (loading && !movie) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner} />
        <p className={styles.loadingText}>Loading theatre data...</p>
      </div>
    );
  }

  if (!loading && (!movie || error)) {
    return (
      <div className={styles.errorContainer}>
        <div className={styles.errorCard}>
          <i className="fas fa-exclamation-triangle text-danger mb-3" style={{ fontSize: '3rem' }} />
          <h2 className={styles.errorTitle}>No movie available to play</h2>
          <p className={styles.errorDescription}>
            This movie is not available or the streaming link has changed.
          </p>
          <button
            type="button"
            className="btn btn-danger px-4 py-2 mt-2"
            onClick={() => router.push('/')}
          >
            <i className="fas fa-home me-2" /> Back to Home
          </button>
        </div>
      </div>
    );
  }

  const epPrefix = WATCH_CONFIG.labels.defaultEpisodePrefix as string;
  const epName = (activeEpisode as { name?: string } | undefined)?.name || '';
  const epTitle = epName
    ? (epName.toLowerCase().startsWith('episode') || epName.toLowerCase().startsWith('tập') ? epName : `${epPrefix} ${epName}`)
    : (WATCH_CONFIG.labels.defaultEpisodeName as string);
  const movieName = (movie?.name as string) || 'Movie';
  const pageTitle = WATCH_CONFIG.seo.buildPageTitle(movieName, epTitle);

  return (
    <div className={styles.watchPageWrapper}>
      <Head>
        <title>{pageTitle}</title>
        <meta name="description" content={WATCH_CONFIG.seo.buildDescription(movieName, epTitle)} />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:image" content={(movie?.backdrop_url as string) || (movie?.poster_url as string) || (WATCH_CONFIG.seo.defaultBackdrop as string)} />
      </Head>

      <div className={styles.breadcrumbBar}>
        <div className={styles.breadcrumbInner}>
          <Link href={`/movie/${slug}`} className={styles.backLink}>
            <i className="fas fa-arrow-left me-2" />
            <span>{WATCH_CONFIG.labels.backToMovieDetail as string}</span>
          </Link>
          <div className={styles.breadcrumbs}>
            <Link href="/" className={styles.crumbItem}>{WATCH_CONFIG.labels.homeCrumb as string}</Link>
            <span className={styles.crumbDivider}>/</span>
            <Link href={`/movie/${slug}`} className={styles.crumbItem}>{movieName}</Link>
            <span className={styles.crumbDivider}>/</span>
            <span className={styles.crumbActive}>{epTitle}</span>
          </div>
        </div>
      </div>

      <div className={styles.cockpitContainer}>
        <div className={styles.cockpitLayout}>
          <div className={styles.playerColumn}>
            <MoviePlayerSection
              movie={movie}
              servers={movie?.episodes as WatchServer[] | undefined}
              currentServerIndex={currentServerIndex}
              onSelectServer={handleSelectServer}
              activeEpisode={activeEpisode}
              currentEpisodeIndex={currentEpisodeIndex}
              onSelectEpisode={handleSelectEpisode}
              isPinned={currentEpisodeIndex === pinnedEpisodeIndex}
              onTogglePin={handleTogglePinEpisode}
            />

            <div className={styles.videoMetaHeader}>
              <div className={styles.metaTitleGroup}>
                <div className={styles.titleBadgeRow}>
                  <h1 className={styles.movieMainTitle}>{movieName}</h1>
                  <span className={styles.epSubtleTag}>{epTitle}</span>
                </div>

                {typeof movie?.origin_name === 'string' && movie.origin_name.trim().toLowerCase() !== movieName.trim().toLowerCase() && (
                  <p className={styles.movieSubTitle}>{String(movie.origin_name)}</p>
                )}

                <div className={styles.tagRow}>
                  {typeof movie?.quality === 'string' && movie.quality.trim() ? (
                    <span className={styles.qualityTag}>{movie.quality}</span>
                  ) : null}

                  {movie?.year ? (
                    <>
                      {typeof movie?.quality === 'string' && movie.quality.trim() ? (
                        <span className={styles.metaDot} aria-hidden="true" />
                      ) : null}
                      <span className={styles.infoText}>{formatYear(movie.year)}</span>
                    </>
                  ) : null}

                  {movie?.time ? (
                    <>
                      {(movie?.year || (typeof movie?.quality === 'string' && movie.quality.trim())) ? (
                        <span className={styles.metaDot} aria-hidden="true" />
                      ) : null}
                      <span className={styles.infoText}>{String(movie.time)}</span>
                    </>
                  ) : null}

                  {movie?.episode_total ? (
                    <>
                      {(movie?.time || movie?.year || (typeof movie?.quality === 'string' && movie.quality.trim())) ? (
                        <span className={styles.metaDot} aria-hidden="true" />
                      ) : null}
                      <span className={styles.infoText}>
                        {String(movie.episode_total)} {WATCH_CONFIG.labels.totalEpisodesSuffix}
                      </span>
                    </>
                  ) : null}
                </div>
              </div>

              <div className={styles.metaActions}>
                <button
                  type="button"
                  className={`${styles.actionBtn} ${isFavorite ? styles.actionBtnActive : ''}`}
                  onClick={toggleFavorite}
                  disabled={favoriteLoading}
                  title={WATCH_CONFIG.labels.favorite as string}
                >
                  <i className={isFavorite ? 'fas fa-heart text-danger' : 'far fa-heart'} />
                  <span>{isFavorite ? WATCH_CONFIG.labels.favorited : WATCH_CONFIG.labels.favorite}</span>
                </button>

                <button
                  type="button"
                  className={styles.actionBtn}
                  onClick={handleShare}
                  title={WATCH_CONFIG.labels.share as string}
                >
                  <i className={shareCopied ? 'fas fa-check text-success' : 'fas fa-share-alt'} />
                  <span>{shareCopied ? WATCH_CONFIG.labels.shareCopied : WATCH_CONFIG.labels.share}</span>
                </button>
              </div>
            </div>

            <WatchSidebarPlaylist
              servers={movie?.episodes as WatchServer[] | undefined}
              currentServerIndex={currentServerIndex}
              onSelectServer={handleSelectServer}
              currentEpisodeIndex={currentEpisodeIndex}
              onSelectEpisode={handleSelectEpisode}
              pinnedEpisodeIndex={pinnedEpisodeIndex}
            />

            {movie?.content && (
              <div className={styles.synopsisCard}>
                <h4 className={styles.synopsisHeading}>
                  <i className="fas fa-info-circle text-danger me-2" />
                  {WATCH_CONFIG.labels.synopsisTitle as string}
                </h4>
                <p className={styles.synopsisText}>{String(movie.content)}</p>
              </div>
            )}

            <div className={styles.commentsWrapper}>
              <MovieCommentsSection
                comments={comments}
                loading={commentsLoading}
                onAddComment={addComment}
              />
            </div>
          </div>

          <div className={styles.playlistColumn}>
            <TrendingSidebar currentSlug={slug} />
          </div>
        </div>

        {relatedMovies.length > 0 && (
          <div className={styles.relatedSection}>
            <MovieSection
              layout="rail"
              variant="vertical"
              title="Recommended Similar Movies"
              movies={relatedMovies}
            />
          </div>
        )}
      </div>

      <BackToTop />
    </div>
  );
};

export default MovieWatchPage;

export async function getServerSideProps(context: { params: { slug?: string } }) {
  const { slug } = context.params;
  return {
    props: {
      initialSlug: slug || null
    }
  };
}
