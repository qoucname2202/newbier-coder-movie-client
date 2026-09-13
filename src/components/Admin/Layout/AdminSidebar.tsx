// src/components/Admin/Layout/AdminSidebar.tsx
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/router';  import {
  FaHome,
  FaFilm,
  FaUsers,
  FaCrown,
  FaPlayCircle,
  FaTimes,
  FaEnvelope,
  FaExclamationTriangle,
  FaAd,
  FaBell
} from 'react-icons/fa';
import styles from '@/styles/AdminSidebar.module.css';
import axios from 'axios';

interface MenuItem {
  path: string;
  icon: React.ElementType;
  label: string;
  badge?: number;
}

const AdminSidebar = () => {
  const router = useRouter();
  const [unreadFeedbackCount, setUnreadFeedbackCount] = useState(0);
  const [pendingPremiumCount, setPendingPremiumCount] = useState(0);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768) {
        document.body.classList.remove('sidebar-open');
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const fetchUnreadFeedbackCount = async () => {
      try {
        const token = localStorage.getItem('auth_token');
        if (!token) return;

        const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
        const response = await axios.get(`${baseUrl}/feedback/unread/count`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (response.data.success && response.data.data) {
          setUnreadFeedbackCount(response.data.data.count);
        }
      } catch (error) {
        console.error('Error fetching unread feedback count:', error);
      }
    };

    fetchUnreadFeedbackCount();

    const interval = setInterval(fetchUnreadFeedbackCount, 2 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const fetchPendingPremiumCount = async () => {
      try {
        const token = localStorage.getItem('auth_token') || localStorage.getItem('authToken');
        if (!token) return;

        const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
        const response = await fetch(`${baseUrl}/subscription/admin/pending-subscriptions`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            const subscriptions = data.data?.subscriptions || [];
            setPendingPremiumCount(subscriptions.length);
          } else {
            console.error('API returned success: false', data);
            setPendingPremiumCount(0);
          }
        } else {
          console.error(`API request failed with status ${response.status}`);
          setPendingPremiumCount(0);
        }      } catch (error: any) {
        console.error('Error fetching pending premium count:', error);
        if (error.response) {
          console.error('Response error:', error.response.status, error.response.data);
        }
        setPendingPremiumCount(0);
      }
    };

    fetchPendingPremiumCount();

    const interval = setInterval(fetchPendingPremiumCount, 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const closeSidebar = () => {
    document.body.classList.remove('sidebar-open');
  };  const menuItems: MenuItem[] = [
    { path: '/admin', icon: FaHome, label: 'Dashboard' },
    { path: '/admin/movies', icon: FaFilm, label: 'Movies' },
    { path: '/admin/upcoming-movies', icon: FaPlayCircle, label: 'Phim sắp ra mắt' },
    { path: '/admin/users', icon: FaUsers, label: 'Users' },
    { path: '/admin/premium', icon: FaCrown, label: 'Premium', badge: pendingPremiumCount },
    { path: '/admin/feedback', icon: FaEnvelope, label: 'Góp ý người dùng', badge: unreadFeedbackCount },
    { path: '/admin/reports', icon: FaExclamationTriangle, label: 'Báo cáo lỗi' },
    { path: '/admin/advertisement', icon: FaAd, label: 'Quảng cáo' },
    { path: '/admin/notifications/email', icon: FaBell, label: 'Gửi thông báo' },
  ];

  return (
    <>
      <div className={styles.sidebar}>
        <div className={styles.brand}>
          <div className={styles.brandImageWrapper}>
            <Image
              src="/img/icons.png"
              alt="Admin Logo"
              width={35}
              height={35}
              className={styles.brandImage}
            />
          </div>
          <h1 className={styles.brandText}>Movie Admin</h1>
          <button
            className="btn btn-link d-block d-md-none position-absolute end-0 top-0 mt-2 me-2 text-white"
            onClick={closeSidebar}
            aria-label="Close sidebar"
          >
            <FaTimes />
          </button>
        </div>

        <nav className={styles.nav} role="navigation" aria-label="Main navigation">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.path === '/admin'
              ? router.pathname === '/admin'
              : router.pathname.startsWith(item.path);

            return (
              <div className={styles.navItem} key={item.path}>
                <Link
                  href={item.path}
                  className={`${styles.navLink} ${isActive ? styles.active : ''}`}
                  onClick={closeSidebar}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <Icon className={styles.navIcon} aria-hidden="true" />
                  <span className={styles.navText}>{item.label}</span>
                  {typeof item.badge === 'number' && item.badge > 0 && (
                    <span className={styles.navBadge}>{item.badge}</span>
                  )}
                </Link>
              </div>
            );
          })}
        </nav>
      </div>

      <div
        className={styles.overlay}
        onClick={closeSidebar}
        role="presentation"
        aria-hidden="true"
      />
    </>
  );
};

export default AdminSidebar;