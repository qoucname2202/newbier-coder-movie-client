// src/pages/admin/upcoming-movies/[id].tsx
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { Card, Button, Row, Col, Alert, Spinner, Badge, Modal } from 'react-bootstrap';
import Link from 'next/link';
import { FaEdit, FaTrash, FaArrowLeft, FaCalendarCheck } from 'react-icons/fa';
import AdminLayout from '../../../components/Layout/AdminLayout';
import { getUpcomingMovieById, releaseUpcomingMovie, deleteUpcomingMovie, UpcomingMovie } from '../../../services/admin/upcomingMovieService';
import ReleasedMovieLink from '../../../components/Admin/UpcomingMovies/ReleasedMovieLink';

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
      console.log('Movie data:', response.data);
      
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
      console.log('Release response:', response.data);
      
      // Get the ID of the newly created regular movie
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

  const formatDate = (dateString: string | Date) => {
    if (!dateString) return 'Chưa cập nhật';
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="content-wrapper">
          <div className="content-header">
            <div className="container-fluid">
              <h1 style={{ color: 'black' }}>Chi tiết phim sắp ra mắt</h1>
            </div>
          </div>
          <div className="content">
            <div className="container-fluid">
              <div className="text-center py-5">
                <Spinner animation="border" role="status">
                  <span className="visually-hidden">Đang tải...</span>
                </Spinner>
              </div>
            </div>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="content-wrapper">
        <section className="content-header">
          <div className="container-fluid">
            <Row>
              <Col>
                <h1 style={{ color: 'black' }}>Chi tiết phim sắp ra mắt</h1>
              </Col>
            </Row>
          </div>
        </section>

        <section className="content">
          <div className="container-fluid">
            {error && (
              <Alert variant="danger" className="mb-4">
                {error}
              </Alert>
            )}

            <Link href="/admin/upcoming-movies" passHref>
              <Button variant="secondary" className="mb-3">
                <FaArrowLeft className="me-2" /> Quay lại danh sách
              </Button>
            </Link>

            {movie && (
              <Card>
                <Card.Header className="bg-primary text-white d-flex justify-content-between align-items-center">
                  <h3 className="card-title">Chi tiết phim: {movie.name}</h3>
                  <div>
                    <Link href={`/admin/upcoming-movies/edit/${id}`} passHref>
                      <Button variant="warning" size="sm" className="me-2">
                        <FaEdit className="me-1" /> Chỉnh sửa
                      </Button>
                    </Link>
                    <Button variant="danger" size="sm" onClick={() => setShowDeleteModal(true)} className="me-2">
                      <FaTrash className="me-1" /> Xóa
                    </Button>
                    {!movie.is_released && (
                      <Button variant="success" size="sm" onClick={() => setShowReleaseModal(true)}>
                        <FaCalendarCheck className="me-1" /> Phát hành
                      </Button>
                    )}
                  </div>
                </Card.Header>
                <Card.Body>
                  <Row>
                    <Col md={3}>
                      <div className="text-center mb-4">
                        {movie.thumb_url ? (
                          <img
                            src={movie.thumb_url}
                            alt={movie.name}
                            className="img-fluid rounded"
                            style={{ maxHeight: '300px', objectFit: 'cover' }}
                          />
                        ) : (
                          <div className="bg-secondary text-white d-flex justify-content-center align-items-center rounded" style={{ height: '300px' }}>
                            Không có hình ảnh
                          </div>
                        )}
                      </div>
                    </Col>
                    <Col md={9}>                      <h4 className="mb-3">{movie.name} {movie.is_released && <Badge bg="success">Đã phát hành</Badge>}</h4>
                      <p className="text-muted">{movie.origin_name}</p>
                      
                      {movie.is_released && id && (
                        <ReleasedMovieLink upcomingMovieId={id as string} />
                      )}
                      
                      <Row>
                        <Col md={6}>
                          <div className="mb-3">
                            <strong>Năm sản xuất:</strong> {movie.year}
                          </div>
                          <div className="mb-3">
                            <strong>Thể loại:</strong> {movie.category?.map(c => c.name).join(', ') || 'Chưa cập nhật'}
                          </div>
                          <div className="mb-3">
                            <strong>Quốc gia:</strong> {movie.country?.map(c => c.name).join(', ') || 'Chưa cập nhật'}
                          </div>
                          <div className="mb-3">
                            <strong>Đạo diễn:</strong> {movie.director?.join(', ') || 'Chưa cập nhật'}
                          </div>
                        </Col>
                        <Col md={6}>
                          <div className="mb-3">
                            <strong>Diễn viên:</strong> {movie.actor?.join(', ') || 'Chưa cập nhật'}
                          </div>
                          <div className="mb-3">
                            <strong>Chất lượng:</strong> {movie.quality || 'Chưa cập nhật'}
                          </div>
                          <div className="mb-3">
                            <strong>Ngôn ngữ:</strong> {movie.lang || 'Chưa cập nhật'}
                          </div>
                          <div className="mb-3">
                            <strong>Ngày phát hành dự kiến:</strong> {formatDate(movie.release_date)}
                          </div>
                        </Col>
                      </Row>
                      
                      <div className="mt-4">
                        <h5>Nội dung phim</h5>
                        <div dangerouslySetInnerHTML={{ __html: movie.content || 'Chưa cập nhật nội dung' }} />
                      </div>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>
            )}
          </div>
        </section>
      </div>

      {/* Modal Xác nhận xoá phim */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Xác nhận xoá phim</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>
            Bạn có chắc chắn muốn xoá phim <strong>"{movie?.name}"</strong> không?
            <br />
            Hành động này không thể hoàn tác.
          </p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Hủy
          </Button>
          <Button variant="danger" onClick={handleDelete}>
            Xoá
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modal Xác nhận chuyển trạng thái phát hành */}
      <Modal show={showReleaseModal} onHide={() => setShowReleaseModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Xác nhận phát hành phim</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>
            Bạn có chắc chắn muốn chuyển phim <strong>"{movie?.name}"</strong> sang trạng thái đã phát hành không?
          </p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowReleaseModal(false)}>
            Hủy
          </Button>
          <Button variant="success" onClick={handleRelease}>
            Phát hành
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modal Thông báo phát hành thành công */}
      <Modal show={showSuccessModal} onHide={() => setShowSuccessModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Phát hành phim thành công</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>
            Phim <strong>"{movie?.name}"</strong> đã được chuyển sang trạng thái đã phát hành thành công!
          </p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => router.push('/admin/upcoming-movies')}>
            Quay lại danh sách
          </Button>
          {releasedMovieId && (
            <Link href={`/admin/movies/edit/${releasedMovieId}`} passHref>
              <Button variant="primary">
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
