// src/components/Admin/Layout/AdminSidebar.tsx
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/router';  import {
  FaHome,
  FaFilm,
  FaUsers,
  FaTimes,
  FaTags,
  FaUserTie,
  FaGlobeAmericas,
  FaLayerGroup,
  FaCalendarAlt,
  FaSpinner
} from 'react-icons/fa';
import styles from '@/styles/AdminSidebar.module.css';
import loadingStyles from '@/styles/AdminLoading.module.css';
import axios from 'axios';
import { getApiBaseUrl } from '@/config/apiBase';
import { apiUrl } from '@/config/apiPaths';
import { getStoredAccessToken } from '@/API/services/authService';

interface MenuItem {
  path: string;
  icon: React.ElementType;
  label: string;
  badge?: number;
  section?: string;
}

const AdminSidebar = () => {
  const router = useRouter();
  const [unreadFeedbackCount, setUnreadFeedbackCount] = useState(0);
  const [pendingPremiumCount, setPendingPremiumCount] = useState(0);
  const [pendingPath, setPendingPath] = useState<string | null>(null);

  useEffect(() => {
    const handleStart = (url: string) => {
      setPendingPath(url);
    };
    const handleStop = () => {
      setPendingPath(null);
    };

    router.events.on('routeChangeStart', handleStart);
    router.events.on('routeChangeComplete', handleStop);
    router.events.on('routeChangeError', handleStop);

    return () => {
      router.events.off('routeChangeStart', handleStart);
      router.events.off('routeChangeComplete', handleStop);
      router.events.off('routeChangeError', handleStop);
    };
  }, [router]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 1024) {
        document.body.classList.remove('sidebar-open');
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const fetchUnreadFeedbackCount = async () => {
      try {
        const token = getStoredAccessToken();
        if (!token) return;

        const baseUrl = getApiBaseUrl();
        const response = await axios.get(apiUrl(`feedbackUnreadCount`), {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (response.data.success && response.data.data) {
          setUnreadFeedbackCount(response.data.data.count);
        }
      } catch (error) {

      }
    };

    fetchUnreadFeedbackCount();

    const interval = setInterval(fetchUnreadFeedbackCount, 2 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const fetchPendingPremiumCount = async () => {
      try {
        const token = getStoredAccessToken();
        if (!token) return;

        const baseUrl = getApiBaseUrl();
        const response = await fetch(apiUrl(`subscriptionAdminPendingSubscriptions`), {
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

            setPendingPremiumCount(0);
          }
        } else {

          setPendingPremiumCount(0);
        }      } catch (error: any) {

        if (error.response) {

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
    { path: '/admin', icon: FaHome, label: 'Dashboard', section: 'Tổng quan' },
    { path: '/admin/movies', icon: FaFilm, label: 'Quản Lý Phim', section: 'Nội dung & Phân loại' },
    { path: '/admin/genres', icon: FaTags, label: 'Thể Loại' },
    { path: '/admin/countries', icon: FaGlobeAmericas, label: 'Quốc Gia' },
    { path: '/admin/formats', icon: FaLayerGroup, label: 'Định Dạng Phim' },
    { path: '/admin/years', icon: FaCalendarAlt, label: 'Năm Phát Hành' },
    { path: '/admin/people', icon: FaUserTie, label: 'Diễn viên & Đạo diễn' },
    // The following pages are not enabled yet. They are kept here as a
    // reminder of the planned admin sections.
    // { path: '/admin/upcoming-movies', icon: FaPlayCircle, label: 'Upcoming movies' },
    { path: '/admin/users', icon: FaUsers, label: 'Users', section: 'Hệ thống' },
    // { path: '/admin/premium', icon: FaCrown, label: 'Premium', badge: pendingPremiumCount },
    // { path: '/admin/feedback', icon: FaEnvelope, label: 'User feedback', badge: unreadFeedbackCount },
    // { path: '/admin/reports', icon: FaExclamationTriangle, label: 'Error reports' },
    // { path: '/admin/advertisement', icon: FaAd, label: 'Advertisements' },
    // { path: '/admin/notifications/email', icon: FaBell, label: 'Email notifications' },
  ];

  let currentSection = '';

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

            const isPending = Boolean(
              pendingPath &&
              (pendingPath === item.path || (item.path !== '/admin' && pendingPath.startsWith(item.path)))
            );

            const showSection = Boolean(item.section && item.section !== currentSection);
            if (item.section) {
              currentSection = item.section;
            }

            return (
              <React.Fragment key={item.path}>
                {showSection && (
                  <div className={styles.navSectionTitle} aria-hidden="true">
                    {item.section}
                  </div>
                )}
                <div className={styles.navItem}>
                  <Link
                    href={item.path}
                    className={`${styles.navLink} ${isActive ? styles.active : ''} ${
                      isPending ? loadingStyles.sidebarItemPending : ''
                    }`}
                    onClick={() => {
                      if (!isActive) setPendingPath(item.path);
                      closeSidebar();
                    }}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    <Icon className={styles.navIcon} aria-hidden="true" />
                    <span className={styles.navText}>{item.label}</span>
                    {isPending ? (
                      <FaSpinner className={loadingStyles.sidebarSpinner} aria-label="Đang nạp trang..." />
                    ) : typeof item.badge === 'number' && item.badge > 0 ? (
                      <span className={styles.navBadge}>{item.badge}</span>
                    ) : null}
                  </Link>
                </div>
              </React.Fragment>
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