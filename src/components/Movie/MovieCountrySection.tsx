import React, { useState, useEffect } from 'react';
import MovieCarouselSection from './MovieCarouselSection';
import { MOVIE_CONFIG } from '@/config/movieConfig';
import { filterMoviesWithValidTrailer } from '@/utils/trailer';
import type { MovieLite } from '@/features/shared/components/MovieCard/MovieCardVertical';
import { apiUrl } from '@/config/apiPaths';
import authService from '@/API/services/authService';

type CountryMovie = {
  country?: Array<{ slug?: string; name?: string }>;
  [key: string]: unknown;
};

interface MovieCountrySectionProps {
  onPlayTrailer?: (movie: MovieLite) => void;
}

const API_BASE: string = MOVIE_CONFIG.apiBaseUrl;

/**
 * @file MovieCountrySection.tsx
 * @description Standardized country rails for Korean (K-Drama) and Chinese (C-Drama) movies.
 */
const MovieCountrySection: React.FC<MovieCountrySectionProps> = ({ onPlayTrailer }) => {
  const [koreanMovies, setKoreanMovies] = useState<CountryMovie[]>([]);
  const [chineseMovies, setChineseMovies] = useState<CountryMovie[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let isSubscribed = true;

    const fetchCountryMovies = async (): Promise<void> => {
      try {
        setLoading(true);
        // The list endpoints of the backend need the Bearer token, so the
        // header is resolved through the shared auth service (it also
        // refreshes an expiring token and restores the session).
        const headers = await authService.getAuthHeader();
        const res = await fetch(apiUrl(`moviesList`) + `?page=1&limit=60`, { headers });
        if (!res.ok) throw new Error('Failed to fetch country movies');
        const data = await res.json();
        const allMovies: CountryMovie[] = data?.data?.movies || data?.movies || [];

        if (allMovies.length > 0 && isSubscribed) {
          // Same trailer-aware filter used by the homepage rails.
          // Country sections also render "Xem trailer" buttons, so
          // a movie without a valid trailer is excluded before the
          // carousel section ever sees it.
          const withTrailer = filterMoviesWithValidTrailer(allMovies) as CountryMovie[];
          const kr = withTrailer.filter((m) =>
            m.country?.some?.((c) => c.slug === 'han-quoc' || (c.name?.toLowerCase().includes('hàn') ?? false))
          );
          const cn = withTrailer.filter((m) =>
            m.country?.some?.((c) => c.slug === 'trung-quoc' || (c.name?.toLowerCase().includes('trung') ?? false))
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
      <MovieCarouselSection
        title="Phim Hàn Quốc Mới"
        badge="K-DRAMA"
        viewAllHref="/country/han-quoc"
        movies={koreanMovies as unknown as MovieLite[]}
        loading={loading}
        onPlayTrailer={onPlayTrailer as unknown as (movie: MovieLite) => void}
      />

      <MovieCarouselSection
        title="Phim Trung Quốc Mới"
        badge="C-DRAMA"
        viewAllHref="/country/trung-quoc"
        movies={chineseMovies as unknown as MovieLite[]}
        loading={loading}
        onPlayTrailer={onPlayTrailer as unknown as (movie: MovieLite) => void}
      />
    </div>
  );
};

export default MovieCountrySection;
