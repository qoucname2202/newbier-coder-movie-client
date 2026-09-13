/**
 * Service xử lý quản lý người dùng trong admin dashboard
 */

import axiosInstance from '../../config/axiosConfig';
import { endpoints } from '../../../config/API';

/**
 * Interface cho thông tin người dùng trong admin
 * @typedef {Object} UserForAdmin
 * @property {string} _id - ID của người dùng
 * @property {string} fullname - Họ tên người dùng
 * @property {string} email - Email người dùng
 * @property {string|Object} role - ID vai trò hoặc object vai trò
 * @property {string|Object} accountType - ID loại tài khoản hoặc object loại tài khoản
 * @property {string} [password] - Mật khẩu (chỉ khi tạo mới hoặc cập nhật)
 * @property {Date} createdAt - Ngày tạo
 * @property {Date} updatedAt - Ngày cập nhật
 * @property {boolean} isActive - Trạng thái kích hoạt
 */

/**
 * Interface cho thông tin vai trò
 * @typedef {Object} RoleForAdmin
 * @property {string} _id - ID của vai trò
 * @property {string} name - Tên vai trò
 * @property {string} description - Mô tả vai trò
 */

/**
 * Interface cho thông tin loại tài khoản
 * @typedef {Object} AccountTypeForAdmin
 * @property {string} _id - ID của loại tài khoản
 * @property {string} name - Tên loại tài khoản
 * @property {string} description - Mô tả loại tài khoản
 */

/**
 * Lấy danh sách người dùng cho trang admin
 * @param {Object} params - Tham số tìm kiếm và phân trang
 * @returns {Promise<{users: Array<UserForAdmin>, total: number, page: number, limit: number}>}
 */
export const getUsersForAdmin = async (params = {}) => {
  try {
    const response = await axiosInstance.get(endpoints.admin.users.getAll(params.page, params.limit));
    
    // Kiểm tra và xử lý cấu trúc dữ liệu
    if (response.data && response.data.data) {
      // Đảm bảo mọi giá trị isActive là boolean rõ ràng
      const users = (response.data.data.users || []).map(user => ({
        ...user,
        isActive: user.isActive === undefined ? true : Boolean(user.isActive)
      }));
      
      return {
        users,
        page: response.data.data.pagination.currentPage || 1,
        totalPages: response.data.data.pagination.totalPages || 1,
        total: response.data.data.pagination.totalUsers || 0,
        limit: response.data.data.pagination.usersPerPage || 10
      };
    }
    
    return {
      users: [],
      page: 1,
      totalPages: 1,
      total: 0,
      limit: 10
    };
  } catch (error) {
    console.error('Error fetching users for admin:', error);
    throw error;
  }
};

/**
 * Lấy thông tin chi tiết một người dùng
 * @param {string} id - ID của người dùng
 * @returns {Promise<UserForAdmin>}
 */
export const getUserByAdmin = async (id) => {
  try {
    const response = await axiosInstance.get(endpoints.admin.users.getById(id));
    return response.data;
  } catch (error) {
    console.error(`Error fetching user ${id}:`, error);
    throw error;
  }
};

/**
 * Tạo người dùng mới (dành cho admin)
 * @param {UserForAdmin} userData - Dữ liệu người dùng mới
 * @returns {Promise<UserForAdmin>}
 */
export const createUserByAdmin = async (userData) => {
  try {
    const response = await axiosInstance.post(endpoints.admin.users.create(), userData);
    return response.data;
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
};

/**
 * Cập nhật thông tin người dùng (dành cho admin)
 * @param {string} id - ID của người dùng
 * @param {Partial<UserForAdmin>} userData - Dữ liệu cập nhật
 * @returns {Promise<UserForAdmin>}
 */
export const updateUserByAdmin = async (id, userData) => {
  try {
    const response = await axiosInstance.put(endpoints.admin.users.update(id), userData);
    return response.data;
  } catch (error) {
    console.error(`Error updating user ${id}:`, error);
    throw error;
  }
};

/**
 * Xóa người dùng (dành cho admin)
 * @param {string} id - ID của người dùng
 * @returns {Promise<{success: boolean, message: string}>}
 */
export const deleteUserByAdmin = async (id) => {
  try {
    const response = await axiosInstance.delete(endpoints.admin.users.delete(id));
    return response.data;
  } catch (error) {
    console.error(`Error deleting user ${id}:`, error);
    throw error;
  }
};

/**
 * Kích hoạt hoặc vô hiệu hóa người dùng
 * @param {string} id - ID của người dùng
 * @param {boolean} isActive - Trạng thái kích hoạt mới 
 *                             (true = mở khóa/kích hoạt, false = khóa/vô hiệu hóa)
 * @returns {Promise<UserForAdmin>}
 */
export const toggleUserActiveStatus = async (id, isActive) => {
  try {
    console.log(`API call: Thay đổi trạng thái người dùng ${id} thành ${isActive ? 'kích hoạt' : 'vô hiệu hóa'}`);
    
    // Sử dụng endpoint mới toggle-status và truyền trạng thái isActive trong body
    const response = await axiosInstance.patch(
      endpoints.admin.users.toggleStatus(id), 
      { isActive }
    );
    
    console.log("API response:", response.data);
    
    // Đảm bảo isActive luôn là một boolean rõ ràng
    return {
      _id: id,
      isActive: Boolean(isActive),
      ...(response.data?.data?.user || {})
    };
  } catch (error) {
    console.error(`Error toggling user ${id} status to ${isActive ? 'active' : 'inactive'}:`, error);
    throw error;
  }
};

/**
 * Lấy danh sách vai trò
 * @returns {Promise<Array<RoleForAdmin>>}
 */
export const getRolesForAdmin = async () => {
  try {
    const response = await axiosInstance.get(endpoints.admin.roles.getAll());
    return response.data?.data?.roles || [];
  } catch (error) {
    console.error('Error fetching roles:', error);
    throw error;
  }
};

/**
 * Lấy danh sách loại tài khoản
 * @returns {Promise<Array<AccountTypeForAdmin>>}
 */
export const getAccountTypesForAdmin = async () => {
  try {
    const response = await axiosInstance.get(endpoints.admin.accountTypes.getAll());
    return response.data?.data?.accountTypes || [];
  } catch (error) {
    console.error('Error fetching account types:', error);
    throw error;
  }
};
/**
 * Tải lên avatar cho người dùng (dành cho admin)
 * @param {string} id - ID của người dùng 
 * @param {File} avatarFile - File avatar để tải lên
 * @returns {Promise<{success: boolean, message: string, avatarUrl: string}>}
 */
export const uploadUserAvatar = async (id, avatarFile) => {
  try {
    console.log('Uploading avatar for user:', id);
    console.log('Avatar file:', avatarFile.name, avatarFile.type, avatarFile.size);
    
    // Tạo FormData để gửi file
    const formData = new FormData();
    formData.append('avatar', avatarFile);
    
    const response = await axiosInstance.post(
      endpoints.admin.users.uploadAvatar(id), 
      formData, 
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    
    console.log('Upload response:', response.data);
    return response.data;
  } catch (error) {
    console.error(`Error uploading avatar for user ${id}:`, error);
    throw error;
  }
}; 