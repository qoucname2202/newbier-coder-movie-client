/**
 * @file pages/index.js
 * @description Standardized Homepage orchestrating cinema hero banner and movie sections.
 * Powered by unified Base & Preset components sharing the same behavior and visual form.
 */

import React, { useState, useEffect } from "react";
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
    latestMovies,
    loading,
    loadingMore,
    hasMore,
    loadMore
  } = useHomeData();

  const [activeTrailerMovie, setActiveTrailerMovie] = useState(null);

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

          {/* Section 3: Upcoming Movies */}
          <UpcomingMoviesSection
            movies={upcomingMovies}
            cardSize="md"
            loading={loading}
            onPlayTrailer={handlePlayTrailer}
          />

          {/* Section 4: K-Drama & C-Drama */}
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
