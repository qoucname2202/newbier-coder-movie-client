import React, { useEffect, useState } from 'react';
import { useNetworkStatus } from '../utils/networkStatus';
import styles from './OfflineNotice.module.css';
import { useRouter } from 'next/router';

const OfflineNotice = () => {
  const isOnline = useNetworkStatus();
  const router = useRouter();
  const [offlineDuration, setOfflineDuration] = useState(0);
  const [showNotice, setShowNotice] = useState(false);
  
  useEffect(() => {
    let intervalId;
    
    if (!isOnline) {
      // Show the notice immediately when offline
      setShowNotice(true);
      
      // Start counting the offline duration
      intervalId = setInterval(() => {
        setOfflineDuration(prev => prev + 1);
      }, 1000);
      
      // After 5 seconds offline, redirect to offline page
      // (unless we're already on the offline page)
      if (router.pathname !== '/offline') {
        const timeoutId = setTimeout(() => {
          router.push('/offline');
        }, 5000);
        
        return () => {
          clearTimeout(timeoutId);
          clearInterval(intervalId);
        };
      }
    } else {
      // When back online, keep showing the notice for 2 seconds
      if (showNotice) {
        const timeoutId = setTimeout(() => {
          setShowNotice(false);
          setOfflineDuration(0);
        }, 2000);
        
        return () => clearTimeout(timeoutId);
      }
    }
    
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isOnline, router, showNotice]);
  
  // Don't show the notice if we're on the offline page
  if (router.pathname === '/offline') {
    return null;
  }
  
  if (!showNotice) {
    return null;
  }

  return (
    <div className={styles.offlineContainer}>
      <div className={styles.offlineContent}>
        <div className={styles.iconContainer}>
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            width="64" 
            height="64" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="1" y1="1" x2="23" y2="23"></line>
            <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55"></path>
            <path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39"></path>
            <path d="M10.71 5.05A16 16 0 0 1 22.58 9"></path>
            <path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88"></path>
            <path d="M8.53 16.11a6 6 0 0 1 6.95 0"></path>
            <line x1="12" y1="20" x2="12.01" y2="20"></line>
          </svg>
        </div>
        <h2>Không có kết nối internet</h2>
        <p>Vui lòng kiểm tra kết nối internet của bạn và thử lại</p>
        <button 
          className={styles.retryButton}
          onClick={() => window.location.reload()}
        >
          Thử lại
        </button>
      </div>
    </div>
  );
};

export default OfflineNotice;
