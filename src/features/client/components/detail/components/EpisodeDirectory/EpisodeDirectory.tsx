import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { getWatchProgress } from '@/utils/watchProgress';
import type { WatchServer, WatchEpisode } from '@/features/client/components/detail/components/WatchSidebarPlaylist/WatchSidebarPlaylist';
import styles from './EpisodeDirectory.module.css';

/**
 * @file EpisodeDirectory.tsx
 * @description High-density cinema episode directory for single movies and television series.
 * Features broadcast progress tracker bar, resume watching banner, multi-server tabs,
 * range pagination, instant episode search, ascending/descending order sorting,
 * and status indicators (New, Watching, Completed).
 */

const GROUP_SIZE = 25;

export interface EpisodeDirectoryProps {
  movieSlug?: string;
  servers?: WatchServer[];
  movieType?: 'series' | 'single' | string;
  totalEpisodesExpected?: number;
}

/** Watch progress payload structure */
interface WatchProgressPayload {
  epSlug?: string;
  serverIndex?: number;
  episodeIndex?: number;
  epName?: string;
}

export const EpisodeDirectory: React.FC<EpisodeDirectoryProps> = ({
  movieSlug,
  servers = [],
  movieType = 'single',
  totalEpisodesExpected
}) => {
  const [activeServerIndex, setActiveServerIndex] = useState<number>(0);
  const [activeGroupIndex, setActiveGroupIndex] = useState<number>(0);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isDescOrder, setIsDescOrder] = useState<boolean>(false);
  const [savedProgress, setSavedProgress] = useState<WatchProgressPayload | null>(null);

  const currentServer: WatchServer | null = servers[activeServerIndex] || servers[0] || null;
  const rawEpisodes: WatchEpisode[] = currentServer?.server_data || [];
  const totalEpisodes = rawEpisodes.length;

  // Read saved watch progress from localStorage
  useEffect(() => {
    if (!movieSlug) return;
    const progress = getWatchProgress(movieSlug) as WatchProgressPayload | null;
    if (progress) {
      setSavedProgress(progress);
      if (typeof progress.serverIndex === 'number' && progress.serverIndex < servers.length) {
        setActiveServerIndex(progress.serverIndex);
      }
      if (typeof progress.episodeIndex === 'number' && progress.episodeIndex >= 0) {
        setActiveGroupIndex(Math.floor(progress.episodeIndex / GROUP_SIZE));
      }
    }
  }, [movieSlug, servers.length]);

  const isSeries = movieType === 'series' || totalEpisodes > 1;

  // Single movie view: Display VIP server sources and one-click play
  if (!isSeries && totalEpisodes <= 1) {
    const singleEp = rawEpisodes[0];
    const watchHref = singleEp?.slug
      ? `/movie/${movieSlug}/watch?ep=${encodeURIComponent(singleEp.slug)}&server=${activeServerIndex}`
      : `/movie/${movieSlug}/watch`;

    return (
      <section className={styles.container} aria-label="Nguồn phát phim lẻ">
        <div className={styles.headerBar}>
          <div className={styles.headerTitleWrap}>
            <i className="fas fa-play-circle text-danger me-2" />
            <h3 className={styles.headerTitle}>Nguồn Phát Phim</h3>
            <span className={styles.singleQualityBadge}>Bản Đẹp Full HD 1080p</span>
          </div>

          {servers.length > 1 && (
            <div className={styles.serverTabs}>
              {servers.map((srv, idx) => (
                <button
                  key={srv.server_name || String(idx)}
                  type="button"
                  className={`${styles.serverTab} ${activeServerIndex === idx ? styles.serverTabActive : ''}`}
                  onClick={() => setActiveServerIndex(idx)}
                >
                  <i className="fas fa-server me-1" />
                  {srv.server_name || `Server ${idx + 1}`}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className={styles.singleSourceCard}>
          <div className={styles.singleSourceLeft}>
            <div className={styles.sourceIconBox}>
              <i className="fas fa-film text-danger" />
            </div>
            <div className={styles.sourceDetails}>
              <h4 className={styles.sourceMainName}>
                {currentServer?.server_name || 'Server VIP #1 (Tốc độ cao)'}
              </h4>
              <div className={styles.sourceFeatures}>
                <span className={styles.featurePill}>
                  <i className="fas fa-bolt text-warning me-1" />
                  Siêu tốc không giật lag
                </span>
                <span className={styles.featurePill}>
                  <i className="fas fa-volume-up text-info me-1" />
                  Âm thanh vòm Dolby
                </span>
                <span className={styles.featurePill}>
                  <i className="fas fa-shield-alt text-success me-1" />
                  Bản quyền chuẩn
                </span>
              </div>
            </div>
          </div>

          <Link href={watchHref} className={styles.btnWatchSingle}>
            <i className="fas fa-play me-2" />
            <span>XEM PHIM NGAY</span>
          </Link>
        </div>
      </section>
    );
  }

  // Series Movie View: Episodes grid with process bar, server switcher, and toolbar
  // 1. Sort and filter
  const sortedEpisodes = [...rawEpisodes].sort((a, b) => {
    const numA = parseInt(String(a.name || '').replace(/\D/g, ''), 10) || 0;
    const numB = parseInt(String(b.name || '').replace(/\D/g, ''), 10) || 0;
    return isDescOrder ? numB - numA : numA - numB;
  });

  const filteredEpisodes = searchTerm.trim()
    ? sortedEpisodes.filter((ep) => {
        const clean = searchTerm.trim().toLowerCase();
        return (
          ep.name?.toLowerCase().includes(clean) ||
          ep.slug?.toLowerCase().includes(clean)
        );
      })
    : sortedEpisodes;

  const totalGroups = Math.ceil(filteredEpisodes.length / GROUP_SIZE);

  const displayedEpisodes = searchTerm.trim()
    ? filteredEpisodes.slice(0, 100)
    : filteredEpisodes.slice(activeGroupIndex * GROUP_SIZE, (activeGroupIndex + 1) * GROUP_SIZE);

  // Calculate episode broadcast progress
  const maxExpected = totalEpisodesExpected || (totalEpisodes > 0 ? totalEpisodes : 16);
  const progressPercent = Math.min(100, Math.round((totalEpisodes / maxExpected) * 100));

  const resumeHref = savedProgress?.epSlug
    ? `/movie/${movieSlug}/watch?ep=${encodeURIComponent(savedProgress.epSlug)}&server=${savedProgress.serverIndex || 0}`
    : `/movie/${movieSlug}/watch`;

  return (
    <section className={styles.container} aria-label="Danh sách tập phim bộ">
      {/* 1. Header Bar with Episode Process Bar */}
      <div className={styles.headerBar}>
        <div className={styles.headerTitleWrap}>
          <i className="fas fa-list-ol text-danger me-2" />
          <h3 className={styles.headerTitle}>Danh Sách Tập Phim</h3>
          <span className={styles.epCountBadge}>
            Đã chiếu {totalEpisodes} tập
          </span>
        </div>

        {/* Server Selection Tabs */}
        {servers.length > 1 && (
          <div className={styles.serverTabs}>
            {servers.map((srv, idx) => (
              <button
                key={srv.server_name || String(idx)}
                type="button"
                className={`${styles.serverTab} ${activeServerIndex === idx ? styles.serverTabActive : ''}`}
                onClick={() => {
                  setActiveServerIndex(idx);
                  setActiveGroupIndex(0);
                  setSearchTerm('');
                }}
              >
                <i className="fas fa-server me-1" />
                {srv.server_name || `Server ${idx + 1}`}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 2. Process / Progress Bar */}
      <div className={styles.processContainer}>
        <div className={styles.processMetaRow}>
          <div className={styles.processLabelGroup}>
            <span className={styles.processStatusPill}>
              {progressPercent >= 100 ? 'Đã hoàn tất trọn bộ' : 'Tiến độ phát sóng'}
            </span>
            <span className={styles.processEpisodeCount}>
              Đã phát sóng: <strong>{totalEpisodes}</strong> / {maxExpected} tập ({progressPercent}%)
            </span>
          </div>
          <span className={styles.processBroadcastSchedule}>
            <i className="fas fa-calendar-check text-warning me-1" />
            Cập nhật tối Thứ 6 & Thứ 7
          </span>
        </div>
        <div className={styles.progressBarTrack}>
          <div
            className={styles.progressBarFill}
            style={{ width: `${progressPercent}%` }}
            role="progressbar"
            aria-valuenow={progressPercent}
            aria-valuemin={0}
            aria-valuemax={100}
          />
        </div>
      </div>

      {/* 3. Resume Watching Banner */}
      {savedProgress && savedProgress.epName && (
        <div className={styles.resumeBanner}>
          <div className={styles.resumeInfo}>
            <div className={styles.resumeIconWrap}>
              <i className="fas fa-history text-warning" />
            </div>
            <div className={styles.resumeTextWrap}>
              <span className={styles.resumeLabel}>Bạn đang xem dở:</span>
              <span className={styles.resumeEpHighlight}>
                {savedProgress.epName.toLowerCase().startsWith('tập')
                  ? savedProgress.epName
                  : `Tập ${savedProgress.epName}`}
              </span>
            </div>
          </div>

          <Link href={resumeHref} className={styles.btnResumePlay}>
            <i className="fas fa-play me-2" />
            <span>Tiếp tục xem ngay</span>
          </Link>
        </div>
      )}

      {/* 4. Toolbar: Range selection tabs, Sort order toggle, Instant search */}
      <div className={styles.filterToolbar}>
        {/* Group Range Selection */}
        {totalGroups > 1 && !searchTerm.trim() && (
          <div className={styles.groupTabsScroll}>
            {Array.from({ length: totalGroups }).map((_, gIdx) => {
              const start = gIdx * GROUP_SIZE + 1;
              const end = Math.min((gIdx + 1) * GROUP_SIZE, filteredEpisodes.length);
              const isCurrentSavedGroup =
                savedProgress &&
                typeof savedProgress.episodeIndex === 'number' &&
                Math.floor(savedProgress.episodeIndex / GROUP_SIZE) === gIdx;

              return (
                <button
                  key={`grp-btn-${gIdx}`}
                  type="button"
                  className={`${styles.groupTabBtn} ${activeGroupIndex === gIdx ? styles.groupTabBtnActive : ''}`}
                  onClick={() => setActiveGroupIndex(gIdx)}
                >
                  <span>{start} - {end}</span>
                  {isCurrentSavedGroup && <span className={styles.dotIndicator} title="Đang xem dở" />}
                </button>
              );
            })}
          </div>
        )}

        <div className={styles.controlsRight}>
          {/* Order Sort Toggle */}
          <button
            type="button"
            className={styles.btnSortOrder}
            onClick={() => setIsDescOrder((prev) => !prev)}
            title={isDescOrder ? 'Đang sắp xếp: Tập Mới Nhất Trước' : 'Đang sắp xếp: Tập 1 Trước'}
          >
            <i className={`fas ${isDescOrder ? 'fa-sort-numeric-down-alt' : 'fa-sort-numeric-down'} me-1`} />
            <span>{isDescOrder ? 'Mới nhất' : 'Từ tập 1'}</span>
          </button>

          {/* Instant Episode Search Input */}
          <div className={styles.searchWrapper}>
            <i className={`fas fa-search ${styles.searchIcon}`} />
            <input
              type="text"
              className={styles.searchInput}
              placeholder="Tìm số tập..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              aria-label="Tìm kiếm số tập"
            />
            {searchTerm && (
              <button
                type="button"
                className={styles.btnClearSearch}
                onClick={() => setSearchTerm('')}
                title="Xóa tìm kiếm"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 5. Episode Chips Grid */}
      <div className={styles.chipsGrid}>
        {displayedEpisodes.map((ep, idx) => {
          const epSlug = ep.slug || `tap-${ep.name}`;
          const href = `/movie/${movieSlug}/watch?ep=${encodeURIComponent(epSlug)}&server=${activeServerIndex}`;
          const displayName = ep.name?.toLowerCase().startsWith('tập') ? ep.name : `Tập ${ep.name}`;
          const isResumeEp = savedProgress && (savedProgress.epSlug === ep.slug || savedProgress.epName === ep.name);
          const isLatestEp = !isDescOrder && idx === displayedEpisodes.length - 1 && activeGroupIndex === totalGroups - 1;

          return (
            <Link
              key={ep.slug || String(idx)}
              href={href}
              className={`${styles.chip} ${isResumeEp ? styles.chipResume : ''}`}
              title={isResumeEp ? `Tiếp tục xem ${displayName}` : `Xem ${displayName}`}
            >
              <span className={styles.chipName}>{displayName}</span>
              {isResumeEp && (
                <span className={styles.watchingBadge}>ĐANG XEM</span>
              )}
              {isLatestEp && !isResumeEp && (
                <span className={styles.newBadge}>MỚI</span>
              )}
            </Link>
          );
        })}
      </div>

      {displayedEpisodes.length === 0 && (
        <div className={styles.emptyNotice}>
          <i className="fas fa-search text-secondary me-2" />
          Không tìm thấy tập phim nào khớp với từ khóa &ldquo;{searchTerm}&rdquo;
        </div>
      )}
    </section>
  );
};

export default EpisodeDirectory;
