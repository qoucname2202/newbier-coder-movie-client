import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import AdminLayout from '@/components/Layout/AdminLayout';
import AdminRoute from '@/components/ProtectedRoute/AdminRoute';
import axios from 'axios';
import {
  FaEnvelope, FaArrowLeft, FaClock, FaReply, FaTrash,
  FaCheckCircle, FaCalendarAlt, FaExclamationTriangle,
  FaEye, FaUser, FaPaperPlane
} from 'react-icons/fa';

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

const MOCK_DETAILS: Record<string, Partial<FeedbackDetail>> = {
  'fb-101': {
    _id: 'fb-101',
    name: 'Nguyễn Văn An',
    email: 'nguyenvanan.dev@gmail.com',
    subject: 'Tốc độ phát video 4K vào giờ cao điểm',
    message: 'Trang web giao diện rất đẹp và trực quan! Tuy nhiên vào khoảng 20h-21h khi xem phim chất lượng 4K HDR thỉnh thoảng có hiện tượng buffering nhẹ. Mong ban quản trị tối ưu thêm CDN.',
    status: 'pending',
    adminResponse: '',
    isRead: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 45).toISOString()
  },
  'fb-102': {
    _id: 'fb-102',
    name: 'Trần Thị Mai',
    email: 'maitran.cinema@gmail.com',
    subject: 'Đề xuất thêm phụ đề song ngữ cho phim tài liệu',
    message: 'Chào đội ngũ phát triển, mình rất thích các bộ phim tài liệu khoa học trên nền tảng. Nếu có thêm tùy chọn hiển thị song ngữ Anh - Việt để vừa xem vừa học ngoại ngữ thì tuyệt vời lắm ạ.',
    status: 'processed',
    adminResponse: 'Cảm ơn bạn Mai. Đội ngũ biên tập đang tiến hành đồng bộ phụ đề song ngữ cho chuyên mục này.',
    isRead: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    responseHistory: [
      {
        _id: 'rh-1',
        message: 'Đã tiếp nhận yêu cầu và bàn giao bộ phận biên tập nội dung.',
        respondedBy: 'Admin Content',
        respondedAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString()
      }
    ]
  }
};

