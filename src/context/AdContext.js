// Ngữ cảnh quảng cáo để quản lý việc hiển thị quảng cáo dựa trên gói đăng ký của người dùng
import React, { createContext, useState, useContext, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import subscriptionService from '../API/services/subscriptionService';

// Tạo context với giá trị mặc định
const AdContext = createContext({
  hideHomepageAds: false,
  hideVideoAds: false,
  isLoading: true,
  packageType: null,
  hasActiveSubscription: false,
});

// Export custom hook để truy cập context dễ dàng
export const useAdContext = () => useContext(AdContext);

export const AdContextProvider = ({ children }) => {
  const router = useRouter();
  
  // State để theo dõi cài đặt hiển thị quảng cáo với giá trị mặc định phù hợp
  const [adSettings, setAdSettings] = useState({
    hideHomepageAds: false,
    hideVideoAds: false,
    isLoading: true,
    packageType: null,
    hasActiveSubscription: false,
  });
  
  // Theo dõi trạng thái xác thực
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  // Sử dụng ref để theo dõi việc fetch benefits
  const isFetchingRef = useRef(false);
  const benefitsTimeoutRef = useRef(null);

  // Kiểm tra xem trang hiện tại có phải là trang không cho phép truy cập quảng cáo không
  const isNoAccessPage = router.pathname === '/noaccess';

  // Kiểm tra người dùng đã xác thực - chỉ chạy 1 lần khi mount
  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('auth_token') || localStorage.getItem('token') || localStorage.getItem('authToken');
      const isNowAuthenticated = !!token;
      
      setIsAuthenticated(prevState => {
        if (prevState !== isNowAuthenticated) {
          console.log(`[AdContext] Authentication status changed: ${prevState} → ${isNowAuthenticated}`);
          return isNowAuthenticated; // Chỉ cập nhật nếu trạng thái thay đổi
        }
        return prevState;
      });
    };
    
    // Kiểm tra ban đầu
    checkAuth();
    
    // Lắng nghe sự kiện thay đổi storage (trường hợp token thay đổi ở tab khác)
    const handleStorageChange = (e) => {
      if (e.key === 'auth_token' || e.key === 'token' || e.key === 'authToken') {
        console.log(`[AdContext] Storage event detected for ${e.key}`);
        checkAuth();
      }
    };
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      // Xóa timeout khi unmount
      if (benefitsTimeoutRef.current) {
        clearTimeout(benefitsTimeoutRef.current);
      }
    };
  }, []); // Không phụ thuộc isAuthenticated để tránh render loop

  // Lấy trạng thái đăng ký và quyền lợi quảng cáo khi component mount hoặc khi trạng thái xác thực thay đổi
  useEffect(() => {
    // Theo dõi số lần thử lại
    let retryCount = 0;
    const MAX_RETRIES = 3;
    let isComponentMounted = true; // Theo dõi component còn mounted không
    
    const fetchSubscriptionBenefits = async () => {
      // Tránh fetch đồng thời nhiều lần
      if (isFetchingRef.current) {
        console.log('[AdContext] Already fetching benefits, skipping duplicate request');
        return;
      }
      
      isFetchingRef.current = true;
      
      // Đặt trạng thái loading
      if (isComponentMounted) {
        setAdSettings(prev => ({ ...prev, isLoading: true }));
      }
      
      try {
        // Chỉ fetch quyền lợi nếu đã xác thực
        if (!isAuthenticated) {
          console.log('[AdContext] Not authenticated, skipping benefits check');
          if (isComponentMounted) {
            setAdSettings(prev => ({ 
              ...prev,
              hideHomepageAds: false,
              hideVideoAds: false, 
              isLoading: false,
              packageType: null,
              hasActiveSubscription: false
            }));
          }
          isFetchingRef.current = false;
          return;
        }
        
        console.log('[AdContext] Fetching ad benefits from API...', new Date().toISOString());
        
        // Lấy quyền lợi quảng cáo từ API
        const benefits = await subscriptionService.getUserAdBenefits();
        
        // Kiểm tra component còn mounted không
        if (!isComponentMounted) {
          console.log('[AdContext] Component unmounted during API fetch, abandoning update');
          isFetchingRef.current = false;
          return;
        }
          // Kiểm tra lỗi xác thực
        if (benefits.authError) {
          console.warn('[AdContext] Authentication error detected');
          if (retryCount < MAX_RETRIES) {
            // Thử lại sau một khoảng thời gian
            retryCount++;
            console.log(`[AdContext] Will retry in 2 seconds (attempt ${retryCount + 1}/${MAX_RETRIES})`);
            benefitsTimeoutRef.current = setTimeout(fetchSubscriptionBenefits, 2000);
            return;
          } else {
            console.error('[AdContext] Max retries reached, giving up');
          }
        }
        
        // Kiểm tra đặc biệt cho gói premium 15k
        const isPremium15k = benefits.isPremium15k === true || benefits.packageType === '682f7d849c310399aa715c9d';
        
        if (isPremium15k) {
          console.log('%c[AdContext] PREMIUM 15K PACKAGE DETECTED!', 'color: #FF0000; font-size: 16px; font-weight: bold');
        }
        
        // Đảm bảo các giá trị boolean đúng kiểu
        const hideHomepageAds = benefits.hideHomepageAds === true || isPremium15k;
        const hideVideoAds = benefits.hideVideoAds === true || isPremium15k;
        const hasActiveSubscription = benefits.hasActiveSubscription === true;
        
        // Log chi tiết về quyền lợi để debug
        console.log(`[AdContext] ✅ Benefits received - hideHomepageAds: ${hideHomepageAds}, hideVideoAds: ${hideVideoAds}`);
        console.log(`[AdContext] 📦 Package type: ${benefits.packageType || 'None'}, Active sub: ${hasActiveSubscription}`);
        
        // Cập nhật state với dữ liệu quyền lợi
        if (isComponentMounted) {
          setAdSettings({
            hideHomepageAds: hideHomepageAds,
            hideVideoAds: hideVideoAds,
            packageType: benefits.packageType,
            hasActiveSubscription: hasActiveSubscription,
            isLoading: false,
            lastUpdated: new Date().toISOString()
          });
        }
        
        console.log('[AdContext] Ad settings updated successfully');
        // Reset bộ đếm thử lại khi thành công
        retryCount = 0;
      } catch (error) {
        console.error('[AdContext] Failed to fetch ad benefits:', error);
        
        // Logic thử lại khi gặp lỗi mạng
        if (retryCount < MAX_RETRIES) {
          retryCount++;
          const delay = 1000 * Math.pow(2, retryCount); // Tăng dần thời gian chờ
          console.log(`[AdContext] Network error, retrying in ${delay/1000} seconds (attempt ${retryCount + 1}/${MAX_RETRIES})`);
          
          if (isComponentMounted) {
            benefitsTimeoutRef.current = setTimeout(fetchSubscriptionBenefits, delay);
          }
        } else {
          // Đặt loading = false sau khi thử tối đa số lần
          if (isComponentMounted) {
            setAdSettings(prev => ({ ...prev, isLoading: false }));
          }
        }
      } finally {
        isFetchingRef.current = false; // Reset cờ fetch
      }
    };

    // Bắt đầu fetch quyền lợi
    fetchSubscriptionBenefits();
    
    // Làm mới quyền lợi mỗi 15 phút (giảm từ mỗi giờ)
    const refreshInterval = setInterval(fetchSubscriptionBenefits, 15 * 60 * 1000);
    
    // Hàm dọn dẹp
    return () => {
      isComponentMounted = false; // Component đã unmount
      clearInterval(refreshInterval);
      if (benefitsTimeoutRef.current) {
        clearTimeout(benefitsTimeoutRef.current);
      }
    };
  }, [isAuthenticated]); // Phụ thuộc vào trạng thái xác thực
  // Áp dụng ghi đè cho các trang đặc biệt không bao giờ hiển thị quảng cáo
  const finalAdSettings = {
    ...adSettings,
    // Bắt buộc ẩn tất cả quảng cáo trên trang noaccess
    hideHomepageAds: isNoAccessPage ? true : adSettings.hideHomepageAds,
    hideVideoAds: isNoAccessPage ? true : adSettings.hideVideoAds,
  };

  return (
    <AdContext.Provider value={finalAdSettings}>
      {children}
    </AdContext.Provider>
  );
};

export default AdContextProvider;