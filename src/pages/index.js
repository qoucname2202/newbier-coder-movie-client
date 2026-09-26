/**
 * @file pages/index.js
 * @description Standardized Homepage orchestrating cinema hero banner and movie sections.
 * Powered by unified Base & Preset components sharing the same behavior and visual form.
 */

import React, { useState, useEffect, useRef, useMemo } from "react";
import Head from "next/head";
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
} from "@/features/home";
import { TrailerModal } from "@/features/movie-detail";
import BackToTop from "@/components/UI/BackToTop";
import { useAuth } from "@/utils/auth";
import {
  HOME_SECTION_ORDER,
  HOME_SECTIONS,
  BATCH_LOADING_CONFIG,
  t
} from "@/config/homeSectionsConfig";

/**
 * Sentinel component placed between sequential section batches.
 * When scrolled into view, waits for the configured delayMs (default: 2000ms = 2s)
 * with a loading spinner before unlocking the next batch of sections.
 */
function BatchScrollSentinel({ onTrigger, delayMs = 2000 }) {
  const ref = useRef(null);
  const isTriggeredRef = useRef(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !isTriggeredRef.current) {
          isTriggeredRef.current = true;
          observer.disconnect();

          // Wait for the configured buffer delay (default: 2000ms / 2s)
          setTimeout(() => {
            onTrigger();
          }, delayMs);
        }
      },
      { rootMargin: '100px 0px', threshold: 0.05 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [onTrigger, delayMs]);

  return (
    <div
      ref={ref}
      className="container-fluid text-center py-5"
      style={{ minHeight: '120px' }}
    >
      <div className="d-flex align-items-center justify-content-center gap-3">
        <div className="spinner-border text-danger" role="status" style={{ width: '1.8rem', height: '1.8rem' }}>
          <span className="visually-hidden">Loading next batch...</span>
        </div>
        <span className="text-secondary" style={{ fontSize: '0.95rem', fontWeight: 500 }}>
          {/* {t('infiniteLoading')} */}
        </span>
      </div>
    </div>
  );
}

/**
 * Main Home page component.
 * @returns {JSX.Element} Rendered homepage layout.
 */
