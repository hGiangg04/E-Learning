import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import AdminLayout from '../../components/admin/AdminLayout';
import StatCard from '../../components/admin/StatCard';
import { adminApi } from '../../api/adminApi';

const UsersIcon = () => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
  </svg>
);

const CourseIcon = () => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
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

export default function DashboardPage() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalCourses: 0,
    totalEnrollments: 0,
    totalRevenue: 0,
  });
  const [loading, setLoading] = useState(true);
  const [recentEnrollments, setRecentEnrollments] = useState([]);
  const [recentUsers, setRecentUsers] = useState([]);
  const [pendingEnrollments, setPendingEnrollments] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch users
      const usersRes = await adminApi.getUsers({ limit: 5 });
      if (usersRes.data.success) {
        setRecentUsers(usersRes.data.data.users || []);
        setStats(prev => ({ ...prev, totalUsers: usersRes.data.data.pagination?.total || 0 }));
      }

      // Fetch courses
      const coursesRes = await adminApi.getCourses({ limit: 1 });
      if (coursesRes.data.success) {
        setStats(prev => ({ ...prev, totalCourses: coursesRes.data.data.pagination?.total || 0 }));
      }

      // Fetch pending enrollments
      const pendingRes = await adminApi.getPendingEnrollments();
      if (pendingRes.data.success) {
        setPendingEnrollments(pendingRes.data.data.enrollments || []);
        setRecentEnrollments(pendingRes.data.data.enrollments?.slice(0, 5) || []);
      }

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('vi-VN');
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500">Tổng quan về hệ thống E-Learning</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Tổng người dùng"
            value={stats.totalUsers}
            icon={<UsersIcon />}
            color="blue"
          />
          <StatCard
            title="Tổng khóa học"
            value={stats.totalCourses}
            icon={<CourseIcon />}
            color="green"
          />
          <StatCard
            title="Chờ duyệt"
            value={pendingEnrollments.length}
            icon={<EnrollmentIcon />}
            color="purple"
          />
          <StatCard
            title="Đăng ký"
            value={stats.totalEnrollments}
            icon={<RevenueIcon />}
            color="orange"
          />
        </div>

        {/* Charts and Tables */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Users */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Người dùng mới</h3>
              <Link to="/admin/users" className="text-sm text-primary-600 hover:text-primary-700 font-medium">
                Xem tất cả
              </Link>
            </div>
            {recentUsers.length > 0 ? (
              <div className="divide-y divide-gray-100">
                {recentUsers.map((user) => (
                  <div key={user._id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-medium">
                        {user.name?.charAt(0)?.toUpperCase() || '?'}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{user.name || '-'}</p>
                        <p className="text-xs text-gray-500">{user.email || ''}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        user.role === 'admin' ? 'bg-red-100 text-red-800' : 
                        user.role === 'instructor' ? 'bg-purple-100 text-purple-800' : 
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {user.role === 'admin' ? 'Admin' : user.role === 'instructor' ? 'Giáo viên' : 'Học viên'}
                      </span>
                      <p className="text-xs text-gray-500 mt-1">{formatDate(user.created_at)}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="px-6 py-8 text-center text-gray-500">
                Chưa có người dùng nào
              </div>
            )}
          </div>

          {/* Pending Enrollments */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Đăng ký chờ duyệt</h3>
              <Link to="/admin/enrollments" className="text-sm text-primary-600 hover:text-primary-700 font-medium">
                Xem tất cả
              </Link>
            </div>
            {recentEnrollments.length > 0 ? (
              <div className="divide-y divide-gray-100">
                {recentEnrollments.map((enrollment) => (
                  <div key={enrollment._id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{enrollment.user_id?.name || '-'}</p>
                      <p className="text-xs text-gray-500">{enrollment.course_id?.title || '-'}</p>
                    </div>
                    <div className="text-right">
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">
                        Chờ duyệt
                      </span>
                      <p className="text-xs text-gray-500 mt-1">{formatDate(enrollment.enrolled_at)}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="px-6 py-8 text-center text-gray-500">
                Không có đăng ký nào chờ duyệt
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Thao tác nhanh</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link
              to="/admin/users"
              className="flex flex-col items-center gap-2 p-4 rounded-lg border border-gray-200 hover:border-primary-500 hover:bg-primary-50 transition-colors"
            >
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                <UsersIcon />
              </div>
              <span className="text-sm font-medium text-gray-700">Quản lý người dùng</span>
            </Link>
            <Link
              to="/admin/courses"
              className="flex flex-col items-center gap-2 p-4 rounded-lg border border-gray-200 hover:border-primary-500 hover:bg-primary-50 transition-colors"
            >
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                <CourseIcon />
              </div>
              <span className="text-sm font-medium text-gray-700">Quản lý khóa học</span>
            </Link>
            <Link
              to="/admin/categories"
              className="flex flex-col items-center gap-2 p-4 rounded-lg border border-gray-200 hover:border-primary-500 hover:bg-primary-50 transition-colors"
            >
              <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center text-purple-600">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
              </div>
              <span className="text-sm font-medium text-gray-700">Quản lý danh mục</span>
            </Link>
            <Link
              to="/admin/enrollments"
              className="flex flex-col items-center gap-2 p-4 rounded-lg border border-gray-200 hover:border-primary-500 hover:bg-primary-50 transition-colors"
            >
              <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center text-orange-600">
                <EnrollmentIcon />
              </div>
              <span className="text-sm font-medium text-gray-700">Duyệt đăng ký</span>
            </Link>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
