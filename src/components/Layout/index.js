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

  const isAuthPage = router.pathname.startsWith('/auth/');
  const isAdminPage = router.pathname.startsWith('/admin/');
  const isMoviePage = router.pathname.startsWith('/movie/');
  useEffect(() => {
    const shouldShowAds = !isAuthPage &&
                          !isAdminPage &&
                          !router.pathname.startsWith('/account/') &&
                          !router.pathname.startsWith('/payment/') &&
                          router.pathname !== '/noaccess' &&
                          router.pathname !== '/profile' &&
                           router.pathname !== '/premium' &&
                            router.pathname !== '/search' &&
                          !hideHomepageAds;
    setShowAds(shouldShowAds);
  }, [router.pathname, isAuthPage, isAdminPage, hideHomepageAds]);
  useEffect(() => {
    const updateBodyPadding = () => {
      let paddingTop = 0;
      let paddingBottom = 0;

      if (showAccountLockedBanner && !isAuthPage) {
        paddingTop += 120;
      }

      if (showAds && !isMoviePage) {
        paddingTop += 20;
      }

      if (showAds) {
        paddingBottom += 20;
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

      {showAds && !isMoviePage && <BannerAd position="top" />}

      <main>{children}</main>

      {showAds && <BannerAd position="bottom" />}

      {!isAuthPage && <Footer />}
    </>
  );
}