export default function Home() {
  const { isAuthenticated, isAccountLocked } = useAuth();
  const {
    featuredMovies,
    topMovies,
    mostViewedMovies,
    upcomingMovies,
    upcomingLoading,
    upcomingLoaded,
    loadUpcoming,
    latestMovies,
    loading,
    loadingMore,
    hasMore,
    loadMore
  } = useHomeData();

  const [activeTrailerMovie, setActiveTrailerMovie] = useState(null);
  const bottomSentinelRef = useRef(null);
  const isBusyRef = useRef(false);

  // Group sections into sequential batches based on loadAfterScroll breakpoints
  const sectionBatches = useMemo(() => {
    const list = [];
    let currentBatch = [];

    HOME_SECTION_ORDER.forEach((sectionId) => {
      const config = HOME_SECTIONS[sectionId] || {};
      if (config.enabled === false) return;

      // When loadAfterScroll is true, start a new deferred batch
      if (config.loadAfterScroll && currentBatch.length > 0) {
        list.push(currentBatch);
        currentBatch = [];
      }
      currentBatch.push(sectionId);
    });

    if (currentBatch.length > 0) {
      list.push(currentBatch);
    }

    return list;
  }, []);

  // Batch 0 (above-the-fold content) is always unlocked immediately on page mount
  const [unlockedBatches, setUnlockedBatches] = useState(new Set([0]));

  // Auto-trigger upcoming fetch when the batch containing 'upcoming' is unlocked
  const isUpcomingUnlocked = useMemo(() => {
    return sectionBatches.some(
      (batch, idx) => unlockedBatches.has(idx) && batch.includes('upcoming')
    );
  }, [sectionBatches, unlockedBatches]);

  useEffect(() => {
    if (isUpcomingUnlocked && !upcomingLoaded && !upcomingLoading) {
      loadUpcoming();
    }
  }, [isUpcomingUnlocked, upcomingLoaded, upcomingLoading, loadUpcoming]);

  // Infinite scroll for bottom grid pagination
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
            setTimeout(() => {
              isBusyRef.current = false;
            }, 1200);
          });
        }
      },
      { rootMargin: '100px 0px', threshold: 0.1 }
    );

    const sentinel = bottomSentinelRef.current;
    if (sentinel && hasMore) {
      observer.observe(sentinel);
    }

    return () => {
      if (sentinel) observer.unobserve(sentinel);
    };
  }, [isAllBatchesUnlocked, hasMore, loadingMore, loadMore]);

  // Safeguard: Redirect if account is flagged as locked
  useEffect(() => {
    if (isAuthenticated && isAccountLocked && typeof window !== 'undefined') {
      localStorage.setItem('isAccountLocked', 'true');
      window.location.href = '/account-locked';
    }
  }, [isAuthenticated, isAccountLocked]);

  const handlePlayTrailer = (movie) => {
    setActiveTrailerMovie(movie);
  };

  const handleCloseTrailer = () => {
    setActiveTrailerMovie(null);
  };

  // =========================================================================
  // CORE SECTION REGISTRY & PIPELINE [LOCKED: DO NOT MODIFY]
  // All behaviors (cardSize, badge, limit, order, text, fullWidth, loadAfterScroll)
  // are centrally configured in: src/config/homeSectionsConfig.js
  // =========================================================================
  const renderSection = (sectionId) => {
    const config = HOME_SECTIONS[sectionId] || {};
    if (config.enabled === false) return null;

    let content = null;

    switch (sectionId) {
      case 'hero':
        content = (
          <HeroBanner
            movies={featuredMovies}
            onPlayTrailer={handlePlayTrailer}
          />
        );
        break;
      case 'carousel_3d':
        content = (
          <FeaturedCarousel3D
            movies={featuredMovies}
            loading={loading}
            onPlayTrailer={handlePlayTrailer}
          />
        );
        break;
      case 'recommended':
        content = (
          <TopRecommendedSection
            movies={topMovies}
            cardSize={config.cardSize}
            loading={loading}
            onPlayTrailer={handlePlayTrailer}
          />
        );
        break;
      case 'top10':
        content = (
          <TrendingTop10Section
            movies={mostViewedMovies}
            cardSize={config.cardSize}
            badge={config.badge}
            loading={loading}
            onPlayTrailer={handlePlayTrailer}
          />
        );
        break;
      case 'country':
        content = (
          <CountryMoviesSection
            cardSize={config.cardSize}
            onPlayTrailer={handlePlayTrailer}
          />
        );
        break;
      case 'big_slide':
        content = (
          <BigSlideBanner
            badge={config.badge}
            onPlayTrailer={handlePlayTrailer}
          />
        );
        break;
      case 'animation':
        content = (
          <AnimationMoviesSection
            cardSize={config.cardSize}
            onPlayTrailer={handlePlayTrailer}
          />
        );
        break;
      case 'latest':
        content = (
          <LatestMoviesGridSection
            movies={latestMovies}
            cardSize={config.cardSize}
            loading={loading}
            onPlayTrailer={handlePlayTrailer}
          />
        );
        break;
      case 'radar':
        content = (
          <TrendingRadarSection
            enabled={config.enabled}
            onPlayTrailer={handlePlayTrailer}
          />
        );
        break;
      case 'community':
        content = (
          <CommunityCommentSection
            enabled={config.enabled}
            onPlayTrailer={handlePlayTrailer}
          />
        );
        break;
      case 'upcoming':
        content = (
          <UpcomingMoviesSection
            movies={upcomingMovies}
            cardSize={config.cardSize}
            loading={upcomingLoading}
            onPlayTrailer={handlePlayTrailer}
          />
        );
        break;
      default:
        return null;
    }

    if (!content) return null;

    // Wrap in standard layout container if not full-width
    return config.isFullWidth ? (
      <div key={sectionId} className="w-100">{content}</div>
    ) : (
      <div key={sectionId} className="container-fluid mt-4 px-3 px-lg-4">
        {content}
      </div>
    );
  };

  return (
    <>
      <Head>
        <title>MovieStreaming - Xem Phim Online HD Miễn Phí</title>
        <meta
          name="description"
          content="Xem phim online chất lượng cao miễn phí, cập nhật liên tục các bộ phim mới nhất, phim chiếu rạp, phim bộ hot."
        />
      </Head>

      <div className="home-container bg-black text-white">
        {/* Render sections sequentially by batches */}
        {sectionBatches.map((batchSections, batchIndex) => {
          const isUnlocked = unlockedBatches.has(batchIndex);

          if (!isUnlocked) {
            // Render the trigger sentinel for the next batch in line
            const isNextBatch = unlockedBatches.has(batchIndex - 1);
            if (!isNextBatch) return null;

            // Retrieve delayMs from next batch's first section or fallback to global config
            const nextBatchFirstSectionId = batchSections[0];
            const batchDelayMs = HOME_SECTIONS[nextBatchFirstSectionId]?.delayMs ?? BATCH_LOADING_CONFIG.delayMs;

            return (
              <BatchScrollSentinel
                key={`sentinel-${batchIndex}`}
                delayMs={batchDelayMs}
                onTrigger={() => {
                  setUnlockedBatches((prev) => new Set([...prev, batchIndex]));
                }}
              />
            );
          }

          return (
            <React.Fragment key={`batch-${batchIndex}`}>
              {batchSections.map(renderSection)}
            </React.Fragment>
          );
        })}

        {/* Infinite Scroll & Pagination Sentinel (Active after all batches are unlocked) */}
        {isAllBatchesUnlocked && (
          <div className="container-fluid mt-2 px-3 px-lg-4">
            {loadingMore && (
              <div className="home-infinite-loader">
                <div className="infinite-spinner" />
                <span className="infinite-loader-text">{t('infiniteLoading')}</span>
              </div>
            )}

            {hasMore && (
              <div ref={bottomSentinelRef} className="bottom-scroll-sentinel" />
            )}

            {!hasMore && (
              <div className="home-end-indicator">
                <span className="end-line" />
                <span className="end-text">{t('allLoaded')}</span>
                <span className="end-line" />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Global Trailer Video Modal */}
      <TrailerModal
        movie={activeTrailerMovie}
        onClose={handleCloseTrailer}
      />

      {/* Smooth Scroll to Top Button */}
      <BackToTop />

      <style jsx global>{`
        body {
          background-color: #0d1117;
          color: #ffffff;
        }

        .home-container {
          margin: 0;
          padding: 0;
          width: 100%;
          overflow-x: hidden;
        }

        .bottom-scroll-sentinel {
          height: 30px;
          margin-top: 10px;
          pointer-events: none;
        }

        .home-infinite-loader {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          padding: 28px 0;
          margin: 16px 0;
        }

        .infinite-spinner {
          width: 24px;
          height: 24px;
          border: 3px solid rgba(255, 255, 255, 0.15);
          border-top-color: #e50914;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        .infinite-loader-text {
          font-size: 0.95rem;
          color: #94a3b8;
          font-weight: 500;
        }

        .home-end-indicator {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 16px;
          padding: 36px 0 48px;
          color: #64748b;
          font-size: 0.875rem;
        }

        .end-line {
          width: 80px;
          height: 1px;
          background: rgba(255, 255, 255, 0.1);
        }
      `}</style>
    </>
  );
}
