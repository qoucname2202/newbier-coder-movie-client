import React, { useState, useMemo, useEffect, useRef } from 'react';
import ServerVersionSelector from '@/features/client/components/detail/components/ServerVersionSelector/ServerVersionSelector';
// ServerVersionSelector is still .js, cast for strict TS
const ServerVersionSelectorTyped = ServerVersionSelector as unknown as React.FC<Record<string, unknown>>;
import { WATCH_CONFIG } from '@/config/watchConfig';
import styles from './WatchSidebarPlaylist.module.css';

// Configurable episodes per group (default 24)
const GROUP_SIZE = WATCH_CONFIG.episodesPerGroup;

/** Episode entry */
export interface WatchEpisode {
  name?: string;
  slug?: string;
  link?: string;
  [key: string]: unknown;
}

/** Server entry */
export interface WatchServer {
  server_name?: string;
  server_data?: WatchEpisode[];
  [key: string]: unknown;
}

export interface WatchSidebarPlaylistProps {
  servers?: WatchServer[];
  currentServerIndex?: number;
  onSelectServer?: (index: number) => void;
  currentEpisodeIndex?: number;
  onSelectEpisode?: (index: number) => void;
  pinnedEpisodeIndex?: number;
}

const WatchSidebarPlaylist: React.FC<WatchSidebarPlaylistProps> = ({
  servers = [],
  currentServerIndex = 0,
  onSelectServer,
  currentEpisodeIndex = 0,
  onSelectEpisode,
  pinnedEpisodeIndex = -1
}) => {
  const currentServer: WatchServer | null = servers[currentServerIndex] || servers[0] || null;
  const episodes: WatchEpisode[] = currentServer?.server_data || [];
  const totalEpisodes = episodes.length;

  const activeBtnRef = useRef<HTMLButtonElement | null>(null);

  const [activeGroupIndex, setActiveGroupIndex] = useState<number>(() =>
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

  // Sliced episodes for current 25-item group
  const displayedEpisodes = useMemo((): WatchEpisode[] => {
    const start = activeGroupIndex * GROUP_SIZE;
    return episodes.slice(start, start + GROUP_SIZE);
  }, [episodes, activeGroupIndex]);

  const isFirstMountRef = useRef<boolean>(true);

  // Auto-scroll active episode button into view only on explicit user episode selection, never on initial mount/reload
  useEffect(() => {
    if (isFirstMountRef.current) {
      isFirstMountRef.current = false;
      return;
    }
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

      {/* 2. Audio Version Selector */}
      <ServerVersionSelectorTyped
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
                  onClick={() => onSelectEpisode && onSelectEpisode(actualIndex)}
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
};

export default WatchSidebarPlaylist;
