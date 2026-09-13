/**
 * Utility functions for admin access control
 */

/**
 * Check if the current user is an admin
 * @returns {boolean} - True if user is admin, false otherwise
 */
export const isAdmin = () => {
  try {
    if (typeof window === 'undefined') return false;
    
    const userStr = localStorage.getItem('user');
    if (!userStr) return false;
    
    const user = JSON.parse(userStr);
    return user.role && user.role.toLowerCase() === 'admin';
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
};

/**
 * Get current user data from localStorage
 * @returns {Object|null} - User object or null if not found
 */
export const getCurrentUser = () => {
  try {
    if (typeof window === 'undefined') return null;
    
    const userStr = localStorage.getItem('user');
    if (!userStr) return null;
    
    return JSON.parse(userStr);
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
};

/**
 * Check if user is authenticated (has valid token and user data)
 * @returns {boolean} - True if authenticated, false otherwise
 */
export const isAuthenticated = () => {
  try {
    if (typeof window === 'undefined') return false;
    
    const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
    const user = getCurrentUser();
    
    return !!(token && user);
  } catch (error) {
    console.error('Error checking authentication status:', error);
    return false;
  }
};

/**
 * Get user role
 * @returns {string} - User role or 'guest' if not authenticated
 */
export const getUserRole = () => {
  try {
    const user = getCurrentUser();
    return user?.role?.toLowerCase() || 'guest';
  } catch (error) {
    console.error('Error getting user role:', error);
    return 'guest';
  }
};

/**
 * Check if user has specific role
 * @param {string} requiredRole - The role to check for
 * @returns {boolean} - True if user has the required role
 */
export const hasRole = (requiredRole) => {
  try {
    const userRole = getUserRole();
    return userRole === requiredRole.toLowerCase();
  } catch (error) {
    console.error('Error checking user role:', error);
    return false;
  }
};

/**
 * Check if user can access admin routes
 * @returns {boolean} - True if user can access admin routes
 */
export const canAccessAdmin = () => {
  return isAuthenticated() && isAdmin();
};
