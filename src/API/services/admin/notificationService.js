/**
 * Service xử lý thông báo cho admin dashboard
 */

import axios from '@/API/config/axiosConfig';

/**
 * Định nghĩa kiểu dữ liệu thông báo
 * @typedef {Object} Notification
 * @property {string} id - ID của thông báo
 * @property {string} title - Tiêu đề thông báo
 * @property {string} message - Nội dung thông báo
 * @property {string} type - Loại thông báo (info, warning, success, error)
 * @property {Date} createdAt - Thời gian tạo
 * @property {boolean} isRead - Trạng thái đọc
 */

/**
 * Lấy danh sách thông báo cho admin
 * @returns {Promise<Array<Notification>>} Danh sách thông báo
 */
export const getNotifications = async () => {
  try {
    // Trong tương lai, bạn có thể thay thế đoạn code này bằng 
    // gọi API thực tế từ server
    // const response = await axios.get('/admin/notifications');
    // return response.data;
    
    // Hiện tại trả về dữ liệu mẫu để test UI
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

/**
 * Đánh dấu thông báo đã đọc
 * @param {string} id - ID của thông báo
 * @returns {Promise<boolean>} Kết quả cập nhật
 */
export const markNotificationAsRead = async (id) => {
  try {
    // Trong tương lai, thay thế bằng API call thực tế
    // await axios.put(`/admin/notifications/${id}/read`);
    console.log(`Marked notification ${id} as read`);
    return true;
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return false;
  }
};

/**
 * Đánh dấu tất cả thông báo đã đọc
 * @returns {Promise<boolean>} Kết quả cập nhật
 */
export const markAllNotificationsAsRead = async () => {
  try {
    // Trong tương lai, thay thế bằng API call thực tế
    // await axios.put('/admin/notifications/read-all');
    console.log('Marked all notifications as read');
    return true;
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    return false;
  }
};

/**
 * Gửi thông báo bảo trì hệ thống tới tất cả người dùng qua email
 * @param {Object} data - Dữ liệu thông báo bảo trì
 * @param {string} data.subject - Tiêu đề email
 * @param {string} data.message - Nội dung thông báo
 * @param {string} data.maintenanceTime - Thời gian bảo trì
 * @param {string} data.expectedDuration - Thời gian dự kiến hoàn thành
 * @param {string} [data.userGroup='all'] - Nhóm người dùng (all, premium, free)
 * @returns {Promise<Object>} Kết quả gửi thông báo
 */
export const sendMaintenanceNotification = async (data) => {
  try {
    const response = await axios.post('/admin/notifications/send-maintenance', data);
    return response.data;
  } catch (error) {
    console.error('Error sending maintenance notification:', error);
    throw error;
  }
};

/**
 * Gửi thông báo tùy chỉnh tới tất cả người dùng qua email
 * @param {Object} data - Dữ liệu thông báo tùy chỉnh
 * @param {string} data.subject - Tiêu đề email
 * @param {string} data.message - Nội dung thông báo
 * @param {string} [data.htmlContent] - Nội dung HTML (tùy chọn)
 * @param {string} [data.userGroup='all'] - Nhóm người dùng (all, premium, free)
 * @returns {Promise<Object>} Kết quả gửi thông báo
 */
export const sendCustomNotification = async (data) => {
  try {
    const response = await axios.post('/admin/notifications/send-custom', data);
    return response.data;
  } catch (error) {
    console.error('Error sending custom notification:', error);
    throw error;
  }
};

/**
 * Lấy lịch sử gửi thông báo email
 * @param {Object} params - Các tham số truy vấn
 * @param {number} [params.page=1] - Trang hiện tại
 * @param {number} [params.limit=10] - Số lượng bản ghi mỗi trang
 * @returns {Promise<Object>} Kết quả với danh sách lịch sử và thông tin phân trang
 */
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