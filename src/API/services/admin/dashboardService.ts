
import axiosInstance from '../../config/axiosConfig';

export const getDashboardStats = async () => {
  try {
    const response = await axiosInstance.get('/admin/dashboard/stats');

    if (response.data && response.data.data) {
      return response.data.data;
    }

    return response.data;
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    throw error;
  }
};

export const getMovieStatsByPeriod = async (period = 'week') => {
  try {
    const response = await axiosInstance.get(`/admin/dashboard/views-by-day`);

    if (response.data && response.data.data) {
      return response.data.data;
    }

    return response.data;
  } catch (error) {
    console.error(`Error fetching movie stats for period ${period}:`, error);
    throw error;
  }
};

export const getUserStatsByPeriod = async (period = 'week') => {
  try {
    const response = await axiosInstance.get(`/admin/dashboard/stats`);

    if (response.data && response.data.data) {
      return {
        labels: ["Hiện tại"],
        data: [response.data.data.newUsers || 0]
      };
    }

    return response.data;
  } catch (error) {
    console.error(`Error fetching user stats for period ${period}:`, error);
    throw error;
  }
};

export const getMovieStatsByGenre = async () => {
  try {
    const response = await axiosInstance.get('/admin/dashboard/genre-distribution');

    if (response.data && response.data.data) {
      return response.data.data;
    }

    return response.data;
  } catch (error) {
    console.error('Error fetching movie stats by genre:', error);
    throw error;
  }
};

export const getAnalyticsData = async () => {
  try {
    const response = await axiosInstance.get('/admin/dashboard/analytics');

    if (response.data && response.data.data) {
      return response.data.data;
    }

    return response.data;
  } catch (error) {
    console.error('Error fetching analytics data:', error);
    throw error;
  }
};

export const getRecentFeedbacks = async (limit = 5) => {
  try {
    const response = await axiosInstance.get(`/admin/dashboard/recent-feedbacks?limit=${limit}`);

    if (response.data && response.data.data) {
      return response.data.data.recentFeedbacks || [];
    }

    return [];
  } catch (error) {
    console.error('Error fetching recent feedbacks:', error);
    throw error;
  }
};

export const getFeedbackStats = async () => {
  try {
    const response = await axiosInstance.get('/admin/dashboard/feedback-stats');

    if (response.data && response.data.data) {
      return response.data.data;
    }

    return {
      byType: [],
      byStatus: [],
      byDay: {
        labels: [],
        data: []
      }
    };
  } catch (error) {
    console.error('Error fetching feedback stats:', error);
    throw error;
  }
};