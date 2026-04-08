import api from './axios';

export const enrollmentService = {
  getMine: () => api.get('/enrollments'),
  enroll: (course_id) => api.post('/enrollments', { course_id }),
  cancel: (courseId) => api.delete(`/enrollments/course/${courseId}`),
};
