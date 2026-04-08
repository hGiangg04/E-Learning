import axios from 'axios';

/**
 * Base URL cho mọi request JSON/API.
 * - Dev: `/api` (Vite proxy → backend).
 * - Prod: `VITE_API_BASE_URL` — nếu chỉ gốc server (vd: http://localhost:5000) thì tự thêm `/api`
 *   để POST /upload/video thành /api/upload/video (tránh 404 "Endpoint không tìm thấy").
 */
function resolveApiBaseURL() {
  const raw = import.meta.env.VITE_API_BASE_URL?.trim();
  if (raw) {
    const base = raw.replace(/\/+$/, '');
    if (/\/api$/i.test(base)) return base;
    return `${base}/api`;
  }
  if (import.meta.env.DEV) return '/api';
  return 'http://localhost:5000/api';
}

const baseURL = resolveApiBaseURL();

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
  // FormData: bỏ Content-Type mặc định để trình duyệt gửi multipart kèm boundary (multer nhận được file)
  if (typeof FormData !== 'undefined' && config.data instanceof FormData) {
    delete config.headers['Content-Type'];
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
