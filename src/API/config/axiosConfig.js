import axios from 'axios';

const baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// Khởi tạo axios instance với cấu hình cơ bản
const axiosInstance = axios.create({
  baseURL: baseURL,
  timeout: 30000, // Tăng timeout lên 30s để đảm bảo có đủ thời gian xử lý
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  withCredentials: true // Thêm để hỗ trợ CORS với credentials
});

// Thêm request interceptor cho auth token
axiosInstance.interceptors.request.use((config) => {  // Lấy token từ localStorage - kiểm tra nhiều key có thể có
  const token = localStorage.getItem('auth_token') || localStorage.getItem('token') || localStorage.getItem('authToken');
  
  if (token && token !== 'undefined' && token !== 'null') {
    config.headers.Authorization = `Bearer ${token}`;
      // Chỉ log cho các API calls quan trọng để tránh spam console
    const importantEndpoints = ['/subscription/', '/user/', '/auth/'];
    if (importantEndpoints.some(endpoint => config.url.includes(endpoint))) {
      console.log('[API] Using auth token for request:', config.url);
    }  } else {
    // Kiểm tra xem đây có phải endpoint cần xác thực không
    const authRequiredEndpoints = [
      '/subscription/ad-benefits',
      '/subscription/current',
      '/subscription/history',
      '/user/'
    ];
    
    if (authRequiredEndpoints.some(endpoint => config.url.includes(endpoint))) {
      console.warn('[API] No valid auth token found for authenticated request:', config.url);
    }
  }
  
  // Thêm headers cần thiết cho CORS với PATCH requests
  if (config.method === 'patch' || config.method === 'PATCH') {
    config.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, PATCH, OPTIONS';
    config.headers['Access-Control-Allow-Origin'] = '*';
  }
  
  // Log request URL và method để debug
  console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url}`, 
    config.headers.Authorization ? 'Token: Yes' : 'Token: No');
  
  return config;
}, (error) => {
  console.error('[API Request Error]', error);
  return Promise.reject(error);
});

// Thêm response interceptor để xử lý lỗi
axiosInstance.interceptors.response.use(
  (response) => {
    // Log response status và data summary để debug
    console.log(`[API Response] ${response.status} ${response.config.url}`, 
      response.data?.success !== undefined ? 
      `success: ${response.data.success}` : 'No success field');
    
    // Log đầy đủ cho endpoint favorites
    if (response.config.url.includes('favorites')) {
      console.log('[Favorites API Response]', JSON.stringify(response.data));
    }
    
    return response;
  },
  (error) => {
    console.error('[API Error]:', error.response?.status, error.response?.data);
    
    // Thêm log chi tiết cho lỗi favorites
    if (error.config?.url.includes('favorites')) {
      console.error('[Favorites API Error]', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      });
    }
      // Kiểm tra trạng thái tài khoản bị khóa (403 Forbidden với flag isAccountLocked)
    if (error.response?.status === 403 && error.response?.data?.isAccountLocked === true) {
      console.log('Account is locked, redirecting to account-locked page');
        // Lưu trạng thái tài khoản bị khóa vào localStorage để duy trì qua các lần refresh
      localStorage.setItem('isAccountLocked', 'true');
      
      // Chuyển hướng đến trang tài khoản bị khóa nếu trong môi trường browser
      if (typeof window !== 'undefined') {
        window.location.href = '/account-locked';
      }
      
      return Promise.reject(error);
    }
    
    // Xử lý lỗi 401 Unauthorized - đăng xuất và chuyển hướng đến trang đăng nhập
    if (error.response?.status === 401) {
      console.log('Unauthorized access, redirecting to login page');
      localStorage.removeItem('token');
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');
      
      // Chỉ chuyển hướng nếu đang ở client-side
      if (typeof window !== 'undefined') {
        window.location.href = '/auth/login';
      }
    }
    
    return Promise.reject(error);
  }
);

export default axiosInstance;