import React, { useState, useEffect } from 'react';
import { MovieSection } from '@/components/common/MovieSection';
import { mockKoreanMovies, mockChineseMovies } from '@/mock/mockMovies';
import movieService from '@/API/services/movieService';

/**
 * @file CountryMoviesSection.js
 * @description Preset component for Country Drama rails (Korean & Chinese).
 * Powered by MovieSection base component with multi-tier resilient API fetching.
 *
 * @param {Object} props
 * @param {'sm'|'md'|'lg'} [props.cardSize='md'] - Card size preset.
 * @param {Function} [props.onPlayTrailer] - Trailer playback callback.
 */
export default function CountryMoviesSection({
  cardSize = 'md',
  onPlayTrailer
}) {
  const [koreanMovies, setKoreanMovies] = useState(mockKoreanMovies);
  const [chineseMovies, setChineseMovies] = useState(mockChineseMovies);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let isSubscribed = true;

    const fetchCountryMovies = async () => {
      try {
        setLoading(true);

        const [krList, cnList] = await Promise.all([
          movieService.getMoviesByCountry('han-quoc', 20),
          movieService.getMoviesByCountry('trung-quoc', 20)
        ]);

        if (isSubscribed) {
          if (Array.isArray(krList) && krList.length > 0) {
            setKoreanMovies(krList);
          }
          if (Array.isArray(cnList) && cnList.length > 0) {
            setChineseMovies(cnList);
          }
        }
      } catch {
        // Safe fallback retains initial verified mock data
      } finally {
        if (isSubscribed) setLoading(false);
      }
    };

    fetchCountryMovies();

    return () => {
      isSubscribed = false;
    };
  }, []);

  return (
    <div className="movie-country-rails">
      {/* Korean Drama Rail */}
      <MovieSection
        title="Phim Hàn Quốc Mới"
        badge="K-DRAMA"
        viewAllHref="/quoc-gia/han-quoc"
        layout="rail"
        variant="vertical"
        cardSize={cardSize}
        movies={koreanMovies}
        loading={loading}
        onPlayTrailer={onPlayTrailer}
      />

      {/* Chinese Drama Rail */}
      <MovieSection
        title="Phim Trung Quốc Mới"
        badge="C-DRAMA"
        viewAllHref="/quoc-gia/trung-quoc"
        layout="rail"
        variant="vertical"
        cardSize={cardSize}
        movies={chineseMovies}
        loading={loading}
        onPlayTrailer={onPlayTrailer}
      />
    </div>
  );
}
