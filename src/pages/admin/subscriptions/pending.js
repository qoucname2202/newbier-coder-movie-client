import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { toast } from 'react-toastify';
import { FaCheck, FaTimes, FaHourglassHalf, FaUser, FaCalendarAlt, FaMoneyBillWave, FaInfoCircle } from 'react-icons/fa';
import subscriptionService from '../../../API/services/subscriptionService';
import styles from '../../../styles/Admin.module.css';

const PendingSubscriptionsPage = () => {
  const [pendingSubscriptions, setPendingSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [selectedSubscription, setSelectedSubscription] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [modalAction, setModalAction] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [processingAction, setProcessingAction] = useState(false);
  
  const router = useRouter();
  
  // Lấy danh sách đăng ký đang chờ duyệt
  useEffect(() => {
    const fetchPendingSubscriptions = async () => {
      try {
        setLoading(true);
        const response = await subscriptionService.getAdminPendingSubscriptions();
        
        if (response) {
          setPendingSubscriptions(response.pendingSubscriptions || []);
          setPagination(response.pagination || { page: 1, pages: 1, total: 0 });
        }
      } catch (error) {
        console.error("Error fetching pending subscriptions:", error);
        toast.error("Không thể tải danh sách đăng ký chờ duyệt. Vui lòng thử lại sau.");
      } finally {
        setLoading(false);
      }
    };
    
    fetchPendingSubscriptions();
  }, []);
  
  // Xử lý khi admin muốn phê duyệt đăng ký
  const handleApprove = (subscription) => {
    setSelectedSubscription(subscription);
    setModalAction('approve');
    setShowConfirmModal(true);
  };
  
  // Xử lý khi admin muốn từ chối đăng ký
  const handleReject = (subscription) => {
    setSelectedSubscription(subscription);
    setModalAction('reject');
    setShowConfirmModal(true);
  };
  
  // Xử lý xác nhận hành động (phê duyệt hoặc từ chối)
  const handleConfirmAction = async () => {
    if (!selectedSubscription) return;
    
    try {
      setProcessingAction(true);
      
      if (modalAction === 'approve') {
        const response = await subscriptionService.approveSubscription(selectedSubscription._id);
        
        if (response.success) {
          toast.success("Phê duyệt đăng ký thành công!");
          // Xóa subscription đã duyệt khỏi danh sách
          setPendingSubscriptions(prevSubscriptions => 
            prevSubscriptions.filter(sub => sub._id !== selectedSubscription._id)
          );
        } else {
          toast.error(response.message || "Phê duyệt không thành công. Vui lòng thử lại!");
        }
      } else if (modalAction === 'reject') {
        const response = await subscriptionService.rejectSubscription(
          selectedSubscription._id,
          { reason: rejectionReason }
        );
        
        if (response.success) {
          toast.success("Từ chối đăng ký thành công!");
          // Xóa subscription đã từ chối khỏi danh sách
          setPendingSubscriptions(prevSubscriptions => 
            prevSubscriptions.filter(sub => sub._id !== selectedSubscription._id)
          );
        } else {
          toast.error(response.message || "Từ chối không thành công. Vui lòng thử lại!");
        }
      }
      
      // Đóng modal
      setShowConfirmModal(false);
      setSelectedSubscription(null);
      setRejectionReason('');
    } catch (error) {
      console.error(`Error ${modalAction === 'approve' ? 'approving' : 'rejecting'} subscription:`, error);
      toast.error(`Không thể ${modalAction === 'approve' ? 'phê duyệt' : 'từ chối'} đăng ký. Vui lòng thử lại sau.`);
    } finally {
      setProcessingAction(false);
    }
  };
  
  // Xử lý chuyển trang
  const handlePageChange = async (page) => {
    if (page < 1 || page > pagination.pages || page === pagination.page) return;
    
    try {
      setLoading(true);
      const response = await subscriptionService.getAdminPendingSubscriptions(page);
      
      if (response) {
        setPendingSubscriptions(response.pendingSubscriptions || []);
        setPagination(response.pagination || { page: 1, pages: 1, total: 0 });
      }
    } catch (error) {
      console.error("Error fetching pending subscriptions:", error);
      toast.error("Không thể tải danh sách đăng ký chờ duyệt. Vui lòng thử lại sau.");
    } finally {
      setLoading(false);
    }
  };
  
  // Hiển thị danh sách đăng ký chờ duyệt
  const renderPendingSubscriptions = () => {
    if (loading) {
      return (
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>Đang tải dữ liệu...</p>
        </div>
      );
    }
    
    if (pendingSubscriptions.length === 0) {
      return (
        <div className={styles.emptyState}>
          <FaInfoCircle size={32} />
          <h3>Không có đăng ký đang chờ duyệt</h3>
          <p>Hiện tại không có đăng ký Premium nào đang chờ xét duyệt.</p>
        </div>
      );
    }
    
    return (
      <div className={styles.subscriptionList}>
        <table className={styles.dataTable}>
          <thead>
            <tr>
              <th>ID</th>
              <th>Người dùng</th>
              <th>Gói Premium</th>
              <th>Thanh toán</th>
              <th>Ngày đăng ký</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {pendingSubscriptions.map(subscription => (
              <tr key={subscription._id}>
                <td>{subscription._id.substring(0, 8)}...</td>
                <td>
                  <div className={styles.userInfo}>
                    <FaUser className={styles.userIcon} />
                    <div>
                      <div className={styles.userName}>
                        {subscription.userId.fullname || 'N/A'}
                      </div>
                      <div className={styles.userEmail}>
                        {subscription.userId.email}
                      </div>
                    </div>
                  </div>
                </td>
                <td>
                  <div className={styles.packageInfo}>
                    <div className={styles.packageName}>
                      {subscription.packageId.name}
                    </div>
                    <div className={styles.packageDuration}>
                      {subscription.packageId.durationDays} ngày
                    </div>
                  </div>
                </td>
                <td>
                  <div className={styles.paymentInfo}>
                    <div className={styles.paymentAmount}>
                      {new Intl.NumberFormat('vi-VN', {
                        style: 'currency',
                        currency: 'VND'
                      }).format(subscription.paymentId.amount)}
                    </div>
                    <div className={styles.paymentMethod}>
                      {subscription.paymentId.method === 'bank_transfer' 
                        ? 'Chuyển khoản' 
                        : subscription.paymentId.method === 'credit_card'
                        ? 'Thẻ tín dụng'
                        : subscription.paymentId.method === 'momo'
                        ? 'MoMo'
                        : subscription.paymentId.method === 'zalopay'
                        ? 'ZaloPay'
                        : subscription.paymentId.method}
                    </div>
                  </div>
                </td>
                <td>
                  <div className={styles.dateInfo}>
                    <FaCalendarAlt className={styles.calendarIcon} />
                    {new Date(subscription.createdAt).toLocaleDateString('vi-VN')}
                    <div className={styles.timeInfo}>
                      {new Date(subscription.createdAt).toLocaleTimeString('vi-VN')}
                    </div>
                  </div>
                </td>
                <td>
                  <div className={styles.actions}>
                    <button 
                      className={styles.approveButton}
                      onClick={() => handleApprove(subscription)}
                    >
                      <FaCheck /> Duyệt
                    </button>
                    <button 
                      className={styles.rejectButton}
                      onClick={() => handleReject(subscription)}
                    >
                      <FaTimes /> Từ chối
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {/* Phân trang */}
        {pagination.pages > 1 && (
          <div className={styles.pagination}>
            <button 
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page === 1 || loading}
              className={styles.pageButton}
            >
              &laquo; Trước
            </button>
            
            <span className={styles.pageInfo}>
              Trang {pagination.page} / {pagination.pages}
            </span>
            
            <button 
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page === pagination.pages || loading}
              className={styles.pageButton}
            >
              Sau &raquo;
            </button>
          </div>
        )}
      </div>
    );
  };
  
  // Modal xác nhận phê duyệt hoặc từ chối
  const renderConfirmModal = () => {
    if (!showConfirmModal || !selectedSubscription) return null;
    
    return (
      <div className={styles.modalOverlay}>
        <div className={styles.modal}>
          <div className={styles.modalHeader}>
            <h3>
              {modalAction === 'approve' ? 'Xác nhận phê duyệt' : 'Xác nhận từ chối'}
            </h3>
            <button 
              className={styles.closeButton}
              onClick={() => {
                setShowConfirmModal(false);
                setSelectedSubscription(null);
                setRejectionReason('');
              }}
              disabled={processingAction}
            >
              <FaTimes />
            </button>
          </div>
          
          <div className={styles.modalBody}>
            {modalAction === 'approve' ? (
              <div className={styles.confirmContent}>
                <p>Bạn có chắc chắn muốn phê duyệt đăng ký Premium cho người dùng sau?</p>
                
                <div className={styles.subscriptionDetail}>
                  <div className={styles.detailItem}>
                    <strong>Người dùng:</strong> {selectedSubscription.userId.fullname} ({selectedSubscription.userId.email})
                  </div>
                  <div className={styles.detailItem}>
                    <strong>Gói Premium:</strong> {selectedSubscription.packageId.name} ({selectedSubscription.packageId.durationDays} ngày)
                  </div>
                  <div className={styles.detailItem}>
                    <strong>Số tiền:</strong> {new Intl.NumberFormat('vi-VN', {
                      style: 'currency',
                      currency: 'VND'
                    }).format(selectedSubscription.paymentId.amount)}
                  </div>
                  <div className={styles.detailItem}>
                    <strong>Phương thức thanh toán:</strong> {
                      selectedSubscription.paymentId.method === 'bank_transfer' 
                        ? 'Chuyển khoản' 
                        : selectedSubscription.paymentId.method === 'credit_card'
                        ? 'Thẻ tín dụng'
                        : selectedSubscription.paymentId.method === 'momo'
                        ? 'MoMo'
                        : selectedSubscription.paymentId.method === 'zalopay'
                        ? 'ZaloPay'
                        : selectedSubscription.paymentId.method
                    }
                  </div>
                </div>
                
                <p>Sau khi phê duyệt, tài khoản của người dùng sẽ được nâng cấp lên Premium.</p>
              </div>
            ) : (
              <div className={styles.confirmContent}>
                <p>Bạn có chắc chắn muốn từ chối đăng ký Premium cho người dùng sau?</p>
                
                <div className={styles.subscriptionDetail}>
                  <div className={styles.detailItem}>
                    <strong>Người dùng:</strong> {selectedSubscription.userId.fullname} ({selectedSubscription.userId.email})
                  </div>
                  <div className={styles.detailItem}>
                    <strong>Gói Premium:</strong> {selectedSubscription.packageId.name} ({selectedSubscription.packageId.durationDays} ngày)
                  </div>
                  <div className={styles.detailItem}>
                    <strong>Số tiền:</strong> {new Intl.NumberFormat('vi-VN', {
                      style: 'currency',
                      currency: 'VND'
                    }).format(selectedSubscription.paymentId.amount)}
                  </div>
                </div>
                
                <div className={styles.formGroup}>
                  <label htmlFor="rejectionReason">Lý do từ chối:</label>
                  <textarea 
                    id="rejectionReason"
                    className={styles.textarea}
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Nhập lý do từ chối đăng ký..."
                    disabled={processingAction}
                  />
                </div>
              </div>
            )}
          </div>
          
          <div className={styles.modalFooter}>
            <button 
              className={styles.cancelButton}
              onClick={() => {
                setShowConfirmModal(false);
                setSelectedSubscription(null);
                setRejectionReason('');
              }}
              disabled={processingAction}
            >
              Hủy
            </button>
            <button 
              className={modalAction === 'approve' ? styles.approveButton : styles.rejectButton}
              onClick={handleConfirmAction}
              disabled={modalAction === 'reject' && !rejectionReason.trim() || processingAction}
            >
              {processingAction ? (
                <>
                  <div className={styles.spinnerSmall}></div>
                  Đang xử lý...
                </>
              ) : (
                modalAction === 'approve' ? 'Xác nhận phê duyệt' : 'Xác nhận từ chối'
              )}
            </button>
          </div>
        </div>
      </div>
    );
  };
  
  return (
    <div className={styles.adminContainer}>
      <div className={styles.adminHeader}>
        <h1>Quản lý đăng ký Premium chờ duyệt</h1>
        <p>Xét duyệt các yêu cầu đăng ký gói Premium từ người dùng</p>
      </div>
      
      <div className={styles.contentContainer}>
        <div className={styles.summary}>
          <div className={styles.summaryItem}>
            <div className={styles.summaryTitle}>
              <FaHourglassHalf className={styles.summaryIcon} />
              Đang chờ duyệt
            </div>
            <div className={styles.summaryValue}>
              {loading ? '...' : pendingSubscriptions.length}
            </div>
          </div>
        </div>
        
        {renderPendingSubscriptions()}
      </div>
      
      {renderConfirmModal()}
    </div>
  );
};

export default PendingSubscriptionsPage;