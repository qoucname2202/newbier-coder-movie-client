import React, { useEffect, useState } from 'react';
import { useNetworkStatus } from '../utils/networkStatus';
import { useRouter } from 'next/router';
import Head from 'next/head';
import styles from '../components/OfflineNotice.module.css';

const OfflinePage = () => {
  const isOnline = useNetworkStatus();
  const router = useRouter();
  const [countdown, setCountdown] = useState(null);
  const [autoRedirect, setAutoRedirect] = useState(true);

  // If we're back online, redirect to home after countdown
  useEffect(() => {
    if (isOnline && autoRedirect) {
      // Set a 3 second countdown before redirecting
      setCountdown(3);
      
      const intervalId = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(intervalId);
            router.push('/');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      
      return () => clearInterval(intervalId);
    }
  }, [isOnline, router, autoRedirect]);

  const cancelAutoRedirect = () => {
    setAutoRedirect(false);
    setCountdown(null);
  };

  return (
    <>
      <Head>
        <title>Không có kết nối | MovieStreaming</title>
        <meta name="robots" content="noindex" />
      </Head>
      <div className={styles.offlineContainer}>
        <div className={styles.offlineContent}>
          <div className={styles.iconContainer}>
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              width="80" 
              height="80" 
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
          
          {isOnline && countdown !== null ? (
            <div className={styles.reconnectedMessage}>
              <div className={styles.pulseDot}></div>
              <p>Đã kết nối lại! Chuyển hướng trong {countdown} giây...</p>
              <button 
                className={styles.cancelButton}
                onClick={cancelAutoRedirect}
              >
                Hủy
              </button>
            </div>
          ) : (
            <p className={styles.infoText}>
              Ứng dụng sẽ tự động kết nối lại khi mạng được khôi phục
            </p>
          )}
          
          <div className={styles.buttonGroup}>
            <button 
              className={styles.retryButton}
              onClick={() => window.location.reload()}
            >
              Thử lại
            </button>
            
            {isOnline && (
              <button 
                className={styles.homeButton}
                onClick={() => router.push('/')}
              >
                Trang chủ
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

// Make this page not use the default layout
OfflinePage.getLayout = (page) => page;

export default OfflinePage;