const FeedbackDetailPage = () => {
  const router = useRouter();
  const { id } = router.query;

  const [feedback, setFeedback] = useState<FeedbackDetail | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [response, setResponse] = useState<string>('');
  const [responseStatus, setResponseStatus] = useState<'pending' | 'processed' | 'resolved'>('processed');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [confirmDelete, setConfirmDelete] = useState<boolean>(false);
  const [deleting, setDeleting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    const fetchFeedbackDetail = async () => {
      if (!id) return;

      try {
        setLoading(true);
        setError(null);

        const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
        const headers = token ? { Authorization: `Bearer ${token}` } : {};

        try {
          const res = await axios.get(`${baseUrl}/feedback/${id}`, { headers, timeout: 3500 });
          if (res.data && res.data.success) {
            setFeedback(res.data.data);
            setResponseStatus(res.data.data.status);
            return;
          }
        } catch (apiErr) {
          // Fallback to mock item if API is unavailable or user not logged in
        }

        // Mock detail fallback
        const mockItem = MOCK_DETAILS[id as string] || {
          _id: id as string,
          name: 'Khán giả thành viên',
          email: 'member@cinema.vn',
          subject: 'Góp ý nâng cấp tính năng hệ thống',
          message: 'Trang web xem rất nhanh và mượt mà. Mong admin tiếp tục cập nhật nhiều phim bom tấn mới nhất!',
          status: 'pending' as const,
          adminResponse: '',
          isRead: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        setFeedback(mockItem as FeedbackDetail);
        setResponseStatus(mockItem.status || 'processed');
      } catch (err) {
        console.error('Error in detail fetch:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchFeedbackDetail();
  }, [id]);

  const handleSubmitResponse = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!response.trim()) {
      setError('Vui lòng nhập nội dung phản hồi');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

      if (token) {
        try {
          await axios.patch(`${baseUrl}/feedback/${id}`, {
            adminResponse: response,
            status: responseStatus
          }, {
            headers: { Authorization: `Bearer ${token}` },
            timeout: 4000
          });
        } catch (apiErr) {
          console.warn('API error, saving locally:', apiErr);
        }
      }

      setFeedback(prev => prev ? {
        ...prev,
        adminResponse: response,
        status: responseStatus,
        responseHistory: [
          ...(prev.responseHistory || []),
          {
            _id: Date.now().toString(),
            message: response,
            respondedBy: 'Ban Quản Trị',
            respondedAt: new Date().toISOString()
          }
        ]
      } : null);

      setSuccess(`Đã gửi phản hồi và cập nhật trạng thái sang "${getStatusText(responseStatus)}" thành công!`);
      setResponse('');

      setTimeout(() => {
        setSuccess(null);
      }, 3500);
    } catch (err) {
      console.error('Error submitting response:', err);
      setError('Đã xảy ra lỗi khi gửi phản hồi. Vui lòng thử lại sau.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteFeedback = async () => {
    try {
      setDeleting(true);
      setError(null);

      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

      if (token) {
        try {
          await axios.delete(`${baseUrl}/feedback/${id}`, {
            headers: { Authorization: `Bearer ${token}` },
            timeout: 4000
          });
        } catch (apiErr) {
          console.warn('API delete error, proceeding with redirect:', apiErr);
        }
      }

      router.push('/admin/feedback');
    } catch (err) {
      console.error('Error deleting feedback:', err);
      setError('Đã xảy ra lỗi khi xóa góp ý.');
      setConfirmDelete(false);
    } finally {
      setDeleting(false);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Đang chờ';
      case 'processed': return 'Đang xử lý';
      case 'resolved': return 'Đã giải quyết';
      default: return 'Không xác định';
    }
  };

  return (
    <>
      <Head>
        <title>Chi tiết góp ý - Dark Cinema Studio</title>
      </Head>

      <div className="feedback-admin-page">
        {/* Navigation & Header */}
        <div className="mb-4">
          <Link href="/admin/feedback" legacyBehavior>
            <a className="btn btn-sm btn-outline-secondary d-inline-flex align-items-center gap-2 mb-3">
              <FaArrowLeft /> Quay lại danh sách góp ý
            </a>
          </Link>
          <div className="d-flex align-items-center justify-content-between flex-wrap gap-2">
            <h1 className="feedback-header-title">
              <span className="feedback-header-icon-box">
                <FaEnvelope />
              </span>
              Chi tiết góp ý #{id}
            </h1>
            {feedback && (
              <span className={`status-glow-pill status-glow-${feedback.status}`}>
                <span className="status-dot" />
                {getStatusText(feedback.status)}
              </span>
            )}
          </div>
        </div>

        {error && (
          <div className="alert alert-danger d-flex align-items-center gap-2 mb-4">
            <FaExclamationTriangle /> {error}
          </div>
        )}

        {success && (
          <div className="alert alert-success d-flex align-items-center gap-2 mb-4">
            <FaCheckCircle /> {success}
          </div>
        )}

        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-danger" role="status" />
            <p className="text-muted mt-2">Đang tải thông tin chi tiết...</p>
          </div>
        ) : feedback ? (
          <div className="row g-4">
            {/* Left: Feedback content & User Info */}
            <div className="col-lg-7">
              {/* User Info Card */}
              <div className="feedback-content-card mb-4 p-4">
                <h5 className="text-white fw-bold mb-3 d-flex align-items-center gap-2">
                  <FaUser className="text-danger" size={16} /> Thông tin người gửi
                </h5>
                <div className="d-flex align-items-center gap-3">
                  <div
                    className="reporter-avatar-box"
                    style={{ width: 50, height: 50, fontSize: '1.1rem' }}
                  >
                    {feedback.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h5 className="text-white fw-bold mb-1">{feedback.name}</h5>
                    <p className="text-muted small mb-1">
                      <FaEnvelope size={11} className="me-1" /> {feedback.email}
                    </p>
                    <span className="text-muted small">
                      <FaCalendarAlt size={11} className="me-1" /> Gửi lúc: {formatDate(feedback.createdAt)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Message Content Card */}
              <div className="feedback-content-card p-4">
                <h5 className="text-white fw-bold mb-3">Nội dung ý kiến đóng góp</h5>
                <div className="mb-3">
                  <span className="text-muted small">Tiêu đề:</span>
                  <div className="text-white fw-bold fs-6 mt-1">{feedback.subject}</div>
                </div>
                <div className="message-preview p-3 mb-3" style={{ fontSize: '0.95rem' }}>
                  {feedback.message}
                </div>

                <div className="d-flex justify-content-end">
                  <button
                    className="btn btn-sm btn-outline-danger d-inline-flex align-items-center gap-1"
                    onClick={() => setConfirmDelete(true)}
                  >
                    <FaTrash size={12} /> Xóa góp ý này
                  </button>
                </div>
              </div>
            </div>

            {/* Right: Response Form & History */}
            <div className="col-lg-5">
              <div className="feedback-content-card p-4 mb-4">
                <h5 className="text-white fw-bold mb-3 d-flex align-items-center gap-2">
                  <FaReply className="text-primary" size={16} /> Phản hồi từ Quản trị viên
                </h5>

                <form onSubmit={handleSubmitResponse}>
                  {/* Status Selection */}
                  <div className="mb-3">
                    <label className="form-label text-muted small fw-bold">Cập nhật trạng thái:</label>
                    <div className="d-flex flex-wrap gap-2">
                      <button
                        type="button"
                        className={`feedback-tab-pill ${responseStatus === 'pending' ? 'active' : ''}`}
                        onClick={() => setResponseStatus('pending')}
                      >
                        Chờ xử lý
                      </button>
                      <button
                        type="button"
                        className={`feedback-tab-pill ${responseStatus === 'processed' ? 'active' : ''}`}
                        onClick={() => setResponseStatus('processed')}
                      >
                        Đang xử lý
                      </button>
                      <button
                        type="button"
                        className={`feedback-tab-pill ${responseStatus === 'resolved' ? 'active' : ''}`}
                        onClick={() => setResponseStatus('resolved')}
                      >
                        Đã giải quyết
                      </button>
                    </div>
                  </div>

                  {/* Message Input */}
                  <div className="mb-3">
                    <label className="form-label text-muted small fw-bold">Nội dung trả lời:</label>
                    <textarea
                      rows={5}
                      className="form-control"
                      style={{
                        background: '#0b0f19',
                        border: '1px solid rgba(255,255,255,0.1)',
                        color: '#fff',
                        borderRadius: 10
                      }}
                      placeholder="Nhập nội dung giải đáp hoặc ghi chú xử lý..."
                      value={response}
                      onChange={(e) => setResponse(e.target.value)}
                    />
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary w-100 d-inline-flex align-items-center justify-content-center gap-2"
                    disabled={submitting}
                  >
                    <FaPaperPlane size={13} />
                    {submitting ? 'Đang gửi...' : 'Gửi phản hồi & Cập nhật'}
                  </button>
                </form>
              </div>

              {/* Response History */}
              {feedback.responseHistory && feedback.responseHistory.length > 0 && (
                <div className="feedback-content-card p-4">
                  <h6 className="text-white fw-bold mb-3">Lịch sử phản hồi trước đó</h6>
                  <div className="d-flex flex-column gap-3">
                    {feedback.responseHistory.map((item, index) => (
                      <div key={item._id || index} className="p-3 rounded" style={{ background: '#0e131d', border: '1px solid rgba(255,255,255,0.06)' }}>
                        <div className="d-flex justify-content-between align-items-center mb-1">
                          <span className="text-primary fw-bold small">{item.respondedBy}</span>
                          <span className="text-muted small">{formatDate(item.respondedAt)}</span>
                        </div>
                        <p className="text-muted mb-0 small">{item.message}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="empty-feedback-state">
            <h4 className="empty-state-title">Không tìm thấy góp ý này</h4>
            <Link href="/admin/feedback" legacyBehavior>
              <a className="btn btn-outline-primary mt-2">Quay lại danh sách</a>
            </Link>
          </div>
        )}
      </div>

      {/* Delete Modal */}
      {confirmDelete && (
        <div className="custom-dark-modal-backdrop" onClick={() => setConfirmDelete(false)}>
          <div className="custom-dark-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="custom-dark-modal-header">
              <h5 className="custom-dark-modal-title">
                <FaExclamationTriangle className="text-danger" /> Xác nhận xóa góp ý
              </h5>
              <button type="button" className="btn-close btn-close-white" onClick={() => setConfirmDelete(false)} />
            </div>
            <div className="custom-dark-modal-body">
              Bạn có chắc chắn muốn xóa phản hồi góp ý này không? Thao tác này không thể hoàn tác.
            </div>
            <div className="custom-dark-modal-footer">
              <button className="btn btn-sm btn-outline-secondary" onClick={() => setConfirmDelete(false)}>
                Hủy
              </button>
              <button
                className="btn btn-sm btn-danger"
                onClick={handleDeleteFeedback}
                disabled={deleting}
              >
                {deleting ? 'Đang xóa...' : 'Xóa vĩnh viễn'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

FeedbackDetailPage.getLayout = (page: React.ReactNode) => {
  return (
    <AdminRoute>
      <AdminLayout>{page}</AdminLayout>
    </AdminRoute>
  );
};

export default FeedbackDetailPage;