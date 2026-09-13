import { useState, useEffect, createContext, useContext, useRef, useCallback } from 'react';
import { useRouter } from 'next/router';
import authService from '../API/services/authService';
import { useSession, signOut } from 'next-auth/react';

// Create authentication context
const AuthContext = createContext(null);

// Provider component to wrap the entire application
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAccountLocked, setIsAccountLocked] = useState(false);
  const [showAccountLockedBanner, setShowAccountLockedBanner] = useState(false);
  const router = useRouter();
  const wsRef = useRef(null);
  
  // Hook to access NextAuth session
  const { data: session, status: sessionStatus } = useSession();

  // Lắng nghe sự kiện storage để cập nhật trạng thái đăng nhập khi localStorage thay đổi
  useEffect(() => {
    const handleStorageChange = () => {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);
        } catch (error) {
          console.error('Error parsing user from localStorage:', error);
        }
      } else {
        setUser(null);
      }
    };

    // Lắng nghe sự kiện storage thay đổi
    window.addEventListener('storage', handleStorageChange);
    
    // Cleanup
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // Check if user is logged in when page loads or session changes
  useEffect(() => {
    const checkLoggedIn = async () => {
      try {
        // Only perform auth check on client side
        if (typeof window !== 'undefined') {
          // First check NextAuth session
          if (session?.user) {
            console.log('Found NextAuth session:', session);
            // Nếu đăng nhập bằng NextAuth (Google/Facebook)
            if (session.backendToken) {
              // Lưu token backend từ NextAuth vào localStorage và sessionStorage
              localStorage.setItem('auth_token', session.backendToken);
              sessionStorage.setItem('backendToken', session.backendToken);
              
              // Lưu thông tin người dùng với token để dễ truy cập
              const userWithToken = {
                ...session.user,
                backendToken: session.backendToken
              };
              
              localStorage.setItem('user', JSON.stringify(userWithToken));
              
              setUser(userWithToken);
              setLoading(false);
              return; // Exit early as we've set the user
            }
          }
          
          // Fallback to traditional token-based auth
          const storedToken = localStorage.getItem('token');
          const storedUser = localStorage.getItem('user');
          
          if (storedToken && storedUser) {
            try {
              const parsedUser = JSON.parse(storedUser);
              setUser(parsedUser);
            } catch (error) {
              console.error('Error parsing user from localStorage:', error);
            }
          } else {
            // Fallback to authService
            const currentUser = authService.getCurrentUser();
            if (currentUser) {
              setUser(currentUser);
            }
          }
        }
      } catch (error) {
        console.error('Error checking authentication:', error);
        setError('Không thể kiểm tra trạng thái đăng nhập');
      } finally {
        setLoading(false);
      }
    };

    checkLoggedIn();
  }, [session, sessionStatus, router.pathname]); // Thêm router.pathname để kiểm tra lại khi đổi trang

  // Modified checkAccountStatus function to prevent refresh loops
  const checkAccountStatus = useCallback(async () => {
    try {
      // Don't perform checks if we're on the account-locked page or login page
      if (typeof window !== 'undefined' && 
          (window.location.pathname === '/account-locked' ||
           window.location.pathname === '/auth/login')) {
        return;
      }
      
      if (!user) return;

      // Check localStorage first for persisted locked state
      if (localStorage.getItem('isAccountLocked') === 'true') {
        console.log('Account locked state found in localStorage');
        
        // Only redirect if we're not already on the account-locked page
        if (typeof window !== 'undefined' && window.location.pathname !== '/account-locked') {
          // Use window.location for a clean redirect without state issues
          window.location.href = '/account-locked';
        }
        return;
      }

      // Throttle API calls to prevent excessive requests
      const now = Date.now();
      const lastCheck = parseInt(localStorage.getItem('lastAccountStatusCheck') || '0');
      
      // Only check every 30 seconds at most to prevent flooding
      if (now - lastCheck < 30000) {
        return;
      }
      
      localStorage.setItem('lastAccountStatusCheck', now.toString());

      // Call the API to check account status
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/account/status`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token') || localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json',
          // Add cache-busting parameter
          'Cache-Control': 'no-cache'
        }
      });

      if (!response.ok) {
        const data = await response.json();
        if (response.status === 403 && data.isAccountLocked) {
          console.log('Account is locked according to backend check:', data);
          
          // Mark account as locked in localStorage for persistence
          localStorage.setItem('isAccountLocked', 'true');
          
          // Use direct window location change instead of router for cleaner page transition
          if (typeof window !== 'undefined' && window.location.pathname !== '/account-locked') {
            window.location.href = '/account-locked';
          }
        }
      }
    } catch (error) {
      console.error('Error checking account status:', error);
    }
  }, [user]);

  // Check account status on mount and whenever user changes
  useEffect(() => {
    if (user && user._id) {
      checkAccountStatus();
    }
  }, [user, checkAccountStatus]);

  // Setup WebSocket connection for real-time notifications
  useEffect(() => {
    // Only setup WebSocket if we have a logged in user
    if (!user || !user._id) return;

    const setupWebSocket = () => {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'localhost:5000';
      const wsProtocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
      const wsUrl = `${wsProtocol}://${apiUrl.replace(/^https?:\/\//, '')}`;
      
      console.log('Setting up WebSocket connection to:', wsUrl);
      
      // Create WebSocket connection
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;
      
      ws.onopen = () => {
        console.log('WebSocket connection established');
        // Authenticate the connection
        const token = localStorage.getItem('token') || localStorage.getItem('auth_token');
        if (token) {
          ws.send(JSON.stringify({
            type: 'authenticate',
            token
          }));
        }
      };
      
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('WebSocket message received:', data);
          
          // Handle account status changes
          if (data.type === 'account_status_changed' && data.userId === user._id) {
            console.log(`Account status changed: isActive=${data.isActive}`);
            
            if (data.isActive === false) {
              // Account has been locked
              setIsAccountLocked(true);
              setShowAccountLockedBanner(true);
              localStorage.setItem('isAccountLocked', 'true');
            } else if (data.isActive === true) {
              // Account has been unlocked
              setIsAccountLocked(false);
              setShowAccountLockedBanner(false);
              localStorage.removeItem('isAccountLocked');
              alert(data.message || 'Tài khoản của bạn đã được mở khóa và hiện đang hoạt động bình thường.');
            }
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };
      
      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
      
      ws.onclose = () => {
        console.log('WebSocket connection closed');
        // Attempt reconnection after delay if user is still logged in
        setTimeout(() => {
          if (user && document.visibilityState !== 'hidden') {
            console.log('Attempting to reconnect WebSocket...');
            setupWebSocket();
          }
        }, 5000);
      };
    };
    
    setupWebSocket();
    
    // Cleanup function
    return () => {
      if (wsRef.current) {
        console.log('Closing WebSocket connection');
        wsRef.current.close();
      }
    };
  }, [user]); // Remove the logout dependency

  // Login function
  const login = async (credentials) => {
    try {
      setError(null);
      setIsAccountLocked(false);
      console.log('Auth context: logging in with', credentials);
      const data = await authService.login(credentials);
      
      if (data.success && data.user) {
        setUser(data.user);
        return { success: true, data };
      } else {
        throw new Error('Đăng nhập thất bại: Không nhận được thông tin người dùng');
      }
    } catch (error) {
      console.error('Login error in auth context:', error);
      
      // Kiểm tra nếu tài khoản bị khóa
      if (error.response?.data?.isAccountLocked) {
        setIsAccountLocked(true);
        setError('Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên.');
        return { 
          success: false, 
          error: 'Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên.',
          isAccountLocked: true 
        };
      }
      
      setError(error.message);
      return { success: false, error: error.message || 'Đăng nhập thất bại' };
    }
  };

  // Register function
  const register = async (userData) => {
    try {
      setError(null);
      console.log('Auth context: registering with', userData);
      
      // Make sure userData has fullname field
      if (!userData.fullname) {
        throw new Error('Họ tên là bắt buộc');
      }
      
      const data = await authService.register(userData);
      console.log('Registration result:', data);
      return { success: true, data };
    } catch (error) {
      console.error('Registration error in auth context:', error);
      setError(error.message);
      return { success: false, error: error.message || 'Đăng ký thất bại' };
    }
  };

  // Logout function
  const logout = async () => {
    try {
      // Logout from both NextAuth and traditional auth
      if (session) {
        // Logout from NextAuth
        await signOut({ redirect: false });
      }
      // Logout from traditional auth
      authService.logout();
      setUser(null);
      setError(null);
      setIsAccountLocked(false);
      setShowAccountLockedBanner(false);
      localStorage.removeItem('isAccountLocked');
      router.push('/auth/login');
    } catch (error) {
      console.error('Logout error:', error);
      setError('Đăng xuất thất bại');
    }
  };

  // Update user profile
  const updateProfile = async (profileData) => {
    try {
      setError(null);
      const result = await authService.updateProfile(profileData);
      setUser(result.user);
      return { success: true, user: result.user };
    } catch (error) {
      console.error('Profile update error:', error);
      
      // Kiểm tra nếu tài khoản bị khóa
      if (error.response?.data?.isAccountLocked) {
        setIsAccountLocked(true);
        setError('Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên.');
        return { 
          success: false, 
          error: 'Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên.',
          isAccountLocked: true 
        };
      }
      
      setError(error.message);
      return { success: false, error: error.message || 'Cập nhật thông tin thất bại' };
    }
  };

  // Upload avatar
  const uploadAvatar = async (file) => {
    try {
      const result = await authService.uploadAvatar(file);
      // Update user state with new avatar
      setUser(result.user);
      return { success: true, avatarUrl: result.avatarUrl };
    } catch (error) {
      console.error('Avatar upload error:', error);
      
      // Kiểm tra nếu tài khoản bị khóa
      if (error.response?.data?.isAccountLocked) {
        setIsAccountLocked(true);
        return { 
          success: false, 
          error: 'Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên.',
          isAccountLocked: true 
        };
      }
      
      return { success: false, error: error.message || 'Tải ảnh lên thất bại' };
    }
  };

  // Refresh user data
  const refreshUser = async () => {
    try {
      if (user) {
        const updatedUser = await authService.getProfile();
        setUser(updatedUser);
        return updatedUser;
      }
      return null;
    } catch (error) {
      console.error('Error refreshing user data:', error);
      
      // Kiểm tra nếu tài khoản bị khóa
      if (error.response?.status === 403 && error.response?.data?.isAccountLocked) {
        setIsAccountLocked(true);
        setError('Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên.');
        return null;
      }
      
      return null;
    }
  };

  // Cập nhật phương thức để xử lý đường dẫn avatar đúng cách và ngăn cache
  const updateAvatarInUI = (user) => {
    if (user && user.avatar) {
      // Avatar URL với timestamp để ngăn cache
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      let avatarUrl = user.avatar;
      
      // Nếu avatar là đường dẫn tương đối (bắt đầu bằng /), thêm baseUrl
      if (avatarUrl && avatarUrl.startsWith('/')) {
        avatarUrl = `${baseUrl}${avatarUrl}`;
      }
      
      // Thêm timestamp để tránh cache
      avatarUrl = `${avatarUrl}?t=${new Date().getTime()}`;
      
      // Cập nhật avatar trong localStorage
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      localStorage.setItem('user', JSON.stringify({
        ...currentUser,
        avatar: avatarUrl
      }));
      
      // Return URL để sử dụng trong UI
      return avatarUrl;
    }
    return null;
  };  // Check the user object to understand how admin roles are stored

  
  const value = {
    user,
    loading,
    error,
    login,
    register,
    logout,
    updateProfile,
    uploadAvatar,
    refreshUser,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin' || user?.isAdmin === true, // Check both role and isAdmin properties
    isAccountLocked,
    showAccountLockedBanner,
    hideAccountLockedBanner: () => setShowAccountLockedBanner(false),
    resetAccountLockStatus: () => {
      setIsAccountLocked(false);
      setShowAccountLockedBanner(false);
      localStorage.removeItem('isAccountLocked');
    },
    status: loading ? 'loading' : user ? 'authenticated' : 'unauthenticated'
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Hook to protect routes requiring authentication
export const withAuth = (Component) => {
  const AuthenticatedComponent = (props) => {
    const { user, loading, isAccountLocked } = useAuth();
    const router = useRouter();

    useEffect(() => {
      if (!loading && !user) {
        router.replace('/auth/login');
      }
    }, [user, loading, router]);

    // Show loading state or redirect if not logged in
    if (loading) {
      return <div>Loading...</div>;
    }

    if (!user) {
      return null; // will redirect
    }

    return <Component {...props} />;
  };

  return AuthenticatedComponent;
};

// Hook to protect routes and check account status
export const withAccountStatus = (Component) => {
  const WithAccountStatus = (props) => {
    const { user, loading, isAccountLocked } = useAuth();
    const router = useRouter();
    const [showBanner, setShowBanner] = useState(false);
    
    useEffect(() => {
      // Check if user is authenticated but account is locked
      if (!loading && user && isAccountLocked) {
        console.log('Account is locked, showing banner and redirecting');
        setShowBanner(true);
        
        // Wait a moment to show the banner then redirect
        const timer = setTimeout(() => {
          router.push('/');
        }, 500);
        
        return () => clearTimeout(timer);
      }
    }, [user, loading, isAccountLocked, router]);

    // Show account locked banner if needed
    if (showBanner) {
      return (
        <div className="account-locked-container">
          <div className="account-locked-banner">
            <h2>Tài khoản đã bị khóa</h2>
            <p>Tài khoản của bạn hiện đã bị khóa. Vui lòng liên hệ quản trị viên để được hỗ trợ.</p>
            <button onClick={() => router.push('/auth/login')}>
              Quay lại trang đăng nhập
            </button>
          </div>
          <style jsx>{`
            .account-locked-container {
              position: fixed;
              top: 0;
              left: 0;
              width: 100%;
              height: 100%;
              background-color: rgba(0, 0, 0, 0.8);
              display: flex;
              align-items: center;
              justify-content: center;
              z-index: 9999;
            }
            .account-locked-banner {
              background: linear-gradient(135deg, #e50914 0%, #8b0000 100%);
              padding: 2rem;
              border-radius: 8px;
              color: white;
              text-align: center;
              max-width: 500px;
              width: 90%;
            }
            button {
              background: white;
              color: #e50914;
              border: none;
              padding: 10px 20px;
              border-radius: 4px;
              font-weight: bold;
              margin-top: 15px;
              cursor: pointer;
            }
          `}</style>
        </div>
      );
    }

    // Content only loads if user is authenticated and account is not locked
    return <Component {...props} />;
  };

  return WithAccountStatus;
};

export default useAuth;