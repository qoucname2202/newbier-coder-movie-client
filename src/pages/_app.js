import "bootstrap/dist/css/bootstrap.min.css";
import Head from "next/head";
import '../styles/animation.css';
import '../styles/subscription-details.css'; // Import CSS for subscription details
// import '../styles/admin-fix.css'; 
import '../styles/feedbackAdmin.css'; // Import CSS for feedback admin
import { SessionProvider } from "next-auth/react";
import { AuthProvider, withAccountStatus } from "../utils/auth";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from 'next/router';
import Layout from "../components/Layout";
import OfflineNotice from "../components/OfflineNotice";
import NetworkStatusBar from "../components/NetworkStatusBar";
import AdContextProvider from "../context/AdContext";
import { registerServiceWorker } from "../utils/serviceWorker";

function MyApp({ Component, pageProps: { session, ...pageProps } }) {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);  // Khởi tạo Bootstrap JS chỉ ở phía client để tránh lỗi hydration
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Sử dụng require thay vì dynamic import để tránh lỗi chunk loading
      require("bootstrap/dist/js/bootstrap.bundle.min.js");
      
      // Register service worker for offline functionality
      registerServiceWorker();
    }
  }, []);

  // Tối ưu việc lấy thông tin user từ localStorage
  const initializeUser = useCallback(() => {
    if (typeof window !== 'undefined' && !isInitialized) {
      const userData = localStorage.getItem('user');
      if (userData) {
        try {
          setUser(JSON.parse(userData));
        } catch (error) {
          console.error('Error parsing user data:', error);
        }
      }
      setIsInitialized(true);
    }
  }, [isInitialized]);

  useEffect(() => {
    initializeUser();
  }, [initializeUser]);

  const isAdminPage = router.pathname.startsWith('/admin');
  const isAuthPage = router.pathname.startsWith('/auth');
  const isSearchPage = router.pathname === '/search';

  // Tối ưu việc áp dụng layout
  const getLayout = useCallback((page) => {
    if (Component.getLayout) {
      return Component.getLayout(page);
    }
    
    if (isAdminPage) {
      return page;
    }
    
    return <Layout>{page}</Layout>;
  }, [Component, isAdminPage]);

  // Tối ưu việc wrap component với account status check
  const getWrappedComponent = useCallback(() => {
    const component = getLayout(<Component {...pageProps} />);
    
    // Không kiểm tra account status cho các trang auth, admin và search
    if (isAuthPage || isAdminPage || isSearchPage) {
      return component;
    }
    
    const AccountStatusWrapper = withAccountStatus(() => component);
    return <AccountStatusWrapper />;
  }, [Component, pageProps, getLayout, isAuthPage, isAdminPage, isSearchPage]);
  // FeedbackButton component đã được loại bỏ
  
  return (
    <SessionProvider session={session}>
      <AuthProvider>
        <AdContextProvider>          
          <Head>
            <title>MovieStreaming</title>
            <meta name="description" content="Xem phim trực tuyến miễn phí HD" />
            <meta name="viewport" content="width=device-width, initial-scale=1" />
            <link rel="icon" href="/img/icons.png" />
          </Head>          
          <NetworkStatusBar />
          <OfflineNotice />
          {getWrappedComponent()}
        </AdContextProvider>
        
        <style jsx global>{`
          body {
            background-color: #000;
            color: #fff;
            font-family: 'Helvetica Neue', Arial, sans-serif;
          }
          
          /* Custom scrollbar */
          ::-webkit-scrollbar {
            width: 8px;
          }
          ::-webkit-scrollbar-track {
            background: #111;
          }
          ::-webkit-scrollbar-thumb {
            background: #e50914;
            border-radius: 4px;
          }
        `}</style>
      </AuthProvider>
    </SessionProvider>
  );
}

export default MyApp;
