import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Navbar from '../components/Layout/Navbar';
import { useAuth } from '../utils/auth';
import searchHistoryService from '../API/services/searchHistoryService';
import { 
  FaSearch, FaTimes, FaTrash, FaHistory, FaTimesCircle 
} from 'react-icons/fa';

export function SearchHistoryContent({ inProfilePage = false }) {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [searchHistory, setSearchHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isDeleting, setIsDeleting] = useState(false);
  const [filterQuery, setFilterQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Chuyển hướng nếu chưa đăng nhập
  useEffect(() => {
    if (!isAuthenticated && !inProfilePage) {
      router.push('/auth/login');
      return;
    }
    
    fetchSearchHistory();
  }, [isAuthenticated, router, page, inProfilePage]);

  // Lấy lịch sử tìm kiếm
  const fetchSearchHistory = async () => {
    try {
      setLoading(true);
      // Verifica se o usuário está autenticado
      if (!isAuthenticated) {
        if (!inProfilePage) {
          router.push('/auth/login');
        }
        setSearchHistory([]);
        setTotalPages(1);
        setLoading(false);
        return;
      }
      
      // Limit mặc định là 20 nếu ở trang riêng, 8 nếu ở trong profile
      const limit = inProfilePage ? 8 : 20;
      const response = await searchHistoryService.getSearchHistory(limit);
      
      if (response.success && Array.isArray(response.searchHistory)) {
        setSearchHistory(response.searchHistory);
        setTotalPages(Math.ceil(response.searchHistory.length / limit) || 1);
      } else {
        console.error("Erro na resposta do histórico de pesquisa:", response);
        setSearchHistory([]);
        setTotalPages(1);
      }
    } catch (error) {
      console.error("Error fetching search history:", error);
      setError('Không thể tải lịch sử tìm kiếm. Vui lòng thử lại sau!');
      setSearchHistory([]);
    } finally {
      setLoading(false);
    }
  };

  // Xóa một mục trong lịch sử tìm kiếm
  const deleteSearchHistoryItem = async (id) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa mục này khỏi lịch sử tìm kiếm?')) {
      try {
        setIsDeleting(true);
        const response = await searchHistoryService.deleteSearchHistoryItem(id);
        
        if (response && (response.success || response.statusCode === 200)) {
          setSearchHistory(prevHistory => 
            prevHistory.filter(item => item._id !== id)
          );
        }
      } catch (error) {
        console.error("Error deleting search history item:", error);
        alert('Không thể xóa mục lịch sử. Vui lòng thử lại!');
      } finally {
        setIsDeleting(false);
      }
    }
  };

  // Xóa toàn bộ lịch sử tìm kiếm
  const clearAllSearchHistory = async () => {
    if (window.confirm('Bạn có chắc chắn muốn xóa toàn bộ lịch sử tìm kiếm?')) {
      try {
        setIsDeleting(true);
        const response = await searchHistoryService.clearSearchHistory();
        
        if (response && (response.success || response.statusCode === 200)) {
          setSearchHistory([]);
        }
      } catch (error) {
        console.error("Error clearing search history:", error);
        alert('Không thể xóa toàn bộ lịch sử. Vui lòng thử lại!');
      } finally {
        setIsDeleting(false);
      }
    }
  };

  // Xử lý khi click vào một mục trong lịch sử tìm kiếm
  const handleSearchHistoryItemClick = (query, filters = {}) => {
    // Tạo URL với cả query và filters
    const queryParams = { q: query };
    if (filters.category) queryParams.category = filters.category;
    if (filters.country) queryParams.country = filters.country;
    if (filters.year) queryParams.year = filters.year;
    
    // Cập nhật lịch sử tìm kiếm với mục vừa click
    if (isAuthenticated) {
      const currentTime = new Date().toISOString();
      const existingIndex = searchHistory.findIndex(item => 
        item.query.toLowerCase() === query.toLowerCase()
      );
      
      // Cập nhật state searchHistory
      if (existingIndex !== -1) {
        // Nếu mục đã tồn tại, di chuyển lên đầu danh sách
        const updatedHistory = [...searchHistory];
        const existingItem = updatedHistory.splice(existingIndex, 1)[0];
        existingItem.createdAt = currentTime; // Cập nhật thời gian
        setSearchHistory([existingItem, ...updatedHistory]);
        
        // Cập nhật lên server
        searchHistoryService.saveSearchHistory(query, filters);
      }
    }
    
    // Chuyển hướng đến trang tìm kiếm với các tham số
    router.push({
      pathname: '/search',
      query: queryParams
    });
  };

  // Format thời gian tương đối
  const formatTimeAgo = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.round(diffMs / 60000);
    
    if (diffMins < 1) return 'Vừa xong';
    if (diffMins < 60) return `${diffMins} phút trước`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} giờ trước`;
    
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 30) return `${diffDays} ngày trước`;
    
    const diffMonths = Math.floor(diffDays / 30);
    return `${diffMonths} tháng trước`;
  };

  // Xử lý phân trang
  const handlePageChange = (newPage) => {
    setPage(newPage);
    window.scrollTo(0, 0);
  };

  // Lọc lịch sử tìm kiếm theo query
  const filteredHistory = filterQuery 
    ? searchHistory.filter(item => 
        item.query.toLowerCase().includes(filterQuery.toLowerCase())
      )
    : searchHistory;

  return (
    <div className={inProfilePage ? "search-history-content" : "search-history-page"}>
      {!inProfilePage && <Navbar />}
      
      <div className={inProfilePage ? "" : "container mt-5 pt-5"}>
        <div className="history-header">
          <div className="d-flex justify-content-between align-items-center flex-wrap">
            <h2 className="history-title">
              <FaSearch className="me-2" /> 
              Lịch sử tìm kiếm
            </h2>
            
            <div className="history-actions">
              {inProfilePage ? (
                <div className="profile-history-actions">
                  <button 
                    className="refresh-button"
                    onClick={fetchSearchHistory}
                  >
                    <FaHistory /> Làm mới
                  </button>
                  <button 
                    className="filter-button"
                    onClick={() => setShowFilters(!showFilters)}
                  >
                    <FaSearch /> Lọc
                  </button>
                  <button 
                    className="delete-button"
                    onClick={clearAllSearchHistory}
                    disabled={loading || isDeleting || searchHistory.length === 0}
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
                    <FaSearch className="me-2" /> Lọc
                  </button>
                  
                  <button 
                    className="btn btn-danger d-flex align-items-center"
                    onClick={clearAllSearchHistory}
                    disabled={loading || isDeleting || searchHistory.length === 0}
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
                      placeholder="Lọc trong lịch sử tìm kiếm..."
                      value={filterQuery}
                      onChange={(e) => setFilterQuery(e.target.value)}
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
            <p className="mt-3">Đang tải lịch sử tìm kiếm...</p>
          </div>
        ) : error ? (
          <div className={inProfilePage ? "error-message" : "alert alert-danger mt-4"} role="alert">
            {error}
          </div>
        ) : filteredHistory.length === 0 ? (
          <div className="empty-history text-center my-5">
            <div className="empty-icon mb-4">
              <FaSearch />
            </div>
            <h3>Chưa có lịch sử tìm kiếm</h3>
            <p className="mb-4">Bạn chưa thực hiện tìm kiếm nào hoặc đã xóa toàn bộ lịch sử.</p>
            <Link href="/search" className={inProfilePage ? "action-button" : "btn btn-danger"}>
              <FaSearch className="me-2" /> Đi đến trang tìm kiếm
            </Link>
          </div>
        ) : (
          <>
            <div className="search-history-list">
              {filteredHistory.map((item) => (
                <div key={item._id} className="search-history-item-wrapper">
                  <div className="search-history-item">
                    <div className="search-history-content" onClick={() => handleSearchHistoryItemClick(item.query, item.filters)}>
                      <div className="content-row">
                        <span className="search-icon">
                          <FaSearch />
                        </span>
                        <div className="search-query-text">
                          {item.query}
                        </div>
                        
                        <div className="delete-button-wrapper">
                          <button 
                            className="remove-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteSearchHistoryItem(item._id);
                            }}
                            title="Xóa khỏi lịch sử"
                            disabled={isDeleting}
                          >
                            <FaTimesCircle />
                          </button>
                        </div>
                      </div>
                      
                      {(item.filters?.category || item.filters?.country || item.filters?.year) && (
                        <div className="search-filters">
                          {item.filters.category && (
                            <span className="filter-badge">
                              {item.filters.category}
                            </span>
                          )}
                          {item.filters.country && (
                            <span className="filter-badge">
                              {item.filters.country}
                            </span>
                          )}
                          {item.filters.year && (
                            <span className="filter-badge">
                              {item.filters.year}
                            </span>
                          )}
                        </div>
                      )}
                      
                      <div className="search-time">
                        {formatTimeAgo(item.createdAt)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Phân trang */}
            {totalPages > 1 && (
              <div className={inProfilePage ? "pagination-profile" : "pagination-container mt-4"}>
                <nav aria-label="Page navigation">
                  <ul className={inProfilePage ? "pagination-list" : "pagination justify-content-center"}>
                    <li className={inProfilePage 
                      ? `pagination-item ${page === 1 ? 'disabled' : ''}` 
                      : `page-item ${page === 1 ? 'disabled' : ''}`
                    }>
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
        .search-history-page {
          min-height: 100vh;
          background: #141414;
          color: #fff;
        }
        
        .search-history-content {
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
        
        /* Search history list */
        .search-history-list {
          margin-bottom: 2rem;
          max-height: 70vh;
          overflow-y: auto;
          overflow-x: auto;
          white-space: nowrap;
          padding-right: 5px;
        }
        
        .search-history-item-wrapper {
          margin-bottom: 12px;
          min-width: 100%;
          display: inline-block;
        }
        
        .search-history-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: rgba(30, 30, 30, 0.7);
          padding: 16px;
          border-radius: 8px;
          transition: all 0.3s ease;
        }
        
        .search-history-item:hover {
          background: rgba(40, 40, 40, 0.7);
          transform: translateY(-3px);
          box-shadow: 0 10px 20px rgba(0, 0, 0, 0.2);
        }
        
        .search-history-content {
          flex: 1;
        }
        
        .content-row {
          display: flex;
          align-items: center;
          width: 100%;
        }
        
        .search-query-text {
          font-size: 16px;
        .search-query-text {
          font-size: 16px;
          font-weight: 500;
          color: #fff;
          flex: 1;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        
        .delete-button-wrapper {
          flex-shrink: 0;
          margin-left: 12px;
          width: 30px;
        }
        
        .search-filters {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 8px;
        }
        
        .filter-badge {
          background: rgba(229, 9, 20, 0.8);
          color: white;
          padding: 3px 8px;
          border-radius: 4px;
          font-size: 12px;
        }
        
        .search-time {
          color: #aaa;
          font-size: 13px;
          margin-top: 6px;
        }
        
        .remove-btn {
          background: none;
          border: none;
          color: rgba(255, 255, 255, 0.5);
          font-size: 18px;
          cursor: pointer;
          transition: all 0.2s ease;
          padding: 5px;
        }
        
        .remove-btn:hover {
          color: #e50914;
        }
        
        /* Empty state */
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
        
        /* Pagination */
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
        
        .history-filters {
          background: rgba(30, 30, 30, 0.7);
          border-radius: 8px;
        }
        
        /* Custom scrollbar styles như trong hình ảnh */
        .search-history-list::-webkit-scrollbar {
          width: 4px;
          height: 4px;
        }
        
        .search-history-list::-webkit-scrollbar-track {
          background: transparent;
        }
        
        .search-history-list::-webkit-scrollbar-thumb {
          background: rgba(70, 70, 90, 0.5);
          border-radius: 2px;
        }
        
        .search-history-list::-webkit-scrollbar-thumb:hover {
          background: rgba(90, 90, 115, 0.8);
        }
        
        /* Firefox scrollbar styles */
        .search-history-list {
          scrollbar-width: thin;
          scrollbar-color: rgba(70, 70, 90, 0.5) transparent;
        }
        
        /* Responsive styles */
        @media (max-width: 768px) {
          .search-history-item-wrapper {
            margin-bottom: 8px;
          }
          
          .search-history-item {
            padding: 12px;
          }
          
          .search-query-text {
            font-size: 14px;
          }
          
          .search-icon {
            width: 32px;
            height: 32px;
            font-size: 14px;
          }
          
          .search-filters {
            gap: 6px;
          }
          
          .filter-badge {
            font-size: 11px;
            padding: 2px 6px;
          }
          
          .search-time {
            font-size: 12px;
          }
          
          .history-title {
            font-size: ${inProfilePage ? '1.3rem' : '1.5rem'};
          }
          
          .profile-history-actions {
            flex-wrap: wrap;
            margin-top: 10px;
          }
          
          .container {
            padding-left: 10px;
            padding-right: 10px;
          }
          
          .action-button, .btn {
            font-size: 0.85rem;
            padding: 0.4rem 0.75rem;
          }
          
          .filter-button, .delete-button, .refresh-button {
            padding: 6px 10px;
            font-size: 12px;
          }
          
          .history-header .d-flex {
            flex-direction: column;
            align-items: flex-start !important;
          }
          
          .history-actions {
            margin-top: 10px;
            width: 100%;
            display: flex;
            justify-content: space-between;
          }
          
          .empty-icon {
            font-size: 3rem;
          }
          
          .empty-history h3 {
            font-size: 1.3rem;
          }
          
          .empty-history p {
            font-size: 0.9rem;
          }
        }
        
        @media (max-width: 480px) {
          .search-history-item {
            padding: 10px;
          }
          
          .search-icon {
            width: 28px;
            height: 28px;
            font-size: 12px;
            margin-right: 8px;
          }
          
          .search-query-text {
            font-size: 13px;
            line-height: 1.3;
          }
          
          .search-filters {
            gap: 5px;
            margin-top: 5px;
          }
          
          .filter-badge {
            font-size: 10px;
            padding: 2px 6px;
          }
          
          .search-time {
            font-size: 11px;
            margin-top: 4px;
          }
          
          .remove-btn {
            font-size: 16px;
            padding: 3px;
          }
          
          .pagination-button {
            padding: 3px 8px;
            font-size: 12px;
          }
          
          .history-filters-profile, .history-filters {
            padding: 10px;
          }
          
          .search-input-field {
            padding: 6px 5px;
            font-size: 14px;
          }
          
          /* Giảm khoảng cách padding */
          .mt-5 {
            margin-top: 2rem !important;
          }
          
          .pt-5 {
            padding-top: 2rem !important;
          }
          
          /* Cải thiện khoảng cách giữa các mục */
          .search-history-item-wrapper {
            margin-bottom: 6px;
          }
          
          /* Đảm bảo phần pagination gọn gàng */
          .pagination-list {
            gap: 3px;
          }
        }
        
        @media (max-width: 375px) {
          /* Điều chỉnh kích thước cho màn hình siêu nhỏ */
          .search-icon {
            width: 24px;
            height: 24px;
            margin-right: 6px;
          }
          
          .search-query-text {
            font-size: 12px;
          }
          
          .search-filters {
            gap: 4px;
          }
          
          .filter-badge {
            font-size: 9px;
            padding: 2px 5px;
          }
          
          .search-time {
            font-size: 10px;
          }
          
          .history-title {
            font-size: ${inProfilePage ? '1.1rem' : '1.3rem'};
          }
          
          .filter-button, .delete-button, .refresh-button {
            padding: 5px 8px;
            font-size: 11px;
          }
          
          /* Độ cao tối đa của danh sách */
          .search-history-list {
            max-height: 60vh;
          }
          
          /* Cải thiện hiển thị của search filters */
          .search-container {
            padding: 0 6px;
          }
          
          .search-input-field {
            padding: 5px;
            font-size: 13px;
          }
        }
      `}</style>
    </div>
  );
}

export default function SearchHistoryPage() {
  return <SearchHistoryContent />;
}