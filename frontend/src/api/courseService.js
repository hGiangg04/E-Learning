import api from './axios';

export const courseService = {
  getAll: (params) => api.get('/courses', { params }),
  getById: (id) => api.get(`/courses/${id}`),
  getFeatured: () => api.get('/courses', { params: { limit: 8, sort: '-created_at' } }),
};
