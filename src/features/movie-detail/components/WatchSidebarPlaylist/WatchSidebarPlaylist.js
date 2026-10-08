import React, { useState, useMemo, useEffect, useRef } from 'react';
import ServerVersionSelector from '@/features/movie-detail/components/ServerVersionSelector/ServerVersionSelector';
import { WATCH_CONFIG } from '@/config/watchConfig';
import styles from './WatchSidebarPlaylist.module.css';

// Configurable episodes per group (default 24)
const GROUP_SIZE = WATCH_CONFIG.episodesPerGroup;

/**
 * @file WatchSidebarPlaylist.js
 * @description Cinema Watch Page Episode Playlist Section (positioned below player).
 * Features:
 * - Direct Vietsub vs Thuyết Minh vs Lồng Tiếng version switcher with clean iconography.
 * - Group chunking dropdown (1-25, 26-50...) for seamless navigation with no DOM bloat.
 * - No episode search input (as requested).
 * - Responsive grid layout with active episode auto-scroll.
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
  onSelectEpisode,
  pinnedEpisodeIndex = -1
}) {
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
    if (currentEpisodeIndex >= 0 && totalEpisodes > 0) {
      const targetGroup = Math.floor(currentEpisodeIndex / GROUP_SIZE);
      setActiveGroupIndex(targetGroup);
    }
  }, [currentEpisodeIndex, totalEpisodes]);

  const totalGroups = Math.ceil(episodes.length / GROUP_SIZE);
  const currentGroupOfActiveEp = Math.floor(currentEpisodeIndex / GROUP_SIZE);

  // Sliced episodes for current 25-item group
  const displayedEpisodes = useMemo(() => {
    const start = activeGroupIndex * GROUP_SIZE;
    return episodes.slice(start, start + GROUP_SIZE);
  }, [episodes, activeGroupIndex]);

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
    <section className={styles.playlistCard} id="watch-playlist-section" aria-label="Danh sách tập phim">
      {/* 1. Header: Title, Total Badge, Group Dropdown */}
      <div className={styles.headerRow}>
        <div className={styles.titleGroup}>
          <h3 className={styles.sectionTitle}>
            <i className={`fas fa-layer-group ${styles.titleIcon}`} />
            <span>{WATCH_CONFIG.labels.playlistTitle}</span>
          </h3>
          <span className={styles.totalBadge}>
            {totalEpisodes} {WATCH_CONFIG.labels.totalEpisodesSuffix}
          </span>
        </div>

        {/* Group Selector Dropdown (if more than 25 episodes) */}
        {totalGroups > 1 && (
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
                return (
                  <option key={gIdx} value={gIdx}>
                    Tập {start} - {end}
                  </option>
                );
              })}
            </select>
          </div>
        )}
      </div>

      {/* 2. Audio Version Selector (Vietsub vs Thuyết Minh with hover dropdown for multi-source) */}
      <ServerVersionSelector
        servers={servers}
        currentServerIndex={currentServerIndex}
        onSelectServer={onSelectServer}
      />

      {/* 3. Episodes Grid */}
      <div className={styles.scrollList}>
        {displayedEpisodes.length > 0 ? (
          <div className={styles.episodesGrid}>
            {displayedEpisodes.map((ep, localIdx) => {
              const actualIndex = activeGroupIndex * GROUP_SIZE + localIdx;
              const isPlaying = actualIndex === currentEpisodeIndex;
              const isPinned = actualIndex === pinnedEpisodeIndex;
              const epLabel = ep.name?.toLowerCase().startsWith('tập')
                ? ep.name
                : `Tập ${ep.name || actualIndex + 1}`;

              return (
                <button
                  key={ep.slug || actualIndex}
                  ref={isPlaying ? activeBtnRef : null}
                  type="button"
                  className={`${styles.epButton} ${isPlaying ? styles.epButtonActive : ''} ${isPinned ? styles.epButtonPinned : ''}`}
                  onClick={() => onSelectEpisode(actualIndex)}
                  title={`${epLabel}${isPinned ? ' (Đã ghim)' : ''}`}
                >
                  {isPlaying && (
                    <i className={`fas fa-play ${styles.epPlayIcon}`} />
                  )}
                  <span className={styles.epText}>{epLabel}</span>
                  {isPinned && (
                    <i className={`fas fa-thumbtack ${isPlaying ? styles.epPinIconWhite : styles.epPinIcon}`} title="Tập đã ghim" />
                  )}
                </button>
              );
            })}
          </div>
        ) : (
          <div className={styles.noEpisodesNotice}>
            Không có tập phim nào trong danh sách máy chủ này.
          </div>
        )}
      </div>
    </section>
  );
}
