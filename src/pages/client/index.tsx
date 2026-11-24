/**
 * @file pages/index.tsx
 * @description Homepage orchestrator: cinema hero banner, movie rails, and
 * pre-rendered dashboard data via Incremental Static Regeneration.
 */
import React, { useState, useEffect, useRef, useMemo } from 'react';
import type { ReactElement, ReactNode } from 'react';
import Head from 'next/head';
import {
  HeroBanner,
  FeaturedCarousel3D,
  TopRecommendedSection,
  TrendingTop10Section,
  UpcomingMoviesSection,
  CountryMoviesSection,
  LatestMoviesGridSection,
  AnimationMoviesSection,
  BigSlideBanner,
  CommunityCommentSection,
  TrendingRadarSection,
  useHomeData
} from '@/features/home';
import { TrailerModal } from '@/features/movie-detail';
import type { TrailerMovie as DetailTrailerMovie } from '@/features/client/components/detail/components/TrailerModal';
import { hasValidTrailer } from '@/utils/trailer';
import BackToTop from '@/features/shared/components/UI/BackToTop';
import { useAuth } from '@/context/AuthContext';
import {
  HOME_SECTION_ORDER,
  HOME_SECTIONS,
  BATCH_LOADING_CONFIG,
  t
} from '@/config/homeSectionsConfig';
import { getDashboardDataForISR } from '@/utils/dashboardSnapshot';

type SectionId = (typeof HOME_SECTION_ORDER)[number];

interface BatchScrollSentinelProps {
  onTrigger: () => void;
  delayMs?: number;
}

function BatchScrollSentinel({ onTrigger, delayMs = 0 }: BatchScrollSentinelProps): ReactElement {
  const ref = useRef<HTMLDivElement>(null);
  const isTriggeredRef = useRef<boolean>(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !isTriggeredRef.current) {
          isTriggeredRef.current = true;
          observer.disconnect();
          if (delayMs > 0) {
            setTimeout(() => onTrigger(), delayMs);
          } else {
            onTrigger();
          }
        }
      },
      { rootMargin: '350px 0px', threshold: 0.05 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [onTrigger, delayMs]);

  return (
    <div ref={ref} className="batch-spinner-container">
      <div className="batch-spinner" role="status" aria-label="Đang tải nội dung..." />
    </div>
  );
}

interface HomeProps {
  initialSnapshot?: unknown;
}

