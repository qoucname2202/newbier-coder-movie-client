import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const getAuthHeader = () => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) {
      return { Authorization: `Bearer ${token}` };
    }
  }
  return {};
};

const statsService = {
  getUserWatchStats: async () => {
    try {
      const response = await axios.get(`${API_URL}/user-stats/watch-stats`, {
        headers: getAuthHeader()
      });
      return response.data.data;
    } catch (error) {
      console.error('Error fetching watch stats:', error);
      return null;
    }
  },

  getUserWeeklyActivity: async () => {
    try {
      const response = await axios.get(`${API_URL}/user-stats/weekly-activity`, {
        headers: getAuthHeader()
      });
      return response.data.data;
    } catch (error) {
      console.error('Error fetching weekly activity:', error);
      return null;
    }
  },

  getUserGenreDistribution: async () => {
    try {
      const response = await axios.get(`${API_URL}/user-stats/genre-distribution`, {
        headers: getAuthHeader()
      });
      return response.data.data;
    } catch (error) {
      console.error('Error fetching genre distribution:', error);
      return null;
    }
  },

  getUserDailyViewingTime: async () => {
    try {
      const response = await axios.get(`${API_URL}/user-stats/daily-viewing-time`, {
        headers: getAuthHeader()
      });
      return response.data.data;
    } catch (error) {
      console.error('Error fetching daily viewing time:', error);
      return null;
    }
  },

  getUserSeriesProgress: async (seriesId) => {
    try {
      const response = await axios.get(`${API_URL}/user-stats/series-progress/${seriesId}`, {
        headers: getAuthHeader()
      });
      return response.data.data;
    } catch (error) {
      console.error('Error fetching series progress:', error);
      return null;
    }
  },

  getUserInProgressSeries: async () => {
    try {
      const response = await axios.get(`${API_URL}/user-stats/in-progress-series`, {
        headers: getAuthHeader()
      });
      return response.data.data;
    } catch (error) {
      console.error('Error fetching in-progress series:', error);
      return null;
    }
  },

  getUserAchievements: async () => {
    try {
      const response = await axios.get(`${API_URL}/user-stats/achievements`, {
        headers: getAuthHeader()
      });
      return response.data.data;
    } catch (error) {
      console.error('Error fetching achievements:', error);
      return null;
    }
  },

  getUserRatedMovies: async () => {
    try {
      const headers = getAuthHeader();
      if (!Object.keys(headers).length) {
        throw new Error('Bạn chưa đăng nhập');
      }

      const response = await axios.get(`${API_URL}/ratings/user`, {
        headers: headers
      });

      if (response.data.success) {
        return response.data.data || null;
      } else {
        console.warn('API responded with error:', response.data.message);
        return null;
      }
    } catch (error) {
      console.error('Error fetching user rated movies:', error);
      return null;
    }
  }
};

export default statsService;