import api from './axios';

export const couponApi = {
  // Lấy danh sách tất cả coupon (Admin)
  getCoupons: (params) => api.get('/coupons', { params }),

  // Lấy chi tiết 1 coupon (Admin)
  getCoupon: (id) => api.get(`/coupons/${id}`),

  // Tạo coupon mới (Admin)
  createCoupon: (data) => api.post('/coupons', data),

  // Cập nhật coupon (Admin)
  updateCoupon: (id, data) => api.put(`/coupons/${id}`, data),

  // Xóa coupon (Admin)
  deleteCoupon: (id) => api.delete(`/coupons/${id}`),

  // Lấy coupon khả dụng theo khóa học (Public - user đã đăng nhập)
  getCouponsByCourse: (courseId) => api.get(`/coupons/course/${courseId}`),

  // Áp dụng mã coupon - kiểm tra và nhận thông tin giảm giá (Public)
  applyCoupon: (code, courseId) => api.post('/coupons/apply', { code, course_id: courseId }),
};
