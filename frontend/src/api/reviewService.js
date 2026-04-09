import api from './axios';

export const reviewService = {
    /** POST /api/reviews — gửi hoặc cập nhật đánh giá */
    submitReview: (payload) =>
        api.post('/reviews', payload).then((r) => r.data),

    /** GET /api/reviews/course/:courseId */
    getReviewsByCourse: (courseId, params = {}) =>
        api.get(`/reviews/course/${courseId}`, { params }).then((r) => r.data),

    /** GET /api/reviews/my?courseId=... */
    getMyReview: (courseId) =>
        api.get('/reviews/my', { params: { courseId } }).then((r) => r.data),

    /** DELETE /api/reviews/:id */
    deleteReview: (id) =>
        api.delete(`/reviews/${id}`).then((r) => r.data),
};
