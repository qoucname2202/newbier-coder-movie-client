import axios from 'axios';

const baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const axiosInstance = axios.create({
  baseURL: baseURL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  withCredentials: true
});

axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token') || localStorage.getItem('token') || localStorage.getItem('authToken');

  if (token && token !== 'undefined' && token !== 'null') {
    config.headers.Authorization = `Bearer ${token}`;
    const importantEndpoints = ['/subscription/', '/user/', '/auth/'];
    if (importantEndpoints.some(endpoint => config.url.includes(endpoint))) {
    }  } else {
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

  if (config.method === 'patch' || config.method === 'PATCH') {
    config.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, PATCH, OPTIONS';
    config.headers['Access-Control-Allow-Origin'] = '*';
  }

  return config;
}, (error) => {
  console.error('[API Request Error]', error);
  return Promise.reject(error);
});

axiosInstance.interceptors.response.use(
  (response) => {

    if (response.config.url.includes('favorites')) {
    }

    return response;
  },
  (error) => {
    console.error('[API Error]:', error.response?.status, error.response?.data);

    if (error.config?.url.includes('favorites')) {
      console.error('[Favorites API Error]', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      });
    }
    if (error.response?.status === 403 && error.response?.data?.isAccountLocked === true) {
      localStorage.setItem('isAccountLocked', 'true');

      if (typeof window !== 'undefined') {
        window.location.href = '/account-locked';
      }

      return Promise.reject(error);
    }

    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');

      if (typeof window !== 'undefined') {
        window.location.href = '/auth/login';
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;