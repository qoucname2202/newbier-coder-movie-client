/**
 * @file Layout/index.js
 * @description Root layout component managing the navigation bar, alerts, advertisements, and body spacing.
 */

import React, { useEffect, useState } from 'react';
import Navbar from './Navbar';
import Footer from './Footer';
import { useRouter } from 'next/router';
import { useAuth } from '../../utils/auth';
import AccountLockedBanner from '../Alert/AccountLockedBanner';
import { BannerAd } from '../Advertisement';
import { useAdContext } from '../../context/AdContext';
import { ROUTES, isAdVisibleForPath } from '../../config/routesConfig';

/**
 * Calculates dynamic body padding based on active route and banner states.
 * Ensures the homepage maintains a full-bleed cinematic hero view with zero top padding.
 * @param {Object} params - Route and banner configuration parameters.
 * @param {boolean} params.isHomePage - True if current route is the homepage ('/').
 * @param {boolean} params.isAuthPage - True if current route belongs to auth flows.
 * @param {boolean} params.isMoviePage - True if current route is a movie watch/detail page.
 * @param {boolean} params.showAccountLockedBanner - True if account lock warning is active.
 * @param {boolean} params.showAds - True if banner ads should be displayed.
 * @returns {{ paddingTop: number, paddingBottom: number }} Object containing calculated top and bottom padding in pixels.
 */
const calculateLayoutPadding = ({
  isHomePage,
  isAuthPage,
  isMoviePage,
  showAccountLockedBanner,
  showAds
}) => {
  let paddingTop = 0;
  let paddingBottom = 0;

  // Account locked banner requires top clearance on all non-auth pages
  if (showAccountLockedBanner && !isAuthPage) {
    paddingTop += 120;
  }

  // Home page requires strict 0px top padding for full-bleed hero backdrop under transparent navbar
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
 * @param {Object} props - React props.
 * @param {React.ReactNode} props.children - Page contents.
 * @returns {JSX.Element} Rendered application layout.
 */
export default function Layout({ children }) {
  const router = useRouter();
  const { showAccountLockedBanner } = useAuth();
  const { hideHomepageAds } = useAdContext();
  const [showAds, setShowAds] = useState(true);

  const pathname = router.pathname || '';
  const isAuthPage = pathname.startsWith(ROUTES.AUTH_PREFIX);
  const isMoviePage = pathname.startsWith(ROUTES.MOVIE_PREFIX);
  const isHomePage = pathname === ROUTES.HOME;

  // Synchronize ad visibility state using centralized route config
  useEffect(() => {
    setShowAds(isAdVisibleForPath(pathname, hideHomepageAds));
  }, [pathname, hideHomepageAds]);

  // Adjust body padding dynamically while preserving full-bleed for the homepage
  useEffect(() => {
    const { paddingTop, paddingBottom } = calculateLayoutPadding({
      isHomePage,
      isAuthPage,
      isMoviePage,
      showAccountLockedBanner,
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

      {/* Top Banner Ad: only shown on non-homepage and non-movie pages to protect full-bleed hero */}
      {showAds && !isMoviePage && !isHomePage && <BannerAd position="top" />}

      <main className={isHomePage ? 'full-bleed-main' : ''}>{children}</main>

      {showAds && <BannerAd position="bottom" />}

      {!isAuthPage && <Footer />}

      <style jsx global>{`
        .full-bleed-main {
          margin: 0;
          padding: 0;
          width: 100%;
          overflow-x: hidden;
        }
      `}</style>
    </>
  );
}