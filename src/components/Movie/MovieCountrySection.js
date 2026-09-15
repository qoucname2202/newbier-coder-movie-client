import React, { useState, useEffect } from 'react';
import MovieCarouselSection from './MovieCarouselSection';
import { mockKoreanMovies, mockChineseMovies } from '../../mock/mockMovies';
import { MOVIE_CONFIG } from '../../config/movieConfig';

const API_BASE = MOVIE_CONFIG.apiBaseUrl;

/**
 * @file MovieCountrySection.js
 * @description Standardized country rails for Korean (K-Drama) and Chinese (C-Drama) movies.
 */
export default function MovieCountrySection({ onPlayTrailer }) {
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
        // Safe fallback to mockKoreanMovies & mockChineseMovies
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
      <MovieCarouselSection
        title="Phim Hàn Quốc Mới"
        badge="K-DRAMA"
        viewAllHref="/quoc-gia/han-quoc"
        movies={koreanMovies}
        loading={loading}
        onPlayTrailer={onPlayTrailer}
      />

      {/* Chinese Drama Rail */}
      <MovieCarouselSection
        title="Phim Trung Quốc Mới"
        badge="C-DRAMA"
        viewAllHref="/quoc-gia/trung-quoc"
        movies={chineseMovies}
        loading={loading}
        onPlayTrailer={onPlayTrailer}
      />
    </div>
  );
}
