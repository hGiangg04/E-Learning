import axios from './axios';

export const notificationService = {
    // Lấy danh sách thông báo
    getMyNotifications: async (page = 1, limit = 20) => {
        const res = await axios.get(`/notifications?page=${page}&limit=${limit}`);
        return res.data;
    },

    // Đếm thông báo chưa đọc
    getUnreadCount: async () => {
        const res = await axios.get('/notifications/unread-count');
        return res.data;
    },

    // Đánh dấu đã đọc
    markAsRead: async (id) => {
        const res = await axios.put(`/notifications/${id}/read`);
        return res.data;
    },

    // Đánh dấu tất cả đã đọc
    markAllAsRead: async () => {
        const res = await axios.put('/notifications/read-all');
        return res.data;
    },

    // Xóa thông báo
    deleteNotification: async (id) => {
        const res = await axios.delete(`/notifications/${id}`);
        return res.data;
    }
};
