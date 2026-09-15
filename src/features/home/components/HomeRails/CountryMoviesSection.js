import React, { useState, useEffect } from 'react';
import { MovieSection } from '@/components/common/MovieSection';
import { mockKoreanMovies, mockChineseMovies } from '@/mock/mockMovies';
import { MOVIE_CONFIG } from '@/config/movieConfig';

const API_BASE = MOVIE_CONFIG.apiBaseUrl;

/**
 * @file CountryMoviesSection.js
 * @description Preset component for Country Drama rails (Korean & Chinese).
 * Powered by MovieSection base component for unified behavior and styling.
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
        const res = await fetch(`${API_BASE}/movies?page=1&limit=60`);
        if (!res.ok) throw new Error('Failed to fetch country movies');
        const data = await res.json();
        const allMovies = data?.data?.movies || data?.movies || [];

        if (allMovies.length > 0 && isSubscribed) {
          const kr = allMovies.filter((m) =>
            m.country?.some?.((c) => c.slug === 'han-quoc' || c.name?.toLowerCase().includes('hàn'))
          );
          const cn = allMovies.filter((m) =>
            m.country?.some?.((c) => c.slug === 'trung-quoc' || c.name?.toLowerCase().includes('trung'))
          );

          if (kr.length > 0) setKoreanMovies(kr);
          if (cn.length > 0) setChineseMovies(cn);
        }
      } catch (err) {
        // Safe fallback to mock data
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
