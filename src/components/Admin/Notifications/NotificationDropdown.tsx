import React, { useEffect, useState } from 'react';
import styles from '@/styles/NotificationDropdown.module.css';
import { FaCheckCircle, FaTrashAlt, FaClock, FaFilm, FaUser, FaExclamationTriangle } from 'react-icons/fa';
import moment from 'moment';
import { markNotificationAsRead, deleteNotification, getNotifications } from '@/API/services/admin/notificationService';

interface Notification {
  _id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
  entity?: {
    id: string;
    type: string;
  };
}

interface NotificationDropdownProps {
  isOpen: boolean;
  onClose: () => void;
}

const NotificationDropdown: React.FC<NotificationDropdownProps> = ({ isOpen, onClose }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const data = await getNotifications();
      setNotifications(data);
      setError(null);
    } catch (err) {
      setError('Failed to load notifications');
      console.error('Error fetching notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      await markNotificationAsRead(id);
      setNotifications(prevNotifications => 
        prevNotifications.map(notification => 
          notification._id === id ? { ...notification, isRead: true } : notification
        )
      );
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteNotification(id);
      setNotifications(prevNotifications => 
        prevNotifications.filter(notification => notification._id !== id)
      );
    } catch (err) {
      console.error('Error deleting notification:', err);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'movie':
        return <FaFilm className={styles.notificationIcon} />;
      case 'user':
        return <FaUser className={styles.notificationIcon} />;
      case 'alert':
        return <FaExclamationTriangle className={styles.notificationIcon} />;
      default:
        return <FaClock className={styles.notificationIcon} />;
    }
  };

  const handleViewDetails = (notification: Notification) => {
    if (!notification.isRead) {
      handleMarkAsRead(notification._id);
    }
    
    if (notification.entity) {
      // Điều hướng đến trang chi tiết tương ứng
      switch(notification.entity.type) {
        case 'movie':
          window.location.href = `/admin/movies/edit/${notification.entity.id}`;
          break;
        case 'user':
          window.location.href = `/admin/users/edit/${notification.entity.id}`;
          break;
        default:
          break;
      }
    }
    
    onClose();
  };

  const handleMarkAllAsRead = async () => {
    try {
      const unreadIds = notifications
        .filter(notification => !notification.isRead)
        .map(notification => notification._id);
      
      if (unreadIds.length === 0) return;
      
      // Thực hiện đánh dấu tất cả đã đọc thông qua API
      await Promise.all(unreadIds.map(id => markNotificationAsRead(id)));
      
      setNotifications(prevNotifications => 
        prevNotifications.map(notification => ({ ...notification, isRead: true }))
      );
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
    }
  };

  if (!isOpen) return null;
  
  return (
    <div className={styles.dropdownContainer}>
      <div className={styles.dropdownHeader}>
        <h3 className={styles.dropdownTitle}>Notifications</h3>
        {notifications.some(notification => !notification.isRead) && (
          <button 
            className={styles.markAllReadBtn}
            onClick={handleMarkAllAsRead}
          >
            Mark all as read
          </button>
        )}
      </div>
      <div className={styles.dropdownBody}>
        {loading ? (
          <div className={styles.loadingState}>
            <p>Loading notifications...</p>
          </div>
        ) : error ? (
          <div className={styles.errorState}>
            <p>{error}</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className={styles.emptyState}>
            <p>No notifications to display</p>
          </div>
        ) : (
          notifications.map(notification => (
            <div 
              key={notification._id} 
              className={`${styles.notificationItem} ${notification.isRead ? '' : styles.unread}`}
              onClick={() => handleViewDetails(notification)}
            >
              <div className={styles.notificationContent}>
                <div className={styles.notificationHeader}>
                  {getNotificationIcon(notification.type)}
                  <h4 className={styles.notificationTitle}>{notification.title}</h4>
                </div>
                <p className={styles.notificationMessage}>{notification.message}</p>
                <div className={styles.notificationMeta}>
                  <span className={styles.notificationTime}>
                    {moment(notification.createdAt).fromNow()}
                  </span>
                </div>
              </div>
              <div className={styles.notificationActions} onClick={e => e.stopPropagation()}>
                {!notification.isRead && (
                  <button
                    className={styles.actionButton}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMarkAsRead(notification._id);
                    }}
                    title="Mark as read"
                  >
                    <FaCheckCircle />
                  </button>
                )}
                <button
                  className={styles.actionButton}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(notification._id);
                  }}
                  title="Delete notification"
                >
                  <FaTrashAlt />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
      <div className={styles.dropdownFooter}>
        <a href="/admin/notifications" className={styles.viewAllLink} onClick={(e) => {e.preventDefault(); onClose();}}>
          View all notifications
        </a>
      </div>
    </div>
  );
};

export default NotificationDropdown;