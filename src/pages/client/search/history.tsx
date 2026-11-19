/**
 * @file pages/search/history.tsx
 * @description Authenticated search-history page listing recent searches with
 * pagination, in-page filtering, and clear/delete actions.
 */
import React, { useState, useEffect, ChangeEvent, MouseEvent } from 'react';
import type { ReactElement } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import searchHistoryService from '@/API/services/searchHistoryService';
import { formatYear, getTaxonomyName } from '@/utils/taxonomy';
import { FaSearch, FaTrash, FaHistory, FaTimesCircle } from 'react-icons/fa';

interface SearchHistoryFilters {
  category?: string;
  country?: string;
  year?: string;
  [key: string]: string | undefined;
}

interface SearchHistoryItem {
  _id: string;
  query: string;
  filters?: SearchHistoryFilters;
  createdAt: string;
}

interface SearchHistoryResponse {
  success: boolean;
  searchHistory?: SearchHistoryItem[];
}

function formatTimeAgo(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.round(diffMs / 60000);
  if (diffMins < 1) return 'Vừa xong';
  if (diffMins < 60) return `${diffMins} phút trước`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} giờ trước`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 30) return `${diffDays} ngày trước`;
  const diffMonths = Math.floor(diffDays / 30);
  return `${diffMonths} tháng trước`;
}

export function SearchHistoryContent({
  inProfilePage = false
}: {
  inProfilePage?: boolean;
}): ReactElement {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [searchHistory, setSearchHistory] = useState<SearchHistoryItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [filterQuery, setFilterQuery] = useState<string>('');
  const [showFilters, setShowFilters] = useState<boolean>(false);

  useEffect(() => {
    if (!isAuthenticated && !inProfilePage) {
      router.push('/auth/login');
    }
    fetchSearchHistory();
  }, [isAuthenticated, router, inProfilePage]);

  const fetchSearchHistory = async (): Promise<void> => {
    try {
      setLoading(true);
      if (!isAuthenticated) {
        if (!inProfilePage) router.push('/auth/login');
        setSearchHistory([]);
        setLoading(false);
        return;
      }
      const response = (await searchHistoryService.getSearchHistory(20)) as SearchHistoryResponse;
      if (response?.success && Array.isArray(response.searchHistory)) {
        setSearchHistory(response.searchHistory);
      } else {
        setSearchHistory([]);
      }
    } catch (err) {

      setError('Không thể tải lịch sử tìm kiếm. Vui lòng thử lại sau!');
      setSearchHistory([]);
    } finally {
      setLoading(false);
    }
  };

  const deleteSearchHistoryItem = async (id: string): Promise<void> => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa mục này khỏi lịch sử tìm kiếm?')) return;
    try {
      setIsDeleting(true);
      const response = (await searchHistoryService.deleteSearchHistoryItem(id)) as {
        success?: boolean;
        statusCode?: number;
      };
      if (response && (response.success || response.statusCode === 200)) {
        setSearchHistory((prev) => prev.filter((item) => item._id !== id));
      }
    } catch (err) {

      alert('Không thể xóa mục lịch sử. Vui lòng thử lại!');
    } finally {
      setIsDeleting(false);
    }
  };

  const clearAllSearchHistory = async (): Promise<void> => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa toàn bộ lịch sử tìm kiếm?')) return;
    try {
      setIsDeleting(true);
      const response = (await searchHistoryService.clearSearchHistory()) as {
        success?: boolean;
        statusCode?: number;
      };
      if (response && (response.success || response.statusCode === 200)) setSearchHistory([]);
    } catch (err) {

      alert('Không thể xóa toàn bộ lịch sử. Vui lòng thử lại!');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSearchHistoryItemClick = (query: string, filters?: SearchHistoryFilters): void => {
    const queryParams: Record<string, string> = { q: query };
    if (filters?.category) queryParams.category = filters.category;
    if (filters?.country) queryParams.country = filters.country;
    if (filters?.year) queryParams.year = filters.year;
    if (isAuthenticated) {
      searchHistoryService.saveSearchHistory(query, filters);
    }
    router.push({ pathname: '/search', query: queryParams });
  };

  const filteredHistory = filterQuery
    ? searchHistory.filter((item) => item.query.toLowerCase().includes(filterQuery.toLowerCase()))
    : searchHistory;

  const handleItemClick = (e: MouseEvent<HTMLDivElement>, query: string, filters?: SearchHistoryFilters): void => {
    e.preventDefault();
    handleSearchHistoryItemClick(query, filters);
  };

  const handleDeleteClick = (e: MouseEvent<HTMLButtonElement>, id: string): void => {
    e.stopPropagation();
    e.preventDefault();
    deleteSearchHistoryItem(id);
  };

  return (
    <div className={inProfilePage ? 'search-history-content' : 'search-history-page'}>
      <div className={inProfilePage ? '' : 'container pt-3 pb-5'}>
        <div className="history-header">
          <div className="d-flex justify-content-between align-items-center flex-wrap">
            <h2 className="history-title">
              <FaSearch className="me-2" />
              Lịch sử tìm kiếm
            </h2>
            <div className="history-actions">
              {!inProfilePage ? (
                <>
                  <button type="button" className="btn btn-outline-light me-2 d-flex align-items-center" onClick={() => setShowFilters((s) => !s)}>
                    <FaSearch className="me-2" /> Lọc
                  </button>
                  <button
                    type="button"
                    className="btn btn-danger d-flex align-items-center"
                    onClick={clearAllSearchHistory}
                    disabled={loading || isDeleting || searchHistory.length === 0}
                  >
                    <FaTrash className="me-2" /> Xóa tất cả
                  </button>
                </>
              ) : (
                <div className="profile-history-actions">
                  <button type="button" className="refresh-button" onClick={fetchSearchHistory}>
                    <FaHistory /> Làm mới
                  </button>
                  <button type="button" className="filter-button" onClick={() => setShowFilters((s) => !s)}>
                    <FaSearch /> Lọc
                  </button>
                  <button
                    type="button"
                    className="delete-button"
                    onClick={clearAllSearchHistory}
                    disabled={loading || isDeleting || searchHistory.length === 0}
                  >
                    <FaTrash /> Xóa tất cả
                  </button>
                </div>
              )}
            </div>
          </div>

          {showFilters && (
            <div className={inProfilePage ? 'history-filters-profile mt-3 p-3 rounded' : 'history-filters mt-3 p-3 rounded'}>
              <div className={inProfilePage ? 'filters-row' : 'row g-3'}>
                <div className={inProfilePage ? 'search-input' : 'col-12 col-md-6'}>
                  <div className={inProfilePage ? 'search-container' : 'input-group'}>
                    <span className={inProfilePage ? 'search-icon' : 'input-group-text bg-dark text-light border-secondary'}>
                      <FaSearch />
                    </span>
                    <input
                      type="text"
                      className={inProfilePage ? 'search-input-field' : 'form-control bg-dark text-light border-secondary'}
                      placeholder="Lọc trong lịch sử tìm kiếm..."
                      value={filterQuery}
                      onChange={(e: ChangeEvent<HTMLInputElement>) => setFilterQuery(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {loading ? (
          <div className="text-center my-5">
            <div className={inProfilePage ? 'loading-spinner' : 'spinner-border text-danger'} role="status">
              <span className="visually-hidden">Đang tải...</span>
            </div>
            <p className="mt-3">Đang tải lịch sử tìm kiếm...</p>
          </div>
        ) : error ? (
          <div className={inProfilePage ? 'error-message' : 'alert alert-danger mt-4'} role="alert">
            {error}
          </div>
        ) : filteredHistory.length === 0 ? (
          <div className="empty-history text-center my-5">
            <div className="empty-icon mb-4"><FaSearch /></div>
            <h3>Chưa có lịch sử tìm kiếm</h3>
            <p className="mb-4">Bạn chưa thực hiện tìm kiếm nào hoặc đã xóa toàn bộ lịch sử.</p>
            <Link href="/search" className={inProfilePage ? 'action-button' : 'btn btn-danger'}>
              <FaSearch className="me-2" /> Đi đến trang tìm kiếm
            </Link>
          </div>
        ) : (
          <div className="search-history-list">
            {filteredHistory.map((item) => (
              <div key={item._id} className="search-history-item-wrapper">
                <div className="search-history-item">
                  <div
                    className="search-history-content"
                    onClick={(e) => handleItemClick(e, item.query, item.filters)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleItemClick(e as unknown as MouseEvent<HTMLDivElement>, item.query, item.filters);
                    }}
                    role="button"
                    tabIndex={0}
                  >
                    <div className="content-row">
                      <span className="search-icon"><FaSearch /></span>
                      <div className="search-query-text">{item.query}</div>
                      <div className="delete-button-wrapper">
                        <button
                          type="button"
                          className="remove-btn"
                          onClick={(e) => handleDeleteClick(e, item._id)}
                          title="Xóa khỏi lịch sử"
                          disabled={isDeleting}
                        >
                          <FaTimesCircle />
                        </button>
                      </div>
                    </div>
                    {(item.filters?.category || item.filters?.country || item.filters?.year) && (
                      <div className="search-filters">
                        {item.filters?.category && <span className="filter-badge">{getTaxonomyName(item.filters.category)}</span>}
                        {item.filters?.country && <span className="filter-badge">{getTaxonomyName(item.filters.country)}</span>}
                        {item.filters?.year && <span className="filter-badge">{formatYear(item.filters.year)}</span>}
                      </div>
                    )}
                    <div className="search-time">{formatTimeAgo(item.createdAt)}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <style jsx>{`
        .search-history-page { min-height: 100vh; background: #141414; color: #fff; }
        .search-history-content { color: #fff; width: 100%; }
        .history-header { margin-bottom: 2rem; }
        .history-title { font-size: ${inProfilePage ? '1.5rem' : '2rem'}; font-weight: bold; display: flex; align-items: center; margin-bottom: 1rem; }
        .profile-history-actions { display: flex; gap: 10px; }
        .filter-button, .delete-button, .refresh-button { background: rgba(255,255,255,0.1); border: none; color: #fff; padding: 8px 12px; border-radius: 8px; font-size: 14px; cursor: pointer; transition: all 0.2s ease; display: flex; align-items: center; gap: 6px; }
        .filter-button:hover { background: rgba(255,255,255,0.2); }
        .delete-button { background: rgba(229,9,20,0.2); }
        .delete-button:hover { background: rgba(229,9,20,0.4); }
        .history-filters-profile { background: rgba(0,0,0,0.3); border-radius: 10px; padding: 15px; margin-bottom: 20px; }
        .filters-row { display: flex; flex-wrap: wrap; gap: 10px; }
        .search-container { display: flex; align-items: center; background: rgba(255,255,255,0.1); border-radius: 5px; padding: 0 10px; flex: 2; }
        .search-icon { color: #aaa; margin-right: 8px; }
        .search-input-field { background: transparent; border: none; color: white; padding: 8px 5px; flex: 1; outline: none; width: 100%; }
        .search-history-list { margin-bottom: 2rem; max-height: 70vh; overflow-y: auto; overflow-x: auto; white-space: nowrap; padding-right: 5px; }
        .search-history-item-wrapper { margin-bottom: 12px; min-width: 100%; display: inline-block; }
        .search-history-item { display: flex; justify-content: space-between; align-items: center; background: rgba(30,30,30,0.7); padding: 16px; border-radius: 8px; transition: all 0.3s ease; }
        .search-history-item:hover { background: rgba(40,40,40,0.7); transform: translateY(-3px); box-shadow: 0 10px 20px rgba(0,0,0,0.2); }
        .content-row { display: flex; align-items: center; width: 100%; }
        .search-query-text { font-size: 16px; font-weight: 500; color: #fff; flex: 1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .delete-button-wrapper { flex-shrink: 0; margin-left: 12px; width: 30px; }
        .search-filters { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 8px; }
        .filter-badge { background: rgba(229,9,20,0.8); color: white; padding: 3px 8px; border-radius: 4px; font-size: 12px; }
        .search-time { color: #aaa; font-size: 13px; margin-top: 6px; }
        .remove-btn { background: none; border: none; color: rgba(255,255,255,0.5); font-size: 18px; cursor: pointer; transition: all 0.2s ease; padding: 5px; }
        .remove-btn:hover { color: #e50914; }
        .empty-history { padding: 60px 20px; text-align: center; }
        .empty-icon { font-size: 4rem; color: rgba(255,255,255,0.2); }
        .loading-spinner { width: 40px; height: 40px; border: 3px solid rgba(255,255,255,0.2); border-top: 3px solid #e50914; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto; }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        .search-history-list::-webkit-scrollbar { width: 4px; height: 4px; }
        .search-history-list::-webkit-scrollbar-track { background: transparent; }
        .search-history-list::-webkit-scrollbar-thumb { background: rgba(70,70,90,0.5); border-radius: 2px; }
        .search-history-list::-webkit-scrollbar-thumb:hover { background: rgba(90,90,115,0.8); }
        .search-history-list { scrollbar-width: thin; scrollbar-color: rgba(70,70,90,0.5) transparent; }
        @media (max-width: 768px) {
          .search-history-item { padding: 12px; }
          .search-query-text { font-size: 14px; }
          .history-title { font-size: ${inProfilePage ? '1.3rem' : '1.5rem'}; }
          .profile-history-actions { flex-wrap: wrap; margin-top: 10px; }
        }
        @media (max-width: 480px) {
          .search-history-item { padding: 10px; }
          .search-query-text { font-size: 13px; }
          .search-history-list { max-height: 60vh; }
          .history-title { font-size: ${inProfilePage ? '1.1rem' : '1.3rem'}; }
        }
      `}</style>
    </div>
  );
}

export default function SearchHistoryPage(): ReactElement {
  return <SearchHistoryContent inProfilePage={false} />;
}
