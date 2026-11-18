// src/components/Admin/Layout/AdminHeader.tsx
import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  FaBars,
  FaCog,
  FaUser,
  FaSignOutAlt
} from 'react-icons/fa';
import styles from '@/styles/AdminHeader.module.css';
import { useRouter } from 'next/router';
import { useAuth } from '@/context/AuthContext';
import { getNotifications } from '@/features/admin/services/notificationService';

const AdminHeader = () => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const router = useRouter();
  const { logout } = useAuth();
  const userDropdownRef = useRef<HTMLDivElement>(null);
  const notificationBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    // Initial fetch when the header mounts.
    fetchUnreadCount();

    // Set up a timer to periodically check for new notifications.
    // We skip polling while the tab is hidden so a backgrounded Admin
    // tab doesn't burn through 60-second intervals (and spam 404s if
    // the endpoint is still missing).
    let intervalId: ReturnType<typeof setInterval> | null = null;
    const startPolling = (): void => {
      if (intervalId !== null) return;
      intervalId = setInterval(fetchUnreadCount, 60000);
    };
    const stopPolling = (): void => {
      if (intervalId !== null) {
        clearInterval(intervalId);
        intervalId = null;
      }
    };
    const handleVisibilityChange = (): void => {
      if (document.visibilityState === 'visible') {
        // Refresh on return so the count is current.
        fetchUnreadCount();
        startPolling();
      } else {
        stopPolling();
      }
    };

    if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
      startPolling();
    }
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      stopPolling();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Handle clicks outside the dropdown
  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      // Close user dropdown if clicked outside
      if (
        showDropdown &&
        userDropdownRef.current &&
        !userDropdownRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }

      // Close notification dropdown if clicked outside
      if (
        showNotifications &&
        notificationBtnRef.current &&
        !notificationBtnRef.current.contains(event.target as Node) &&
        !(event.target as Element).closest(`.${styles.notificationDropdown}`)
      ) {
        setShowNotifications(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [showDropdown, showNotifications]);

  const fetchUnreadCount = async () => {
    try {
      const notifications = await getNotifications();
      // getNotifications() returns [] on 404 (endpoint not implemented).
      // That is the documented "safe" state — the bell will show zero,
      // which matches reality. We do NOT pretend the request succeeded.
      setUnreadCount(notifications.filter((n) => !n.isRead).length);
    } catch (error) {
      // axiosConfig has already logged the upstream [API] error. Keep
      // the previous unread count visible — silently resetting to 0 on
      // a transient blip would be misleading.
      const ax = error as { response?: { status?: number } };
      if (ax?.response?.status !== 401) {
        // 401 is handled inside the interceptor (refresh-then-retry,
        // or full logout). Skip the user-facing log to avoid noise.
        // eslint-disable-next-line no-console

      }
    }
  };

  const toggleSidebar = () => {
    document.body.classList.toggle('sidebar-open');
  };
  const handleLogout = async () => {
    try {
      if (logout && typeof logout === 'function') {
        logout(); // Remove await since it might not be async in some cases
        router.push('/auth/login');
      }
    } catch (error) {

    }
  };

  // const toggleNotifications = () => {
  //   setShowNotifications(!showNotifications);
  //   if (showDropdown) setShowDropdown(false);
  // };

  const toggleUserDropdown = () => {
    setShowDropdown(!showDropdown);
    if (showNotifications) setShowNotifications(false);
  };

  // const handleNotificationClose = () => {
  //   setShowNotifications(false);
  //   fetchUnreadCount(); // Refresh count after closing dropdown
  // };

  const getPageTitle = () => {
    const path = router.pathname;
    if (path === '/admin') return 'Dashboard';
    const pageName = path.split('/').pop();
    return pageName ? pageName.charAt(0).toUpperCase() + pageName.slice(1) : 'Dashboard';
  };

  return (
    <header className={styles.header}>
      <div className={styles.headerInner}>
        <div className={styles.headerLeft}>
          <button
            className={styles.menuToggle}
            onClick={toggleSidebar}
            aria-label="Toggle Sidebar"
          >
            <FaBars />
          </button>
          <h1 className={styles.headerTitle}>{getPageTitle()}</h1>
        </div>

        <div className={styles.headerRight}>

          <div className={styles.userDropdown} ref={userDropdownRef}>
            <button
              className={styles.userButton}
              onClick={toggleUserDropdown}
              aria-expanded={showDropdown}
              aria-label="User menu"
            >
              <div className={styles.avatarWrapper}>
                <svg
                  width={34}
                  height={34}
                  viewBox="0 0 36 36"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className={styles.avatar}
                  aria-label="Admin Avatar"
                >
                  <defs>
                    <linearGradient id="adminAvatarGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#252d3d" />
                      <stop offset="100%" stopColor="#0f141f" />
                    </linearGradient>
                    <linearGradient id="adminAvatarIconGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#cbd5e1" />
                      <stop offset="100%" stopColor="#94a3b8" />
                    </linearGradient>
                  </defs>
                  <circle cx="18" cy="18" r="17.5" fill="url(#adminAvatarGrad)" stroke="rgba(255, 255, 255, 0.12)" strokeWidth="1" />
                  <circle cx="18" cy="13" r="5.25" fill="url(#adminAvatarIconGrad)" />
                  <path
                    d="M8.5 28.5C8.5 23.5 12.2 20.5 18 20.5C23.8 20.5 27.5 23.5 27.5 28.5C27.5 29.5 26.8 30 25.8 30H10.2C9.2 30 8.5 29.5 8.5 28.5Z"
                    fill="url(#adminAvatarIconGrad)"
                  />
                </svg>
              </div>
              <span className={styles.userName}>Administrator</span>
            </button>

            {showDropdown && (
              <div
                className={styles.dropdownMenu}
                role="menu"
                aria-orientation="vertical"
              >
                <Link
                  href="/admin/profile"
                  className={styles.dropdownItem}
                  role="menuitem"
                >
                  <FaUser />
                  <span>Profile</span>
                </Link>
                <Link
                  href="/admin/settings"
                  className={styles.dropdownItem}
                  role="menuitem"
                >
                  <FaCog />
                  <span>Settings</span>
                </Link>
                <div className={styles.dropdownDivider} role="separator" />
                <button
                  className={styles.dropdownItem}
                  onClick={handleLogout}
                  role="menuitem"
                >
                  <FaSignOutAlt />
                  <span>Sign Out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default AdminHeader;