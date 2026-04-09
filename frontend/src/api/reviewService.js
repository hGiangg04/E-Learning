import axios from './axios';

export const reviewService = {
    // Lấy reviews theo khóa học (public)
    getReviewsByCourse: async (courseId, page = 1, limit = 10) => {
        const res = await axios.get(`/reviews/course/${courseId}?page=${page}&limit=${limit}`);
        return res.data;
    },

    // Lấy review của user hiện tại
    getMyReview: async (courseId) => {
        const res = await axios.get(`/reviews/my/${courseId}`);
        return res.data;
    },

    // Tạo review
    createReview: async (data) => {
        const res = await axios.post('/reviews', data);
        return res.data;
    },

    // Cập nhật review
    updateReview: async (courseId, data) => {
        const res = await axios.put(`/reviews/${courseId}`, data);
        return res.data;
    },

    // Xóa review
    deleteReview: async (courseId) => {
        const res = await axios.delete(`/reviews/${courseId}`);
        return res.data;
    }
};
