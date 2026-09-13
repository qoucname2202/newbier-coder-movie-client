// Network status utility functions
/**
 * A custom hook to detect network status changes
 * @returns {Boolean} True if online, false if offline
 */
import { useState, useEffect } from 'react';

export const useNetworkStatus = () => {
  const [isOnline, setIsOnline] = useState(
    typeof window !== 'undefined' ? window.navigator.onLine : true
  );

  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return;

    // Handler for online status
    const handleOnline = () => {
      setIsOnline(true);
    };

    // Handler for offline status
    const handleOffline = () => {
      setIsOnline(false);
    };

    // Custom app events from service worker
    const handleAppOnline = () => {
      setIsOnline(true);
    };

    const handleAppOffline = () => {
      setIsOnline(false);
    };

    // Add event listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('appOnline', handleAppOnline);
    window.addEventListener('appOffline', handleAppOffline);

    // Check network status using fetch to verify true connectivity
    const checkRealConnectivity = async () => {
      try {
        // Send a small request to check real connectivity
        // We use a timestamp to avoid cache
        const response = await fetch(`/api/ping?_=${Date.now()}`, {
          method: 'GET',
          cache: 'no-cache',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        if (response.ok) {
          setIsOnline(true);
        } else {
          setIsOnline(false);
        }
      } catch (error) {
        setIsOnline(false);
      }
    };

    // Initial check
    checkRealConnectivity();

    // Regular check every 30 seconds
    const intervalId = setInterval(checkRealConnectivity, 30000);

    // Cleanup event listeners on component unmount
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('appOnline', handleAppOnline);
      window.removeEventListener('appOffline', handleAppOffline);
      clearInterval(intervalId);
    };
  }, []);

  return isOnline;
};
