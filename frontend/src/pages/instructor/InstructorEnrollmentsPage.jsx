import { useState, useEffect } from 'react';
import InstructorLayout from '../../components/instructor/InstructorLayout';
import { instructorDashboardApi } from '../../api/instructorDashboardApi';
import toast from 'react-hot-toast';

export default function InstructorEnrollmentsPage() {
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  const [processingIds, setProcessingIds] = useState(new Set());

  useEffect(() => {
    fetchEnrollments();
  }, [pagination.page]);

  const fetchEnrollments = async () => {
    try {
      setLoading(true);
      const res = await instructorDashboardApi.getPendingEnrollments({
        page: pagination.page,
        limit: pagination.limit,
      });

      if (res.data.success) {
        setEnrollments(res.data.data.enrollments || []);
        setPagination(prev => ({
          ...prev,
          ...res.data.data.pagination,
        }));
      }
    } catch (error) {
      toast.error('Không thể tải danh sách đăng ký');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    try {
      setProcessingIds(prev => new Set([...prev, id]));
      const res = await instructorDashboardApi.approveEnrollment(id);
      if (res.data.success) {
        toast.success('Duyệt đăng ký thành công');
        fetchEnrollments();
      }
    } catch (error) {
      toast.error('Không thể duyệt đăng ký');
    } finally {
      setProcessingIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  const handleReject = async (id) => {
    try {
      setProcessingIds(prev => new Set([...prev, id]));
      const res = await instructorDashboardApi.rejectEnrollment(id);
      if (res.data.success) {
        toast.success('Từ chối đăng ký thành công');
        fetchEnrollments();
      }
    } catch (error) {
      toast.error('Không thể từ chối đăng ký');
    } finally {
      setProcessingIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  const formatDate = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('vi-VN');
  };

  return (
    <InstructorLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Đăng ký chờ duyệt</h1>
          <p className="text-gray-500">Danh sách học viên chờ được duyệt vào khóa học</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
          </div>
        ) : (
          <>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              {enrollments.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Học viên</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Khóa học</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ngày đăng ký</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trạng thái</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {enrollments.map((enrollment) => (
                        <tr key={enrollment._id} className="hover:bg-gray-50">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-medium">
                                {enrollment.user_id?.name?.charAt(0)?.toUpperCase() || '?'}
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-900">{enrollment.user_id?.name || '-'}</p>
                                <p className="text-xs text-gray-500">{enrollment.user_id?.email || ''}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <img
                                src={enrollment.course_id?.thumbnail || 'https://via.placeholder.com/60x40?text=Course'}
                                alt={enrollment.course_id?.title}
                                className="w-12 h-8 rounded object-cover"
                              />
                              <p className="text-sm text-gray-900">{enrollment.course_id?.title || '-'}</p>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-sm text-gray-500">{formatDate(enrollment.enrolled_at)}</p>
                          </td>
                          <td className="px-6 py-4">
                            <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">
                              Chờ duyệt
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handleApprove(enrollment._id)}
                                disabled={processingIds.has(enrollment._id)}
                                className="px-3 py-1.5 text-xs font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                              >
                                {processingIds.has(enrollment._id) ? 'Đang xử lý...' : 'Duyệt'}
                              </button>
                              <button
                                onClick={() => handleReject(enrollment._id)}
                                disabled={processingIds.has(enrollment._id)}
                                className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
                              >
                                Từ chối
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="px-6 py-12 text-center text-gray-500">
                  Không có đăng ký nào chờ duyệt
                </div>
              )}
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-center gap-2">
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                  disabled={pagination.page === 1}
                  className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Trước
                </button>
                <span className="px-3 py-1.5 text-sm">
                  Trang {pagination.page} / {pagination.totalPages}
                </span>
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                  disabled={pagination.page === pagination.totalPages}
                  className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Sau
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </InstructorLayout>
  );
}