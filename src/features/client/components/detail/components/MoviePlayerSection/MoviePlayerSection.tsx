import React from 'react';// ServerVersionSelector is still .js, cast for strict TS
import ServerVersionSelectorRaw from '@/features/client/components/detail/components/ServerVersionSelector/ServerVersionSelector';
const ServerVersionSelector = ServerVersionSelectorRaw as unknown as React.FC<Record<string, unknown>>;
import { WATCH_CONFIG } from '@/config/watchConfig';
import type { WatchServer, WatchEpisode } from '@/features/client/components/detail/components/WatchSidebarPlaylist/WatchSidebarPlaylist';
import styles from './MoviePlayerSection.module.css';

/**
 * @file MoviePlayerSection.tsx
 * @description 16:9 Cinema streaming player with server selection tabs,
 * next/prev episode controls, and theater mode (lights off).
 */

interface MovieLite {
  name?: string;
}

export interface ActiveEpisode {
  name?: string;
  link_m3u8?: string;
  link_embed?: string;
  /** camelCase variants — the movie-detail API returns the embed URL as
   * `linkEmbed`/`linkM3u8`. `useMovieDetail.normalizeEpisodes` already
   * aliases these to snake_case, but the player reads them defensively so
   * an episode passed in from any other path still plays. */
  linkM3u8?: string;
  linkEmbed?: string;
  /** Some payloads nest the links under a `link` object. */
  link?: { embed?: string; m3u8?: string } | string;
}

export interface MoviePlayerSectionProps {
  movie?: MovieLite | null;
  servers?: WatchServer[];
  currentServerIndex?: number;
  onSelectServer?: (index: number) => void;
  activeEpisode?: ActiveEpisode | null;
  currentEpisodeIndex?: number;
  onSelectEpisode?: (index: number) => void;
  isPinned?: boolean;
  onTogglePin?: () => void;
}

const MoviePlayerSection: React.FC<MoviePlayerSectionProps> = ({
  movie,
  servers = [],
  currentServerIndex = 0,
  onSelectServer,
  activeEpisode,
  currentEpisodeIndex = 0,
  onSelectEpisode,
  isPinned = false,
  onTogglePin
}) => {
  const currentServer: WatchServer | null = servers[currentServerIndex] || null;
  const currentEpisodes: WatchEpisode[] = currentServer?.server_data || [];
  const totalEpisodes = currentEpisodes.length;

  // Resolve the episode's stream URL, accepting every shape the API has
  // used: snake_case (`link_embed`), camelCase (`linkEmbed`), and the
  // legacy nested `link: { embed }` object.
  const embedLink: string =
    activeEpisode?.link_embed ||
    activeEpisode?.linkEmbed ||
    (typeof activeEpisode?.link === 'object' ? activeEpisode.link.embed || '' : activeEpisode?.link || '') ||
    '';
  const m3u8Link: string =
    activeEpisode?.link_m3u8 ||
    activeEpisode?.linkM3u8 ||
    (typeof activeEpisode?.link === 'object' ? activeEpisode.link.m3u8 || '' : '') ||
    '';

  // Prioritize self-hosted cinema player with pixel-perfect timeline
  const streamEmbedUrl: string = m3u8Link
    ? `/player.html?url=${encodeURIComponent(m3u8Link)}&title=${encodeURIComponent(movie?.name || '')}&ep=${encodeURIComponent(activeEpisode?.name || '')}`
    : embedLink;

  const handlePrevEpisode = (): void => {
    if (currentEpisodeIndex > 0 && onSelectEpisode) {
      onSelectEpisode(currentEpisodeIndex - 1);
    }
  };

  const handleNextEpisode = (): void => {
    if (currentEpisodeIndex < totalEpisodes - 1 && onSelectEpisode) {
      onSelectEpisode(currentEpisodeIndex + 1);
    }
  };

  const handlePinClick = (): void => {
    if (onTogglePin) {
      onTogglePin();
    }
    const el = document.getElementById('watch-playlist-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  };

  return (
    <section className={styles.playerSection} id="movie-streaming-player" aria-label="Trình phát video">
      <div className={styles.playerWrapper}>
        {/* 16:9 Video Stage */}
        <div className={styles.videoStage}>
          {streamEmbedUrl ? (
            <iframe
              src={streamEmbedUrl}
              title={`Phát ${movie?.name} - ${activeEpisode?.name || 'Tập 1'}`}
              className={styles.iframePlayer}
              allowFullScreen
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            />
          ) : (
            <div className={styles.emptyStreamFallback}>
              <i className={`fas fa-circle-exclamation ${styles.emptyIcon}`} />
              <h4>Tập phim đang được cập nhật luồng phát</h4>
              <p>Vui lòng thử chuyển sang Server khác hoặc xem Trailer trong lúc chờ đợi.</p>
            </div>
          )}
        </div>

        {/* Player Bottom Control Bar */}
        <div className={styles.playerControlBar}>
          <ServerVersionSelector
            servers={servers}
            currentServerIndex={currentServerIndex}
            onSelectServer={onSelectServer}
            label={WATCH_CONFIG.labels.versionLabel}
          />

          {/* Episode Nav & Ghim tập Actions */}
          <div className={styles.playbackActions}>
            {totalEpisodes > 1 && (
              <>
                <button
                  type="button"
                  className={styles.actionBtn}
                  onClick={handlePrevEpisode}
                  disabled={currentEpisodeIndex <= 0}
                  title={WATCH_CONFIG.labels.prevEpisode}
                >
                  <i className="fas fa-step-backward" />
                  <span>{WATCH_CONFIG.labels.prevEpisode}</span>
                </button>

                <button
                  type="button"
                  className={styles.actionBtn}
                  onClick={handleNextEpisode}
                  disabled={currentEpisodeIndex >= totalEpisodes - 1}
                  title={WATCH_CONFIG.labels.nextEpisode}
                >
                  <span>{WATCH_CONFIG.labels.nextEpisode}</span>
                  <i className="fas fa-step-forward" />
                </button>
              </>
            )}

            <button
              type="button"
              className={`${styles.actionBtn} ${isPinned ? styles.actionBtnPinned : ''}`}
              onClick={handlePinClick}
              title={isPinned ? WATCH_CONFIG.labels.pinnedEpisodeTitle : WATCH_CONFIG.labels.pinEpisodeTitle}
            >
              <i className={`fas fa-thumbtack ${isPinned ? 'text-danger' : ''}`} />
              <span>{isPinned ? WATCH_CONFIG.labels.pinnedEpisodeText : WATCH_CONFIG.labels.pinEpisodeText}</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default MoviePlayerSection;
