import api from './axios';

export const notificationService = {
    getNotifications: (params = {}) => api.get('/notifications', { params }).then(r => r.data),
    getUnreadCount: () => api.get('/notifications/unread-count').then(r => r.data),
    markAllRead: () => api.put('/notifications/read-all').then(r => r.data),
    markRead: (id) => api.put(`/notifications/${id}/read`).then(r => r.data),
    deleteNotification: (id) => api.delete(`/notifications/${id}`).then(r => r.data),
};
