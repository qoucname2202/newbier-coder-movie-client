import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';
import AdminLayout from '@/components/Layout/AdminLayout';
import axios from 'axios';
import { 
  FaArrowLeft, FaCheck, FaTimes, FaFilm, FaUser, FaComment, 
  FaExclamationTriangle, FaClock, FaCheckCircle, FaEnvelope, 
  FaCalendarAlt, FaEdit, FaTrash, FaEye
} from 'react-icons/fa';
import styles from '@/styles/AdminDashboard.module.css';

interface UserInfo {
  _id: string;
  name: string;
  email: string;
}

interface MovieInfo {
  id: string;
  name: string;
  slug?: string;
  thumb?: string;
  episode?: string;
}

interface Report {
  _id: string;
  contentType: 'Movie' | 'User' | 'Comment' | string;
  reason: string;
  status: 'pending' | 'in-progress' | 'resolved' | 'rejected';
  createdAt: string;
  updatedAt: string;
  description: string;
  adminNotes?: string;
  userId?: UserInfo;
  movieInfo?: MovieInfo;
}

const ReportDetailPage = () => {
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [adminNote, setAdminNote] = useState('');
  const [statusUpdating, setStatusUpdating] = useState(false);
  const router = useRouter();
  const { id } = router.query;

  const fetchReportDetail = useCallback(async (reportId: string | string[] | undefined) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('auth_token');
      if (!token) {
        router.push('/auth/login');
        return;
      }

      const response = await axios.get(
        `http://localhost:5000/api/admin/reports/${reportId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        setReport(response.data.data);
        setAdminNote(response.data.data.adminNotes || '');
      } else {
        alert('Không thể tải thông tin báo cáo');
      }
    } catch (error) {
      console.error('Error fetching report details:', error);
      alert('Có lỗi khi tải thông tin báo cáo');
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    if (id) {
      fetchReportDetail(id);
    }
  }, [id, fetchReportDetail]);
  const handleUpdateStatus = async (status: 'pending' | 'in-progress' | 'resolved' | 'rejected') => {
    try {
      setStatusUpdating(true);
      const token = localStorage.getItem('auth_token');
      if (!token) return;

      const response = await axios.patch(
        `http://localhost:5000/api/admin/reports/${id}`,
        { 
          status,
          adminNotes: adminNote
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );      if (response.data.success) {
        if (report) {
          setReport({
            ...report,
            status,
            adminNotes: adminNote
          });
        }
        alert('Cập nhật trạng thái báo cáo thành công');
      } else {
        alert('Có lỗi xảy ra khi cập nhật trạng thái');
      }
    } catch (error) {
      console.error('Error updating report status:', error);
      alert('Có lỗi xảy ra khi cập nhật trạng thái');
    } finally {
      setStatusUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Bạn có chắc chắn muốn xóa báo cáo này?')) {
      try {
        const token = localStorage.getItem('auth_token');
        if (!token) return;

        const response = await axios.delete(
          `http://localhost:5000/api/admin/reports/${id}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (response.data.success) {
          alert('Đã xóa báo cáo thành công');
          router.push('/admin/reports');
        } else {
          alert('Có lỗi xảy ra khi xóa báo cáo');
        }
      } catch (error) {
        console.error('Error deleting report:', error);
        alert('Có lỗi xảy ra khi xóa báo cáo');
      }
    }
  };

  // Hiển thị icon tương ứng với content type
  const getContentTypeIcon = (contentType: string) => {
    switch(contentType) {
      case 'Movie':
        return <FaFilm />;
      case 'User':
        return <FaUser />;
      case 'Comment':
        return <FaComment />;
      default:
        return <FaExclamationTriangle />;
    }
  };

  // Hiển thị badge tương ứng với trạng thái
  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'resolved':
        return <span className="badge badge-success px-2 py-1"><FaCheckCircle className="mr-1" /> Đã giải quyết</span>;
      case 'in-progress':
        return <span className="badge badge-info px-2 py-1"><FaClock className="mr-1" /> Đang xử lý</span>;
      case 'rejected':
        return <span className="badge badge-danger px-2 py-1"><FaTimes className="mr-1" /> Từ chối</span>;
      default:
        return <span className="badge badge-warning px-2 py-1"><FaExclamationTriangle className="mr-1" /> Đang chờ</span>;
    }
  };

  // Format thời gian
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <>
      <Head>
        <title>{loading ? 'Đang tải...' : `Chi tiết báo cáo #${id}`}</title>
      </Head>

      <div className={styles.container}>
        <section className={styles.header}>
          <div className="container-fluid">
            <div className="row align-items-center">
              <div className="col-sm-6">
                <h1 className={styles.headerTitle}>Chi tiết báo cáo</h1>
              </div>
              <div className="col-sm-6">
                <ol className={`breadcrumb float-sm-right ${styles.breadcrumb}`}>
                  <li className="breadcrumb-item"><a href="/admin">Home</a></li>
                  <li className="breadcrumb-item"><a href="/admin/reports">Báo cáo lỗi</a></li>
                  <li className="breadcrumb-item active">Chi tiết</li>
                </ol>
              </div>
            </div>
          </div>
        </section>

        <section className="content">
          <div className="container-fluid">
            <div className="row mb-3">
              <div className="col-12">
                <Link href="/admin/reports" className="btn btn-secondary">
                  <FaArrowLeft className="mr-1" /> Quay lại danh sách
                </Link>
              </div>
            </div>

            {loading ? (
              <div className="text-center py-5">
                <div className="spinner-border text-primary" role="status">
                  <span className="sr-only">Loading...</span>
                </div>
                <p className="mt-2 text-muted">Đang tải thông tin báo cáo...</p>
              </div>
            ) : !report ? (
              <div className="alert alert-danger">
                <h5>Không tìm thấy báo cáo</h5>
                <p>Báo cáo này không tồn tại hoặc đã bị xóa.</p>
                <Link href="/admin/reports" className="btn btn-outline-danger mt-3">
                  Quay lại danh sách báo cáo
                </Link>
              </div>
            ) : (
              <div className="row">
                <div className="col-lg-8">
                  <div className="card">
                    <div className="card-header">
                      <h3 className="card-title">
                        <FaExclamationTriangle className="text-warning mr-2" />
                        Thông tin báo cáo
                      </h3>
                      <div className="card-tools">
                        {getStatusBadge(report.status)}
                      </div>
                    </div>
                    <div className="card-body">
                      <div className="row mb-4">
                        <div className="col-md-6">
                          <h5 className="text-muted mb-2">Thông tin báo cáo</h5>
                          <table className="table table-sm">
                            <tbody>
                              <tr>
                                <th style={{ width: '150px' }}>ID</th>
                                <td><code>{report._id}</code></td>
                              </tr>
                              <tr>
                                <th>Loại nội dung</th>
                                <td>
                                  <div className="d-flex align-items-center">
                                    {getContentTypeIcon(report.contentType)}
                                    <span className="ml-2">{report.contentType || 'Không xác định'}</span>
                                  </div>
                                </td>
                              </tr>
                              <tr>
                                <th>Lý do báo cáo</th>
                                <td><strong>{report.reason}</strong></td>
                              </tr>
                              <tr>
                                <th>Trang thái</th>
                                <td>{getStatusBadge(report.status)}</td>
                              </tr>
                              <tr>
                                <th>Ngày tạo</th>
                                <td>
                                  <FaCalendarAlt className="mr-1 text-muted" />
                                  {formatDate(report.createdAt)}
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </div>

                        <div className="col-md-6">
                          <h5 className="text-muted mb-2">Thông tin người báo cáo</h5>
                          {report.userId && (
                            <table className="table table-sm">
                              <tbody>
                                <tr>
                                  <th style={{ width: '150px' }}>Tên</th>
                                  <td>{report.userId.name}</td>
                                </tr>
                                <tr>
                                  <th>Email</th>
                                  <td>
                                    <div className="d-flex align-items-center">
                                      <FaEnvelope className="mr-2 text-muted" />
                                      <span>{report.userId.email}</span>
                                    </div>
                                  </td>
                                </tr>
                                <tr>
                                  <th>User ID</th>
                                  <td><code>{report.userId._id}</code></td>
                                </tr>
                              </tbody>
                            </table>
                          )}
                        </div>
                      </div>

                      {report.contentType === 'Movie' && report.movieInfo && (
                        <div className="movie-info bg-light p-3 mb-4 rounded">
                          <h5 className="text-muted mb-3">
                            <FaFilm className="mr-2" />
                            Thông tin phim báo cáo
                          </h5>
                          <div className="row">
                            <div className="col-md-3">
                              {report.movieInfo.thumb ? (
                                <Image 
                                  src={report.movieInfo.thumb} 
                                  alt={report.movieInfo.name} 
                                  className="img-fluid rounded" 
                                  width={150}
                                  height={200}
                                />
                              ) : (
                                <div className="placeholder-image bg-secondary d-flex align-items-center justify-content-center rounded" style={{ width: '150px', height: '200px' }}>
                                  <FaFilm size={40} className="text-white-50" />
                                </div>
                              )}
                            </div>
                            <div className="col-md-9">
                              <h5>{report.movieInfo.name}</h5>
                              {report.movieInfo.slug && (
                                <p className="mb-2">
                                  <strong>Slug:</strong> {report.movieInfo.slug}
                                </p>
                              )}
                              {report.movieInfo.episode && (
                                <p className="mb-2">
                                  <strong>Tập phim:</strong> {report.movieInfo.episode}
                                </p>
                              )}
                              <Link 
                                href={`/admin/movies/edit/${report.movieInfo.id}`}
                                className="btn btn-sm btn-outline-primary mt-2"
                              >
                                <FaEdit className="mr-1" /> Xem & chỉnh sửa phim
                              </Link>
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="description mb-4">
                        <h5 className="text-muted mb-3">Mô tả chi tiết</h5>
                        <div className="p-3 bg-light rounded">
                          <p style={{ whiteSpace: 'pre-line' }}>{report.description}</p>
                        </div>
                      </div>

                      <div className="admin-notes mb-4">
                        <h5 className="text-muted mb-3">Ghi chú của admin</h5>
                        <textarea
                          className="form-control"
                          rows={4}
                          placeholder="Thêm ghi chú của quản trị viên về báo cáo này"
                          value={adminNote}
                          onChange={(e) => setAdminNote(e.target.value)}
                        ></textarea>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="col-lg-4">
                  <div className="card">
                    <div className="card-header">
                      <h3 className="card-title">
                        <FaEdit className="mr-2" />
                        Hành động
                      </h3>
                    </div>
                    <div className="card-body">
                      <div className="mb-4">
                        <h6 className="font-weight-bold mb-3">Cập nhật trạng thái</h6>
                        <div className="d-grid gap-2">
                          <button
                            className="btn btn-warning btn-block mb-2"
                            onClick={() => handleUpdateStatus('pending')}
                            disabled={statusUpdating || report.status === 'pending'}
                          >
                            <FaExclamationTriangle className="mr-2" />
                            Đánh dấu đang chờ
                          </button>
                          <button
                            className="btn btn-info btn-block mb-2"
                            onClick={() => handleUpdateStatus('in-progress')}
                            disabled={statusUpdating || report.status === 'in-progress'}
                          >
                            <FaClock className="mr-2" />
                            Đánh dấu đang xử lý
                          </button>
                          <button
                            className="btn btn-success btn-block mb-2"
                            onClick={() => handleUpdateStatus('resolved')}
                            disabled={statusUpdating || report.status === 'resolved'}
                          >
                            <FaCheck className="mr-2" />
                            Đánh dấu đã giải quyết
                          </button>
                          <button
                            className="btn btn-danger btn-block"
                            onClick={() => handleUpdateStatus('rejected')}
                            disabled={statusUpdating || report.status === 'rejected'}
                          >
                            <FaTimes className="mr-2" />
                            Đánh dấu từ chối
                          </button>
                        </div>
                      </div>

                      <hr className="my-4" />

                      <div>
                        <button
                          className="btn btn-outline-danger btn-block"
                          onClick={handleDelete}
                          disabled={statusUpdating}
                        >
                          <FaTrash className="mr-2" />
                          Xóa báo cáo này
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Thẻ hành động phụ thuộc vào loại nội dung */}
                  {report.contentType === 'Movie' && (
                    <div className="card mt-4">
                      <div className="card-header bg-light">
                        <h3 className="card-title">
                          <FaFilm className="mr-2" />
                          Hành động với phim
                        </h3>
                      </div>
                      <div className="card-body">
                        <p className="text-muted">Các thao tác nhanh với nội dung phim bị báo cáo:</p>
                        <div className="btn-group-vertical w-100">
                          <Link 
                            href={`/admin/movies/edit/${report.movieInfo?.id}`}
                            className="btn btn-outline-primary mb-2"
                          >
                            <FaEdit className="mr-1" /> Chỉnh sửa phim
                          </Link>
                          <a 
                            href={`/movie/${report.movieInfo?.slug}`} 
                            target="_blank" 
                            rel="noreferrer"
                            className="btn btn-outline-secondary"
                          >
                            <FaEye className="mr-1" /> Xem phim trên trang chính
                          </a>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </section>
      </div>

      <style jsx>{`
        .description p {
          min-height: 100px;
        }
        
        .badge {
          font-weight: 500;
          display: inline-flex;
          align-items: center;
        }
      `}</style>
    </>
  );
};

// Thêm getLayout để sử dụng AdminLayout
ReportDetailPage.getLayout = (page: React.ReactElement) => {
  return <AdminLayout>{page}</AdminLayout>;
};

export default ReportDetailPage;
