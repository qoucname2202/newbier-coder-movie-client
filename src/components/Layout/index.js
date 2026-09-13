import { useEffect, useState } from 'react';
import Navbar from './Navbar';
import Footer from './Footer';
import { useRouter } from 'next/router';
import { useAuth } from '../../utils/auth';
import AccountLockedBanner from '../Alert/AccountLockedBanner';
import { BannerAd } from '../Advertisement';
import { useAdContext } from '../../context/AdContext';

export default function Layout({ children }) {
  const router = useRouter();
  const {  showAccountLockedBanner } = useAuth();
  const { hideHomepageAds } = useAdContext();
  const [showAds, setShowAds] = useState(true);
  
  // Kiểm tra xem đường dẫn hiện tại có phải là trang xác thực (login hoặc signup) không
  const isAuthPage = router.pathname.startsWith('/auth/');
  const isAdminPage = router.pathname.startsWith('/admin/');
  const isMoviePage = router.pathname.startsWith('/movie/');
  // Chỉ hiển thị quảng cáo trên các trang cụ thể và nếu người dùng không phải là premium
  useEffect(() => {
    // Không hiển thị quảng cáo trên các trang auth, admin, account, payment, hoặc noaccess
    // Cũng không hiển thị quảng cáo nếu người dùng có quyền lợi premium
    const shouldShowAds = !isAuthPage && 
                          !isAdminPage && 
                          !router.pathname.startsWith('/account/') &&
                          !router.pathname.startsWith('/payment/') &&
                          router.pathname !== '/noaccess' &&
                          router.pathname !== '/profile' &&
                           router.pathname !== '/premium' &&
                            router.pathname !== '/search' &&
                          !hideHomepageAds;
    console.log('[Layout] Should show ads:', shouldShowAds, 'hideHomepageAds:', hideHomepageAds, 'pathname:', router.pathname);
    setShowAds(shouldShowAds);
  }, [router.pathname, isAuthPage, isAdminPage, hideHomepageAds]);
    // Theo dõi cuộn trang để điều chỉnh banner cố định và quảng cáo
  useEffect(() => {
    const updateBodyPadding = () => {
      let paddingTop = 0;
      let paddingBottom = 0;
      
      // Điều chỉnh cho banner bị khóa tài khoản
      if (showAccountLockedBanner && !isAuthPage) {
        paddingTop += 120;
      }
      
      // Điều chỉnh cho banner quảng cáo ở đầu trang nếu đang hiển thị
      if (showAds && !isMoviePage) {
        paddingTop += 20; // Chỉ thêm một chút khoảng cách, không phải chiều cao đầy đủ vì muốn hiệu ứng overlay
      }
      
      // Điều chỉnh cho banner quảng cáo ở cuối trang nếu đang hiển thị
      if (showAds) {
        paddingBottom += 20; // Chỉ thêm một chút khoảng cách cho nội dung ở cuối
      }
      
      document.body.style.paddingTop = `${paddingTop}px`;
      document.body.style.paddingBottom = `${paddingBottom}px`;
    };
    
    updateBodyPadding();
    
    return () => {
      document.body.style.paddingTop = '0';
      document.body.style.paddingBottom = '0';
    };
  }, [showAccountLockedBanner, isAuthPage, showAds, isMoviePage]);
  
  return (
    <>
      {!isAuthPage && <Navbar />}
      
      {showAccountLockedBanner && !isAuthPage && <AccountLockedBanner />}
      
      {/* Banner quảng cáo ở đầu trang */}
      {showAds && !isMoviePage && <BannerAd position="top" />}
      
      <main>{children}</main>
      
      {/* Banner quảng cáo ở cuối trang */}
      {showAds && <BannerAd position="bottom" />}
      
      {!isAuthPage && <Footer />}
    </>
  );
}