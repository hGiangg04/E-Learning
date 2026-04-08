import api from './axios';

export const adminApi = {
  // Dashboard stats
  getStats: () => api.get('/admin/stats'),

  // Users
  getUsers: (params) => api.get('/admin/users', { params }),
  getUser: (id) => api.get(`/admin/users/${id}`),
  createUser: (data) => api.post('/admin/users', data),
  updateUser: (id, data) => api.put(`/admin/users/${id}`, data),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
  toggleUserStatus: (id) => api.patch(`/admin/users/${id}/toggle-status`),

  // Courses
  getCourses: (params) => api.get('/admin/courses', { params }),
  getCourse: (id) => api.get(`/admin/courses/${id}`),
  createCourse: (data) => api.post('/admin/courses', data),
  updateCourse: (id, data) => api.put(`/admin/courses/${id}`, data),
  deleteCourse: (id) => api.delete(`/admin/courses/${id}`),
  approveCourse: (id) => api.patch(`/admin/courses/${id}/approve`),
  rejectCourse: (id, reason) => api.patch(`/admin/courses/${id}/reject`, { reason }),

  // Categories
  getCategories: (params) => api.get('/admin/categories', { params }),
  getCategory: (id) => api.get(`/admin/categories/${id}`),
  createCategory: (data) => api.post('/admin/categories', data),
  updateCategory: (id, data) => api.put(`/admin/categories/${id}`, data),
  deleteCategory: (id) => api.delete(`/admin/categories/${id}`),

  // Enrollments
  getEnrollments: (params) => api.get('/admin/enrollments', { params }),
  getEnrollment: (id) => api.get(`/admin/enrollments/${id}`),
  approveEnrollment: (id) => api.patch(`/admin/enrollments/${id}/approve`),
  cancelEnrollment: (id) => api.delete(`/admin/enrollments/${id}`),

  // Payments
  getPayments: (params) => api.get('/admin/payments', { params }),
  getPayment: (id) => api.get(`/admin/payments/${id}`),
  approvePayment: (id) => api.patch(`/admin/payments/${id}/approve`),
  rejectPayment: (id, reason) => api.patch(`/admin/payments/${id}/reject`, { reason }),

  // Quizzes
  getQuizzes: (params) => api.get('/admin/quizzes', { params }),
  getQuiz: (id) => api.get(`/admin/quizzes/${id}`),
  createQuiz: (data) => api.post('/admin/quizzes', data),
  updateQuiz: (id, data) => api.put(`/admin/quizzes/${id}`, data),
  deleteQuiz: (id) => api.delete(`/admin/quizzes/${id}`),
};
