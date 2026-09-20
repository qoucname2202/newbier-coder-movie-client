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
        {/* Full-bleed cinematic hero spotlight */}
        <HeroBanner
          movies={featuredMovies}
          onPlayTrailer={handlePlayTrailer}
        />

        {/* 3D Rotating Featured Carousel */}
        <FeaturedCarousel3D
          movies={featuredMovies}
          loading={loading}
          onPlayTrailer={handlePlayTrailer}
        />

        {/* Main movie section rails: easily customizable via props */}
        <div className="container-fluid mt-4 px-3 px-lg-4">
          {/* Section 1: Recommended Movies */}
          <TopRecommendedSection
            movies={topMovies}
            cardSize="md"
            loading={loading}
            onPlayTrailer={handlePlayTrailer}
          />

          {/* Section 2: TOP 10 Widescreen */}
          <TrendingTop10Section
            movies={mostViewedMovies}
            cardSize="md"
            loading={loading}
            onPlayTrailer={handlePlayTrailer}
          />

          {/* Section 3: K-Drama & C-Drama */}
          <CountryMoviesSection
            cardSize="md"
            onPlayTrailer={handlePlayTrailer}
          />

          {/* Special Feature: RoPhim-style Big Slide Widescreen Banner */}
          <BigSlideBanner
            onPlayTrailer={handlePlayTrailer}
            badge="ANIME SPOTLIGHT"
          />

          {/* Section 5: Animation & Anime Highlights Rail */}
          <AnimationMoviesSection
            cardSize="md"
            onPlayTrailer={handlePlayTrailer}
          />

          {/* Section 6: Latest Movies (Single-Row Rail) */}
          <LatestMoviesGridSection
            movies={latestMovies}
            cardSize="md"
            loading={loading}
            onPlayTrailer={handlePlayTrailer}
          />

          {/* Section 7: Cinema Trending Radar & Genre Pulse */}
          <TrendingRadarSection
            enabled={true}
            onPlayTrailer={handlePlayTrailer}
          />

          {/* Section 8: Standalone Community Discussion & Real-time Live Buzz (Toggleable) */}
          <CommunityCommentSection
            enabled={true}
            onPlayTrailer={handlePlayTrailer}
          />

          {/* Section 9: Upcoming Movies (Lazy-loaded dynamically on scroll) */}
          {upcomingLoaded && upcomingMovies.length > 0 && (
            <div className="home-lazy-section">
              <UpcomingMoviesSection
                movies={upcomingMovies}
                cardSize="md"
                onPlayTrailer={handlePlayTrailer}
              />
            </div>
          )}

          {/* Infinite Scroll & Lazy Loading Status Indicator */}
          {(upcomingLoading || loadingMore) && (
            <div className="home-infinite-loader">
              <div className="infinite-spinner" />
              <span className="infinite-loader-text">Đang tải thêm nội dung...</span>
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
              <span className="end-text">Đã hiển thị toàn bộ nội dung</span>
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
