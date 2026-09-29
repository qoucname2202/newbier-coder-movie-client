import React, { useState } from 'react';
import ServerVersionSelector from '@/features/movie-detail/components/ServerVersionSelector/ServerVersionSelector';
import { WATCH_CONFIG } from '@/config/watchConfig';
import styles from './MoviePlayerSection.module.css';

/**
 * @file MoviePlayerSection.js
 * @description 16:9 Cinema streaming player with server selection tabs,
 * next/prev episode controls, and theater mode (lights off).
 *
 * @param {Object} props
 * @param {Object} props.movie - Normalized movie object.
 * @param {Array<Object>} [props.servers=[]] - Array of episode servers.
 * @param {number} [props.currentServerIndex=0] - Active server index.
 * @param {Function} props.onSelectServer - Callback when changing server.
 * @param {Object} [props.activeEpisode] - Active episode object with stream URLs.
 * @param {number} [props.currentEpisodeIndex=0] - Active episode index.
 * @param {Function} props.onSelectEpisode - Callback to change episode.
 */
export default function MoviePlayerSection({
  movie,
  servers = [],
  currentServerIndex = 0,
  onSelectServer,
  activeEpisode,
  currentEpisodeIndex = 0,
  onSelectEpisode,
  isPinned = false,
  onTogglePin
}) {
  const currentServer = servers[currentServerIndex] || null;
  const currentEpisodes = currentServer?.server_data || [];
  const totalEpisodes = currentEpisodes.length;

  // Prioritize self-hosted cinema player with pixel-perfect timeline and seek buttons
  const streamEmbedUrl = activeEpisode?.link_m3u8
    ? `/player.html?url=${encodeURIComponent(activeEpisode.link_m3u8)}&title=${encodeURIComponent(movie?.name || '')}&ep=${encodeURIComponent(activeEpisode?.name || '')}`
    : (activeEpisode?.link_embed || '');

  const handlePrevEpisode = () => {
    if (currentEpisodeIndex > 0) {
      onSelectEpisode(currentEpisodeIndex - 1);
    }
  };

  const handleNextEpisode = () => {
    if (currentEpisodeIndex < totalEpisodes - 1) {
      onSelectEpisode(currentEpisodeIndex + 1);
    }
  };

  const handlePinClick = () => {
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
          {/* Audio Version Switcher (Vietsub, Thuyết Minh with hover dropdown for multi-source) */}
          {/* <ServerVersionSelector
            servers={servers}
            currentServerIndex={currentServerIndex}
            onSelectServer={onSelectServer}
            label={WATCH_CONFIG.labels.versionLabel}
          /> */}

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
}
