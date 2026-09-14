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
import { ROUTES } from "../config/routesConfig";

function MyApp({ Component, pageProps: { session, ...pageProps } }) {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);
  useEffect(() => {
    if (typeof window !== 'undefined') {
      require("bootstrap/dist/js/bootstrap.bundle.min.js");

      // Register service worker for offline functionality
      registerServiceWorker();
    }
  }, []);

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

  const isAdminPage = router.pathname.startsWith(ROUTES.ADMIN_PREFIX);
  const isAuthPage = router.pathname.startsWith(ROUTES.AUTH_PREFIX);
  const isSearchPage = router.pathname === ROUTES.SEARCH;

  const getLayout = useCallback((page) => {
    if (Component.getLayout) {
      return Component.getLayout(page);
    }

    if (isAdminPage) {
      return page;
    }

    return <Layout>{page}</Layout>;
  }, [Component, isAdminPage]);

  const getWrappedComponent = useCallback(() => {
    const component = getLayout(<Component {...pageProps} />);

    if (isAuthPage || isAdminPage || isSearchPage) {
      return component;
    }

    const AccountStatusWrapper = withAccountStatus(() => component);
    return <AccountStatusWrapper />;
  }, [Component, pageProps, getLayout, isAuthPage, isAdminPage, isSearchPage]);

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
            font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
          }

          /* Seamless full-bleed layout: hide visible scrollbar tracks across all modern browsers */
          html, body {
            scrollbar-width: none; /* Firefox */
            -ms-overflow-style: none; /* IE and Edge */
            overflow-x: hidden;
          }
          ::-webkit-scrollbar {
            display: none; /* Chrome, Safari, Opera */
            width: 0px;
            background: transparent;
          }
        `}</style>
      </AuthProvider>
    </SessionProvider>
  );
}

export default MyApp;
