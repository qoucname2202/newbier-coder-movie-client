import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Navbar from '@/components/Layout/Navbar';
import Footer from '@/components/Layout/Footer';
import movieService from '@/API/services/movieService';
import {
  getAllRecentWatches,
  removeRecentWatch,
  clearAllRecentWatches
} from '@/utils/watchProgress';
import { LOCAL_DEFAULT_POSTER } from '@/config/movieFallbackConfig';
import {
  FaPlay,
  FaTrash,
  FaHistory,
  FaSearch,
  FaTimes,
  FaFilm
} from 'react-icons/fa';
import styles from '@/styles/HistoryPage.module.css';

/**
 * Format timestamp into friendly relative Vietnamese text without external bloated libraries
 */
function formatRelativeTime(timestamp) {
  if (!timestamp) return 'Gần đây';
  const diffSec = Math.floor((Date.now() - Number(timestamp)) / 1000);

  if (diffSec < 60) return 'Vừa xong';
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)} phút trước`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)} giờ trước`;
  if (diffSec < 259200) return `${Math.floor(diffSec / 86400)} ngày trước`;

  const date = new Date(timestamp);
  return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
}

/**
 * Normalizes live movie from API to history card shape
 */
function normalizeApiMovieToHistory(movie, index) {
  const epNumber = (index % 12) + 1;
  const progressPercent = Math.min(95, Math.max(20, (100 - index * 7)));
  const simulatedTime = Date.now() - index * 3600000 * (index < 4 ? 2 : 12);

  return {
    slug: movie.slug || `movie-${index}`,
    movieName: movie.name || 'Phim rạp',
    originName: movie.origin_name,
    posterUrl: movie.poster_url || movie.thumb_url || LOCAL_DEFAULT_POSTER,
    epName: `Tập ${epNumber}`,
    epSlug: `tap-${epNumber}`,
    serverIndex: 0,
    episodeIndex: epNumber - 1,
    progressPercent,
    updatedAt: simulatedTime,
    isSampleFromApi: true
  };
}

/**
 * Core History Content Component
 * Used both on the standalone /history page and inside the User Profile tabs.
 */
