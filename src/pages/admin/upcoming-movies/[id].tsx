// src/pages/admin/upcoming-movies/[id].tsx
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { Spinner, Modal, Button } from 'react-bootstrap';
import Link from 'next/link';
import { FaEdit, FaTrash, FaArrowLeft, FaCalendarCheck, FaFilm } from 'react-icons/fa';
import AdminLayout from '@/components/Layout/AdminLayout';
import { getUpcomingMovieById, releaseUpcomingMovie, deleteUpcomingMovie, UpcomingMovie } from '@/services/admin/upcomingMovieService';
import ReleasedMovieLink from '@/components/Admin/UpcomingMovies/ReleasedMovieLink';
import styles from '@/styles/AdminUpcomingMovies.module.css';

const UpcomingMovieDetail: React.FC = () => {
  const router = useRouter();
  const { id } = router.query;

  const [movie, setMovie] = useState<UpcomingMovie | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showReleaseModal, setShowReleaseModal] = useState<boolean>(false);
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const [releasedMovieId, setReleasedMovieId] = useState<string | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState<boolean>(false);

  useEffect(() => {
    if (id) {
      fetchMovie(id as string);
    }
  }, [id]);

  const fetchMovie = async (movieId: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await getUpcomingMovieById(movieId);

      if (response.data?.upcomingMovie) {
        setMovie(response.data.upcomingMovie);
      } else if (response.data?.success && response.data?.upcomingMovie) {
        setMovie(response.data.upcomingMovie);
      } else {
        setError('Không thể tải thông tin phim');
      }
    } catch (err) {
      console.error('Error fetching movie:', err);
      setError('Đã xảy ra lỗi khi tải thông tin phim');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!id) return;

    try {
      await deleteUpcomingMovie(id as string);
      router.push('/admin/upcoming-movies');
    } catch (err) {
      console.error('Error deleting movie:', err);
      setError('Đã xảy ra lỗi khi xóa phim');
    }
  };

  const handleRelease = async () => {
    if (!id) return;

    try {
      const response = await releaseUpcomingMovie(id as string);

      if (response.data?.movie?._id) {
        setReleasedMovieId(response.data.movie._id);
        setShowSuccessModal(true);
      } else {
        alert('Phim đã được chuyển sang trạng thái phát hành thành công!');
        router.push('/admin/upcoming-movies');
      }
    } catch (err: any) {
      console.error('Error releasing movie:', err);
      setError(err.response?.data?.message || 'Đã xảy ra lỗi khi chuyển trạng thái phim');
    }
  };

  const formatDate = (dateString: string | Date | undefined) => {
    if (!dateString) return 'Chưa cập nhật';
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  return (
    <AdminLayout>
      <div className={styles.container}>
        <div className="container-fluid p-0">
          {/* Header Section */}
          <section className={styles.headerSection}>
            <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
              <div className="d-flex align-items-center gap-3">
                <Link href="/admin/upcoming-movies" className={styles.viewReleasedBtn}>
                  <FaArrowLeft className="me-1" /> Quay lại danh sách
                </Link>
                <h1 className={styles.headerTitle}>Chi tiết phim sắp ra mắt</h1>
              </div>
              {movie && (
                <div className="d-flex align-items-center gap-2">
                  <Link href={`/admin/upcoming-movies/edit/${id}`} className={styles.viewReleasedBtn}>
                    <FaEdit className="me-1" style={{ color: '#fbbf24' }} /> Chỉnh sửa
                  </Link>
                  <button
                    type="button"
                    className={styles.viewReleasedBtn}
                    onClick={() => setShowDeleteModal(true)}
                    style={{ borderColor: 'rgba(239, 68, 68, 0.3)', color: '#f87171' }}
                  >
                    <FaTrash className="me-1" /> Xóa
                  </button>
                  {!movie.is_released && (
                    <button
                      type="button"
                      className={styles.addMovieBtn}
                      onClick={() => setShowReleaseModal(true)}
                      style={{ backgroundColor: '#10b981', borderColor: '#10b981' }}
                    >
                      <FaCalendarCheck className="me-1" /> Phát hành
                    </button>
                  )}
                </div>
              )}
            </div>
          </section>

          {/* Content */}
          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="danger" role="status" style={{ width: '2.5rem', height: '2.5rem' }}>
                <span className="visually-hidden">Đang tải...</span>
              </Spinner>
              <p className="mt-3 text-muted" style={{ fontSize: '0.9rem' }}>Đang tải thông tin phim...</p>
            </div>
          ) : error ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyText} style={{ color: '#f87171' }}>{error}</div>
              <Link href="/admin/upcoming-movies" className={styles.viewReleasedBtn}>
                <FaArrowLeft className="me-1" /> Quay lại danh sách
              </Link>
            </div>
          ) : movie ? (
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <h2 className={styles.cardTitle}>
                  <FaFilm style={{ color: '#e50914' }} />
                  {movie.name}
                </h2>
                <div>
                  {movie.is_released ? (
                    <span className={styles.badgeReleased}>Đã phát hành</span>
                  ) : (
                    <span className={styles.badgeCinema}>Chờ công chiếu</span>
                  )}
                </div>
              </div>

              <div className={styles.cardBody}>
                {id && <ReleasedMovieLink upcomingMovieId={id as string} />}

                <div className="row g-4 mt-1">
                  {/* Poster Thumbnail */}
                  <div className="col-12 col-md-4 col-lg-3">
                    <div
                      style={{
                        background: '#0e131d',
                        borderRadius: '8px',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        padding: '10px',
                        textAlign: 'center',
                      }}
                    >
                      {movie.thumb_url || movie.poster_url ? (
                        <img
                          src={movie.thumb_url || movie.poster_url}
                          alt={movie.name}
                          style={{
                            maxWidth: '100%',
                            height: 'auto',
                            maxHeight: '380px',
                            borderRadius: '6px',
                            objectFit: 'cover',
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            height: '240px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#64748b',
                            fontSize: '0.9rem',
                          }}
                        >
                          Không có hình ảnh
                        </div>
                      )}
                    </div>

                    <div className="mt-3 d-flex flex-wrap gap-2 justify-content-center">
                      {movie.chieurap && <span className={styles.badgeCinema}>Chiếu rạp</span>}
                      {movie.isHidden && <span className={styles.badgeHidden}>Đã ẩn</span>}
                      {movie.quality && (
                        <span style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: '4px', background: 'rgba(255,255,255,0.06)', color: '#cbd5e1' }}>
                          {movie.quality}
                        </span>
                      )}
                      {movie.lang && (
                        <span style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: '4px', background: 'rgba(255,255,255,0.06)', color: '#cbd5e1' }}>
                          {movie.lang}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Metadata & Details */}
                  <div className="col-12 col-md-8 col-lg-9">
                    <div className="mb-4">
                      <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#ffffff' }}>
                        {movie.name}
                      </div>
                      <div style={{ fontSize: '1rem', color: '#94a3b8', marginTop: '2px' }}>
                        {movie.origin_name || 'Chưa có tên gốc'}
                      </div>
                    </div>

                    {/* Metadata Grid */}
                    <div
                      style={{
                        background: '#0e131d',
                        borderRadius: '8px',
                        border: '1px solid rgba(255, 255, 255, 0.06)',
                        padding: '18px 20px',
                        marginBottom: '24px',
                      }}
                    >
                      <div className="row g-3">
                        <div className="col-12 col-sm-6">
                          <div className={styles.metaItem} style={{ marginBottom: '8px' }}>
                            <span className={styles.metaLabel}>Năm phát hành:</span>
                            <span style={{ color: '#ffffff', fontWeight: 500 }}>{movie.year || '—'}</span>
                          </div>
                          <div className={styles.metaItem} style={{ marginBottom: '8px' }}>
                            <span className={styles.metaLabel}>Ngày dự kiến:</span>
                            <span style={{ color: '#ffffff', fontWeight: 500 }}>{formatDate(movie.release_date)}</span>
                          </div>
                          <div className={styles.metaItem} style={{ marginBottom: '8px' }}>
                            <span className={styles.metaLabel}>Thể loại:</span>
                            <span style={{ color: '#cbd5e1' }}>
                              {movie.category?.map((c) => c.name).join(', ') || 'Chưa cập nhật'}
                            </span>
                          </div>
                          <div className={styles.metaItem}>
                            <span className={styles.metaLabel}>Quốc gia:</span>
                            <span style={{ color: '#cbd5e1' }}>
                              {movie.country?.map((c) => c.name).join(', ') || 'Chưa cập nhật'}
                            </span>
                          </div>
                        </div>

                        <div className="col-12 col-sm-6">
                          <div className={styles.metaItem} style={{ marginBottom: '8px' }}>
                            <span className={styles.metaLabel}>Đạo diễn:</span>
                            <span style={{ color: '#cbd5e1' }}>{movie.director?.join(', ') || 'Chưa cập nhật'}</span>
                          </div>
                          <div className={styles.metaItem} style={{ marginBottom: '8px' }}>
                            <span className={styles.metaLabel}>Diễn viên:</span>
                            <span style={{ color: '#cbd5e1' }}>{movie.actor?.join(', ') || 'Chưa cập nhật'}</span>
                          </div>
                          <div className={styles.metaItem} style={{ marginBottom: '8px' }}>
                            <span className={styles.metaLabel}>Định dạng / Loại:</span>
                            <span style={{ color: '#cbd5e1' }}>{movie.type || 'Phim lẻ'}</span>
                          </div>
                          <div className={styles.metaItem}>
                            <span className={styles.metaLabel}>Trạng thái:</span>
                            <span style={{ color: '#cbd5e1' }}>{movie.status || 'Sắp ra mắt'}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Content Section */}
                    <div>
                      <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#f1f5f9', marginBottom: '10px' }}>
                        Nội dung tóm tắt
                      </h3>
                      <div
                        style={{
                          background: '#0e131d',
                          borderRadius: '8px',
                          border: '1px solid rgba(255, 255, 255, 0.06)',
                          padding: '16px 20px',
                          color: '#cbd5e1',
                          fontSize: '0.9rem',
                          lineHeight: 1.6,
                        }}
                        dangerouslySetInnerHTML={{ __html: movie.content || '<p class="text-muted mb-0">Chưa có nội dung miêu tả cho phim này.</p>' }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {/* Delete Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title style={{ fontSize: '1.1rem', fontWeight: 600 }}>Xác nhận xoá phim</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div>
            Bạn có chắc chắn muốn xoá phim <strong style={{ color: '#ffffff' }}>"{movie?.name}"</strong> không?
            <div className="mt-2 text-muted" style={{ fontSize: '0.85rem' }}>
              Hành động này sẽ xoá vĩnh viễn và không thể hoàn tác.
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" size="sm" onClick={() => setShowDeleteModal(false)}>
            Hủy bỏ
          </Button>
          <Button variant="danger" size="sm" onClick={handleDelete} style={{ backgroundColor: '#e50914', borderColor: '#e50914' }}>
            Xác nhận xoá
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Release Modal */}
      <Modal show={showReleaseModal} onHide={() => setShowReleaseModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title style={{ fontSize: '1.1rem', fontWeight: 600 }}>Xác nhận phát hành phim</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div>
            Bạn có chắc chắn muốn chuyển phim <strong style={{ color: '#ffffff' }}>"{movie?.name}"</strong> sang trạng thái đã phát hành không?
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" size="sm" onClick={() => setShowReleaseModal(false)}>
            Hủy bỏ
          </Button>
          <Button variant="success" size="sm" onClick={handleRelease}>
            Phát hành ngay
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Success Modal */}
      <Modal show={showSuccessModal} onHide={() => setShowSuccessModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title style={{ fontSize: '1.1rem', fontWeight: 600, color: '#34d399' }}>Phát hành phim thành công</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div>
            Phim <strong style={{ color: '#ffffff' }}>"{movie?.name}"</strong> đã được tạo thành công trong danh sách phim chính thức!
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" size="sm" onClick={() => router.push('/admin/upcoming-movies')}>
            Về danh sách
          </Button>
          {releasedMovieId && (
            <Link href={`/admin/movies/edit/${releasedMovieId}`} passHref>
              <Button variant="success" size="sm">
                Xem phim đã phát hành
              </Button>
            </Link>
          )}
        </Modal.Footer>
      </Modal>
    </AdminLayout>
  );
};

export default UpcomingMovieDetail;
