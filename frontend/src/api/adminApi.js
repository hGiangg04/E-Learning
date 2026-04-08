import api from './axios';

export const adminApi = {
  // Dashboard stats - sẽ tạo API riêng cho dashboard
  getStats: () => api.get('/admin/stats'),

  // === USERS (GET /api/users) ===
  getUsers: (params) => api.get('/users', { params }),
  getUser: (id) => api.get(`/users/${id}`),
  createUser: (data) => api.post('/users', data),
  updateUser: (id, data) => api.put(`/users/${id}`, data),
  deleteUser: (id) => api.delete(`/users/${id}`),
  setUserStatus: (id, is_active) => api.patch(`/users/${id}/status`, { is_active }),
  setUserRole: (id, role) => api.patch(`/users/${id}/role`, { role }),

  // === COURSES ===
  // GET /api/courses/admin/all - tất cả khóa cho admin
  getCourses: (params) => api.get('/courses/admin/all', { params }),
  // GET /api/courses/:id
  getCourse: (id) => api.get(`/courses/${id}`),
  // POST /api/courses - tạo khóa học
  createCourse: (data) => api.post('/courses', data),
  // PUT /api/courses/:id - cập nhật
  updateCourse: (id, data) => api.put(`/courses/${id}`, data),
  // DELETE /api/courses/:id
  deleteCourse: (id) => api.delete(`/courses/${id}`),
  // Publish/unpublish course (thêm trường is_published)
  publishCourse: (id) => api.put(`/courses/${id}`, { is_published: 1 }),
  unpublishCourse: (id) => api.put(`/courses/${id}`, { is_published: 0 }),

  // === CATEGORIES ===
  getCategories: (params) => api.get('/categories', { params }),
  getCategory: (id) => api.get(`/categories/${id}`),
  createCategory: (data) => api.post('/categories', data),
  updateCategory: (id, data) => api.put(`/categories/${id}`, data),
  deleteCategory: (id) => api.delete(`/categories/${id}`),

  // === ENROLLMENTS ===
  // GET /api/enrollments/admin/pending - danh sách chờ duyệt
  getPendingEnrollments: () => api.get('/enrollments/admin/pending'),
  // GET /api/enrollments - tất cả enrollment (thêm query)
  getEnrollments: (params) => api.get('/enrollments', { params }),
  // PATCH /api/enrollments/admin/:id/approve
  approveEnrollment: (id) => api.patch(`/enrollments/admin/${id}/approve`),
  // DELETE /api/enrollments/course/:courseId
  cancelEnrollment: (courseId) => api.delete(`/enrollments/course/${courseId}`),

  // === PAYMENTS ===
  getPayments: (params) => api.get('/payments', { params }),
  getPayment: (id) => api.get(`/payments/${id}`),
  approvePayment: (id) => api.patch(`/payments/${id}/approve`),
  rejectPayment: (id, reason) => api.patch(`/payments/${id}/reject`, { reason }),

  // === QUIZZES ===
  getQuizzes: (params) => api.get('/quizzes', { params }),
  getQuiz: (id) => api.get(`/quizzes/${id}/detail`),
  createQuiz: (data) => api.post('/quizzes', data),
  updateQuiz: (id, data) => api.put(`/quizzes/${id}`, data),
  deleteQuiz: (id) => api.delete(`/quizzes/${id}`),
  addQuizQuestion: (quizId, data) => api.post(`/quizzes/${quizId}/questions`, data),
  getQuizForTake: (id) => api.get(`/quizzes/${id}/take`),
};
