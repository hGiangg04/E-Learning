import api from './axios';

export const reviewService = {
    submitReview: (payload) => api.post('/reviews', payload).then(r => r.data),
    getReviewsByCourse: (courseId, params = {}) => api.get(`/reviews/course/${courseId}`, { params }).then(r => r.data),
    getMyReview: (courseId) => api.get('/reviews/my', { params: { courseId } }).then(r => r.data),
    deleteReview: (id) => api.delete(`/reviews/${id}`).then(r => r.data),
};
