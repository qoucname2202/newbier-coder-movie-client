import React, { useState, useMemo } from 'react';
import styles from './WatchSidebarPlaylist.module.css';

/**
 * @file WatchSidebarPlaylist.js
 * @description Dedicated side-deck episode playlist for the Cinema Watch Page.
 * Sits next to or beneath the video player, allowing seamless in-page episode
 * and server switching with playing indicator and smooth scrolling.
 *
 * @param {Object} props
 * @param {Array<Object>} [props.servers=[]] - Array of episode servers.
 * @param {number} [props.currentServerIndex=0] - Active server index.
 * @param {Function} props.onSelectServer - Callback to switch server.
 * @param {number} [props.currentEpisodeIndex=0] - Active episode index.
 * @param {Function} props.onSelectEpisode - Callback to switch episode.
 */
export default function WatchSidebarPlaylist({
  servers = [],
  currentServerIndex = 0,
  onSelectServer,
  currentEpisodeIndex = 0,
  onSelectEpisode
}) {
  const [searchTerm, setSearchTerm] = useState('');

  const currentServer = servers[currentServerIndex] || servers[0] || null;
  const episodes = currentServer?.server_data || [];
  const totalEpisodes = episodes.length;

  // Filter episodes by query
  const filteredEpisodes = useMemo(() => {
    if (!searchTerm.trim()) return episodes;
    const clean = searchTerm.trim().toLowerCase();
    return episodes.filter(
      (ep) =>
        ep.name?.toLowerCase().includes(clean) ||
        ep.slug?.toLowerCase().includes(clean)
    );
  }, [episodes, searchTerm]);

  const activeEpisode = episodes[currentEpisodeIndex] || null;
  const activeEpName = activeEpisode?.name
    ? (activeEpisode.name.toLowerCase().startsWith('tập') ? activeEpisode.name : `Tập ${activeEpisode.name}`)
    : 'Tập 1';

  return (
    <aside className={styles.sidebarContainer} aria-label="Danh sách phát tập phim">
      {/* Top Header */}
      <div className={styles.playlistHeader}>
        <div className={styles.headerInfo}>
          <div className={styles.iconCircle}>
            <i className="fas fa-list-ul text-danger" />
          </div>
          <div>
            <h4 className={styles.playlistTitle}>Danh Sách Tập</h4>
            <span className={styles.activeEpBadge}>
              <span className={styles.livePulseDot} />
              Đang phát: {activeEpName}
            </span>
          </div>
        </div>
        <span className={styles.totalBadge}>{totalEpisodes} Tập</span>
      </div>

      {/* Server Selector Tabs */}
      {servers.length > 1 && (
        <div className={styles.serverRow}>
          <span className={styles.serverLabel}>Nguồn:</span>
          <div className={styles.serverChips}>
            {servers.map((srv, idx) => (
              <button
                key={srv.server_name || idx}
                type="button"
                className={`${styles.serverChip} ${currentServerIndex === idx ? styles.serverChipActive : ''}`}
                onClick={() => onSelectServer(idx)}
              >
                {srv.server_name || `Server ${idx + 1}`}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Search Input (For series with 20+ episodes) */}
      {totalEpisodes > 20 && (
        <div className={styles.searchWrapper}>
          <i className="fas fa-search text-secondary" />
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Tìm tập nhanh..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button
              type="button"
              className={styles.clearBtn}
              onClick={() => setSearchTerm('')}
            >
              <i className="fas fa-times" />
            </button>
          )}
        </div>
      )}

      {/* Episode Scrollable Grid/List */}
      <div className={styles.scrollList}>
        <div className={styles.episodesGrid}>
          {filteredEpisodes.map((ep, idx) => {
            // Match original index
            const originalIndex = episodes.indexOf(ep);
            const isPlaying = originalIndex === currentEpisodeIndex;
            const epLabel = ep.name?.toLowerCase().startsWith('tập') ? ep.name : `Tập ${ep.name}`;

            return (
              <button
                key={ep.slug || idx}
                type="button"
                className={`${styles.epButton} ${isPlaying ? styles.epButtonActive : ''}`}
                onClick={() => onSelectEpisode(originalIndex)}
                title={`Phát ${epLabel}`}
              >
                {isPlaying ? (
                  <span className={styles.playingBars}>
                    <span className={styles.bar} />
                    <span className={styles.bar} />
                    <span className={styles.bar} />
                  </span>
                ) : (
                  <i className={`fas fa-play ${styles.epPlayIcon}`} aria-hidden="true" />
                )}
                <span className={styles.epText}>{epLabel}</span>
              </button>
            );
          })}
        </div>

        {filteredEpisodes.length === 0 && (
          <div className={styles.noResults}>
            <p>Không tìm thấy tập &ldquo;{searchTerm}&rdquo;</p>
          </div>
        )}
      </div>
    </aside>
  );
}
