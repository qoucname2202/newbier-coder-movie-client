// src/config/axiosAdminConfig.ts
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
  const token = localStorage.getItem('auth_token') || localStorage.getItem('token');

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  if (config.method === 'patch' || config.method === 'PATCH') {
    config.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, PATCH, OPTIONS';
    config.headers['Access-Control-Allow-Origin'] = '*';
  }

  return config;
}, (error) => {
  console.error('[Admin API Request Error]', error);
  return Promise.reject(error);
});

axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response && error.response.status === 401) {
      console.error('[Admin API] Unauthorized access. Redirecting to login...');
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('token');

        window.location.href = '/login?redirect=' + encodeURIComponent(window.location.pathname);
      }
    }

    if (error.response && error.response.status === 403) {
      console.error('[Admin API] Forbidden access.');
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
