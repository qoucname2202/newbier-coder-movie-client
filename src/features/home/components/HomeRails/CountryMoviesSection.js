import React, { useState, useEffect } from 'react';
import { MovieSection } from '@/components/common/MovieSection';

/**
 * @file CountryMoviesSection.js
 * @description Dynamic, config-driven component for Country Drama rails.
 * Completely decoupled: rail titles, badges, links, and data loaders are defined in homeSectionsConfig.
 * Pure real API data handling with zero mock dependency.
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
  const [railData, setRailData] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isSubscribed = true;

    const fetchAllRails = async () => {
      try {
        setLoading(true);

        const results = await Promise.all(
          rails.map(async (rail) => {
            if (typeof rail.load === 'function') {
              const data = await rail.load([]);
              return { id: rail.id, data: Array.isArray(data) ? data : [] };
            }
            return { id: rail.id, data: [] };
          })
        );

        if (isSubscribed) {
          const updated = {};
          results.forEach(({ id, data }) => {
            updated[id] = data;
          });
          setRailData(updated);
        }
      } catch {
        if (isSubscribed) {
          setRailData({});
        }
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
