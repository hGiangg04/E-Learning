import api from './axios';

export const enrollmentService = {
  getMine: () => api.get('/enrollments'),
  checkAccess: (courseId) => api.get(`/enrollments/access/${courseId}`),
  enroll: (course_id) => api.post('/enrollments', { course_id }),
  cancel: (courseId) => api.delete(`/enrollments/course/${courseId}`),
};
