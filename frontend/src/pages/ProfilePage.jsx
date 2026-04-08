import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import PageLayout from '../components/PageLayout';
import { authService } from '../api';

export default function ProfilePage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login', { state: { from: { pathname: '/profile' } } });
      return;
    }
    const load = async () => {
      try {
        const res = await authService.getMe();
        const u = res.data?.data?.user;
        setUser(u);
        if (u) localStorage.setItem('user', JSON.stringify(u));
      } catch {
        toast.error('Không tải được hồ sơ');
        navigate('/login');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [navigate]);

  if (loading) {
    return (
      <PageLayout>
        <div className="pt-28 px-4 max-w-lg mx-auto animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/2" />
          <div className="h-4 bg-gray-200 rounded w-full" />
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div className="pt-28 pb-16 px-4 sm:px-8 lg:px-12">
        <div className="max-w-lg mx-auto bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
          <h1 className="text-2xl font-bold text-gray-900">Hồ sơ</h1>
          <p className="mt-2 text-sm text-gray-500">Dữ liệu từ API <code className="text-xs bg-gray-100 px-1 rounded">GET /auth/me</code></p>
          <dl className="mt-8 space-y-4">
            <div>
              <dt className="text-sm text-gray-500">Họ tên</dt>
              <dd className="font-medium text-gray-900">{user?.name}</dd>
            </div>
            <div>
              <dt className="text-sm text-gray-500">Email</dt>
              <dd className="font-medium text-gray-900">{user?.email}</dd>
            </div>
            <div>
              <dt className="text-sm text-gray-500">Vai trò</dt>
              <dd className="font-medium text-gray-900 capitalize">{user?.role}</dd>
            </div>
          </dl>
          <div className="mt-10 flex flex-wrap gap-3">
            <Link to="/my-courses" className="btn-secondary text-sm">
              Khóa học của tôi
            </Link>
            {user?.role === 'admin' && (
              <Link to="/admin" className="btn-primary text-sm">
                Vào admin
              </Link>
            )}
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
