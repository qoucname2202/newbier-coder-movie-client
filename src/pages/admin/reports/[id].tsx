import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import styles from '@/styles/AdminReportDetail.module.css';
import AdminLayout from '@/components/Layout/AdminLayout';
import { 
  FaArrowLeft, FaCheck, FaTimes, FaClock, FaExclamationTriangle, 
  FaUser, FaFilm, FaExclamationCircle, FaEdit, FaTrash, 
  FaEnvelope, FaLink, FaCommentAlt, FaPlayCircle
} from 'react-icons/fa';
import { getReportById, updateReport } from '@/API/services/admin/reportService';

// Report interface
interface Report {
  _id: string;
  userId: {
    _id: string;
    name?: string;
    fullname?: string;
    email: string;
    avatar?: string;
  };
  contentId?: {
    _id: string;
    title?: string;
    name?: string;
    text?: string;
  };
  contentType?: string;
  type: 'movie' | 'user' | 'comment' | 'other';
  reason: string;
  description: string;
  status: 'pending' | 'in-progress' | 'resolved' | 'rejected';
  createdAt: string;
  updatedAt: string;
  adminNotes?: string;
  movieInfo?: {
    id: string;
    name: string;
    slug: string;
    thumb: string;
    episode: number;
  };
}

const ReportDetailPage = () => {
  const router = useRouter();
  const { id } = router.query;
  
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [adminNotes, setAdminNotes] = useState<string>('');
  const [newStatus, setNewStatus] = useState<string>('');
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [updateLoading, setUpdateLoading] = useState<boolean>(false);
  
  // Fetch report data
  useEffect(() => {
    if (id) {
      fetchReportData();
    }
  }, [id]);
  
  const fetchReportData = async () => {
    try {
      setLoading(true);
      const data = await getReportById(id as string);
      setReport(data);
      setAdminNotes(data.adminNotes || '');
      setNewStatus(data.status);
    } catch (error) {
      console.error('Error fetching report:', error);
      setError('Không thể tải thông tin báo cáo. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };
  
  // Update report status
  const handleUpdateReport = async () => {
    try {
      setUpdateLoading(true);
      
      await updateReport(id as string, {
        status: newStatus,
        adminNotes: adminNotes
      });
      
      // Update local state
      if (report) {
        setReport({
          ...report,
          status: newStatus as any,
          adminNotes,
          updatedAt: new Date().toISOString()
        });
      }
      
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating report:', error);
      setError('Không thể cập nhật báo cáo. Vui lòng thử lại sau.');
    } finally {
      setUpdateLoading(false);
    }
  };
  
  const renderTypeIcon = (type: string) => {
    switch(type) {
      case 'movie':
        return <FaFilm className={styles.typeIcon} />;
      case 'user':
        return <FaUser className={styles.typeIcon} />;
      case 'comment':
        return <FaCommentAlt className={styles.typeIcon} />;
      default:
        return <FaExclamationTriangle className={styles.typeIcon} />;
    }
  };
  
  const renderTypeText = (type: string) => {
    switch(type) {
      case 'movie':
        return 'Báo cáo về phim';
      case 'user':
        return 'Báo cáo về người dùng';
      case 'comment':
        return 'Báo cáo về bình luận';
      default:
        return 'Báo cáo khác';
    }
  };
  
  const renderStatusBadge = (status: string) => {
    switch(status) {
      case 'pending':
        return <span className={`${styles.statusBadge} ${styles.pending}`}><FaClock /> Đang chờ</span>;
      case 'in-progress':
        return <span className={`${styles.statusBadge} ${styles.inProgress}`}><FaClock /> Đang xử lý</span>;
      case 'resolved':
        return <span className={`${styles.statusBadge} ${styles.resolved}`}><FaCheck /> Đã giải quyết</span>;
      case 'rejected':
        return <span className={`${styles.statusBadge} ${styles.rejected}`}><FaTimes /> Từ chối</span>;
      default:
        return <span className={`${styles.statusBadge} ${styles.pending}`}>Chưa xác định</span>;
    }
  };
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  return (
    <AdminLayout>
      <Head>
        <title>Chi tiết báo cáo - Admin Panel</title>
      </Head>
      
      <div className={styles.container}>
        {/* Back button */}
        <div className={styles.backButton}>
          <Link href="/admin/reports" className={styles.backLink}>
            <FaArrowLeft /> Quay lại danh sách báo cáo
          </Link>
        </div>
        
        {loading ? (
          <div className={styles.loadingContainer}>
            <div className={styles.loadingSpinner}></div>
            <p>Đang tải thông tin báo cáo...</p>
          </div>
        ) : error ? (
          <div className={styles.errorContainer}>
            <FaExclamationTriangle className={styles.errorIcon} />
            <p className={styles.errorMessage}>{error}</p>
            <button 
              className={styles.retryButton}
              onClick={fetchReportData}
            >
              Thử lại
            </button>
          </div>
        ) : report ? (
          <>
            {/* Report header */}
            <div className={styles.reportHeader}>
              <div className={styles.reportHeaderLeft}>
                <div className={styles.reportType}>
                  {renderTypeIcon(report.type)}
                  <span>{renderTypeText(report.type)}</span>
                </div>
                <h1 className={styles.reportTitle}>
                  {report.type === 'movie' && report.movieInfo
                    ? `Báo cáo về phim: ${report.movieInfo.name}`
                    : report.type === 'user' && report.contentId
                    ? `Báo cáo về người dùng: ${report.contentId.name}`
                    : report.type === 'comment' && report.contentId
                    ? 'Báo cáo về bình luận'
                    : 'Chi tiết báo cáo'}
                </h1>
                <div className={styles.reportMeta}>
                  <div className={styles.reportId}>
                    ID: <span>{report._id}</span>
                  </div>
                  <div className={styles.reportDate}>
                    Ngày tạo: <span>{formatDate(report.createdAt)}</span>
                  </div>
                </div>
              </div>
              <div className={styles.reportHeaderRight}>
                {renderStatusBadge(report.status)}
              </div>
            </div>
            
            <div className={styles.reportContent}>
              {/* Left column - Report details */}
              <div className={styles.reportDetailsColumn}>
                <div className={styles.reportCard}>
                  <h2 className={styles.cardTitle}>Thông tin báo cáo</h2>
                  
                  <div className={styles.reportField}>
                    <div className={styles.fieldLabel}>Người báo cáo:</div>
                    <div className={styles.fieldValue}>
                      <div className={styles.userInfo}>
                        {report.userId.avatar && (
                          <img src={report.userId.avatar} alt={report.userId.name} className={styles.userAvatar} />
                        )}                        <div className={styles.userText}>
                          <div className={styles.userName}>{report.userId.fullname || report.userId.name || report.userId.email.split('@')[0]}</div>
                          <div className={styles.userEmail}>{report.userId.email}</div>
                        </div>
                      </div>
                      <Link 
                        href={`/admin/users/edit/${report.userId._id}`}
                        className={styles.viewUserLink}
                      >
                        Xem người dùng
                      </Link>
                    </div>
                  </div>
                  
                  <div className={styles.reportField}>
                    <div className={styles.fieldLabel}>Lý do báo cáo:</div>
                    <div className={styles.fieldValue}>
                      <div className={styles.reasonText}>{report.reason}</div>
                    </div>
                  </div>
                  
                  <div className={styles.reportField}>
                    <div className={styles.fieldLabel}>Mô tả chi tiết:</div>
                    <div className={styles.fieldValue}>
                      <div className={styles.descriptionText}>
                        {report.description || 'Không có mô tả chi tiết'}
                      </div>
                    </div>
                  </div>
                  
                  <div className={styles.reportField}>
                    <div className={styles.fieldLabel}>Ngày cập nhật:</div>
                    <div className={styles.fieldValue}>
                      {formatDate(report.updatedAt)}
                    </div>
                  </div>
                </div>
                
                {/* Admin actions card */}
                <div className={styles.reportCard}>
                  <h2 className={styles.cardTitle}>Thao tác xử lý</h2>
                  
                  {isEditing ? (
                    <div className={styles.editForm}>
                      <div className={styles.formGroup}>
                        <label htmlFor="status" className={styles.formLabel}>Trạng thái:</label>
                        <select 
                          id="status"
                          className={styles.formSelect}
                          value={newStatus}
                          onChange={(e) => setNewStatus(e.target.value)}
                        >
                          <option value="pending">Đang chờ</option>
                          <option value="in-progress">Đang xử lý</option>
                          <option value="resolved">Đã giải quyết</option>
                          <option value="rejected">Từ chối</option>
                        </select>
                      </div>
                      
                      <div className={styles.formGroup}>
                        <label htmlFor="adminNotes" className={styles.formLabel}>Ghi chú của admin:</label>
                        <textarea 
                          id="adminNotes"
                          className={styles.formTextarea}
                          value={adminNotes}
                          onChange={(e) => setAdminNotes(e.target.value)}
                          rows={4}
                          placeholder="Nhập ghi chú xử lý..."
                        />
                      </div>
                      
                      <div className={styles.buttonGroup}>
                        <button 
                          className={styles.saveButton}
                          onClick={handleUpdateReport}
                          disabled={updateLoading}
                        >
                          {updateLoading ? 'Đang lưu...' : 'Lưu thay đổi'}
                        </button>
                        <button 
                          className={styles.cancelButton}
                          onClick={() => {
                            setIsEditing(false);
                            setNewStatus(report.status);
                            setAdminNotes(report.adminNotes || '');
                          }}
                          disabled={updateLoading}
                        >
                          Hủy
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className={styles.reportField}>
                        <div className={styles.fieldLabel}>Trạng thái:</div>
                        <div className={styles.fieldValue}>
                          {renderStatusBadge(report.status)}
                        </div>
                      </div>
                      
                      <div className={styles.reportField}>
                        <div className={styles.fieldLabel}>Ghi chú của admin:</div>
                        <div className={styles.fieldValue}>
                          <div className={styles.adminNotesText}>
                            {report.adminNotes || 'Không có ghi chú'}
                          </div>
                        </div>
                      </div>
                      
                      <button 
                        className={styles.editButton}
                        onClick={() => setIsEditing(true)}
                      >
                        <FaEdit /> Cập nhật trạng thái
                      </button>
                    </>
                  )}
                  
                  <div className={styles.quickActions}>
                    <h3 className={styles.quickActionsTitle}>Thao tác nhanh</h3>
                    <div className={styles.quickActionButtons}>
                      {report.type === 'movie' && report.movieInfo && (
                        <>
                          <Link 
                            href={`/admin/movies/edit/${report.movieInfo.id}`} 
                            className={`${styles.quickActionButton} ${styles.editContentButton}`}
                          >
                            <FaEdit /> Sửa phim
                          </Link>
                          <a 
                            href={`/movies/${report.movieInfo.slug}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className={`${styles.quickActionButton} ${styles.viewContentButton}`}
                          >
                            <FaPlayCircle /> Xem phim
                          </a>
                        </>
                      )}
                      
                      {report.type === 'user' && report.contentId && (
                        <Link 
                          href={`/admin/users/edit/${report.contentId._id}`} 
                          className={`${styles.quickActionButton} ${styles.editContentButton}`}
                        >
                          <FaEdit /> Sửa người dùng
                        </Link>
                      )}
                      
                      {report.type === 'comment' && report.contentId && (
                        <button 
                          className={`${styles.quickActionButton} ${styles.deleteContentButton}`}
                          onClick={() => {
                            // Implement delete comment functionality
                            // Add confirmation dialog
                            alert('Chức năng xóa bình luận sẽ được triển khai sau');
                          }}
                        >
                          <FaTrash /> Xóa bình luận
                        </button>
                      )}
                      
                      <a 
                        href={`mailto:${report.userId.email}?subject=Phản hồi báo cáo: ${report._id}&body=Kính gửi ${report.userId.name},%0A%0AChúng tôi đã nhận được báo cáo của bạn và đang xử lý.%0A%0AThông tin báo cáo:%0A- Loại: ${renderTypeText(report.type)}%0A- Lý do: ${report.reason}%0A%0ACảm ơn bạn đã gửi báo cáo này.%0A%0ATrân trọng,%0AĐội ngũ MovieStreaming`}
                        className={`${styles.quickActionButton} ${styles.contactButton}`}
                      >
                        <FaEnvelope /> Liên hệ người báo cáo
                      </a>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Right column - Content details */}
              <div className={styles.contentDetailsColumn}>
                <div className={styles.reportCard}>
                  <h2 className={styles.cardTitle}>Chi tiết nội dung được báo cáo</h2>
                  
                  {report.type === 'movie' && report.movieInfo ? (
                    <div className={styles.movieContentDetails}>
                      {report.movieInfo.thumb && (
                        <div className={styles.movieThumbnailContainer}>
                          <img 
                            src={report.movieInfo.thumb} 
                            alt={report.movieInfo.name} 
                            className={styles.movieThumbnail}
                          />
                          {report.movieInfo.episode && (
                            <div className={styles.episodeBadge}>
                              Tập {report.movieInfo.episode}
                            </div>
                          )}
                        </div>
                      )}
                      
                      <div className={styles.movieInfoList}>
                        <div className={styles.movieInfoItem}>
                          <div className={styles.infoLabel}>Tên phim:</div>
                          <div className={styles.infoValue}>{report.movieInfo.name}</div>
                        </div>
                        
                        <div className={styles.movieInfoItem}>
                          <div className={styles.infoLabel}>ID phim:</div>
                          <div className={styles.infoValue}>{report.movieInfo.id}</div>
                        </div>
                        
                        <div className={styles.movieInfoItem}>
                          <div className={styles.infoLabel}>Slug:</div>
                          <div className={styles.infoValue}>{report.movieInfo.slug}</div>
                        </div>
                        
                        {report.movieInfo.episode && (
                          <div className={styles.movieInfoItem}>
                            <div className={styles.infoLabel}>Tập phim:</div>
                            <div className={styles.infoValue}>{report.movieInfo.episode}</div>
                          </div>
                        )}
                      </div>
                      
                      <div className={styles.contentActions}>
                        <Link 
                          href={`/admin/movies/edit/${report.movieInfo.id}`}
                          className={styles.contentActionLink}
                        >
                          <FaEdit /> Chỉnh sửa phim
                        </Link>
                        
                        <a 
                          href={`/movies/${report.movieInfo.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={styles.contentActionLink}
                        >
                          <FaLink /> Xem trang phim
                        </a>
                        
                        <a 
                          href={`/watch/${report.movieInfo.slug}${report.movieInfo.episode ? `/${report.movieInfo.episode}` : ''}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={styles.contentActionLink}
                        >
                          <FaPlayCircle /> Xem player
                        </a>
                      </div>
                    </div>
                  ) : report.type === 'user' && report.contentId ? (
                    <div className={styles.userContentDetails}>
                      <div className={styles.userProfileHeader}>
                        <h3 className={styles.userName}>{report.contentId.name}</h3>
                        <div className={styles.userIdBadge}>ID: {report.contentId._id}</div>
                      </div>
                      
                      <div className={styles.contentActions}>
                        <Link 
                          href={`/admin/users/edit/${report.contentId._id}`}
                          className={styles.contentActionLink}
                        >
                          <FaEdit /> Xem trang quản lý người dùng
                        </Link>
                      </div>
                    </div>
                  ) : report.type === 'comment' && report.contentId ? (
                    <div className={styles.commentContentDetails}>
                      <div className={styles.commentText}>
                        {report.contentId.text || 'Không có nội dung bình luận'}
                      </div>
                      
                      <div className={styles.commentMeta}>
                        <div className={styles.commentId}>
                          <span className={styles.metaLabel}>ID bình luận:</span>
                          <span className={styles.metaValue}>{report.contentId._id}</span>
                        </div>
                      </div>
                      
                      <div className={styles.contentActions}>
                        <button 
                          className={`${styles.contentActionButton} ${styles.deleteButton}`}
                          onClick={() => {
                            // Implement delete comment functionality
                            alert('Chức năng xóa bình luận sẽ được triển khai sau');
                          }}
                        >
                          <FaTrash /> Xóa bình luận này
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className={styles.noContentDetails}>
                      <p className={styles.noContentMessage}>
                        Không tìm thấy thông tin chi tiết về nội dung bị báo cáo
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        ) : null}
      </div>
    </AdminLayout>
  );
};

export default ReportDetailPage;
