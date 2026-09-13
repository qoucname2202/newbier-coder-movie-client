import React, { useEffect, useState, createContext, useContext } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useWebSocket } from '@/contexts/WebSocketContext';
import { getNotifications, markNotificationAsRead, markAllNotificationsAsRead } from '@/API/services/admin/notificationService';

// Định nghĩa interface Thông báo
/**
 * @typedef {Object} Notification
 * @property {string} _id - ID thông báo
 * @property {string} title - Tiêu đề thông báo
 * @property {string} message - Nội dung thông báo
 * @property {string} type - Loại thông báo
 * @property {boolean} isRead - Thông báo đã được đọc hay chưa
 * @property {string} createdAt - Dấu thời gian tạo
 * @property {Object} [entity] - Thực thể liên quan
 * @property {string} [entity.id] - ID thực thể
 * @property {string} [entity.type] - Loại thực thể
 */

/**
 * @typedef {Object} AdminNotificationsContextType
 * @property {Array<Notification>} notifications - Mảng các thông báo
 * @property {number} unreadCount - Số lượng thông báo chưa đọc
 * @property {boolean} loading - Trạng thái tải
 * @property {Function} updateNotifications - Hàm để làm mới thông báo
 * @property {Function} markAsRead - Hàm để đánh dấu thông báo là đã đọc
 * @property {Function} markAllAsRead - Hàm để đánh dấu tất cả thông báo là đã đọc
 */

// Tạo context
const AdminNotificationsContext = createContext({
  notifications: [],
  unreadCount: 0,
  loading: false,
  updateNotifications: async () => {},
  markAsRead: async () => {},
  markAllAsRead: async () => {}
});

// Thành phần Provider
export const AdminNotificationsProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const { lastMessage } = useWebSocket();
  const [isInitialRender, setIsInitialRender] = useState(true);

  // Hàm để lấy thông báo
  const updateNotifications = async () => {
    try {
      setLoading(true);
      const fetchedNotifications = await getNotifications();
      setNotifications(fetchedNotifications);
      setUnreadCount(fetchedNotifications.filter(n => !n.isRead).length);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  // Hàm để đánh dấu một thông báo là đã đọc
  const markAsRead = async (id) => {
    try {
      await markNotificationAsRead(id);
      setNotifications(prev => 
        prev.map(n => n._id === id ? { ...n, isRead: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Hàm để đánh dấu tất cả thông báo là đã đọc
  const markAllAsRead = async () => {
    try {
      await markAllNotificationsAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  // Lấy thông báo ban đầu
  useEffect(() => {
    updateNotifications();
    
    // Thiết lập khoảng thời gian để kiểm tra thông báo mới mỗi phút
    const intervalId = setInterval(() => {
      updateNotifications();
    }, 60000);
    
    return () => clearInterval(intervalId);
  }, []);

  // Xử lý thông báo websocket đến
  useEffect(() => {
    // Bỏ qua việc hiển thị toast cho lần render đầu tiên
    if (isInitialRender) {
      setIsInitialRender(false);
      return;
    }

    if (lastMessage) {
      // Làm mới thông báo khi nhận được thông báo mới
      updateNotifications();
      
      const { type, action, data } = lastMessage;
      
      let message = '';
      let title = '';
      let toastType = toast.TYPE.INFO;
      
      // Xác định loại thông báo dựa trên dữ liệu nhận được
      if (type === 'movie') {
        const movieTitle = data?.title || 'Một phim';
        title = 'Thông báo phim';
        
        switch (action) {
          case 'created':
            message = `${movieTitle} đã được thêm mới`;
            toastType = toast.TYPE.SUCCESS;
            break;
          case 'updated':
            message = `${movieTitle} đã được cập nhật`;
            toastType = toast.TYPE.INFO;
            break;
          case 'deleted':
            message = `${movieTitle} đã bị xóa`;
            toastType = toast.TYPE.WARNING;
            break;
          default:
            message = `Có thay đổi với ${movieTitle}`;
        }
      } else if (type === 'user') {
        const userName = data?.name || data?.email || 'Một người dùng';
        title = 'Thông báo người dùng';
        
        switch (action) {
          case 'created':
            message = `${userName} đã đăng ký mới`;
            toastType = toast.TYPE.SUCCESS;
            break;
          case 'updated':
            message = `${userName} đã được cập nhật`;
            toastType = toast.TYPE.INFO;
            break;
          default:
            message = `Có thay đổi với ${userName}`;
        }
      } else if (lastMessage.type === 'notification') {
        // Xử lý thông báo từ hệ thống mới của chúng ta
        title = lastMessage.data?.title || 'Thông báo mới';
        message = lastMessage.data?.message || 'Có thông báo mới';
      } else {
        title = 'Thông báo mới';
        message = lastMessage.message || 'Có thông báo mới';
      }
      
      // Hiển thị thông báo toast
      toast(
        <div>
          <strong>{title}</strong>
          <p>{message}</p>
        </div>, 
        { 
          type: toastType,
          position: "top-right",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true
        }
      );
    }
  }, [lastMessage, isInitialRender]);

  const value = {
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
      {!useWebSocket().isConnected && (
        <div className="connection-status" style={{ 
          position: 'fixed', 
          bottom: '10px', 
          right: '10px', 
          background: '#ff5555', 
          color: 'white',
          padding: '5px 10px',
          borderRadius: '4px',
          fontSize: '12px',
          zIndex: 9999
        }}>
          Mất kết nối với server
        </div>
      )}
    </AdminNotificationsContext.Provider>
  );
};

// Hook tùy chỉnh để sử dụng context thông báo
export const useAdminNotifications = () => useContext(AdminNotificationsContext);

// Thành phần AdminNotifications chính
const AdminNotifications = () => {
  // Thành phần này không hiển thị bất cứ thứ gì vì Provider xử lý mọi thứ
  return null;
};

export default AdminNotifications;