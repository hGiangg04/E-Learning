import api from './axios';

export const enrollmentService = {
  getMine: () => api.get('/enrollments'),
  checkAccess: (courseId) => api.get(`/enrollments/access/${courseId}`),
  enroll: (courseIdOrPayload) => {
    if (typeof courseIdOrPayload === 'object' && courseIdOrPayload !== null) {
      return api.post('/enrollments', courseIdOrPayload);
    }
    return api.post('/enrollments', { course_id: courseIdOrPayload });
  },
  cancel: (courseId) => api.delete(`/enrollments/course/${courseId}`),
};
