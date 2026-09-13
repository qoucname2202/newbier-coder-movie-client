// filepath: d:\Web\MovieStreaming\frontend\src\components\WatchLaterContent.js
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { FaClock, FaTimes, FaPlay, FaStar, FaFilm, FaSync, FaTrash } from 'react-icons/fa';
import watchLaterService from '../API/services/watchLaterService';
import { toast } from 'react-toastify';
import { motion } from 'framer-motion';

export function WatchLaterContent({ inProfilePage = true }) {
  const [watchLaterList, setWatchLaterList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');

  useEffect(() => {
    fetchWatchLaterList();
  }, []);

  const fetchWatchLaterList = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Fetching watch later list...');
      
      const data = await watchLaterService.getWatchLaterList();
      console.log('Watch later data:', data);
      
      setWatchLaterList(data || []);
    } catch (error) {
      console.error('Error in fetchWatchLaterList:', error);
      setError('Có lỗi xảy ra khi tải danh sách xem sau: ' + error.message);
      setWatchLaterList([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      await fetchWatchLaterList();
      toast.success('Danh sách xem sau đã được làm mới!');
    } catch (error) {
      console.error('[WATCH_LATER] Error refreshing:', error);
      toast.error('Không thể làm mới danh sách xem sau');
    } finally {
      setRefreshing(false);
    }
  };

  const handleRemoveWatchLater = async (movieId) => {
    try {
      setIsDeleting(true);
      console.log('[WATCH_LATER] Removing movie:', movieId);
      
      // Xóa phim khỏi state ngay lập tức để tạo UX mượt mà
      setWatchLaterList(prevList => prevList.filter(m => m.id !== movieId));
      
      const result = await watchLaterService.removeFromWatchLater(movieId);
      
      if (result.success) {
        toast.success('Đã xóa phim khỏi danh sách xem sau!');
      } else {
        // Nếu lỗi, hiện thông báo và thêm lại phim vào danh sách
        toast.error(result.message || 'Không thể xóa phim khỏi danh sách xem sau');
        fetchWatchLaterList(); // Tải lại danh sách để phục hồi trạng thái
      }
    } catch (error) {
      console.error('[WATCH_LATER] Error removing movie:', error);
      toast.error('Có lỗi xảy ra khi xóa phim khỏi danh sách xem sau');
      fetchWatchLaterList(); // Tải lại danh sách để phục hồi trạng thái
    } finally {
      setIsDeleting(false);
    }
  };

  // Lọc phim theo loại (tất cả, phim lẻ, phim bộ)
  const filteredWatchLater = watchLaterList.filter(movie => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'movie') return movie.type === 'movie' || movie.type === 'single';
    if (activeFilter === 'series') return movie.type === 'series' || movie.type === 'tv';
    return true;
  });

  return (
    <div className="watch-later-container">
      <div className="watch-later-header">
        <div className="watch-later-title">
          <FaClock className="watch-later-icon" />
          <h2>Xem sau</h2>
        </div>
        <div className="action-buttons">
          <button 
            className="action-btn refresh-btn"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <FaSync className={refreshing ? "spin" : ""} /> Làm mới
          </button>
        </div>
      </div>

      <div className="filter-buttons">
        <button 
          className={`filter-btn ${activeFilter === 'all' ? 'active' : ''}`}
          onClick={() => setActiveFilter('all')}
        >
          Tất cả
        </button>
        <button 
          className={`filter-btn ${activeFilter === 'movie' ? 'active' : ''}`}
          onClick={() => setActiveFilter('movie')}
        >
          Phim lẻ
        </button>
        <button 
          className={`filter-btn ${activeFilter === 'series' ? 'active' : ''}`}
          onClick={() => setActiveFilter('series')}
        >
          Phim bộ
        </button>
      </div>

      {loading ? (
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Đang tải danh sách xem sau...</p>
        </div>
      ) : error ? (
        <div className="error-state">
          <div className="error-icon">
            <FaClock />
          </div>
          <h3>Đã xảy ra lỗi khi tải danh sách xem sau</h3>
          <p>{error}</p>
          <button className="action-button" onClick={handleRefresh}>
            <FaSync /> Thử lại
          </button>
        </div>
      ) : filteredWatchLater.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">
            <FaClock />
          </div>
          <h3>Danh sách xem sau trống</h3>
          <p>Thêm phim vào danh sách xem sau để xem chúng ở đây.</p>
          <Link href="/" className="action-button">
            <FaFilm /> Khám phá phim
          </Link>
        </div>
      ) : (
        <div className="watch-later-grid">
          {filteredWatchLater.map((movie) => (
            <div key={movie.id} className="movie-card">
              <div className="movie-poster">
                <img 
                  src={movie.thumbnail} 
                  alt={movie.title}
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = "/img/Phim.png";
                  }}
                />
                <div className="movie-overlay">
                  <div className="movie-actions">
                    <Link href={`/movie/${movie.slug}`} className="movie-button play">
                      <div className="play-circle">
                        <FaPlay className="play-icon" />
                      </div>
                    </Link>
                    <button 
                      className="movie-button remove"
                      onClick={() => handleRemoveWatchLater(movie.id)}
                      disabled={isDeleting}
                    >
                      <FaTimes className="remove-icon" />
                    </button>
                  </div>
                </div>
                <div className="movie-rating">
                  <FaStar /> {movie.rating ? movie.rating.toFixed(1) : 'N/A'}
                </div>
                {movie.quality && (
                  <div className="movie-quality">
                    {movie.quality}
                  </div>
                )}
              </div>
              <h3 className="movie-title">{movie.title}</h3>
              <div className="movie-meta">
                <span className="movie-year">{movie.year || 'N/A'}</span>
                <span className="movie-type">
                  {movie.type === 'series' || movie.type === 'tv' ? 'Phim bộ' : 'Phim lẻ'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      <style jsx>{`
        .watch-later-container {
          width: 100%;
          padding: 10px 0;
        }
        
        .watch-later-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }
        
        .watch-later-title {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        
        .watch-later-icon {
          color: #e50914;
          font-size: 24px;
        }
        
        .watch-later-title h2 {
          font-size: 24px;
          font-weight: 600;
          margin: 0;
          color: #fff;
        }
        
        .action-buttons {
          display: flex;
          gap: 10px;
        }
        
        .action-btn {
          padding: 10px 15px;
          border: none;
          border-radius: 5px;
          display: flex;
          align-items: center;
          gap: 8px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .refresh-btn {
          background-color: rgba(255, 255, 255, 0.1);
          color: #fff;
        }
        
        .refresh-btn:hover {
          background-color: rgba(255, 255, 255, 0.2);
        }
        
        .filter-buttons {
          display: flex;
          gap: 10px;
          margin-bottom: 20px;
        }
        
        .filter-btn {
          padding: 8px 16px;
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 5px;
          background: transparent;
          color: #fff;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .filter-btn:hover {
          background: rgba(255, 255, 255, 0.1);
        }
        
        .filter-btn.active {
          background: #e50914;
          border-color: #e50914;
        }
        
        .loading-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 60px 20px;
        }
        
        .loading-spinner {
          width: 40px;
          height: 40px;
          border: 3px solid rgba(255, 255, 255, 0.2);
          border-top: 3px solid #e50914;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-bottom: 15px;
        }
        
        .error-state, .empty-state {
          text-align: center;
          padding: 50px 20px;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 12px;
        }
        
        .error-icon, .empty-icon {
          font-size: 60px;
          color: rgba(255, 255, 255, 0.2);
          margin-bottom: 20px;
        }
        
        .empty-state h3 {
          font-size: 24px;
          margin-bottom: 10px;
          color: #fff;
        }
        
        .empty-state p {
          font-size: 16px;
          color: #aaa;
          margin-bottom: 20px;
        }
        
        .action-button {
          background: #e50914;
          color: #fff;
          border: none;
          padding: 10px 20px;
          border-radius: 8px;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.2s ease;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          text-decoration: none;
        }
        
        .action-button:hover {
          background: #b80710;
        }
        
        .watch-later-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
          gap: 20px;
        }
        
        .movie-card {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 10px;
          overflow: hidden;
          transition: all 0.3s ease;
        }
        
        .movie-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 10px 20px rgba(0, 0, 0, 0.3);
        }
        
        .movie-poster {
          position: relative;
          padding-top: 150%; /* Aspect ratio 2:3 */
          overflow: hidden;
        }
        
        .movie-poster img {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.3s ease;
        }
        
        .movie-card:hover .movie-poster img {
          transform: scale(1.05);
        }
        
        .movie-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.7);
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0;
          transition: opacity 0.3s ease;
        }
        
        .movie-card:hover .movie-overlay {
          opacity: 1;
        }
        
        .movie-actions {
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          gap: 15px;
        }
        
        .movie-button {
          width: 45px;
          height: 45px;
          border-radius: 50%;
          border: none;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
          cursor: pointer;
          transition: all 0.2s ease;
          opacity: 0;
          transform: scale(0.8);
          background-color: rgba(255, 255, 255, 0.9);
          color: #000;
        }
        
        .movie-card:hover .movie-button {
          opacity: 1;
          transform: scale(1);
          transition: all 0.3s ease;
        }
        
        .movie-button.play {
          text-decoration: none;
          background-color: rgba(255, 255, 255, 0.9);
          color: #FFFFFF;
        }
        
        .play-circle {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background-color:rgba(237, 239, 240, 0.33); /* Blue color for play button */
        }
          .play-circle:hover {
          background-color: rgba(255, 255, 255, 0.9);
            transform: scale(1.1);
        }
        
        .play-icon {
          font-size: 16px;
          background-color: rgba(255, 255, 255, 0.9);
          margin-left: 2px; 
          color:rgb(63, 52, 52);
        }
        
        .movie-button.play:hover {
          transform: scale(1.1);
          background-color: #FFFFFF;
        }
        
        .movie-button.remove {
          background-color: rgba(255, 255, 255, 0.41);
        }
        
        .remove-icon {
          font-size: 16px;
          color: #000;
        }
        
        .movie-button.remove:hover {
          transform: scale(1.1);
          background-color: #fff;
        }
        
        .movie-rating {
          position: absolute;
          top: 10px;
          right: 10px;
          background: rgba(0, 0, 0, 0.7);
          color: #f1c40f;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          display: flex;
          align-items: center;
          gap: 4px;
        }
        
        .movie-quality {
          position: absolute;
          top: 10px;
          left: 10px;
          background: #e50914;
          color: #fff;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
        }
        
        .movie-title {
          padding: 12px 12px 5px;
          margin: 0;
          font-size: 16px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          color: #fff;
        }
        
        .movie-meta {
          padding: 0 12px 15px;
          display: flex;
          justify-content: space-between;
          color: #aaa;
          font-size: 13px;
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        .spin {
          animation: spin 1s linear infinite;
        }
        
        @media (max-width: 768px) {
          .watch-later-grid {
            grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
            gap: 15px;
          }
          
          .filter-buttons {
            flex-wrap: wrap;
          }
        }
        
        @media (max-width: 576px) {
          .watch-later-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 10px;
          }
          
          .movie-title {
            font-size: 14px;
          }
          
          .movie-meta {
            font-size: 12px;
          }
          
          .watch-later-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 15px;
          }
          
          .action-buttons {
            width: 100%;
            justify-content: space-between;
          }
        }
      `}</style>
    </div>
  );
}

export default WatchLaterContent;