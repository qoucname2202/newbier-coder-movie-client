import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { LOCAL_DEFAULT_BACKDROP, LOCAL_DEFAULT_POSTER } from '@/config/movieConfig';
import { getWatchProgress } from '@/utils/watchProgress';
import styles from './MovieHeroHeader.module.css';

/**
 * @file MovieHeroHeader.js
 * @description Mature, high-density cinema header modeled after proven real-world
 * streaming platforms (e.g. AnimeVietSub, RoPhim, Bilutv).
 * Features a 2-column compact layout: 2:3 Poster with immediate action buttons on the left,
 * and comprehensive, structured movie facts + synopsis on the right.
 *
 * @param {Object} props
 * @param {Object} props.movie - Normalized movie detail object.
 * @param {Function} [props.onPlayTrailer] - Callback to open trailer modal.
 * @param {boolean} [props.isFavorite=false] - Favorite status.
 * @param {Function} [props.onToggleFavorite] - Toggle favorite callback.
 */
export default function MovieHeroHeader({
  movie,
  onPlayTrailer,
  isFavorite = false,
  onToggleFavorite
}) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [synopsisExpanded, setSynopsisExpanded] = useState(false);
  const [savedProgress, setSavedProgress] = useState(null);

  useEffect(() => {
    if (!movie?.slug) return;
    const progress = getWatchProgress(movie.slug);
    if (progress && progress.epSlug) {
      setSavedProgress(progress);
    }
  }, [movie?.slug]);

  if (!movie) return null;

  const handleShare = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Derive series vs single movie attributes
  const firstServer = movie.episodes?.[0]?.server_data || [];
  const totalEpisodesCount = firstServer.length;
  const isSeries = movie.type === 'series' || totalEpisodesCount > 1;

  const firstEp = firstServer[0];
  const firstEpSlug = firstEp?.slug || 'tap-1';

  const latestEp = firstServer[totalEpisodesCount - 1];
  const latestEpSlug = latestEp?.slug || firstEpSlug;
  const latestEpName = latestEp?.name || (totalEpisodesCount > 0 ? totalEpisodesCount : '1');

  // URL routes
  const watchFirstUrl = `/movie/${movie.slug}/watch?ep=${encodeURIComponent(firstEpSlug)}`;
  const watchLatestUrl = `/movie/${movie.slug}/watch?ep=${encodeURIComponent(latestEpSlug)}`;
  const watchResumeUrl = savedProgress?.epSlug
    ? `/movie/${movie.slug}/watch?ep=${encodeURIComponent(savedProgress.epSlug)}&server=${savedProgress.serverIndex || 0}`
    : watchFirstUrl;

  // Formatted metadata
  const categories = movie.category || [];
  const countries = movie.country || [];
  const ratingVal = movie.rating ? Number(movie.rating).toFixed(1) : '8.6';
  const directorDisplay = movie.directors?.length > 0
    ? movie.directors.map((d) => d.name).join(', ')
    : (movie.director || 'Đang cập nhật');
  const actorsDisplay = movie.actors?.length > 0
    ? movie.actors.slice(0, 5).map((a) => a.name).join(', ')
    : (movie.actor || 'Đang cập nhật');

  // Status badge display
  let statusText = 'Hoàn Thành';
  if (movie.status === 'ongoing') {
    statusText = `Đang Chiếu (Tập ${latestEpName})`;
  } else if (movie.status === 'upcoming') {
    statusText = 'Sắp Chiếu';
  } else if (isSeries && totalEpisodesCount > 0) {
    statusText = `Hoàn Thành (${totalEpisodesCount}/${totalEpisodesCount})`;
  }

  const synopsis = movie.content || 'Nội dung bộ phim đang được cập nhật.';
  const synopsisRef = useRef(null);
  const [hasOverflow, setHasOverflow] = useState(() => synopsis.length > 180);

  useEffect(() => {
    const el = synopsisRef.current;
    if (!el) return;

    const checkOverflow = () => {
      if (!synopsisExpanded && el) {
        // scrollHeight > clientHeight indicates the text is truly clamped
        setHasOverflow(el.scrollHeight > el.clientHeight + 4);
      }
    };

    const t = setTimeout(checkOverflow, 40);
    window.addEventListener('resize', checkOverflow);
    return () => {
      clearTimeout(t);
      window.removeEventListener('resize', checkOverflow);
    };
  }, [synopsis, synopsisExpanded]);

  return (
    <section className={styles.heroWrapper} aria-label="Thông tin chi tiết phim">
      {/* Subtle Atmospheric Backdrop Banner */}
      <div className={styles.backdropLayer}>
        <img
          src={movie.backdrop_url || movie.thumb_url || movie.poster_url || LOCAL_DEFAULT_BACKDROP}
          alt=""
          className={styles.backdropImg}
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = LOCAL_DEFAULT_BACKDROP;
          }}
        />
        <div className={styles.backdropGradient} />
      </div>

      {/* Main Content Container */}
      <div className={styles.mainContainer}>
        {/* Breadcrumb row */}
        <nav className={styles.breadcrumbNav} aria-label="Điều hướng">
          <Link href="/" className={styles.breadItem}>Trang Chủ</Link>
          <span className={styles.breadDivider}>/</span>
          <Link href={isSeries ? '/series' : '/movies'} className={styles.breadItem}>
            {isSeries ? 'Phim Bộ' : 'Phim Lẻ'}
          </Link>
          <span className={styles.breadDivider}>/</span>
          <span className={styles.breadActive}>{movie.name}</span>
        </nav>

        {/* 2-Column Showcase */}
        <div className={styles.showcaseGrid}>
          {/* Left Column: Poster + Primary Actions */}
          <div className={styles.leftCol}>
            <div className={styles.posterWrapper}>
              <img
                src={movie.poster_url || movie.thumb_url || LOCAL_DEFAULT_POSTER}
                alt={movie.name}
                className={styles.posterImg}
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = LOCAL_DEFAULT_POSTER;
                }}
              />
              <span className={styles.qualityBadge}>{movie.quality || 'Full HD'}</span>
              {ratingVal && (
                <span className={styles.ratingBadge}>
                  <i className="fas fa-star text-warning me-1" />
                  {ratingVal}
                </span>
              )}

              {/* Hover Play Overlay with Red Trailer Trigger Button like outer cards */}
              {onPlayTrailer && (
                <div className={styles.playOverlay}>
                  <button
                    type="button"
                    className={styles.playCircle}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onPlayTrailer(movie);
                    }}
                    aria-label={`Xem trailer ${movie?.name}`}
                    title="Xem trailer"
                  >
                    <svg
                      width="22"
                      height="22"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <polygon points="5 3 19 12 5 21 5 3" />
                    </svg>
                  </button>
                </div>
              )}
            </div>

            {/* Common Action Buttons directly under Poster */}
            <div className={styles.actionButtonGroup}>
              {isSeries ? (
                <>
                  {savedProgress && savedProgress.episodeIndex > 0 ? (
                    <>
                      <button
                        type="button"
                        className={styles.btnWatchPrimary}
                        onClick={() => router.push(watchResumeUrl)}
                        title={`Tiếp tục xem ${savedProgress.epName}`}
                      >
                        <i className="fas fa-play me-2" />
                        <span>Tiếp Tục ({savedProgress.epName?.toLowerCase().startsWith('tập') ? savedProgress.epName : `Tập ${savedProgress.epName}`})</span>
                      </button>

                      <button
                        type="button"
                        className={styles.btnWatchSecondary}
                        onClick={() => router.push(watchFirstUrl)}
                        title="Xem lại từ tập 1"
                      >
                        <i className="fas fa-redo me-2" />
                        <span>Xem Từ Đầu</span>
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        className={styles.btnWatchPrimary}
                        onClick={() => router.push(watchFirstUrl)}
                        title="Xem từ tập 1"
                      >
                        <i className="fas fa-play me-2" />
                        <span>Xem Từ Đầu</span>
                      </button>

                      {totalEpisodesCount > 1 && (
                        <button
                          type="button"
                          className={styles.btnWatchSecondary}
                          onClick={() => router.push(watchLatestUrl)}
                          title={`Xem tập ${latestEpName}`}
                        >
                          <i className="fas fa-forward me-2" />
                          <span>Tập Mới Nhất ({latestEpName})</span>
                        </button>
                      )}
                    </>
                  )}
                </>
              ) : (
                <button
                  type="button"
                  className={styles.btnWatchPrimary}
                  onClick={() => router.push(watchResumeUrl)}
                >
                  <i className="fas fa-play me-2" />
                  <span>{savedProgress ? 'Tiếp Tục Xem' : 'Xem Phim'}</span>
                </button>
              )}

              {/* Symmetrical 50/50 Dual Action Row: Theo dõi & Chia sẻ */}
              <div className={styles.dualActionRow}>
                <button
                  type="button"
                  className={`${styles.btnSecondaryAction} ${isFavorite ? styles.btnSecondaryActive : ''}`}
                  onClick={onToggleFavorite}
                  title={isFavorite ? 'Bỏ theo dõi' : 'Thêm vào yêu thích'}
                >
                  <i className={isFavorite ? 'fas fa-heart text-danger me-1' : 'far fa-heart me-1'} />
                  <span>{isFavorite ? 'Đã Lưu' : 'Theo Dõi'}</span>
                </button>

                <button
                  type="button"
                  className={styles.btnSecondaryAction}
                  onClick={handleShare}
                  title="Sao chép liên kết"
                >
                  <i className={copied ? 'fas fa-check text-success me-1' : 'fas fa-share-alt me-1'} />
                  <span>{copied ? 'Đã Chép' : 'Chia Sẻ'}</span>
                </button>
              </div>
            </div>

          </div>

          {/* Right Column: Structured Movie Facts & Synopsis */}
          <div className={styles.rightCol}>
            {/* Title Header */}
            <div className={styles.titleSection}>
              <h1 className={styles.mainTitle}>{movie.name}</h1>
              {movie.origin_name && (
                <h2 className={styles.originTitle}>{movie.origin_name}</h2>
              )}
            </div>

            {/* Quick Status Bar */}
            <div className={styles.quickStatusBar}>
              <span className={styles.statusPillHighlight}>{statusText}</span>
              <span className={styles.statusPill}>{movie.lang || 'VietSub'}</span>
              {movie.year && <span className={styles.statusPill}>{movie.year}</span>}
              {movie.time && <span className={styles.statusPill}>{movie.time}</span>}
            </div>

            {/* High-density Fact Sheet Table */}
            <div className={styles.factSheet}>
              <div className={styles.factRow}>
                <span className={styles.factLabel}>Định dạng:</span>
                <span className={styles.factValue}>{isSeries ? 'Phim Bộ' : 'Phim Lẻ'}</span>
              </div>

              <div className={styles.factRow}>
                <span className={styles.factLabel}>Trạng thái:</span>
                <span className={styles.factValue}>{statusText}</span>
              </div>

              {movie.time && (
                <div className={styles.factRow}>
                  <span className={styles.factLabel}>Thời lượng:</span>
                  <span className={styles.factValue}>{movie.time}</span>
                </div>
              )}

              {countries.length > 0 && (
                <div className={styles.factRow}>
                  <span className={styles.factLabel}>Quốc gia:</span>
                  <span className={styles.factValue}>
                    {countries.map((c, i) => (
                      <span key={c.slug || i}>
                        {i > 0 && ', '}
                        <Link href={`/search?country=${encodeURIComponent(c.slug || '')}`} className={styles.metaLink}>
                          {c.name}
                        </Link>
                      </span>
                    ))}
                  </span>
                </div>
              )}

              {categories.length > 0 && (
                <div className={styles.factRow}>
                  <span className={styles.factLabel}>Thể loại:</span>
                  <div className={styles.tagWrap}>
                    {categories.map((cat, i) => (
                      <Link
                        key={cat.slug || i}
                        href={`/search?category=${encodeURIComponent(cat.slug || '')}`}
                        className={styles.categoryTag}
                      >
                        {cat.name}
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              <div className={styles.factRow}>
                <span className={styles.factLabel}>Đạo diễn:</span>
                <span className={styles.factValue}>{directorDisplay}</span>
              </div>

              <div className={styles.factRow}>
                <span className={styles.factLabel}>Diễn viên:</span>
                <span className={styles.factValue}>{actorsDisplay}</span>
              </div>

              {movie.view !== undefined && (
                <div className={styles.factRow}>
                  <span className={styles.factLabel}>Lượt xem:</span>
                  <span className={styles.factValue}>{Number(movie.view || 0).toLocaleString('vi-VN')}</span>
                </div>
              )}
            </div>

            {/* Inline Synopsis Section */}
            <div className={styles.synopsisBox}>
              <h3 className={styles.synopsisHeader}>
                <i className="fas fa-file-alt text-danger me-2" />
                Nội dung phim
              </h3>
              <p
                ref={synopsisRef}
                className={`${styles.synopsisParagraph} ${!synopsisExpanded && hasOverflow ? styles.synopsisClamped : ''}`}
              >
                {synopsis}
              </p>
              {hasOverflow && (
                <button
                  type="button"
                  className={styles.btnToggleSynopsis}
                  onClick={() => setSynopsisExpanded((prev) => !prev)}
                  aria-expanded={synopsisExpanded}
                  title={synopsisExpanded ? 'Thu gọn nội dung' : 'Xem toàn bộ nội dung'}
                >
                  <i className={`fas ${synopsisExpanded ? 'fa-chevron-up' : 'fa-chevron-down'}`} />
                  <span>{synopsisExpanded ? 'Thu gọn nội dung' : 'Xem toàn bộ nội dung'}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
