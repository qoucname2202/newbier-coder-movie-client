import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import AdminRoute from '../../components/ProtectedRoute/AdminRoute';
import styles from '@/styles/AdminReports.module.css';
import AdminLayout from '@/components/Layout/AdminLayout';
import { 
  FaEye, FaCheck, FaTimes, FaFilter, FaExclamationTriangle, 
  FaClock, FaExclamationCircle, FaUser, FaFilm, 
  FaChevronLeft, FaChevronRight, FaEnvelope, FaLink, 
  FaPlay, FaPlayCircle, FaEdit, FaTrash, FaSort, 
  FaSortUp, FaSortDown, FaListUl, FaCheckSquare, FaCalendarAlt,
  FaSearch
} from 'react-icons/fa';
import { getReports, updateReport } from '@/API/services/admin/reportService';

// Định nghĩa kiểu dữ liệu cho báo cáo
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
    id: string;      // ID của phim
    name: string;    // Tên phim
    slug: string;    // Slug của phim
    thumb: string;   // Thumbnail phim
    episode: number; // Tập phim đang xem khi báo cáo lỗi
  };
}

const ReportsPage = () => {  // State cho dữ liệu và bộ lọc
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalReports, setTotalReports] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<string>('all');
  
  // State cho bộ lọc
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState<boolean>(false);
  
  // State cho sắp xếp
  const [sortField, setSortField] = useState<string>('createdAt');
  const [sortOrder, setSortOrder] = useState<string>('desc');
  
  // State cho modal
  const [showModal, setShowModal] = useState<boolean>(false);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [adminNotes, setAdminNotes] = useState<string>('');
  const [newStatus, setNewStatus] = useState<string>('');
  
  // State cho hành động hàng loạt
  const [selectedReportIds, setSelectedReportIds] = useState<string[]>([]);
  const [showBulkActionModal, setShowBulkActionModal] = useState<boolean>(false);
  const [bulkActionType, setBulkActionType] = useState<string>('');

  const ITEMS_PER_PAGE = 10;  // Hàm lấy dữ liệu báo cáo
  const fetchReports = async () => {
    try {
      setLoading(true);
      
      // Xây dựng tham số query
      const params: any = {
        page: currentPage,
        limit: ITEMS_PER_PAGE
      };
      
      if (searchQuery) {
        params.search = searchQuery;
      }
      
      if (typeFilter) {
        params.type = typeFilter;
      }
      
      if (statusFilter) {
        params.status = statusFilter;
      }
      
      if (activeTab !== 'all') {
        params.status = activeTab;
      }
      
      // Thêm tham số lọc theo ngày
      if (startDate) {
        params.startDate = startDate;
      }
      
      if (endDate) {
        params.endDate = endDate;
      }
      
      // Thêm tham số sắp xếp
      if (sortField) {
        params.sortBy = sortField;
        params.sortOrder = sortOrder;
      }
      
      // Gọi API để lấy dữ liệu
      const data = await getReports(params);
      
      setReports(data.reports || []);
      setTotalPages(data.totalPages || 1);
      setTotalReports(data.total || 0);
    } catch (error) {
      console.error('Error fetching reports:', error);
      // Xử lý khi API lỗi - Hiển thị thông báo
    } finally {
      setLoading(false);
    }
  };
  // Effect để fetch data khi các điều kiện thay đổi
  useEffect(() => {
    fetchReports();
  }, [currentPage, activeTab, sortField, sortOrder]);
  
  // Hàm áp dụng bộ lọc
  const applyFilters = () => {
    setCurrentPage(1);
    fetchReports();
  };
  
  // Hàm reset bộ lọc
  const resetFilters = () => {
    setSearchQuery('');
    setTypeFilter('');
    setStatusFilter('');
    setCurrentPage(1);
    fetchReports();
  };
    // Hàm xử lý khi click vào header để sắp xếp
  const handleSortChange = (field: string) => {
    if (sortField === field) {
      // Đảo chiều sắp xếp nếu đang sắp xếp theo field này
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      // Sắp xếp theo field mới với thứ tự mặc định là desc
      setSortField(field);
      setSortOrder('desc');
    }
  };
  
  // Hiển thị icon sắp xếp
  const renderSortIcon = (field: string) => {
    if (sortField !== field) {
      return <span className={styles.sortIconInactive}><FaSort /></span>;
    }
    
    return sortOrder === 'asc' 
      ? <span className={styles.sortIconActive}><FaSortUp /></span>
      : <span className={styles.sortIconActive}><FaSortDown /></span>;
  };
  
  // Hàm xử lý chọn/bỏ chọn tất cả báo cáo
  const handleSelectAllReports = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      setSelectedReportIds(reports.map(report => report._id));
    } else {
      setSelectedReportIds([]);
    }
  };
  
  // Hàm xử lý chọn/bỏ chọn một báo cáo
  const handleSelectReport = (reportId: string, isChecked: boolean) => {
    if (isChecked) {
      setSelectedReportIds([...selectedReportIds, reportId]);
    } else {
      setSelectedReportIds(selectedReportIds.filter(id => id !== reportId));
    }
  };
  
  // Helper function to get table cell class names
  const getTableCellClassName = () => {
    return styles.tableCellCompact;
  };
  
  // Hàm xử lý hành động hàng loạt
  const handleBulkAction = async () => {
    if (!bulkActionType || selectedReportIds.length === 0) return;
    
    try {
      // Cập nhật trạng thái hàng loạt
      const updatePromises = selectedReportIds.map(id => 
        updateReport(id, { 
          status: bulkActionType,
          adminNotes: bulkActionType === 'resolved' 
            ? 'Báo cáo đã được xử lý hàng loạt' 
            : bulkActionType === 'in-progress'
            ? 'Báo cáo đang được xử lý'
            : 'Báo cáo đã bị từ chối'
        })
      );
      
      await Promise.all(updatePromises);
      
      // Cập nhật trạng thái trong danh sách
      setReports(reports.map(report => 
        selectedReportIds.includes(report._id)
          ? { 
              ...report, 
              status: bulkActionType as any, 
              adminNotes: bulkActionType === 'resolved' 
                ? 'Báo cáo đã được xử lý hàng loạt' 
                : bulkActionType === 'in-progress'
                ? 'Báo cáo đang được xử lý'
                : 'Báo cáo đã bị từ chối',
              updatedAt: new Date().toISOString() 
            } 
          : report
      ));
      
      // Reset state
      setSelectedReportIds([]);
      setShowBulkActionModal(false);
      setBulkActionType('');
    } catch (error) {
      console.error('Error performing bulk action:', error);
      // Hiển thị thông báo lỗi
    }
  };
  
  // Hàm cập nhật trạng thái báo cáo
  const handleUpdateReport = async () => {
    if (!selectedReport) return;
    
    try {
      // Gọi API để cập nhật báo cáo
      await updateReport(selectedReport._id, {
        status: newStatus,
        adminNotes: adminNotes
      });
      
      // Cập nhật trạng thái trong danh sách
      setReports(reports.map(report => 
        report._id === selectedReport._id 
          ? { ...report, status: newStatus as any, adminNotes, updatedAt: new Date().toISOString() } 
          : report
      ));
      
      setShowModal(false);
    } catch (error) {
      console.error('Error updating report:', error);
      // Xử lý khi API lỗi - Hiển thị thông báo
    }
  };
  // Hàm hiển thị icon theo loại báo cáo
  const renderTypeIcon = (type: string, report?: any) => {
    switch(type) {
      case 'movie':
        return <FaFilm />;
      case 'user':
        return <FaUser />;
      case 'comment':
        return <FaExclamationCircle />;
      default:
        return <FaExclamationTriangle />;
    }
  };
  
  // Hàm hiển thị trạng thái
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

  return (
    <>
      <Head>
        <title>Quản lý báo cáo - Admin Panel</title>
      </Head>

      <div className={styles.container}>
        {/* Header */}
        <section className={styles.header}>
          <div className="container-fluid">
            <div className="row align-items-center">
              <div className="col-md-6">
                <h1 className={styles.headerTitle}>Quản lý báo cáo</h1>
                <p className={styles.headerSubtitle}>Xem và xử lý các báo cáo từ người dùng</p>
              </div>
              <div className="col-md-6">
                <ol className={`breadcrumb float-md-end ${styles.breadcrumb}`}>
                  <li className="breadcrumb-item"><Link href="/admin">Dashboard</Link></li>
                  <li className="breadcrumb-item active">Báo cáo</li>
                </ol>
              </div>
            </div>
          </div>
        </section>

        {/* Tab Navigation */}
        <div className={styles.tabContainer}>
          <button 
            className={`${styles.tabButton} ${activeTab === 'all' ? styles.tabButtonActive : ''}`}
            onClick={() => setActiveTab('all')}
          >
            Tất cả
          </button>
          <button 
            className={`${styles.tabButton} ${activeTab === 'pending' ? styles.tabButtonActive : ''}`}
            onClick={() => setActiveTab('pending')}
          >
            Đang chờ
          </button>
          <button 
            className={`${styles.tabButton} ${activeTab === 'in-progress' ? styles.tabButtonActive : ''}`}
            onClick={() => setActiveTab('in-progress')}
          >
            Đang xử lý
          </button>
          <button 
            className={`${styles.tabButton} ${activeTab === 'resolved' ? styles.tabButtonActive : ''}`}
            onClick={() => setActiveTab('resolved')}
          >
            Đã giải quyết
          </button>
          <button 
            className={`${styles.tabButton} ${activeTab === 'rejected' ? styles.tabButtonActive : ''}`}
            onClick={() => setActiveTab('rejected')}
          >
            Đã từ chối
          </button>
        </div>        {/* Filters */}
        <div className={styles.filterContainer}>          <div className={styles.searchWrapper} style={{ 
              position: 'relative', 
              flex: '1',
              display: 'flex',
              alignItems: 'center',
              border: '1px solid #ddd',
              borderRadius: '4px',
              overflow: 'hidden',
              backgroundColor: '#fff'
            }}>
            <div style={{ display: 'flex', alignItems: 'center', padding: '0 10px', color: '#666' }}>
              <FaSearch />
            </div>            <input 
              type="text"
              className={styles.searchInput}
              placeholder="Tìm kiếm theo lý do, tên phim... (Enter để tìm)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  applyFilters();
                }
              }}
              title="Nhập từ khóa để tìm kiếm theo lý do báo cáo hoặc tên phim, nhấn Enter để tìm kiếm"
              style={{
                border: 'none',
                padding: '10px 0',
                flex: 1,
                outline: 'none'
              }}
            />
            <button 
              className={styles.searchButton}
              onClick={applyFilters}
              style={{
                height: '100%',
                padding: '0 15px',
                background: '#f0f0f0',
                border: 'none',
                borderLeft: '1px solid #ddd',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                color: '#333'
              }}
              title="Tìm kiếm"
            >
              Tìm
            </button></div>
           
          
          

          
          <button 
            className={styles.resetButton}
            onClick={resetFilters}
            style={{ 
              marginLeft: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              border: '1px solid #ddd',
              padding: '10px 20px',
              borderRadius: '4px',
              backgroundColor: '#fff',
              cursor: 'pointer',
              color: '#333'
            }}
          >
            Reset
          </button>
        </div>

        {/* Bulk Actions */}
        <div className={styles.bulkActionContainer}>
          {selectedReportIds.length > 0 && (
            <>
              <span className={styles.selectedCount}>
                Đã chọn {selectedReportIds.length} báo cáo
              </span>
              <button 
                className={`${styles.bulkActionButton} ${styles.resolveButton}`}
                onClick={() => {
                  setBulkActionType('resolved');
                  setShowBulkActionModal(true);
                }}
              >
                <FaCheck /> Đánh dấu đã giải quyết
              </button>
              <button 
                className={`${styles.bulkActionButton} ${styles.processButton}`}
                onClick={() => {
                  setBulkActionType('in-progress');
                  setShowBulkActionModal(true);
                }}
              >
                <FaClock /> Đánh dấu đang xử lý
              </button>
              <button 
                className={`${styles.bulkActionButton} ${styles.rejectButton}`}
                onClick={() => {
                  setBulkActionType('rejected');
                  setShowBulkActionModal(true);
                }}
              >
                <FaTimes /> Từ chối báo cáo
              </button>
            </>
          )}
        </div>{/* Reports Summary */}
        <div className={styles.reportSummary}>
          <div className={styles.reportSummaryItem}>
            <div className={styles.summaryIcon}><FaExclamationTriangle /></div>
            <div className={styles.summaryInfo}>
              <div className={styles.summaryValue}>{totalReports}</div>
              <div className={styles.summaryLabel}>Tổng số báo cáo</div>
            </div>
          </div>
          <div className={`${styles.reportSummaryItem} ${styles.warningSummary}`}>
            <div className={styles.summaryIcon}><FaClock /></div>
            <div className={styles.summaryInfo}>
              <div className={styles.summaryValue}>
                {reports.filter(report => report.status === 'pending').length}
              </div>
              <div className={styles.summaryLabel}>Đang chờ xử lý</div>
            </div>
          </div>
          <div className={`${styles.reportSummaryItem} ${styles.progressSummary}`}>
            <div className={styles.summaryIcon}><FaClock /></div>
            <div className={styles.summaryInfo}>
              <div className={styles.summaryValue}>
                {reports.filter(report => report.status === 'in-progress').length}
              </div>
              <div className={styles.summaryLabel}>Đang xử lý</div>
            </div>
          </div>
          <div className={`${styles.reportSummaryItem} ${styles.successSummary}`}>
            <div className={styles.summaryIcon}><FaCheck /></div>
            <div className={styles.summaryInfo}>
              <div className={styles.summaryValue}>
                {reports.filter(report => report.status === 'resolved').length}
              </div>
              <div className={styles.summaryLabel}>Đã giải quyết</div>
            </div>
          </div>
        </div>
        
        {/* Reports Table */}
        {loading ? (
          <div className={styles.loadingContainer}>
            <div className={styles.loadingSpinner}></div>
          </div>
        ) : reports.length === 0 ? (
          <div className={styles.noDataContainer}>
            <div className={styles.noDataIcon}>
              <FaExclamationTriangle />
            </div>
            <h3 className={styles.noDataMessage}>Không tìm thấy báo cáo nào</h3>
            <p className={styles.noDataSubtext}>Không có báo cáo nào phù hợp với điều kiện tìm kiếm của bạn</p>
          </div>
        ) : (
          <div className={styles.tableContainer}>            
          <table className={styles.table}>              
            <thead>
                <tr>
                  <th style={{ width: '3%' }}>
                    <div className={styles.checkboxHeader}>
                      <input 
                        type="checkbox" 
                        checked={selectedReportIds.length === reports.length && reports.length > 0}
                        onChange={handleSelectAllReports}
                        className={styles.checkbox}
                      />
                    </div>
                  </th>                  
                  <th 
                    style={{ width: '18%' }}
                    onClick={() => handleSortChange('userId.name')}
                    className={styles.sortableHeader}
                  >
                    <div className={styles.headerWithSort}>
                      <span title="Thông tin người dùng đã gửi báo cáo">
                        Người báo cáo
                      </span>
                      {renderSortIcon('userId.name')}
                    </div>
                  </th>
                  <th style={{ width: '24%' }}>Tên phim/Tập phim</th>
                  <th style={{ width: '17%' }}>Lý do</th>
                  <th 
                    style={{ width: '10%' }}
                    onClick={() => handleSortChange('createdAt')}
                    className={styles.sortableHeader}
                  >
                    <div className={styles.headerWithSort}>
                      <span>Ngày tạo</span>
                      {renderSortIcon('createdAt')}
                    </div>
                  </th>
                  <th 
                    style={{ width: '8%' }}
                    onClick={() => handleSortChange('status')}
                    className={styles.sortableHeader}
                  >
                    <div className={styles.headerWithSort}>
                      <span>Trạng thái</span>
                      {renderSortIcon('status')}
                    </div>
                  </th>
                  <th style={{ width: '8%' }}>Hành động</th>
                </tr>
              </thead><tbody>
                {reports.map((report, index) => (
                  <tr key={report._id} className={report.status === 'pending' ? styles.highlightRow : ''}>                    <td className={styles.tableCellCompact}>
                      <input 
                        type="checkbox" 
                        checked={selectedReportIds.includes(report._id)}
                        onChange={(e) => handleSelectReport(report._id, e.target.checked)}
                        className={styles.checkbox}
                      />
                    </td>                    
                                       
                    <td className={styles.tableCellCompact}>
                      <div className={styles.userInfo}>
                        <div className={styles.userName} style={{ 
                          fontWeight: 'bold', 
                          fontSize: '14px',
                          marginBottom: '4px',
                          color: '#333'
                        }}>
                          {report.userId?.fullname || report.userId?.name || (report.userId?.email ? report.userId.email.split('@')[0] : 'Không xác định')}
                        </div>
                        <div className={styles.userEmail} style={{ 
                          color: '#666', 
                          fontSize: '12px',
                          display: 'flex',
                          alignItems: 'center'
                        }} title={report.userId?.email || 'N/A'}>
                          <FaEnvelope size={10} style={{ marginRight: '4px', flexShrink: 0 }} />
                          <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                            {report.userId?.email || 'N/A'}                          </span>
                        </div>
                      </div>
                    </td><td className={styles.tableCellCompact}>
                      {report.movieInfo && report.movieInfo.name ? (
                        <div className={styles.movieInfo}>
                          <div className={styles.movieTitle} style={{ 
                            fontWeight: 'bold', 
                            fontSize: '14px', 
                            marginBottom: '4px',
                            color: '#0056b3'
                          }}>
                            {report.movieInfo.name}
                          </div>
                          {report.movieInfo.episode && (
                            <div className={styles.episodeInfo} style={{ marginBottom: '4px' }}>
                              <span className={styles.episodeBadge} style={{
                                background: '#e9f3ff', 
                                color: '#0056b3', 
                                padding: '2px 6px', 
                                borderRadius: '4px', 
                                fontSize: '12px',
                                fontWeight: 'bold'
                              }}>
                                <FaPlayCircle style={{ marginRight: '4px' }} /> 
                                Tập {report.movieInfo.episode}
                              </span>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className={styles.contentInfo} style={{ color: '#666', fontStyle: 'italic' }}>
                          Không có thông tin phim                        </div>
                      )}
                    </td>                    <td className={styles.tableCellCompact}>
                      <div className={styles.reasonInfo}>
                        <div className={styles.reasonText} style={{ fontWeight: 'bold', fontSize: '14px' }}>
                          {report.reason === 'Phụ đề không hiển thị' ? 'Phụ đề không hiển thị' :
                           report.reason === 'phim lỗi' ? 'Lỗi phim' :
                           report.reason === 'Lý do khác' ? 'Lý do khác' :
                           report.reason || 'Lý do khác'}
                        </div>
                        <div className={styles.descriptionPreview} style={{ color: '#666', fontSize: '13px' }}>
                          {report.reason === 'Phụ đề không hiển thị' ? 'Phụ đề không hiển thị' :
                           (report.description && report.description.length > 40) ? 
                            report.description.substring(0, 40) + '...' : 
                            report.description || 'Không có mô tả'}                        </div>
                      </div>
                    </td>
                    <td className={styles.tableCellCompact} style={{ fontSize: '14px', color: '#333' }}>
                      {new Date(report.createdAt).toLocaleDateString('vi-VN')}
                    </td>                    <td className={styles.tableCellCompact}>
                      {report.status === 'pending' && (
                        <div 
                          title="Đang chờ"
                          style={{ 
                            background: '#fff8e1', 
                            color: '#ff8f00', 
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          <FaClock size={14} />
                        </div>
                      )}
                      {report.status === 'in-progress' && (
                        <div 
                          title="Đang xử lý"
                          style={{ 
                            background: '#e3f2fd', 
                            color: '#0277bd', 
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          <FaClock size={14} />
                        </div>
                      )}
                      {report.status === 'resolved' && (
                        <div 
                          title="Đã giải quyết"
                          style={{ 
                            background: '#e0f2f1', 
                            color: '#00897b',
                            width: '32px',
                            height: '32px', 
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          <FaCheck size={14} />
                        </div>
                      )}
                      {report.status === 'rejected' && (
                        <div 
                          title="Đã từ chối"
                          style={{ 
                            background: '#ffebee', 
                            color: '#c62828',
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          <FaTimes size={14} />
                        </div>
                      )}
                    </td><td className={styles.tableCellCompact}>
                      <div className={styles.actionButtons} style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                        <Link 
                          href={`/admin/reports/${report._id}`}
                          className={`${styles.actionButton} ${styles.viewButton}`}
                          title="Xem chi tiết"
                          style={{
                            background: '#e8f4fd',
                            color: '#0056b3',
                            border: 'none',
                            borderRadius: '50%',
                            width: '32px',
                            height: '32px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer'
                          }}
                        >
                          <FaEye />
                        </Link>
                        
                        <button
                          className={`${styles.actionButton} ${styles.processButton}`}
                          onClick={() => {
                            setSelectedReport(report);
                            setAdminNotes(report.adminNotes || '');
                            setNewStatus('in-progress');
                            setShowModal(true);
                          }}
                          title="Bắt đầu xử lý"
                          style={{
                            background: '#fff2cc',
                            color: '#ff8f00',
                            border: 'none',
                            borderRadius: '50%',
                            width: '32px',
                            height: '32px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer'
                          }}
                        >
                          <FaClock />
                        </button>
                        
                        <button
                          className={`${styles.actionButton} ${styles.resolveButton}`}
                          onClick={() => {
                            setSelectedReport(report);
                            setAdminNotes(report.adminNotes || '');
                            setNewStatus('resolved');
                            setShowModal(true);
                          }}
                          title="Đánh dấu đã giải quyết"
                          style={{
                            background: '#e0f5e9',
                            color: '#1e8e3e',
                            border: 'none',
                            borderRadius: '50%',
                            width: '32px',
                            height: '32px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer'
                          }}
                        >
                          <FaCheck />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}        {/* Pagination */}
        <div className={styles.paginationContainer}>
          <div className={styles.paginationInfo}>
            {searchQuery ? (
              <span>
                Tìm thấy <strong>{totalReports}</strong> báo cáo {typeFilter ? `loại "${typeFilter === 'movie' ? 'phim' : typeFilter === 'user' ? 'người dùng' : typeFilter === 'comment' ? 'bình luận' : 'khác'}"` : ''} phù hợp với từ khóa "<strong>{searchQuery}</strong>"
              </span>
            ) : (
              <span>Hiển thị {reports.length} trên {totalReports} báo cáo</span>
            )}
          </div>
          <div className={styles.paginationButtons}>
            <button 
              className={`${styles.paginationButton} ${currentPage === 1 ? styles.paginationButtonDisabled : ''}`}
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            >
              <FaChevronLeft />
            </button>
              {/* Generate the pagination buttons */}
            {(() => {
              // Calculate which page numbers to show
              const pageNumbers: number[] = [];
              
              if (totalPages <= 5) {
                // Show all pages if 5 or fewer
                for (let i = 1; i <= totalPages; i++) {
                  pageNumbers.push(i);
                }
              } else if (currentPage <= 3) {
                // Near the start
                pageNumbers.push(1, 2, 3, 4, 5);
              } else if (currentPage >= totalPages - 2) {
                // Near the end
                for (let i = totalPages - 4; i <= totalPages; i++) {
                  pageNumbers.push(i);
                }
              } else {
                // In the middle
                for (let i = currentPage - 2; i <= currentPage + 2; i++) {
                  pageNumbers.push(i);
                }
              }
              
              // Return the generated buttons
              return pageNumbers.map(pageNum => (
                <button
                  key={pageNum}
                  className={`${styles.paginationButton} ${currentPage === pageNum ? styles.paginationButtonActive : ''}`}
                  onClick={() => setCurrentPage(pageNum)}
                >
                  {pageNum}
                </button>
              ));
            })()}
            
            <button 
              className={`${styles.paginationButton} ${currentPage === totalPages ? styles.paginationButtonDisabled : ''}`}
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            >
              <FaChevronRight />
            </button>
          </div>
        </div>        {/* Modal View/Edit Report */}
        {showModal && selectedReport && (
          <div className={styles.modal}>
            <div className={styles.modalContent}>
              <div className={styles.modalHeader}>
                <h2 className={styles.modalTitle}>Chi tiết báo cáo</h2>
                <button 
                  className={styles.modalCloseButton} 
                  onClick={() => setShowModal(false)}
                >
                  ×
                </button>
              </div>
                <div className={styles.modalBody}>
                <div className={styles.formGroup}>
                  <strong>ID báo cáo:</strong> {selectedReport._id}
                </div>
                
                <div className={styles.formGroup}>
                  <strong>Loại báo cáo:</strong> {
                    selectedReport.type === 'movie' ? 'Phim' : 
                    selectedReport.type === 'user' ? 'Người dùng' : 
                    selectedReport.type === 'comment' ? 'Bình luận' : 'Khác'
                  }
                </div>
                  <div className={styles.reportSection}>
                  <h3 className={styles.sectionTitle}>Thông tin người báo cáo</h3>
                  <div className={styles.userDetailWrapper} style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    border: '1px solid #eaeaea', 
                    padding: '12px', 
                    borderRadius: '8px',
                    marginBottom: '12px',
                    background: '#f9f9f9'
                  }}>
                    <div className={styles.userDetailAvatar} style={{
                      width: '42px',
                      height: '42px',
                      background: '#e0e0e0',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginRight: '12px'
                    }}>
                      <FaUser size={20} color="#666" />
                    </div>
                    <div className={styles.userDetailInfo}>                      <div className={styles.userDetailName} style={{
                        fontWeight: 'bold',
                        fontSize: '16px',
                        marginBottom: '4px',
                        color: '#333'
                      }}>
                        {selectedReport.userId?.fullname || selectedReport.userId?.name || 
                          (selectedReport.userId?.email ? selectedReport.userId.email.split('@')[0] : 'Không xác định')}
                      </div>
                      <div className={styles.userDetailEmail} style={{
                        display: 'flex',
                        alignItems: 'center',
                        color: '#666',
                        fontSize: '14px'
                      }}>
                        <FaEnvelope size={12} style={{ marginRight: '6px' }} />
                        {selectedReport.userId?.email || 'N/A'}
                      </div>
                    </div>
                  </div>
                  <div className={styles.formGroup}>
                    <strong>ID người dùng:</strong> {selectedReport.userId?._id || 'N/A'}
                  </div>
                </div>
                  <div className={styles.reportSection}>
                  <h3 className={styles.sectionTitle}>Nội dung bị báo cáo</h3>
                  {selectedReport.type === 'movie' && selectedReport.movieInfo && (                    <div className={styles.movieDetailInfo}>
                      <div className={styles.movieInfoHeader}>
                        <div className={styles.movieInfoHeaderText}>
                          <div className={styles.movieTitle} style={{ 
                            fontWeight: 'bold', 
                            fontSize: '16px', 
                            color: '#0056b3' 
                          }}>
                            {selectedReport.movieInfo.name || 'Không có tên'}
                          </div>
                          {selectedReport.movieInfo.episode && (
                            <span className={styles.episodeBadge} style={{
                              background: '#e9f3ff', 
                              color: '#0056b3', 
                              padding: '3px 8px', 
                              borderRadius: '4px', 
                              fontSize: '13px',
                              fontWeight: 'bold',
                              display: 'inline-block',
                              marginTop: '5px'
                            }}>
                              <FaPlayCircle style={{ marginRight: '4px' }} /> 
                              Tập {selectedReport.movieInfo.episode}
                            </span>
                          )}
                        </div>
                        {selectedReport.movieInfo.slug && (
                          <Link href={`/admin/movies/edit/${selectedReport.movieInfo.id}`} passHref>
                            <button className={styles.viewMovieButton}>
                              <FaFilm className={styles.buttonIcon} /> Xem phim trong quản trị
                            </button>
                          </Link>
                        )}
                      </div>
                      
                      <div className={styles.movieDetailsList}>
                        <div className={styles.movieDetailItem}>
                          <span className={styles.movieDetailLabel}>ID phim:</span>
                          <span className={styles.movieDetailValue}>{selectedReport.movieInfo.id || 'N/A'}</span>
                        </div>
                        <div className={styles.movieDetailItem}>
                          <span className={styles.movieDetailLabel}>Slug:</span>
                          <span className={styles.movieDetailValue}>{selectedReport.movieInfo.slug || 'N/A'}</span>
                        </div>                        <div className={styles.movieDetailItem}>
                            <span className={styles.movieDetailLabel}>Thumbnail:</span>
                            <span className={styles.movieDetailValue}>
                              <img 
                                src={selectedReport.movieInfo.thumb || '/placeholder.jpg'} 
                                alt={selectedReport.movieInfo.name || 'Movie thumbnail'} 
                                className={styles.movieThumbnail}
                                style={{ maxWidth: '80px', height: '60px', objectFit: 'cover', borderRadius: '4px' }}
                                onError={(e) => { 
                                  (e.target as HTMLImageElement).src = "/placeholder.jpg"; 
                                }}
                              />
                            </span>
                          </div>
                        
                      </div>
                      
                      <div className={styles.movieActions}>
                        <button className={`${styles.movieActionButton} ${styles.previewButton}`}>
                          Xem trang phim
                        </button>
                        <a 
                          href={`mailto:?subject=Báo cáo lỗi: ${selectedReport.movieInfo.name}&body=Phim: ${selectedReport.movieInfo.name}%0ATập: ${selectedReport.movieInfo.episode}%0ALý do: ${selectedReport.reason}%0AMô tả: ${selectedReport.description}%0A%0AID báo cáo: ${selectedReport._id}`} 
                          className={`${styles.movieActionButton} ${styles.emailButton}`}
                        >
                          Báo lỗi cho bộ phận kỹ thuật
                        </a>
                      </div>
                    </div>
                  )}
                  
                  {selectedReport.contentId && selectedReport.type === 'user' && (
                    <div className={styles.userContentInfo}>
                      <div className={styles.userContentHeader}>
                        <div className={styles.userName}>{selectedReport.contentId.name || 'Không xác định'}</div>
                        <Link href={`/admin/users/edit/${selectedReport.contentId._id}`} passHref>
                          <button className={styles.viewUserButton}>
                            <FaUser className={styles.buttonIcon} /> Xem profile
                          </button>
                        </Link>
                      </div>
                      <div className={styles.userDetailItem}>
                        <span className={styles.userDetailLabel}>ID người dùng:</span>
                        <span className={styles.userDetailValue}>{selectedReport.contentId._id}</span>
                      </div>
                    </div>
                  )}
                  
                  {selectedReport.contentId && selectedReport.type === 'comment' && (
                    <div className={styles.commentContentInfo}>
                      <div className={styles.commentText}>
                        "{selectedReport.contentId.text || 'Không có nội dung'}"
                      </div>
                      <div className={styles.commentDetailItem}>
                        <span className={styles.commentDetailLabel}>ID bình luận:</span>
                        <span className={styles.commentDetailValue}>{selectedReport.contentId._id}</span>
                      </div>
                    </div>
                  )}
                  
                  {!selectedReport.contentId && selectedReport.type !== 'movie' && (
                    <div className={styles.formGroup}>
                      <em>Không có thông tin chi tiết về nội dung bị báo cáo</em>
                    </div>
                  )}
                </div>
                
                <div className={styles.reportSection}>
                  <h3 className={styles.sectionTitle}>Chi tiết báo cáo</h3>
                  <div className={styles.formGroup}>
                    <strong>Lý do báo cáo:</strong> {selectedReport.reason}
                  </div>
                  
                  <div className={styles.formGroup}>
                    <strong>Mô tả chi tiết:</strong>
                    <p className={styles.descriptionText}>{selectedReport.description}</p>
                  </div>
                  
                  <div className={styles.formGroup}>
                    <strong>Thời gian tạo:</strong> {new Date(selectedReport.createdAt).toLocaleString('vi-VN')}
                  </div>
                  
                  <div className={styles.formGroup}>
                    <strong>Cập nhật lần cuối:</strong> {new Date(selectedReport.updatedAt).toLocaleString('vi-VN')}
                  </div>
                </div>
                
                <div className={styles.formGroup}>
                  <label htmlFor="reportStatus" className={styles.formLabel}>Trạng thái:</label>
                  <select 
                    id="reportStatus"
                    className={styles.selectFilter}
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                  >
                    <option value="pending">Đang chờ</option>
                    <option value="in-progress">Đang xử lý</option>
                    <option value="resolved">Đã giải quyết</option>
                    <option value="rejected">Đã từ chối</option>
                  </select>
                </div>
                
                <div className={styles.formGroup}>
                  <label htmlFor="adminNotes" className={styles.formLabel}>Ghi chú của Admin:</label>
                  <textarea
                    id="adminNotes"
                    className={styles.textArea}
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    placeholder="Nhập ghi chú của admin về báo cáo này..."
                  />
                </div>
              </div>
              
              <div className={styles.modalFooter}>
                <button 
                  className={styles.resetButton}
                  onClick={() => setShowModal(false)}
                >
                  Hủy
                </button>
                <button 
                  className={styles.filterButton}
                  onClick={handleUpdateReport}
                >
                  Cập nhật
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Bulk Action Confirmation Modal */}
        {showBulkActionModal && (
          <div className={styles.modal}>
            <div className={styles.modalContent} style={{ maxWidth: "500px" }}>
              <div className={styles.modalHeader}>
                <h2 className={styles.modalTitle}>Xác nhận hành động hàng loạt</h2>
                <button 
                  className={styles.modalCloseButton} 
                  onClick={() => {
                    setShowBulkActionModal(false);
                    setBulkActionType('');
                  }}
                >
                  ×
                </button>
              </div>
              <div className={styles.modalBody}>
                <div className={styles.bulkConfirmationMessage}>
                  <div className={styles.bulkConfirmIcon}>
                    {bulkActionType === 'resolved' ? <FaCheck size={24} /> : 
                     bulkActionType === 'in-progress' ? <FaClock size={24} /> : 
                     <FaTimes size={24} />}
                  </div>
                  <p>Bạn đang chuẩn bị cập nhật trạng thái của <strong>{selectedReportIds.length}</strong> báo cáo thành:</p>
                  <div className={styles.bulkStatusBadge}>
                    {bulkActionType === 'resolved' ? 
                      <span className={`${styles.statusBadge} ${styles.resolved}`}><FaCheck /> Đã giải quyết</span> : 
                     bulkActionType === 'in-progress' ? 
                      <span className={`${styles.statusBadge} ${styles.inProgress}`}><FaClock /> Đang xử lý</span> : 
                      <span className={`${styles.statusBadge} ${styles.rejected}`}><FaTimes /> Từ chối</span>}
                  </div>
                  <p className={styles.bulkConfirmWarning}>
                    <FaExclamationTriangle /> Hành động này không thể hoàn tác. Bạn có chắc chắn muốn tiếp tục?
                  </p>
                </div>
              </div>
              <div className={styles.modalFooter}>
                <button 
                  className={styles.resetButton}
                  onClick={() => {
                    setShowBulkActionModal(false);
                    setBulkActionType('');
                  }}
                >
                  Hủy
                </button>
                <button 
                  className={`${styles.filterButton} ${
                    bulkActionType === 'resolved' ? styles.resolveButtonConfirm : 
                    bulkActionType === 'in-progress' ? styles.processButtonConfirm : 
                    styles.rejectButtonConfirm
                  }`}
                  onClick={handleBulkAction}
                >
                  Xác nhận
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

// Thêm getLayout để sử dụng AdminLayout với bảo vệ admin
ReportsPage.getLayout = (page: React.ReactElement) => {
  return (
    <AdminRoute>
      <AdminLayout>{page}</AdminLayout>
    </AdminRoute>
  );
};

export default ReportsPage;