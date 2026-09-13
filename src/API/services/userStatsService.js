
import axiosInstance from '../config/axiosConfig';

export const getUserWatchStats = async () => {
  try {
    const response = await axiosInstance.get('/api/user-stats/watch-stats');

    if (response.data && response.data.data) {
      return response.data.data;
    }

    return {
      totalWatchedMovies: 0,
      totalWatchedSeries: 0,
      totalWatchTime: {
        hours: 0,
        minutes: 0,
        displayText: "0 giờ 0 phút"
      },
      favoriteGenres: [],
      recentHistory: []
    };
  } catch (error) {
    console.error('Error fetching user watch stats:', error);
    return {
      totalWatchedMovies: 0,
      totalWatchedSeries: 0,
      totalWatchTime: {
        hours: 0,
        minutes: 0,
        displayText: "0 giờ 0 phút"
      },
      favoriteGenres: [],
      recentHistory: []
    };
  }
};

export const getUserActivityByWeek = async () => {
  try {
    const response = await axiosInstance.get('/api/user-stats/activity-week');

    if (response.data && response.data.data) {
      return response.data.data;
    }

    return {
      'CN': 0,
      'T2': 0,
      'T3': 0,
      'T4': 0,
      'T5': 0,
      'T6': 0,
      'T7': 0
    };
  } catch (error) {
    console.error('Error fetching user activity by week:', error);
    return {
      'CN': 0,
      'T2': 0,
      'T3': 0,
      'T4': 0,
      'T5': 0,
      'T6': 0,
      'T7': 0
    };
  }
};

export const getUserGenreDistribution = async () => {
  try {
    const response = await axiosInstance.get('/api/user-stats/genre-distribution');

    if (response.data && response.data.data) {
      return response.data.data;
    }

    return [];
  } catch (error) {
    console.error('Error fetching user genre distribution:', error);
    return [];
  }
};