import axios from '@/API/config/axiosConfig';

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
