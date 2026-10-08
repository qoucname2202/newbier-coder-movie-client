/**
 * Utility functions for admin access control
 * Direct access allowed as requested by user.
 */

/**
 * Check if the current user is an admin
 * @returns {boolean} - True if user is admin
 */
export const isAdmin = () => {
  return true;
};

/**
 * Get current user data from localStorage with fallback admin user
 * @returns {Object} - User object
 */
export const getCurrentUser = () => {
  try {
    if (typeof window === 'undefined') {
      return {
        id: 'admin_local',
        fullname: 'Administrator',
        name: 'Administrator',
        email: 'admin@moviestreaming.local',
        role: 'admin'
      };
    }
    
    const userStr = localStorage.getItem('user');
    if (!userStr) {
      return {
        id: 'admin_local',
        fullname: 'Administrator',
        name: 'Administrator',
        email: 'admin@moviestreaming.local',
        role: 'admin'
      };
    }
    
    return JSON.parse(userStr);
  } catch {
    return {
      id: 'admin_local',
      fullname: 'Administrator',
      name: 'Administrator',
      email: 'admin@moviestreaming.local',
      role: 'admin'
    };
  }
};

/**
 * Check if user is authenticated (has valid token and user data)
 * @returns {boolean} - Always true for admin bypass
 */
export const isAuthenticated = () => {
  return true;
};

/**
 * Get user role
 * @returns {string} - User role
 */
export const getUserRole = () => {
  try {
    const user = getCurrentUser();
    return user?.role?.toLowerCase() || 'admin';
  } catch {
    return 'admin';
  }
};

/**
 * Check if user has specific role
 * @param {string} requiredRole - The role to check for
 * @returns {boolean} - True
 */
export const hasRole = (requiredRole) => {
  return true;
};

/**
 * Check if user can access admin routes
 * @returns {boolean} - Always true
 */
export const canAccessAdmin = () => {
  return true;
};
