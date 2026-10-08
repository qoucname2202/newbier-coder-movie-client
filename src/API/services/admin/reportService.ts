
import axiosInstance from '../../config/axiosConfig';

interface ReportParams {
  page?: number;
  limit?: number;
  status?: string;
  type?: string;
  sortBy?: string;
  [key: string]: any;
}

interface UpdateReportData {
  status?: string;
  adminNotes?: string;
  resolution?: string;
  [key: string]: any;
}

interface ReportData {
  type: string;
  content: string;
  contentId?: string;
  userId?: string;
  targetUserId?: string;
  details?: string;
  [key: string]: any;
}

export const getReports = async (params: ReportParams = {}) => {
  try {
    const response = await axiosInstance.get('/admin/reports', { params });
    return response.data.data;
  } catch (error) {
    console.error('Error fetching reports:', error);
    throw error;
  }
};

export const getReportById = async (reportId: string) => {
  try {
    const response = await axiosInstance.get(`/admin/reports/${reportId}`);
    return response.data.data;
  } catch (error) {
    console.error('Error fetching report by ID:', error);
    throw error;
  }
};

export const updateReport = async (reportId: string, updateData: UpdateReportData) => {
  try {
    const response = await axiosInstance.patch(`/admin/reports/${reportId}`, updateData);
    return response.data.data;
  } catch (error) {
    console.error('Error updating report:', error);
    throw error;
  }
};

export const deleteReport = async (reportId: string) => {
  try {
    const response = await axiosInstance.delete(`/admin/reports/${reportId}`);
    return response.data.data;
  } catch (error) {
    console.error('Error deleting report:', error);
    throw error;
  }
};

export const getReportStats = async () => {
  try {
    const response = await axiosInstance.get('/admin/reports/stats');
    return response.data.data;
  } catch (error) {
    console.error('Error fetching report stats:', error);
    throw error;
  }
};

export const createReport = async (reportData: ReportData) => {
  try {
    const response = await axiosInstance.post('/reports', reportData);
    return response.data.data;
  } catch (error) {
    console.error('Error creating report:', error);
    throw error;
  }
};

export const getMyReports = async () => {
  try {
    const response = await axiosInstance.get('/reports/my-reports');
    return response.data.data;
  } catch (error) {
    console.error('Error fetching my reports:', error);
    throw error;
  }
};