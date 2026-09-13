import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import AdminLayout from '@/components/Layout/AdminLayout';
import axios from 'axios';
import {
  FaEnvelope, FaArrowLeft, 
  FaClock, FaReply, FaTrash, FaCheckCircle,
  FaEdit, FaCalendarAlt, FaExclamationTriangle,
  FaEye, FaHistory
} from 'react-icons/fa';
import styles from '@/styles/AdminDashboard.module.css';

// Định nghĩa kiểu dữ liệu cho feedback chi tiết
interface FeedbackDetail {
  _id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  user: {
    _id: string;
    name?: string;
    fullName?: string;
    email: string;
    avatar?: string;
  } | null;
  status: 'pending' | 'processed' | 'resolved';
  adminResponse: string;
  isRead: boolean;
  createdAt: string;
  updatedAt: string;
  responseHistory?: Array<{
    _id: string;
    message: string;
    respondedBy: string;
    respondedAt: string;
  }>;
}

const FeedbackDetailPage = () => {
  const router = useRouter();
  const { id } = router.query;

  // States
  const [feedback, setFeedback] = useState<FeedbackDetail | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [response, setResponse] = useState<string>('');
  const [responseStatus, setResponseStatus] = useState<'pending' | 'processed' | 'resolved'>('processed');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [confirmDelete, setConfirmDelete] = useState<boolean>(false);
  const [deleting, setDeleting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Fetch feedback details
  useEffect(() => {
    const fetchFeedbackDetail = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        setError(null);
        
        const token = localStorage.getItem('auth_token');
        if (!token) {
          router.push('/auth/login');
          return;
        }
        
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
        const response = await axios.get(`${baseUrl}/feedback/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (response.data.success) {
          setFeedback(response.data.data);
          // Set initial response status from the feedback
          setResponseStatus(response.data.data.status);
        } else {
          setError('Không thể tải dữ liệu góp ý');
        }
      } catch (err) {
        console.error('Error fetching feedback details:', err);
        setError('Đã xảy ra lỗi khi tải dữ liệu. Vui lòng thử lại sau.');
      } finally {
        setLoading(false);
      }
    };

    fetchFeedbackDetail();
  }, [id, router]);

  // Đánh dấu là đã đọc khi xem
  useEffect(() => {
    const markAsRead = async () => {
      if (!id || !feedback || feedback.isRead) return;
      
      try {
        const token = localStorage.getItem('auth_token');
        if (!token) return;
        
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
        await axios.patch(`${baseUrl}/feedback/${id}/read`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        // Cập nhật trạng thái local
        setFeedback(prev => prev ? { ...prev, isRead: true } : null);
      } catch (err) {
        console.error('Error marking feedback as read:', err);
      }
    };

    markAsRead();
  }, [id, feedback]);

  // Định dạng ngày tháng
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

  // Lấy text trạng thái
  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Đang chờ';
      case 'processed':
        return 'Đang xử lý';
      case 'resolved':
        return 'Đã giải quyết';
      default:
        return 'Không xác định';
    }
  };

  // Lấy class badge trạng thái
  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'pending':
        return 'badge-warning';
      case 'processed':
        return 'badge-primary';
      case 'resolved':
        return 'badge-success';
      default:
        return 'badge-secondary';
    }
  };

  // Lấy icon trạng thái
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <FaClock />;
      case 'processed':
        return <FaEye />;
      case 'resolved':
        return <FaCheckCircle />;
      default:
        return <FaClock />;
    }
  };

  // Xử lý gửi phản hồi
  const handleSubmitResponse = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!response.trim()) {
      setError('Vui lòng nhập nội dung phản hồi');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      
      const token = localStorage.getItem('auth_token');
      if (!token) {
        router.push('/auth/login');
        return;
      }
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
      const res = await axios.patch(`${baseUrl}/feedback/${id}`, {
        adminResponse: response,
        status: responseStatus
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.data.success) {
        setSuccess('Đã gửi phản hồi thành công');
        setResponse(''); // Clear response field
          // Update feedback with new status and internal note
        setFeedback(prev => prev ? {
          ...prev,
          adminResponse: response,
          status: responseStatus,
          responseHistory: [
            ...(prev.responseHistory || []),
            {
              _id: new Date().toISOString(),              message: response 
                ? `Cập nhật trạng thái thành "${getStatusText(responseStatus)}". Ghi chú: ${response}` 
                : `Cập nhật trạng thái thành "${getStatusText(responseStatus)}"`,
              respondedBy: 'Admin',
              respondedAt: new Date().toISOString()
            }
          ]
        } : null);
        
        // Show success message with status
        setSuccess(`Đã cập nhật trạng thái thành công thành "${getStatusText(responseStatus)}"`);
        
        // Clear success message after 3 seconds
        setTimeout(() => {
          setSuccess(null);
        }, 3000);
      } else {
        setError('Không thể gửi phản hồi. Vui lòng thử lại.');
      }
    } catch (err) {
      console.error('Error submitting response:', err);
      setError('Đã xảy ra lỗi khi gửi phản hồi. Vui lòng thử lại sau.');
    } finally {
      setSubmitting(false);
    }
  };

  // Xử lý xóa góp ý
  const handleDeleteFeedback = async () => {
    try {
      setDeleting(true);
      setError(null);
      
      const token = localStorage.getItem('auth_token');
      if (!token) {
        router.push('/auth/login');
        return;
      }
      
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
      const res = await axios.delete(`${baseUrl}/feedback/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.data.success) {
        router.push('/admin/feedback');
      } else {
        setError('Không thể xóa góp ý. Vui lòng thử lại.');
        setConfirmDelete(false);
      }
    } catch (err) {
      console.error('Error deleting feedback:', err);
      setError('Đã xảy ra lỗi khi xóa góp ý. Vui lòng thử lại sau.');
      setConfirmDelete(false);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <Head>
        <title>Chi tiết góp ý - Admin Panel</title>
      </Head>

      <div className={styles.container}>
        {/* Header */}
        <section className={styles.header}>
          <div className="container-fluid">
            <div className="row align-items-center">
              <div className="col-sm-6">
                <Link href="/admin/feedback" passHref>
                  <button className="btn btn-link text-decoration-none ps-0 text-muted d-inline-flex align-items-center">
                    <FaArrowLeft className="me-2" /> Quay lại danh sách góp ý
                  </button>
                </Link>
                <h1 className={styles.headerTitle}>
                  <FaEnvelope className="header-icon me-2" /> Chi tiết góp ý
                </h1>
              </div>
              <div className="col-sm-6">
                <ol className={`breadcrumb float-sm-right ${styles.breadcrumb} custom-breadcrumb`}>
                  <li className="breadcrumb-item">
                    <Link href="/admin" legacyBehavior>
                      <a>Trang chủ</a>
                    </Link>
                  </li>
                  <li className="breadcrumb-item">
                    <Link href="/admin/feedback" legacyBehavior>
                      <a>Góp ý</a>
                    </Link>
                  </li>
                  <li className="breadcrumb-item active">Chi tiết</li>
                </ol>
              </div>
            </div>
          </div>
        </section>

        {/* Main Content */}
        <section className="content mt-3">
          <div className="container-fluid">
            {loading ? (
              <div className="text-center py-5">
                <div className="spinner-border text-primary" role="status">
                  <span className="sr-only">Loading...</span>
                </div>
              </div>
            ) : error && !feedback ? (
              <div className="alert alert-danger">{error}</div>
            ) : feedback ? (
              <div className="row">
                {/* Feedback Details Card */}
                <div className="col-lg-8">
                  {error && <div className="alert alert-danger">{error}</div>}
                  {success && <div className="alert alert-success">{success}</div>}
                    <div className="card">                    <div className="card-header bg-white d-flex justify-content-between align-items-center">
                      <h3 className="card-title d-flex align-items-center">
                        <FaEnvelope className="me-2" /> Quản lý trạng thái góp ý
                      </h3>
                      <div className="d-flex align-items-center">
                        <div className="status-label me-2">Trạng thái hiện tại:</div>
                        <span className={`badge ${getStatusBadgeClass(feedback.status)} d-flex align-items-center status-badge-large`}>
                          {getStatusIcon(feedback.status)} <span className="ms-2">{getStatusText(feedback.status)}</span>
                        </span>
                      </div>
                    </div>
                    <div className="card-body">                      {/* User Information */}
                      <div className="user-info-container mb-4">
                        <div className="avatar-circle bg-primary text-white">
                          {feedback.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="user-details">
                          <h5 className="mb-0">{feedback.name}</h5>
                          <div className="user-email">
                            <FaEnvelope size={12} className="me-1" /> {feedback.email}
                          </div>
                          <div className="mt-2">
                            <span className="badge badge-light text-dark">
                              <FaCalendarAlt size={10} className="me-1" /> 
                              Tham gia: {formatDate(feedback.createdAt).split(' ')[0]}
                            </span>
                          </div>
                        </div>
                      </div>{/* Message Box */}                      <div className="card mb-4">
                        <div className="card-header bg-white">
                          <h5 className="mb-0">Nội dung góp ý</h5>
                        </div>
                        <div className="card-body">
                          <div className="feedback-message-container p-4 rounded-3 border">
                            <div className="feedback-message-content">
                              {feedback.message}
                            </div>
                            <div className="message-meta text-muted d-flex justify-content-between align-items-center mt-3 pt-2 border-top">
                              <small><FaCalendarAlt className="me-1" /> Gửi lúc: {formatDate(feedback.createdAt)}</small>
                              <div>
                                {!feedback.isRead ? (
                                  <span className="badge badge-danger">Mới</span>
                                ) : (
                                  <span className="text-muted small">
                                    <FaEye className="me-1" /> Đã xem
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>{/* Admin Response Form */}
                      <div className="card">
                        <div className="card-header bg-white">
                          <h5 className="mb-0">
                            <FaReply className="me-2" /> Phản hồi
                          </h5>
                        </div>
                        <div className="card-body">                          <form onSubmit={handleSubmitResponse}>
                            <div className="form-group mb-4">
                              <label className="form-label fw-bold fs-5 mb-3">Cập nhật trạng thái</label>
                              <div className="status-selection-cards">
                                <div 
                                  className={`status-card ${responseStatus === 'pending' ? 'active' : ''}`}
                                  onClick={() => setResponseStatus('pending')}
                                >
                                  <div className="status-icon warning">
                                    <FaClock size={24} />
                                  </div>
                                  <div className="status-info">
                                    <h6>Đang chờ</h6>
                                    <p>Góp ý đang chờ xử lý</p>
                                  </div>
                                  <div className="status-radio">
                                    <input 
                                      type="radio" 
                                      name="responseStatus" 
                                      checked={responseStatus === 'pending'}
                                      onChange={() => {}}
                                    />
                                  </div>
                                </div>
                                
                                <div 
                                  className={`status-card ${responseStatus === 'processed' ? 'active' : ''}`}
                                  onClick={() => setResponseStatus('processed')}
                                >
                                  <div className="status-icon primary">
                                    <FaEye size={24} />
                                  </div>
                                  <div className="status-info">
                                    <h6>Đang xử lý</h6>
                                    <p>Đang trong quá trình xử lý</p>
                                  </div>
                                  <div className="status-radio">
                                    <input 
                                      type="radio" 
                                      name="responseStatus" 
                                      checked={responseStatus === 'processed'}
                                      onChange={() => {}}
                                    />
                                  </div>
                                </div>
                                
                                <div 
                                  className={`status-card ${responseStatus === 'resolved' ? 'active' : ''}`}
                                  onClick={() => setResponseStatus('resolved')}
                                >
                                  <div className="status-icon success">
                                    <FaCheckCircle size={24} />
                                  </div>
                                  <div className="status-info">
                                    <h6>Đã giải quyết</h6>
                                    <p>Góp ý đã được giải quyết hoàn tất</p>
                                  </div>
                                  <div className="status-radio">
                                    <input 
                                      type="radio" 
                                      name="responseStatus" 
                                      checked={responseStatus === 'resolved'}
                                      onChange={() => {}}
                                    />
                                  </div>
                                </div>
                              </div>
                            </div>
                            
                            <div className="form-group mb-3">
                              <label htmlFor="response" className="form-label fw-bold">Ghi chú nội bộ</label>
                              <textarea
                                id="response"
                                className="form-control"
                                rows={5}
                                value={response}
                                onChange={(e) => setResponse(e.target.value)}
                                placeholder="Ghi chú về việc xử lý góp ý này (không gửi cho người dùng)..."
                              />
                              <div className="form-text text-muted mt-1">
                                Ghi chú này chỉ hiển thị cho nội bộ quản trị, không gửi đến người dùng.
                              </div>
                            </div>
                            
                            <div className="d-flex justify-content-between mt-4 action-buttons">
                              <div>
                                <button
                                  type="button"
                                  className="btn btn-outline-danger"
                                  onClick={() => setConfirmDelete(true)}
                                >
                                  <FaTrash className="me-1" /> Xóa góp ý
                                </button>
                              </div>
                              <div>
                                <button 
                                  type="button" 
                                  className="btn btn-light me-2"
                                  onClick={() => router.push('/admin/feedback')}
                                >
                                  Hủy
                                </button>                                <button
                                  type="submit"
                                  className="btn btn-primary btn-lg"
                                  disabled={submitting}
                                >
                                  {submitting ? (                                    <>
                                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                      Đang cập nhật...
                                    </>
                                  ) : (
                                    <>
                                      <FaCheckCircle className="me-1" /> Cập nhật trạng thái
                                    </>
                                  )}
                                </button>
                              </div>
                            </div>
                          </form>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Sidebar - Response History */}
                <div className="col-lg-4">                  {/* Lịch sử hoạt động admin */}                  <div className="card">
                    <div className="card-header bg-white">
                      <h3 className="card-title d-flex align-items-center">
                        <FaHistory className="me-2" /> Lịch sử hoạt động
                      </h3>
                    </div>
                    <div className="card-body p-0">                      <div className="timeline-container p-3">                          <ul className="timeline">
                            {/* Current Status */}
                            <li className="timeline-item active">
                              <div className="timeline-badge">
                                {getStatusIcon(feedback.status)}
                              </div>
                              <div className="timeline-content">
                                <div className="timeline-heading">
                                  <h6>Trạng thái hiện tại</h6>
                                  <small className="text-muted">
                                    {formatDate(feedback.updatedAt)}
                                  </small>
                                </div>
                                <div className="timeline-body">
                                  <p className="mb-2">
                                    <span className={`badge ${getStatusBadgeClass(feedback.status)}`}>
                                      {getStatusIcon(feedback.status)} <span className="ms-1">{getStatusText(feedback.status)}</span>
                                    </span>
                                  </p>
                                  {feedback.adminResponse && (
                                    <div className="note-card">
                                      <p className="note-title">Ghi chú nội bộ:</p>
                                      <div className="note-content">{feedback.adminResponse}</div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </li>
                            
                            {/* History Items */}
                            {feedback.responseHistory && feedback.responseHistory.length > 0 && 
                              feedback.responseHistory.map((item, index) => (
                                <li key={item._id} className="timeline-item">
                                  <div className="timeline-badge">
                                    <FaEdit />
                                  </div>
                                  <div className="timeline-content">
                                    <div className="timeline-heading">
                                      <h6>{item.respondedBy}</h6>
                                      <small className="text-muted">
                                        {formatDate(item.respondedAt)}
                                      </small>
                                    </div>
                                    <div className="timeline-body">
                                      <div className="activity-message">{item.message}</div>
                                    </div>                                      <div className="timeline-footer">
                                      <span className="text-muted small">
                                        <FaHistory className="me-1" /> Hoạt động {feedback.responseHistory && index === feedback.responseHistory.length - 1 ? 'đầu tiên' : feedback.responseHistory ? `#${feedback.responseHistory.length - index}` : ''}
                                      </span>
                                    </div>
                                  </div>
                                </li>
                              ))
                            }
                          </ul>                        </div>
                        {!feedback.responseHistory || feedback.responseHistory?.length === 0 ? (
                        <div className="p-4 text-center text-muted">
                          <div className="d-flex flex-column align-items-center">
                            <div className="empty-state-icon mb-3">
                              <FaHistory size={40} className="text-muted opacity-25" />
                            </div>
                            <h6>Chưa có hoạt động nào</h6>
                            <p className="small">Cập nhật trạng thái để theo dõi quá trình xử lý góp ý.</p>
                          </div>
                        </div>
                        ) : null}
                    </div>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </section>
      </div>      {/* Delete Confirmation Modal */}
      {confirmDelete && (
        <div className="modal fade show active-modal">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header bg-white">
                <h5 className="modal-title">
                  <FaTrash className="text-danger me-2" /> Xác nhận xóa
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setConfirmDelete(false)}
                  disabled={deleting}
                  aria-label="Close"
                ></button>
              </div>
              <div className="modal-body">
                <div className="text-center mb-4">
                  <div className="delete-icon-container mb-3">
                    <FaExclamationTriangle size={50} className="text-warning" />
                  </div>
                  <h5>Bạn có chắc chắn muốn xóa?</h5>
                  <p className="text-muted">Góp ý này sẽ bị xóa vĩnh viễn và không thể khôi phục.</p>
                  <div className="alert alert-danger mt-3">
                    <small className="d-flex align-items-center">
                      <FaExclamationTriangle className="me-2" /> Hành động này không thể hoàn tác.
                    </small>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-light"
                  onClick={() => setConfirmDelete(false)}
                  disabled={deleting}
                >
                  Hủy
                </button>
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={handleDeleteFeedback}
                  disabled={deleting}
                >
                  {deleting ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Đang xóa...
                    </>
                  ) : (
                    <><FaTrash className="me-1" /> Xóa vĩnh viễn</>
                  )}
                </button>
              </div>
            </div>
          </div>
          <div className="modal-backdrop fade show"></div>
        </div>
      )}
    </>
  );
};

// Add getLayout to use AdminLayout
FeedbackDetailPage.getLayout = (page: React.ReactNode) => {
  return <AdminLayout>{page}</AdminLayout>;
};

export default FeedbackDetailPage;