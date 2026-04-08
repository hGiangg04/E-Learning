import axios from 'axios';

// Dev: dùng proxy Vite (/api -> localhost:5000) để tránh lỗi CORS. Prod: đặt VITE_API_BASE_URL.
const baseURL =
  import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.DEV ? '/api' : 'http://localhost:5000/api');

const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const url = String(error.config?.url || '');
      const isAuthAttempt =
        url.includes('/auth/login') ||
        url.includes('/auth/register') ||
        url.includes('/auth/google') ||
        url.includes('/auth/forgot-password') ||
        url.includes('/auth/reset-password');
      if (!isAuthAttempt) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        if (!window.location.pathname.startsWith('/login')) {
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;
