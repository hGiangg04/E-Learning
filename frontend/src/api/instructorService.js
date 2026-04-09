import api from './axios';

export const instructorService = {
    /** GET /api/courses/instructor/:id (ổn định qua router khóa học; tương thích /api/instructors/:id trên server mới) */
    getProfile: (id) => api.get(`/courses/instructor/${id}`)
};
