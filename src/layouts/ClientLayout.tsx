import React, { useEffect, useState } from 'react';
import Navbar from '@/features/shared/components/Layout/Navbar';
import Footer from '@/features/shared/components/Layout/Footer';
import { useRouter } from 'next/router';
// .js deps - cast for strict TS
import { useAuth as useAuthRaw } from '@/context/AuthContext';
const { useAuth } = { useAuth: useAuthRaw as unknown as () => AuthApi };
import AccountLockedBanner from '@/features/shared/components/Alert/AccountLockedBanner';
import { BannerAd } from '@/features/shared/components/Ad';
import { useAdContext as useAdContextRaw } from '@/context/AdContext';
const { useAdContext } = { useAdContext: useAdContextRaw as unknown as () => AdContextApi };
import { ROUTES, isAdVisibleForPath, isFullBleedRoute } from '@/config/routesConfig';

/** ---------- local types ---------- */
interface AuthApi {
  showAccountLockedBanner?: boolean;
  [key: string]: unknown;
}

interface AdContextApi {
  hideHomepageAds?: boolean;
  [key: string]: unknown;
}

interface LayoutPaddingInput {
  isHomePage: boolean;
  isAuthPage: boolean;
  isMoviePage: boolean;
  showAccountLockedBanner: boolean;
  showAds: boolean;
}

interface LayoutPadding {
  paddingTop: number;
  paddingBottom: number;
}

export interface LayoutProps {
  children: React.ReactNode;
  Component?: React.ComponentType & { fullBleed?: boolean; isFullBleed?: boolean };
}

/**
 * Calculates dynamic body padding based on active route and banner states.
 */
const calculateLayoutPadding = ({
  isHomePage,
  isAuthPage,
  isMoviePage,
  showAccountLockedBanner,
  showAds
}: LayoutPaddingInput): LayoutPadding => {
  let paddingTop = 0;
  let paddingBottom = 0;

  if (showAccountLockedBanner && !isAuthPage) {
    paddingTop += 120;
  }

  if (!isHomePage && showAds && !isMoviePage) {
    paddingTop += 20;
  }

  if (showAds) {
    paddingBottom += 20;
  }

  return { paddingTop, paddingBottom };
};

/**
 * Main application Layout wrapper.
 */
const Layout: React.FC<LayoutProps> = ({ children, Component }) => {
  const router = useRouter();
  const { showAccountLockedBanner } = useAuth();
  const { hideHomepageAds } = useAdContext();
  const [showAds, setShowAds] = useState<boolean>(true);

  const pathname: string = router.pathname || '';
  const isAuthPage: boolean = pathname.startsWith(ROUTES.AUTH_PREFIX);
  const isMoviePage: boolean = pathname.startsWith(ROUTES.MOVIE_PREFIX);
  const isHomePage: boolean = pathname === ROUTES.HOME;

  // Centralized full-bleed check
  const isFullBleed: boolean =
    isFullBleedRoute(pathname) ||
    Boolean(Component?.fullBleed) ||
    Boolean(Component?.isFullBleed);

  // Standard pages require clearance for the fixed 64px Navbar
  const needsHeaderOffset: boolean = !isAuthPage && !isFullBleed;

  // Synchronize ad visibility state
  useEffect(() => {
    setShowAds(isAdVisibleForPath(pathname, Boolean(hideHomepageAds)));
  }, [pathname, hideHomepageAds]);

  // Adjust body padding dynamically
  useEffect(() => {
    const { paddingTop, paddingBottom } = calculateLayoutPadding({
      isHomePage,
      isAuthPage,
      isMoviePage,
      showAccountLockedBanner: Boolean(showAccountLockedBanner),
      showAds
    });

    document.body.style.paddingTop = `${paddingTop}px`;
    document.body.style.paddingBottom = `${paddingBottom}px`;

    return () => {
      document.body.style.paddingTop = '0px';
      document.body.style.paddingBottom = '0px';
    };
  }, [isHomePage, isAuthPage, isMoviePage, showAccountLockedBanner, showAds]);

  return (
    <>
      {!isAuthPage && <Navbar />}

      {showAccountLockedBanner && !isAuthPage && <AccountLockedBanner />}

      {showAds && !isMoviePage && !isHomePage && <BannerAd position="top" />}

      <main className={`layout-main ${needsHeaderOffset ? 'standard-page-main' : 'full-bleed-main'}`}>
        {children}
      </main>

      {showAds && <BannerAd position="bottom" />}

      {!isAuthPage && <Footer />}

      <style jsx global>{`
        :root {
          --navbar-height: calc(64px + env(safe-area-inset-top, 0px));
        }

        .layout-main {
          margin: 0;
          width: 100%;
          box-sizing: border-box;
        }

        .standard-page-main {
          padding-top: var(--navbar-height, 64px);
          min-height: calc(100vh - var(--navbar-height, 64px));
          min-height: calc(100dvh - var(--navbar-height, 64px));
        }

        .full-bleed-main {
          padding-top: 0;
          overflow-x: hidden;
        }
      `}</style>
    </>
  );
};

export default Layout;
