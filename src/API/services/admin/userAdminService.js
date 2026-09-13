
import axiosInstance from '../../config/axiosConfig';
import { endpoints } from '../../../config/API';

/**
 * @typedef {Object} UserForAdmin
 * @property {string} _id
 * @property {string} fullname
 * @property {string} email
 * @property {string|Object} role
 * @property {string|Object} accountType
 * @property {string} [password]
 * @property {Date} createdAt
 * @property {Date} updatedAt
 * @property {boolean} isActive
 */

/**
 * @typedef {Object} RoleForAdmin
 * @property {string} _id
 * @property {string} name
 * @property {string} description
 */

/**
 * @typedef {Object} AccountTypeForAdmin
 * @property {string} _id
 * @property {string} name
 * @property {string} description
 */

export const getUsersForAdmin = async (params = {}) => {
  try {
    const response = await axiosInstance.get(endpoints.admin.users.getAll(params.page, params.limit));

    if (response.data && response.data.data) {
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

export const getUserByAdmin = async (id) => {
  try {
    const response = await axiosInstance.get(endpoints.admin.users.getById(id));
    return response.data;
  } catch (error) {
    console.error(`Error fetching user ${id}:`, error);
    throw error;
  }
};

export const createUserByAdmin = async (userData) => {
  try {
    const response = await axiosInstance.post(endpoints.admin.users.create(), userData);
    return response.data;
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
};

export const updateUserByAdmin = async (id, userData) => {
  try {
    const response = await axiosInstance.put(endpoints.admin.users.update(id), userData);
    return response.data;
  } catch (error) {
    console.error(`Error updating user ${id}:`, error);
    throw error;
  }
};

export const deleteUserByAdmin = async (id) => {
  try {
    const response = await axiosInstance.delete(endpoints.admin.users.delete(id));
    return response.data;
  } catch (error) {
    console.error(`Error deleting user ${id}:`, error);
    throw error;
  }
};

export const toggleUserActiveStatus = async (id, isActive) => {
  try {

    const response = await axiosInstance.patch(
      endpoints.admin.users.toggleStatus(id),
      { isActive }
    );

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

export const getRolesForAdmin = async () => {
  try {
    const response = await axiosInstance.get(endpoints.admin.roles.getAll());
    return response.data?.data?.roles || [];
  } catch (error) {
    console.error('Error fetching roles:', error);
    throw error;
  }
};

export const getAccountTypesForAdmin = async () => {
  try {
    const response = await axiosInstance.get(endpoints.admin.accountTypes.getAll());
    return response.data?.data?.accountTypes || [];
  } catch (error) {
    console.error('Error fetching account types:', error);
    throw error;
  }
};
export const uploadUserAvatar = async (id, avatarFile) => {
  try {

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

    return response.data;
  } catch (error) {
    console.error(`Error uploading avatar for user ${id}:`, error);
    throw error;
  }
}; 