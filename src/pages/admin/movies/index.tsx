// src/pages/admin/movies.tsx
'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import AdminRoute from '@/features/shared/components/ProtectedRoute/AdminRoute';
import {
  FaPlus,
  FaSearch,
  FaPen,
  FaTrash,
  FaChevronLeft,
  FaExclamationTriangle,
  FaEye,
  FaFilter,
  FaCalendarAlt,
  FaSync,
  FaFilm,
  FaBolt,
  FaDownload,
  FaHeart
} from 'react-icons/fa';
import styles from '@/styles/AdminMovies.module.css';
import darkStyles from '@/styles/AdminMoviesDark.module.css';
import cinemaTable from '@/styles/CinemaTable.module.css';
import ratingStyles from '@/styles/AdminRatings.module.css';
import { useTheme } from 'next-themes';
import { useRouter } from 'next/router';
import { toast } from 'react-toastify';
import AdminLayout from '@/layouts/AdminLayout';
import CrawlModal from '@/features/admin/components/Movies/CrawlModal';
import EpisodeManagerModal from '@/features/admin/components/Movies/FormFields/EpisodeManagerModal';
import MovieDetailModal from '@/features/admin/components/Movies/FormFields/MovieDetailModal';
import BackToTop from '@/features/shared/components/UI/BackToTop';
import CinemaDropdown from '@/features/admin/components/Common/CinemaDropdown';
import AdminPagination from '@/features/admin/components/Common/AdminPagination';
import { ADMIN_MOVIES_I18N, ADMIN_COMMON_I18N } from '@/config/i18n/admin';
import { INITIAL_CATEGORIES } from '@/mock/admin';
import axiosInstance from '@/API/config/axiosConfig';
import { apiPath } from '@/config/apiPaths';

import {
  getMoviesForAdmin,
  deleteMovieByAdmin,
  toggleMovieVisibility,
  searchMoviesWithElasticsearch,
  checkElasticsearchStatus,
  ElasticsearchStatus
} from '@/features/admin/services/movieAdminService';

import {
  syncAllMovieRatings} from '@/features/admin/services/ratingAdminService';

const combinedStyles = {
  ...styles,
  ...ratingStyles,
  ...darkStyles
};

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface Movie {
  _id: string;
  id?: string;
  name: string;
  origin_name: string;
  year: number;
  type: 'series' | 'single';
  status: 'active' | 'inactive';
  thumb_url: string;
  poster_url?: string;
  category: Array<Category | string>;
  views: number;
  view?: number;
  view_count?: number;
  like_count?: number;
  quality: string;
  lang: string;
  content?: string;
  director?: string[] | string;
  actor?: string[] | string;
  country?: Array<{ id: string; name: string } | string>;
  time?: string;
  showtimes?: string;
  episode_current?: string | number;
  episode_total?: string | number;
  is_copyright?: boolean;
  sub_docquyen?: boolean;
  chieurap?: boolean;
  source?: string;
  file_size?: string;
  tags?: string[];
  episodes?: {
    server_name: string;
    server_data: Array<{
      name: string;
      slug: string;
      filename: string;
      link_embed: string;
      link_m3u8: string;
    }>;
  }[];
  createdAt?: string;
  updatedAt?: string;
  expiryDate?: string;
  rating: number;
  vote_count: number;
  slug: string;
  isHidden?: boolean;
  /**
   * Whether the visibility of the movie is KNOWN.
   *
   * The list DTO of the backend does not carry the `isHidden` field, so the
   * admin list cannot tell a hidden movie from a visible one. The flag comes
   * from the service and prevents the UI from claiming a state it does not
   * really know.
   */
  visibilityKnown?: boolean;
  userRating?: number;
}

interface DeleteModalProps {
  isOpen: boolean;
  movie: Movie | null;
  onClose: () => void;
  onConfirm: () => void;
}

