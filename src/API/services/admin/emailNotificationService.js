import axios from '@/API/config/axiosConfig';

/**
 * Định nghĩa kiểu dữ liệu cho lịch sử gửi thông báo
 * @typedef {Object} NotificationHistory
 * @property {string} _id - ID của lịch sử thông báo
 * @property {string} subject - Tiêu đề email
 * @property {string} message - Nội dung thông báo
 * @property {string} type - Loại thông báo (maintenance, custom)
 * @property {string} userGroup - Nhóm người dùng (all, premium, free)
 * @property {string} sentBy - ID của admin đã gửi
 * @property {number} recipientCount - Số lượng người nhận
 * @property {string} status - Trạng thái gửi (success, failed, partial)
 * @property {Date} createdAt - Thời gian tạo
 * @property {Object} metadata - Dữ liệu bổ sung
 */

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
    
    // Chuyển đổi cấu trúc dữ liệu để phù hợp với frontend
    // Backend trả về: { success: true, data: { logs: [...], pagination: {...} } }
    // Frontend mong đợi: { success: true, data: [...], pages: number }
    if (response.data && response.data.success && response.data.data) {
      const { logs, pagination } = response.data.data;
      return {
        success: response.data.success,
        data: logs || [],
        pages: pagination ? pagination.pages : 1
      };
    }
    
    return response.data;
  } catch (error) {
    console.error('Error fetching notification history:', error);
    throw error;
  }
};
