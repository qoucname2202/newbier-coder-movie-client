import React, { useState, useMemo, useEffect, useRef } from 'react';
import styles from './WatchSidebarPlaylist.module.css';

// 25 episodes per group: compact, lightweight, zero scroll lag
const GROUP_SIZE = 25;

/**
 * @file WatchSidebarPlaylist.js
 * @description Minimalist, high-performance Cinema Watch Page Side Playlist.
 * Features 25-episode dropdown chunking for zero lag, clean single-line controls,
 * and eliminates duplicate episode indicators and redundant icons.
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

  const activeBtnRef = useRef(null);

  // Group pagination index (calculated by 25 episodes/group)
  const [activeGroupIndex, setActiveGroupIndex] = useState(() =>
    Math.max(0, Math.floor(currentEpisodeIndex / GROUP_SIZE))
  );

  // Automatically sync dropdown group whenever current episode changes
  useEffect(() => {
    if (currentEpisodeIndex >= 0 && totalEpisodes > 0 && !searchTerm.trim()) {
      const targetGroup = Math.floor(currentEpisodeIndex / GROUP_SIZE);
      setActiveGroupIndex(targetGroup);
    }
  }, [currentEpisodeIndex, totalEpisodes, searchTerm]);

  // Filter episodes if searching
  const filteredEpisodes = useMemo(() => {
    if (!searchTerm.trim()) return episodes;
    const clean = searchTerm.trim().toLowerCase();
    return episodes.filter(
      (ep) =>
        ep.name?.toLowerCase().includes(clean) ||
        ep.slug?.toLowerCase().includes(clean)
    );
  }, [episodes, searchTerm]);

  const totalGroups = Math.ceil(episodes.length / GROUP_SIZE);
  const currentGroupOfActiveEp = Math.floor(currentEpisodeIndex / GROUP_SIZE);

  // Sliced episodes for current 25-item group
  const displayedEpisodes = useMemo(() => {
    if (searchTerm.trim()) {
      return filteredEpisodes.slice(0, 100);
    }
    const start = activeGroupIndex * GROUP_SIZE;
    return episodes.slice(start, start + GROUP_SIZE);
  }, [episodes, filteredEpisodes, activeGroupIndex, searchTerm]);

  // Auto-scroll active episode button into view
  useEffect(() => {
    if (activeBtnRef.current) {
      activeBtnRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'nearest'
      });
    }
  }, [currentEpisodeIndex, activeGroupIndex]);

  return (
    <aside className={styles.sidebarContainer} aria-label="Danh sách phát tập phim">
      {/* 1. Header: Clean title and total count */}
      <div className={styles.playlistHeader}>
        <h4 className={styles.playlistTitle}>Danh Sách</h4>
        <span className={styles.totalBadge}>{totalEpisodes} tập</span>
      </div>

      {/* 2. Server Selector (If more than 1 server) */}
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

      {/* 3. Controls: Clean Dropdown Group Jump + Search (No redundant icons) */}
      {(totalGroups > 1 || totalEpisodes > 12) && (
        <div className={styles.filterRow}>
          {totalGroups > 1 && !searchTerm.trim() ? (
            <div className={styles.groupSelectWrap}>
              <select
                className={styles.groupSelect}
                value={activeGroupIndex}
                onChange={(e) => setActiveGroupIndex(Number(e.target.value))}
                aria-label="Chọn khoảng tập"
              >
                {Array.from({ length: totalGroups }).map((_, gIdx) => {
                  const start = gIdx * GROUP_SIZE + 1;
                  const end = Math.min((gIdx + 1) * GROUP_SIZE, totalEpisodes);
                  const isCurrent = gIdx === currentGroupOfActiveEp;
                  return (
                    <option key={gIdx} value={gIdx}>
                      {start} - {end} {isCurrent ? '• (Đang xem)' : ''}
                    </option>
                  );
                })}
              </select>
            </div>
          ) : (
            <div style={{ flex: 1 }} />
          )}

          {totalEpisodes > 12 && (
            <div className={styles.searchWrapper}>
              <input
                type="text"
                className={styles.searchInput}
                placeholder="Tìm tập..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button
                  type="button"
                  className={styles.clearBtn}
                  onClick={() => setSearchTerm('')}
                  title="Xóa tìm kiếm"
                  aria-label="Xóa tìm kiếm"
                >
                  &times;
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* 4. Episode Grid (25 items per group = fast, zero lag, highlighted active episode) */}
      <div className={styles.scrollList}>
        <div className={styles.episodesGrid}>
          {displayedEpisodes.map((ep, localIdx) => {
            const actualIndex = searchTerm.trim()
              ? episodes.findIndex((item) => item.slug === ep.slug || item.name === ep.name)
              : activeGroupIndex * GROUP_SIZE + localIdx;

            const isPlaying = actualIndex === currentEpisodeIndex;
            const epLabel = ep.name?.toLowerCase().startsWith('tập')
              ? ep.name
              : `Tập ${ep.name || actualIndex + 1}`;

            return (
              <button
                key={ep.slug || actualIndex}
                ref={isPlaying ? activeBtnRef : null}
                type="button"
                className={`${styles.epButton} ${isPlaying ? styles.epButtonActive : ''}`}
                onClick={() => onSelectEpisode(actualIndex)}
                title={`Phát ${epLabel}`}
              >
                <span className={styles.epText}>{epLabel}</span>
              </button>
            );
          })}
        </div>

        {displayedEpisodes.length === 0 && (
          <div className={styles.noResults}>
            <p>Không tìm thấy tập &ldquo;{searchTerm}&rdquo;</p>
          </div>
        )}
      </div>
    </aside>
  );
}
