import React, { useState, useMemo } from 'react';
import styles from './EpisodeSelector.module.css';

const GROUP_SIZE = 50;

/**
 * @file EpisodeSelector.js
 * @description Smart episode list selector with search and pagination grouping (1-50, 51-100),
 * perfectly supporting series with hundreds of episodes without browser lag.
 *
 * @param {Object} props
 * @param {Array<Object>} [props.episodes=[]] - List of episodes for current server.
 * @param {number} [props.currentIndex=0] - Active episode index.
 * @param {Function} props.onSelectEpisode - Callback when user chooses an episode.
 */
export default function EpisodeSelector({
  episodes = [],
  currentIndex = 0,
  onSelectEpisode
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeGroupIndex, setActiveGroupIndex] = useState(0);

  const total = episodes.length;

  // Filter episodes if search term is provided
  const filteredEpisodes = useMemo(() => {
    if (!searchTerm.trim()) return episodes;
    const clean = searchTerm.trim().toLowerCase();
    return episodes.filter(
      (ep) =>
        ep.name?.toLowerCase().includes(clean) ||
        ep.slug?.toLowerCase().includes(clean)
    );
  }, [episodes, searchTerm]);

  // Total groups for pagination tabs
  const totalGroups = Math.ceil(filteredEpisodes.length / GROUP_SIZE);

  // Episodes for active group
  const currentGroupEpisodes = useMemo(() => {
    if (searchTerm.trim()) return filteredEpisodes;
    const start = activeGroupIndex * GROUP_SIZE;
    return filteredEpisodes.slice(start, start + GROUP_SIZE);
  }, [filteredEpisodes, activeGroupIndex, searchTerm]);

  if (!episodes || episodes.length === 0) return null;

  return (
    <div className={styles.episodeSelectorContainer}>
      {/* Header Bar */}
      <div className={styles.selectorHeader}>
        <div className={styles.titleArea}>
          <i className="fas fa-layer-group text-danger" />
          <h3 className={styles.selectorTitle}>Danh Sách Tập Phim</h3>
          <span className={styles.episodeCountBadge}>{total} tập</span>
        </div>

        {total > 15 && (
          <input
            type="text"
            className={styles.searchEpisodeInput}
            placeholder="Tìm số tập..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        )}
      </div>

      {/* Group Range Tabs (1-50, 51-100) if more than 50 episodes and not searching */}
      {totalGroups > 1 && !searchTerm.trim() && (
        <div className={styles.rangeTabs} role="tablist">
          {Array.from({ length: totalGroups }, (_, i) => {
            const start = i * GROUP_SIZE + 1;
            const end = Math.min((i + 1) * GROUP_SIZE, total);
            const isActive = i === activeGroupIndex;

            return (
              <button
                key={`range-${i}`}
                type="button"
                role="tab"
                aria-selected={isActive}
                className={`${styles.rangeBtn} ${isActive ? styles.rangeBtnActive : ''}`}
                onClick={() => setActiveGroupIndex(i)}
              >
                {start} - {end}
              </button>
            );
          })}
        </div>
      )}

      {/* Grid of Episode Buttons */}
      <div className={styles.episodeGrid}>
        {currentGroupEpisodes.map((ep, localIdx) => {
          // Calculate global index in original episodes array
          const globalIdx = searchTerm.trim()
            ? episodes.findIndex((item) => item.slug === ep.slug)
            : activeGroupIndex * GROUP_SIZE + localIdx;

          const isCurrent = globalIdx === currentIndex;

          return (
            <button
              key={ep.slug || ep._id || globalIdx}
              type="button"
              className={`${styles.epBtn} ${isCurrent ? styles.epBtnActive : ''}`}
              onClick={() => onSelectEpisode(globalIdx)}
              title={`Xem ${ep.name || `Tập ${globalIdx + 1}`}`}
            >
              <span className={styles.epLabel}>
                {ep.name ? (ep.name.startsWith('Tập') ? ep.name : `Tập ${ep.name}`) : `Tập ${globalIdx + 1}`}
              </span>
              {isCurrent && <span className={styles.epSub}>Đang phát</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}
