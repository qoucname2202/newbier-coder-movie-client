import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import AdminLayout from '@/components/Layout/AdminLayout';
import AdminRoute from '@/components/ProtectedRoute/AdminRoute';
import axios from 'axios';
import {
  FaEye, FaCheck, FaTimes, FaFilter, FaExclamationTriangle,
  FaClock, FaEnvelope, FaUser, FaSearch, FaSort,
  FaSortUp, FaSortDown, FaChevronLeft, FaChevronRight,
  FaTrash, FaReply, FaCheckCircle, FaEdit, FaCalendarAlt,
  FaSpinner, FaBell
} from 'react-icons/fa';
import styles from '@/styles/AdminDashboard.module.css';

// Định nghĩa kiểu dữ liệu cho feedback
interface Feedback {
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
}

interface FeedbackStats {
  pending: number;
  processed: number;
  resolved: number;
  unread: number;
  total: number;
}

const FeedbackPage = () => {
  const router = useRouter();
  
  // State cho dữ liệu và phân trang
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalFeedback, setTotalFeedback] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<string>('all');
  
  // State cho bộ lọc và sắp xếp
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [sortField, setSortField] = useState<string>('createdAt');
  const [sortOrder, setSortOrder] = useState<string>('desc');
  
  // State cho thống kê
  const [stats, setStats] = useState<FeedbackStats>({
    pending: 0,
    processed: 0,
    resolved: 0,
    unread: 0,
    total: 0
  });

  // State cho xóa feedback
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const [feedbackToDelete, setFeedbackToDelete] = useState<string | null>(null);
  const [deleteInProgress, setDeleteInProgress] = useState<boolean>(false);

  // State cho cập nhật trạng thái
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  
  // State cho toast notification
  const [toast, setToast] = useState<{
    show: boolean;
    message: string;
    type: 'success' | 'error' | 'info';
  }>({
    show: false,
    message: '',
    type: 'info'
  });  // Hàm để lấy URL ảnh đại diện người dùng
  const getAvatarUrl = (user: any) => {
    // Luôn trả về một URL avatar hợp lệ
    const defaultAvatar = '/img/avatar.png';
    
    // Nếu không có user hoặc không có avatar, trả về avatar mặc định
    if (!user || !user.avatar) return defaultAvatar;
    
    // Nếu avatar là đường dẫn mặc định, trả về đường dẫn mặc định
    if (user.avatar === '/img/avatar.png') {
      return defaultAvatar;
    }
    
    // Khi avatar là URL đầy đủ (http hoặc https)
    if (user.avatar.startsWith('http')) {
      return user.avatar;
    }
    
    // Xử lý URL tương đối - thêm tiền tố domain API
    const baseApiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
    const cleanBaseUrl = baseApiUrl.replace(/\/api$/, '');
    
    // Đảm bảo có đủ dấu / giữa baseUrl và đường dẫn avatar
    const avatarPath = user.avatar.startsWith('/') ? user.avatar : `/${user.avatar}`;
    return `${cleanBaseUrl}${avatarPath}`;
  };

  const ITEMS_PER_PAGE = 10;
  // Fetch dữ liệu feedback
  const fetchFeedback = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('auth_token'); // hoặc 'token' tùy theo cách bạn lưu token
      if (!token) {
        router.push('/auth/login');
        return;
      }
      
      // Xây dựng tham số query
      const params: any = {
        page: currentPage,
        limit: ITEMS_PER_PAGE
      };
      
      if (searchQuery) {
        params.search = searchQuery;
      }
      
      // Xử lý trạng thái dựa trên tab được chọn
      if (activeTab !== 'all') {
        params.status = activeTab;
      } else if (statusFilter) {
        params.status = statusFilter;
      }
      
      if (sortField) {
        params.sortField = sortField;
        params.sortOrder = sortOrder;
      }
        // Gọi API lấy danh sách feedback
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
      const response = await axios.get(`${baseUrl}/feedback`, {
        params,
        headers: { Authorization: `Bearer ${token}` }
      });      if (response.data.success) {
        const feedbackData = response.data.data.feedbacks;
        setFeedback(feedbackData);
        setTotalPages(response.data.data.pagination.totalPages);
        setTotalFeedback(response.data.data.pagination.total);
      } else {
        console.error('Failed to fetch feedback:', response.data.message);
      }
    } catch (error) {
      console.error('Error fetching feedback:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch thống kê feedback
  const fetchFeedbackStats = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) return;
      
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
      const response = await axios.get(`${baseUrl}/feedback/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching feedback stats:', error);
    }
  };

  // Xử lý thay đổi trang
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Xử lý thay đổi bộ lọc
  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
    const { name, value } = e.target;
    
    if (name === 'status') {
      setStatusFilter(value);
    } else if (name === 'search') {
      setSearchQuery(value);
    }
  };

  // Xử lý thay đổi sắp xếp
  const handleSortChange = (field: string) => {
    if (field === sortField) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };
  // Xử lý áp dụng bộ lọc
  const applyFilters = () => {
    setCurrentPage(1);
    fetchFeedback();
  };

  // Xử lý reset bộ lọc
  const resetFilters = () => {
    setSearchQuery('');
    setStatusFilter('');
    setCurrentPage(1);
  };

  // Xử lý thay đổi tab
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setCurrentPage(1);
    setStatusFilter('');
  };

  // Xử lý xóa feedback
  const handleDeleteFeedback = async () => {
    if (!feedbackToDelete) return;
    
    try {
      setDeleteInProgress(true);
      const token = localStorage.getItem('auth_token');
      if (!token) return;
      
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
      const response = await axios.delete(`${baseUrl}/feedback/${feedbackToDelete}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        // Cập nhật danh sách feedback sau khi xóa
        setFeedback(feedback.filter(item => item._id !== feedbackToDelete));
        // Cập nhật thống kê
        fetchFeedbackStats();
        // Đóng modal
        setShowDeleteModal(false);
        setFeedbackToDelete(null);
        // Hiển thị thông báo thành công
        setToast({
          show: true,
          message: 'Xóa góp ý thành công',
          type: 'success'
        });
      }
    } catch (error) {
      console.error('Error deleting feedback:', error);
      alert('Có lỗi xảy ra khi xóa góp ý');
      setToast({
        show: true,
        message: 'Có lỗi xảy ra khi xóa góp ý',
        type: 'error'
      });
    } finally {
      setDeleteInProgress(false);
    }
  };

  // Xử lý cập nhật trạng thái feedback
  const updateFeedbackStatus = async (id: string, newStatus: string) => {
    try {
      setUpdatingStatus(id);
      const token = localStorage.getItem('auth_token');
      if (!token) return;
      
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
      const response = await axios.patch(`${baseUrl}/feedback/${id}`, 
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (response.data.success) {
        // Lấy thông tin feedback được cập nhật
        const updatedItem = feedback.find(item => item._id === id);
        const userName = updatedItem?.user?.fullName || updatedItem?.user?.name || updatedItem?.name || 'Người dùng';
        
        // Cập nhật dữ liệu feedback trong state
        setFeedback(feedback.map(item => 
          item._id === id ? { ...item, status: newStatus as 'pending' | 'processed' | 'resolved' } : item
        ));
        
        // Cập nhật thống kê
        fetchFeedbackStats();
        
        // Hiển thị thông báo thành công
        setToast({
          show: true,
          message: `Góp ý của "${userName}" đã được cập nhật thành "${getStatusText(newStatus)}"`,
          type: 'success'
        });
        
        // Ẩn toast sau 3 giây
        setTimeout(() => {
          setToast({ show: false, message: '', type: 'info' });
        }, 3000);
      }
    } catch (error) {
      console.error('Error updating feedback status:', error);
      setToast({
        show: true,
        message: 'Có lỗi xảy ra khi cập nhật trạng thái góp ý',
        type: 'error'
      });
      
      // Ẩn toast sau 3 giây
      setTimeout(() => {
        setToast({ show: false, message: '', type: 'info' });
      }, 3000);
    } finally {
      setUpdatingStatus(null);
    }
  };

  // Format thời gian hiển thị
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

  // Hiển thị icon tương ứng với trạng thái
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <FaClock className="text-warning" />;
      case 'processed':
        return <FaEye className="text-primary" />;
      case 'resolved':
        return <FaCheckCircle className="text-success" />;
      default:
        return <FaClock className="text-secondary" />;
    }
  };

  // Hiển thị tên trạng thái
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
  // Fetch dữ liệu khi component mount hoặc khi các dependencies thay đổi
  useEffect(() => {
    fetchFeedback();
    fetchFeedbackStats();
  }, [currentPage, sortField, sortOrder, activeTab]);

  return (
    <>
      <Head>
        <title>Quản lý góp ý - Admin Panel</title>
      </Head>

      <div className={styles.container}>
        {/* Header */}        <section className={styles.header}>
          <div className="container-fluid">
            <div className="row align-items-center">
              <div className="col-sm-6">
                <h1 className={styles.headerTitle}>
                  <FaEnvelope className="header-icon mr-2" /> Quản lý góp ý
                </h1>
                <p className="text-muted mt-2 d-none d-sm-block">
                  Quản lý và phản hồi góp ý từ người dùng hệ thống
                </p>
              </div>
              <div className="col-sm-6">
                <ol className={`breadcrumb float-sm-right ${styles.breadcrumb} custom-breadcrumb`}>
                  <li className="breadcrumb-item">
                    <Link href="/admin" legacyBehavior>
                      <a>Trang chủ</a>
                    </Link>
                  </li>
                  <li className="breadcrumb-item active">Góp ý</li>
                </ol>
              </div>
            </div>
          </div>
        </section>

        {/* Main Content */}        <section className="content">
          <div className="container-fluid">

            {/* Tab Navigation */}
            <ul className="tab-navigation">
              <li>
                <a 
                  href="#" 
                  className={activeTab === 'all' ? 'active' : ''} 
                  onClick={(e) => {
                    e.preventDefault();
                    handleTabChange('all');
                  }}
                >
                  Tất cả
                  <span className="status-badge dark">{stats.total}</span>
                </a>
              </li>
              <li>
                <a 
                  href="#" 
                  className={activeTab === 'pending' ? 'active' : ''} 
                  onClick={(e) => {
                    e.preventDefault();
                    handleTabChange('pending');
                  }}
                >
                  Đang chờ
                  <span className="status-badge warning">{stats.pending}</span>
                </a>
              </li>
              <li>
                <a 
                  href="#" 
                  className={activeTab === 'processed' ? 'active' : ''} 
                  onClick={(e) => {
                    e.preventDefault();
                    handleTabChange('processed');
                  }}
                >
                  Đang xử lý
                  <span className="status-badge info">{stats.processed}</span>
                </a>
              </li>
              <li>
                <a 
                  href="#" 
                  className={activeTab === 'resolved' ? 'active' : ''} 
                  onClick={(e) => {
                    e.preventDefault();
                    handleTabChange('resolved');
                  }}
                >
                  Đã giải quyết
                  <span className="status-badge success">{stats.resolved}</span>
                </a>
              </li>
            </ul>            {/* Search Filter Bar */}
            <div className="filters-row">
              <div className="search-box">
                <input
                  type="text"
                  name="search"
                  id="searchQuery"
                  className="form-control"
                  placeholder="Tìm kiếm báo cáo..."
                  value={searchQuery}
                  onChange={handleFilterChange}
                />
                <button onClick={applyFilters}>
                  <FaSearch />
                </button>
              </div>
              <button 
                className="btn btn-primary"
                onClick={applyFilters}
              >
                <FaFilter className="me-2" /> Lọc
              </button>
              <button 
                className="btn btn-outline-secondary"
                onClick={resetFilters}
              >
                <FaTimes className="me-2" /> Đặt lại
              </button>
            </div>
            
            {/* Feedback List */}
            <div className="card">
              <div className="card-header bg-gradient-light">
                <h3 className="card-title">
                  {activeTab === 'all' && 'Tất cả góp ý'}
                  {activeTab === 'pending' && 'Góp ý chờ xử lý'}
                  {activeTab === 'processed' && 'Góp ý đang xử lý'}
                  {activeTab === 'resolved' && 'Góp ý đã giải quyết'}
                </h3>
                <div className="card-tools">
                  <span className="badge badge-dark">{feedback.length} / {totalFeedback} góp ý</span>
                </div>
              </div>
              
              {/* Card view for mobile and grid view */}
              <div className="card-body d-block d-md-none">
                {loading ? (
                  <div className="text-center py-5">
                    <div className="spinner-border text-primary" role="status">
                      <span className="sr-only">Loading...</span>
                    </div>
                  </div>
                ) : feedback.length > 0 ? (
                  <div className="feedback-cards">
                    {feedback.map((item) => (                      <div 
                        key={item._id} 
                        className={`feedback-card mb-4 ${!item.isRead ? 'border-left-danger' : ''}`}
                      >                        <div className="card-header d-flex justify-content-between align-items-center">
                          <h5 className="m-0 text-truncate movie-subject">Góp ý từ người dùng</h5>
                          {!item.isRead && <span className="badge badge-danger">Mới</span>}
                        </div>
                        <div className="card-body">                          
                          <div className="user-info-container">
                            <img 
                              src={getAvatarUrl(item.user)} 
                              alt={`Avatar của ${item.name}`}
                              title={`${item.user?.fullName || item.user?.name || item.name}`}
                              className="avatar-image"
                              onError={(e) => {
                                e.currentTarget.onerror = null;
                                e.currentTarget.src = '/img/avatar.png';
                                e.currentTarget.classList.add('avatar-fallback');
                              }}
                            />
                            <div className="user-details">
                              <h5 className="mb-0">{item.name}</h5>
                              <div className="user-email">
                                <FaEnvelope size={12} /> {item.email}
                              </div>
                            </div>
                          </div>
                          
                          <div className="message-preview mb-3">
                            <p className="text-muted mb-1">
                              {item.message.length > 120 
                                ? `${item.message.substring(0, 120)}...` 
                                : item.message}
                            </p>
                          </div>
                          
                          <div className="card-meta">                            
                            <span className={`badge ${
                              item.status === 'pending' ? 'badge-warning' : 
                              item.status === 'processed' ? 'badge-primary' : 
                              'badge-success'
                            }`}>
                              {getStatusText(item.status)}
                            </span>
                            <div className="date-badge">
                              <FaCalendarAlt className="me-1" size={12} /> {formatDate(item.createdAt)}
                            </div>
                          </div>                          <div className="status-actions mt-2 mb-3">
                            <Link href={`/admin/feedback/detail/${item._id}`} legacyBehavior>
                              <a 
                                className="btn btn-sm btn-secondary"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <FaEdit className="me-1" /> Cập nhật trạng thái
                              </a>
                            </Link>
                          </div>
                            <div className="card-action-buttons">
                            <Link href={`/admin/feedback/detail/${item._id}`} legacyBehavior>
                              <a className="btn btn-sm btn-info">
                                <FaEye className="me-1" /> Xem chi tiết
                              </a>
                            </Link>
                            <button
                              className="btn btn-sm btn-danger"
                              onClick={(e) => {
                                e.stopPropagation();
                                setFeedbackToDelete(item._id);
                                setShowDeleteModal(true);
                              }}
                            >
                              <FaTrash className="me-1" /> Xóa
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-muted mb-0">Không tìm thấy dữ liệu góp ý</p>
                  </div>
                )}
              </div>
              
              {/* Table view for desktop */}              <div className="card-body p-0 d-none d-md-block">
                <div className="table-responsive">
                  <table className="table table-hover">                    
                    <thead>                      
                      <tr>
                        <th className="cell-w-xs text-center" style={{width: "40px"}}>
                          <input type="checkbox" className="form-check-input table-check" />
                        </th>                          
                        <th className="cursor-pointer cell-w-md" onClick={() => handleSortChange('name')}>
                          <div className="d-flex align-items-center">
                            Người báo cáo
                            {sortField === 'name' && (
                              sortOrder === 'asc' ? <FaSortUp className="ms-1" /> : <FaSortDown className="ms-1" />
                            )}
                            {sortField !== 'name' && <FaSort className="ms-1" />}
                          </div>
                        </th>
                        <th className="cell-w-lg">Nội Dung Góp Ý</th>
                        <th className="cursor-pointer cell-w-sm" onClick={() => handleSortChange('status')}>
                          <div className="d-flex align-items-center">
                            Trạng thái
                            {sortField === 'status' && (
                              sortOrder === 'asc' ? <FaSortUp className="ms-1" /> : <FaSortDown className="ms-1" />
                            )}
                            {sortField !== 'status' && <FaSort className="ms-1" />}
                          </div>
                        </th>                        <th className="cursor-pointer cell-w-sm" onClick={() => handleSortChange('createdAt')}>
                          <div className="d-flex align-items-center">
                            Ngày tạo
                            {sortField === 'createdAt' && (
                              sortOrder === 'asc' ? <FaSortUp className="ms-1" /> : <FaSortDown className="ms-1" />
                            )}
                            {sortField !== 'createdAt' && <FaSort className="ms-1" />}
                          </div>
                        </th>
                        <th className="text-center cell-w-sm">Hành động</th>
                      </tr>
                    </thead>
                    <tbody>                      {loading ? (
                        <tr>
                          <td colSpan={6} className="text-center py-4">
                            <div className="spinner-border text-primary" role="status">
                              <span className="sr-only">Loading...</span>
                            </div>
                          </td>
                        </tr>
                      ) : feedback.length > 0 ? (
                        feedback.map((item) => (                        <tr 
                            key={item._id} 
                            className={!item.isRead ? 'font-weight-bold' : ''}
                            style={{
                              boxShadow: !item.isRead ? 'inset 3px 0 0 #dc3545' : 'none',
                              transition: 'all 0.2s ease'
                            }}
                          >                            <td className="text-center">
                              <input type="checkbox" className="form-check-input table-check" />
                            </td>                            
                            <td className="cell-w-md">                              <div className="reporter-info-compact">
                                <img 
                                  src={getAvatarUrl(item.user)} 
                                  alt={`Avatar của ${item.user?.fullName || item.user?.name || item.name}`}
                                  title={`${item.user?.fullName || item.user?.name || item.name}`}
                                  className="avatar-image-xs"
                                  onError={(e) => {
                                    e.currentTarget.onerror = null;
                                    e.currentTarget.src = '/img/avatar.png';
                                    e.currentTarget.classList.add('avatar-fallback');
                                  }}
                                />
                                <div>
                                  <span className="reporter-name">
                                    {item.user?.fullName || item.user?.name || item.name}
                                  </span>
                                  <span className="reporter-email">
                                    <FaEnvelope size={10} className="me-1" /> {item.email}
                                  </span>
                                </div>
                              </div>
                            </td>                            
                            <td className="text-truncate cell-w-lg">
                              <span className="message-preview-table">
                                {item.message.substring(0, 200)}
                              </span>
                            </td>                           
                            <td>
                              <span className={`badge ${
                                item.status === 'pending' ? 'badge-warning' : 
                                item.status === 'processed' ? 'badge-primary' : 
                                'badge-success'
                              }`}>
                                {getStatusText(item.status)}
                              </span>
                              {!item.isRead && (
                                <span className="badge badge-danger ms-2">Mới</span>
                              )}                              <div className="mt-2">

                              </div>
                            </td>                            <td className="cell-w-sm">
                              <span className="d-inline-flex align-items-center text-muted">
                                {formatDate(item.createdAt)}
                              </span>
                            </td><td className="text-center">
                              <div className="btn-group table-row-action">
                                <Link href={`/admin/feedback/detail/${item._id}`} legacyBehavior>
                                  <a className="btn btn-sm btn-info" title="Xem chi tiết">
                                    <FaEye />
                                  </a>
                                </Link>
                                <button
                                  className="btn btn-sm btn-danger"
                                  title="Xóa"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setFeedbackToDelete(item._id);
                                    setShowDeleteModal(true);
                                  }}
                                >
                                  <FaTrash />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (                      <tr>
                        <td colSpan={6} className="text-center py-4">
                          <p className="text-muted mb-0">Không tìm thấy dữ liệu góp ý</p>
                        </td>
                      </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="card-footer bg-white p-0 border-top-0">
                <div className="d-flex p-3 align-items-center justify-content-between border-top">
                  <div className="d-flex align-items-center">
                    <input type="checkbox" className="form-check-input me-2" id="selectAll" />
                    <label htmlFor="selectAll" className="form-check-label text-muted">Chọn tất cả</label>
                  </div>
                  <div className="btn-group">
                    <button className="btn btn-outline-secondary btn-sm">
                      <FaTrash className="me-1" /> Xóa đã chọn
                    </button>
                  </div>
                </div>
              </div>
              <div className="card-footer">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <span>Hiển thị {feedback.length} / {totalFeedback} góp ý</span>
                  </div>
                  {totalPages > 1 && (
                    <ul className="pagination pagination-sm m-0">
                      <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                        <a 
                          className="page-link" 
                          href="#" 
                          onClick={(e) => {
                            e.preventDefault();
                            if (currentPage > 1) handlePageChange(currentPage - 1);
                          }}
                        >
                          <FaChevronLeft size={12} />
                        </a>
                      </li>
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                        <li key={page} className={`page-item ${currentPage === page ? 'active' : ''}`}>
                          <a 
                            className="page-link" 
                            href="#" 
                            onClick={(e) => {
                              e.preventDefault();
                              handlePageChange(page);
                            }}
                          >
                            {page}
                          </a>
                        </li>
                      ))}
                      <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                        <a 
                          className="page-link" 
                          href="#" 
                          onClick={(e) => {
                            e.preventDefault();
                            if (currentPage < totalPages) handlePageChange(currentPage + 1);
                          }}
                        >
                          <FaChevronRight size={12} />
                        </a>
                      </li>
                    </ul>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <>
          <div className="modal fade show active-modal" style={{ display: 'block', zIndex: 1050 }}>
            <div className="modal-dialog" style={{ zIndex: 1051 }}>
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Xác nhận xóa</h5>
                  <button
                    type="button"
                    className="close"
                    onClick={() => setShowDeleteModal(false)}
                    style={{ cursor: 'pointer' }}
                  >
                    <span aria-hidden="true">&times;</span>
                  </button>
                </div>
                <div className="modal-body">
                  <p>Bạn có chắc chắn muốn xóa góp ý này không?</p>
                  <p className="text-danger">Lưu ý: Hành động này không thể hoàn tác.</p>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setShowDeleteModal(false)}
                    disabled={deleteInProgress}
                  >
                    Hủy
                  </button>
                  <button
                    type="button"
                    className="btn btn-danger"
                    onClick={() => handleDeleteFeedback()}
                    disabled={deleteInProgress}
                  >
                    {deleteInProgress ? (
                      <>
                        <span className="spinner-border spinner-border-sm mr-2" role="status" aria-hidden="true"></span>
                        Đang xóa...
                      </>
                    ) : (
                      'Xóa'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div 
            className="modal-backdrop fade show" 
            style={{ zIndex: 1049 }} 
            onClick={() => setShowDeleteModal(false)}
          ></div>
        </>
      )}
      
      {/* Toast Notification */}
      {toast.show && (
        <div 
          className={`toast-notification ${toast.type}`} 
          style={{
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            zIndex: 1060,
            minWidth: '300px',
            backgroundColor: toast.type === 'success' ? '#28a745' : 
                            toast.type === 'error' ? '#dc3545' : '#17a2b8',
            color: '#fff',
            padding: '12px 20px',
            borderRadius: '4px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            animation: 'slideInRight 0.3s ease-out forwards'
          }}
        >
          <div className="d-flex align-items-center">
            {toast.type === 'success' && <FaCheckCircle className="me-2" />}
            {toast.type === 'error' && <FaExclamationTriangle className="me-2" />}
            {toast.type === 'info' && <FaBell className="me-2" />}
            <span>{toast.message}</span>
          </div>
          <button 
            type="button"
            className="btn-close btn-close-white" 
            onClick={() => setToast({ ...toast, show: false })}
            style={{ 
              background: 'transparent', 
              border: 'none', 
              color: '#fff',
              fontSize: '20px',
              cursor: 'pointer',
              marginLeft: '10px',
              padding: '0'
            }}
          >
            <FaTimes />
          </button>
        </div>
      )}
      
      {/* Custom CSS now moved to external file */}
    </>
  );
};

// Thêm getLayout để sử dụng AdminLayout với bảo vệ admin
FeedbackPage.getLayout = (page: React.ReactNode) => {
  return (
    <AdminRoute>
      <AdminLayout>{page}</AdminLayout>
    </AdminRoute>
  );
};

export default FeedbackPage;