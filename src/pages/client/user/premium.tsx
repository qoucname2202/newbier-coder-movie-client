/**
 * @file pages/user/premium.tsx
 * @description Premium subscription page with package selection, payment flow, and FAQ.
 */
import React, { useState, useEffect} from 'react';
import { useRouter } from 'next/router';
import { toast } from 'react-toastify';
import {
  FaCrown, FaCheckCircle, FaTimes, FaHourglassHalf,
  FaInfoCircle, FaQrcode, FaCheckDouble
} from 'react-icons/fa';
import subscriptionService from '@/API/services/subscriptionService';
import { useAuth } from '@/context/AuthContext';
import styles from '@/styles/Premium.module.css';

interface PackageFeature {
  _id?: string;
  id?: string;
  name?: string;
  description?: string;
  price?: number;
  durationDays?: number;
  features?: string[];
  isActive?: boolean;
  discount?: number;
  isLocalOnly?: boolean;
  isHighlightPackage?: boolean;
}

interface SubscriptionData {
  hasActiveSubscription?: boolean;
  hasPendingSubscription?: boolean;
  daysLeft?: number;
  subscription?: {
    packageId?: unknown;
    startDate?: string;
    endDate?: string;
    durationDays?: number;
  };
}

const DEFAULT_PACKAGES: PackageFeature[] = [
  {
    _id: 'basic-package',
    name: 'Cơ bản',
    description: 'Không hiển thị quảng cáo ở màn hình chính',
    price: 10000,
    durationDays: 30,
    features: [
      'Không hiển thị quảng cáo ở màn hình chính',
      'Trải nghiệm giao diện tốt hơn',
      'Hỗ trợ trên mọi thiết bị'
    ],
    isActive: true,
    discount: 0,
    isLocalOnly: true,
    isHighlightPackage: false
  },
  {
    _id: 'premium-package',
    name: 'Premium',
    description: 'Trải nghiệm không quảng cáo hoàn toàn khi xem phim',
    price: 15000,
    durationDays: 30,
    features: [
      'Không hiển thị quảng cáo ở màn hình chính',
      'Không hiển thị video quảng cáo khi bấm vào nút play để xem phim',
      'Trải nghiệm xem phim tốt nhất',
      'Hỗ trợ trên mọi thiết bị'
    ],
    isActive: true,
    discount: 0,
    isLocalOnly: true,
    isHighlightPackage: true
  }
];

type PaymentMethod = 'bank_transfer' | 'momo' | 'zalopay' | 'credit_card';

function getPackageIdAsString(packageIdObj: unknown): string | null {
  if (packageIdObj === null || packageIdObj === undefined) return null;
  if (typeof packageIdObj === 'string') return packageIdObj;
  if (typeof packageIdObj === 'object') {
    const obj = packageIdObj as Record<string, unknown>;
    if (obj._id) return String(obj._id);
    if (obj.id) return String(obj.id);
  }
  return String(packageIdObj);
}

function isSuccessfulSubscription(response: unknown): boolean {
  if (!response) return false;
  const r = response as Record<string, unknown>;
  return !!(
    r.success ||
    r._formatted ||
    r._errorButSuccess ||
    r.subscription ||
    r.package ||
    r.payment
  );
}

