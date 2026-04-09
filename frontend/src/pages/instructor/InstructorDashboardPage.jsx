import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import InstructorLayout from '../../components/instructor/InstructorLayout';
import StatCard from '../../components/instructor/StatCard';
import { instructorDashboardApi } from '../../api/instructorDashboardApi';
import toast from 'react-hot-toast';

const CourseIcon = () => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
  </svg>
);

const UsersIcon = () => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
  </svg>
);

const EnrollmentIcon = () => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
  </svg>
);

const RevenueIcon = () => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const StarIcon = () => (
  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
  </svg>
);

export default function InstructorDashboardPage() {
  const [stats, setStats] = useState({
    totalCourses: 0,
    totalStudents: 0,
    totalRevenue: 0,
    averageRating: 0,
    pendingEnrollmentsCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [recentCourses, setRecentCourses] = useState([]);
  const [recentStudents, setRecentStudents] = useState([]);
  const [pendingEnrollments, setPendingEnrollments] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      const [statsRes, coursesRes, studentsRes, pendingRes] = await Promise.all([
        instructorDashboardApi.getStats(),
        instructorDashboardApi.getCourses({ limit: 5 }),
        instructorDashboardApi.getStudents({ limit: 5 }),
        instructorDashboardApi.getPendingEnrollments({ limit: 5 }),
      ]);

      if (statsRes.data.success) {
        setStats(statsRes.data.data);
      }

      if (coursesRes.data.success) {
        setRecentCourses(coursesRes.data.data.courses || []);
      }

      if (studentsRes.data.success) {
        setRecentStudents(studentsRes.data.data.students || []);
      }

      if (pendingRes.data.success) {
        setPendingEnrollments(pendingRes.data.data.enrollments || []);
      }

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Không thể tải dữ liệu dashboard');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('vi-VN');
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const handleApproveEnrollment = async (id) => {
    try {
      const res = await instructorDashboardApi.approveEnrollment(id);
      if (res.data.success) {
        toast.success('Duyệt đăng ký thành công');
        fetchDashboardData();
      }
    } catch (error) {
      toast.error('Không thể duyệt đăng ký');
    }
  };

  const handleRejectEnrollment = async (id) => {
    try {
      const res = await instructorDashboardApi.rejectEnrollment(id);
      if (res.data.success) {
        toast.success('Từ chối đăng ký thành công');
        fetchDashboardData();
      }
    } catch (error) {
      toast.error('Không thể từ chối đăng ký');
    }
  };

  if (loading) {
    return (
      <InstructorLayout>
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      </InstructorLayout>
    );
  }

  return (
    <InstructorLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard Giảng viên</h1>
          <p className="text-gray-500">Tổng quan về hoạt động giảng dạy của bạn</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          <StatCard
            title="Tổng khóa học"
            value={stats.totalCourses}
            icon={<CourseIcon />}
            color="indigo"
          />
          <StatCard
            title="Tổng học viên"
            value={stats.totalStudents}
            icon={<UsersIcon />}
            color="blue"
          />
          <StatCard
            title="Doanh thu"
            value={formatCurrency(stats.totalRevenue)}
            icon={<RevenueIcon />}
            color="green"
          />
          <StatCard
            title="Đánh giá TB"
            value={stats.averageRating > 0 ? stats.averageRating.toFixed(1) : 'N/A'}
            icon={<StarIcon />}
            color="orange"
          />
          <StatCard
            title="Chờ duyệt"
            value={stats.pendingEnrollmentsCount}
            icon={<EnrollmentIcon />}
            color="red"
          />
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Thao tác nhanh</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link
              to="/instructor/courses"
              className="flex flex-col items-center gap-2 p-4 rounded-lg border border-gray-200 hover:border-indigo-500 hover:bg-indigo-50 transition-colors"
            >
              <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
                <CourseIcon />
              </div>
              <span className="text-sm font-medium text-gray-700">Quản lý khóa học</span>
            </Link>
            <Link
              to="/instructor/students"
              className="flex flex-col items-center gap-2 p-4 rounded-lg border border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition-colors"
            >
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                <UsersIcon />
              </div>
              <span className="text-sm font-medium text-gray-700">Xem học viên</span>
            </Link>
            <Link
              to="/instructor/enrollments"
              className="flex flex-col items-center gap-2 p-4 rounded-lg border border-gray-200 hover:border-purple-500 hover:bg-purple-50 transition-colors"
            >
              <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center text-purple-600">
                <EnrollmentIcon />
              </div>
              <span className="text-sm font-medium text-gray-700">Duyệt đăng ký</span>
            </Link>
            <Link
              to="/instructor/revenue"
              className="flex flex-col items-center gap-2 p-4 rounded-lg border border-gray-200 hover:border-green-500 hover:bg-green-50 transition-colors"
            >
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                <RevenueIcon />
              </div>
              <span className="text-sm font-medium text-gray-700">Xem doanh thu</span>
            </Link>
          </div>
        </div>

        {/* Charts and Tables */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Courses */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Khóa học gần đây</h3>
              <Link to="/instructor/courses" className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">
                Xem tất cả
              </Link>
            </div>
            {recentCourses.length > 0 ? (
              <div className="divide-y divide-gray-100">
                {recentCourses.map((course) => (
                  <div key={course._id} className="px-6 py-4 flex items-center gap-4 hover:bg-gray-50">
                    <img
                      src={course.thumbnail || 'https://via.placeholder.com/60x40?text=Course'}
                      alt={course.title}
                      className="w-16 h-12 rounded object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{course.title}</p>
                      <p className="text-xs text-gray-500">
                        {course.student_count || 0} học viên · {formatCurrency(course.price)}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        course.is_published === 1
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {course.is_published === 1 ? 'Đã xuất bản' : 'Bản nháp'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="px-6 py-8 text-center text-gray-500">
                Bạn chưa có khóa học nào
              </div>
            )}
          </div>

          {/* Recent Students */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Học viên mới</h3>
              <Link to="/instructor/students" className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">
                Xem tất cả
              </Link>
            </div>
            {recentStudents.length > 0 ? (
              <div className="divide-y divide-gray-100">
                {recentStudents.map((student) => (
                  <div key={student._id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-medium">
                        {student.user?.name?.charAt(0)?.toUpperCase() || '?'}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{student.user?.name || '-'}</p>
                        <p className="text-xs text-gray-500">{student.user?.email || ''}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500">{student.course?.title || '-'}</p>
                      <p className="text-xs text-gray-400 mt-1">{formatDate(student.enrolled_at)}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="px-6 py-8 text-center text-gray-500">
                Chưa có học viên nào
              </div>
            )}
          </div>
        </div>

        {/* Pending Enrollments */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Đăng ký chờ duyệt</h3>
            <Link to="/instructor/enrollments" className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">
              Xem tất cả ({pendingEnrollments.length})
            </Link>
          </div>
          {pendingEnrollments.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Học viên</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Khóa học</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ngày đăng ký</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {pendingEnrollments.map((enrollment) => (
                    <tr key={enrollment._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 text-sm font-medium">
                            {enrollment.user_id?.name?.charAt(0)?.toUpperCase() || '?'}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{enrollment.user_id?.name || '-'}</p>
                            <p className="text-xs text-gray-500">{enrollment.user_id?.email || ''}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-gray-900">{enrollment.course_id?.title || '-'}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-gray-500">{formatDate(enrollment.enrolled_at)}</p>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleApproveEnrollment(enrollment._id)}
                            className="px-3 py-1.5 text-xs font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
                          >
                            Duyệt
                          </button>
                          <button
                            onClick={() => handleRejectEnrollment(enrollment._id)}
                            className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
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
            <div className="px-6 py-8 text-center text-gray-500">
              Không có đăng ký nào chờ duyệt
            </div>
          )}
        </div>
      </div>
    </InstructorLayout>
  );
}