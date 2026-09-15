/**
 * @file pages/index.js
 * @description Standardized Homepage orchestrating cinematic hero banner and movie section rails.
 */

import React, { useState, useEffect } from "react";
import Head from "next/head";
import HeroBanner from "../components/Movie/HeroBanner";
import MovieCarouselSection from "../components/Movie/MovieCarouselSection";
import MovieCountrySection from "../components/Movie/MovieCountrySection";
import MovieGridSection from "../components/Movie/MovieGridSection";
import TrailerModal from "../components/Movie/TrailerModal";
import BackToTop from "../components/UI/BackToTop";
import { useHomeData } from "../hooks/useHomeData";
import { useAuth } from "../utils/auth";

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

        {/* Main movie section rails */}
        <div className="container-fluid mt-4 px-3 px-lg-4">
          {/* Section 1: Featured Movies */}
          <MovieCarouselSection
            title="Phim Đề Xuất"
            badge="HOT"
            viewAllHref="/danh-sach/phim-de-xuat"
            movies={topMovies}
            loading={loading}
            onPlayTrailer={handlePlayTrailer}
          />

          {/* Section 2: Top 10 Trending Movies */}
          <MovieCarouselSection
            title="Phim Được Xem Nhiều Nhất"
            badge="TOP 10"
            viewAllHref="/danh-sach/phim-hot"
            movies={mostViewedMovies}
            variant="horizontal"
            loading={loading}
            onPlayTrailer={handlePlayTrailer}
          />

          {/* Section 3: Upcoming Movies */}
          <MovieCarouselSection
            title="Phim Sắp Ra Mắt"
            badge="SẮP CHIẾU"
            viewAllHref="/danh-sach/phim-sap-chieu"
            movies={upcomingMovies}
            loading={loading}
            onPlayTrailer={handlePlayTrailer}
          />

          {/* Section 4: K-Drama & C-Drama */}
          <MovieCountrySection
            onPlayTrailer={handlePlayTrailer}
          />

          {/* Section 5: Latest Movies */}
          <MovieGridSection
            title="Phim Mới Cập Nhật"
            movies={latestMovies}
            loading={loading}
            loadingMore={loadingMore}
            hasMore={hasMore}
            onLoadMore={loadMore}
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
