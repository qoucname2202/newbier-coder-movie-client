// src/pages/admin/upcoming-movies/index.tsx
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import styles from '@/styles/AdminUpcomingMovies.module.css';
import { Spinner } from 'react-bootstrap';
import { FaPlus, FaEdit, FaTrash, FaSearch, FaEye, FaPaperPlane, FaFilm, FaCalendarAlt } from 'react-icons/fa';
import AdminLayout from '@/components/Layout/AdminLayout';
import ConfirmModal from '@/components/Admin/Common/ConfirmModal';
import { getUpcomingMovies, deleteUpcomingMovie, releaseUpcomingMovie } from '@/services/admin/upcomingMovieService';
import { UpcomingMovie } from '@/services/admin/upcomingMovieService';
import Pagination from '@/components/Admin/Common/Pagination';

const UpcomingMoviesPage: React.FC = () => {
  const router = useRouter();
  const [upcomingMovies, setUpcomingMovies] = useState<UpcomingMovie[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(10);
  const [totalMovies, setTotalMovies] = useState<number>(0);
  const [selectedMovie, setSelectedMovie] = useState<UpcomingMovie | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const [showReleaseModal, setShowReleaseModal] = useState<boolean>(false);
  const [refreshData, setRefreshData] = useState<boolean>(false);

  useEffect(() => {
    fetchUpcomingMovies();
  }, [page, limit, searchTerm, refreshData]);

  const fetchUpcomingMovies = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getUpcomingMovies(page, limit, searchTerm);

      if (response.data && response.data.upcomingMovies) {
        setUpcomingMovies(response.data.upcomingMovies);
        setTotalMovies(response.data.totalCount || 0);
      } else {
        setUpcomingMovies([]);
        setTotalMovies(0);
        setError('Không có dữ liệu phim sắp ra mắt');
      }
    } catch (err: any) {
      console.error('Error fetching upcoming movies:', err);
      setError('Lỗi khi tải dữ liệu phim sắp ra mắt');
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
  };

  const handleDeleteClick = (movie: UpcomingMovie) => {
    setSelectedMovie(movie);
    setShowDeleteModal(true);
  };

  const handleReleaseClick = (movie: UpcomingMovie) => {
    setSelectedMovie(movie);
    setShowReleaseModal(true);
  };

  const confirmDelete = async () => {
    if (!selectedMovie?._id) return;

    try {
      await deleteUpcomingMovie(selectedMovie._id);
      setShowDeleteModal(false);
      alert('Xoá phim sắp ra mắt thành công!');
      setRefreshData(!refreshData);
    } catch (err) {
      console.error('Error deleting upcoming movie:', err);
      alert('Lỗi khi xóa phim sắp ra mắt');
    }
  };

  const confirmRelease = async () => {
    if (!selectedMovie?._id) return;

    try {
      const response = await releaseUpcomingMovie(selectedMovie._id);
      setShowReleaseModal(false);

      if (response.data?.movie?._id) {
        const newMovieId = response.data.movie._id;
        if (confirm(`Phim đã được chuyển sang trạng thái phát hành thành công! Bạn có muốn xem phim đã phát hành không?`)) {
          router.push(`/admin/movies/edit/${newMovieId}`);
        } else {
          setRefreshData(!refreshData);
        }
      } else {
        alert('Phim đã được chuyển sang trạng thái phát hành!');
        setRefreshData(!refreshData);
      }
    } catch (err) {
      console.error('Error releasing movie:', err);
      alert('Lỗi khi chuyển trạng thái phim');
    }
  };

  return (
    <AdminLayout>
      <div className={styles.container}>
        <div className="container-fluid p-0">
          {/* Header Section */}
          <section className={styles.headerSection}>
            <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
              <div>
                <h1 className={styles.headerTitle}>Quản lý Phim Sắp Ra Mắt</h1>
                <p className={styles.headerSubtitle}>
                  Theo dõi, cập nhật và phát hành phim chờ công chiếu
                </p>
              </div>
              <div className={styles.headerActions}>
                <Link href="/admin/movies" className={styles.viewReleasedBtn}>
                  <FaFilm /> Danh sách phim đã phát hành
                </Link>
                <Link href="/admin/upcoming-movies/new" className={styles.addMovieBtn}>
                  <FaPlus /> Thêm phim mới
                </Link>
              </div>
            </div>
          </section>

          {/* Main Card */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>
                <FaCalendarAlt style={{ color: '#e50914', fontSize: '1.1rem' }} />
                Danh sách phim chờ công chiếu
              </h2>
            </div>

            <div className={styles.cardBody}>
              {/* Toolbar */}
              <div className={styles.toolbar}>
                <form onSubmit={handleSearch} className={styles.searchForm}>
                  <div className={styles.searchGroup}>
                    <input
                      type="text"
                      className={styles.searchInput}
                      placeholder="Tìm kiếm phim theo tên, tên gốc..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <button type="submit" className={styles.searchSubmitBtn} title="Tìm kiếm">
                      <FaSearch />
                    </button>
                  </div>
                </form>

                <div className={styles.limitSelector}>
                  <span style={{ fontSize: '0.84rem', color: '#94a3b8' }}>Hiển thị:</span>
                  <select
                    className={styles.selectInput}
                    value={limit}
                    onChange={(e) => {
                      setLimit(parseInt(e.target.value));
                      setPage(1);
                    }}
                    aria-label="Số lượng hiển thị"
                  >
                    <option value="10">10 phim / trang</option>
                    <option value="25">25 phim / trang</option>
                    <option value="50">50 phim / trang</option>
                    <option value="100">100 phim / trang</option>
                  </select>
                </div>
              </div>

              {/* Table or Loading */}
              {loading ? (
                <div className="text-center py-5">
                  <Spinner animation="border" variant="danger" role="status" style={{ width: '2.5rem', height: '2.5rem' }}>
                    <span className="visually-hidden">Đang tải...</span>
                  </Spinner>
                  <p className="mt-3 text-muted" style={{ fontSize: '0.9rem' }}>Đang tải danh sách phim sắp ra mắt...</p>
                </div>
              ) : upcomingMovies.length > 0 ? (
                <>
                  <div className={styles.tableResponsive}>
                    <table className={styles.movieTable}>
                      <thead>
                        <tr>
                          <th className="text-center" style={{ width: "5%" }}>#</th>
                          <th style={{ width: "35%" }}>Tên phim</th>
                          <th style={{ width: "28%" }}>Thông tin chi tiết</th>
                          <th className="text-center" style={{ width: "16%" }}>Ngày phát hành</th>
                          <th className="text-center" style={{ width: "16%" }}>Thao tác</th>
                        </tr>
                      </thead>
                      <tbody>
                        {upcomingMovies.map((movie, index) => (
                          <tr key={movie._id}>
                            <td className={styles.idCol}>
                              {(page - 1) * limit + index + 1}
                            </td>
                            <td>
                              <div className={styles.movieTitle}>{movie.name}</div>
                              <div className={styles.movieOriginName}>{movie.origin_name || '—'}</div>
                              <div className={styles.badgesRow}>
                                {movie.chieurap && (
                                  <span className={styles.badgeCinema}>Chiếu rạp</span>
                                )}
                                {movie.isHidden && (
                                  <span className={styles.badgeHidden}>Đã ẩn</span>
                                )}
                                {movie.is_released && (
                                  <span className={styles.badgeReleased}>Đã phát hành</span>
                                )}
                              </div>
                            </td>
                            <td>
                              <div className={styles.metaItem}>
                                <span className={styles.metaLabel}>Năm:</span>
                                <span>{movie.year || '—'}</span>
                              </div>
                              <div className={styles.metaItem}>
                                <span className={styles.metaLabel}>Thể loại:</span>
                                <span>{movie.category?.map(c => c.name).join(', ') || 'Chưa cập nhật'}</span>
                              </div>
                              <div className={styles.metaItem}>
                                <span className={styles.metaLabel}>Quốc gia:</span>
                                <span>{movie.country?.map(c => c.name).join(', ') || 'Chưa cập nhật'}</span>
                              </div>
                            </td>
                            <td className="text-center">
                              {movie.release_date ? (
                                <div className={styles.releaseDateText}>
                                  {new Date(movie.release_date).toLocaleDateString('vi-VN')}
                                </div>
                              ) : (
                                <span className={styles.releaseDateMuted}>Chưa xác định</span>
                              )}
                            </td>
                            <td className="text-center">
                              <div className={styles.actionButtons}>
                                <Link
                                  href={`/admin/upcoming-movies/${movie._id}`}
                                  className={`${styles.actionBtn} ${styles.actionBtnView}`}
                                  title="Xem chi tiết"
                                >
                                  <FaEye />
                                </Link>
                                <Link
                                  href={`/admin/upcoming-movies/edit/${movie._id}`}
                                  className={`${styles.actionBtn} ${styles.actionBtnEdit}`}
                                  title="Chỉnh sửa"
                                >
                                  <FaEdit />
                                </Link>
                                <button
                                  type="button"
                                  className={`${styles.actionBtn} ${styles.actionBtnDelete}`}
                                  title="Xóa phim"
                                  onClick={() => handleDeleteClick(movie)}
                                >
                                  <FaTrash />
                                </button>
                                {!movie.is_released && (
                                  <button
                                    type="button"
                                    className={`${styles.actionBtn} ${styles.actionBtnRelease}`}
                                    title="Chuyển sang phát hành chính thức"
                                    onClick={() => handleReleaseClick(movie)}
                                  >
                                    <FaPaperPlane />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className={styles.paginationRow}>
                    <div className={styles.summaryText}>
                      Hiển thị {Math.min((page - 1) * limit + 1, totalMovies)} - {Math.min(page * limit, totalMovies)} trên tổng số {totalMovies} phim
                    </div>
                    <Pagination
                      currentPage={page}
                      totalPages={Math.ceil(totalMovies / limit)}
                      onPageChange={handlePageChange}
                    />
                  </div>
                </>
              ) : (
                <div className={styles.emptyState}>
                  <div className={styles.emptyText}>
                    {error ? error : 'Hiện tại chưa có phim sắp ra mắt nào trong danh sách.'}
                  </div>
                  <Link href="/admin/upcoming-movies/new" className={styles.addMovieBtn}>
                    <FaPlus className="me-1" /> Thêm phim sắp ra mắt
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Delete Modal */}
      <ConfirmModal
        show={showDeleteModal}
        title="Xác nhận xoá phim"
        message={selectedMovie ? `Bạn có chắc chắn muốn xoá phim "${selectedMovie.name}" không? Hành động này sẽ xoá vĩnh viễn và không thể hoàn tác.` : ''}
        confirmText="Xác nhận xoá"
        cancelText="Hủy bỏ"
        onConfirm={confirmDelete}
        onCancel={() => setShowDeleteModal(false)}
      />

      {/* Release Modal */}
      <ConfirmModal
        show={showReleaseModal}
        title="Xác nhận phát hành phim"
        message={selectedMovie ? `Bạn có chắc chắn muốn chuyển phim "${selectedMovie.name}" sang trạng thái đã phát hành chính thức không?` : ''}
        confirmText="Phát hành ngay"
        cancelText="Hủy bỏ"
        onConfirm={confirmRelease}
        onCancel={() => setShowReleaseModal(false)}
      />
    </AdminLayout>
  );
};

export default UpcomingMoviesPage;
