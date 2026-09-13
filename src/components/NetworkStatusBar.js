import React, { useEffect, useState } from 'react';
import { useNetworkStatus } from '../utils/networkStatus';
import styles from './NetworkStatusBar.module.css';

const NetworkStatusBar = () => {
  const isOnline = useNetworkStatus();
  const [visible, setVisible] = useState(false);
  const [reconnected, setReconnected] = useState(false);

  useEffect(() => {
    let timeout;
    
    if (isOnline) {
      // If we were showing the offline message and now we're online, 
      // show the reconnected message
      if (visible && !reconnected) {
        setReconnected(true);
        setVisible(true);
        
        // Hide after 3 seconds
        timeout = setTimeout(() => {
          setVisible(false);
          setReconnected(false);
        }, 3000);
      }
    } else {
      // Show offline message immediately
      setVisible(true);
      setReconnected(false);
    }
    
    return () => {
      if (timeout) clearTimeout(timeout);
    };
  }, [isOnline, visible, reconnected]);
  
  if (!visible) return null;
  
  const statusText = reconnected ? 'Đã kết nối lại' : 'Mất kết nối internet';
  const statusClass = reconnected ? styles.online : styles.offline;
  
  return (
    <div className={`${styles.statusBar} ${statusClass}`}>
      <div className={styles.statusIcon}>
        {reconnected ? (
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            width="20" 
            height="20" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
            <polyline points="22 4 12 14.01 9 11.01"></polyline>
          </svg>
        ) : (
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            width="20" 
            height="20" 
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
        )}
      </div>
      <span>{statusText}</span>
    </div>
  );
};

export default NetworkStatusBar;