export default function PremiumPage() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();

  const [packages, setPackages] = useState<PackageFeature[]>([]);
  const [currentSubscription, setCurrentSubscription] = useState<SubscriptionData | null>(null);
  const [pendingSubscription, setPendingSubscription] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedPackage, setSelectedPackage] = useState<PackageFeature | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState<boolean>(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('bank_transfer');
  const [processingPayment, setProcessingPayment] = useState<boolean>(false);
  const [showQrCode, setShowQrCode] = useState<boolean>(false);
  const [paymentConfirmed, setPaymentConfirmed] = useState<boolean>(false);
  const [showSuccessModal, setShowSuccessModal] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [expandedFaqs, setExpandedFaqs] = useState<Record<number, boolean>>({});

  const isCurrentSubscribedPackage = (pkg: PackageFeature, currentSub: SubscriptionData | null): boolean => {
    if (!pkg || !currentSub?.subscription?.packageId) return false;
    const currentPackageIdStr = getPackageIdAsString(currentSub.subscription.packageId);
    const packageIdStr = getPackageIdAsString(pkg._id || pkg.id);
    return !!(currentSub.hasActiveSubscription && currentPackageIdStr === packageIdStr);
  };

  const isPendingSubscribedPackage = (pkg: PackageFeature, pendingSub: SubscriptionData | null): boolean => {
    if (!pkg || !pendingSub?.subscription?.packageId) return false;
    const pendingPackageIdStr = getPackageIdAsString(pendingSub.subscription.packageId);
    const packageIdStr = getPackageIdAsString(pkg._id || pkg.id);
    return !!(pendingSub.hasPendingSubscription && pendingPackageIdStr === packageIdStr);
  };

  const refreshSubscriptionData = async (): Promise<void> => {
    if (!isAuthenticated) return;
    try {
      setLoading(true);
      const subscriptionData = (await subscriptionService.getCurrentSubscription()) as SubscriptionData;
      setCurrentSubscription(subscriptionData);
      const pendingData = (await subscriptionService.getPendingSubscription()) as SubscriptionData;
      if (pendingData?.hasPendingSubscription) {
        setPendingSubscription(pendingData);
      } else {
        setPendingSubscription(null);
      }
    } catch (err) {

    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchData = async (): Promise<void> => {
      try {
        setLoading(true);
        const packagesData = (await subscriptionService.getAllPackages()) as PackageFeature[];
        setPackages(packagesData);

        // The package chosen before the login is restored, so the user does
        // not have to pick it again after being redirected.
        try {
          const pendingPackageId = window.sessionStorage.getItem('selectedPackage');
          if (pendingPackageId) {
            window.sessionStorage.removeItem('selectedPackage');
            const match = packagesData.find(
              (pkg) => getPackageIdAsString(pkg._id || pkg.id) === pendingPackageId
            );
            if (match) setSelectedPackage(match);
          }
        } catch { /* sessionStorage can be disabled */ }

        if (isAuthenticated) {
          try {
            const subscriptionData = (await subscriptionService.getCurrentSubscription()) as SubscriptionData;
            setCurrentSubscription(subscriptionData);
            const pendingData = (await subscriptionService.getPendingSubscription()) as SubscriptionData;
            if (pendingData?.hasPendingSubscription) {
              setPendingSubscription(pendingData);
            }
          } catch (err) {

          }
        }
      } catch (err) {

        setPackages(DEFAULT_PACKAGES);
        toast.error('Không thể tải thông tin gói Premium từ server. Hiển thị dữ liệu mặc định.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) return;
    refreshSubscriptionData();
    const refreshInterval = setInterval(() => {
      if (isAuthenticated) refreshSubscriptionData();
    }, 10000);
    return () => clearInterval(refreshInterval);
  }, [isAuthenticated]);

  const handleSelectPackage = async (pkg: PackageFeature): Promise<void> => {
    if (!isAuthenticated) {
      // The chosen package is kept in the session storage: it is only
      // needed to restore the selection after the login redirect, so it
      // must not survive the tab.
      try {
        window.sessionStorage.setItem('selectedPackage', String(pkg._id));
      } catch { /* sessionStorage can be disabled */ }
      router.push('/auth/login?redirect=/user/premium');
      return;
    }
    try {
      if (currentSubscription?.hasActiveSubscription) {
        toast.info('Bạn đã có gói đăng ký đang hoạt động. Vui lòng hủy gói hiện tại trước khi đăng ký gói mới.');
        return;
      }
      const pendingData = (await subscriptionService.getPendingSubscription()) as SubscriptionData;
      if (pendingData?.hasPendingSubscription) {
        setPendingSubscription(pendingData);
        toast.info('Bạn đã có một yêu cầu đăng ký đang chờ duyệt. Vui lòng đợi quản trị viên xét duyệt.');
        return;
      }
      setSelectedPackage(pkg);
      setShowPaymentModal(true);
    } catch (err) {

      toast.error('Có lỗi xảy ra khi kiểm tra trạng thái đăng ký. Vui lòng thử lại.');
    }
  };

  const handleShowQrCode = (): void => setShowQrCode(true);

  const handleConfirmPayment = (): void => {
    setPaymentConfirmed(true);
    toast.success('Xác nhận chuyển khoản thành công! Vui lòng nhấn "Gửi xác nhận" để hoàn tất.', {
      autoClose: 3000,
    });
  };

  const handleSubscription = async (): Promise<void> => {
    if (!selectedPackage || !paymentConfirmed) {
      toast.error('Vui lòng chọn gói và xác nhận thanh toán trước!');
      return;
    }
    try {
      setProcessingPayment(true);
      toast.info('Đang xử lý đăng ký gói Premium...', { autoClose: false, toastId: 'processing-subscription' });
      const confirmationElement = document.getElementById('confirmation-status');
      if (confirmationElement) {
        confirmationElement.innerHTML = `<div style="display:flex;align-items:center;"><div class="${styles.spinnerSmall}" style="margin-right:8px;"></div> Đang gửi xác nhận...</div>`;
        (confirmationElement as HTMLElement).style.color = '#ffc107';
        confirmationElement.className = `${styles.confirmationStatus} ${styles.confirmationStatusPending}`;
      }

      const discount = selectedPackage.discount || 0;
      const amount = discount > 0 ? (selectedPackage.price || 0) * (1 - discount / 100) : (selectedPackage.price || 0);
      const paymentLabel = paymentMethod === 'bank_transfer' ? 'chuyển khoản ngân hàng' :
        paymentMethod === 'momo' ? 'ví MoMo' :
        paymentMethod === 'zalopay' ? 'ví ZaloPay' : 'thẻ tín dụng';

      const subscriptionData = {
        packageId: selectedPackage._id ?? '',
        paymentMethod,
        amount,
        notes: `Đăng ký gói ${selectedPackage.name} qua ${paymentLabel}`
      };

      const response = (await (subscriptionService as unknown as {
        subscribePackage: (data: { packageId: string; paymentMethod: string; amount: number; notes: string }) => Promise<Record<string, unknown>>;
      }).subscribePackage(subscriptionData)) as Record<string, unknown>;

      toast.dismiss('processing-subscription');
      const success = isSuccessfulSubscription(response);

      const confEl = document.getElementById('confirmation-status');
      if (confEl) {
        if (success) {
          confEl.innerHTML = `<div style="display:flex;align-items:center;"><svg style="margin-right:10px;color:#4CAF50;" width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z" fill="currentColor"/></svg> Gửi xác nhận thành công!</div>`;
          (confEl as HTMLElement).style.color = '#4CAF50';
          confEl.className = `${styles.confirmationStatus} ${styles.confirmationStatusSuccess}`;
        } else {
          confEl.innerHTML = `<div style="display:flex;align-items:center;"><svg style="margin-right:10px;color:#e74c3c;" width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z" fill="currentColor"/></svg> Gửi xác nhận thất bại. Vui lòng thử lại!</div>`;
          (confEl as HTMLElement).style.color = '#e74c3c';
          confEl.className = `${styles.confirmationStatus} ${styles.confirmationStatusError}`;
        }
      }

      if (success) {
        setTimeout(() => {
          setShowPaymentModal(false);
          setShowQrCode(false);
          setPaymentConfirmed(false);
          toast.success('Đăng ký đã được gửi thành công! Quản trị viên sẽ phê duyệt trong thời gian sớm nhất.', {
            autoClose: 8000,
            style: { backgroundColor: '#2c8a3c', color: '#fff' },
          });
          setSuccessMessage(`Đăng ký gói ${selectedPackage.name} đã được gửi thành công! Quản trị viên sẽ phê duyệt trong thời gian sớm nhất.`);
          setShowSuccessModal(true);
        }, 1500);

        setTimeout(async () => {
          await refreshSubscriptionData();
          const pendingData = (await subscriptionService.getPendingSubscription()) as SubscriptionData;
          if (pendingData?.hasPendingSubscription) {
            setPendingSubscription(pendingData);
            toast.info("Bạn có thể xem trạng thái đăng ký trong phần 'Yêu cầu đang chờ duyệt'", { autoClose: 5000 });
          }
        }, 1000);
      } else {
        const errorMsg = (response?.message as string) || 'Đăng ký gói không thành công. Vui lòng thử lại sau!';
        toast.error(errorMsg, { autoClose: 8000 });
      }
    } catch (err) {

      toast.dismiss('processing-subscription');
      toast.error('Có lỗi xảy ra: ' + ((err as Error).message || 'Vui lòng thử lại sau'), { autoClose: 8000 });
      const confEl = document.getElementById('confirmation-status');
      if (confEl) {
        confEl.innerHTML = `<div style="display:flex;align-items:center;"><svg style="margin-right:10px;color:#e74c3c;" width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z" fill="currentColor"/></svg> Gửi xác nhận thất bại. Vui lòng thử lại!</div>`;
        (confEl as HTMLElement).style.color = '#e74c3c';
        confEl.className = `${styles.confirmationStatus} ${styles.confirmationStatusError}`;
      }
    } finally {
      setProcessingPayment(false);
    }
  };

  const handleCancelSubscription = async (): Promise<void> => {
    if (!confirm('Bạn có chắc chắn muốn hủy gói Premium không? Bạn vẫn có thể sử dụng dịch vụ Premium đến khi hết hạn.')) return;
    try {
      setLoading(true);
      const response = (await subscriptionService.cancelSubscription()) as { success?: boolean; message?: string };
      if (response?.success) {
        toast.success('Hủy đăng ký thành công!');
        await refreshSubscriptionData();
      } else {
        toast.error(response?.message || 'Hủy đăng ký không thành công. Vui lòng thử lại!');
      }
    } catch (err) {

      const e = err as { response?: { data?: { message?: string } } };
      toast.error(e.response?.data?.message || 'Có lỗi xảy ra khi hủy đăng ký. Vui lòng thử lại sau!');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelPendingRequest = async (): Promise<void> => {
    if (!confirm('Bạn có chắc chắn muốn hủy yêu cầu đăng ký Premium đang chờ duyệt không?')) return;
    try {
      setLoading(true);
      const response = (await subscriptionService.cancelSubscription()) as { success?: boolean; message?: string };
      if (response?.success) {
        toast.success('Hủy yêu cầu đăng ký thành công!');
        await refreshSubscriptionData();
      } else {
        toast.error(response?.message || 'Hủy yêu cầu không thành công. Vui lòng thử lại!');
      }
    } catch (err) {

      const e = err as { response?: { data?: { message?: string } } };
      toast.error(e.response?.data?.message || 'Có lỗi xảy ra khi hủy yêu cầu đăng ký. Vui lòng thử lại sau!');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number): string =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);

  const renderCurrentSubscription = (): React.ReactNode => {
    if (!currentSubscription?.hasActiveSubscription) return null;
    const { subscription, daysLeft } = currentSubscription;
    const pkg = (subscription?.packageId as PackageFeature) || {};
    const originalPrice = pkg.price || 0;
    const discount = pkg.discount || 0;
    const discountedPrice = discount > 0 ? originalPrice * (1 - discount / 100) : originalPrice;
    const totalDays = pkg.durationDays || subscription?.durationDays || 30;
    const percentRemaining = Math.min(100, ((daysLeft || 0) / totalDays) * 100);

    return (
      <div className={styles.currentSubscription}>
        <div className={styles.currentSubscriptionInner}>
          <div className={styles.subscriptionHeader}>
            <FaCrown className={styles.crownIcon} />
            <h3>Gói Premium của bạn</h3>
            {discount > 0 && <span className={styles.discountBadge}>-{discount}%</span>}
          </div>
          <div className={styles.subscriptionDetails}>
            <div className={styles.subscriptionPlan}>
              <p className={styles.packageName}>{pkg.name}</p>
              <div className={styles.expiryInfo}>
                {(daysLeft ?? 0) > 0 ? (
                  <>
                    <div className={styles.daysLeftContainer}>
                      <span className={styles.daysLeft}>{daysLeft}</span>
                      <span className={styles.daysText}>ngày</span>
                    </div>
                    <div className={styles.progressContainer}>
                      <div className={styles.progressBar} style={{ width: `${percentRemaining}%` }} />
                    </div>
                  </>
                ) : (
                  <span className={styles.expiredStatus}>Đã hết hạn</span>
                )}
              </div>
            </div>
            <div className={styles.packagePriceInfo}>
              <div className={styles.priceDetails}>
                {discount > 0 ? (
                  <>
                    <span className={styles.originalPrice}>{formatCurrency(originalPrice)}</span>
                    <span className={styles.discountPrice}>{formatCurrency(discountedPrice)}</span>
                  </>
                ) : (
                  <span className={styles.normalPrice}>{formatCurrency(originalPrice)}</span>
                )}
                <span className={styles.duration}>/{totalDays} ngày</span>
              </div>
            </div>
            <div className={styles.subscriptionDates}>
              {subscription?.startDate && (
                <div className={styles.dateInfo}>
                  <span className={styles.dateLabel}>Ngày bắt đầu:</span>
                  <span className={styles.dateValue}>{new Date(subscription.startDate).toLocaleDateString('vi-VN')}</span>
                </div>
              )}
              {subscription?.endDate && (
                <div className={styles.dateInfo}>
                  <span className={styles.dateLabel}>Ngày kết thúc:</span>
                  <span className={styles.dateValue}>{new Date(subscription.endDate).toLocaleDateString('vi-VN')}</span>
                </div>
              )}
            </div>
            {pkg.description && (
              <div className={styles.packageDescription}><p>{pkg.description}</p></div>
            )}
            {pkg.features && pkg.features.length > 0 && (
              <div className={styles.featuresSection}>
                <h4>Tính năng bao gồm:</h4>
                <ul className={styles.featuresList}>
                  {pkg.features.map((feature, index) => (
                    <li key={index}><FaCheckCircle className={styles.checkIcon} /> {feature}</li>
                  ))}
                </ul>
              </div>
            )}
            <button className={styles.cancelButton} onClick={handleCancelSubscription} disabled={loading}>
              {loading ? <><div className={styles.buttonSpinner} /><span>Đang xử lý...</span></> : <span>Hủy đăng ký</span>}
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderPackages = (): React.ReactNode => {
    if (loading) {
      return (
        <div className={styles.loading}>
          <div className={styles.spinner} />
          <p>Đang tải thông tin gói Premium...</p>
        </div>
      );
    }
    if (packages.length === 0) {
      return <div className={styles.noPackages}><p>Hiện không có gói Premium nào. Vui lòng quay lại sau.</p></div>;
    }

    return (
      <div className={styles.packagesGrid}>
        {packages.map((pkg) => {
          const isCurrentPackage = isCurrentSubscribedPackage(pkg, currentSubscription);
          const isPendingPackage = isPendingSubscribedPackage(pkg, pendingSubscription);
          const isHighlightPackage = pkg._id === 'premium-package';

          return (
            <div
              key={pkg._id}
              className={`${styles.packageCard} ${isCurrentPackage ? styles.currentPackage : ''} ${isHighlightPackage ? styles.highlightPackage : ''}`}
            >
              {isHighlightPackage && (
                <div className={styles.popularBadge}><span>Phổ biến</span></div>
              )}
              <div className={styles.packageHeader}>
                <h3>{pkg.name}</h3>
                {isCurrentPackage && (
                  <span className={styles.currentBadge}><FaCheckCircle className={styles.checkBadgeIcon} /> Đang sử dụng</span>
                )}
                {pkg._id === 'starter-package-15k' && <span className={styles.newBadge}>Mới</span>}
              </div>
              <div className={styles.packagePrice}>
                {pkg.discount && pkg.discount > 0 ? (
                  <>
                    <span className={styles.originalPrice}>{formatCurrency(pkg.price || 0)}</span>
                    <span className={styles.discountPrice}>{formatCurrency((pkg.price || 0) * (1 - pkg.discount / 100))}</span>
                    <span className={styles.discountBadge}>-{pkg.discount}%</span>
                  </>
                ) : (
                  <span className={styles.normalPrice}>{formatCurrency(pkg.price || 0)}</span>
                )}
                <span className={styles.duration}>/{pkg.durationDays} ngày</span>
              </div>
              <div className={styles.packageDescription}><p>{pkg.description}</p></div>
              <ul className={styles.featuresList}>
                {(pkg.features || []).map((feature, idx) => (
                  <li key={idx}><FaCheckCircle className={styles.checkIcon} /> {feature}</li>
                ))}
                {(!pkg.features || pkg.features.length === 0) && (
                  <>
                    <li><FaCheckCircle className={styles.checkIcon} /> Xem không giới hạn</li>
                    <li><FaCheckCircle className={styles.checkIcon} /> Không quảng cáo</li>
                    <li><FaCheckCircle className={styles.checkIcon} /> Trải nghiệm cao cấp</li>
                  </>
                )}
              </ul>
              {isPendingPackage ? (
                <div className={styles.pendingButtonContainer}>
                  <span className={styles.pendingText}><FaHourglassHalf className={styles.pendingIcon} /> Đang chờ duyệt</span>
                  <button className={styles.cancelButton} onClick={handleCancelPendingRequest} disabled={loading}>
                    {loading ? <div className={styles.buttonSpinner} /> : 'Hủy đăng ký'}
                  </button>
                </div>
              ) : isCurrentPackage ? (
                <div className={styles.currentButtonContainer}>
                  <button className={styles.cancelSubscriptionButton} disabled={loading}>
                    <FaCrown style={{ marginRight: '0.5rem' }} /> Thành Viên
                  </button>
                </div>
              ) : currentSubscription?.hasActiveSubscription ? (
                <div className={styles.currentButtonContainer}>
                  <button className={styles.subscribeButton} disabled={true}>
                    <FaCrown style={{ marginRight: '0.5rem' }} /> Đã đăng ký Premium
                  </button>
                </div>
              ) : (
                <button
                  className={`${styles.subscribeButton} ${isHighlightPackage ? styles.highlightButton : ''}`}
                  onClick={() => handleSelectPackage(pkg)}
                  disabled={loading || isCurrentPackage || isPendingPackage || !!currentSubscription?.hasActiveSubscription}
                >
                  {loading ? <div className={styles.buttonSpinner} /> : 'Đăng ký ngay'}
                </button>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  const renderSuccessModal = (): React.ReactNode => {
    if (!showSuccessModal) return null;
    const discountedPrice = selectedPackage && selectedPackage.discount && selectedPackage.discount > 0
      ? (selectedPackage.price || 0) * (1 - selectedPackage.discount / 100)
      : (selectedPackage?.price || 0);

    return (
      <div className={styles.modalOverlay}>
        <div className={styles.successModal}>
          <div className={styles.successModalContent}>
            <div className={styles.successIcon}><FaCheckCircle /></div>
            <h3>Đăng ký thành công!</h3>
            <p>{successMessage}</p>
            {selectedPackage && (
              <div className={styles.subscriptionDetailsContainer}>
                <h4 className={styles.subscriptionDetailsTitle}>Chi tiết gói đăng ký</h4>
                <div className={styles.subscriptionDetailsCard}>
                  <div className={styles.packageIcon}><FaCrown /></div>
                  <div className={styles.packageDetails}>
                    <h5>{selectedPackage.name}</h5>
                    <p className={styles.packagePrice}>
                      {formatCurrency(selectedPackage.price || 0)}
                      {selectedPackage.discount && selectedPackage.discount > 0 && (
                        <span className={styles.discountBadge}>-{selectedPackage.discount}%</span>
                      )}
                    </p>
                    <p className={styles.packageDuration}>{selectedPackage.durationDays} ngày</p>
                    <div className={styles.packageFeatures}>
                      {(selectedPackage.features || []).map((feature, idx) => (
                        <div key={idx} className={styles.featureItem}>
                          <FaCheckDouble className={styles.featureIcon} />
                          <span>{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
            <button className={styles.closeSuccessButton} onClick={() => setShowSuccessModal(false)}>Đóng</button>
          </div>
        </div>
      </div>
    );
  };

  const renderPaymentModal = (): React.ReactNode => {
    if (!showPaymentModal || !selectedPackage) return null;
    const discountedPrice = selectedPackage.discount && selectedPackage.discount > 0
      ? (selectedPackage.price || 0) * (1 - selectedPackage.discount / 100)
      : (selectedPackage.price || 0);

    return (
      <div className={styles.modalOverlay}>
        <div className={styles.paymentModal}>
          <div className={styles.modalHeader}>
            <h3>Thanh toán</h3>
            <button
              className={styles.closeButton}
              onClick={() => { setShowPaymentModal(false); setShowQrCode(false); setPaymentConfirmed(false); }}
              disabled={processingPayment}
            >
              <FaTimes />
            </button>
          </div>
          <div className={styles.modalBody}>
            {showQrCode ? (
              <div className={styles.qrCodeContainer}>
                <h4>Quét mã QR để thanh toán</h4>
                <div className={styles.qrImageWrapper}>
                  <img
                    src="/img/premium/chuyentien.jpg"
                    alt="QR Code thanh toán"
                    className={styles.qrImage}
                    onError={(e) => { (e as unknown as { onerror: null }).onerror = null; (e.target as HTMLImageElement).src = '/img/avatar.png'; }}
                    style={{ width: '400px', height: 'auto' }}
                  />
                </div>
                <div className={styles.bankDetails}>
                  <p>
                    <strong>Tên TK:</strong> NGUYEN THANH QUANG<br />
                    <strong>Số TK:</strong> 5907205420870<br />
                    <strong>Ngân hàng:</strong> Agribank Chi nhánh Dinh Quan - Dong Nai<br />
                    <strong>Số tiền:</strong> {formatCurrency(discountedPrice)}
                  </p>
                  <p>
                    <strong>Nội dung chuyển khoản:</strong> PREMIUM {selectedPackage.name} {user?.email || ''}
                  </p>
                </div>
                {!paymentConfirmed ? (
                  <div className={styles.confirmPaymentActions}>
                    <button className={styles.cancelButton} onClick={() => setShowQrCode(false)} disabled={processingPayment}>Quay lại</button>
                    <button className={styles.confirmButton} onClick={handleConfirmPayment} disabled={processingPayment}>
                      <FaCheckDouble className="mr-2" /> Đã chuyển khoản
                    </button>
                  </div>
                ) : (
                  <div className={styles.paymentConfirmedBox}>
                    <FaCheckCircle className={styles.confirmedIcon} />
                    <h4>Xác nhận thanh toán</h4>
                    <p>Bạn đã xác nhận đã thanh toán thành công! Vui lòng nhấn "Gửi xác nhận" để hoàn tất quá trình đăng ký.</p>
                    <div className={styles.confirmationAlert}><FaInfoCircle /> Đã xác nhận chuyển khoản thành công</div>
                    <div id="confirmation-status" className={styles.confirmationStatus} />
                    <div className={styles.paymentSummary}>
                      <div className={styles.summaryItem}><span className={styles.summaryLabel}>Gói:</span><span className={styles.summaryValue}>{selectedPackage.name}</span></div>
                      <div className={styles.summaryItem}><span className={styles.summaryLabel}>Số tiền:</span><span className={styles.summaryValue}>{formatCurrency(discountedPrice)}</span></div>
                      <div className={styles.summaryItem}><span className={styles.summaryLabel}>Thời hạn:</span><span className={styles.summaryValue}>{selectedPackage.durationDays} ngày</span></div>
                    </div>
                    <div className={styles.confirmPaymentActions}>
                      <button className={styles.cancelButton} onClick={() => setPaymentConfirmed(false)} disabled={processingPayment}>Quay lại</button>
                      <button className={styles.confirmButton} onClick={handleSubscription} disabled={processingPayment}>
                        {processingPayment ? <><div className={styles.spinnerSmall} /> Đang xử lý...</> : <><FaCheckDouble style={{ marginRight: '6px' }} /> Gửi xác nhận</>}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <>
                <div className={styles.packageSummary}>
                  <h4>Thông tin gói</h4>
                  <p className={styles.packageName}>{selectedPackage.name}</p>
                  <p className={styles.packagePrice}>
                    {formatCurrency(discountedPrice)}
                    <span className={styles.duration}>/{selectedPackage.durationDays} ngày</span>
                  </p>
                </div>
                <div className={styles.paymentMethods}>
                  <h4>Phương thức thanh toán</h4>
                  <div className={styles.methodsGrid}>
                    {([
                      { key: 'bank_transfer', icon: '🏦', label: 'Chuyển khoản' },
                      { key: 'momo', icon: '📱', label: 'MoMo' },
                      { key: 'zalopay', icon: '💸', label: 'ZaloPay' },
                      { key: 'credit_card', icon: '💳', label: 'Thẻ tín dụng' }
                    ] as const).map((m) => (
                      <div
                        key={m.key}
                        className={`${styles.methodCard} ${paymentMethod === m.key ? styles.selected : ''}`}
                        onClick={() => setPaymentMethod(m.key as PaymentMethod)}
                      >
                        <div className={styles.methodIcon}>{m.icon}</div>
                        <div className={styles.methodName}>{m.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className={styles.approvalNote}>
                  <FaInfoCircle />
                  <p>Đăng ký của bạn sẽ được gửi cho quản trị viên phê duyệt sau khi thanh toán. Sau khi được duyệt, bạn sẽ nhận được xác nhận qua email và tài khoản sẽ tự động được nâng cấp lên Premium.</p>
                </div>
                <div className={styles.modalFooter}>
                  <button className={styles.cancelButton} onClick={() => setShowPaymentModal(false)} disabled={processingPayment}>Hủy</button>
                  <button className={styles.confirmButton} onClick={handleShowQrCode} disabled={processingPayment}>
                    Tiếp tục <FaQrcode className="ml-2" />
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    );
  };

  const toggleFaq = (index: number): void =>
    setExpandedFaqs((prev) => ({ ...prev, [index]: !prev[index] }));

  const FAQ_DATA = [
    {
      question: 'Làm thế nào để đăng ký gói Premium?',
      answer: 'Bạn chỉ cần chọn gói Premium phù hợp, nhấn "Đăng ký ngay" và tiến hành thanh toán theo hướng dẫn. Sau khi đăng ký, quản trị viên sẽ xét duyệt yêu cầu của bạn và kích hoạt tài khoản Premium khi được phê duyệt.'
    },
    {
      question: 'Tôi có thể hủy đăng ký bất cứ lúc nào không?',
      answer: 'Có, bạn có thể hủy đăng ký bất cứ lúc nào. Khi hủy, bạn vẫn có thể sử dụng dịch vụ Premium cho đến hết thời hạn đã thanh toán.'
    },
    {
      question: 'Các phương thức thanh toán nào được chấp nhận?',
      answer: 'Chúng tôi chấp nhận thanh toán qua thẻ tín dụng, chuyển khoản ngân hàng, và các ví điện tử phổ biến như MoMo, ZaloPay.'
    },
    {
      question: 'Tôi có được hoàn tiền nếu hủy đăng ký giữa chừng không?',
      answer: 'Chúng tôi không hỗ trợ hoàn tiền nếu bạn hủy đăng ký giữa chừng. Bạn vẫn có thể sử dụng dịch vụ Premium cho đến hết thời hạn đã thanh toán.'
    },
    {
      question: 'Tại sao đăng ký của tôi cần được phê duyệt?',
      answer: 'Quá trình phê duyệt giúp chúng tôi xác nhận thông tin thanh toán và cung cấp hỗ trợ tốt hơn cho người dùng. Thông thường, việc phê duyệt sẽ được hoàn tất trong vòng 24 giờ làm việc.'
    }
  ];

  return (
    <div className={styles.premiumContainer}>
      <div className={styles.premiumHeader}>
        <div className={styles.headerGlow} />
        <FaCrown className={styles.headerIcon} />
        <h1>Nâng cấp lên Premium</h1>
        <p>Mở khóa trải nghiệm xem phim cao cấp với đặc quyền dành riêng cho thành viên</p>
        {!isAuthenticated && (
          <button className={styles.headerSignupButton} onClick={() => router.push('/auth/login?redirect=/user/premium')}>
            Đăng nhập để bắt đầu
          </button>
        )}
        {isAuthenticated && currentSubscription?.hasActiveSubscription && (
          <div className={styles.memberBadge}><FaCrown className={styles.memberBadgeIcon} /> Thành Viên Premium</div>
        )}
      </div>

      {renderCurrentSubscription()}

      <div className={styles.premiumBenefits}>
        <h2>Đặc quyền của thành viên Premium</h2>
        <div className={styles.benefitsGrid}>
          {[
            { icon: '🚫', title: 'Không quảng cáo', desc: 'Trải nghiệm xem phim không gián đoạn, không quảng cáo' },
            { icon: '🎬', title: 'Nội dung độc quyền', desc: 'Truy cập vào kho nội dung độc quyền chỉ dành cho thành viên Premium' },
            { icon: '📱', title: 'Xem trên nhiều thiết bị', desc: 'Xem phim trên nhiều thiết bị cùng lúc với chất lượng cao nhất' },
            { icon: '⬇️', title: 'Tải xuống', desc: 'Tải phim và xem offline khi không có kết nối internet' }
          ].map((b, idx) => (
            <div key={idx} className={styles.benefitCard}>
              <div className={styles.benefitIconWrapper}><div className={styles.benefitIcon}>{b.icon}</div></div>
              <h3>{b.title}</h3>
              <p>{b.desc}</p>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.packagesSection}>
        <h2>Chọn gói phù hợp với bạn</h2>
        {renderPackages()}
      </div>

      <div className={styles.faqSection}>
        <h2>Câu hỏi thường gặp</h2>
        <div className={styles.faqList}>
          {FAQ_DATA.map((faq, index) => (
            <div
              key={index}
              className={`${styles.faqItem} ${expandedFaqs[index] ? styles.expanded : ''}`}
              onClick={() => toggleFaq(index)}
            >
              <div className={styles.faqQuestion}>
                <h3>{faq.question}</h3>
                <div className={styles.faqToggle}>{expandedFaqs[index] ? '-' : '+'}</div>
              </div>
              <div className={styles.faqAnswer}><p>{faq.answer}</p></div>
            </div>
          ))}
        </div>
      </div>

      {renderPaymentModal()}
      {renderSuccessModal()}
    </div>
  );
}