const DeleteModal: React.FC<DeleteModalProps> = ({ isOpen, movie, onClose, onConfirm }) => {
  if (!isOpen || !movie) return null;

  return (
    <div className={combinedStyles.modalOverlay} onClick={(e) => {
      if (e.target === e.currentTarget) onClose();
    }}>
      <div className={combinedStyles.deleteModalContent} onClick={(e) => e.stopPropagation()}>
        <div className={combinedStyles.deleteModalHeader}>
          <FaExclamationTriangle className={combinedStyles.deleteWarningIcon} />
          <h3 className={combinedStyles.deleteModalTitle}>Xác nhận xóa</h3>
        </div>
        <div className={combinedStyles.deleteModalBody}>
          <p className={combinedStyles.deleteQuestion}>
            Bạn có chắc chắn muốn xóa phim <strong>&quot;{movie.name}&quot;</strong>?
          </p>
          <p className={combinedStyles.deleteWarningText}>
            <FaExclamationTriangle style={{ marginRight: '8px' }} />
            Thao tác này không thể hoàn tác.
          </p>
        </div>
        <div className={combinedStyles.deleteModalFooter}>
          <button className={combinedStyles.cancelButton} onClick={onClose}>
            <FaChevronLeft style={{ fontSize: '14px' }} /> Hủy
          </button>
          <button
            className={combinedStyles.confirmDeleteButton}
            onClick={() => {
              onConfirm();
            }}
          >
            Xác nhận xóa <FaTrash style={{ fontSize: '14px', marginLeft: '5px' }} />
          </button>
        </div>
      </div>
    </div>  );
}