export function HistoryContent({ inProfilePage = false }) {
  const [historyItems, setHistoryItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Load history from local watch progress or live random API fallback
  const loadHistory = useCallback(async () => {
    setLoading(true);
    try {
      const localWatches = getAllRecentWatches();

      if (localWatches && localWatches.length > 0) {
        // Normalize local watches
        const mapped = localWatches.map((item, idx) => ({
          slug: item.slug,
          movieName: item.movieName || item.slug,
          posterUrl: item.posterUrl || LOCAL_DEFAULT_POSTER,
          epName: item.epName || `Tập ${(item.episodeIndex || 0) + 1}`,
          epSlug: item.epSlug || '',
          serverIndex: item.serverIndex || 0,
          episodeIndex: item.episodeIndex || 0,
          progressPercent: 75,
          updatedAt: item.updatedAt || Date.now() - idx * 3600000,
          isSampleFromApi: false
        }));
        setHistoryItems(mapped);
      } else {
        // As requested: Fetch live random movie data from API instead of mock
        const apiResponse = await movieService.getMoviesPage(1, 14);
        const list = Array.isArray(apiResponse) ? apiResponse : [];

        if (list.length > 0) {
          const mappedApi = list.map((movie, idx) => normalizeApiMovieToHistory(movie, idx));
          setHistoryItems(mappedApi);
        } else {
          // Fallback to trending endpoint
          const trending = await movieService.getTrendingMovies();
          const trendingList = Array.isArray(trending) ? trending.slice(0, 14) : [];
          const mappedTrending = trendingList.map((movie, idx) => normalizeApiMovieToHistory(movie, idx));
          setHistoryItems(mappedTrending);
        }
      }
    } catch {
      // Quiet fallback
      setHistoryItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadHistory();

    const handleWatchUpdate = () => {
      const local = getAllRecentWatches();
      if (local && local.length > 0) {
        setHistoryItems(local.map((item, idx) => ({
          slug: item.slug,
          movieName: item.movieName || item.slug,
          posterUrl: item.posterUrl || LOCAL_DEFAULT_POSTER,
          epName: item.epName || `Tập ${(item.episodeIndex || 0) + 1}`,
          epSlug: item.epSlug || '',
          serverIndex: item.serverIndex || 0,
          episodeIndex: item.episodeIndex || 0,
          progressPercent: 75,
          updatedAt: item.updatedAt || Date.now() - idx * 3600000,
          isSampleFromApi: false
        })));
      }
    };

    window.addEventListener('watchProgressUpdated', handleWatchUpdate);
    return () => window.removeEventListener('watchProgressUpdated', handleWatchUpdate);
  }, [loadHistory]);

  // Delete a single movie from watch history
  const handleDeleteItem = (e, slug) => {
    e.preventDefault();
    e.stopPropagation();

    removeRecentWatch(slug);
    setHistoryItems((prev) => prev.filter((item) => item.slug !== slug));
  };

  // Clear all history
  const handleClearAll = () => {
    if (historyItems.length === 0) return;
    if (window.confirm('Bạn có chắc muốn xoá toàn bộ lịch sử xem phim?')) {
      clearAllRecentWatches();
      setHistoryItems([]);
    }
  };

  // Filtered items based on search query
  const displayedItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return historyItems;
    return historyItems.filter((item) =>
      (item.movieName || '').toLowerCase().includes(q)
    );
  }, [historyItems, searchQuery]);

  return (
    <div className={inProfilePage ? '' : styles.historyContainer}>
      {/* Standalone Breadcrumbs */}
      {!inProfilePage && (
        <nav className={styles.breadcrumbBar} aria-label="Đường dẫn trang">
          <Link href="/" className={styles.crumbLink}>
            Trang chủ
          </Link>
          <span className={styles.crumbDivider}>/</span>
          <span className={styles.crumbActive}>Lịch sử xem</span>
        </nav>
      )}

      {/* Header Toolbar */}
      <div className={styles.toolbarHeader}>
        <div className={styles.titleArea}>
          <h1 className={styles.mainTitle}>
            <FaHistory className={styles.titleIcon} />
            <span>Lịch sử xem phim</span>
          </h1>
          {historyItems.length > 0 && (
            <span className={styles.countBadge}>
              {historyItems.length} phim
            </span>
          )}
        </div>

        <div className={styles.actionsArea}>
          {/* Quick Search Filter */}
          {historyItems.length > 0 && (
            <div className={styles.searchBox}>
              <FaSearch className={styles.searchIcon} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm phim đã xem..."
                className={styles.searchInput}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className={styles.clearSearchBtn}
                  aria-label="Xoá tìm kiếm"
                >
                  <FaTimes />
                </button>
              )}
            </div>
          )}

          {/* Clear All Action */}
          {historyItems.length > 0 && (
            <button
              type="button"
              className={styles.clearAllBtn}
              onClick={handleClearAll}
              title="Xoá toàn bộ lịch sử"
            >
              <FaTrash />
              <span>Xoá tất cả</span>
            </button>
          )}
        </div>
      </div>

      {/* Content Rendering */}
      {loading ? (
        <div className={styles.loadingState}>
          <div className={styles.spinner} />
          <p className="text-secondary small">Đang nạp dữ liệu lịch sử xem...</p>
        </div>
      ) : displayedItems.length > 0 ? (
        <div className={styles.movieGrid}>
          {displayedItems.map((item) => {
            const watchUrl = item.epSlug
              ? `/movie/${item.slug}/watch?ep=${encodeURIComponent(item.epSlug)}`
              : `/movie/${item.slug}/watch`;

            return (
              <div key={item.slug} className={styles.historyCard}>
                {/* Poster & Quick Play Overlay */}
                <Link href={watchUrl} className={styles.posterWrapper} title={`Tiếp tục xem ${item.movieName}`}>
                  <img
                    src={item.posterUrl || LOCAL_DEFAULT_POSTER}
                    alt={item.movieName}
                    className={styles.posterImg}
                    loading="lazy"
                    onError={(e) => {
                      e.currentTarget.src = LOCAL_DEFAULT_POSTER;
                    }}
                  />

                  {/* Play circle overlay */}
                  <div className={styles.playOverlay}>
                    <div className={styles.playCircle}>
                      <FaPlay style={{ marginLeft: '2px' }} />
                    </div>
                  </div>

                  {/* Top-right delete button */}
                  <button
                    type="button"
                    className={styles.deleteItemBtn}
                    onClick={(e) => handleDeleteItem(e, item.slug)}
                    title="Xoá phim khỏi lịch sử"
                    aria-label={`Xoá ${item.movieName} khỏi lịch sử`}
                  >
                    <FaTrash />
                  </button>

                  {/* Bottom progress bar indicator */}
                  <div className={styles.progressBarTrack}>
                    <div
                      className={styles.progressBarFill}
                      style={{ width: `${item.progressPercent || 70}%` }}
                    />
                  </div>
                </Link>

                {/* Movie Title & Info Meta */}
                <div className={styles.cardContent}>
                  <Link href={watchUrl} className={styles.movieTitleLink} title={item.movieName}>
                    <h3 className={styles.movieTitle}>{item.movieName}</h3>
                  </Link>

                  <div className={styles.metaRow}>
                    <span className={styles.epTag}>{item.epName || 'Đang xem'}</span>
                    <span className={styles.timeText}>{formatRelativeTime(item.updatedAt)}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className={styles.emptyState}>
          <FaFilm className={styles.emptyIcon} />
          <h3 className={styles.emptyTitle}>
            {searchQuery ? 'Không tìm thấy phim phù hợp' : 'Chưa có phim nào trong lịch sử'}
          </h3>
          <p className={styles.emptyText}>
            {searchQuery
              ? 'Thử tìm với từ khoá khác hoặc xoá bộ lọc tìm kiếm.'
              : 'Các bộ phim bạn đã theo dõi sẽ được lưu tự động tại đây để bạn có thể tiếp tục xem bất cứ lúc nào.'}
          </p>
          <Link href="/" className={styles.exploreBtn}>
            <FaPlay style={{ fontSize: '0.75rem' }} />
            <span>Khám phá phim ngay</span>
          </Link>
        </div>
      )}
    </div>
  );
}

/**
 * Standalone Page Export
 */
export default function HistoryPage() {
  return (
    <div className={styles.historyPageWrapper}>
      <Head>
        <title>Lịch sử xem phim | MovieStreaming</title>
        <meta
          name="description"
          content="Xem lại danh sách các bộ phim đã xem và tiếp tục theo dõi các tập phim yêu thích."
        />
        <meta property="og:title" content="Lịch sử xem phim | MovieStreaming" />
      </Head>

      <Navbar />

      <main>
        <HistoryContent inProfilePage={false} />
      </main>

      <Footer />
    </div>
  );
}