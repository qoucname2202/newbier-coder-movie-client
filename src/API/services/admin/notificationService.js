
import axios from '@/API/config/axiosConfig';

export const getNotifications = async () => {
  try {
    // const response = await axios.get('/admin/notifications');
    // return response.data;

    return [
      {
        id: '1',
        title: 'Người dùng mới',
        message: 'Có 5 người dùng mới đăng ký trong hôm nay',
        type: 'info',
        createdAt: new Date(),
        isRead: false
      },
      {
        id: '2',
        title: 'Phim mới được thêm',
        message: 'Phim "Avengers: Endgame" đã được thêm vào hệ thống',
        type: 'success',
        createdAt: new Date(Date.now() - 3600000),
        isRead: false
      },
      {
        id: '3',
        title: 'Lỗi hệ thống',
        message: 'Đã phát hiện lỗi trong quá trình xử lý thanh toán',
        type: 'error',
        createdAt: new Date(Date.now() - 86400000),
        isRead: true
      }
    ];
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return [];
  }
};

export const markNotificationAsRead = async (id) => {
  try {
    // await axios.put(`/admin/notifications/${id}/read`);
    return true;
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return false;
  }
};

export const markAllNotificationsAsRead = async () => {
  try {
    // await axios.put('/admin/notifications/read-all');
    return true;
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    return false;
  }
};

export const sendMaintenanceNotification = async (data) => {
  try {
    const response = await axios.post('/admin/notifications/send-maintenance', data);
    return response.data;
  } catch (error) {
    console.error('Error sending maintenance notification:', error);
    throw error;
  }
};

export const sendCustomNotification = async (data) => {
  try {
    const response = await axios.post('/admin/notifications/send-custom', data);
    return response.data;
  } catch (error) {
    console.error('Error sending custom notification:', error);
    throw error;
  }
};

export const getNotificationHistory = async (params = {}) => {
  try {
    const { page = 1, limit = 10 } = params;
    const response = await axios.get('/admin/notifications/history', {
      params: { page, limit }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching notification history:', error);
    throw error;
  }
};