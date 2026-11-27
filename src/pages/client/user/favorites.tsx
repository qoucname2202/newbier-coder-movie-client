/**
 * @file pages/client/user/favorites.tsx
 * @description Enterprise-grade Favorites Page with Cinema Dark styling,
 * responsive multi-tier filtering, instant heart-toggle removal (calling DELETE /movies/:slug/favorite),
 * multi-select deletion, and fluid transitions.
 */

import React, { useState, useEffect, useMemo, useCallback, useRef, MouseEvent } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import {
  FaHeart,
  FaSync,
  FaTrash,
  FaCheckSquare,
  FaSort,
  FaPlay,
  FaStar,
  FaCheck,
  FaCompass
} from 'react-icons/fa';
import favoritesService, {
  FavoritesServiceError,
  type FavoriteMovie
} from '@/API/services/favoritesService';
import { formatYear } from '@/utils/taxonomy';
import { useAuth } from '@/context/AuthContext';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import styles from '@/styles/Favorites.module.css';

type SortOption =
  | 'newest'
  | 'oldest'
  | 'highest-rating'
  | 'lowest-rating'
  | 'a-z'
  | 'z-a'
  | 'year-desc'
  | 'year-asc';

type FilterTab = 'all' | 'movie' | 'series';

interface PageError {
  requiresAuth: boolean;
  message: string;
}

