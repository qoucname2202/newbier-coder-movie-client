/**
 * @file pages/admin/subscriptions/pending.tsx
 * @description Admin console for approving/rejecting pending Premium subscription requests.
 */
import React, { useState, useEffect, ChangeEvent} from 'react';
import { useRouter } from 'next/router';
import { toast } from 'react-toastify';
import {
  FaCheck,
  FaTimes,
  FaHourglassHalf,
  FaUser,
  FaCalendarAlt,
  FaInfoCircle
} from 'react-icons/fa';
import subscriptionService from '@/API/services/subscriptionService';
import styles from '@/styles/Admin.module.css';

interface SubscriptionUser {
  fullname?: string;
  email?: string;
  [key: string]: unknown;
}

interface SubscriptionPackage {
  name: string;
  durationDays: number;
  [key: string]: unknown;
}

interface PaymentInfo {
  amount: number;
  method: string;
  [key: string]: unknown;
}

interface PendingSubscription {
  _id: string;
  userId: SubscriptionUser;
  packageId: SubscriptionPackage;
  paymentId: PaymentInfo;
  createdAt: string;
  [key: string]: unknown;
}

interface PendingResponse {
  pendingSubscriptions?: PendingSubscription[];
  pagination?: { page: number; pages: number; total: number };
}

interface ServiceResult {
  success: boolean;
  message?: string;
}

const formatVnd = (n: number): string =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n);

const formatDate = (d: string): string => new Date(d).toLocaleDateString('vi-VN');
const formatTime = (d: string): string => new Date(d).toLocaleTimeString('vi-VN');

const formatPaymentMethod = (m: string): string => {
  switch (m) {
    case 'bank_transfer': return 'Chuyển khoản';
    case 'credit_card': return 'Thẻ tín dụng';
    case 'momo': return 'MoMo';
    case 'zalopay': return 'ZaloPay';
    default: return m;
  }
};

