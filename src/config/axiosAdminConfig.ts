// src/config/axiosAdminConfig.ts
import axios from 'axios';

const baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// Tạo instance axios với cấu hình cơ bản cho các route admin
const axiosInstance = axios.create({
  baseURL: baseURL,
  timeout: 30000, // Timeout 30 giây
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  withCredentials: true // Cho phép CORS với credentials
});

// Thêm interceptor cho request để gắn token xác thực
axiosInstance.interceptors.request.use((config) => {
  // Lấy token từ localStorage
  const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
  
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  // Thêm header bổ sung cho CORS với các request PATCH
  if (config.method === 'patch' || config.method === 'PATCH') {
    config.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, PATCH, OPTIONS';
    config.headers['Access-Control-Allow-Origin'] = '*';
  }
  
  // Log request để debug
  console.log(`[Admin API Request] ${config.method?.toUpperCase()} ${config.url}`, 
    config.headers.Authorization ? 'Token: Yes' : 'Token: No');
  
  return config;
}, (error) => {
  console.error('[Admin API Request Error]', error);
  return Promise.reject(error);
});

// Thêm interceptor cho response để xử lý lỗi
axiosInstance.interceptors.response.use(
  (response) => {
    // Log response để debug
    console.log(`[Admin API Response] ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    // Xử lý lỗi không xác thực (status 401)
    if (error.response && error.response.status === 401) {
      console.error('[Admin API] Unauthorized access. Redirecting to login...');
      // Chỉ thực hiện phía client
      if (typeof window !== 'undefined') {
        // Xóa token xác thực
        localStorage.removeItem('auth_token');
        localStorage.removeItem('token');
        
        // Chuyển hướng đến trang đăng nhập
        window.location.href = '/login?redirect=' + encodeURIComponent(window.location.pathname);
      }
    }
    
    // Xử lý lỗi bị cấm truy cập (status 403)
    if (error.response && error.response.status === 403) {
      console.error('[Admin API] Forbidden access.');
      // Bạn có thể muốn chuyển hướng đến trang từ chối truy cập
    }
    
    return Promise.reject(error);
  }
);

export default axiosInstance;
