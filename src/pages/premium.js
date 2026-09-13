import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { toast } from 'react-toastify';
import { FaCrown, FaCheckCircle, FaTimes, FaLock, FaUnlock, FaHourglassHalf, FaInfoCircle, FaQrcode, FaMoneyBillWave, FaCheckDouble } from 'react-icons/fa';
import subscriptionService from '../API/services/subscriptionService';
import { useAuth } from '../utils/auth';
import styles from '../styles/Premium.module.css';
import Image from 'next/image';

const PremiumPage = () => {
  const { isAuthenticated, user, status } = useAuth();
  const [packages, setPackages] = useState([]);
  const [currentSubscription, setCurrentSubscription] = useState(null);
  const [pendingSubscription, setPendingSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('bank_transfer');
  const [processingPayment, setProcessingPayment] = useState(false);
  const [showQrCode, setShowQrCode] = useState(false);
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [expandedFaqs, setExpandedFaqs] = useState({});

  const toggleFaq = (index) => {
    setExpandedFaqs(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const getPackageIdAsString = (packageIdObj) => {
    if (packageIdObj === null || typeof packageIdObj === 'undefined') {
      return null;
    }
    if (typeof packageIdObj === 'string') {
      return packageIdObj;
    }
    if (typeof packageIdObj === 'object') {
      if (packageIdObj._id) {
        return String(packageIdObj._id);
      }
      if (packageIdObj.id) {
        return String(packageIdObj.id);
      }
    }
    return String(packageIdObj);
  };

  const isCurrentSubscribedPackage = (pkg, currentSub) => {
    if (!pkg || !currentSub || !currentSub.subscription || !currentSub.subscription.packageId) {
      return false;
    }
    const currentPackageIdStr = getPackageIdAsString(currentSub.subscription.packageId);
    const packageIdStr = getPackageIdAsString(pkg._id || pkg.id);
    return currentSub.hasActiveSubscription && currentPackageIdStr === packageIdStr;
  };

  const isPendingSubscribedPackage = (pkg, pendingSub) => {
    if (!pkg || !pendingSub || !pendingSub.subscription || !pendingSub.subscription.packageId) {
      return false;
    }
    const pendingPackageIdStr = getPackageIdAsString(pendingSub.subscription.packageId);
    const packageIdStr = getPackageIdAsString(pkg._id || pkg.id);
    return pendingSub.hasPendingSubscription && pendingPackageIdStr === packageIdStr;
  };

  const isSuccessfulSubscription = (response) => {
    return response && response.success;
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        const packagesData = await subscriptionService.getAllPackages();
        setPackages(packagesData);

        if (isAuthenticated) {
          try {
            const subscriptionData = await subscriptionService.getCurrentSubscription();
            setCurrentSubscription(subscriptionData);

            const pendingData = await subscriptionService.getPendingSubscription();
            if (pendingData && pendingData.hasPendingSubscription) {
              setPendingSubscription(pendingData);
            } else {
              setPendingSubscription(null);
            }
          } catch (error) {
            console.error("Không thể lấy thông tin đăng ký:", error);
          }
        }      } catch (error) {
        console.error("Lỗi khi lấy dữ liệu:", error);
          const defaultPackages = [
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

        setPackages(defaultPackages);
        toast.error("Không thể tải thông tin gói Premium từ server. Hiển thị dữ liệu mặc định.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isAuthenticated]);

  const refreshSubscriptionData = async () => {
    if (isAuthenticated) {
      try {
        setLoading(true);

        const subscriptionData = await subscriptionService.getCurrentSubscription();
        setCurrentSubscription(subscriptionData);

        const pendingData = await subscriptionService.getPendingSubscription();

        if (pendingData && pendingData.hasPendingSubscription) {
          setPendingSubscription(pendingData);
        } else {
          setPendingSubscription(null);
        }
      } catch (error) {
        console.error("Error refreshing subscription data:", error);
        toast.error("Không thể làm mới thông tin đăng ký. Vui lòng thử lại sau.");
      } finally {
        setLoading(false);
      }
    }
  };
  useEffect(() => {
    if (isAuthenticated) {
      refreshSubscriptionData();
    }

    const refreshInterval = setInterval(() => {
      if (isAuthenticated) {
        refreshSubscriptionData();
      }
    }, 10000);

    return () => {
      clearInterval(refreshInterval);
    };
  }, [isAuthenticated]);

  const handleSelectPackage = async (pkg) => {
    if (!isAuthenticated) {
      localStorage.setItem('selectedPackage', pkg._id);
      router.push('/auth/login?redirect=/premium');
      return;
    }

    // Debug user authentication status

    try {
      if (currentSubscription?.hasActiveSubscription) {
        toast.info("Bạn đã có gói đăng ký đang hoạt động. Vui lòng hủy gói hiện tại trước khi đăng ký gói mới.");
        return;
      }

      const pendingData = await subscriptionService.getPendingSubscription();
      if (pendingData && pendingData.hasPendingSubscription) {
        setPendingSubscription(pendingData);
        toast.info("Bạn đã có một yêu cầu đăng ký đang chờ duyệt. Vui lòng đợi quản trị viên xét duyệt.");
        return;
      }

      setSelectedPackage(pkg);
      setShowPaymentModal(true);
    } catch (error) {
      console.error("Lỗi khi kiểm tra trạng thái đăng ký:", error);
      toast.error("Có lỗi xảy ra khi kiểm tra trạng thái đăng ký. Vui lòng thử lại.");
    }
  };

  const handleShowQrCode = () => {
    setShowQrCode(true);
  };
  const handleConfirmPayment = () => {
    setPaymentConfirmed(true);
    // Show confirmation toast to make sure user knows their action was registered
    toast.success("Xác nhận chuyển khoản thành công! Vui lòng nhấn 'Gửi xác nhận' để hoàn tất.", {
      autoClose: 3000,
    });
  };
  const handleSubscription = async () => {
    if (!selectedPackage || !paymentConfirmed) {
      toast.error("Vui lòng chọn gói và xác nhận thanh toán trước!");
      return;
    }

    try {
      setProcessingPayment(true);
      toast.info("Đang xử lý đăng ký gói Premium...", {
        autoClose: false,
        toastId: 'processing-subscription'
      });
      const confirmationElement = document.getElementById('confirmation-status');
      if (confirmationElement) {
        confirmationElement.innerHTML = `<div style="display: flex; align-items: center;"><div class="${styles.spinnerSmall}" style="margin-right: 8px;"></div> Đang gửi xác nhận...</div>`;
        confirmationElement.style.color = "#ffc107";
        confirmationElement.className = `${styles.confirmationStatus} ${styles.confirmationStatusPending}`;
      }

      const subscriptionData = {
        packageId: selectedPackage._id,
        paymentMethod: paymentMethod,
        amount: selectedPackage.discount > 0
          ? selectedPackage.price * (1 - selectedPackage.discount / 100)
          : selectedPackage.price,
        notes: `Đăng ký gói ${selectedPackage.name} qua ${
          paymentMethod === 'bank_transfer' ? 'chuyển khoản ngân hàng' :
          paymentMethod === 'momo' ? 'ví MoMo' :
          paymentMethod === 'zalopay' ? 'ví ZaloPay' :
          'thẻ tín dụng'
        }`
      };

      const response = await subscriptionService.subscribePackage(subscriptionData);

      toast.dismiss('processing-subscription');
      if (response && (isSuccessfulSubscription(response) ||
                      response._formatted ||
                      response._errorButSuccess ||
                      response.subscription ||
                      response.package ||
                      response.payment)) {
        const confirmationElement = document.getElementById('confirmation-status');
        if (confirmationElement) {
          confirmationElement.innerHTML = `<div style="display: flex; align-items: center;"><svg style="margin-right: 10px; color: #4CAF50;" width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z" fill="currentColor"/>
          </svg> Gửi xác nhận thành công!</div>`;
          confirmationElement.style.color = "#4CAF50";
          confirmationElement.className = `${styles.confirmationStatus} ${styles.confirmationStatusSuccess}`;
        }

        setTimeout(() => {
          setShowPaymentModal(false);
          setShowQrCode(false);
          setPaymentConfirmed(false);

          toast.success("Đăng ký đã được gửi thành công! Quản trị viên sẽ phê duyệt trong thời gian sớm nhất.", {
            autoClose: 8000,
            style: { backgroundColor: '#2c8a3c', color: '#fff' },
            hideProgressBar: false,
            closeOnClick: false,
            pauseOnHover: true,
            draggable: true,
          });

          setSuccessMessage(`Đăng ký gói ${selectedPackage.name} đã được gửi thành công! Quản trị viên sẽ phê duyệt trong thời gian sớm nhất.`);
          setShowSuccessModal(true);        }, 1500);

        setTimeout(async () => {
          try {
            // Refresh all subscription data to ensure UI is fully updated
            await refreshSubscriptionData();

            // Check specifically for pending subscription status
            const pendingData = await subscriptionService.getPendingSubscription();
            if (pendingData && pendingData.hasPendingSubscription) {
              setPendingSubscription(pendingData);
              toast.info("Bạn có thể xem trạng thái đăng ký trong phần 'Yêu cầu đang chờ duyệt'", {
                autoClose: 5000,
              });
            }
          } catch (error) {
            console.error("Không thể làm mới thông tin đăng ký sau khi gửi yêu cầu:", error);
          }
        }, 1000);
      } else {
        const errorMessage = response?.message || "Đăng ký gói không thành công. Vui lòng thử lại sau!";
        if (response && (isSuccessfulSubscription(response) ||
                         response.subscription ||
                         response.package ||
                         response.payment ||
                         response._formatted ||
                         response._errorButSuccess)) {

          const confirmationElement = document.getElementById('confirmation-status');
          if (confirmationElement) {
            confirmationElement.innerHTML = `<div style="display: flex; align-items: center;"><svg style="margin-right: 10px; color: #4CAF50;" width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z" fill="currentColor"/>
            </svg> Gửi xác nhận thành công!</div>`;
            confirmationElement.style.color = "#4CAF50";
            confirmationElement.className = `${styles.confirmationStatus} ${styles.confirmationStatusSuccess}`;
          }

          setTimeout(() => {
            setShowPaymentModal(false);
            setShowQrCode(false);
            setPaymentConfirmed(false);
            toast.success("Đăng ký đã được gửi thành công! Quản trị viên sẽ phê duyệt trong thời gian sớm nhất.", {
              autoClose: 8000,
              style: { backgroundColor: '#2c8a3c', color: '#fff' },
              hideProgressBar: false,
              closeOnClick: false,
              pauseOnHover: true,
              draggable: true,
            });

            setSuccessMessage(`Đăng ký gói ${selectedPackage.name} đã được gửi thành công! Quản trị viên sẽ phê duyệt trong thời gian sớm nhất.`);
            setShowSuccessModal(true);
            setTimeout(async () => {
              try {
                await refreshSubscriptionData();

                toast.info("Bạn có thể xem trạng thái đăng ký trong phần 'Yêu cầu đang chờ duyệt'", {
                  autoClose: 5000,
                });
              } catch (error) {
                console.error("Không thể làm mới thông tin đăng ký:", error);
              }
            }, 1000);
          }, 1500);
        } else {
          toast.error(errorMessage, {
            autoClose: 8000,
            closeOnClick: false,
            pauseOnHover: true,
          });

          const confirmationElement = document.getElementById('confirmation-status');
          if (confirmationElement) {
            confirmationElement.innerHTML = `<div style="display: flex; align-items: center;"><svg style="margin-right: 10px; color: #e74c3c;" width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z" fill="currentColor"/>
            </svg> Gửi xác nhận thất bại. Vui lòng thử lại!</div>`;
            confirmationElement.style.color = "#e74c3c";
            confirmationElement.className = `${styles.confirmationStatus} ${styles.confirmationStatusError}`;
          }
        }

        if (response?.details && response.details.length > 0) {
          response.details.forEach(error => {
            console.error("Lỗi chi tiết:", error);
          });
        }
      }
    } catch (error) {
      console.error("Lỗi trong quá trình đăng ký:", error);

      toast.dismiss('processing-subscription');

      toast.error("Có lỗi xảy ra: " + (error.message || "Vui lòng thử lại sau"), {
        autoClose: 8000,
        closeOnClick: false,
        pauseOnHover: true,
      });
      const confirmationElement = document.getElementById('confirmation-status');
      if (confirmationElement) {
        confirmationElement.innerHTML = `<div style="display: flex; align-items: center;"><svg style="margin-right: 10px; color: #e74c3c;" width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z" fill="currentColor"/>
        </svg> Gửi xác nhận thất bại. Vui lòng thử lại!</div>`;
        confirmationElement.style.color = "#e74c3c";
        confirmationElement.className = `${styles.confirmationStatus} ${styles.confirmationStatusError}`;
      }
    } finally {
      setProcessingPayment(false);
    }
  };
  const handleCancelSubscription = async () => {
    if (!confirm("Bạn có chắc chắn muốn hủy gói Premium không? Bạn vẫn có thể sử dụng dịch vụ Premium đến khi hết hạn.")) {
      return;
    }

    try {
      setLoading(true);
      const response = await subscriptionService.cancelSubscription();

      if (response.success) {
        toast.success("Hủy đăng ký thành công!");

        await refreshSubscriptionData();
      } else {
        toast.error(response.message || "Hủy đăng ký không thành công. Vui lòng thử lại!");
      }
    } catch (error) {
      console.error("Error canceling subscription:", error);
      toast.error(error.response?.data?.message || "Có lỗi xảy ra khi hủy đăng ký. Vui lòng thử lại sau!");
    } finally {
      setLoading(false);
    }
  };
  const handleCancelPendingRequest = async () => {
    if (!confirm("Bạn có chắc chắn muốn hủy yêu cầu đăng ký Premium đang chờ duyệt không?")) {
      return;
    }

    try {
      setLoading(true);
      const response = await subscriptionService.cancelSubscription();

      if (response.success) {
        toast.success("Hủy yêu cầu đăng ký thành công!");
        await refreshSubscriptionData();
      } else {
        toast.error(response.message || "Hủy yêu cầu không thành công. Vui lòng thử lại!");
      }
    } catch (error) {
      console.error("Error canceling pending request:", error);
      toast.error(error.response?.data?.message || "Có lỗi xảy ra khi hủy yêu cầu đăng ký. Vui lòng thử lại sau!");
    } finally {
      setLoading(false);
    }
  };  const renderCurrentSubscription = () => {
    if (!currentSubscription || !currentSubscription.hasActiveSubscription) {
      return null;
    }

    const { subscription, daysLeft } = currentSubscription;
    const packageDetails = subscription.packageId || {};

    const originalPrice = packageDetails.price || 0;
    const discount = packageDetails.discount || 0;
    const discountedPrice = discount > 0 ? originalPrice * (1 - discount / 100) : originalPrice;

    const totalDays = packageDetails.durationDays || subscription.durationDays || 30;
    const percentRemaining = Math.min(100, (daysLeft / totalDays) * 100);

    return (
      <div className={styles.currentSubscription}>
        <div className={styles.currentSubscriptionInner}>
          <div className={styles.subscriptionHeader}>
            <FaCrown className={styles.crownIcon} />
            <h3>Gói Premium của bạn</h3>
            {packageDetails.discount > 0 && (
              <span className={styles.discountBadge}>-{packageDetails.discount}%</span>
            )}
          </div>

          <div className={styles.subscriptionDetails}>
            <div className={styles.subscriptionPlan}>
              <p className={styles.packageName}>{packageDetails.name}</p>
              <div className={styles.expiryInfo}>
                {daysLeft > 0 ? (
                  <>
                    <div className={styles.daysLeftContainer}>
                      <span className={styles.daysLeft}>{daysLeft}</span>
                      <span className={styles.daysText}>ngày</span>
                    </div>
                    <div className={styles.progressContainer}>
                      <div
                        className={styles.progressBar}
                        style={{ width: `${percentRemaining}%` }}
                      ></div>
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
                    <span className={styles.originalPrice}>
                      {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(originalPrice)}
                    </span>
                    <span className={styles.discountPrice}>
                      {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(discountedPrice)}
                    </span>
                  </>
                ) : (
                  <span className={styles.normalPrice}>
                    {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(originalPrice)}
                  </span>
                )}
                <span className={styles.duration}>/{totalDays} ngày</span>
              </div>
            </div>

            <div className={styles.subscriptionDates}>
              <div className={styles.dateInfo}>
                <span className={styles.dateLabel}>Ngày bắt đầu:</span>
                <span className={styles.dateValue}>{new Date(subscription.startDate).toLocaleDateString('vi-VN')}</span>
              </div>
              <div className={styles.dateInfo}>
                <span className={styles.dateLabel}>Ngày kết thúc:</span>
                <span className={styles.dateValue}>{new Date(subscription.endDate).toLocaleDateString('vi-VN')}</span>
              </div>
            </div>

            {packageDetails.description && (
              <div className={styles.packageDescription}>
                <p>{packageDetails.description}</p>
              </div>
            )}

            {packageDetails.features && packageDetails.features.length > 0 && (
              <div className={styles.featuresSection}>
                <h4>Tính năng bao gồm:</h4>
                <ul className={styles.featuresList}>
                  {packageDetails.features.map((feature, index) => (
                    <li key={index}>
                      <FaCheckCircle className={styles.checkIcon} /> {feature}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <button
              className={styles.cancelButton}
              onClick={handleCancelSubscription}
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className={styles.buttonSpinner}></div>
                  <span>Đang xử lý...</span>
                </>
              ) : (
                <>
                  <span>Hủy đăng ký</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderPackages = () => {
    if (loading) {
      return (
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>Đang tải thông tin gói Premium...</p>
        </div>
      );
    }

    if (packages.length === 0) {
      return (
        <div className={styles.noPackages}>
          <p>Hiện không có gói Premium nào. Vui lòng quay lại sau.</p>
        </div>
      );
    }

    // Enhanced debug logging
    if (currentSubscription && currentSubscription.subscription) {
      const packageIdObj = currentSubscription.subscription.packageId;
    }

    return (
      <div className={styles.packagesGrid}>
        {packages.map((pkg) => {
          const isCurrentPackage = currentSubscription &&
                                   currentSubscription.hasActiveSubscription &&
                                   isCurrentSubscribedPackage(pkg, currentSubscription);

          const isPendingPackage = pendingSubscription &&
                                   pendingSubscription.hasPendingSubscription &&
                                   isPendingSubscribedPackage(pkg, pendingSubscription);

          const isHighlightPackage = pkg._id === 'premium-package';

          return (
            <div
              key={pkg._id}
              className={`${styles.packageCard} ${
                isCurrentPackage ? styles.currentPackage : ''
              } ${isHighlightPackage ? styles.highlightPackage : ''}`}
            >
              {isHighlightPackage && (
                <div className={styles.popularBadge}>
                  <span>Phổ biến</span>
                </div>
              )}

              <div className={styles.packageHeader}>
                <h3>{pkg.name}</h3>
                {isCurrentPackage && (
                  <span className={styles.currentBadge}>
                    <FaCheckCircle className={styles.checkBadgeIcon} />
                    Đang sử dụng
                  </span>
                )}
                {pkg._id === 'starter-package-15k' && (
                  <span className={styles.newBadge}>Mới</span>
                )}
              </div>

              <div className={styles.packagePrice}>
                {pkg.discount > 0 ? (
                  <>
                    <span className={styles.originalPrice}>
                      {new Intl.NumberFormat('vi-VN', {
                        style: 'currency',
                        currency: 'VND'
                      }).format(pkg.price)}
                    </span>
                    <span className={styles.discountPrice}>
                      {new Intl.NumberFormat('vi-VN', {
                        style: 'currency',
                        currency: 'VND'
                      }).format(pkg.price * (1 - pkg.discount / 100))}
                    </span>
                    <span className={styles.discountBadge}>-{pkg.discount}%</span>
                  </>
                ) : (
                  <span className={styles.normalPrice}>
                    {new Intl.NumberFormat('vi-VN', {
                      style: 'currency',
                      currency: 'VND'
                    }).format(pkg.price)}
                  </span>
                )}
                <span className={styles.duration}>/{pkg.durationDays} ngày</span>
              </div>

              <div className={styles.packageDescription}>
                <p>{pkg.description}</p>
              </div>

              <ul className={styles.featuresList}>
                {pkg.features && pkg.features.map((feature, index) => (
                  <li key={index}>
                    <FaCheckCircle className={styles.checkIcon} /> {feature}
                  </li>
                ))}
                {(!pkg.features || pkg.features.length === 0) && (
                  <>
                    <li>
                      <FaCheckCircle className={styles.checkIcon} /> Xem không giới hạn
                    </li>
                    <li>
                      <FaCheckCircle className={styles.checkIcon} /> Không quảng cáo
                    </li>
                    <li>
                      <FaCheckCircle className={styles.checkIcon} /> Trải nghiệm cao cấp
                    </li>
                  </>
                )}
              </ul>

              {/* Render different button states based on package status */}
              {isPendingPackage ? (
                <div className={styles.pendingButtonContainer}>
                  <span className={styles.pendingText}>
                    <FaHourglassHalf className={styles.pendingIcon} /> Đang chờ duyệt
                  </span>
                  <button
                    className={styles.cancelButton}
                    onClick={handleCancelPendingRequest}
                    disabled={loading}
                  >
                    {loading ? <div className={styles.buttonSpinner}></div> : "Hủy đăng ký"}
                  </button>
                </div>
              ) : isCurrentPackage ? (
                <div className={styles.currentButtonContainer}>
                  <button
                    className={styles.cancelSubscriptionButton}
                    onClick={handleCancelSubscription}
                    disabled={loading}
                  >
                    {loading ? <div className={styles.buttonSpinner}></div> : <>
                      <FaCrown style={{marginRight: "0.5rem"}}/> Thành Viên
                    </>}
                  </button>
                </div>
              ) : (currentSubscription && currentSubscription.hasActiveSubscription) ? (
                <div className={styles.currentButtonContainer}>
                  <button
                    className={styles.subscribeButton}
                    disabled={true}
                  >
                    <FaCrown style={{marginRight: "0.5rem"}}/> Đã đăng ký Premium
                  </button>
                </div>
              ) : (
                <button
                  className={`${styles.subscribeButton} ${isHighlightPackage ? styles.highlightButton : ''}`}
                  onClick={() => handleSelectPackage(pkg)}
                  disabled={loading || isCurrentPackage || isPendingPackage || (currentSubscription && currentSubscription.hasActiveSubscription)}
                >
                  {loading ? <div className={styles.buttonSpinner}></div> : "Đăng ký ngay"}
                </button>
              )}
            </div>
          );
        })}
      </div>
    );
  };
  const renderSuccessModal = () => {
    if (!showSuccessModal) return null;

    return (
      <div className={styles.modalOverlay}>
        <div className={styles.successModal}>
          <div className={styles.successModalContent}>
            <div className={styles.successIcon}>
              <FaCheckCircle />
            </div>
            <h3>Đăng ký thành công!</h3>
            <p>{successMessage}</p>

            {selectedPackage && (
              <div className={styles.subscriptionDetailsContainer}>
                <h4 className={styles.subscriptionDetailsTitle}>Chi tiết gói đăng ký</h4>
                <div className={styles.subscriptionDetailsCard}>
                  <div className={styles.packageIcon}>
                    <FaCrown />
                  </div>
                  <div className={styles.packageDetails}>
                    <h5>{selectedPackage.name}</h5>
                    <p className={styles.packagePrice}>
                      {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(selectedPackage.price)}
                      {selectedPackage.discount > 0 && (
                        <span className={styles.discountBadge}>-{selectedPackage.discount}%</span>
                      )}
                    </p>
                    <p className={styles.packageDuration}>{selectedPackage.durationDays} ngày</p>
                    <div className={styles.packageFeatures}>
                      {selectedPackage.features.map((feature, idx) => (
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

            <button
              className={styles.closeSuccessButton}
              onClick={() => setShowSuccessModal(false)}
            >
              Đóng
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderPaymentModal = () => {
    if (!showPaymentModal || !selectedPackage) return null;

    const discountedPrice = selectedPackage.discount > 0
      ? selectedPackage.price * (1 - selectedPackage.discount / 100)
      : selectedPackage.price;

    return (
      <div className={styles.modalOverlay}>
        <div className={styles.paymentModal}>
          <div className={styles.modalHeader}>
            <h3>Thanh toán</h3>
            <button
              className={styles.closeButton}
              onClick={() => {
                setShowPaymentModal(false);
                setShowQrCode(false);
                setPaymentConfirmed(false);
              }}
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
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = "/img/avatar.png";
                    }}
                    style={{ width: '400px', height: 'auto' }}
                  />
                </div>

                <div className={styles.bankDetails}>
                  <p>
                    <strong>Tên TK:</strong> NGUYEN THANH QUANG<br/>
                    <strong>Số TK:</strong> 5907205420870<br/>
                    <strong>Ngân hàng:</strong> Agribank Chi nhánh Dinh Quan - Dong Nai<br/>
                    <strong>Số tiền:</strong> {new Intl.NumberFormat('vi-VN', {
                      style: 'currency',
                      currency: 'VND'
                    }).format(discountedPrice)}
                  </p>
                  <p>
                    <strong>Nội dung chuyển khoản:</strong> PREMIUM {selectedPackage.name} {user?.email || ''}
                  </p>
                </div>

                {!paymentConfirmed ? (
                  <div className={styles.confirmPaymentActions}>
                    <button
                      className={styles.cancelButton}
                      onClick={() => setShowQrCode(false)}
                      disabled={processingPayment}
                    >
                      Quay lại
                    </button>
                    <button
                      className={styles.confirmButton}
                      onClick={handleConfirmPayment}
                      disabled={processingPayment}
                    >
                      <FaCheckDouble className="mr-2" />
                      Đã chuyển khoản
                    </button>
                  </div>
                ) : (
                  <div className={styles.paymentConfirmedBox}>
                    <FaCheckCircle className={styles.confirmedIcon} />
                    <h4>Xác nhận thanh toán</h4>
                    <p>Bạn đã xác nhận đã thanh toán thành công! Vui lòng nhấn "Gửi xác nhận" để hoàn tất quá trình đăng ký.</p>
                      <div className={styles.confirmationAlert}>
                      <FaInfoCircle /> Đã xác nhận chuyển khoản thành công
                    </div>

                    <div id="confirmation-status" className={styles.confirmationStatus}></div>

                    <div className={styles.paymentSummary}>
                      <div className={styles.summaryItem}>
                        <span className={styles.summaryLabel}>Gói:</span>
                        <span className={styles.summaryValue}>{selectedPackage.name}</span>
                      </div>
                      <div className={styles.summaryItem}>
                        <span className={styles.summaryLabel}>Số tiền:</span>
                        <span className={styles.summaryValue}>
                          {new Intl.NumberFormat('vi-VN', {
                            style: 'currency',
                            currency: 'VND'
                          }).format(discountedPrice)}
                        </span>
                      </div>
                      <div className={styles.summaryItem}>
                        <span className={styles.summaryLabel}>Thời hạn:</span>
                        <span className={styles.summaryValue}>{selectedPackage.durationDays} ngày</span>
                      </div>
                    </div>

                    <div className={styles.confirmPaymentActions}>
                      <button
                        className={styles.cancelButton}
                        onClick={() => setPaymentConfirmed(false)}
                        disabled={processingPayment}
                      >
                        Quay lại
                      </button>
                      <button
                        className={styles.confirmButton}
                        onClick={handleSubscription}
                        disabled={processingPayment}
                      >
                        {processingPayment ? (
                          <>
                            <div className={styles.spinnerSmall}></div>
                            Đang xử lý...
                          </>
                        ) : (
                          <>
                            <FaCheckDouble style={{ marginRight: '6px' }} />
                            Gửi xác nhận
                          </>
                        )}
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
                    {new Intl.NumberFormat('vi-VN', {
                      style: 'currency',
                      currency: 'VND'
                    }).format(discountedPrice)}
                    <span className={styles.duration}>/{selectedPackage.durationDays} ngày</span>
                  </p>
                </div>

                <div className={styles.paymentMethods}>
                  <h4>Phương thức thanh toán</h4>

                  <div className={styles.methodsGrid}>
                    <div
                      className={`${styles.methodCard} ${paymentMethod === 'bank_transfer' ? styles.selected : ''}`}
                      onClick={() => setPaymentMethod('bank_transfer')}
                    >
                      <div className={styles.methodIcon}>🏦</div>
                      <div className={styles.methodName}>Chuyển khoản</div>
                    </div>

                    <div
                      className={`${styles.methodCard} ${paymentMethod === 'momo' ? styles.selected : ''}`}
                      onClick={() => setPaymentMethod('momo')}
                    >
                      <div className={styles.methodIcon}>📱</div>
                      <div className={styles.methodName}>MoMo</div>
                    </div>

                    <div
                      className={`${styles.methodCard} ${paymentMethod === 'zalopay' ? styles.selected : ''}`}
                      onClick={() => setPaymentMethod('zalopay')}
                    >
                      <div className={styles.methodIcon}>💸</div>
                      <div className={styles.methodName}>ZaloPay</div>
                    </div>

                    <div
                      className={`${styles.methodCard} ${paymentMethod === 'credit_card' ? styles.selected : ''}`}
                      onClick={() => setPaymentMethod('credit_card')}
                    >
                      <div className={styles.methodIcon}>💳</div>
                      <div className={styles.methodName}>Thẻ tín dụng</div>
                    </div>
                  </div>
                </div>

                <div className={styles.approvalNote}>
                  <FaInfoCircle />
                  <p>Đăng ký của bạn sẽ được gửi cho quản trị viên phê duyệt sau khi thanh toán. Sau khi được duyệt, bạn sẽ nhận được xác nhận qua email và tài khoản sẽ tự động được nâng cấp lên Premium.</p>
                </div>

                <div className={styles.modalFooter}>
                  <button
                    className={styles.cancelButton}
                    onClick={() => setShowPaymentModal(false)}
                    disabled={processingPayment}
                  >
                    Hủy
                  </button>
                  <button
                    className={styles.confirmButton}
                    onClick={handleShowQrCode}
                    disabled={processingPayment}
                  >
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

  return (
    <div className={styles.premiumContainer}>
      <div className={styles.premiumHeader}>
        <div className={styles.headerGlow}></div>
        <FaCrown className={styles.headerIcon} />
        <h1>Nâng cấp lên Premium</h1>
        <p>Mở khóa trải nghiệm xem phim cao cấp với đặc quyền dành riêng cho thành viên</p>
        {!isAuthenticated && (
          <button
            className={styles.headerSignupButton}
            onClick={() => router.push('/auth/login?redirect=/premium')}
          >
            Đăng nhập để bắt đầu
          </button>
        )}
        {isAuthenticated && currentSubscription && currentSubscription.hasActiveSubscription && (
          <div className={styles.memberBadge}>
            <FaCrown className={styles.memberBadgeIcon} /> Thành Viên Premium
          </div>
        )}
      </div>

      {renderCurrentSubscription()}
        <div className={styles.premiumBenefits}>
        <h2>Đặc quyền của thành viên Premium</h2>

        <div className={styles.benefitsGrid}>
          <div className={styles.benefitCard}>
            <div className={styles.benefitIconWrapper}>
              <div className={styles.benefitIcon}>🚫</div>
            </div>
            <h3>Không quảng cáo</h3>
            <p>Trải nghiệm xem phim không gián đoạn, không quảng cáo</p>
          </div>

          <div className={styles.benefitCard}>
            <div className={styles.benefitIconWrapper}>
              <div className={styles.benefitIcon}>🎬</div>
            </div>
            <h3>Nội dung độc quyền</h3>
            <p>Truy cập vào kho nội dung độc quyền chỉ dành cho thành viên Premium</p>
          </div>

          <div className={styles.benefitCard}>
            <div className={styles.benefitIconWrapper}>
              <div className={styles.benefitIcon}>📱</div>
            </div>
            <h3>Xem trên nhiều thiết bị</h3>
            <p>Xem phim trên nhiều thiết bị cùng lúc với chất lượng cao nhất</p>
          </div>

          <div className={styles.benefitCard}>
            <div className={styles.benefitIconWrapper}>
              <div className={styles.benefitIcon}>⬇️</div>
            </div>
            <h3>Tải xuống</h3>
            <p>Tải phim và xem offline khi không có kết nối internet</p>
          </div>
        </div>
      </div>

      <div className={styles.packagesSection}>
        <h2>Chọn gói phù hợp với bạn</h2>
        {renderPackages()}
      </div>
        <div className={styles.faqSection}>
        <h2>Câu hỏi thường gặp</h2>

        <div className={styles.faqList}>
          {[
            {
              question: "Làm thế nào để đăng ký gói Premium?",
              answer: "Bạn chỉ cần chọn gói Premium phù hợp, nhấn \"Đăng ký ngay\" và tiến hành thanh toán theo hướng dẫn. Sau khi đăng ký, quản trị viên sẽ xét duyệt yêu cầu của bạn và kích hoạt tài khoản Premium khi được phê duyệt."
            },
            {
              question: "Tôi có thể hủy đăng ký bất cứ lúc nào không?",
              answer: "Có, bạn có thể hủy đăng ký bất cứ lúc nào. Khi hủy, bạn vẫn có thể sử dụng dịch vụ Premium cho đến hết thời hạn đã thanh toán."
            },
            {
              question: "Các phương thức thanh toán nào được chấp nhận?",
              answer: "Chúng tôi chấp nhận thanh toán qua thẻ tín dụng, chuyển khoản ngân hàng, và các ví điện tử phổ biến như MoMo, ZaloPay."
            },
            {
              question: "Tôi có được hoàn tiền nếu hủy đăng ký giữa chừng không?",
              answer: "Chúng tôi không hỗ trợ hoàn tiền nếu bạn hủy đăng ký giữa chừng. Bạn vẫn có thể sử dụng dịch vụ Premium cho đến hết thời hạn đã thanh toán."
            },
            {
              question: "Tại sao đăng ký của tôi cần được phê duyệt?",
              answer: "Quá trình phê duyệt giúp chúng tôi xác nhận thông tin thanh toán và cung cấp hỗ trợ tốt hơn cho người dùng. Thông thường, việc phê duyệt sẽ được hoàn tất trong vòng 24 giờ làm việc."
            }
          ].map((faq, index) => (
            <div
              key={index}
              className={`${styles.faqItem} ${expandedFaqs[index] ? styles.expanded : ''}`}
              onClick={() => toggleFaq(index)}
            >
              <div className={styles.faqQuestion}>
                <h3>{faq.question}</h3>
                <div className={styles.faqToggle}>
                  {expandedFaqs[index] ? '-' : '+'}
                </div>
              </div>
              <div className={styles.faqAnswer}>
                <p>{faq.answer}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {renderPaymentModal()}
      {renderSuccessModal()}
    </div>
  );
};

export default PremiumPage;
