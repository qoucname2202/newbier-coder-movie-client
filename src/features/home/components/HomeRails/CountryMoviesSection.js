import React, { useState, useEffect } from 'react';
import { MovieSection } from '@/components/common/MovieSection';
import { mockKoreanMovies, mockChineseMovies } from '@/mock/mockMovies';

const DEFAULT_MOCK_MAP = {
  korean: mockKoreanMovies,
  chinese: mockChineseMovies
};

/**
 * @file CountryMoviesSection.js
 * @description Dynamic, config-driven component for Country Drama rails.
 * Completely decoupled: rail titles, badges, links, and data loaders are defined in homeSectionsConfig.
 *
 * @param {Object} props
 * @param {'sm'|'md'|'lg'} [props.cardSize='md'] - Card size preset.
 * @param {Array<Object>} [props.rails] - Custom rails definition array from config.
 * @param {Function} [props.onPlayTrailer] - Trailer playback callback.
 */
export default function CountryMoviesSection({
  cardSize = 'md',
  rails = [],
  onPlayTrailer
}) {
  const [railData, setRailData] = useState(() => {
    const initial = {};
    rails.forEach((rail) => {
      initial[rail.id] = DEFAULT_MOCK_MAP[rail.id] || [];
    });
    return initial;
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let isSubscribed = true;

    const fetchAllRails = async () => {
      try {
        setLoading(true);

        const results = await Promise.all(
          rails.map(async (rail) => {
            const fallback = DEFAULT_MOCK_MAP[rail.id] || [];
            if (typeof rail.load === 'function') {
              const data = await rail.load(fallback);
              return { id: rail.id, data };
            }
            return { id: rail.id, data: fallback };
          })
        );

        if (isSubscribed) {
          const updated = {};
          results.forEach(({ id, data }) => {
            if (Array.isArray(data) && data.length > 0) {
              updated[id] = data;
            }
          });
          setRailData((prev) => ({ ...prev, ...updated }));
        }
      } catch {
        // Safe fallback retains initial verified mock data
      } finally {
        if (isSubscribed) setLoading(false);
      }
    };

    fetchAllRails();

    return () => {
      isSubscribed = false;
    };
  }, [rails]);

  return (
    <div className="movie-country-rails">
      {rails.map((rail) => (
        <MovieSection
          key={rail.id}
          title={rail.title}
          badge={rail.badge}
          viewAllHref={rail.viewAllHref}
          layout="rail"
          variant="vertical"
          cardSize={cardSize}
          movies={railData[rail.id] || []}
          loading={loading}
          onPlayTrailer={onPlayTrailer}
        />
      ))}
    </div>
  );
}
