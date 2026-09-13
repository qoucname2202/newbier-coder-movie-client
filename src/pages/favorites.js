import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Navbar from '../components/Layout/Navbar';
import { FaHeart, FaTimes, FaPlay, FaStar, FaSort, FaFilter, FaSync, FaTrash, FaCheckSquare, FaSquare, FaAngleDown } from 'react-icons/fa';
import favoritesService from '../API/services/favoritesService';
import { useAuth } from '../utils/auth';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import styles from '../styles/Favorites.module.css';

export default function FavoritesPage({ inProfilePage = false }) {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [isDeleting, setIsDeleting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedItems, setSelectedItems] = useState([]);
  const [selectMode, setSelectMode] = useState(false);
  const [sortOption, setSortOption] = useState('newest');
  const [showSortOptions, setShowSortOptions] = useState(false);
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated && !inProfilePage) {
      router.push('/auth/login');
      return;
    }

    fetchFavorites();
  }, [isAuthenticated, router, inProfilePage]);

  const fetchFavorites = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Fetching favorites...');
      
      const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
      console.log('Token exists:', !!token);
      
      if (!token) {
        setError('Bạn cần đăng nhập để xem danh sách yêu thích');
        setLoading(false);
        return;
      }
      
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
      console.log('Calling API at:', `${apiUrl}/favorites`);
      
      const response = await fetch(`${apiUrl}/favorites`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        credentials: 'include'
      });
      
      console.log('Response status:', response.status);
      
      const rawText = await response.text();
      console.log('Raw response:', rawText);
      
      let data;
      try {
        data = JSON.parse(rawText);
        console.log('Parsed data:', data);
      } catch (parseError) {
        console.error('Error parsing JSON:', parseError);
        setError('Lỗi xử lý dữ liệu từ server');
        setLoading(false);
        return;
      }
      
      if (data && (data.statusCode === 200 || response.status === 200)) {
        console.log('API returned success response with status:', data.statusCode || response.status);
        
        if (data.data && Array.isArray(data.data)) {
          console.log('Found array data with length:', data.data.length);
          
          const normalizedFavorites = data.data.map(movie => ({
            id: movie.id || movie._id || '',
            title: movie.title || movie.name || 'Không có tiêu đề',
            original_title: movie.original_title || movie.origin_name || '',
            slug: movie.slug || '',
            thumbnail: movie.thumbnail || movie.thumb_url || '',
            year: movie.year || new Date().getFullYear(),
            quality: movie.quality || 'HD',
            rating: movie.rating || 0,
            type: movie.type || 'movie',
            dateAdded: movie.createdAt || new Date().toISOString()
          }));
          
          normalizedFavorites.forEach((movie, index) => {
            console.log(`Normalized Movie ${index + 1}:`, JSON.stringify(movie));
          });
          
          setFavorites(normalizedFavorites);
          console.log('Updated favorites state with', normalizedFavorites.length, 'movies');
        } else {
          console.warn('Data is not in expected format:', data);
          setFavorites([]);
        }
      } else {
        console.error('API response indicates error:', data);
        setError(data.message || 'Không thể tải danh sách yêu thích');
        setFavorites([]);
      }
    } catch (error) {
      console.error('Error in fetchFavorites:', error);
      setError('Có lỗi xảy ra khi tải danh sách yêu thích: ' + error.message);
      setFavorites([]);
    } finally {
      setLoading(false);
      // Reset selection mode when refreshing
      setSelectMode(false);
      setSelectedItems([]);
    }
  };

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      toast.info('Đang làm mới danh sách yêu thích...', { autoClose: 1500 });
      await fetchFavorites();
      toast.success('Danh sách yêu thích đã được làm mới!');
    } catch (error) {
      console.error('[FAVORITES] Error refreshing:', error);
      toast.error('Không thể làm mới danh sách yêu thích');
    } finally {
      setRefreshing(false);
    }
  };

  const handleRemoveFavorite = async (movie) => {
    try {
      setIsDeleting(true);
      const movieId = movie.id;
      console.log('[FAVORITES] Removing movie:', movieId);
      
      // Cập nhật UI ngay lập tức trước khi gọi API
      setFavorites(prevFavs => prevFavs.filter(m => m.id !== movieId));
      
      // Gọi API để xóa trong backend
      const result = await favoritesService.removeFromFavorites(movieId);
      
      if (result.success) {
        toast.success('Đã xóa phim khỏi danh sách yêu thích!', {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true
        });
      } else {
        // Nếu API gọi thất bại, khôi phục lại danh sách
        toast.error(result.message || 'Không thể xóa phim khỏi danh sách yêu thích');
        // Tải lại danh sách để đảm bảo dữ liệu chính xác
        fetchFavorites();
      }
    } catch (error) {
      console.error('[FAVORITES] Error removing movie:', error);
      toast.error('Có lỗi xảy ra khi xóa phim khỏi danh sách yêu thích');
      // Tải lại danh sách để đảm bảo dữ liệu chính xác
      fetchFavorites();
    } finally {
      setIsDeleting(false);
    }
  };

  const toggleSelectMode = () => {
    setSelectMode(!selectMode);
    setSelectedItems([]);
  };

  const toggleSelectItem = (movieId) => {
    setSelectedItems(prev => {
      if (prev.includes(movieId)) {
        return prev.filter(id => id !== movieId);
      } else {
        return [...prev, movieId];
      }
    });
  };

  const selectAll = () => {
    if (filteredList.length === selectedItems.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(filteredList.map(movie => movie.id));
    }
  };

  const handleRemoveSelected = async () => {
    if (selectedItems.length === 0) {
      toast.warning('Vui lòng chọn ít nhất một phim để xóa');
      return;
    }

    if (window.confirm(`Bạn có chắc chắn muốn xóa ${selectedItems.length} phim đã chọn khỏi danh sách yêu thích?`)) {
      try {
        setIsDeleting(true);
        
        let successCount = 0;
        let errorCount = 0;
        
        // Xóa từng phim đã chọn
        for (const movieId of selectedItems) {
          try {
            const result = await favoritesService.removeFromFavorites(movieId);
            if (result.success) {
              successCount++;
            } else {
              errorCount++;
              console.error(`Error removing movie ${movieId}:`, result.message);
            }
          } catch (error) {
            errorCount++;
            console.error(`Error removing movie ${movieId}:`, error);
          }
        }
        
        // Cập nhật danh sách
        setFavorites(prevFavs => prevFavs.filter(movie => !selectedItems.includes(movie.id)));
        setSelectedItems([]);
        
        // Thông báo kết quả
        if (successCount > 0 && errorCount === 0) {
          toast.success(`Đã xóa ${successCount} phim khỏi danh sách yêu thích!`);
        } else if (successCount > 0 && errorCount > 0) {
          toast.warning(`Đã xóa ${successCount} phim, nhưng không thể xóa ${errorCount} phim`);
        } else {
          toast.error('Không thể xóa các phim đã chọn');
        }
      } catch (error) {
        console.error('[FAVORITES] Error removing selected movies:', error);
        toast.error('Có lỗi xảy ra khi xóa các phim đã chọn');
      } finally {
        setIsDeleting(false);
        setSelectMode(false);
      }
    }
  };

  const handleSortChange = (option) => {
    setSortOption(option);
    setShowSortOptions(false);
  };

  const sortFavorites = (movies) => {
    if (!Array.isArray(movies)) return [];
    
    switch (sortOption) {
      case 'a-z':
        return [...movies].sort((a, b) => a.title.localeCompare(b.title));
      case 'z-a':
        return [...movies].sort((a, b) => b.title.localeCompare(a.title));
      case 'highest-rating':
        return [...movies].sort((a, b) => b.rating - a.rating);
      case 'lowest-rating':
        return [...movies].sort((a, b) => a.rating - b.rating);
      case 'newest':
        return [...movies].sort((a, b) => new Date(b.dateAdded) - new Date(a.dateAdded));
      case 'oldest':
        return [...movies].sort((a, b) => new Date(a.dateAdded) - new Date(b.dateAdded));
      case 'year-desc':
        return [...movies].sort((a, b) => b.year - a.year);
      case 'year-asc':
        return [...movies].sort((a, b) => a.year - b.year);
      default:
        return movies;
    }
  };

  const filteredFavorites = () => {
    if (!Array.isArray(favorites)) {
      console.warn('Favorites is not an array:', favorites);
      return [];
    }
    
    if (selectedFilter === 'all') return favorites;
    
    if (selectedFilter === 'movie') {
      return favorites.filter(movie => movie.type === 'movie' || movie.type === 'single');
    }
    
    if (selectedFilter === 'series') {
      return favorites.filter(movie => movie.type === 'series' || movie.type === 'tv');
    }
    
    return favorites;
  };

  const filteredList = sortFavorites(filteredFavorites());
  console.log('Filtered favorites count:', filteredList?.length || 0);

  // Render sort option name
  const getSortOptionName = () => {
    switch (sortOption) {
      case 'a-z': return 'A-Z';
      case 'z-a': return 'Z-A';
      case 'highest-rating': return 'Đánh giá cao nhất';
      case 'lowest-rating': return 'Đánh giá thấp nhất';
      case 'newest': return 'Mới nhất';
      case 'oldest': return 'Cũ nhất';
      case 'year-desc': return 'Năm mới nhất';
      case 'year-asc': return 'Năm cũ nhất';
      default: return 'Mới nhất';
    }
  };

  const mainContent = (
    <>
      <div className={inProfilePage ? "" : "container mt-5 pt-5"} style={{ marginTop: '30px' }}>
        <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap">
          {!inProfilePage && <h2 className="text-white">Phim yêu thích</h2>}
          {inProfilePage && <h3 className="section-header" style={{ marginTop: '20px' }}>Phim yêu thích</h3>}
          
          <div className="d-flex flex-wrap gap-2" >
            <button 
              className={inProfilePage ? "refresh-button" : "btn btn-outline-light d-flex align-items-center"} 
              onClick={handleRefresh}
              disabled={refreshing}
            >
              <FaSync className={`me-2 ${refreshing ? 'spin' : ''}`} /> 
              {refreshing ? 'Đang làm mới' : 'Làm mới'}
            </button>
            
            {!loading && filteredList.length > 0 && (
              <>
                <div className="dropdown">
                  <button 
                    className="btn btn-outline-light dropdown-toggle"
                    type="button"
                    id="sortDropdown"
                    data-bs-toggle="dropdown"
                    aria-expanded="false"
                  >
                    <FaSort className="me-1" /> {getSortOptionName()}
                  </button>
                  <ul className="dropdown-menu dropdown-menu-dark" aria-labelledby="sortDropdown">
                    <li><button className="dropdown-item" onClick={() => handleSortChange('newest')}>Mới nhất</button></li>
                    <li><button className="dropdown-item" onClick={() => handleSortChange('oldest')}>Cũ nhất</button></li>
                    <li><button className="dropdown-item" onClick={() => handleSortChange('a-z')}>A-Z</button></li>
                    <li><button className="dropdown-item" onClick={() => handleSortChange('z-a')}>Z-A</button></li>
                    <li><button className="dropdown-item" onClick={() => handleSortChange('highest-rating')}>Đánh giá cao nhất</button></li>
                    <li><button className="dropdown-item" onClick={() => handleSortChange('lowest-rating')}>Đánh giá thấp nhất</button></li>
                    <li><button className="dropdown-item" onClick={() => handleSortChange('year-desc')}>Năm mới nhất</button></li>
                    <li><button className="dropdown-item" onClick={() => handleSortChange('year-asc')}>Năm cũ nhất</button></li>
                  </ul>
                </div>
                
                <button 
                  className={`btn ${selectMode ? 'btn-danger' : 'btn-outline-light'} d-flex align-items-center`}
                  onClick={toggleSelectMode}
                >
                  <FaCheckSquare className="me-2" /> Chọn nhiều
                </button>
                
                {selectMode && (
                  <button 
                    className="btn btn-danger"
                    onClick={handleRemoveSelected}
                    disabled={selectedItems.length === 0}
                  >
                    Xóa đã chọn ({selectedItems.length})
                  </button>
                )}
              </>
            )}
          </div>
        </div>
        
        <div className="filter-buttons mb-4">
          <button 
            className={`btn ${selectedFilter === 'all' ? 'btn-danger' : 'btn-outline-danger'} me-2 mb-2 mb-md-0`}
            onClick={() => setSelectedFilter('all')}
          >
            Tất cả
          </button>
          <button 
            className={`btn ${selectedFilter === 'movie' ? 'btn-danger' : 'btn-outline-danger'} me-2 mb-2 mb-md-0`}
            onClick={() => setSelectedFilter('movie')}
          >
            Phim lẻ
          </button>
          <button 
            className={`btn ${selectedFilter === 'series' ? 'btn-danger' : 'btn-outline-danger'} mb-2 mb-md-0`}
            onClick={() => setSelectedFilter('series')}
          >
            Phim bộ
          </button>
        </div>
        
        {loading ? (
          <div className="text-center py-5 my-5">
            <div className="spinner-border text-danger" role="status" style={{ width: '3rem', height: '3rem' }}>
              <span className="visually-hidden">Đang tải...</span>
            </div>
            <p className="text-white mt-3">Đang tải danh sách yêu thích...</p>
          </div>
        ) : error ? (
          <div className="text-center py-5 my-5">
            <div className="mb-4 text-warning" style={{ fontSize: '4rem' }}>
              <FaHeart />
            </div>
            <h3 className="text-white mb-3">Đã xảy ra lỗi khi tải danh sách yêu thích</h3>
            <p className="text-white bg-danger bg-opacity-25 p-3 rounded d-inline-block">{error}</p>
            <div className="mt-4 d-flex justify-content-center flex-wrap gap-2">
              <button
                className="btn btn-danger"
                onClick={handleRefresh}
                disabled={refreshing}
              >
                <FaSync className={`me-2 ${refreshing ? 'spin' : ''}`} /> 
                Thử lại
              </button>
              <Link href="/" className="btn btn-outline-light">
                Về trang chủ
              </Link>
            </div>
          </div>
        ) : filteredList.length === 0 ? (
          <div className={styles.emptyStateContainer}>
            <i className="bi bi-heart-fill display-1 text-danger mb-3"></i>
            <h4 className="text-white">Danh sách yêu thích trống</h4>
            <p className="text-muted">Bạn chưa có phim nào trong danh sách yêu thích</p>
            <Link href="/" className="btn btn-danger">
              Khám phá phim
            </Link>
          </div>
        ) : (
          <div className="row row-cols-2 row-cols-md-3 row-cols-lg-4 row-cols-xl-5 g-4">
            {filteredList.map(movie => (
              <div key={movie.id} className="col">
                <div className={styles.movieCard}>
                  <div className={styles.movieImageContainer}>
                    {selectMode && (
                      <div 
                        className="position-absolute top-0 start-0 m-2"
                        style={{zIndex: 10}}
                        onClick={() => toggleSelectItem(movie.id)}
                      >
                        <div 
                          style={{
                            width: '22px',
                            height: '22px',
                            border: selectedItems.includes(movie.id) ? '2px solid #dc3545' : '2px solid #fff',
                            backgroundColor: selectedItems.includes(movie.id) ? '#dc3545' : 'transparent',
                            borderRadius: '3px',
                            cursor: 'pointer',
                            position: 'relative'
                          }}
                        >
                          {selectedItems.includes(movie.id) && (
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
                      {!selectMode && (
                        <>
                          <button 
                            className={styles.removeButton}
                            onClick={() => handleRemoveFavorite(movie)}
                          >
                            <i className="bi bi-trash"></i>
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
                      {movie.type && (
                        <span className={styles.movieMeta}>
                          {movie.type === 'series' || movie.type === 'tv' ? 'Phim bộ' : 'Phim lẻ'}
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
        )}
      </div>
      
      <ToastContainer position="top-right" autoClose={3000} />
    </>
  );

  if (inProfilePage) {
    return mainContent;
  }

  return (
    <div className="bg-black min-vh-100">
      {mainContent}
    </div>
  );
}