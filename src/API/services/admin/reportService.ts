/**
 * Service cho quản lý báo cáo - Kết nối với API backend
 */

import axiosInstance from '../../config/axiosConfig';

// Định nghĩa kiểu dữ liệu cho các tham số báo cáo
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

/**
 * Lấy danh sách báo cáo với phân trang và lọc
 * @param {ReportParams} params - Các tham số lọc và phân trang
 * @returns {Promise<Object>} - Dữ liệu báo cáo trả về từ API
 */
export const getReports = async (params: ReportParams = {}) => {
  try {
    const response = await axiosInstance.get('/admin/reports', { params });
    return response.data.data;
  } catch (error) {
    console.error('Error fetching reports:', error);
    throw error;
  }
};

/**
 * Lấy chi tiết báo cáo theo ID
 * @param {string} reportId - ID của báo cáo
 * @returns {Promise<Object>} - Chi tiết báo cáo
 */
export const getReportById = async (reportId: string) => {
  try {
    const response = await axiosInstance.get(`/admin/reports/${reportId}`);
    return response.data.data;
  } catch (error) {
    console.error('Error fetching report by ID:', error);
    throw error;
  }
};

/**
 * Cập nhật trạng thái báo cáo
 * @param {string} reportId - ID của báo cáo
 * @param {UpdateReportData} updateData - Dữ liệu cập nhật (status, adminNotes)
 * @returns {Promise<Object>} - Báo cáo đã cập nhật
 */
export const updateReport = async (reportId: string, updateData: UpdateReportData) => {
  try {
    const response = await axiosInstance.patch(`/admin/reports/${reportId}`, updateData);
    return response.data.data;
  } catch (error) {
    console.error('Error updating report:', error);
    throw error;
  }
};

/**
 * Xóa báo cáo
 * @param {string} reportId - ID của báo cáo
 * @returns {Promise<Object>} - Thông báo kết quả
 */
export const deleteReport = async (reportId: string) => {
  try {
    const response = await axiosInstance.delete(`/admin/reports/${reportId}`);
    return response.data.data;
  } catch (error) {
    console.error('Error deleting report:', error);
    throw error;
  }
};

/**
 * Lấy thống kê báo cáo
 * @returns {Promise<Object>} - Dữ liệu thống kê
 */
export const getReportStats = async () => {
  try {
    const response = await axiosInstance.get('/admin/reports/stats');
    return response.data.data;
  } catch (error) {
    console.error('Error fetching report stats:', error);
    throw error;
  }
};

/**
 * Tạo báo cáo mới (dành cho người dùng)
 * @param {ReportData} reportData - Dữ liệu báo cáo mới
 * @returns {Promise<Object>} - Báo cáo đã tạo
 */
export const createReport = async (reportData: ReportData) => {
  try {
    const response = await axiosInstance.post('/reports', reportData);
    return response.data.data;
  } catch (error) {
    console.error('Error creating report:', error);
    throw error;
  }
};

/**
 * Lấy danh sách báo cáo của người dùng hiện tại
 * @returns {Promise<Array>} - Danh sách báo cáo
 */
export const getMyReports = async () => {
  try {
    const response = await axiosInstance.get('/reports/my-reports');
    return response.data.data;
  } catch (error) {
    console.error('Error fetching my reports:', error);
    throw error;
  }
};