const MoviesAdmin = () => {
  const topRef = useRef<HTMLDivElement>(null);

  /**
   * The sequence number of the last started request.
   *
   * It protects the state against a RACE CONDITION: when the user changes
   * the page quickly, the answer of the older request arrives last and
   * would overwrite the list of the newer page.
   */
  const requestSeqRef = useRef<number>(0);

  const router = useRouter();
  const { theme } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalMovies, setTotalMovies] = useState(0);
  const [loading, setLoading] = useState(true);  const [movies, setMovies] = useState<Movie[]>([]);
  const [syncingAllRatings, setSyncingAllRatings] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; movie: Movie | null }>({
    isOpen: false,
    movie: null
  });  const [detailModal, setDetailModal] = useState<{ isOpen: boolean; movie: Movie | null }>({
    isOpen: false,
    movie: null
  });
  const [episodeModal, setEpisodeModal] = useState<{ isOpen: boolean; movie: any | null }>({
    isOpen: false,
    movie: null
  });
  const [crawlModalOpen, setCrawlModalOpen] = useState(false);
  const [sortField, setSortField] = useState<string>('updatedAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [moviesPerPage, setMoviesPerPage] = useState(10);
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [filterYear, setFilterYear] = useState<number | undefined>(undefined);
  const [filterType, setFilterType] = useState<string>('');
  const [isOfflineMock, setIsOfflineMock] = useState<boolean>(false);

  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [elasticsearchStatus, setElasticsearchStatus] = useState<ElasticsearchStatus | null>(null);
  const [esStatusChecked, setEsStatusChecked] = useState<boolean>(false);

  useEffect(() => {
    const checkESStatus = async () => {
      try {
        const status = await checkElasticsearchStatus();
        setElasticsearchStatus(status);
        setEsStatusChecked(true);
      } catch (error) {

        setElasticsearchStatus({
          status: 'error',
          message: 'Không thể kết nối tới Elasticsearch'
        });
        setEsStatusChecked(true);
      }
    };

    checkESStatus();
  }, []);

  /**
   * Loads ONE page of the movie list.
   *
   * The request is guarded by a sequence number: when the user changes the
   * page or the filters quickly, the answer of the OLDER request must not
   * overwrite the answer of the NEWER one.
   */
  const fetchMovies = useCallback(async (page: number) => {
    const requestId = ++requestSeqRef.current;
    const isStale = (): boolean => requestId !== requestSeqRef.current;

    try {
      setLoading(true);

      const query = searchQuery.trim();
      // The search ALWAYS goes to the search route of the backend
      // (`/movies/search`), even when the Elasticsearch probe failed: the
      // list route does not know the `search` parameter, so it answered
      // with the WHOLE list and the search box looked like it worked.
      const response = query
        ? await searchMoviesWithElasticsearch(
            page,
            moviesPerPage,
            query,
            selectedCategory || undefined,
            filterStatus !== 'all' ? filterStatus : undefined,
            filterYear,
            filterType || undefined
          )
        : await getMoviesForAdmin(
            page,
            moviesPerPage,
            sortField,
            sortDirection,
            selectedCategory || undefined,
            filterStatus !== 'all' ? filterStatus : undefined,
            '',
            filterYear,
            filterType || undefined
          );

      if (isStale()) return;

      // An EMPTY list coming from the API is a VALID answer: it must not
      // be replaced by the mock dataset. The `source` flag of the service
      // tells the two cases apart.
      setMovies(response.movies as unknown as Movie[]);
      setIsOfflineMock(response.source === 'mock');

      const pagination = response.pagination || {};
      setTotalMovies(pagination.totalItems ?? 0);
      setTotalPages(Math.max(1, pagination.totalPages ?? 1));
    } catch (error) {
      if (isStale()) return;
      console.warn('[AdminMovies] The movie list could not be loaded:', error);
      toast.error('Không thể tải danh sách phim');
      setMovies([]);
      setTotalMovies(0);
      setTotalPages(1);
    } finally {
      if (!isStale()) setLoading(false);
    }
  }, [searchQuery, moviesPerPage, sortField, sortDirection, selectedCategory,
      filterStatus, filterYear, filterType]);

  const handleSearch = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;

    setSearchQuery(newValue);
    setIsSearching(newValue.trim() !== '');

    // The list restarts on the page 1 when the term changes.
    setCurrentPage(1);
  }, []);

  /**
   * Loads the list when the page or one of the filters changes.
   *
   * There is exactly ONE request per change: the old code called
   * `fetchMovies(p)` AND set the page, and the effect above called
   * `fetchMovies(currentPage)` again, so every page change fired TWO
   * parallel requests for the same page.
   *
   * The search is debounced, so the list is not reloaded on every keystroke.
   */
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchMovies(currentPage);
    }, searchQuery.trim() ? 300 : 0);

    return () => clearTimeout(timer);
  }, [currentPage, moviesPerPage, sortField, sortDirection, selectedCategory,
      filterStatus, filterYear, filterType, searchQuery, fetchMovies]);

  useEffect(() => {
    const fetchCategories = async () => {
      // The categories of the API are read from `/categories`, so the
      // filter uses the REAL slugs (`hanh-dong`, `hai`, ...). The route
      // `/admin/movies/categories` does not exist on the backend and it was
      // answered with an empty list, which left the filter with the local
      // mock ids (`cat-1`), and those ids mean nothing to the API.
      try {
        // The limit is raised, because the route of the backend is
        // paginated and answers 20 items per page by default.
        const response = await axiosInstance.get(apiPath(`taxonomyCategories`), {
          params: { page: 1, limit: 100 }
        });
        const payload = (response.data?.responseData ?? response.data) as
          | Record<string, unknown>
          | undefined;
        const list = Array.isArray(payload)
          ? payload
          : Array.isArray(payload?.data)
            ? payload.data
            : Array.isArray(payload?.categories)
              ? payload.categories
              : [];

        if (list.length > 0) {
          setCategories(
            list
              .map((item) => {
                const entry = item as Record<string, unknown>;
                return {
                  id: String(entry.id ?? entry._id ?? entry.slug ?? ''),
                  name: String(entry.name ?? entry.slug ?? ''),
                  slug: String(entry.slug ?? entry.name ?? '')
                };
              })
              .filter((item) => item.slug !== '')
          );
          return;
        }
      } catch (error) {
        // The route is not available: the local categories are used.
      }
      setCategories(INITIAL_CATEGORIES as any);
    };

    // The categories are read ONCE. The old code reloaded them after every
    // change of the movie list, which produced one extra request per
    // page change.
    fetchCategories();
  }, []);

  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const yearValue = e.target.value ? parseInt(e.target.value) : undefined;
    setFilterYear(yearValue);
    setCurrentPage(1);
  };

  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFilterType(e.target.value);
    setCurrentPage(1);
  };

  const handleAddMovie = () => {
    router.push('/admin/movies/add');
  };

  const handleEdit = (id: string) => {
    router.push(`/admin/movies/edit/${id}`);
  };

  const handleDeleteClick = (movie: Movie) => {
    setDeleteModal({ isOpen: true, movie });
  };

  const handleDeleteConfirm = async () => {
    if (deleteModal.movie) {
      try {
        await deleteMovieByAdmin(deleteModal.movie._id);
        toast.success('Xóa phim thành công');
        setDeleteModal({ isOpen: false, movie: null });
        fetchMovies(currentPage);
      } catch (error) {

        toast.error('Không thể xóa phim');
      }
    }
  };

  const handleToggleStatus = async (movie: Movie) => {
    try {
      if (!movie || !movie._id) {

        toast.error('Không thể cập nhật trạng thái - Thiếu thông tin phim');
        return;
      }

      const movieId = String(movie._id).trim();

      if (!movieId || movieId.length < 24) {

        toast.error('ID phim không hợp lệ, không thể cập nhật trạng thái');
        return;
      }

      const loadingToast = toast.loading('Đang cập nhật trạng thái phim...');

      // The current state is sent to the backend, so the service knows
      // which state the movie has to switch to.
      const response = await toggleMovieVisibility(movieId, Boolean(movie.isHidden));

      toast.dismiss(loadingToast);

      const newIsHidden = response.isHidden;
      toast.success(`Đã ${newIsHidden ? 'ẩn' : 'hiện'} phim thành công`);

      setMovies(prevMovies => {
        const updated = prevMovies.map(m =>
          m._id === movieId ? { ...m, isHidden: newIsHidden, visibilityKnown: true } : m
        );

        // The list route of the backend only returns the VISIBLE movies, so
        // a movie that has just been hidden does not belong to the list
        // anymore. When the "visible" filter is active, the row is
        // removed right away instead of staying on the table until the next
        // reload.
        if (newIsHidden && filterStatus === 'active') {
          return updated.filter(m => m._id !== movieId);
        }
        return updated;
      });

      // The total is corrected as well, so the footer agrees with the table.
      if (newIsHidden && filterStatus === 'active') {
        setTotalMovies(prev => Math.max(0, prev - 1));
      }
    } catch (error) {

      toast.error('Không thể cập nhật trạng thái hiển thị phim');
    }
  };

  // const handleSort = (field: string) => {
  //   if (sortField === field) {
  //     setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
  //   } else {
  //     setSortField(field);
  //     setSortDirection('asc');
  //   }
  //   setCurrentPage(1);
  // };

  const handlePerPageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setMoviesPerPage(parseInt(e.target.value));
    setCurrentPage(1);
  };
  const scrollToTop = () => {
    topRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
    const handleSyncAllRatings = async () => {
    try {
      setSyncingAllRatings(true);
      const loadingToast = toast.loading('Đang đồng bộ tất cả đánh giá...');

      await syncAllMovieRatings();

      toast.dismiss(loadingToast);
      toast.success('Đồng bộ tất cả đánh giá thành công!');

      // Refresh movie data to show updated ratings
      fetchMovies(currentPage);
    } catch (error) {

      toast.error('Không thể đồng bộ đánh giá');
    } finally {
      setSyncingAllRatings(false);
    }  };

  return (
    <div className={combinedStyles.container}>
      <header className={combinedStyles.header}>
        <div className="d-flex align-items-center gap-2">
          <h1 className={combinedStyles.headerTitle}>{ADMIN_MOVIES_I18N.pageTitle}</h1>
          {isOfflineMock && (
            <span
              className="badge"
              style={{
                backgroundColor: 'rgba(229, 9, 20, 0.12)',
                color: '#f87171',
                border: '1px solid rgba(229, 9, 20, 0.3)',
                fontSize: '0.74rem',
                fontWeight: 500,
                padding: '0.35rem 0.65rem'
              }}
              title={ADMIN_COMMON_I18N.notices.offlineHint}
            >
              {ADMIN_COMMON_I18N.notices.offlineMode}
            </span>
          )}
        </div>

        {esStatusChecked && (
          <div className={combinedStyles.elasticsearchStatus}>
            {elasticsearchStatus && (
              <div className={`${combinedStyles.esStatusBadge} ${combinedStyles[elasticsearchStatus.status]}`}>
                {elasticsearchStatus.status === 'active' ? (
                  <span title={`${elasticsearchStatus.documentCount || 0} documents indexed`}>
                    Elasticsearch: {isSearching && searchQuery.trim() ? 'Đang sử dụng' : 'Sẵn sàng'}
                  </span>
                ) : elasticsearchStatus.status === 'inactive' ? (
                  <span title="Elasticsearch is not available">
                    Elasticsearch: Không khả dụng
                  </span>
                ) : (
                  <span title={elasticsearchStatus.message}>
                    Elasticsearch: Lỗi
                  </span>
                )}
              </div>
            )}
          </div>
        )}
      </header>

      <div className={combinedStyles.toolBar}>
        <div className={combinedStyles.toolBarHeader}>
          <div className={combinedStyles.searchInput}>
            <div className={combinedStyles.searchIcon}>
              <FaSearch />
            </div>
            <input
              type="text"
              placeholder={isSearching && searchQuery.trim() ? "Tìm kiếm phim bằng Elasticsearch..." : "Tìm kiếm phim..."}
              value={searchQuery}
              onChange={handleSearch}
              className={combinedStyles.input}
            />
            {isSearching && searchQuery.trim() && (
              <div className={combinedStyles.searchBadge} title="Đang sử dụng Elasticsearch">
                <FaBolt className={combinedStyles.esBadgeIcon} />
              </div>
            )}
          </div>

          <div className={combinedStyles.actionButtons}>
            <button
              className={combinedStyles.syncAllRatingsButton}
              onClick={handleSyncAllRatings}
              disabled={syncingAllRatings}
              title="Đồng bộ đánh giá cho tất cả phim"
            >
              <FaSync className={syncingAllRatings ? combinedStyles.spinningIcon : ''} />
              <span>{syncingAllRatings ? 'Đang đồng bộ...' : 'Đồng bộ đánh giá'}</span>
            </button>

            <button
              className={combinedStyles.crawlButton}
              onClick={() => setCrawlModalOpen(true)}
              title="Crawl phim từ nguồn bên ngoài"
            >
              <FaDownload className={combinedStyles.crawlIcon} />
              <span>Crawl Phim</span>
            </button>

            <button className={combinedStyles.addButton} onClick={handleAddMovie}>
              <FaPlus />
              <span>Thêm Phim Mới</span>
            </button>
          </div>
        </div>

        <div className={combinedStyles.filterControls}>
          <CinemaDropdown
            options={[
              { value: '', label: ADMIN_MOVIES_I18N.filters.allCategories },
              // The SLUG is the value of the filter: the API filters on the
              // slug of the category (`hanh-dong`), not on its id.
              ...categories.map((c) => ({ value: c.slug || c.id, label: c.name }))
            ]}
            value={selectedCategory}
            onChange={(val) => {
              setSelectedCategory(val);
              setCurrentPage(1);
            }}
            prefixIcon={<FaFilter />}
            size="filter"
            ariaLabel="Lọc theo thể loại"
          />

          <CinemaDropdown
            options={[
              { value: 'all', label: ADMIN_MOVIES_I18N.filters.allStatuses },
              { value: 'active', label: ADMIN_MOVIES_I18N.filters.statusActive },
              { value: 'inactive', label: ADMIN_MOVIES_I18N.filters.statusInactive }
            ]}
            value={filterStatus}
            onChange={(val) => {
              setFilterStatus(val);
              setCurrentPage(1);
            }}
            prefixIcon={<FaEye />}
            size="filter"
            ariaLabel="Lọc theo trạng thái"
          />

          <CinemaDropdown
            options={[
              { value: '', label: ADMIN_MOVIES_I18N.filters.allYears },
              ...Array.from({ length: 30 }, (_, i) => new Date().getFullYear() - i).map((y) => ({
                value: y.toString(),
                label: `Năm ${y}`
              }))
            ]}
            value={filterYear?.toString() || ''}
            onChange={(val) => {
              setFilterYear(val ? parseInt(val) : undefined);
              setCurrentPage(1);
            }}
            prefixIcon={<FaCalendarAlt />}
            size="filter"
            ariaLabel="Lọc theo năm"
          />

          <CinemaDropdown
            options={[
              { value: '', label: ADMIN_MOVIES_I18N.filters.allTypes },
              { value: 'series', label: ADMIN_MOVIES_I18N.filters.typeSeries },
              { value: 'single', label: ADMIN_MOVIES_I18N.filters.typeSingle }
            ]}
            value={filterType}
            onChange={(val) => {
              setFilterType(val);
              setCurrentPage(1);
            }}
            prefixIcon={<FaFilm />}
            size="filter"
            ariaLabel="Lọc theo loại phim"
          />

          <CinemaDropdown
            options={[
              { value: 10, label: '10 phim / trang' },
              { value: 20, label: '20 phim / trang' },
              { value: 50, label: '50 phim / trang' }
            ]}
            value={moviesPerPage}
            onChange={(val) => {
              setMoviesPerPage(Number(val));
              setCurrentPage(1);
            }}
            size="filter"
            ariaLabel="Số phim mỗi trang"
          />

          <button
            className={combinedStyles.refreshButton}
            onClick={() => fetchMovies(currentPage)}
            title="Làm mới dữ liệu"
          >
            <FaSync />
          </button>
        </div>
      </div>

      <div className={`${cinemaTable.tableCard} ${cinemaTable.cardMobile}`}>
        <div className={`${cinemaTable.tableResponsive} ${cinemaTable.cardMobileTableWrap}`}>
              <table className={`${cinemaTable.dataTable} ${cinemaTable.cardMobile} ${cinemaTable.fixedLayout}`}>
            <thead>
              <tr>
                <th className={cinemaTable.colMovie}>{ADMIN_MOVIES_I18N.tableHeaders.movieName}</th>
                <th className={`${cinemaTable.colGenre} ${cinemaTable.hideMobile}`}>Thể loại & Quốc gia</th>
                <th className={`${cinemaTable.colMetrics} ${cinemaTable.hideTablet}`}>Tương tác</th>
                <th className={cinemaTable.colStatus}>Trạng thái</th>
                <th className={cinemaTable.colActions} style={{ textAlign: 'center' }}>{ADMIN_MOVIES_I18N.tableHeaders.actions}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className={combinedStyles.emptyTableRow}>
                    <div className={cinemaTable.emptyStateContainer}>
                      <FaSync className={`${combinedStyles.emptyStateIcon} ${combinedStyles.spinningIcon}`} />
                      <div className={cinemaTable.emptyStateTitle}>{ADMIN_COMMON_I18N.notices.loading}</div>
                    </div>
                  </td>
                </tr>
              ) : movies.length === 0 ? (
                <tr>
                  <td colSpan={5} className={combinedStyles.emptyTableRow}>
                    <div className={cinemaTable.emptyStateContainer}>
                      <FaFilm className={cinemaTable.emptyStateIcon} />
                      <div className={cinemaTable.emptyStateTitle}>
                        {ADMIN_MOVIES_I18N.emptyState.title}
                      </div>
                      <div className={cinemaTable.emptyStateSubtitle}>
                        {ADMIN_MOVIES_I18N.emptyState.subtitle}
                      </div>
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-secondary"
                        style={{ fontSize: '0.8rem', padding: '0.35rem 0.9rem' }}
                        onClick={() => {
                          setSelectedCategory('');
                          setFilterStatus('all');
                          setFilterYear(undefined);
                          setFilterType('');
                          setSearchQuery('');
                          setCurrentPage(1);
                        }}
                      >
                        {ADMIN_MOVIES_I18N.emptyState.resetFilter}
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                movies.map((movie) => (
                  <tr
                    key={movie._id}
                    className={combinedStyles.movieRow}
                  >
                    <td data-label="Phim">
                      <div className={cinemaTable.posterCell} onClick={() => setDetailModal({ isOpen: true, movie })} style={{ cursor: 'pointer' }}>
                        <div className={cinemaTable.posterThumb}>
                          <img
                            src={movie.thumb_url || movie.poster_url || '/placeholder.jpg'}
                            alt={movie.name}
                            className={cinemaTable.posterImg}
                            onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.jpg'; }}
                          />
                        </div>
                        <div className={cinemaTable.titleBlock}>
                          <div className={cinemaTable.primaryTitle} title={movie.name}>{movie.name}</div>
                          <div className={cinemaTable.secondaryTitle}>{movie.origin_name || 'N/A'}</div>
                          <div className={cinemaTable.metaRow}>
                            <span className={`${cinemaTable.metaChip} ${movie.type === 'series' ? cinemaTable.metaChipSeries : cinemaTable.metaChipSingle}`}>
                              {movie.type === 'series' ? 'Phim Bộ' : 'Phim Lẻ'}
                            </span>
                            <span>{movie.year || '2024'}</span>
                            {movie.time && <span>• {movie.time}</span>}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className={cinemaTable.hideMobile} data-label="Thể loại & Quốc gia">
                      <div className={cinemaTable.badgeList}>
                        {movie.category && movie.category.length > 0 ? (
                          movie.category.slice(0, 2).map((cat, idx) => (
                            <span key={idx} className={cinemaTable.genreBadge}>{typeof cat === 'string' ? cat : cat.name}</span>
                          ))
                        ) : (
                          <span style={{ color: '#6b7280', fontSize: '0.75rem' }}>Đang cập nhật</span>
                        )}
                      </div>
                      <div style={{ color: '#9ca3af', fontSize: '0.74rem', marginTop: '4px' }}>
                        {Array.isArray(movie.country)
                          ? movie.country.map((c) => (typeof c === 'string' ? c : c.name)).join(', ')
                          : (movie.country || 'N/A')}
                      </div>
                    </td>

                    <td className={cinemaTable.hideTablet} data-label="Tương tác">
                      <div className={cinemaTable.metricCell}>
                        <div className={cinemaTable.metricItem} title="Tổng lượt xem">
                          <FaEye className={cinemaTable.metricIconViews} />
                          <span className={cinemaTable.metricValue}>
                            {((movie.view_count || movie.views || 18450)).toLocaleString()}
                          </span>
                          <span style={{ color: '#6b7280', fontSize: '0.72rem' }}>views</span>
                        </div>
                        <div className={cinemaTable.metricItem} title="Lượt yêu thích & Đánh giá">
                          <FaHeart className={cinemaTable.metricIconLikes} />
                          <span>{((movie.like_count || 1260)).toLocaleString()}</span>
                          <span style={{ color: '#f59e0b', fontSize: '0.75rem', marginLeft: '4px' }}>
                            ★ {(movie.rating || 8.5).toFixed(1)}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td data-label="Trạng thái">
                      <label className={cinemaTable.statusSwitch} title={movie.isHidden ? 'Nhấn để hiển thị phim' : 'Nhấn để ẩn phim'}>
                        <span className={cinemaTable.toggleSwitch}>
                          <input
                            type="checkbox"
                            checked={!movie.isHidden}
                            onChange={() => handleToggleStatus(movie)}
                          />
                          <span className={cinemaTable.toggleSlider}></span>
                        </span>
                        <span className={`${cinemaTable.statusLabel} ${!movie.isHidden ? cinemaTable.statusLabelActive : cinemaTable.statusLabelInactive}`}>
                          {!movie.isHidden ? 'Hiển thị' : 'Tạm ẩn'}
                        </span>
                      </label>
                    </td>

                    <td data-label="Thao tác" style={{ textAlign: 'center' }}>
                      <div className={cinemaTable.rowActions} style={{ justifyContent: 'center' }}>
                        <button
                          className={`${cinemaTable.actionBtn} ${cinemaTable.actionBtnView}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            setDetailModal({ isOpen: true, movie });
                          }}
                          title="Xem chi tiết phim"
                        >
                          <FaEye />
                        </button>
                        <button
                          className={`${cinemaTable.actionBtn} ${cinemaTable.actionBtnEpisode}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            setEpisodeModal({ isOpen: true, movie });
                          }}
                          title="Quản lý tập phim & Stream Server"
                        >
                          <FaFilm />
                        </button>
                        <button
                          className={`${cinemaTable.actionBtn} ${cinemaTable.actionBtnEdit}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/admin/movies/edit/${movie._id || movie.id}`);
                          }}
                          title="Chỉnh sửa thông tin phim"
                        >
                          <FaPen />
                        </button>
                        <button
                          className={`${cinemaTable.actionBtn} ${cinemaTable.actionBtnDelete}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteClick(movie);
                          }}
                          title="Xóa phim"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

        {totalMovies > 0 && (
          <AdminPagination
            currentPage={currentPage}
            totalPages={totalPages || 1}
            totalItems={totalMovies}
            pageSize={moviesPerPage}
            onPageChange={(p) => {
              // ONLY the state is changed here: the effect above loads the
              // page. Calling `fetchMovies(p)` as well fired TWO requests
              // for the SAME page, and the slower one won.
              setCurrentPage(p);
            }}
            onPageSizeChange={(newSize) => {
              setMoviesPerPage(newSize);
              setCurrentPage(1);
            }}
            itemName="phim"
          />
        )}

        <BackToTop />

      <MovieDetailModal
        isOpen={detailModal.isOpen}
        movie={detailModal.movie}
        onClose={() => setDetailModal({ isOpen: false, movie: null })}
        onOpenEpisodeManager={(m) => setEpisodeModal({ isOpen: true, movie: m })}
      />
      <DeleteModal
        isOpen={deleteModal.isOpen}
        movie={deleteModal.movie}
        onClose={() => setDeleteModal({ isOpen: false, movie: null })}
        onConfirm={handleDeleteConfirm}
      />

      <CrawlModal
        isOpen={crawlModalOpen}
        onClose={() => setCrawlModalOpen(false)}
        onSuccess={() => fetchMovies(1)}
      />

      <EpisodeManagerModal
        isOpen={episodeModal.isOpen}
        movie={episodeModal.movie}
        onClose={() => setEpisodeModal({ isOpen: false, movie: null })}
      />
    </div>
  );
};

MoviesAdmin.getLayout = (page: React.ReactElement) => {
  return (
    <AdminRoute>
      <AdminLayout>{page}</AdminLayout>
    </AdminRoute>
  );
};

export default MoviesAdmin;