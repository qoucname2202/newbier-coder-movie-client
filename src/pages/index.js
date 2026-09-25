/**
 * @file pages/index.js
 * @description Standardized Homepage orchestrating cinema hero banner and movie sections.
 * Powered by unified Base & Preset components sharing the same behavior and visual form.
 */

import React, { useState, useEffect, useRef } from "react";
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
  t
} from "@/config/homeSectionsConfig";

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

  // Controlled infinite scroll & lazy loading with 2s loading buffer & loop prevention
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry && entry.isIntersecting) {
          // Prevent rapid concurrent requests or infinite loops
          if (isBusyRef.current) return;

          if (!upcomingLoaded && !upcomingLoading) {
            isBusyRef.current = true;
            loadUpcoming().finally(() => {
              setTimeout(() => {
                isBusyRef.current = false;
              }, 1200);
            });
          } else if (upcomingLoaded && hasMore && !loadingMore) {
            isBusyRef.current = true;
            loadMore().finally(() => {
              setTimeout(() => {
                isBusyRef.current = false;
              }, 1200);
            });
          }
        }
      },
      {
        root: null,
        rootMargin: '0px',
        threshold: 0.1
      }
    );

    const sentinel = bottomSentinelRef.current;
    if (sentinel && (!upcomingLoaded || hasMore)) {
      observer.observe(sentinel);
    }

    return () => {
      if (sentinel) {
        observer.unobserve(sentinel);
      }
    };
  }, [upcomingLoaded, upcomingLoading, loadUpcoming, hasMore, loadingMore, loadMore]);

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
  // All behaviors (cardSize, badge, limit, order, text) are centrally configured in:
  // src/config/homeSectionsConfig.js
  // =========================================================================
  const renderSection = (sectionId) => {
    const config = HOME_SECTIONS[sectionId] || {};

    switch (sectionId) {
      case 'hero':
        return (
          <HeroBanner
            key="hero"
            movies={featuredMovies}
            onPlayTrailer={handlePlayTrailer}
          />
        );
      case 'carousel_3d':
        return (
          <FeaturedCarousel3D
            key="carousel_3d"
            movies={featuredMovies}
            loading={loading}
            onPlayTrailer={handlePlayTrailer}
          />
        );
      case 'recommended':
        return (
          <TopRecommendedSection
            key="recommended"
            movies={topMovies}
            cardSize={config.cardSize}
            loading={loading}
            onPlayTrailer={handlePlayTrailer}
          />
        );
      case 'top10':
        return (
          <TrendingTop10Section
            key="top10"
            movies={mostViewedMovies}
            cardSize={config.cardSize}
            badge={config.badge}
            loading={loading}
            onPlayTrailer={handlePlayTrailer}
          />
        );
      case 'country':
        return (
          <CountryMoviesSection
            key="country"
            cardSize={config.cardSize}
            onPlayTrailer={handlePlayTrailer}
          />
        );
      case 'big_slide':
        return (
          <BigSlideBanner
            key="big_slide"
            badge={config.badge}
            onPlayTrailer={handlePlayTrailer}
          />
        );
      case 'animation':
        return (
          <AnimationMoviesSection
            key="animation"
            cardSize={config.cardSize}
            onPlayTrailer={handlePlayTrailer}
          />
        );
      case 'latest':
        return (
          <LatestMoviesGridSection
            key="latest"
            movies={latestMovies}
            cardSize={config.cardSize}
            loading={loading}
            onPlayTrailer={handlePlayTrailer}
          />
        );
      case 'radar':
        if (!config.enabled) return null;
        return (
          <TrendingRadarSection
            key="radar"
            enabled={config.enabled}
            onPlayTrailer={handlePlayTrailer}
          />
        );
      case 'community':
        if (!config.enabled) return null;
        return (
          <CommunityCommentSection
            key="community"
            enabled={config.enabled}
            onPlayTrailer={handlePlayTrailer}
          />
        );
      case 'upcoming':
        if (!upcomingLoaded || upcomingMovies.length === 0) return null;
        return (
          <div key="upcoming" className="home-lazy-section">
            <UpcomingMoviesSection
              movies={upcomingMovies}
              cardSize={config.cardSize}
              onPlayTrailer={handlePlayTrailer}
            />
          </div>
        );
      default:
        return null;
    }
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
        {/* Full-bleed header sections (Hero Spotlight & 3D Carousel) */}
        {HOME_SECTION_ORDER.filter((id) => ['hero', 'carousel_3d'].includes(id)).map(renderSection)}

        {/* Dynamic section rails inside Container (order determined by HOME_SECTION_ORDER) */}
        <div className="container-fluid mt-4 px-3 px-lg-4">
          {HOME_SECTION_ORDER.filter((id) => !['hero', 'carousel_3d'].includes(id)).map(renderSection)}

          {/* Infinite Scroll & Lazy Loading Status Indicator */}
          {(upcomingLoading || loadingMore) && (
            <div className="home-infinite-loader">
              <div className="infinite-spinner" />
              <span className="infinite-loader-text">{t('infiniteLoading')}</span>
            </div>
          )}

          {/* Invisible Sentinel triggering fetch on scroll */}
          {(!upcomingLoaded || hasMore) && (
            <div ref={bottomSentinelRef} className="bottom-scroll-sentinel" />
          )}

          {/* End of content indicator when no more data exists */}
          {!hasMore && upcomingLoaded && !upcomingLoading && !loadingMore && (
            <div className="home-end-indicator">
              <span className="end-line" />
              <span className="end-text">{t('allLoaded')}</span>
              <span className="end-line" />
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

          .home-lazy-section {
            animation: fadeInLazySection 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          }

          @keyframes fadeInLazySection {
            from {
              opacity: 0;
              transform: translateY(24px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          .home-infinite-loader {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 0.85rem;
            padding: 2.5rem 0 3.5rem;
          }

          .infinite-spinner {
            width: 26px;
            height: 26px;
            border: 2.5px solid rgba(255, 255, 255, 0.12);
            border-top-color: #e50914;
            border-radius: 50%;
            animation: spinLoader 0.75s linear infinite;
          }

          @keyframes spinLoader {
            to {
              transform: rotate(360deg);
            }
          }

          .infinite-loader-text {
            font-size: 0.85rem;
            font-weight: 600;
            color: #94a3b8;
            letter-spacing: 0.02em;
          }

          .bottom-scroll-sentinel {
            width: 100%;
            height: 40px;
            pointer-events: none;
            visibility: hidden;
          }

          .home-end-indicator {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 1rem;
            padding: 2.5rem 0 3.5rem;
            color: #475569;
            font-size: 0.78rem;
            font-weight: 600;
            letter-spacing: 0.04em;
          }

          .end-line {
            width: 60px;
            height: 1px;
            background: rgba(255, 255, 255, 0.08);
          }
        `}</style>
      </div>
    </>
  );
}

/**
 * Static props fetching to avoid unnecessary server-side rendering bottlenecks.
 * @returns {Promise<{ props: Object }>} Empty static props object.
 */
export async function getStaticProps() {
  return {
    props: {}
  };
}
