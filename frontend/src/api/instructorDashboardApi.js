import api from './axios';

export const instructorDashboardApi = {
  // Lấy thống kê tổng quan
  getStats: () => api.get('/instructors/dashboard/stats'),

  // Lấy danh sách khóa học
  getCourses: (params) => api.get('/instructors/dashboard/courses', { params }),

  // Lấy danh sách học viên
  getStudents: (params) => api.get('/instructors/dashboard/students', { params }),

  // Lấy danh sách đăng ký chờ duyệt
  getPendingEnrollments: (params) => api.get('/instructors/dashboard/pending-enrollments', { params }),

  // Duyệt đăng ký
  approveEnrollment: (id) => api.patch(`/instructors/dashboard/enrollments/${id}/approve`),

  // Từ chối đăng ký
  rejectEnrollment: (id) => api.patch(`/instructors/dashboard/enrollments/${id}/reject`),

  // Thống kê doanh thu
  getRevenue: (params) => api.get('/instructors/dashboard/revenue', { params }),
};