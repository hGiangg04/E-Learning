import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import PageLayout from '../components/PageLayout';
import { authService } from '../api';

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await authService.login({ email: email.trim(), password });
      const payload = res.data?.data;
      if (!payload?.token) {
        throw new Error(res.data?.message || 'Đăng nhập thất bại');
      }
      localStorage.setItem('token', payload.token);
      localStorage.setItem('user', JSON.stringify(payload.user));
      toast.success(res.data?.message || 'Đăng nhập thành công');
      const destination = payload.user?.role === 'admin' ? '/admin' : from;
      navigate(destination, { replace: true });
      window.dispatchEvent(new Event('auth-changed'));
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Đăng nhập thất bại';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageLayout className="bg-gradient-to-br from-primary-50 via-white to-primary-100">
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-16">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl border border-gray-100">
          <h1 className="text-2xl font-bold text-gray-900">Đăng nhập</h1>
          <p className="mt-2 text-sm text-gray-600">
            Chưa có tài khoản?{' '}
            <Link to="/register" className="font-medium text-primary-600 hover:text-primary-700">
              Đăng ký
            </Link>
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <div>
              <label htmlFor="login-email" className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                id="login-email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/30"
              />
            </div>
            <div>
              <label htmlFor="login-password" className="block text-sm font-medium text-gray-700">
                Mật khẩu
              </label>
              <input
                id="login-password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/30"
              />
            </div>
            <div className="text-right">
              <Link to="/forgot-password" className="text-sm text-primary-600 hover:text-primary-700">
                Quên mật khẩu?
              </Link>
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full justify-center disabled:opacity-60">
              {loading ? 'Đang đăng nhập…' : 'Đăng nhập'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500">
            <Link to="/courses" className="text-primary-600 hover:text-primary-700">
              Khám phá khóa học
            </Link>
          </p>
        </div>
      </div>
    </PageLayout>
  );
}
