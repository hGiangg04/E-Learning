import { useState, useEffect } from 'react';
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
    userTrend: 'up',
    courseTrend: 'up',
    enrollmentTrend: 'up',
    revenueTrend: 'up',
  });
  const [loading, setLoading] = useState(true);
  const [recentEnrollments, setRecentEnrollments] = useState([]);
  const [recentUsers, setRecentUsers] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      // Mock data for now - will connect to real API later
      setStats({
        totalUsers: 156,
        totalCourses: 42,
        totalEnrollments: 892,
        totalRevenue: 125000000,
        userTrend: 'up',
        courseTrend: 'up',
        enrollmentTrend: 'up',
        revenueTrend: 'up',
      });

      // Mock recent data
      setRecentUsers([
        { _id: '1', name: 'Nguyễn Văn A', email: 'vana@gmail.com', role: 'user', createdAt: '2024-01-15' },
        { _id: '2', name: 'Trần Thị B', email: 'thib@gmail.com', role: 'user', createdAt: '2024-01-14' },
        { _id: '3', name: 'Lê Văn C', email: 'vanc@gmail.com', role: 'instructor', createdAt: '2024-01-13' },
        { _id: '4', name: 'Phạm Thị D', email: 'thid@gmail.com', role: 'user', createdAt: '2024-01-12' },
        { _id: '5', name: 'Hoàng Văn E', email: 'vane@gmail.com', role: 'user', createdAt: '2024-01-11' },
      ]);

      setRecentEnrollments([
        { _id: '1', user: { name: 'Nguyễn Văn A' }, course: { title: 'React cơ bản' }, enrolledAt: '2024-01-15', status: 'active' },
        { _id: '2', user: { name: 'Trần Thị B' }, course: { title: 'Node.js Advanced' }, enrolledAt: '2024-01-14', status: 'active' },
        { _id: '3', user: { name: 'Lê Văn C' }, course: { title: 'Python for Data Science' }, enrolledAt: '2024-01-13', status: 'pending' },
        { _id: '4', user: { name: 'Phạm Thị D' }, course: { title: 'Docker & Kubernetes' }, enrolledAt: '2024-01-12', status: 'active' },
        { _id: '5', user: { name: 'Hoàng Văn E' }, course: { title: 'TypeScript Masterclass' }, enrolledAt: '2024-01-11', status: 'active' },
      ]);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('vi-VN');
  };

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
            trend={stats.userTrend}
            trendValue="+12%"
            color="blue"
          />
          <StatCard
            title="Tổng khóa học"
            value={stats.totalCourses}
            icon={<CourseIcon />}
            trend={stats.courseTrend}
            trendValue="+8%"
            color="green"
          />
          <StatCard
            title="Tổng đăng ký"
            value={stats.totalEnrollments}
            icon={<EnrollmentIcon />}
            trend={stats.enrollmentTrend}
            trendValue="+24%"
            color="purple"
          />
          <StatCard
            title="Tổng doanh thu"
            value={formatCurrency(stats.totalRevenue)}
            icon={<RevenueIcon />}
            trend={stats.revenueTrend}
            trendValue="+18%"
            color="orange"
          />
        </div>

        {/* Charts and Tables */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Users */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Người dùng mới</h3>
              <a href="/admin/users" className="text-sm text-primary-600 hover:text-primary-700 font-medium">
                Xem tất cả
              </a>
            </div>
            <div className="divide-y divide-gray-100">
              {recentUsers.map((user) => (
                <div key={user._id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-medium">
                      {user.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{user.name}</p>
                      <p className="text-xs text-gray-500">{user.email}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      user.role === 'instructor' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                    }`}>
                      {user.role === 'instructor' ? 'Giáo viên' : 'Học viên'}
                    </span>
                    <p className="text-xs text-gray-500 mt-1">{formatDate(user.createdAt)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Enrollments */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Đăng ký gần đây</h3>
              <a href="/admin/enrollments" className="text-sm text-primary-600 hover:text-primary-700 font-medium">
                Xem tất cả
              </a>
            </div>
            <div className="divide-y divide-gray-100">
              {recentEnrollments.map((enrollment) => (
                <div key={enrollment._id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{enrollment.user.name}</p>
                    <p className="text-xs text-gray-500">{enrollment.course.title}</p>
                  </div>
                  <div className="text-right">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      enrollment.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {enrollment.status === 'active' ? 'Đang học' : 'Chờ duyệt'}
                    </span>
                    <p className="text-xs text-gray-500 mt-1">{formatDate(enrollment.enrolledAt)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Thao tác nhanh</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <a
              href="/admin/users"
              className="flex flex-col items-center gap-2 p-4 rounded-lg border border-gray-200 hover:border-primary-500 hover:bg-primary-50 transition-colors"
            >
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                <UsersIcon />
              </div>
              <span className="text-sm font-medium text-gray-700">Quản lý người dùng</span>
            </a>
            <a
              href="/admin/courses"
              className="flex flex-col items-center gap-2 p-4 rounded-lg border border-gray-200 hover:border-primary-500 hover:bg-primary-50 transition-colors"
            >
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                <CourseIcon />
              </div>
              <span className="text-sm font-medium text-gray-700">Quản lý khóa học</span>
            </a>
            <a
              href="/admin/categories"
              className="flex flex-col items-center gap-2 p-4 rounded-lg border border-gray-200 hover:border-primary-500 hover:bg-primary-50 transition-colors"
            >
              <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center text-purple-600">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
              </div>
              <span className="text-sm font-medium text-gray-700">Quản lý danh mục</span>
            </a>
            <a
              href="/admin/payments"
              className="flex flex-col items-center gap-2 p-4 rounded-lg border border-gray-200 hover:border-primary-500 hover:bg-primary-50 transition-colors"
            >
              <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center text-orange-600">
                <RevenueIcon />
              </div>
              <span className="text-sm font-medium text-gray-700">Duyệt thanh toán</span>
            </a>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
