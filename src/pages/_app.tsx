/**
 * @file pages/_app.tsx
 * @description Custom Next.js App component: global CSS, providers, layout, and
 * smart drag-vs-click detection across the application.
 */
import 'bootstrap/dist/css/bootstrap.min.css';
import Head from 'next/head';
import type { AppProps } from 'next/app';
import type { ReactNode } from 'react';
import { Be_Vietnam_Pro } from 'next/font/google';
import '../styles/animation.css';
import '../styles/subscription-details.css';
import '../styles/feedbackAdmin.css';
import 'react-toastify/dist/ReactToastify.css';

const beVietnamPro = Be_Vietnam_Pro({
  weight: ['400', '500', '600', '700'],
  subsets: ['latin', 'vietnamese'],
  display: 'swap',
  variable: '--font-sans',
  fallback: ['system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
});
import { SessionProvider } from 'next-auth/react';
import { AuthProvider, withAccountStatus, withAuth } from '@/context/AuthContext';
import { ReauthProvider, ReauthModal } from '@/services/http';
import { initAuthTokenListeners } from '@/auth/authToken';
import { useEffect, useState, useCallback } from 'react';

/** Obfuscation helpers — they hide the user info in DevTools */
const OBFUSCATION_KEY = process.env.NEXT_PUBLIC_SESSION_OBFUSCATE || 'xK9mP2vL';

const obfDecode = (encoded: string): string | null => {
  try {
    const decoded = decodeURIComponent(atob(encoded).split('').map(c =>
      '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
    ).join(''));
    if (decoded.startsWith(OBFUSCATION_KEY) && decoded.endsWith(OBFUSCATION_KEY)) {
      return decoded.slice(OBFUSCATION_KEY.length, -OBFUSCATION_KEY.length);
    }
    JSON.parse(decoded);
    return decoded;
  } catch {
    return null;
  }
};
import { useRouter } from 'next/router';
import Layout from '@/layouts/ClientLayout';
import OfflineNotice from '@/features/shared/components/UI/OfflineNotice';
import NetworkStatusBar from '@/features/shared/components/UI/NetworkStatusBar';
import CinemaAlert from '@/features/shared/components/UI/CinemaAlert';
import AdContextProvider from '@/context/AdContext';
import { registerServiceWorker } from '@/utils/serviceWorker';
import { cleanupLegacyImageLoadedKeys, cleanupLegacyTokenKeys } from '@/utils/localStorageCleanup';
import { ROUTES } from '@/config/routesConfig';

// Bỏ qua các lỗi unhandledRejection / runtime từ browser extensions (ví dụ: Urban VPN, adblock, v.v.)
// tránh làm ô nhiễm Next.js terminal logs và dev overlay.
if (typeof window !== 'undefined') {
  const isExtensionError = (message?: string, stack?: string, source?: string): boolean => {
    const combined = `${message || ''} ${stack || ''} ${source || ''}`;
    return (
      combined.includes('chrome-extension://') ||
      combined.includes('moz-extension://') ||
      combined.includes('safari-extension://') ||
      combined.includes('M_ID')
    );
  };

  window.addEventListener(
    'unhandledrejection',
    (event: PromiseRejectionEvent) => {
      const reason = event.reason;
      const stack = typeof reason === 'object' && reason !== null ? (reason as { stack?: string }).stack : '';
      const message =
        typeof reason === 'object' && reason !== null
          ? (reason as { message?: string }).message
          : String(reason || '');

      if (isExtensionError(message, stack)) {
        event.preventDefault();
        event.stopImmediatePropagation();
      }
    },
    true
  );

  window.addEventListener(
    'error',
    (event: ErrorEvent) => {
      if (isExtensionError(event.message, event.error?.stack, event.filename)) {
        event.preventDefault();
        event.stopImmediatePropagation();
      }
    },
    true
  );
}

type AppPageProps = AppProps & { session?: unknown };

interface PageWithLayout {
  (props: Record<string, unknown>): ReactNode;
  getLayout?: (page: ReactNode) => ReactNode;
}

function GlobalRouteProgressBar(): ReactNode {
  const router = useRouter();
  const [loading, setLoading] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    const handleStart = () => {
      setLoading(true);
      setProgress(30);
      timer = setInterval(() => {
        setProgress((prev) => (prev < 85 ? prev + 15 : prev));
      }, 150);
    };
    const handleComplete = () => {
      clearInterval(timer);
      setProgress(100);
      setTimeout(() => {
        setLoading(false);
        setProgress(0);
      }, 200);
    };

    router.events.on('routeChangeStart', handleStart);
    router.events.on('routeChangeComplete', handleComplete);
    router.events.on('routeChangeError', handleComplete);

    return () => {
      clearInterval(timer);
      router.events.off('routeChangeStart', handleStart);
      router.events.off('routeChangeComplete', handleComplete);
      router.events.off('routeChangeError', handleComplete);
    };
  }, [router]);

  if (!loading && progress === 0) return null;

  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={progress}
      aria-label="Đang chuyển trang"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: `${progress}%`,
        height: '3px',
        background: 'linear-gradient(90deg, #e50914, #ff5964, #ffb300)',
        boxShadow: '0 0 10px rgba(229, 9, 20, 0.8), 0 0 5px rgba(255, 89, 100, 0.6)',
        zIndex: 99999,
        transition: 'width 0.2s ease, opacity 0.2s ease',
        pointerEvents: 'none',
      }}
    />
  );
}

