// src/components/Admin/Layout/AdminHeader.tsx
import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  FaBars,  
  FaCog, 
  FaUser, 
  FaSignOutAlt 
} from 'react-icons/fa';
import styles from '@/styles/AdminHeader.module.css';
import { useRouter } from 'next/router';
import { useAuth } from '@/utils/auth';
import NotificationDropdown from '../Notifications/NotificationDropdown';
import { getNotifications } from '@/API/services/admin/notificationService';

const AdminHeader = () => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const router = useRouter();
  const { logout } = useAuth();
  const userDropdownRef = useRef<HTMLDivElement>(null);
  const notificationBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    fetchUnreadCount();
    
    // Set up a timer to periodically check for new notifications
    const intervalId = setInterval(fetchUnreadCount, 60000); // Check every minute
    
    return () => {
      clearInterval(intervalId);
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
      const unread = notifications.filter(n => !n.isRead).length;
      setUnreadCount(unread);
    } catch (error) {
      console.error('Error fetching unread count:', error);
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
      console.error('Logout failed:', error);
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
                <Image 
                  src="/img/avatar.png"
                  alt="Admin Avatar"
                  width={40}
                  height={40}
                  className={styles.avatar}
                />
              </div>
              <span className={styles.userName}>Admin</span>
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