export default function FavoritesPage({ inProfilePage = false }: { inProfilePage?: boolean }) {
  const [favorites, setFavorites] = useState<FavoriteMovie[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<PageError | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<FilterTab>('all');
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [selectMode, setSelectMode] = useState<boolean>(false);
  const [sortOption, setSortOption] = useState<SortOption>('newest');
  const [showSortOptions, setShowSortOptions] = useState<boolean>(false);

  const { isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();
  const requestInFlightRef = useRef<boolean>(false);
  const isMountedRef = useRef<boolean>(true);
  const sortDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Close sort menu on click outside
  useEffect(() => {
    const handleClickOutside = (e: globalThis.MouseEvent) => {
      if (sortDropdownRef.current && !sortDropdownRef.current.contains(e.target as Node)) {
        setShowSortOptions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Listen for global favorite changes
  useEffect(() => {
    const handleFavChange = (e: Event) => {
      const customEvent = e as CustomEvent<{ slug: string; isFavorite: boolean }>;
      if (!customEvent.detail) return;
      const { slug, isFavorite } = customEvent.detail;
      if (!isFavorite) {
        setFavorites((prev) => prev.filter((m) => m.slug !== slug && m.id !== slug));
      }
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('favorites_changed', handleFavChange);
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('favorites_changed', handleFavChange);
      }
    };
  }, []);

  /**
   * Fetches favorite movies from GET /users/me/favorites
   */
  const fetchFavorites = useCallback(async (): Promise<boolean> => {
    if (requestInFlightRef.current) return false;
    requestInFlightRef.current = true;

    setLoading(true);
    setError(null);

    try {
      const movies = await favoritesService.getFavorites(1, 50);
      if (!isMountedRef.current) return false;

      setFavorites(movies);
      setSelectedItems([]);
      setSelectMode(false);
      return true;
    } catch (err) {
      if (!isMountedRef.current) return false;

      if (err instanceof FavoritesServiceError) {
        setError({
          requiresAuth: err.code === 'unauthenticated',
          message: err.message
        });
      } else {
        setError({
          requiresAuth: false,
          message: 'Có lỗi xảy ra khi tải danh sách yêu thích'
        });
      }
      setFavorites([]);
      return false;
    } finally {
      requestInFlightRef.current = false;
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      setLoading(false);
      setFavorites([]);
      setError({
        requiresAuth: true,
        message: 'Bạn cần đăng nhập để xem danh sách phim yêu thích'
      });
      if (!inProfilePage) {
        router.push('/auth/login');
      }
      return;
    }

    fetchFavorites();
  }, [isAuthenticated, authLoading, inProfilePage, router, fetchFavorites]);

  const handleRefresh = useCallback(async (): Promise<void> => {
    if (!isAuthenticated) {
      setError({
        requiresAuth: true,
        message: 'Bạn cần đăng nhập để xem danh sách yêu thích'
      });
      setLoading(false);
      if (!inProfilePage) {
        router.push('/auth/login');
      }
      return;
    }

    if (requestInFlightRef.current) return;
    setRefreshing(true);
    try {
      const ok = await fetchFavorites();
      if (ok) {
        toast.success('Đã làm mới danh sách yêu thích!', {
          position: 'top-right',
          autoClose: 2000,
          theme: 'dark'
        });
      }
    } finally {
      if (isMountedRef.current) {
        setRefreshing(false);
      }
    }
  }, [isAuthenticated, inProfilePage, router, fetchFavorites]);

  /**
   * Removes one movie from favorites via DELETE /api/v1/movies/:slug/favorite
   */
  const handleRemoveFavorite = useCallback(
    async (movie: FavoriteMovie, e?: MouseEvent): Promise<void> => {
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }

      // Optimistic update
      const targetSlug = movie.slug || movie.id;
      setFavorites((prev) => prev.filter((m) => m.id !== movie.id && m.slug !== movie.slug));

      try {
        setIsDeleting(true);
        const result = await favoritesService.removeFromFavorites(movie.id, movie.slug);
        if (result.success) {
          toast.success(`Đã xóa "${movie.title}" khỏi danh sách yêu thích`, {
            position: 'top-right',
            autoClose: 2500,
            theme: 'dark'
          });
        } else {
          // Re-fetch on failure to restore state
          await fetchFavorites();
          toast.error(result.message || 'Không thể xóa phim khỏi danh sách yêu thích', {
            position: 'top-right',
            autoClose: 3000,
            theme: 'dark'
          });
        }
      } catch {
        await fetchFavorites();
        toast.error('Có lỗi xảy ra khi kết nối máy chủ', {
          position: 'top-right',
          autoClose: 3000,
          theme: 'dark'
        });
      } finally {
        if (isMountedRef.current) {
          setIsDeleting(false);
        }
      }
    },
    [fetchFavorites]
  );

  const toggleSelectMode = (): void => {
    setSelectMode((prev) => {
      if (prev) setSelectedItems([]);
      return !prev;
    });
  };

  const toggleSelectItem = (id: string): void => {
    setSelectedItems((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = (): void => {
    if (selectedItems.length === filteredList.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(filteredList.map((m) => m.id));
    }
  };

  /**
   * Bulk deletion via DELETE /movies/:slug/favorite
   */
  const handleRemoveSelected = async (): Promise<void> => {
    if (selectedItems.length === 0) {
      toast.warning('Vui lòng chọn ít nhất một phim để xóa', { theme: 'dark' });
      return;
    }
    if (
      !window.confirm(
        `Bạn có chắc chắn muốn xóa ${selectedItems.length} phim đã chọn khỏi danh sách yêu thích?`
      )
    ) {
      return;
    }

    try {
      setIsDeleting(true);
      let successCount = 0;
      let errorCount = 0;

      for (const movieId of selectedItems) {
        const movie = favorites.find((m) => m.id === movieId);
        const target = movie?.slug || movieId;
        try {
          const result = await favoritesService.removeFromFavorites(movieId, movie?.slug);
          if (result.success) successCount++;
          else errorCount++;
        } catch {
          errorCount++;
        }
      }

      await fetchFavorites();

      if (successCount > 0 && errorCount === 0) {
        toast.success(`Đã xóa ${successCount} phim khỏi danh sách yêu thích!`, { theme: 'dark' });
      } else if (successCount > 0 && errorCount > 0) {
        toast.warning(
          `Đã xóa ${successCount} phim, nhưng không thể xóa ${errorCount} phim`,
          { theme: 'dark' }
        );
      } else {
        toast.error('Không thể xóa các phim đã chọn', { theme: 'dark' });
      }
    } catch {
      toast.error('Có lỗi xảy ra khi xóa các phim đã chọn', { theme: 'dark' });
    } finally {
      if (isMountedRef.current) {
        setIsDeleting(false);
        setSelectMode(false);
      }
    }
  };

  // Filtered by type
  const filteredFavorites = useMemo(() => {
    if (selectedFilter === 'movie') {
      return favorites.filter((m) => m.type === 'single' || m.type === 'movie');
    }
    if (selectedFilter === 'series') {
      return favorites.filter((m) => m.type === 'series' || m.type === 'tv');
    }
    return favorites;
  }, [favorites, selectedFilter]);

  // Sorted list
  const filteredList = useMemo(() => {
    const list = [...filteredFavorites];
    switch (sortOption) {
      case 'a-z':
        return list.sort((a, b) => a.title.localeCompare(b.title, 'vi'));
      case 'z-a':
        return list.sort((a, b) => b.title.localeCompare(a.title, 'vi'));
      case 'highest-rating':
        return list.sort((a, b) => (Number(b.rating) || 0) - (Number(a.rating) || 0));
      case 'lowest-rating':
        return list.sort((a, b) => (Number(a.rating) || 0) - (Number(b.rating) || 0));
      case 'year-desc':
        return list.sort((a, b) => (Number(b.year) || 0) - (Number(a.year) || 0));
      case 'year-asc':
        return list.sort((a, b) => (Number(a.year) || 0) - (Number(b.year) || 0));
      case 'oldest':
        return list.sort(
          (a, b) => new Date(a.dateAdded).getTime() - new Date(b.dateAdded).getTime()
        );
      case 'newest':
      default:
        return list.sort(
          (a, b) => new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime()
        );
    }
  }, [filteredFavorites, sortOption]);

  const getSortOptionName = (): string => {
    switch (sortOption) {
      case 'a-z':
        return 'Tên: A - Z';
      case 'z-a':
        return 'Tên: Z - A';
      case 'highest-rating':
        return 'Đánh giá cao nhất';
      case 'lowest-rating':
        return 'Đánh giá thấp nhất';
      case 'newest':
        return 'Mới thêm gần đây';
      case 'oldest':
        return 'Cũ nhất';
      case 'year-desc':
        return 'Năm sản xuất mới nhất';
      case 'year-asc':
        return 'Năm sản xuất cũ nhất';
      default:
        return 'Sắp xếp';
    }
  };

  const handleImgError = (e: MouseEvent<HTMLImageElement>): void => {
    e.currentTarget.onerror = null;
    e.currentTarget.src = '/img/placeholder-poster.svg';
  };

  const mainContent = (
    <div className={styles.container}>
      {/* 1. Header Area */}
      <header className={styles.headerSection}>
        <div className={styles.badgeRow}>
          <span className={styles.sectionBadge}>
            <FaHeart style={{ fontSize: '0.7rem' }} /> BỘ SƯU TẬP CÁ NHÂN
          </span>
        </div>

        <div className={styles.titleArea}>
          <h1 className={styles.pageHeading}>Phim Yêu Thích Của Bạn</h1>
          {!loading && favorites.length > 0 && (
            <span className={styles.countPill}>{favorites.length} bộ phim</span>
          )}
        </div>

        <p className={styles.pageSubheading}>
          Danh sách các bộ phim bạn đã lưu lại để theo dõi và thưởng thức bất cứ lúc nào.
        </p>

        {/* 2. Controls & Filter Toolbar */}
        <div className={styles.toolbarRow}>
          {/* Left: Filter Chips */}
          <div className={styles.filterChips} role="tablist">
            <button
              type="button"
              className={`${styles.filterBtn} ${selectedFilter === 'all' ? styles.filterBtnActive : ''}`}
              onClick={() => setSelectedFilter('all')}
            >
              Tất cả ({favorites.length})
            </button>
            <button
              type="button"
              className={`${styles.filterBtn} ${selectedFilter === 'series' ? styles.filterBtnActive : ''}`}
              onClick={() => setSelectedFilter('series')}
            >
              Phim bộ (
              {
                favorites.filter((m) => m.type === 'series' || m.type === 'tv').length
              }
              )
            </button>
            <button
              type="button"
              className={`${styles.filterBtn} ${selectedFilter === 'movie' ? styles.filterBtnActive : ''}`}
              onClick={() => setSelectedFilter('movie')}
            >
              Phim lẻ (
              {
                favorites.filter((m) => m.type === 'single' || m.type === 'movie').length
              }
              )
            </button>
          </div>

          {/* Right: Actions Group */}
          <div className={styles.actionsGroup}>
            {/* Sort Dropdown */}
            {!loading && filteredList.length > 0 && (
              <div className={styles.sortWrapper} ref={sortDropdownRef}>
                <button
                  type="button"
                  className={styles.actionBtn}
                  onClick={() => setShowSortOptions((prev) => !prev)}
                  aria-expanded={showSortOptions}
                >
                  <FaSort />
                  <span>{getSortOptionName()}</span>
                </button>

                {showSortOptions && (
                  <ul className={styles.sortMenu}>
                    {(
                      [
                        'newest',
                        'oldest',
                        'highest-rating',
                        'lowest-rating',
                        'a-z',
                        'z-a',
                        'year-desc',
                        'year-asc'
                      ] as SortOption[]
                    ).map((opt) => (
                      <li key={opt}>
                        <button
                          type="button"
                          className={`${styles.sortItem} ${sortOption === opt ? styles.sortItemActive : ''}`}
                          onClick={() => {
                            setSortOption(opt);
                            setShowSortOptions(false);
                          }}
                        >
                          <span>
                            {opt === 'newest'
                              ? 'Mới thêm gần đây'
                              : opt === 'oldest'
                              ? 'Cũ nhất'
                              : opt === 'highest-rating'
                              ? 'Đánh giá cao nhất'
                              : opt === 'lowest-rating'
                              ? 'Đánh giá thấp nhất'
                              : opt === 'a-z'
                              ? 'Tên: A - Z'
                              : opt === 'z-a'
                              ? 'Tên: Z - A'
                              : opt === 'year-desc'
                              ? 'Năm mới nhất'
                              : 'Năm cũ nhất'}
                          </span>
                          {sortOption === opt && <FaCheck style={{ fontSize: '0.65rem' }} />}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {/* Multi-select Toggle */}
            {!loading && filteredList.length > 0 && (
              <button
                type="button"
                className={`${styles.actionBtn} ${selectMode ? styles.actionBtnActive : ''}`}
                onClick={toggleSelectMode}
              >
                <FaCheckSquare />
                <span>{selectMode ? 'Hủy chọn' : 'Chọn nhiều'}</span>
              </button>
            )}

            {selectMode && (
              <>
                <button type="button" className={styles.actionBtn} onClick={handleSelectAll}>
                  <span>
                    {selectedItems.length === filteredList.length ? 'Bỏ chọn' : 'Chọn tất cả'}
                  </span>
                </button>
                <button
                  type="button"
                  className={styles.dangerBtn}
                  onClick={handleRemoveSelected}
                  disabled={selectedItems.length === 0 || isDeleting}
                >
                  <FaTrash />
                  <span>Xóa ({selectedItems.length})</span>
                </button>
              </>
            )}

            {/* Refresh Button */}
            <button
              type="button"
              className={styles.actionBtn}
              onClick={handleRefresh}
              disabled={refreshing || loading}
              title="Làm mới danh sách"
            >
              <FaSync className={refreshing ? 'spin' : ''} />
              <span>{refreshing ? 'Đang tải' : 'Làm mới'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* 3. Main Content: Skeleton, Empty, Error, or Grid */}
      {loading ? (
        <div className={styles.movieGrid}>
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className={styles.skeletonCard}>
              <div className={styles.skeletonPoster} />
              <div className={styles.skeletonTitle} />
              <div className={styles.skeletonMeta} />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className={styles.emptyStateContainer}>
          <div className={styles.emptyHeartIcon}>
            <FaHeart />
          </div>
          <h3 className={styles.emptyTitle}>
            {error.requiresAuth ? 'Yêu cầu đăng nhập' : 'Không thể tải danh sách'}
          </h3>
          <p className={styles.emptyText}>{error.message}</p>
          {error.requiresAuth ? (
            <Link href="/auth/login" className={styles.exploreCtaBtn}>
              Đăng nhập ngay
            </Link>
          ) : (
            <button type="button" className={styles.exploreCtaBtn} onClick={handleRefresh}>
              Thử lại
            </button>
          )}
        </div>
      ) : filteredList.length === 0 ? (
        <div className={styles.emptyStateContainer}>
          <div className={styles.emptyHeartIcon}>
            <FaHeart />
          </div>
          <h3 className={styles.emptyTitle}>Danh sách phim yêu thích đang trống</h3>
          <p className={styles.emptyText}>
            Bạn chưa lưu bộ phim nào vào danh sách yêu thích. Hãy bấm vào icon trái tim trên các thẻ
            phim để lưu lại nhé!
          </p>
          <Link href="/" className={styles.exploreCtaBtn}>
            <FaCompass />
            <span>Khám phá phim ngay</span>
          </Link>
        </div>
      ) : (
        <div className={styles.movieGrid}>
          {filteredList.map((movie) => {
            const movieSlug = movie.slug || movie.id;
            const isSelected = selectedItems.includes(movie.id);
            const safeRating = Number(movie.rating || 0) > 0 ? Number(movie.rating).toFixed(1) : '8.6';
            const movieYear = formatYear(movie.year);
            const isSeries = movie.type === 'series' || movie.type === 'tv';

            return (
              <div key={movie.id} className={styles.movieCard}>
                <div className={styles.posterWrapper}>
                  {/* Poster Image */}
                  <img
                    src={movie.thumbnail || '/img/placeholder-poster.svg'}
                    alt={movie.title}
                    className={styles.posterImg}
                    loading="lazy"
                    onError={handleImgError}
                  />

                  {/* Gradient Vignette */}
                  <div className={styles.posterOverlay} />

                  {/* Multi-select Checkbox (Top Left) */}
                  {selectMode && (
                    <div
                      className={`${styles.selectCheckbox} ${isSelected ? styles.selectCheckboxActive : ''}`}
                      onClick={() => toggleSelectItem(movie.id)}
                      role="checkbox"
                      aria-checked={isSelected}
                    >
                      {isSelected && <FaCheck />}
                    </div>
                  )}

                  {/* Heart Favorite / Remove Button (Top Right) */}
                  {!selectMode && (
                    <button
                      type="button"
                      className={styles.heartBtn}
                      onClick={(e) => handleRemoveFavorite(movie, e)}
                      title={`Bỏ yêu thích phim ${movie.title}`}
                      aria-label={`Bỏ yêu thích phim ${movie.title}`}
                    >
                      <FaHeart />
                    </button>
                  )}

                  {/* Badges: Format & Quality */}
                  <span className={styles.badgeFormat}>
                    {isSeries ? 'Phim Bộ' : 'Phim Lẻ'}
                  </span>
                  {movie.quality && (
                    <span className={styles.badgeQuality}>{movie.quality}</span>
                  )}

                  {/* Center Play Overlay */}
                  {!selectMode && (
                    <div className={styles.playOverlay}>
                      <Link
                        href={`/movie/${encodeURIComponent(movieSlug)}`}
                        className={styles.playCircle}
                        title={`Xem phim ${movie.title}`}
                        aria-label={`Xem phim ${movie.title}`}
                      >
                        <FaPlay />
                      </Link>
                    </div>
                  )}
                </div>

                {/* Clean Metadata Block */}
                <div className={styles.cardInfo}>
                  <Link
                    href={`/movie/${encodeURIComponent(movieSlug)}`}
                    className={styles.movieTitle}
                    title={movie.title}
                  >
                    {movie.title}
                  </Link>

                  <div className={styles.metaRow}>
                    <span className={styles.ratingBadge}>
                      <FaStar style={{ fontSize: '0.7rem' }} />
                      <span>{safeRating}</span>
                    </span>
                    <span className={styles.yearText}>{movieYear}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <ToastContainer position="top-right" autoClose={2500} theme="dark" />
    </div>
  );

  if (inProfilePage) return mainContent;

  return (
    <div className={styles.favoritesPage}>
      <Head>
        <title>Phim Yêu Thích Của Tôi | Movie Stream</title>
        <meta
          name="description"
          content="Danh sách các bộ phim yêu thích của bạn trên Movie Stream."
        />
      </Head>
      {mainContent}
    </div>
  );
}
