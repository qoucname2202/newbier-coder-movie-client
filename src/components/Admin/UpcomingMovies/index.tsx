// src/components/Admin/UpcomingMovies/index.tsx
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Table, Button, Spinner, Form, InputGroup, Row, Col, Card, Alert, Badge, Modal } from 'react-bootstrap';
import { FaPlus, FaEdit, FaTrash, FaSearch, FaFileCsv, FaEye, FaFileExport } from 'react-icons/fa';
import AdminLayout from '@/components/Layout/AdminLayout';
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
      console.log('Upcoming movies data:', response.data);
      
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
        // If we get back the new movie ID, show it in the alert
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

  const exportToCsv = () => {
    // Implement CSV export functionality if needed
    alert('Chức năng xuất CSV sẽ được phát triển sau');
  };

  return (
    <AdminLayout>
      <div className="content-wrapper">
        <section className="content-header">
          <div className="container-fluid">            <Row>
              <Col>
                <h1>Quản lý Phim Sắp Ra Mắt</h1>
              </Col>
              <Col xs="auto">
                <Link href="/admin/movies" passHref>
                  <Button variant="outline-primary">
                    Xem danh sách phim đã phát hành
                  </Button>
                </Link>
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

            <Card className="mb-4">
              <Card.Header className="bg-primary text-white d-flex justify-content-between align-items-center">
                <h3 className="card-title">Danh sách phim sắp ra mắt</h3>
                <div>
                  <Link href="/admin/upcoming-movies/new" passHref>
                    <Button variant="success" size="sm" className="me-2">
                      <FaPlus className="me-1" /> Thêm Phim
                    </Button>
                  </Link>
                  <Button variant="light" size="sm" onClick={exportToCsv}>
                    <FaFileExport className="me-1" /> Xuất Excel
                  </Button>
                </div>
              </Card.Header>
              <Card.Body>
                <Form onSubmit={handleSearch} className="mb-4">
                  <Row>
                    <Col md={6} lg={4}>
                      <InputGroup>
                        <Form.Control
                          placeholder="Tìm kiếm phim..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <Button variant="outline-secondary" type="submit">
                          <FaSearch />
                        </Button>
                      </InputGroup>
                    </Col>
                    <Col md={3} lg={2}>
                      <Form.Select
                        value={limit}
                        onChange={(e) => setLimit(parseInt(e.target.value))}
                        aria-label="Số lượng hiển thị"
                      >
                        <option value="10">10 phim</option>
                        <option value="25">25 phim</option>
                        <option value="50">50 phim</option>
                        <option value="100">100 phim</option>
                      </Form.Select>
                    </Col>
                  </Row>
                </Form>

                {loading ? (
                  <div className="text-center p-5">
                    <Spinner animation="border" role="status">
                      <span className="visually-hidden">Đang tải...</span>
                    </Spinner>
                  </div>
                ) : upcomingMovies.length > 0 ? (
                  <>
                    <div className="table-responsive">
                      <Table striped bordered hover>
                        <thead>
                          <tr>
                            <th className="text-center" style={{ width: '5%' }}>ID</th>
                            <th className="text-center" style={{ width: '15%' }}>Hình ảnh</th>
                            <th style={{ width: '30%' }}>Tên phim</th>
                            <th style={{ width: '25%' }}>Thông tin</th>
                            <th className="text-center" style={{ width: '15%' }}>Ngày phát hành</th>
                            <th className="text-center" style={{ width: '10%' }}>Thao tác</th>
                          </tr>
                        </thead>
                        <tbody>
                          {upcomingMovies.map((movie, index) => (
                            <tr key={movie._id}>
                              <td className="text-center">
                                {(page - 1) * limit + index + 1}
                              </td>
                              <td className="text-center">
                                {movie.thumb_url ? (
                                  <img
                                    src={movie.thumb_url}
                                    alt={movie.name}
                                    width="80"
                                    height="120"
                                    style={{ objectFit: 'cover' }}
                                  />
                                ) : (
                                  <div 
                                    className="bg-secondary text-white d-flex justify-content-center align-items-center"
                                    style={{ width: '80px', height: '120px', margin: '0 auto' }}
                                  >
                                    No image
                                  </div>
                                )}
                              </td>
                              <td>
                                <strong>{movie.name}</strong>
                                <div className="text-muted small">{movie.origin_name}</div>
                                {movie.chieurap && (
                                  <Badge bg="info" className="me-1 mt-1">Chiếu rạp</Badge>
                                )}
                                {movie.isHidden && (
                                  <Badge bg="secondary" className="me-1 mt-1">Đã ẩn</Badge>
                                )}
                                {movie.is_released && (
                                  <Badge bg="success" className="me-1 mt-1">Đã phát hành</Badge>
                                )}
                              </td>
                              <td>
                                <div><strong>Năm:</strong> {movie.year}</div>
                                <div>
                                  <strong>Thể loại:</strong> {movie.category?.map(c => c.name).join(', ') || 'Không có'}
                                </div>
                                <div>
                                  <strong>Quốc gia:</strong> {movie.country?.map(c => c.name).join(', ') || 'Không có'}
                                </div>
                              </td>
                              <td className="text-center">
                                {movie.release_date ? (
                                  <div>
                                    {new Date(movie.release_date).toLocaleDateString('vi-VN')}
                                  </div>
                                ) : (
                                  <span className="text-muted">Chưa cập nhật</span>
                                )}
                              </td>
                              <td className="text-center">
                                <div className="btn-group">
                                  <Link href={`/admin/upcoming-movies/${movie._id}`} passHref>
                                    <Button variant="info" size="sm" title="Xem chi tiết" className="me-1">
                                      <FaEye />
                                    </Button>
                                  </Link>
                                  <Link href={`/admin/upcoming-movies/edit/${movie._id}`} passHref>
                                    <Button variant="warning" size="sm" title="Sửa" className="me-1">
                                      <FaEdit />
                                    </Button>
                                  </Link>
                                  <Button
                                    variant="danger"
                                    size="sm"
                                    title="Xóa"
                                    className="me-1"
                                    onClick={() => handleDeleteClick(movie)}
                                  >
                                    <FaTrash />
                                  </Button>
                                  {!movie.is_released && (
                                    <Button
                                      variant="success"
                                      size="sm"
                                      title="Chuyển sang phát hành"
                                      onClick={() => handleReleaseClick(movie)}
                                    >
                                      Phát hành
                                    </Button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    </div>

                    <div className="d-flex justify-content-between align-items-center">
                      <div>
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
                  <div className="text-center p-5">
                    <p>Không có phim sắp ra mắt</p>
                    <Link href="/admin/upcoming-movies/new" passHref>
                      <Button variant="primary">
                        <FaPlus className="me-1" /> Thêm phim sắp ra mắt
                      </Button>
                    </Link>
                  </div>
                )}
              </Card.Body>
            </Card>
          </div>
        </section>
      </div>

      {/* Modal Xác nhận xoá phim */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Xác nhận xoá phim</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedMovie && (
            <p>
              Bạn có chắc chắn muốn xoá phim <strong>"{selectedMovie.name}"</strong> không?
              <br />
              Hành động này không thể hoàn tác.
            </p>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Hủy
          </Button>
          <Button variant="danger" onClick={confirmDelete}>
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
          {selectedMovie && (
            <p>
              Bạn có chắc chắn muốn chuyển phim <strong>"{selectedMovie.name}"</strong> sang trạng thái đã phát hành không?
            </p>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowReleaseModal(false)}>
            Hủy
          </Button>
          <Button variant="success" onClick={confirmRelease}>
            Phát hành
          </Button>
        </Modal.Footer>
      </Modal>
    </AdminLayout>
  );
};

export default UpcomingMoviesPage;