function MyApp({ Component, pageProps: { session, ...pageProps } }: AppPageProps): ReactNode {
  const router = useRouter();
  const [user, setUser] = useState<unknown>(null);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      require('bootstrap/dist/js/bootstrap.bundle.min.js');
      registerServiceWorker();
      cleanupLegacyImageLoadedKeys();
      cleanupLegacyTokenKeys();

      // Khởi tạo Access Token Lifecycle & Background Tab Resilient Listeners
      const cleanupAuthListeners = initAuthTokenListeners();
      return () => {
        cleanupAuthListeners();
      };
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    let startX = 0;
    let startY = 0;
    let isDragging = false;
    const DRAG_THRESHOLD = 8;

    const handlePointerDown = (e: PointerEvent): void => {
      startX = e.clientX;
      startY = e.clientY;
      isDragging = false;
    };

    const handlePointerMove = (e: PointerEvent): void => {
      if (e.pointerType === 'mouse' && e.buttons === 0) return;
      const diffX = Math.abs(e.clientX - startX);
      const diffY = Math.abs(e.clientY - startY);
      if (diffX > DRAG_THRESHOLD || diffY > DRAG_THRESHOLD) isDragging = true;
    };

    const handleClickCapture = (e: MouseEvent): void => {
      if (isDragging) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        isDragging = false;
      }
    };

    window.addEventListener('pointerdown', handlePointerDown, { capture: true, passive: true });
    window.addEventListener('pointermove', handlePointerMove, { capture: true, passive: true });
    window.addEventListener('click', handleClickCapture, { capture: true });
    return () => {
      window.removeEventListener('pointerdown', handlePointerDown, { capture: true });
      window.removeEventListener('pointermove', handlePointerMove, { capture: true });
      window.removeEventListener('click', handleClickCapture, { capture: true });
    };
  }, []);

  const initializeUser = useCallback((): void => {
    if (typeof window !== 'undefined' && !isInitialized) {
      // Read the user from sessionStorage (fallback to localStorage for
      // the "remember me" mode)
      const remembered = localStorage.getItem('remember_me') === '1';
      const userData = (() => {
        if (window.sessionStorage) {
          const ss = window.sessionStorage.getItem('user');
          if (ss) {
            const decoded = obfDecode(ss) || ss;
            if (decoded) return decoded;
          }
        }
        if (remembered) {
          const ls = localStorage.getItem('user');
          if (ls) {
            const decoded = obfDecode(ls) || ls;
            if (decoded) return decoded;
          }
        }
        return null;
      })();
      if (userData) {
        try {
          setUser(JSON.parse(userData));
        } catch (err) {
          // ignore
        }
      }
      setIsInitialized(true);
    }
  }, [isInitialized]);

  useEffect(() => {
    initializeUser();
  }, [initializeUser]);

  const isAdminPage = router.pathname.startsWith(ROUTES.ADMIN_PREFIX) || router.pathname.startsWith('/admin');
  const isAuthPage = router.pathname.startsWith(ROUTES.AUTH_PREFIX);
  const isSearchPage = router.pathname === ROUTES.SEARCH;

  // Routes that must be reachable WITHOUT being logged in. Everything
  // else is gated by `withAuth`, which redirects to /auth/login when
  // the AuthContext reports no user. This prevents the home (and any
  // other client-side page) from rendering the mock-movie fallback
  // before login.
  const PUBLIC_ROUTE_PREFIXES = [
    ROUTES.AUTH_PREFIX,
    ROUTES.ADMIN_PREFIX,
    ROUTES.ACCOUNT_PREFIX,
    ROUTES.PAYMENT_PREFIX,
    ROUTES.NO_ACCESS,
    ROUTES.NOT_FOUND,
    ROUTES.MAINTENANCE,
    ROUTES.SERVICE_UNAVAILABLE
  ] as const;
  const isPublicRoute = PUBLIC_ROUTE_PREFIXES.some((prefix) =>
    router.pathname.startsWith(prefix)
  );

  const PageWithLayout = Component as unknown as PageWithLayout;

  const getLayout = useCallback((page: ReactNode): ReactNode => {
    if (PageWithLayout.getLayout) return PageWithLayout.getLayout(page);
    if (isAdminPage) return page;
    return <Layout Component={Component}>{page}</Layout>;
  }, [Component, isAdminPage]);

  const getWrappedComponent = useCallback((): ReactNode => {
    const component = getLayout(<Component {...pageProps} />);
    if (isAuthPage || isAdminPage || isSearchPage) return component;
    const AccountStatusWrapper = withAccountStatus((): ReactNode => component);
    if (isPublicRoute) return <AccountStatusWrapper />;
    const AuthWrapper = withAuth((): ReactNode => <AccountStatusWrapper />);
    return <AuthWrapper />;
  }, [Component, pageProps, getLayout, isAuthPage, isAdminPage, isSearchPage, isPublicRoute]);

  return (
    <SessionProvider session={session as never}>
      <AuthProvider>
        <ReauthProvider>
          <AdContextProvider>
            <div className={`${beVietnamPro.variable} ${beVietnamPro.className} app-typography-wrapper`}>
              <Head>
                <title>MovieStreaming</title>
                <meta name="description" content="Xem phim trực tuyến miễn phí HD" />
                <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
                <link rel="icon" href="/img/icons.png" />
              </Head>
              <GlobalRouteProgressBar />
              <NetworkStatusBar />
              <OfflineNotice />
              <CinemaAlert />
              <ReauthModal />
              {getWrappedComponent()}
            </div>
          </AdContextProvider>
        </ReauthProvider>

        <style jsx global>{`
          :root {
            --font-sans: ${beVietnamPro.style.fontFamily}, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
          }
          html {
            font-size: 100%;
          }
          body {
            background-color: #121212;
            color: #e6e6e6;
            font-family: var(--font-sans), system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
            font-size: clamp(1rem, 0.96rem + 0.2vw, 1.0625rem);
            line-height: 1.6;
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
            text-align: left;
          }
          .app-typography-wrapper {
            font-family: inherit;
            min-height: 100%;
            display: flex;
            flex-direction: column;
          }
          /* Headings: responsive scale with clamp and comfortable line-heights */
          h1, .h1 {
            font-size: clamp(1.75rem, 1.25rem + 2vw, 3rem);
            line-height: 1.25;
            font-weight: 700;
            color: #ffffff;
            letter-spacing: -0.02em;
          }
          h2, .h2 {
            font-size: clamp(1.375rem, 1.15rem + 1vw, 2rem);
            line-height: 1.28;
            font-weight: 600;
            color: #ffffff;
            letter-spacing: -0.015em;
          }
          h3, .h3 {
            font-size: clamp(1.125rem, 1rem + 0.5vw, 1.5rem);
            line-height: 1.3;
            font-weight: 600;
            color: #ffffff;
          }
          h4, .h4 {
            font-size: clamp(1rem, 0.95rem + 0.3vw, 1.25rem);
            line-height: 1.35;
            font-weight: 600;
            color: #f8fafc;
          }
          h5, .h5 {
            font-size: 1.0625rem;
            line-height: 1.4;
            font-weight: 600;
            color: #f1f5f9;
          }
          h6, .h6 {
            font-size: 0.9375rem;
            line-height: 1.4;
            font-weight: 600;
            color: #e2e8f0;
          }
          /* Paragraphs and text blocks: max line length for readability */
          p, .prose, .reading-text, .describe, .movie-description, .movieDescription, .storyline {
            max-width: 70ch;
            text-align: left;
            line-height: 1.6;
          }
          /* Form inputs: min 16px to prevent iOS Safari auto-zoom */
          input, select, textarea, .form-control {
            font-size: 1rem !important;
          }
          /* Touch targets: min 44px on mobile devices */
          @media (max-width: 768px) {
            button:not(.btn-close):not([class*='slick']):not([class*='dot']):not([class*='badge']):not([class*='pill']):not([class*='carousel']),
            .btn,
            .nav-link,
            a[role='button'] {
              min-height: 44px;
              min-width: 44px;
              display: inline-flex;
              align-items: center;
              justify-content: center;
            }
          }
          html, body {
            scrollbar-width: none;
            -ms-overflow-style: none;
            overflow-x: hidden;
          }
          ::-webkit-scrollbar { display: none; width: 0px; background: transparent; }
          /* The tables that are allowed to scroll horizontally keep a
             visible scrollbar: the global rule above hides every
             scrollbar, which would make an overflowing table look
             truncated with no way to reach the hidden columns. */
          [class*='tableResponsive']::-webkit-scrollbar {
            display: block;
            height: 8px;
            width: 8px;
          }
          [class*='tableResponsive']::-webkit-scrollbar-track {
            background: #141416;
          }
          [class*='tableResponsive']::-webkit-scrollbar-thumb {
            background: rgba(255, 255, 255, 0.18);
            border-radius: 4px;
          }
          /* High contrast muted and secondary text (WCAG AA >= 4.5:1) */
          .text-muted, .text-secondary, .form-text { color: #94a3b8 !important; }
          ::placeholder, .form-control::placeholder, input::placeholder, textarea::placeholder {
            color: #94a3b8 !important;
            opacity: 1 !important;
          }
          .form-control:focus::placeholder, input:focus::placeholder {
            color: #cbd5e1 !important;
            opacity: 1 !important;
          }
        `}</style>
      </AuthProvider>
    </SessionProvider>
  );
}

export default MyApp;
