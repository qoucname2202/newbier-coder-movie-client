/**
 * @file Admin/AdminNotifications.tsx
 * @description Provider + hook for admin notifications with WebSocket-driven toasts.
 */
import React, { useEffect, useState, createContext, useContext, ReactNode } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useWebSocket} from '@/context/WebSocketContext';
import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead
} from '@/features/admin/services/notificationService';

export interface AdminNotificationItem {
  _id: string;
  isRead: boolean;
  [key: string]: unknown;
}

export interface AdminNotificationsContextValue {
  notifications: AdminNotificationItem[];
  unreadCount: number;
  loading: boolean;
  updateNotifications: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
}

const defaultContextValue: AdminNotificationsContextValue = {
  notifications: [],
  unreadCount: 0,
  loading: false,
  updateNotifications: async () => {},
  markAsRead: async () => {},
  markAllAsRead: async () => {}
};

const AdminNotificationsContext = createContext<AdminNotificationsContextValue>(defaultContextValue);

export interface AdminNotificationsProviderProps {
  children: ReactNode;
}

interface WSNotificationPayload {
  type: string;
  action?: string;
  data?: {
    title?: string;
    message?: string;
    name?: string;
    email?: string;
    [key: string]: unknown;
  };
  message?: string;
}

export const AdminNotificationsProvider: React.FC<AdminNotificationsProviderProps> = ({ children }) => {
  const [notifications, setNotifications] = useState<AdminNotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const { lastMessage, isConnected } = useWebSocket();
  const [isInitialRender, setIsInitialRender] = useState<boolean>(true);

  const updateNotifications = async (): Promise<void> => {
    try {
      setLoading(true);
      const fetched: AdminNotificationItem[] = (await getNotifications()) as unknown as AdminNotificationItem[];
      setNotifications(fetched);
      setUnreadCount(fetched.filter((n) => !n.isRead).length);
    } catch (error) {

    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id: string): Promise<void> => {
    try {
      await markNotificationAsRead(id);
      setNotifications((prev) => prev.map((n) => (n._id === id ? { ...n, isRead: true } : n)));
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {

    }
  };

  const markAllAsRead = async (): Promise<void> => {
    try {
      await markAllNotificationsAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (error) {

    }
  };

  useEffect(() => {
    updateNotifications();
    const intervalId = setInterval(() => {
      updateNotifications();
    }, 60000);

    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    if (isInitialRender) {
      setIsInitialRender(false);
      return;
    }

    if (!lastMessage) return;
    updateNotifications();

    const msg = lastMessage as unknown as WSNotificationPayload;
    const { type, action, data } = msg;

    let message: string = '';
    let title: string = '';
    // toast.TYPE.INFO is a numeric enum; we use a literal cast to keep both call
    // sites consistent without depending on react-toastify's enum values.
    const toastType: 'info' = 'info';

    if (type === 'movie') {
      const movieTitle: string = (data?.title as string) || (data?.name as string) || 'Một phim';
      title = 'Thông báo phim';

      switch (action) {
        case 'created':
          message = `${movieTitle} đã được thêm mới`;
          break;
        case 'updated':
          message = `${movieTitle} đã được cập nhật`;
          break;
        case 'deleted':
          message = `${movieTitle} đã bị xóa`;
          break;
        default:
          message = `Có thay đổi với ${movieTitle}`;
      }
    } else if (type === 'user') {
      const userName: string =
        (data?.name as string) || (data?.email as string) || 'Một người dùng';
      title = 'Thông báo người dùng';

      switch (action) {
        case 'created':
          message = `${userName} đã đăng ký mới`;
          break;
        case 'updated':
          message = `${userName} đã được cập nhật`;
          break;
        default:
          message = `Có thay đổi với ${userName}`;
      }
    } else if (type === 'notification') {
      title = (data?.title as string) || 'Thông báo mới';
      message = (data?.message as string) || 'Có thông báo mới';
    } else {
      title = 'Thông báo mới';
      message = msg.message || 'Có thông báo mới';
    }

    toast(
      <div>
        <strong>{title}</strong>
        <p>{message}</p>
      </div>,
      {
        type: toastType,
        position: 'top-right',
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true
      }
    );
  }, [lastMessage, isInitialRender]);

  const value: AdminNotificationsContextValue = {
    notifications,
    unreadCount,
    loading,
    updateNotifications,
    markAsRead,
    markAllAsRead
  };

  return (
    <AdminNotificationsContext.Provider value={value}>
      {children}
      <ToastContainer />
      {!isConnected && (
        <div
          className="connection-status"
          style={{
            position: 'fixed',
            bottom: '10px',
            right: '10px',
            background: '#ff5555',
            color: 'white',
            padding: '5px 10px',
            borderRadius: '4px',
            fontSize: '12px',
            zIndex: 9999
          }}
        >
          Mất kết nối với server
        </div>
      )}
    </AdminNotificationsContext.Provider>
  );
};

export const useAdminNotifications = (): AdminNotificationsContextValue =>
  useContext(AdminNotificationsContext);

const AdminNotifications: React.FC = () => {
  return null;
};

export default AdminNotifications;
