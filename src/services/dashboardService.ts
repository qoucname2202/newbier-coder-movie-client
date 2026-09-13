import axiosInstance from '../API/config/axiosConfig';

interface DashboardStats {
  totalMovies: number;
  newUsers: number;
  engagementRate: number;
  reports: number;
  totalUsers: number;
  totalViews: number;
  totalComments: number;
}

/**
 * Lấy thông tin thống kê cho dashboard admin
 */
export const getDashboardStats = async (): Promise<DashboardStats> => {
  try {
    const response = await axiosInstance.get('/admin/dashboard/stats');
    return response.data;
  } catch (error) {
    console.error('Lỗi khi lấy thống kê dashboard:', error);
    throw error;
  }
};