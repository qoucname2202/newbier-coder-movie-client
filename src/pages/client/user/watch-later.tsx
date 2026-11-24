/**
 * @file pages/user/watch-later.tsx
 */
import React, { useState, useEffect, useMemo, MouseEvent } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '@/context/AuthContext';
import watchlistService from '@/API/services/watchlistService';
import { formatYear } from '@/utils/taxonomy';
import styles from '@/styles/Favorites.module.css';

type SortOption = 'newest' | 'oldest' | 'name_asc' | 'name_desc' | 'rating';

interface WatchLaterMovie {
  id: string;
  title: string;
  original_title?: string;
  slug: string;
  thumbnail?: string;
  year?: number;
  duration?: string;
  quality?: string;
  rating?: number;
  createdAt?: string;
  [key: string]: unknown;
}

interface WatchlistServiceResult {
  success: boolean;
  message?: string;
}

const WatchLater = ({ inProfilePage = false }: { inProfilePage?: boolean }) => {
  const [movies, setMovies] = useState<WatchLaterMovie[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [confirmClearModal, setConfirmClearModal] = useState<boolean>(false);
  const [sortOption, setSortOption] = useState<SortOption>('newest');
  const [multiSelectMode, setMultiSelectMode] = useState<boolean>(false);
  const [selectedMovies, setSelectedMovies] = useState<string[]>([]);
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated && !inProfilePage) {
      router.push('/auth/login');
      return;
    }
    fetchWatchlist();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, router, inProfilePage]);

  const fetchWatchlist = async (): Promise<void> => {
    try {
      setLoading(true);
      const watchlistMovies = (await watchlistService.getWatchlist()) as WatchLaterMovie[];
      setMovies(watchlistMovies);
    } catch (err) {

      toast.error('Không thể tải danh sách xem sau');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveMovie = async (movieId: string): Promise<void> => {
    try {
      const result = (await watchlistService.removeFromWatchlist(movieId)) as WatchlistServiceResult;
      if (result.success) {
        setMovies((prev) => prev.filter((m) => m.id !== movieId));
        toast.success(result.message || 'Đã xóa phim khỏi danh sách xem sau');
      } else {
        toast.error(result.message || 'Không thể xóa phim khỏi danh sách xem sau');
      }
    } catch (err) {

      toast.error('Có lỗi xảy ra khi xóa phim khỏi danh sách xem sau');
    }
  };

  const handleClearWatchlist = async (): Promise<void> => {
    try {
      const result = (await watchlistService.clearWatchlist()) as WatchlistServiceResult;
      if (result.success) {
        setMovies([]);
        toast.success(result.message || 'Đã xóa tất cả phim trong danh sách xem sau');
      } else {
        toast.error(result.message || 'Không thể xóa danh sách xem sau');
      }
    } catch (err) {

      toast.error('Có lỗi xảy ra khi xóa danh sách xem sau');
    } finally {
      setConfirmClearModal(false);
    }
  };

  const handleToggleSelectMode = (): void => {
    setMultiSelectMode((p) => !p);
    setSelectedMovies([]);
  };

  const handleSelectMovie = (movieId: string): void => {
    setSelectedMovies((prev) =>
      prev.includes(movieId) ? prev.filter((id) => id !== movieId) : [...prev, movieId]
    );
  };

  const handleDeleteSelected = async (): Promise<void> => {
    if (selectedMovies.length === 0) {
      toast.info('Vui lòng chọn ít nhất một phim để xóa');
      return;
    }
    try {
      const promises = selectedMovies.map((id) => watchlistService.removeFromWatchlist(id));
      await Promise.all(promises);
      setMovies((prev) => prev.filter((m) => !selectedMovies.includes(m.id)));
      setSelectedMovies([]);
      toast.success(`Đã xóa ${selectedMovies.length} phim khỏi danh sách xem sau`);
      if (selectedMovies.length === movies.length) setMultiSelectMode(false);
    } catch (err) {

      toast.error('Có lỗi xảy ra khi xóa các phim đã chọn');
    }
  };

  const sortMovies = (list: WatchLaterMovie[]): WatchLaterMovie[] => {
    if (!list) return [];
    const copy = [...list];
    switch (sortOption) {
      case 'newest': return copy.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      case 'oldest': return copy.sort((a, b) => new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime());
      case 'name_asc': return copy.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
      case 'name_desc': return copy.sort((a, b) => (b.title || '').localeCompare(a.title || ''));
      case 'rating': return copy.sort((a, b) => (b.rating || 0) - (a.rating || 0));
      default: return copy;
    }
  };

  const sortedMovies: WatchLaterMovie[] = useMemo(() => sortMovies(movies), [movies, sortOption]);

  const sortLabel = (opt: SortOption): string => {
    switch (opt) {
      case 'newest': return 'Mới nhất';
      case 'oldest': return 'Cũ nhất';
      case 'name_asc': return 'Tên A-Z';
      case 'name_desc': return 'Tên Z-A';
      case 'rating': return 'Đánh giá cao nhất';
    }
  };

  const handleImgError = (e: MouseEvent<HTMLImageElement>): void => {
    e.currentTarget.onerror = null;
    e.currentTarget.src = '/img/Phim.png';
  };

  const mainContent = (
    <>
      <div className={inProfilePage ? '' : 'container pt-3 pb-5'}>
        <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap">
          {!inProfilePage && <h1 className="h2 text-white mb-0">Danh Sách Xem Sau</h1>}
          {inProfilePage && <h3 className="section-header">Danh sách xem sau</h3>}

          <div className="d-flex gap-2 mt-2 mt-md-0">
            {movies.length > 0 && (
              <>
                <div className="dropdown">
                  <button
                    className="btn btn-outline-light dropdown-toggle"
                    type="button"
                    data-bs-toggle="dropdown"
                    aria-expanded="false"
                  >
                    {sortLabel(sortOption)}
                  </button>
                  <ul className="dropdown-menu dropdown-menu-dark">
                    {(['newest', 'oldest', 'name_asc', 'name_desc', 'rating'] as SortOption[]).map((opt) => (
                      <li key={opt}>
                        <button className="dropdown-item" onClick={() => setSortOption(opt)} type="button">
                          {sortLabel(opt)}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>

                <button
                  className={`btn ${multiSelectMode ? 'btn-danger' : 'btn-outline-light'}`}
                  onClick={handleToggleSelectMode}
                  type="button"
                >
                  Chọn nhiều
                </button>

                {!multiSelectMode && (
                  <button
                    className="btn btn-outline-danger"
                    onClick={() => setConfirmClearModal(true)}
                    type="button"
                  >
                    Xóa tất cả
                  </button>
                )}

                {multiSelectMode && (
                  <button
                    className="btn btn-danger"
                    onClick={handleDeleteSelected}
                    disabled={selectedMovies.length === 0}
                    type="button"
                  >
                    Xóa đã chọn ({selectedMovies.length})
                  </button>
                )}
              </>
            )}

            <button
              className={inProfilePage ? 'refresh-button ms-2' : 'btn btn-outline-primary'}
              onClick={fetchWatchlist}
              type="button"
            >
              Làm mới
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-center my-5">
            <div className="spinner-border text-light" role="status">
              <span className="visually-hidden">Đang tải...</span>
            </div>
            <p className="text-white mt-3">Đang tải danh sách xem sau...</p>
          </div>
        ) : sortedMovies.length > 0 ? (
          <div className="row row-cols-2 row-cols-sm-3 row-cols-md-3 row-cols-lg-4 row-cols-xl-5 row-cols-xxl-6 g-3 g-md-4">
            {sortedMovies.map((movie) => (
              <div key={movie.id} className="col">
                <div className={styles.movieCard}>
                  <div className={styles.movieImageContainer}>
                    {multiSelectMode && (
                      <div
                        className="position-absolute top-0 start-0 m-2"
                        style={{ zIndex: 10 }}
                        onClick={() => handleSelectMovie(movie.id)}
                        role="checkbox"
                        aria-checked={selectedMovies.includes(movie.id)}
                      >
                        <div
                          style={{
                            width: '22px',
                            height: '22px',
                            border: selectedMovies.includes(movie.id) ? '2px solid #dc3545' : '2px solid #fff',
                            backgroundColor: selectedMovies.includes(movie.id) ? '#dc3545' : 'transparent',
                            borderRadius: '3px',
                            cursor: 'pointer',
                            position: 'relative'
                          }}
                        >
                          {selectedMovies.includes(movie.id) && (
                            <i className="bi bi-check"
                              style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', color: 'white', fontSize: '14px' }}
                            />
                          )}
                        </div>
                      </div>
                    )}
                    <Link href={`/movie/${movie.slug}`}>
                      <img
                        src={movie.thumbnail || '/img/Phim.png'}
                        alt={movie.title}
                        className={styles.movieImage}
                        onError={handleImgError}
                      />
                    </Link>
                    <div className={styles.movieOverlay}>
                      {!multiSelectMode && (
                        <>
                          <button
                            className={styles.removeButton}
                            onClick={() => handleRemoveMovie(movie.id)}
                            type="button"
                            aria-label="Remove"
                          >
                            <i className="bi bi-x-circle-fill"></i>
                          </button>
                          <Link href={`/movie/${movie.slug}`} className={styles.watchButton}>
                            <i className="bi bi-play-fill"></i>
                          </Link>
                        </>
                      )}
                    </div>
                  </div>
                  <div className={styles.movieInfo}>
                    <h5 className={styles.movieTitle}>{movie.title}</h5>
                    {movie.original_title && (
                      <p className={styles.movieOriginalTitle}>{movie.original_title}</p>
                    )}
                    <div className={styles.movieMetaContainer}>
                      {movie.year && (
                        <span className={styles.movieMeta}>
                          <i className="bi bi-calendar-event-fill"></i> {formatYear(movie.year)}
                        </span>
                      )}
                      {movie.duration && (
                        <span className={styles.movieMeta}>
                          <i className="bi bi-clock-fill"></i> {movie.duration}
                        </span>
                      )}
                      {movie.quality && (
                        <span className={`${styles.movieMeta} ${styles.quality}`}>{movie.quality}</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center my-5">
            <div className={styles.emptyStateContainer}>
              <i className="bi bi-clock-history display-1 text-secondary mb-3"></i>
              <h4 className="text-white">Danh sách xem sau trống</h4>
              <p className="text-muted">Bạn chưa có phim nào trong danh sách xem sau</p>
              <Link href="/" className="btn btn-primary">Khám phá phim</Link>
            </div>
          </div>
        )}
      </div>

      {confirmClearModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h5>Xác nhận</h5>
              <button
                type="button"
                className="btn-close btn-close-white"
                onClick={() => setConfirmClearModal(false)}
                aria-label="Close"
              />
            </div>
            <div className={styles.modalBody}>
              <p>Bạn có chắc chắn muốn xóa tất cả phim khỏi danh sách xem sau?</p>
              <p className="text-danger">Hành động này không thể hoàn tác.</p>
            </div>
            <div className={styles.modalFooter}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setConfirmClearModal(false)}
              >
                Hủy
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={handleClearWatchlist}
              >
                Xóa tất cả
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );

  if (inProfilePage) return mainContent;
  return (
    <div className={styles.container}>
      {mainContent}
      <ToastContainer position="bottom-right" />
    </div>
  );
};

export default WatchLater;
