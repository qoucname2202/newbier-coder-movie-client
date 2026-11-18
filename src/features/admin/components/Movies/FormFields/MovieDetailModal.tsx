// src/components/Admin/Movies/MovieDetailModal.tsx
'use client';

import React, { useState} from 'react';
import { useRouter } from 'next/router';
import {
  FaTimes,
  FaFilm,
  FaInfoCircle,
  FaAlignLeft,
  FaCode,
  FaStream,
  FaStar,
  FaCopy,
  FaExternalLinkAlt,
  FaPen,
  FaEye,
  FaClock,
  FaGlobe,
  FaCalendarAlt,
  FaCheckCircle,
  FaBan,
  FaPlay,
  FaServer,
  FaTags,
  FaUserTie,
  FaUsers
} from 'react-icons/fa';
import styles from '@/styles/MovieDetailModal.module.css';
import { showCinemaAlert } from '@/features/shared/components/UI/CinemaAlert';

interface MovieDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  movie: any | null;
  onOpenEpisodeManager?: (movie: any) => void;
}

export default function MovieDetailModal({
  isOpen,
  onClose,
  movie,
  onOpenEpisodeManager
}: MovieDetailModalProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'info' | 'content' | 'technical' | 'episodes' | 'ratings'>('info');

  if (!isOpen || !movie) return null;

  const displayMovie = movie;
  const movieId = displayMovie._id || displayMovie.id || 'N/A';
  const movieRating = displayMovie.rating?.vote_average || displayMovie.rating || 8.5;
  const ratingCount = displayMovie.rating?.vote_count || displayMovie.view || 1200;

  const handleCopyId = () => {
    if (movieId !== 'N/A') {
      navigator.clipboard.writeText(movieId);
      showCinemaAlert(`Đã sao chép ID: ${movieId}`, 'cinema');
    }
  };

  const handleEditClick = () => {
    onClose();
    router.push(`/admin/movies/edit/${movieId}`);
  };

  // Helper to extract YouTube video ID
  const extractYouTubeId = (str: string): string | null => {
    if (!str || typeof str !== 'string') return null;
    const clean = str.trim();
    if (/^[a-zA-Z0-9_-]{11}$/.test(clean)) return clean;
    const match = clean.match(
      /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/i
    );
    return match ? match[1] : null;
  };

  const youtubeVideoId = displayMovie.trailer_url ? extractYouTubeId(displayMovie.trailer_url) : null;

  // Categories extraction
  const categoriesList = Array.isArray(displayMovie.category)
    ? displayMovie.category.map((c: any) => typeof c === 'string' ? c : c.name)
    : [];

  // Directors extraction
  const directorsList = Array.isArray(displayMovie.director)
    ? displayMovie.director.map((d: any) => typeof d === 'string' ? d : d.name)
    : displayMovie.director ? [String(displayMovie.director)] : [];

  // Actors extraction
  const actorsList = Array.isArray(displayMovie.actor)
    ? displayMovie.actor.map((a: any) => typeof a === 'string' ? a : a.name)
    : displayMovie.actor ? [String(displayMovie.actor)] : [];

  // Country extraction
  const countryName = Array.isArray(displayMovie.country)
    ? displayMovie.country.map((c: any) => typeof c === 'string' ? c : c.name).join(', ')
    : typeof displayMovie.country === 'object' && displayMovie.country?.name
    ? displayMovie.country.name
    : displayMovie.country || 'Việt Nam';

  const isVisible = !displayMovie.isHidden && displayMovie.status !== 'inactive';

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.modalHeader}>
          <div className={styles.headerLeft}>
            <div className={styles.headerIconBox}>
              <FaFilm />
            </div>
            <div>
              <h2 className={styles.movieTitle}>
                {displayMovie.name}
              </h2>
              <div className={styles.movieSub}>
                {displayMovie.origin_name && displayMovie.origin_name !== displayMovie.name && (
                  <>
                    <span>{displayMovie.origin_name}</span>
                    <span>•</span>
                  </>
                )}
                <span
                  className={styles.idCopyBadge}
                  onClick={handleCopyId}
                  title="Nhấp để sao chép ID"
                >
                  <FaCopy style={{ fontSize: '0.68rem', marginRight: '3px' }} />
                  {movieId}
                </span>
              </div>
            </div>
          </div>

          <div className={styles.headerActions}>
            <a
              href={`/movie/${displayMovie.slug}`}
              target="_blank"
              rel="noreferrer"
              className={styles.externalLinkBtn}
              title="Xem trang phim trên website"
            >
              <FaExternalLinkAlt /> <span>Xem trên web</span>
            </a>

            <button
              type="button"
              className={styles.editMovieBtn}
              onClick={handleEditClick}
              title="Đi tới trang chỉnh sửa đầy đủ"
            >
              <FaPen /> <span>Chỉnh sửa</span>
            </button>

            <button className={styles.closeBtn} onClick={onClose} aria-label="Đóng">
              <FaTimes />
            </button>
          </div>
        </div>

        {/* Tab Navigation Strip */}
        <div className={styles.tabBar}>
          <button
            type="button"
            className={`${styles.tabBtn} ${activeTab === 'info' ? styles.tabBtnActive : ''}`}
            onClick={() => setActiveTab('info')}
          >
            <FaInfoCircle /> Tổng quan
          </button>
          <button
            type="button"
            className={`${styles.tabBtn} ${activeTab === 'content' ? styles.tabBtnActive : ''}`}
            onClick={() => setActiveTab('content')}
          >
            <FaAlignLeft /> Nội dung & Trailer
          </button>
          <button
            type="button"
            className={`${styles.tabBtn} ${activeTab === 'technical' ? styles.tabBtnActive : ''}`}
            onClick={() => setActiveTab('technical')}
          >
            <FaCode /> Kỹ thuật & SEO
          </button>
          <button
            type="button"
            className={`${styles.tabBtn} ${activeTab === 'episodes' ? styles.tabBtnActive : ''}`}
            onClick={() => setActiveTab('episodes')}
          >
            <FaStream /> Máy chủ & Tập phim
          </button>
          <button
            type="button"
            className={`${styles.tabBtn} ${activeTab === 'ratings' ? styles.tabBtnActive : ''}`}
            onClick={() => setActiveTab('ratings')}
          >
            <FaStar /> Đánh giá ({Number(movieRating).toFixed(1)})
          </button>
        </div>

        {/* Modal Body */}
        <div className={styles.modalBody}>
          {/* TAB 1: OVERVIEW INFO */}
          {activeTab === 'info' && (
            <div className={styles.overviewGrid}>
              {/* Left Column: Poster & Status */}
              <div className={styles.posterCol}>
                <div className={styles.posterBox}>
                  <img
                    src={displayMovie.thumb_url || displayMovie.poster_url || '/placeholder.jpg'}
                    alt={displayMovie.name}
                    className={styles.posterImg}
                    onError={(e) => {
                      e.currentTarget.src = 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=400&q=80';
                    }}
                  />
                  <div className={styles.posterBadgeTop}>
                    <span className={styles.qualityBadge}>
                      {displayMovie.quality || '1080p'}
                    </span>
                    {displayMovie.lang && (
                      <span className={styles.qualityBadge} style={{ background: 'rgba(0, 0, 0, 0.75)' }}>
                        {displayMovie.lang}
                      </span>
                    )}
                  </div>
                </div>

                <div className={`${styles.statusPill} ${isVisible ? styles.statusPillActive : styles.statusPillInactive}`}>
                  {isVisible ? <FaCheckCircle /> : <FaBan />}
                  <span>{isVisible ? 'Đang hiển thị công khai' : 'Tạm ẩn khỏi trang web'}</span>
                </div>
              </div>

              {/* Right Column: Metadata Details */}
              <div className={styles.detailsCol}>
                <div className={styles.movieTitleBlock}>
                  <h3 className={styles.primaryName}>{displayMovie.name}</h3>
                  {displayMovie.origin_name && displayMovie.origin_name !== displayMovie.name && (
                    <div className={styles.originName}>{displayMovie.origin_name}</div>
                  )}
                </div>

                {/* Metrics Ribbon */}
                <div className={styles.metricsStrip}>
                  <div className={`${styles.metricBadge} ${styles.metricBadgeRating}`}>
                    <FaStar /> {Number(movieRating).toFixed(1)} / 10 ({ratingCount.toLocaleString()} đánh giá)
                  </div>
                  <div className={styles.metricBadge}>
                    <FaEye style={{ color: '#38bdf8' }} /> {(displayMovie.view || 610000).toLocaleString()} lượt xem
                  </div>
                  <div className={styles.metricBadge}>
                    <FaClock style={{ color: '#a78bfa' }} /> {displayMovie.time || '120 phút'}
                  </div>
                  <div className={styles.metricBadge}>
                    <FaCalendarAlt style={{ color: '#4ade80' }} /> Năm {displayMovie.year || 2024}
                  </div>
                  <div className={styles.metricBadge}>
                    <FaGlobe style={{ color: '#fb923c' }} /> {countryName}
                  </div>
                </div>

                {/* Info Fields Grid */}
                <div className={styles.infoCardsGrid}>
                  <div className={styles.infoField}>
                    <span className={styles.infoFieldLabel}>Loại Phim</span>
                    <span className={styles.infoFieldValue}>
                      {displayMovie.type === 'series' ? 'Phim bộ (Nhiều tập)' : 'Phim lẻ (Chiếu rạp / Độc quyền)'}
                    </span>
                  </div>

                  <div className={styles.infoField}>
                    <span className={styles.infoFieldLabel}>Tiến Độ Tập</span>
                    <span className={styles.infoFieldValue}>
                      {displayMovie.episode_current || 'Full'} / {displayMovie.episode_total || '1 tập'}
                    </span>
                  </div>

                  <div className={styles.infoField}>
                    <span className={styles.infoFieldLabel}>Đặc Quyền & Bản Quyền</span>
                    <span className={styles.infoFieldValue}>
                      {[
                        displayMovie.is_copyright && 'Có bản quyền',
                        displayMovie.chieurap && 'Chiếu Rạp',
                        displayMovie.sub_docquyen && 'Vietsub độc quyền'
                      ].filter(Boolean).join(' • ') || 'Tiêu chuẩn'}
                    </span>
                  </div>

                  <div className={styles.infoField}>
                    <span className={styles.infoFieldLabel}>Đường Dẫn Slug</span>
                    <span className={styles.infoFieldValue} style={{ fontFamily: 'monospace', color: '#38bdf8' }}>
                      /{displayMovie.slug}
                    </span>
                  </div>
                </div>

                {/* Taxonomies & Cast */}
                {categoriesList.length > 0 && (
                  <div className={styles.tagsSection}>
                    <div className={styles.tagsSectionTitle}>
                      <FaTags style={{ marginRight: '4px' }} /> Thể Loại:
                    </div>
                    <div className={styles.chipsWrapper}>
                      {categoriesList.map((cat: string, idx: number) => (
                        <span key={idx} className={styles.categoryChip}>
                          {cat}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {directorsList.length > 0 && (
                  <div className={styles.tagsSection}>
                    <div className={styles.tagsSectionTitle}>
                      <FaUserTie style={{ marginRight: '4px' }} /> Đạo Diễn:
                    </div>
                    <div className={styles.chipsWrapper}>
                      {directorsList.map((dir: string, idx: number) => (
                        <span key={idx} className={styles.personChip}>
                          {dir}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {actorsList.length > 0 && (
                  <div className={styles.tagsSection}>
                    <div className={styles.tagsSectionTitle}>
                      <FaUsers style={{ marginRight: '4px' }} /> Diễn Viên Chính:
                    </div>
                    <div className={styles.chipsWrapper}>
                      {actorsList.map((act: string, idx: number) => (
                        <span key={idx} className={styles.personChip}>
                          {act}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: CONTENT & TRAILER */}
          {activeTab === 'content' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className={styles.contentCard}>
                <h4 style={{ margin: 0, fontSize: '0.95rem', color: '#ffffff', fontWeight: 600 }}>
                  Tóm Tắt Cốt Truyện
                </h4>
                <div className={styles.plotText}>
                  {displayMovie.content || 'Chưa có thông tin mô tả chi tiết cho phim này.'}
                </div>
              </div>

              {youtubeVideoId ? (
                <div className={styles.trailerCard}>
                  <div className={styles.trailerHeader}>
                    <FaPlay style={{ color: '#e50914' }} /> Trailer Video (YouTube Embed)
                  </div>
                  <iframe
                    className={styles.trailerIframe}
                    src={`https://www.youtube.com/embed/${youtubeVideoId}`}
                    title="Movie Trailer"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    loading="lazy"
                  />
                </div>
              ) : displayMovie.trailer_url ? (
                <div className={styles.contentCard}>
                  <h4 style={{ margin: 0, fontSize: '0.9rem', color: '#ffffff' }}>Link Trailer Ngoại Tuyến</h4>
                  <a
                    href={displayMovie.trailer_url}
                    target="_blank"
                    rel="noreferrer"
                    style={{ color: '#38bdf8', fontSize: '0.84rem' }}
                  >
                    {displayMovie.trailer_url}
                  </a>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
                  Phim này chưa cập nhật video trailer.
                </div>
              )}
            </div>
          )}

          {/* TAB 3: TECHNICAL & SEO */}
          {activeTab === 'technical' && (
            <div className={styles.techGrid}>
              <div className={styles.techCard}>
                <span className={styles.techKey}>ID Hệ Thống</span>
                <span className={styles.techVal}>{movieId}</span>
              </div>
              <div className={styles.techCard}>
                <span className={styles.techKey}>Slug URL</span>
                <span className={styles.techVal}>/{displayMovie.slug}</span>
              </div>
              <div className={styles.techCard}>
                <span className={styles.techKey}>TMDB ID</span>
                <span className={styles.techVal}>{displayMovie.tmdb?.id || '—'}</span>
              </div>
              <div className={styles.techCard}>
                <span className={styles.techKey}>IMDb ID</span>
                <span className={styles.techVal}>{displayMovie.imdb?.id || '—'}</span>
              </div>
              <div className={styles.techCard}>
                <span className={styles.techKey}>Thông Báo / Lịch Chiếu</span>
                <span className={styles.techVal} style={{ fontFamily: 'inherit' }}>
                  {displayMovie.showtimes || displayMovie.notify || 'Theo lịch chuẩn'}
                </span>
              </div>
              <div className={styles.techCard}>
                <span className={styles.techKey}>Ngày Tạo / Cập Nhật</span>
                <span className={styles.techVal} style={{ fontFamily: 'inherit', fontSize: '0.78rem' }}>
                  Tạo: {displayMovie.createdAt || '16/12/2022'} • Sửa: {displayMovie.updatedAt || '10/04/2023'}
                </span>
              </div>
            </div>
          )}

          {/* TAB 4: EPISODES & SERVERS */}
          {activeTab === 'episodes' && (
            <div className={styles.episodesBanner}>
              <div className={styles.episodesBannerHeader}>
                <div>
                  <h4 style={{ margin: 0, color: '#ffffff', fontSize: '1rem', fontWeight: 600 }}>
                    Quản Lý Tập Phim & Luồng Phát Trực Tuyến
                  </h4>
                  <p style={{ margin: '0.25rem 0 0', color: '#9ca3af', fontSize: '0.8rem' }}>
                    Quản lý danh sách tập, liên kết M3U8/Embed và các cụm máy chủ phát (HLS, CDN, VIP Server).
                  </p>
                </div>

                <button
                  type="button"
                  className={styles.openEpisodeManagerBtn}
                  onClick={() => {
                    onClose();
                    if (onOpenEpisodeManager) {
                      onOpenEpisodeManager(displayMovie);
                    }
                  }}
                >
                  <FaServer /> Mở Trình Quản Lý Tập Phim
                </button>
              </div>

              <div style={{ marginTop: '0.75rem', background: '#141416', padding: '1rem', borderRadius: 8 }}>
                <div style={{ fontSize: '0.82rem', color: '#cbd5e1' }}>
                  <strong>Tiến độ hiện tại:</strong> {displayMovie.episode_current || 'Đang cập nhật'} / {displayMovie.episode_total || '1 tập'}
                </div>
                <div style={{ fontSize: '0.78rem', color: '#9ca3af', marginTop: '0.25rem' }}>
                  Số lượng máy chủ phát cấu hình: {Array.isArray(displayMovie.episodes) ? displayMovie.episodes.length : 1} server
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: RATINGS */}
          {activeTab === 'ratings' && (
            <div className={styles.ratingsOverview}>
              <div className={styles.ratingBigScore}>
                {Number(movieRating).toFixed(1)}
              </div>
              <div>
                <div style={{ color: '#ffffff', fontWeight: 700, fontSize: '1.05rem' }}>
                  Đánh Giá Từ Khán Giả & Thành Viên
                </div>
                <div style={{ color: '#9ca3af', fontSize: '0.82rem', marginTop: '0.2rem' }}>
                  Dựa trên {ratingCount.toLocaleString()} lượt bình chọn trên toàn hệ thống Cinema Dark
                </div>
                <div style={{ display: 'flex', gap: '0.25rem', marginTop: '0.45rem', color: '#fbbf24', fontSize: '0.9rem' }}>
                  <FaStar /><FaStar /><FaStar /><FaStar /><FaStar />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={styles.modalFooter}>
          <button className={styles.footerCloseBtn} onClick={onClose}>
            Đóng
          </button>
          <button className={styles.editMovieBtn} onClick={handleEditClick}>
            <FaPen /> <span>Chỉnh Sửa Phim Này</span>
          </button>
        </div>
      </div>
    </div>
  );
}
