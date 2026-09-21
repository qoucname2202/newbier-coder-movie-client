import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import styles from './EpisodeDirectory.module.css';

const GROUP_SIZE = 50;

/**
 * @file EpisodeDirectory.js
 * @description Cinema-grade Episode Directory for the Movie Detail page.
 * Renders an inviting, intuitive episode grid where clicking any episode
 * navigates directly to the dedicated Watch Page (/movie/[slug]/watch?ep=...).
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

  // Single movie (Phim Lẻ) presentation
  if (movieType === 'single' || totalEpisodes <= 1) {
    const singleEp = rawEpisodes[0];
    const watchHref = singleEp?.slug
      ? `/movie/${movieSlug}/watch?ep=${encodeURIComponent(singleEp.slug)}&server=${activeServerIndex}`
      : `/movie/${movieSlug}/watch`;

    return (
      <section className={styles.directoryContainer} aria-label="Danh sách tập phim">
        <div className={styles.sectionHeader}>
          <div className={styles.headerTitleGroup}>
            <div className={styles.iconCircle}>
              <i className="fas fa-play-circle text-danger" />
            </div>
            <div>
              <h3 className={styles.sectionTitle}>Tập Phim</h3>
              <p className={styles.sectionSubtitle}>Phim lẻ bản chuẩn Full HD có phụ đề & lồng tiếng</p>
            </div>
          </div>
          <span className={styles.totalBadge}>Bản Đầy Đủ</span>
        </div>

        <div className={styles.singleMovieCard}>
          <div className={styles.singleMovieInfo}>
            <span className={styles.singleBadge}>Full Movie</span>
            <h4 className={styles.singleTitle}>Bản Chiếu Rạp Chính Thức</h4>
            <p className={styles.singleDesc}>
              Thưởng thức trọn vẹn tác phẩm điện ảnh với chất lượng hình ảnh và âm thanh sắc nét nhất.
            </p>
          </div>
          <Link href={watchHref} className={styles.btnWatchSingle}>
            <i className="fas fa-play me-2" />
            Bắt đầu xem phim
          </Link>
        </div>
      </section>
    );
  }

  // TV Series (Phim Bộ) presentation
  return (
    <section className={styles.directoryContainer} aria-label="Danh sách tập phim">
      {/* Top Header */}
      <div className={styles.sectionHeader}>
        <div className={styles.headerTitleGroup}>
          <div className={styles.iconCircle}>
            <i className="fas fa-layer-group text-danger" />
          </div>
          <div>
            <h3 className={styles.sectionTitle}>Danh Sách Tập Phim</h3>
            <p className={styles.sectionSubtitle}>Chọn tập phim bất kỳ để bắt đầu thưởng thức</p>
          </div>
        </div>
        <span className={styles.totalBadge}>{totalEpisodes} Tập</span>
      </div>

      {/* Server Selection Tabs */}
      {servers.length > 1 && (
        <div className={styles.serverRow}>
          <span className={styles.serverLabel}>
            <i className="fas fa-server me-1 text-danger" /> Nguồn phát:
          </span>
          <div className={styles.serverList}>
            {servers.map((srv, idx) => (
              <button
                key={srv.server_name || idx}
                type="button"
                className={`${styles.serverBtn} ${activeServerIndex === idx ? styles.serverBtnActive : ''}`}
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
        </div>
      )}

      {/* Grouping & Search Bar (For 50+ episodes) */}
      {totalEpisodes > GROUP_SIZE && (
        <div className={styles.filterToolbar}>
          {totalGroups > 1 && (
            <div className={styles.groupTabs}>
              {Array.from({ length: totalGroups }).map((_, gIdx) => {
                const start = gIdx * GROUP_SIZE + 1;
                const end = Math.min((gIdx + 1) * GROUP_SIZE, filteredEpisodes.length);
                return (
                  <button
                    key={gIdx}
                    type="button"
                    className={`${styles.groupTabBtn} ${activeGroupIndex === gIdx ? styles.groupTabBtnActive : ''}`}
                    onClick={() => setActiveGroupIndex(gIdx)}
                  >
                    Tập {start} - {end}
                  </button>
                );
              })}
            </div>
          )}

          <div className={styles.searchBox}>
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
                className={styles.clearSearchBtn}
                onClick={() => setSearchTerm('')}
              >
                <i className="fas fa-times" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Episode Grid */}
      <div className={styles.episodeGrid}>
        {displayedEpisodes.map((ep, idx) => {
          const epSlug = ep.slug || `tap-${ep.name}`;
          const href = `/movie/${movieSlug}/watch?ep=${encodeURIComponent(epSlug)}&server=${activeServerIndex}`;

          return (
            <Link
              key={ep.slug || idx}
              href={href}
              className={styles.episodeCard}
              title={`Xem ${ep.name?.toLowerCase().startsWith('tập') ? ep.name : `Tập ${ep.name}`}`}
            >
              <div className={styles.epCardInner}>
                <span className={styles.epPlayIcon}>
                  <i className="fas fa-play" />
                </span>
                <span className={styles.epNumber}>
                  {ep.name?.toLowerCase().startsWith('tập') ? ep.name : `Tập ${ep.name}`}
                </span>
              </div>
            </Link>
          );
        })}
      </div>

      {displayedEpisodes.length === 0 && (
        <div className={styles.emptyResults}>
          <i className="fas fa-search-minus mb-2" />
          <p>Không tìm thấy tập phim phù hợp với từ khóa &ldquo;{searchTerm}&rdquo;</p>
        </div>
      )}
    </section>
  );
}
