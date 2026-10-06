import { AUTH_CONFIG } from '../../config/authConfig';

const API_URL = process.env.NEXT_PUBLIC_CORE_API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";



const authService = {
  login: async (credentials) => {
    try {
      const username = credentials.username || credentials.email || '';
      const payload = {
        username: typeof username === 'string' ? username.trim() : '',
        password: credentials.password
      };

      const loginEndpoint = AUTH_CONFIG?.api?.endpoint || `${API_URL}/auth/login`;

      const response = await fetch(loginEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify(payload)
      });

      let responseText = '';
      let data = null;

      try {
        responseText = await response.text();
        if (responseText) {
          data = JSON.parse(responseText);
        }
      } catch {
        // silent parse handling
      }

      // Check standard v1 response contract (responseStatus + responseData)
      if (data && data.responseStatus) {
        if (data.responseStatus.responseCode === "000000" && data.responseData?.access_token) {
          const accessToken = data.responseData.access_token;
          const refreshToken = data.responseData.refresh_token;

          localStorage.setItem("auth_token", accessToken);
          localStorage.setItem("token", accessToken);
          if (refreshToken) {
            localStorage.setItem("refresh_token", refreshToken);
          }

          let user = null;
          try {
            const base64Url = accessToken.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
              return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            }).join(''));

            const decoded = JSON.parse(jsonPayload);

            user = {
              _id: decoded.sub || decoded.userId || decoded.id,
              id: decoded.sub || decoded.userId || decoded.id,
              username: decoded.username || payload.username,
              fullname: decoded.username || '',
              role: decoded.role || 'USER',
              permissions: decoded.permissions || [],
              sessionId: decoded.sessionId || '',
              accountType: decoded.accountType || 'Normal',
              token: accessToken
            };
          } catch {
            user = {
              username: payload.username,
              role: 'USER',
              token: accessToken
            };
          }

          localStorage.setItem("user", JSON.stringify(user));
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new Event('storage'));
          }

          return {
            success: true,
            user: user,
            token: accessToken,
            data: data.responseData
          };
        } else {
          const errorMessage = data.responseStatus.responseMessage || 'Invalid credentials';
          throw new Error(errorMessage);
        }
      }

      // Legacy fallback (token directly in response)
      if (!response.ok) {
        let errorMessage = 'Đăng nhập thất bại';
        if (data && (data.error || data.message)) {
          errorMessage = data.error || data.message;
        } else if (responseText.includes('<!DOCTYPE')) {
          errorMessage = 'Lỗi kết nối máy chủ. Vui lòng kiểm tra lại API URL.';
        }
        throw new Error(errorMessage);
      }

      if (data && data.token) {
        localStorage.setItem("auth_token", data.token);
        localStorage.setItem("token", data.token);
        if (data.refreshToken) {
          localStorage.setItem("refresh_token", data.refreshToken);
        }

        try {
          const base64Url = data.token.split('.')[1];
          const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
          const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
          }).join(''));

          const decoded = JSON.parse(jsonPayload);
          const user = {
            _id: decoded.userId || decoded.sub,
            id: decoded.userId || decoded.sub,
            email: decoded.email || payload.username,
            username: decoded.username || payload.username,
            role: decoded.role || 'USER',
            accountType: decoded.accountType || 'Normal',
            token: data.token
          };

          localStorage.setItem("user", JSON.stringify(user));
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new Event('storage'));
          }

          return {
            success: true,
            user: user,
            token: data.token
          };
        } catch {
          throw new Error("Lỗi xử lý token từ server.");
        }
      }

      throw new Error("Không nhận được token từ máy chủ.");
    } catch (error) {
      throw error;
    }
  },

  register: async (userData) => {
    try {

      const response = await fetch(`${API_URL}/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        const contentType = response.headers.get('content-type');
        let errorMessage = 'Đăng ký thất bại';

        if (contentType && contentType.includes('application/json')) {
          const errorData = await response.json();
          errorMessage = errorData.error || errorData.message || errorMessage;
        } else {
          const textData = await response.text();
          console.error("Received non-JSON response:", textData);
          if (textData.includes('<!DOCTYPE')) {
            errorMessage = 'Lỗi kết nối máy chủ. Vui lòng kiểm tra lại API URL.';
          }
        }
        throw new Error(errorMessage);
      }

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const textData = await response.text();
        console.error("Received non-JSON response:", textData);
        throw new Error("Server trả về định dạng không phải JSON. Vui lòng kiểm tra log và cấu hình API.");
      }

      const data = await response.json();

      if (!data.message) {
        throw new Error("Không nhận được phản hồi từ server");
      }

      return {
        success: true,
        message: data.message,
        data: data
      };
    } catch (error) {
      console.error("Registration error:", error);
      throw error;
    }
  },

  logout: () => {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("user");

    if (typeof window !== 'undefined' && window.sessionStorage) {
      sessionStorage.removeItem("backendToken");
    }
  },

  refreshToken: async () => {
    try {
      const refreshToken = localStorage.getItem('refresh_token');

      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await fetch(`${API_URL}/auth/refresh-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ refreshToken })
      });

      if (!response.ok) {
        throw new Error('Failed to refresh token');
      }

      const data = await response.json();

      if (!data.token) {
        throw new Error('No token in refresh response');
      }

      localStorage.setItem('auth_token', data.token);

      return data.token;
    } catch (error) {
      console.error('Token refresh failed:', error);

      authService.logout();

      throw error;
    }
  },

  getAuthHeader: async () => {
    try {
      let token = localStorage.getItem('auth_token');

      if (!token && typeof window !== 'undefined' && window.sessionStorage) {
        token = sessionStorage.getItem('backendToken');
      }

      if (!token) {
        const userStr = localStorage.getItem('user');
        if (userStr) {
          try {
            const user = JSON.parse(userStr);
            if (user && user.backendToken) {
              token = user.backendToken;
            }
          } catch (e) {
            console.error('Error parsing user from localStorage:', e);
          }
        }
      }

      if (token) {
        const tokenParts = token.split('.');
        if (tokenParts.length === 3) {
          const payload = JSON.parse(atob(tokenParts[1]));
          const expiry = payload.exp * 1000;

          if (expiry < Date.now() + 60000) {
            try {
              token = await authService.refreshToken();
            } catch (refreshError) {
              console.error('Error refreshing token:', refreshError);
              throw new Error('Session expired. Please log in again.');
            }
          }
        }
      }

      return { 'Authorization': `Bearer ${token}` };
    } catch (error) {
      console.error('Error getting auth header:', error);
      throw error;
    }
  },

  isLoggedIn: () => {
    const token = localStorage.getItem("auth_token") ||
                 (typeof window !== 'undefined' && window.sessionStorage && window.sessionStorage.getItem('backendToken')) ||
                 (() => {
                   try {
                     const user = JSON.parse(localStorage.getItem('user') || '{}');
                     return user?.backendToken;
                   } catch (e) {
                     return null;
                   }
                 })();

    return !!token;
  },

  getCurrentUser: () => {
    try {
      const user = localStorage.getItem("user");
      return user ? JSON.parse(user) : null;
    } catch (e) {
      console.error("Error parsing user from localStorage:", e);
      return null;
    }
  },

  updateProfile: async (profileData) => {
    try {
      console.group('===== Profile Update =====');

      const headers = await authService.getAuthHeader();

      const updateData = {
        fullname: profileData.fullName,
        address: profileData.address,
        phone: profileData.phone,
        date_of_birth: profileData.dateOfBirth,
        bio: profileData.bio,
        favoriteGenres: profileData.favoriteGenres
      };

      const response = await fetch(`${API_URL}/auth/update-profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          ...headers
        },
        body: JSON.stringify(updateData)
      });

      if (!response.ok) {
        const contentType = response.headers.get('content-type');
        let errorMessage = 'Cập nhật thông tin thất bại';

        if (contentType && contentType.includes('application/json')) {
          const errorData = await response.json();
          errorMessage = errorData.error || errorData.message || errorMessage;
          console.error("Error response:", errorData);
        } else {
          const textData = await response.text();
          console.error("Received non-JSON error response:", textData);
        }

        console.groupEnd();
        throw new Error(errorMessage);
      }

      const data = await response.json();

      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      const updatedUser = {
        ...currentUser,
        fullname: data.user.fullname,
        email: data.user.email,
        phone: data.user.phone || '',
        address: data.user.address || '',
        date_of_birth: data.user.date_of_birth || '',
        bio: data.user.bio || '',
        avatar: data.user.avatar || currentUser.avatar || '',
        favoriteGenres: data.user.favoriteGenres || [],

        fullName: data.user.fullname,
        dateOfBirth: data.user.date_of_birth
      };

      localStorage.setItem('user', JSON.stringify(updatedUser));
      console.groupEnd();

      return {
        success: true,
        message: data.message || 'Cập nhật thông tin thành công',
        user: updatedUser
      };
    } catch (error) {
      console.error('Error updating profile:', error);
      console.groupEnd();
      throw error;
    }
  },

  uploadAvatar: async (file) => {
    try {

      const headers = await authService.getAuthHeader();

      const formData = new FormData();
      formData.append('avatar', file);

      const response = await fetch(`${API_URL}/auth/upload-avatar`, {
        method: 'POST',
        headers: headers,
        body: formData
      });

      if (!response.ok) {
        const contentType = response.headers.get('content-type');
        let errorMessage = 'Tải lên avatar thất bại';

        if (contentType && contentType.includes('application/json')) {
          const errorData = await response.json();
          errorMessage = errorData.error || errorData.message || errorMessage;
          console.error('Error response:', errorData);
        } else {
          const textData = await response.text();
          console.error('Received non-JSON error response:', textData);
        }

        throw new Error(errorMessage);
      }

      const data = await response.json();

      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      const updatedUser = {
        ...currentUser,
        avatar: data.avatarUrl || data.user?.avatar
      };

      localStorage.setItem('user', JSON.stringify(updatedUser));

      return {
        success: true,
        message: data.message || 'Cập nhật avatar thành công',
        avatarUrl: data.avatarUrl || data.user?.avatar,
        user: updatedUser
      };
    } catch (error) {
      console.error('Error uploading avatar:', error);
      throw error;
    }
  },

  getProfile: async () => {
    try {
      const headers = await authService.getAuthHeader();

      const response = await fetch(`${API_URL}/auth/user-detail`, {
        headers: headers
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.message || 'Không thể lấy thông tin người dùng');
      }

      localStorage.setItem('user', JSON.stringify(data.user));

      return data.user;
    } catch (error) {
      console.error('Error fetching profile:', error);
      throw error;
    }
  },

  changePassword: async (passwordData) => {
    try {
      console.group('===== Change Password =====');

      const headers = await authService.getAuthHeader();

      const dataToSend = {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
        confirmPassword: passwordData.confirmPassword || passwordData.newPassword
      };

      const response = await fetch(`${API_URL}/auth/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          ...headers
        },
        body: JSON.stringify(dataToSend)
      });

      if (!response.ok) {
        const contentType = response.headers.get('content-type');
        let errorMessage = 'Đổi mật khẩu thất bại';

        if (contentType && contentType.includes('application/json')) {
          const errorData = await response.json();
          errorMessage = errorData.error || errorData.message || errorMessage;
          console.error("Error response:", errorData);
        } else {
          const textData = await response.text();
          console.error("Received non-JSON error response:", textData);
        }

        console.groupEnd();
        throw new Error(errorMessage);
      }

      const data = await response.json();
      console.groupEnd();

      return {
        success: true,
        message: data.message || 'Đổi mật khẩu thành công'
      };
    } catch (error) {
      console.error('Error changing password:', error);
      console.groupEnd();
      throw error;
    }
  },

  deleteAccount: async () => {
    try {
      const headers = await authService.getAuthHeader();

      const response = await fetch(`${API_URL}/auth/delete-account`, {
        method: 'DELETE',
        headers: headers
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.message || 'Xóa tài khoản thất bại');
      }

      localStorage.removeItem('auth_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');

      return {
        success: true,
        message: data.message || 'Tài khoản đã được xóa thành công'
      };
    } catch (error) {
      console.error('Error deleting account:', error);
      throw error;
    }
  },

  getActivityHistory: async () => {
    try {
      const headers = await authService.getAuthHeader();

      const response = await fetch(`${API_URL}/auth/activity-history`, {
        headers: headers
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.message || 'Không thể lấy lịch sử hoạt động');
      }

      return data.activities;
    } catch (error) {
      console.error('Error fetching activity history:', error);
      throw error;
    }
  },

  getFavorites: async () => {
    try {
      const headers = await authService.getAuthHeader();

      const response = await fetch(`${API_URL}/auth/favorites`, {
        headers: headers
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.message || 'Không thể lấy danh sách yêu thích');
      }

      return data.favorites;
    } catch (error) {
      console.error('Error fetching favorites:', error);
      throw error;
    }
  },

  getWatchlist: async () => {
    try {
      const watchlistService = require('./watchlistService').default;

      return await watchlistService.getWatchlist();
    } catch (error) {
      console.error('Error fetching watchlist:', error);
      throw error;
    }
  },

  addToWatchlist: async (movieData) => {
    try {
      const watchlistService = require('./watchlistService').default;

      return await watchlistService.addToWatchlist(movieData);
    } catch (error) {
      console.error('Error adding to watchlist:', error);
      throw error;
    }
  },

  removeFromWatchlist: async (movieId) => {
    try {
      const watchlistService = require('./watchlistService').default;

      return await watchlistService.removeFromWatchlist(movieId);
    } catch (error) {
      console.error('Error removing from watchlist:', error);
      throw error;
    }
  },

  getStats: async () => {
    try {
      const headers = await authService.getAuthHeader();

      const response = await fetch(`${API_URL}/auth/stats`, {
        headers: headers
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.message || 'Không thể lấy thống kê người dùng');
      }

      return data.stats;
    } catch (error) {
      console.error('Error fetching user stats:', error);
      throw error;
    }
  },

  getUserWatchStats: async () => {
    try {
      const headers = await authService.getAuthHeader();

      const response = await fetch(`${API_URL}/user-stats/watch-stats`, {
        headers: headers
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || errData.message || `Error ${response.status}: Không thể lấy thống kê xem phim`);
      }

      const data = await response.json();

      return data.data || {};
    } catch (error) {
      console.error('Error fetching user watch stats:', error);
      return {
        totalWatchedMovies: 0,
        totalWatchedSeries: 0,
        totalWatchTime: {
          hours: 0,
          minutes: 0,
          displayText: '0 giờ 0 phút'
        },
        favoriteGenres: []
      };
    }
  },

  getUserWeeklyActivity: async () => {
    try {

      const headers = await authService.getAuthHeader();

      const response = await fetch(`${API_URL}/user-stats/weekly-activity`, {
        headers: headers
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || errData.message || `Error ${response.status}: Không thể lấy hoạt động hằng tuần`);
      }

      const data = await response.json();

      return data.data || [0, 0, 0, 0, 0, 0, 0];
    } catch (error) {
      console.error('Error fetching user weekly activity:', error);
      return [0, 0, 0, 0, 0, 0, 0];
    }
  },

  getUserGenreDistribution: async () => {
    try {

      const headers = await authService.getAuthHeader();

      const response = await fetch(`${API_URL}/user-stats/genre-distribution`, {
        headers: headers
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || errData.message || `Error ${response.status}: Không thể lấy phân bố thể loại`);
      }

      const data = await response.json();

      return data.data || [];
    } catch (error) {
      console.error('Error fetching user genre distribution:', error);
      return [];
    }
  },

  getUserAchievements: async () => {
    try {

      const headers = await authService.getAuthHeader();

      const response = await fetch(`${API_URL}/user-stats/achievements`, {
        headers: headers
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || errData.message || `Error ${response.status}: Không thể lấy thành tựu người dùng`);
      }

      const data = await response.json();

      return data.data || {
        achievements: [],
        stats: {
          moviesWatched: 0,
          seriesWatched: 0,
          userLevel: 'Người mới',
          levelProgress: 0,
          totalLikes: 0,
          totalComments: 0,
          viewCount: 0,
          completedWatchCount: 0
        }
      };
    } catch (error) {
      console.error('Error fetching user achievements:', error);
      return {
        achievements: [],
        stats: {
          moviesWatched: 0,
          seriesWatched: 0,
          userLevel: 'Người mới',
          levelProgress: 0,
          totalLikes: 0,
          totalComments: 0,
          viewCount: 0,
          completedWatchCount: 0
        }
      };
    }
  },

  checkAccountStatus: async () => {
    try {

      const headers = await authService.getAuthHeader();

      const response = await fetch(`${API_URL}/users/account/status`, {
        method: 'GET',
        headers: headers
      });

      if (response.status === 403) {
        const errorData = await response.json();
        if (errorData && errorData.isAccountLocked) {
          console.warn('Account is locked:', errorData);
          return {
            isActive: false,
            isAccountLocked: true,
            message: errorData.message || 'Tài khoản đã bị khóa'
          };
        }
      }

      if (!response.ok) {
        console.error('Error checking account status:', response.status);
        throw new Error('Không thể kiểm tra trạng thái tài khoản');
      }

      const data = await response.json();

      return {
        isActive: true,
        isAccountLocked: false,
        message: data.message || 'Tài khoản đang hoạt động'
      };
    } catch (error) {
      console.error('Error checking account status:', error);
      throw error;
    }
  }
};

export default authService;