import React, { useState, useEffect } from 'react';
import Navbar from '../components/Layout/Navbar';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '../utils/auth';
import watchlistService from '../API/services/watchlistService';
import styles from '../styles/Favorites.module.css'; // Reuse the favorites styles

const WatchLater = ({ inProfilePage = false }) => {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirmClearModal, setConfirmClearModal] = useState(false);
  const [sortOption, setSortOption] = useState('newest');
  const [multiSelectMode, setMultiSelectMode] = useState(false);
  const [selectedMovies, setSelectedMovies] = useState([]);
  const { isAuthenticated, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated && !inProfilePage) {
      router.push('/auth/login');
      return;
    }

    fetchWatchlist();
  }, [isAuthenticated, router, inProfilePage]);

  const fetchWatchlist = async () => {
    try {
      setLoading(true);
      const watchlistMovies = await watchlistService.getWatchlist();
      setMovies(watchlistMovies);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching watchlist:', error);
      toast.error('Không thể tải danh sách xem sau');
      setLoading(false);
    }
  };

  const handleRemoveMovie = async (movieId) => {
    try {
      const result = await watchlistService.removeFromWatchlist(movieId);
      
      if (result.success) {
        setMovies(movies.filter(movie => movie.id !== movieId));
        toast.success(result.message || 'Đã xóa phim khỏi danh sách xem sau');
      } else {
        toast.error(result.message || 'Không thể xóa phim khỏi danh sách xem sau');
      }
    } catch (error) {
      console.error('Error removing movie from watchlist:', error);
      toast.error('Có lỗi xảy ra khi xóa phim khỏi danh sách xem sau');
    }
  };

  const handleClearWatchlist = async () => {
    try {
      const result = await watchlistService.clearWatchlist();
      
      if (result.success) {
        setMovies([]);
        toast.success(result.message || 'Đã xóa tất cả phim trong danh sách xem sau');
      } else {
        toast.error(result.message || 'Không thể xóa danh sách xem sau');
      }
      setConfirmClearModal(false);
    } catch (error) {
      console.error('Error clearing watchlist:', error);
      toast.error('Có lỗi xảy ra khi xóa danh sách xem sau');
      setConfirmClearModal(false);
    }
  };

  const handleToggleSelectMode = () => {
    setMultiSelectMode(!multiSelectMode);
    setSelectedMovies([]);
  };

  const handleSelectMovie = (movieId) => {
    if (selectedMovies.includes(movieId)) {
      setSelectedMovies(selectedMovies.filter(id => id !== movieId));
    } else {
      setSelectedMovies([...selectedMovies, movieId]);
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedMovies.length === 0) {
      toast.info('Vui lòng chọn ít nhất một phim để xóa');
      return;
    }

    try {
      const deletionPromises = selectedMovies.map(movieId => 
        watchlistService.removeFromWatchlist(movieId)
      );
      
      await Promise.all(deletionPromises);
      
      setMovies(movies.filter(movie => !selectedMovies.includes(movie.id)));
      setSelectedMovies([]);
      toast.success(`Đã xóa ${selectedMovies.length} phim khỏi danh sách xem sau`);
      
      // Exit multi-select mode if all movies are deleted
      if (selectedMovies.length === movies.length) {
        setMultiSelectMode(false);
      }
    } catch (error) {
      console.error('Error removing multiple movies:', error);
      toast.error('Có lỗi xảy ra khi xóa các phim đã chọn');
    }
  };

  const sortMovies = (movies) => {
    if (!movies) return [];
    
    switch (sortOption) {
      case 'newest':
        return [...movies].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
      case 'oldest':
        return [...movies].sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0));
      case 'name_asc':
        return [...movies].sort((a, b) => (a.title || '').localeCompare(b.title || ''));
      case 'name_desc':
        return [...movies].sort((a, b) => (b.title || '').localeCompare(a.title || ''));
      case 'rating':
        return [...movies].sort((a, b) => (b.rating || 0) - (a.rating || 0));
      default:
        return movies;
    }
  };

  const sortedMovies = sortMovies(movies);

  const mainContent = (
    <>
      <div className={inProfilePage ? "" : "container mt-5 pt-5"} style={{ marginTop: '40px' }}>
        <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap">
          {!inProfilePage && <h2 className="text-white">Danh Sách Xem Sau</h2>}
          {inProfilePage && <h3 className="section-header">Danh sách xem sau</h3>}
          
          <div className="d-flex gap-2 mt-2 mt-md-0">
            {movies.length > 0 && (
              <>
                <div className="dropdown">
                  <button 
                    className="btn btn-outline-light dropdown-toggle"
                    type="button"
                    id="sortDropdown"
                    data-bs-toggle="dropdown"
                    aria-expanded="false"
                  >
                    <i className="bi bi-sort-down me-1"></i> 
                    {sortOption === 'newest' && 'Mới nhất'}
                    {sortOption === 'oldest' && 'Cũ nhất'}
                    {sortOption === 'name_asc' && 'Tên A-Z'}
                    {sortOption === 'name_desc' && 'Tên Z-A'}
                    {sortOption === 'rating' && 'Đánh giá cao nhất'}
                  </button>
                  <ul className="dropdown-menu dropdown-menu-dark" aria-labelledby="sortDropdown">
                    <li><button 
                      className="dropdown-item" 
                      onClick={() => setSortOption('newest')}
                    >Mới nhất</button></li>
                    <li><button 
                      className="dropdown-item" 
                      onClick={() => setSortOption('oldest')}
                    >Cũ nhất</button></li>
                    <li><button 
                      className="dropdown-item" 
                      onClick={() => setSortOption('name_asc')}
                    >Tên A-Z</button></li>
                    <li><button 
                      className="dropdown-item" 
                      onClick={() => setSortOption('name_desc')}
                    >Tên Z-A</button></li>
                    <li><button 
                      className="dropdown-item" 
                      onClick={() => setSortOption('rating')}
                    >Đánh giá cao nhất</button></li>
                  </ul>
                </div>

                <button 
                  className={`btn ${multiSelectMode ? 'btn-danger' : 'btn-outline-light'}`}
                  onClick={handleToggleSelectMode}
                >
                  <i className="bi bi-check-square me-1"></i> Chọn nhiều
                </button>

                {!multiSelectMode && (
                  <button 
                    className="btn btn-outline-danger"
                    onClick={() => setConfirmClearModal(true)}
                  >
                    Xóa tất cả
                  </button>
                )}

                {multiSelectMode && (
                  <button 
                    className="btn btn-danger"
                    onClick={handleDeleteSelected}
                    disabled={selectedMovies.length === 0}
                  >
                    Xóa đã chọn ({selectedMovies.length})
                  </button>
                )}
              </>
            )}
            
            <button 
              className={inProfilePage ? "refresh-button ms-2" : "btn btn-outline-primary"}
              onClick={fetchWatchlist}
            >
              <i className="bi bi-arrow-clockwise me-1"></i> Làm mới
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
          <div className="row row-cols-2 row-cols-md-3 row-cols-lg-4 row-cols-xl-5 g-4">
            {sortedMovies.map(movie => (
              <div key={movie.id} className="col">
                <div className={styles.movieCard}>
                  <div className={styles.movieImageContainer}>
                    {multiSelectMode && (
                      <div 
                        className="position-absolute top-0 start-0 m-2"
                        style={{zIndex: 10}}
                        onClick={() => handleSelectMovie(movie.id)}
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
                              style={{
                                position: 'absolute',
                                top: '50%',
                                left: '50%',
                                transform: 'translate(-50%, -50%)',
                                color: 'white',
                                fontSize: '14px'
                              }}
                            ></i>
                          )}
                        </div>
                      </div>
                    )}
                    <Link href={`/movie/${movie.slug}`}>
                      <img 
                        src={movie.thumbnail || '/img/Phim.png'} 
                        alt={movie.title} 
                        className={styles.movieImage}
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = '/img/Phim.png';
                        }}
                      />
                    </Link>
                    <div className={styles.movieOverlay}>
                      {!multiSelectMode && (
                        <>
                          <button 
                            className={styles.removeButton}
                            onClick={() => handleRemoveMovie(movie.id)}
                          >
                            <i className="bi bi-x-circle-fill"></i>
                          </button>
                          <Link 
                            href={`/movie/${movie.slug}`} 
                            className={styles.watchButton}
                          >
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
                          <i className="bi bi-calendar-event-fill"></i> {movie.year}
                        </span>
                      )}
                      {movie.duration && (
                        <span className={styles.movieMeta}>
                          <i className="bi bi-clock-fill"></i> {movie.duration}
                        </span>
                      )}
                      {movie.quality && (
                        <span className={`${styles.movieMeta} ${styles.quality}`}>
                          {movie.quality}
                        </span>
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
              <Link href="/" className="btn btn-primary">
                Khám phá phim
              </Link>
            </div>
          </div>
        )}
      </div>
      
      {/* Confirm Clear Modal */}
      {confirmClearModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h5>Xác nhận</h5>
              <button 
                type="button" 
                className="btn-close btn-close-white"
                onClick={() => setConfirmClearModal(false)}
              ></button>
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

  // Nếu component được sử dụng trong Profile, chỉ trả về nội dung, không bao gồm Navbar
  if (inProfilePage) {
    return mainContent;
  }

  // Trường hợp sử dụng như một trang độc lập
  return (
    <div className={styles.container}>
      {mainContent}
      <ToastContainer position="bottom-right" />
    </div>
  );
};

export default WatchLater;