const PendingSubscriptionsPage: React.FC = () => {
  const [pendingSubscriptions, setPendingSubscriptions] = useState<PendingSubscription[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [pagination, setPagination] = useState<{ page: number; pages: number; total: number }>({
    page: 1,
    pages: 1,
    total: 0
  });
  const [selectedSubscription, setSelectedSubscription] = useState<PendingSubscription | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);
  const [modalAction, setModalAction] = useState<'approve' | 'reject' | ''>('');
  const [rejectionReason, setRejectionReason] = useState<string>('');
  const [processingAction, setProcessingAction] = useState<boolean>(false);

  const router = useRouter();

  const fetchPendingSubscriptions = async (page: number = 1): Promise<void> => {
    try {
      setLoading(true);
      const svc = subscriptionService as unknown as {
        getAdminPendingSubscriptions: (p?: number) => Promise<PendingResponse | null>;
      };
      const response = (await svc.getAdminPendingSubscriptions(page)) as PendingResponse | null;
      if (response) {
        setPendingSubscriptions(response.pendingSubscriptions || []);
        setPagination(response.pagination || { page: 1, pages: 1, total: 0 });
      }
    } catch (err) {

      toast.error('Không thể tải danh sách đăng ký chờ duyệt. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingSubscriptions();
  }, []);

  const handleApprove = (subscription: PendingSubscription): void => {
    setSelectedSubscription(subscription);
    setModalAction('approve');
    setShowConfirmModal(true);
  };

  const handleReject = (subscription: PendingSubscription): void => {
    setSelectedSubscription(subscription);
    setModalAction('reject');
    setShowConfirmModal(true);
  };

  const handleConfirmAction = async (): Promise<void> => {
    if (!selectedSubscription || !modalAction) return;
    try {
      setProcessingAction(true);
      if (modalAction === 'approve') {
        const svc = subscriptionService as unknown as {
          approveSubscription: (id: string) => Promise<ServiceResult>;
        };
        const response = (await svc.approveSubscription(selectedSubscription._id)) as ServiceResult;
        if (response.success) {
          toast.success('Phê duyệt đăng ký thành công!');
          setPendingSubscriptions((prev) => prev.filter((s) => s._id !== selectedSubscription._id));
        } else {
          toast.error(response.message || 'Phê duyệt không thành công. Vui lòng thử lại!');
        }
      } else if (modalAction === 'reject') {
        const svc = subscriptionService as unknown as {
          rejectSubscription: (id: string, payload: { reason: string }) => Promise<ServiceResult>;
        };
        const response = (await svc.rejectSubscription(selectedSubscription._id, {
          reason: rejectionReason
        })) as ServiceResult;
        if (response.success) {
          toast.success('Từ chối đăng ký thành công!');
          setPendingSubscriptions((prev) => prev.filter((s) => s._id !== selectedSubscription._id));
        } else {
          toast.error(response.message || 'Từ chối không thành công. Vui lòng thử lại!');
        }
      }
      setShowConfirmModal(false);
      setSelectedSubscription(null);
      setRejectionReason('');
    } catch (err) {

      toast.error(
        `Không thể ${modalAction === 'approve' ? 'phê duyệt' : 'từ chối'} đăng ký. Vui lòng thử lại sau.`
      );
    } finally {
      setProcessingAction(false);
    }
  };

  const handlePageChange = async (page: number): Promise<void> => {
    if (page < 1 || page > pagination.pages || page === pagination.page) return;
    try {
      setLoading(true);
      const response = await (subscriptionService as unknown as {
        getAdminPendingSubscriptions: (p?: number) => Promise<PendingResponse | null>;
      }).getAdminPendingSubscriptions(page);
      if (response) {
        setPendingSubscriptions(response.pendingSubscriptions || []);
        setPagination(response.pagination || { page: 1, pages: 1, total: 0 });
      }
    } catch (err) {

      toast.error('Không thể tải danh sách đăng ký chờ duyệt. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  const handleReasonChange = (e: ChangeEvent<HTMLTextAreaElement>): void => setRejectionReason(e.target.value);
  const handleCloseModal = (): void => {
    setShowConfirmModal(false);
    setSelectedSubscription(null);
    setRejectionReason('');
  };

  const renderPendingSubscriptions = (): React.ReactNode => {
    if (loading) {
      return (
        <div className={styles.loading}>
          <div className={styles.spinner} />
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
            {pendingSubscriptions.map((sub) => (
              <tr key={sub._id}>
                <td>{sub._id.substring(0, 8)}...</td>
                <td>
                  <div className={styles.userInfo}>
                    <FaUser className={styles.userIcon} />
                    <div>
                      <div className={styles.userName}>{sub.userId.fullname || 'N/A'}</div>
                      <div className={styles.userEmail}>{sub.userId.email}</div>
                    </div>
                  </div>
                </td>
                <td>
                  <div className={styles.packageInfo}>
                    <div className={styles.packageName}>{sub.packageId.name}</div>
                    <div className={styles.packageDuration}>{sub.packageId.durationDays} ngày</div>
                  </div>
                </td>
                <td>
                  <div className={styles.paymentInfo}>
                    <div className={styles.paymentAmount}>{formatVnd(sub.paymentId.amount)}</div>
                    <div className={styles.paymentMethod}>{formatPaymentMethod(sub.paymentId.method)}</div>
                  </div>
                </td>
                <td>
                  <div className={styles.dateInfo}>
                    <FaCalendarAlt className={styles.calendarIcon} />
                    {formatDate(sub.createdAt)}
                    <div className={styles.timeInfo}>{formatTime(sub.createdAt)}</div>
                  </div>
                </td>
                <td>
                  <div className={styles.actions}>
                    <button
                      type="button"
                      className={styles.approveButton}
                      onClick={() => handleApprove(sub)}
                    >
                      <FaCheck /> Duyệt
                    </button>
                    <button
                      type="button"
                      className={styles.rejectButton}
                      onClick={() => handleReject(sub)}
                    >
                      <FaTimes /> Từ chối
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {pagination.pages > 1 && (
          <div className={styles.pagination}>
            <button
              type="button"
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
              type="button"
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

  const renderConfirmModal = (): React.ReactNode => {
    if (!showConfirmModal || !selectedSubscription) return null;
    const isApprove = modalAction === 'approve';

    return (
      <div className={styles.modalOverlay}>
        <div className={styles.modal}>
          <div className={styles.modalHeader}>
            <h3>{isApprove ? 'Xác nhận phê duyệt' : 'Xác nhận từ chối'}</h3>
            <button
              type="button"
              className={styles.closeButton}
              onClick={handleCloseModal}
              disabled={processingAction}
            >
              <FaTimes />
            </button>
          </div>

          <div className={styles.modalBody}>
            <div className={styles.confirmContent}>
              <p>
                Bạn có chắc chắn muốn {isApprove ? 'phê duyệt' : 'từ chối'} đăng ký Premium cho người dùng sau?
              </p>

              <div className={styles.subscriptionDetail}>
                <div className={styles.detailItem}>
                  <strong>Người dùng:</strong> {selectedSubscription.userId.fullname} ({selectedSubscription.userId.email})
                </div>
                <div className={styles.detailItem}>
                  <strong>Gói Premium:</strong> {selectedSubscription.packageId.name} ({selectedSubscription.packageId.durationDays} ngày)
                </div>
                <div className={styles.detailItem}>
                  <strong>Số tiền:</strong> {formatVnd(selectedSubscription.paymentId.amount)}
                </div>
                <div className={styles.detailItem}>
                  <strong>Phương thức thanh toán:</strong> {formatPaymentMethod(selectedSubscription.paymentId.method)}
                </div>
              </div>

              {isApprove ? (
                <p>Sau khi phê duyệt, tài khoản của người dùng sẽ được nâng cấp lên Premium.</p>
              ) : (
                <div className={styles.formGroup}>
                  <label htmlFor="rejectionReason">Lý do từ chối:</label>
                  <textarea
                    id="rejectionReason"
                    className={styles.textarea}
                    value={rejectionReason}
                    onChange={handleReasonChange}
                    placeholder="Nhập lý do từ chối đăng ký..."
                    disabled={processingAction}
                  />
                </div>
              )}
            </div>
          </div>

          <div className={styles.modalFooter}>
            <button
              type="button"
              className={styles.cancelButton}
              onClick={handleCloseModal}
              disabled={processingAction}
            >
              Hủy
            </button>
            <button
              type="button"
              className={isApprove ? styles.approveButton : styles.rejectButton}
              onClick={handleConfirmAction}
              disabled={(!isApprove && !rejectionReason.trim()) || processingAction}
            >
              {processingAction ? (
                <>
                  <div className={styles.spinnerSmall} />
                  Đang xử lý...
                </>
              ) : isApprove ? 'Xác nhận phê duyệt' : 'Xác nhận từ chối'}
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
