import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Navbar from '../components/Layout/Navbar';
import { useAuth } from '../utils/auth';
import historyService from '../API/services/historyService';
import { 
  FaPlay, FaTimes, FaTrash, FaHistory, FaFilm, FaSearch, FaSort, FaSync, FaEye
} from 'react-icons/fa';
import { color } from 'framer-motion';

export function HistoryContent({ inProfilePage = false }) {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch watch history
  useEffect(() => {
    if (!isAuthenticated && !inProfilePage) {
      router.push('/auth/login');
      return;
    }
    
    fetchHistory();
  }, [isAuthenticated, router, page, filter, sortBy, inProfilePage, searchQuery]);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const limit = inProfilePage ? 20 : 10; // Hiển thị nhiều hơn trong trang profile
      const response = await historyService.getUserHistory(limit, page, filter, sortBy, searchQuery);
      
      setHistory(response.histories || []);
      setTotalPages(Math.ceil(response.total / limit) || 1);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching history:', error);
      setError('Không thể tải lịch sử xem phim. Vui lòng thử lại sau!');
      setLoading(false);
    }
  };

  const handleDeleteHistory = async (historyId) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa phim này khỏi lịch sử?')) {
      try {
        setIsDeleting(true);
        await historyService.deleteHistory(historyId);
        setHistory(history.filter(item => item._id !== historyId));
        setIsDeleting(false);
      } catch (error) {
        console.error('Error deleting history item:', error);
        alert('Không thể xóa lịch sử. Vui lòng thử lại!');
        setIsDeleting(false);
      }
    }
  };

  const handleClearAllHistory = async () => {
    if (window.confirm('Bạn có chắc chắn muốn xóa toàn bộ lịch sử xem?')) {
      try {
        setIsDeleting(true);
        await historyService.clearAllHistory();
        setHistory([]);
        setIsDeleting(false);
      } catch (error) {
        console.error('Error clearing history:', error);
        alert('Không thể xóa toàn bộ lịch sử. Vui lòng thử lại!');
        setIsDeleting(false);
      }
    }
  };

  const handlePageChange = (newPage) => {
    setPage(newPage);
    window.scrollTo(0, 0);
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('vi-VN', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Filter history items based on searchQuery
  const filteredHistory = searchQuery 
    ? history.filter(item => 
        item.movieData.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.movieData.origin_name && 
         item.movieData.origin_name.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : history;

  return (
    <div className={inProfilePage ? "history-content" : "history-page"}>
      {!inProfilePage  }
      
      <div className={inProfilePage ? "" : "container mt-5 pt-5"}>
        <div className="history-header">
          <div className="d-flex justify-content-between align-items-center flex-wrap">

            
            <div className="history-actions">
              {inProfilePage ? (
                <div className="profile-history-actions">
                  <button 
                    className="refresh-button"
                    onClick={fetchHistory}
                  >
                    <FaSync /> Làm mới
                  </button>
                  <button 
                    className="filter-button"
                    onClick={() => setShowFilters(!showFilters)}
                  >
                    <FaSearch /> Tìm Kiếm
                  </button>
                  <button 
                    className="delete-button"
                    onClick={handleClearAllHistory}
                    disabled={loading || isDeleting || history.length === 0}
                  >
                    <FaTrash /> Xóa tất cả
                  </button>
                </div>
              ) : (
                <>
                  <button 
                    className="btn btn-outline-light me-2 d-flex align-items-center"
                    onClick={() => setShowFilters(!showFilters)}
                  >
                    <FaSearch className="me-2" /> Tìm Kiếm 
                  </button>
                  
                  <button 
                    className="btn btn-danger d-flex align-items-center"
                    onClick={handleClearAllHistory}
                    disabled={loading || isDeleting || history.length === 0}
                  >
                    <FaTrash className="me-2" /> Xóa tất cả
                  </button>
                </>
              )}
            </div>
          </div>
          
          {showFilters && (
            <div className={inProfilePage ? "history-filters-profile" : "history-filters mt-3 p-3 rounded"}>
              <div className={inProfilePage ? "filters-row" : "row g-3"}>
                <div className={inProfilePage ? "search-input" : "col-12 col-md-6"}>
                  <div className={inProfilePage ? "search-container" : "input-group"}>
                    <span className={inProfilePage ? "search-icon" : "input-group-text bg-dark text-light border-secondary"}>
                      <FaSearch />
                    </span>
                    <input
                      type="text"
                      className={inProfilePage ? "search-input-field" : "form-control bg-dark text-light border-secondary"}
                      placeholder="Tìm kiếm phim trong lịch sử..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
        
        {loading ? (
          <div className="text-center my-5">
            <div className={inProfilePage ? "loading-spinner" : "spinner-border text-danger"} role="status">
              <span className="visually-hidden">Đang tải...</span>
            </div>
            <p className="mt-3">Đang tải lịch sử xem phim...</p>
          </div>
        ) : error ? (
          <div className={inProfilePage ? "error-message" : "alert alert-danger mt-4"} role="alert">
            {error}
          </div>
        ) : filteredHistory.length === 0 ? (
          <div className="empty-history text-center my-5">
            <div className="empty-icon mb-4">
              <FaHistory />
            </div>
            <h3>Chưa có lịch sử xem</h3>
            <p className="mb-4">Bạn chưa xem phim nào hoặc đã xóa toàn bộ lịch sử.</p>
            <Link href="/" className={inProfilePage ? "action-button" : "btn btn-danger"}>
              <FaFilm className="me-2" /> Khám phá phim
            </Link>
          </div>
        ) : (
          <>
            {inProfilePage ? (
              <div className="history-grid">
                {filteredHistory.map((item) => (
                  <div key={item._id} className="history-card">
                    <div className="history-poster">
                      <img 
                        src={item.movieData.thumb_url} 
                        alt={item.movieData.name}
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = "/img/default-poster.jpg";
                        }}
                      />
                      <div className="history-overlay">
                        <div className="history-actions">
                          <Link href={`/movie/${item.movieSlug}`}>
                            <button className="history-button play">
                              <FaPlay />
                            </button>
                          </Link>
                          <button 
                            className="history-button remove"
                            onClick={() => handleDeleteHistory(item._id)}
                          >
                            <FaTimes />
                          </button>
                        </div>
                      </div>
                      <div className="watch-time">
                        {new Date(item.createdAt).toLocaleDateString('vi-VN')}
                      </div>
                      {item.movieData.type === 'series' && (
                        <div className="episode-badge">
                          Tập {item.movieData.episode || 1}
                        </div>
                      )}
                    </div>
                    <h3 className="history-title">{item.movieData.name}</h3>
                    <div className="history-meta">
                      <span className="history-year">{item.movieData.year || 'N/A'}</span>
                      <span className="history-type">
                        {item.movieData.type === 'series' ? 'Phim bộ' : 'Phim lẻ'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="row history-list mt-4">
                {filteredHistory.map((item) => (
                  <div key={item._id} className="col-12 mb-3">
                    <div className="history-item">
                      <div className="history-thumbnail">
                        <img 
                          src={item.movieData.thumb_url} 
                          alt={item.movieData.name}
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = "/img/default-poster.jpg";
                          }}
                        />
                        {item.movieData.type === 'series' && (
                          <div className="episode-badge">
                            Tập {item.movieData.episode || 1}
                          </div>
                        )}
                      </div>
                      
                      <div className="history-content">
                        <h4 className="history-title">
                          {item.movieData.name}
                          {item.movieData.origin_name && (
                            <span className="original-title">
                              {item.movieData.origin_name}
                            </span>
                          )}
                        </h4>
                        
                        <div className="history-metadata">
                          <span className="history-type">
                            {item.movieData.type === 'series' ? 'Phim bộ' : 'Phim lẻ'}
                          </span>
                            {item.movieData.year && (
                            <span className="history-year">
                              {item.movieData.year}
                            </span>
                          )}
                          
                          {item.movieData.quality && (
                            <span className="history-quality">
                              {item.movieData.quality}
                            </span>
                          )}
                        </div>
                        
                        <div className="history-date">
                          Đã xem vào: {formatDate(item.createdAt || Date.now())}
                        </div>
                        <Link 
                          href={`/movie/${item.movieSlug}`}
                          className="watch-btn"
                        >
                          <FaEye /> <span style={{color:"red" }}>Xem lại</span>
                        </Link>
                      </div>
                      
                      <div className="history-actions">
                        
                        
                        <button 
                          className="delete-btn"
                          onClick={() => handleDeleteHistory(item._id)}
                          disabled={isDeleting}
                          title="Xóa khỏi lịch sử"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {/* Pagination */}
            {totalPages > 1 && (
              <div className={inProfilePage ? "pagination-profile" : "pagination-container mt-4"}>
                <nav aria-label="Page navigation">
                  <ul className={inProfilePage ? "pagination-list" : "pagination justify-content-center"}>
                    <li className={inProfilePage ? `pagination-item ${page === 1 ? 'disabled' : ''}` : `page-item ${page === 1 ? 'disabled' : ''}`}>
                      <button 
                        className={inProfilePage ? "pagination-button prev" : "page-link bg-dark text-light border-secondary"} 
                        onClick={() => handlePageChange(page - 1)}
                        disabled={page === 1}
                      >
                        Trước
                      </button>
                    </li>
                    
                    {[...Array(totalPages)].map((_, index) => (
                      <li 
                        key={index} 
                        className={inProfilePage 
                          ? `pagination-item ${page === index + 1 ? 'active' : ''}` 
                          : `page-item ${page === index + 1 ? 'active' : ''}`
                        }
                      >
                        <button 
                          className={inProfilePage 
                            ? `pagination-button ${page === index + 1 ? 'active' : ''}` 
                            : `page-link ${page === index + 1 ? 'bg-danger' : 'bg-dark'} text-light border-secondary`
                          }
                          onClick={() => handlePageChange(index + 1)}
                        >
                          {index + 1}
                        </button>
                      </li>
                    ))}
                    
                    <li className={inProfilePage 
                      ? `pagination-item ${page === totalPages ? 'disabled' : ''}` 
                      : `page-item ${page === totalPages ? 'disabled' : ''}`
                    }>
                      <button 
                        className={inProfilePage ? "pagination-button next" : "page-link bg-dark text-light border-secondary"} 
                        onClick={() => handlePageChange(page + 1)}
                        disabled={page === totalPages}
                      >
                        Sau
                      </button>
                    </li>
                  </ul>
                </nav>
              </div>
            )}
          </>
        )}
      </div>
      
      <style jsx>{`
        /* Shared styles */
        .history-page {
          min-height: 100vh;
          background: #141414;
          color: #fff;
        }
        
        .history-content {
          color: #fff;
          width: 100%;
        }
        
        /* Headers */
        .history-header {
          margin-bottom: 2rem;
        }
        
        .history-title {
          font-size: ${inProfilePage ? '1.5rem' : '2rem'};
          font-weight: bold;
          display: flex;
          align-items: center;
          margin-bottom: 1rem;
        }
        
        /* Profile-specific controls */
        .profile-history-actions {
          display: flex;
          gap: 10px;
        }
        
        .filter-button, .delete-button, .refresh-button {
          background: rgba(255, 255, 255, 0.1);
          border: none;
          color: #fff;
          padding: 8px 12px;
          border-radius: 8px;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        
        .filter-button:hover {
          background: rgba(255, 255, 255, 0.2);
        }
        
        .delete-button {
          background: rgba(229, 9, 20, 0.2);
        }
        
        .delete-button:hover {
          background: rgba(229, 9, 20, 0.4);
        }
        
        /* Filters */
        .history-filters-profile {
          background: rgba(0, 0, 0, 0.3);
          border-radius: 10px;
          padding: 15px;
          margin-bottom: 20px;
        }
        
        .filters-row {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
        }
        
        .search-container {
          display: flex;
          align-items: center;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 5px;
          padding: 0 10px;
          flex: 2;
        }
        
        .search-icon {
          color: #aaa;
          margin-right: 8px;
        }
        
        .search-input-field {
          background: transparent;
          border: none;
          color: white;
          padding: 8px 5px;
          flex: 1;
          outline: none;
          width: 100%;
        }
        
        .filter-select {
          flex: 1;
        }
        
        .filter-dropdown {
          width: 100%;
          background: rgba(255, 255, 255, 0.1);
          border: none;
          color: white;
          padding: 8px 10px;
          border-radius: 5px;
          outline: none;
        }
        
        /* Grid layout for profile page */
        .history-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
          gap: 20px;
          margin-bottom: 20px;
        }
        
        .history-card {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 10px;
          overflow: hidden;
          transition: all 0.3s ease;
        }
        
        .history-poster {
          position: relative;
          height: 250px;
          overflow: hidden;
        }
        
        .history-poster img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.3s ease;
        }
        
        .history-card:hover .history-poster img {
          transform: scale(1.05);
        }
        
        .history-overlay {
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
        
        .history-card:hover .history-overlay {
          opacity: 1;
        }
        
        .history-actions {
          display: flex;
          justify-content: flex-start;
          align-items: center;
          gap: 15px;
          padding-left: 20px;
        }
        
        .history-button {
          width: 45px;
          height: 45px;
          border-radius: 50%;
          border: none;
          display: flex;  
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
          transform: translateY(20px);
          opacity: 0;
          margin-left: 39px;
        }
        
        .history-card:hover .history-button {
          transform: translateY(0);
          opacity: 1;
          transition: all 0.3s ease 0.1s;
        }
        
        .history-button.play {
          background:rgba(94, 89, 90, 0.34);
          color: white;
          margin-left: 100px;
        }
        
        .history-button.play:hover {
          background:rgba(204, 194, 191, 0.65);
          transform: scale(1.1);
        }
        
        .history-button.remove {
          background: rgba(100, 96, 96, 0.23);
          color: white;
          margin-top: 200px;  
          margin-right : 20px;
        }
        
        .history-button.remove:hover {
          background: rgba(209, 203, 203, 0.5);
          transform: scale(1.1);
        }
        
        .watch-time {
          position: absolute;
          top: 10px;
          right: 10px;
          background: rgba(0, 0, 0, 0.7);
          color: #fff;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
        }
        
        .episode-badge {
          position: absolute;
          top: 10px;
          left: 10px;
          background: rgba(229, 9, 20, 0.7);
          color: #fff;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
        }
        
        .history-title {
          padding: 12px 12px 5px;
          margin: 0;
          font-size: 16px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        
        .history-meta {
          padding: 0 12px 15px;
          display: flex;
          justify-content: space-between;
          color: #aaa;
          font-size: 13px;
        }
        
        /* List layout for history page */
        .history-item {
          display: flex;
          background: rgba(30, 30, 30, 0.7);
          border-radius: 8px;
          overflow: hidden;
          transition: all 0.3s ease;
          position: relative;
        }
        
        .history-item:hover {
          transform: translateY(-3px);
          box-shadow: 0 10px 20px rgba(0, 0, 0, 0.3);
          background: rgba(40, 40, 40, 0.7);
        }
        
        .history-thumbnail {
          width: 120px;
          min-width: 120px;
          height: 170px;
          position: relative;
          overflow: hidden;
        }
        
        .history-thumbnail img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.3s ease;
        }
        
        .history-item:hover .history-thumbnail img {
          transform: scale(1.05);
        }
        
        .history-content {
          flex: 1;
          padding: 15px;
          overflow: hidden;
        }
        
        .original-title {
          font-size: 14px;
          color: #aaa;
          margin-top: 5px;
        }
        
        .history-metadata {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          margin-bottom: 10px;
        }
        
        .history-type,
        .history-year,
        .history-category,
        .history-quality {
          font-size: 13px;
          background: rgba(255, 255, 255, 0.1);
          padding: 3px 8px;
          border-radius: 4px;
        }
        
        .history-date {
          font-size: 14px;
          color: #aaa;
        }
        
        /* Rest of history page styles */
        .history-actions {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-left: auto;
          padding: 15px;
        }
        
        .watch-btn,
        .delete-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          border: none;
          border-radius: 6px;
          padding: 10px 15px;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.3s ease;
          font-weight: 500;

        }
        
        .watch-btn {
          background: #e50914;
          color: white;   
          gap: 8px;
          text-decoration: none;
          position: relative;
          overflow: hidden;
          min-width: 120px;
        }
        
        .watch-btn:before {
          content: "";
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(
            to right,
            rgba(255, 255, 255, 0) 0%,
            rgba(255, 255, 255, 0.2) 50%,
            rgba(255, 255, 255, 0) 100%
          );
          transition: all 0.6s ease;
        }
        
        .watch-btn:hover:before {
          left: 100%;
        }
        
        .watch-btn:hover {
          background: #b80710;
          transform: translateY(-2px);
          box-shadow: 0 5px 15px rgba(229, 9, 20, 0.4);
        }
        
        .delete-btn {
          background: rgba(255, 255, 255, 0.1);
          color: white;
          width: 42px;
          height: 42px;
          padding: 0;
          border-radius: 50%;
          font-size: 16px;
        }
        
        .delete-btn:hover {
          background: rgba(255, 91, 91, 0.2);
          color: #ff5b5b;
          transform: rotate(90deg);
        }
        
        .empty-history {
          padding: 60px 20px;
          text-align: center;
        }
        
        .empty-icon {
          font-size: 4rem;
          color: rgba(255, 255, 255, 0.2);
        }
        
        /* Loading */
        .loading-spinner {
          width: 40px;
          height: 40px;
          border: 3px solid rgba(255, 255, 255, 0.2);
          border-top: 3px solid #e50914;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 0 auto;
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        /* Profile pagination */
        .pagination-profile {
          margin: 20px 0;
        }
        
        .pagination-list {
          display: flex;
          justify-content: center;
          gap: 5px;
          list-style: none;
          padding: 0;
        }
        
        .pagination-button {
          background: rgba(255, 255, 255, 0.1);
          color: white;
          border: none;
          padding: 5px 10px;
          border-radius: 4px;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .pagination-button:hover {
          background: rgba(255, 255, 255, 0.2);
        }
        
        .pagination-button.active {
          background: #e50914;
        }
        
        .pagination-item.disabled .pagination-button {
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        /* Media queries */
        @media (max-width: 768px) {
          .history-grid {
            grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
            gap: 15px;
          }
          
          .history-poster {
            height: 225px;
          }
          
          .history-item {
            flex-direction: column;
          }
          
          .history-thumbnail {
            width: 100%;
            height: 200px;
            min-width: 100%;
          }
          
          .filters-row {
            flex-direction: column;
          }
          
          .search-container {
            width: 100%;
          }
          
          .history-actions {
            padding: 10px;
          }
          
          .watch-btn {
            font-size: 13px;
            padding: 8px 12px;
            min-width: 100px;
          }
          
          .watch-btn span {
            display: none;
          }
          
          .delete-btn {
            width: 36px;
            height: 36px;
            font-size: 14px;
          }
        }
        
        @media (max-width: 576px) {
          .history-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 10px;
          }
          
          .history-poster {
            height: 180px;
          }
          
          .history-title {
            font-size: 14px;
          }
          
          .history-meta {
            font-size: 12px;
          }
          
          .watch-btn {
            min-width: auto;
          }
          
          .history-actions {
            gap: 8px;
          }
        }
      `}</style>
    </div>
  );
}

export default function HistoryPage() {
  return <HistoryContent />;
}