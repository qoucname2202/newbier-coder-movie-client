/**
 * @file pages/client/genre/[slug].tsx
 * @description Cinema-grade genre landing page with dynamic atmospheric theme showcase,
 * format filters, responsive 2:3 poster grid, trailer modal, and throttled infinite scrolling.
 */

import React, { useMemo } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import {
  useGenreMovies,
  getGenreThemeConfig,
  GenreHeroBanner,
  GenreFilterBar,
  GenreMovieGrid,
  GenreGridSkeleton,
  GenreScrollLoader,
  GenreEmptyState
} from '@/features/client/genre';
import { TrailerModal } from '@/features/movie-detail';
import type { TrailerMovie } from '@/features/movie-detail';

const GenrePage: React.FC = () => {
  const router = useRouter();
  const { slug } = router.query;
  const slugString = typeof slug === 'string' ? slug : '';

  // Resolve dynamic theme aesthetic and metadata
  const themeConfig = useMemo(() => getGenreThemeConfig(slugString), [slugString]);

  // Hook managing movies, filters, deduplication, and throttled scroll observer
  const {
    movies,
    total,
    hasMore,
    isLoading,
    isLoadingMore,
    formatFilter,
    sortOption,
    sentinelRef,
    activeTrailerMovie,
    setFormatFilter,
    setSortOption,
    openTrailer,
    closeTrailer,
    resetFilters
  } = useGenreMovies({ slug: slugString });

  const pageTitle = `${themeConfig.title} - Tuyển Tập Phim Chiếu Rạp & Bom Tấn | MovieStreaming`;
  const canonicalUrl = `https://moviestreaming.com/genre/${slugString}`;

  return (
    <>
      <Head>
        <title>{pageTitle}</title>
        <meta name="description" content={themeConfig.tagline} />
        <meta name="keywords" content={`${themeConfig.title}, phim ${themeConfig.title}, xem phim ${themeConfig.title} vietsub, phim hd`} />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href={canonicalUrl} />

        {/* OpenGraph */}
        <meta property="og:type" content="video.movie" />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={themeConfig.tagline} />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:site_name" content="MovieStreaming" />

        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={pageTitle} />
        <meta name="twitter:description" content={themeConfig.tagline} />
      </Head>

      <div className="genre-page-root">
        {/* Hero Header with dynamic theme glow & sub-genre pills */}
        <GenreHeroBanner
          themeConfig={themeConfig}
          totalMovies={total}
          currentSlug={slugString}
        />

        {/* Floating Filter & Sorting Toolbar */}
        <GenreFilterBar
          formatFilter={formatFilter}
          sortOption={sortOption}
          onFormatChange={setFormatFilter}
          onSortChange={setSortOption}
          loadedCount={movies.length}
          totalCount={total}
          isLoading={isLoading}
        />

        {/* Main Content Area */}
        <main className="genre-content-container">
          {isLoading ? (
            <GenreGridSkeleton count={18} />
          ) : movies.length === 0 ? (
            <GenreEmptyState
              genreTitle={themeConfig.title}
              currentSlug={slugString}
              hasFilters={formatFilter !== 'all'}
              onResetFilters={resetFilters}
            />
          ) : (
            <>
              <GenreMovieGrid
                movies={movies}
                hasMore={hasMore}
                totalCount={total}
                genreTitle={themeConfig.title}
                onPlayTrailer={openTrailer}
              />

              {/* Scroll Sentinel Element observed by IntersectionObserver */}
              <div
                ref={sentinelRef}
                className="scroll-sentinel"
                aria-hidden="true"
              />

              {/* Loader indicator while fetching next page */}
              {isLoadingMore && <GenreScrollLoader />}
            </>
          )}
        </main>

        {/* Interactive Trailer Modal */}
        {activeTrailerMovie && (
          <TrailerModal
            movie={activeTrailerMovie as unknown as TrailerMovie}
            onClose={closeTrailer}
          />
        )}
      </div>

      <style jsx global>{`
        .genre-page-root {
          min-height: 100vh;
          background-color: #0c0f16;
          color: #ffffff;
          overflow-x: hidden;
        }

        .genre-content-container {
          position: relative;
          min-height: 50vh;
          padding-bottom: 3rem;
        }

        .scroll-sentinel {
          height: 30px;
          width: 100%;
          pointer-events: none;
          visibility: hidden;
        }
      `}</style>
    </>
  );
};

export default GenrePage;
