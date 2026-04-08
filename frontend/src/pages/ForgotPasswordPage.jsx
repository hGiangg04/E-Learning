import { useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import PageLayout from '../components/PageLayout';
import { authService } from '../api';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await authService.forgotPassword(email.trim());
      setSent(true);
      toast.success('Nếu email tồn tại, hệ thống đã gửi hướng dẫn đặt lại mật khẩu.');
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Gửi yêu cầu thất bại';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageLayout className="bg-gradient-to-br from-primary-50 via-white to-primary-100">
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-16">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl border border-gray-100">
          <h1 className="text-2xl font-bold text-gray-900">Quên mật khẩu</h1>
          <p className="mt-2 text-sm text-gray-600">
            Nhập email đã đăng ký. Bạn sẽ nhận liên kết đặt lại mật khẩu (nếu cấu hình email trên server đã bật).
          </p>

          {sent ? (
            <p className="mt-6 text-sm text-gray-700">
              Vui lòng kiểm tra hộp thư.{' '}
              <Link to="/login" className="text-primary-600 font-medium">
                Quay lại đăng nhập
              </Link>
            </p>
          ) : (
            <form onSubmit={handleSubmit} className="mt-8 space-y-5">
              <div>
                <label htmlFor="fp-email" className="block text-sm font-medium text-gray-700">
                  Email
                </label>
                <input
                  id="fp-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/30"
                />
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full justify-center disabled:opacity-60">
                {loading ? 'Đang gửi…' : 'Gửi yêu cầu'}
              </button>
            </form>
          )}

          <p className="mt-6 text-center text-sm">
            <Link to="/login" className="text-primary-600 hover:text-primary-700">
              ← Quay lại đăng nhập
            </Link>
          </p>
        </div>
      </div>
    </PageLayout>
  );
}
