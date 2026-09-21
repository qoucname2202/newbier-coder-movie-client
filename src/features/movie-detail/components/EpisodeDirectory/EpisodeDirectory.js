import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import styles from './EpisodeDirectory.module.css';

const GROUP_SIZE = 100;

/**
 * @file EpisodeDirectory.js
 * @description Compact, high-density episode directory modeled after Asian streaming
 * platforms (AnimeVietSub, RoPhim). Displays a clean grid of compact episode chips
 * grouped by server with zero bloat and instant navigation.
 *
 * @param {Object} props
 * @param {string} props.movieSlug - Movie slug for navigation.
 * @param {Array<Object>} [props.servers=[]] - Episode servers list.
 * @param {string} [props.movieType='single'] - 'series' or 'single'.
 */
export default function EpisodeDirectory({
  movieSlug,
  servers = [],
  movieType = 'single'
}) {
  const [activeServerIndex, setActiveServerIndex] = useState(0);
  const [activeGroupIndex, setActiveGroupIndex] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');

  const currentServer = servers[activeServerIndex] || servers[0] || null;
  const rawEpisodes = currentServer?.server_data || [];
  const totalEpisodes = rawEpisodes.length;

  // Single movie check: If single movie with only 1 episode, render a clean compact single-source row
  const isSeries = movieType === 'series' || totalEpisodes > 1;

  // Filter episodes by search term
  const filteredEpisodes = useMemo(() => {
    if (!searchTerm.trim()) return rawEpisodes;
    const clean = searchTerm.trim().toLowerCase();
    return rawEpisodes.filter(
      (ep) =>
        ep.name?.toLowerCase().includes(clean) ||
        ep.slug?.toLowerCase().includes(clean)
    );
  }, [rawEpisodes, searchTerm]);

  const totalGroups = Math.ceil(filteredEpisodes.length / GROUP_SIZE);

  // Sliced episodes for current group
  const displayedEpisodes = useMemo(() => {
    if (searchTerm.trim()) return filteredEpisodes;
    const start = activeGroupIndex * GROUP_SIZE;
    return filteredEpisodes.slice(start, start + GROUP_SIZE);
  }, [filteredEpisodes, activeGroupIndex, searchTerm]);

  if (!isSeries && totalEpisodes <= 1) {
    const singleEp = rawEpisodes[0];
    const watchHref = singleEp?.slug
      ? `/movie/${movieSlug}/watch?ep=${encodeURIComponent(singleEp.slug)}&server=${activeServerIndex}`
      : `/movie/${movieSlug}/watch`;

    return (
      <section className={styles.container} aria-label="Nguồn phát phim">
        <div className={styles.singleSourceRow}>
          <div className={styles.singleSourceInfo}>
            <span className={styles.sourceLabel}>Nguồn phát:</span>
            <span className={styles.sourceName}>{currentServer?.server_name || 'Bản Full HD'}</span>
          </div>
          <Link href={watchHref} className={styles.btnWatchSingle}>
            <i className="fas fa-play me-1" />
            Xem Phim
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className={styles.container} aria-label="Danh sách tập phim">
      {/* Header bar */}
      <div className={styles.headerBar}>
        <div className={styles.headerTitleWrap}>
          <i className="fas fa-list text-danger me-2" />
          <h3 className={styles.headerTitle}>Danh Sách Tập</h3>
          <span className={styles.epCountBadge}>({totalEpisodes} tập)</span>
        </div>

        {/* Server selection buttons */}
        {servers.length > 1 && (
          <div className={styles.serverTabs}>
            {servers.map((srv, idx) => (
              <button
                key={srv.server_name || idx}
                type="button"
                className={`${styles.serverTab} ${activeServerIndex === idx ? styles.serverTabActive : ''}`}
                onClick={() => {
                  setActiveServerIndex(idx);
                  setActiveGroupIndex(0);
                  setSearchTerm('');
                }}
              >
                {srv.server_name || `Server ${idx + 1}`}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Filter toolbar if more than 50 episodes */}
      {totalEpisodes > 50 && (
        <div className={styles.filterBar}>
          {totalGroups > 1 && (
            <div className={styles.groupChips}>
              {Array.from({ length: totalGroups }).map((_, gIdx) => {
                const start = gIdx * GROUP_SIZE + 1;
                const end = Math.min((gIdx + 1) * GROUP_SIZE, filteredEpisodes.length);
                return (
                  <button
                    key={gIdx}
                    type="button"
                    className={`${styles.groupChip} ${activeGroupIndex === gIdx ? styles.groupChipActive : ''}`}
                    onClick={() => setActiveGroupIndex(gIdx)}
                  >
                    {start} - {end}
                  </button>
                );
              })}
            </div>
          )}

          <div className={styles.searchWrapper}>
            <i className="fas fa-search text-secondary" />
            <input
              type="text"
              className={styles.searchInput}
              placeholder="Nhập số tập..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      )}

      {/* Compact High-Density Episode Grid */}
      <div className={styles.chipsGrid}>
        {displayedEpisodes.map((ep, idx) => {
          const epSlug = ep.slug || `tap-${ep.name}`;
          const href = `/movie/${movieSlug}/watch?ep=${encodeURIComponent(epSlug)}&server=${activeServerIndex}`;
          const displayName = ep.name?.toLowerCase().startsWith('tập') ? ep.name : `Tập ${ep.name}`;

          return (
            <Link
              key={ep.slug || idx}
              href={href}
              className={styles.chip}
              title={`Xem ${displayName}`}
            >
              {displayName}
            </Link>
          );
        })}
      </div>

      {displayedEpisodes.length === 0 && (
        <div className={styles.emptyNotice}>
          Không tìm thấy tập phim phù hợp với từ khóa &ldquo;{searchTerm}&rdquo;
        </div>
      )}
    </section>
  );
}
