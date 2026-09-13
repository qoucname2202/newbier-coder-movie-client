import React, { createContext, useState, useContext, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import subscriptionService from '../API/services/subscriptionService';

const AdContext = createContext({
  hideHomepageAds: false,
  hideVideoAds: false,
  isLoading: true,
  packageType: null,
  hasActiveSubscription: false,
});

export const useAdContext = () => useContext(AdContext);

export const AdContextProvider = ({ children }) => {
  const router = useRouter();

  const [adSettings, setAdSettings] = useState({
    hideHomepageAds: false,
    hideVideoAds: false,
    isLoading: true,
    packageType: null,
    hasActiveSubscription: false,
  });

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const isFetchingRef = useRef(false);
  const benefitsTimeoutRef = useRef(null);

  const isNoAccessPage = router.pathname === '/noaccess';

  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('auth_token') || localStorage.getItem('token') || localStorage.getItem('authToken');
      const isNowAuthenticated = !!token;

      setIsAuthenticated(prevState => {
        if (prevState !== isNowAuthenticated) {
          return isNowAuthenticated;
        }
        return prevState;
      });
    };

    checkAuth();

    const handleStorageChange = (e) => {
      if (e.key === 'auth_token' || e.key === 'token' || e.key === 'authToken') {
        checkAuth();
      }
    };
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      if (benefitsTimeoutRef.current) {
        clearTimeout(benefitsTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    let retryCount = 0;
    const MAX_RETRIES = 3;
    let isComponentMounted = true;

    const fetchSubscriptionBenefits = async () => {
      if (isFetchingRef.current) {
        return;
      }

      isFetchingRef.current = true;

      if (isComponentMounted) {
        setAdSettings(prev => ({ ...prev, isLoading: true }));
      }

      try {
        if (!isAuthenticated) {
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

        const benefits = await subscriptionService.getUserAdBenefits();

        if (!isComponentMounted) {
          isFetchingRef.current = false;
          return;
        }
        if (benefits.authError) {
          console.warn('[AdContext] Authentication error detected');
          if (retryCount < MAX_RETRIES) {
            retryCount++;
            benefitsTimeoutRef.current = setTimeout(fetchSubscriptionBenefits, 2000);
            return;
          } else {
            console.error('[AdContext] Max retries reached, giving up');
          }
        }

        const isPremium15k = benefits.isPremium15k === true || benefits.packageType === '682f7d849c310399aa715c9d';

        if (isPremium15k) {
        }

        const hideHomepageAds = benefits.hideHomepageAds === true || isPremium15k;
        const hideVideoAds = benefits.hideVideoAds === true || isPremium15k;
        const hasActiveSubscription = benefits.hasActiveSubscription === true;

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

        retryCount = 0;
      } catch (error) {
        console.error('[AdContext] Failed to fetch ad benefits:', error);

        if (retryCount < MAX_RETRIES) {
          retryCount++;
          const delay = 1000 * Math.pow(2, retryCount);

          if (isComponentMounted) {
            benefitsTimeoutRef.current = setTimeout(fetchSubscriptionBenefits, delay);
          }
        } else {
          if (isComponentMounted) {
            setAdSettings(prev => ({ ...prev, isLoading: false }));
          }
        }
      } finally {
        isFetchingRef.current = false;
      }
    };

    fetchSubscriptionBenefits();

    const refreshInterval = setInterval(fetchSubscriptionBenefits, 15 * 60 * 1000);

    return () => {
      isComponentMounted = false;
      clearInterval(refreshInterval);
      if (benefitsTimeoutRef.current) {
        clearTimeout(benefitsTimeoutRef.current);
      }
    };
  }, [isAuthenticated]);
  const finalAdSettings = {
    ...adSettings,
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