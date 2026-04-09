/**
 * Socket.io client service — quản lý kết nối real-time.
 *
 * Cách dùng:
 *   import { socketService } from './socketService';
 *
 *   // Nhận thông báo real-time
 *   socketService.onNotification((notif) => { ... });
 *
 *   // Ngắt lắng nghe (cleanup khi component unmount)
 *   const off = socketService.onNotification(handler);
 *   off(); // hoặc dùng socketService.offNotification(handler)
 *
 *   // Reconnect khi đăng nhập lại
 *   socketService.connect(token);
 *
 *   // Ngắt kết nối khi đăng xuất
 *   socketService.disconnect();
 */

/**
 * Resolves Socket.io server URL the same way axios.js resolves API base URL.
 * Dev: Vite proxy at '/socket.io'  →  http://127.0.0.1:5000
 * Prod: VITE_API_BASE_URL or falls back to 'http://localhost:5000'
 */
function resolveSocketURL() {
  const raw = import.meta.env.VITE_API_BASE_URL?.trim();
  if (raw) {
    return raw.replace(/\/+$/, '');
  }
  if (import.meta.env.DEV) return 'http://127.0.0.1:5000';
  return 'http://localhost:5000';
}

const URL = resolveSocketURL();

let socket = null;
let notificationHandlers = new Set();
let globalHandlers = new Set();

/**
 * Kết nối Socket.io với token JWT.
 * Gọi lại khi user đăng nhập (hoặc re-login sau khi token refresh).
 * @param {string} token
 */
function connect(token) {
  // Ngắt kết nối cũ nếu có
  disconnect();

  // Dynamically import socket.io-client để tránh lỗi SSR (React chỉ chạy browser)
  import('socket.io-client').then(({ io }) => {
    socket = io(URL, {
      path: '/socket.io',
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
    });

    socket.on('connect', () => {
      console.log('[Socket] Connected:', socket.id);
    });

    socket.on('disconnect', (reason) => {
      console.log('[Socket] Disconnected:', reason);
    });

    socket.on('connect_error', (err) => {
      console.warn('[Socket] Connection error:', err.message);
    });

    // Sự kiện notification từ server
    socket.on('notification', (data) => {
      console.log('[Socket] Notification received:', data);
      notificationHandlers.forEach((fn) => fn(data));
    });

    // Sự kiện toàn cục (phòng khi mở rộng sau này)
    socket.onAny((event, ...args) => {
      globalHandlers.forEach((fn) => fn(event, args));
    });
  });
}

/**
 * Ngắt kết nối Socket.io — gọi khi user đăng xuất.
 */
function disconnect() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
  notificationHandlers.clear();
  globalHandlers.clear();
}

/**
 * Đăng ký handler cho sự kiện 'notification'.
 * Trả về hàm hủy đăng ký.
 * @param {(notif: object) => void} handler
 * @returns {() => void}
 */
function onNotification(handler) {
  notificationHandlers.add(handler);
  return () => notificationHandlers.delete(handler);
}

/**
 * Hủy đăng ký notification handler.
 * @param {(notif: object) => void} handler
 */
function offNotification(handler) {
  notificationHandlers.delete(handler);
}

/**
 * Đăng ký handler cho mọi sự kiện Socket.
 * @param {(event: string, args: any[]) => void} handler
 * @returns {() => void}
 */
function onAny(handler) {
  globalHandlers.add(handler);
  return () => globalHandlers.delete(handler);
}

/**
 * Kiểm tra đã kết nối chưa.
 */
function isConnected() {
  return socket?.connected ?? false;
}

export const socketService = {
  connect,
  disconnect,
  onNotification,
  offNotification,
  onAny,
  isConnected,
};