export default function Home({ initialSnapshot }: HomeProps): ReactElement {
  const { isAuthenticated, isAccountLocked, loading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      if (typeof window !== 'undefined') {
        try {
          // eslint-disable-next-line @typescript-eslint/no-require-imports
          const { hasActiveSessionMarker, handleSessionHardFailure } = require('@/auth/authToken');
          if (hasActiveSessionMarker()) {
            handleSessionHardFailure(true);
          }
        } catch {
          // ignore
        }
      }
    }
  }, [authLoading, isAuthenticated]);
  const {
    featuredMovies,
    topMovies,
    mostViewedMovies,
    upcomingMovies,
    upcomingLoading,
    upcomingLoaded,
    loadUpcoming,
    latestMovies,
    animeSpotlightMovies,
    loading,
    loadingMore,
    hasMore,
    loadMore
  } = useHomeData(initialSnapshot as never);

  const [activeTrailerMovie, setActiveTrailerMovie] = useState<DetailTrailerMovie | null>(null);
  const bottomSentinelRef = useRef<HTMLDivElement>(null);
  const isBusyRef = useRef<boolean>(false);

  const sectionBatches = useMemo((): string[][] => {
    const list: string[][] = [];
    let currentBatch: string[] = [];
    HOME_SECTION_ORDER.forEach((sectionId: SectionId) => {
      const config = HOME_SECTIONS[sectionId];
      if (!config || config.enabled === false) return;
      if (config.loadAfterScroll && currentBatch.length > 0) {
        list.push(currentBatch);
        currentBatch = [];
      }
      currentBatch.push(sectionId);
    });
    if (currentBatch.length > 0) list.push(currentBatch);
    return list;
  }, []);

  const [unlockedBatches, setUnlockedBatches] = useState<Set<number>>(new Set([0]));

  const isUpcomingUnlocked = useMemo((): boolean => {
    return sectionBatches.some((batch, idx) => unlockedBatches.has(idx) && batch.includes('upcoming'));
  }, [sectionBatches, unlockedBatches]);

  useEffect(() => {
    if (isUpcomingUnlocked && !upcomingLoaded && !upcomingLoading) loadUpcoming();
  }, [isUpcomingUnlocked, upcomingLoaded, upcomingLoading, loadUpcoming]);

  // Preload: as soon as batch 1 is unlocked, start fetching the data of
  // batch 2 before the user scrolls down to it.
  //
  // WHY THE RESULT IS NOT THROWN AWAY
  // The preload used to fetch the data and drop it, so the rail component
  // fetched the SAME data again when it mounted. Now the result is stored
  // in the shared request cache of `movieService`, so when the rail mounts
  // it is served from that cache and NO second request is sent.
  //
  // The `preloadStartedRef` makes the effect idempotent: React StrictMode
  // runs it twice in development, and the preload must not fire twice.
  const preloadStartedRef = useRef<boolean>(false);
  useEffect(() => {
    // The preload runs when batch 0 is unlocked (the page has just opened)
    // and batch 1 is not unlocked yet (the user has not scrolled down to
    // it).
    if (!unlockedBatches.has(0) || unlockedBatches.has(1)) return;
    if (preloadStartedRef.current) return;

    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { isSessionTerminated } = require('@/auth/authToken');
      if (isSessionTerminated()) return;
    } catch {
      // ignore
    }

    preloadStartedRef.current = true;

    // Batch 1 has just been unlocked, so dispatch the data fetch early
    const batch1Sections = sectionBatches[1] || [];
    batch1Sections.forEach((sectionId) => {
      const config = HOME_SECTIONS[sectionId];
      if (config?.rails) {
        // The country sections hold several child rails
        config.rails.forEach((rail) => {
          if (rail.load) rail.load([]).catch(() => {/* silent */});
        });
      } else if (config?.load) {
        config.load([]).catch(() => {/* silent */});
      }
    });
  }, [unlockedBatches, sectionBatches]);

  const isAllBatchesUnlocked = unlockedBatches.has(sectionBatches.length - 1);
  useEffect(() => {
    if (typeof window === 'undefined' || !isAllBatchesUnlocked) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry && entry.isIntersecting) {
          if (isBusyRef.current || !hasMore || loadingMore) return;
          isBusyRef.current = true;
          loadMore().finally(() => {
            setTimeout(() => { isBusyRef.current = false; }, 600);
          });
        }
      },
      { rootMargin: '50px 0px', threshold: 0.05 }
    );
    const sentinel = bottomSentinelRef.current;
    if (sentinel && hasMore) observer.observe(sentinel);
    return () => { if (sentinel) observer.unobserve(sentinel); };
  }, [isAllBatchesUnlocked, hasMore, loadingMore, loadMore]);

  useEffect(() => {
    if (isAuthenticated && isAccountLocked && typeof window !== 'undefined') {
      localStorage.setItem('isAccountLocked', 'true');
      window.location.href = '/common/account-locked';
    }
  }, [isAuthenticated, isAccountLocked]);

  const [renderTimedOut, setRenderTimedOut] = useState<boolean>(false);

  // Safety net: if `loading` from useHomeData() stays true for more than
  // 12 seconds, force-render sections so the page never appears "stuck"
  // even if the underlying API is hung / blocked by middleware.
  useEffect(() => {
    // eslint-disable-next-line no-console

    if (!loading) {
      setRenderTimedOut(false);
      return;
    }
    const timer = setTimeout(() => {
      // eslint-disable-next-line no-console

      setRenderTimedOut(true);
    }, 12000);
    return () => clearTimeout(timer);
  }, [loading, featuredMovies.length, topMovies.length, latestMovies.length, mostViewedMovies.length, animeSpotlightMovies.length]);

  const effectiveLoading = loading && !renderTimedOut;

  // Note: Homepage is public — do NOT redirect unauthenticated users to /auth/login
  // from this effect. The header already exposes login/register buttons and the
  // <withAuth> HOC handles protected routes. Previously this effect caused the
  // home to "spin forever" when useAuth() was still resolving (stuck loading)
  // OR when the user simply hadn't logged in yet.
  // See bug report: "sao trang home tui van loading".

  const handlePlayTrailer = (movie: DetailTrailerMovie): void => {
    // Last-line guard: every rail in this page has already been
    // filtered through `filterMoviesWithValidTrailer` in
    // `useHomeData`, but a future card component wired here might
    // forget to filter its own list. Re-checking here means a
    // "trailer not available" panel can never appear from
    // this entry point.
    if (!hasValidTrailer(movie as never)) return;
    setActiveTrailerMovie(movie);
  };
  const handleCloseTrailer = (): void => setActiveTrailerMovie(null);

  const renderSection = (sectionId: SectionId): ReactNode => {
    const config = HOME_SECTIONS[sectionId];
    if (!config || config.enabled === false) return null;
    let content: ReactNode = null;
    switch (sectionId) {
      case 'hero':
        content = <HeroBanner movies={featuredMovies} loading={effectiveLoading} onPlayTrailer={handlePlayTrailer} />;
        break;
      case 'carousel_3d':
        content = <FeaturedCarousel3D movies={featuredMovies} loading={effectiveLoading} onPlayTrailer={handlePlayTrailer} />;
        break;
      case 'recommended':
        content = <TopRecommendedSection movies={topMovies} cardSize={config.cardSize} loading={effectiveLoading} onPlayTrailer={handlePlayTrailer} />;
        break;
      case 'top10':
        content = <TrendingTop10Section movies={mostViewedMovies} cardSize={config.cardSize} badge={config.badge} loading={effectiveLoading} onPlayTrailer={handlePlayTrailer} />;
        break;
      case 'country':
        content = <CountryMoviesSection cardSize={config.cardSize} rails={config.rails} onPlayTrailer={handlePlayTrailer} />;
        break;
      case 'big_slide':
        content = <BigSlideBanner title={config.title} badge={config.badge} viewAllHref={config.viewAllHref} autoPlayInterval={config.autoPlayInterval} movies={animeSpotlightMovies} loading={effectiveLoading} onPlayTrailer={handlePlayTrailer} />;
        break;
      case 'animation':
        content = <AnimationMoviesSection cardSize={config.cardSize} title={config.title} badge={config.badge} viewAllHref={config.viewAllHref} load={config.load} onPlayTrailer={handlePlayTrailer} />;
        break;
      case 'latest':
        content = <LatestMoviesGridSection movies={latestMovies} cardSize={config.cardSize} loading={effectiveLoading} onPlayTrailer={handlePlayTrailer} />;
        break;
      case 'radar':
        if (!config.enabled) return null;
        content = <TrendingRadarSection enabled={config.enabled} title={config.title} defaultPeriod={config.defaultPeriod} defaultCategory={config.defaultCategory} onPlayTrailer={handlePlayTrailer} />;
        break;
      case 'community':
        if (!config.enabled) return null;
        content = <CommunityCommentSection enabled={config.enabled} title={config.title} limit={config.limit} />;
        break;
      case 'upcoming':
        if (!config.enabled || (!upcomingLoading && (!upcomingMovies || upcomingMovies.length === 0))) return null;
        content = <UpcomingMoviesSection movies={upcomingMovies} cardSize={config.cardSize} loading={upcomingLoading} onPlayTrailer={handlePlayTrailer} />;
        break;
      default: return null;
    }
    if (!content) return null;
    return config.isFullWidth ? (
      <div key={sectionId} className="w-100 section-layout-frame">{content}</div>
    ) : (
      <div key={sectionId} className="container-fluid mt-4 px-3 px-lg-4 section-layout-frame">{content}</div>
    );
  };

  return (
    <>
      <Head>
        <title>MovieStreaming - Xem Phim Online HD Miễn Phí</title>
        <meta name="description" content="Xem phim online chất lượng cao miễn phí, cập nhật liên tục các bộ phim mới nhất, phim chiếu rạp, phim bộ hot." />
      </Head>

      <div className="home-container bg-black text-white">
        <h1 className="visually-hidden">Xem Phim Online HD Miễn Phí - MovieStreaming</h1>
        {sectionBatches.map((batchSections, batchIndex) => {
          const isUnlocked = unlockedBatches.has(batchIndex);
          if (!isUnlocked) {
            const isNextBatch = unlockedBatches.has(batchIndex - 1);
            if (!isNextBatch) return null;
            const nextBatchFirstSectionId = batchSections[0];
            const batchDelayMs = HOME_SECTIONS[nextBatchFirstSectionId]?.delayMs ?? BATCH_LOADING_CONFIG.delayMs;
            return (
              <BatchScrollSentinel
                key={`sentinel-${batchIndex}`}
                delayMs={batchDelayMs}
                onTrigger={() => setUnlockedBatches((prev) => new Set([...prev, batchIndex]))}
              />
            );
          }
          return (
            <React.Fragment key={`batch-${batchIndex}`}>
              {batchSections.map(renderSection)}
            </React.Fragment>
          );
        })}

        {isAllBatchesUnlocked && (
          <div className="container-fluid mt-3 mb-5 px-3 px-lg-4 text-center">
            {hasMore ? (
              <div className="d-flex flex-column align-items-center">
                <button
                  type="button"
                  className={`home-load-more-btn ${loadingMore ? 'is-loading' : ''}`}
                  onClick={() => !loadingMore && loadMore()}
                  disabled={loadingMore}
                  aria-busy={loadingMore}
                  aria-live="polite"
                  aria-label={loadingMore ? 'Đang tải thêm phim' : 'Xem thêm phim'}
                >
                  <span className="btn-glow-shimmer" aria-hidden="true" />
                  {loadingMore ? (
                    <span className="btn-content">
                      <span className="btn-spinner" aria-hidden="true" />
                      <span>Đang tải thêm phim...</span>
                    </span>
                  ) : (
                    <span className="btn-content">
                      <i className="fas fa-chevron-circle-down btn-icon" aria-hidden="true" />
                      <span>Xem thêm phim</span>
                    </span>
                  )}
                </button>
                <div ref={bottomSentinelRef} className="bottom-scroll-sentinel" />
              </div>
            ) : (
              <div className="home-end-indicator">
                <span className="end-line" />
                <span className="end-text">{t('allLoaded')}</span>
                <span className="end-line" />
              </div>
            )}
          </div>
        )}
      </div>

      <TrailerModal
        key={activeTrailerMovie?._id || activeTrailerMovie?.slug || 'trailer-modal'}
        movie={activeTrailerMovie}
        onClose={handleCloseTrailer}
      />
      <BackToTop />

      <style jsx global>{`
        body { background-color: #0d1117; color: #ffffff; }
        .home-container { margin: 0; padding: 0; width: 100%; overflow-x: hidden; }
        .section-layout-frame {
          animation: fadeInFrame 0.35s ease-out;
          content-visibility: auto;
          contain-intrinsic-size: 0 450px;
        }
        .section-layout-frame:empty { display: none !important; margin: 0 !important; padding: 0 !important; min-height: 0 !important; }
        .batch-spinner-container { display: flex; align-items: center; justify-content: center; padding: 24px 0 28px; width: 100%; }
        .batch-spinner { width: 32px; height: 32px; border: 3px solid rgba(255,255,255,0.15); border-top-color: #e50914; border-radius: 50%; animation: spin 0.8s linear infinite; }
        .bottom-scroll-sentinel { height: 20px; margin-top: 10px; pointer-events: none; }
        
        /* Modern High-Conversion Load More Button */
        .home-load-more-btn {
          position: relative;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 14px 38px;
          border-radius: 9999px;
          background: linear-gradient(135deg, rgba(229, 9, 20, 0.92) 0%, rgba(185, 28, 28, 0.95) 100%);
          color: #ffffff;
          font-size: 1rem;
          font-weight: 600;
          letter-spacing: 0.02em;
          border: 1px solid rgba(255, 255, 255, 0.22);
          box-shadow: 0 4px 20px rgba(229, 9, 20, 0.4), inset 0 1px 1px rgba(255, 255, 255, 0.35);
          cursor: pointer;
          overflow: hidden;
          outline: none;
          min-width: 220px;
          min-height: 50px;
          transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1),
                      box-shadow 0.25s ease,
                      background 0.25s ease,
                      border-color 0.25s ease;
        }
        .home-load-more-btn:hover:not(:disabled) {
          transform: translateY(-2px) scale(1.02);
          background: linear-gradient(135deg, #ff1a25 0%, #dc2626 100%);
          border-color: rgba(255, 255, 255, 0.4);
          box-shadow: 0 8px 30px rgba(229, 9, 20, 0.65), 0 0 16px rgba(255, 77, 88, 0.4);
        }
        .home-load-more-btn:active:not(:disabled) {
          transform: translateY(1px) scale(0.99);
          box-shadow: 0 2px 12px rgba(229, 9, 20, 0.45);
        }
        .home-load-more-btn:focus-visible {
          box-shadow: 0 0 0 3px rgba(255, 255, 255, 0.4), 0 0 20px rgba(229, 9, 20, 0.8);
        }
        .home-load-more-btn:disabled {
          cursor: not-allowed;
          opacity: 0.88;
        }
        .btn-content {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          position: relative;
          z-index: 2;
        }
        .btn-icon {
          font-size: 1.1rem;
          transition: transform 0.25s ease;
        }
        .home-load-more-btn:hover:not(:disabled) .btn-icon {
          transform: translateY(2px);
        }
        .btn-spinner {
          width: 18px;
          height: 18px;
          border: 2.5px solid rgba(255, 255, 255, 0.3);
          border-top-color: #ffffff;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
        }
        .btn-glow-shimmer {
          position: absolute;
          inset: 0;
          background: linear-gradient(
            90deg,
            transparent 0%,
            rgba(255, 255, 255, 0.22) 50%,
            transparent 100%
          );
          transform: translateX(-100%);
          animation: shimmerSweep 3s infinite;
          pointer-events: none;
        }
        @keyframes shimmerSweep {
          0% { transform: translateX(-100%); }
          40%, 100% { transform: translateX(100%); }
        }
        @media (prefers-reduced-motion: reduce) {
          .btn-glow-shimmer { animation: none; display: none; }
          .home-load-more-btn { transition: none; }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        .home-end-indicator { display: flex; align-items: center; justify-content: center; gap: 16px; padding: 36px 0 48px; color: #64748b; font-size: 0.875rem; }
        .end-line { width: 80px; height: 1px; background: rgba(255,255,255,0.1); }
      `}</style>
    </>
  );
}

export async function getStaticProps() {
  const isSnapshotEnabled = (process.env.NEXT_PUBLIC_ENABLE_HOMEPAGE_SNAPSHOT ?? process.env.ENABLE_HOMEPAGE_SNAPSHOT) === 'true';
  if (!isSnapshotEnabled) {
    return { props: { initialSnapshot: null }, revalidate: 60 };
  }
  try {
    const initialSnapshot = await getDashboardDataForISR();
    return { props: { initialSnapshot: initialSnapshot || null }, revalidate: 180 };
  } catch {
    return { props: { initialSnapshot: null }, revalidate: 60 };
  }
}
