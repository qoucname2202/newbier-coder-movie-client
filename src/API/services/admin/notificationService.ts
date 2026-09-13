import axios from 'axios';
import { API_URL } from '../../../config/API';

// Định nghĩa kiểu dữ liệu cho thông báo
export interface Notification {
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

// Lấy danh sách thông báo
export const getNotifications = async (): Promise<Notification[]> => {
  try {
    const response = await axios.get(`${API_URL}/admin/notifications`, {
      withCredentials: true,
    });
    return response.data.data || [];
  } catch (error) {
    console.error('Error fetching notifications:', error);
    throw error;
  }
};

// Đánh dấu thông báo đã đọc
export const markNotificationAsRead = async (notificationId: string): Promise<void> => {
  try {
    await axios.put(
      `${API_URL}/admin/notifications/${notificationId}/read`,
      {},
      { withCredentials: true }
    );
  } catch (error) {
    console.error('Error marking notification as read:', error);
    throw error;
  }
};

// Xóa thông báo
export const deleteNotification = async (notificationId: string): Promise<void> => {
  try {
    await axios.delete(`${API_URL}/admin/notifications/${notificationId}`, {
      withCredentials: true,
    });
  } catch (error) {
    console.error('Error deleting notification:', error);
    throw error;
  }
};

// Đọc tất cả thông báo
export const markAllNotificationsAsRead = async (): Promise<void> => {
  try {
    await axios.put(
      `${API_URL}/admin/notifications/read-all`,
      {},
      { withCredentials: true }
    );
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    throw error;
  }
};