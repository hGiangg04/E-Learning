import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import PageLayout from '../components/PageLayout';
import { enrollmentService } from '../api';

export default function MyCoursesPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login', { state: { from: { pathname: '/my-courses' } } });
      return;
    }
    const load = async () => {
      try {
        const res = await enrollmentService.getMine();
        setItems(res.data?.data?.enrollments || []);
      } catch (e) {
        toast.error(e.response?.data?.message || 'Không tải được danh sách ghi danh');
        setItems([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [navigate]);

  return (
    <PageLayout>
      <div className="pt-28 pb-16 px-4 sm:px-8 lg:px-12">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900">Khóa học của tôi</h1>
          <p className="mt-2 text-gray-600">Danh sách ghi danh từ API <code className="text-xs bg-gray-100 px-1 rounded">GET /enrollments</code></p>

          {loading ? (
            <div className="mt-10 space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-24 bg-gray-100 animate-pulse rounded-xl" />
              ))}
            </div>
          ) : items.length === 0 ? (
            <p className="mt-10 text-gray-600">
              Bạn chưa ghi danh khóa học nào.{' '}
              <Link to="/courses" className="text-primary-600 font-medium hover:underline">
                Khám phá khóa học
              </Link>
            </p>
          ) : (
            <ul className="mt-10 space-y-4">
              {items.map((en) => {
                const c = en.course_id;
                const cid = typeof c === 'object' && c?._id ? c._id : en.course_id;
                const title = typeof c === 'object' && c?.title ? c.title : 'Khóa học';
                const active = en.status === 'active';
                const pending = en.status === 'pending';
                return (
                  <li
                    key={en._id}
                    className="flex flex-col sm:flex-row sm:items-center gap-4 p-5 bg-white rounded-xl border border-gray-100 shadow-sm"
                  >
                    <div className="flex-1">
                      <Link to={`/courses/${cid}`} className="font-semibold text-gray-900 hover:text-primary-600">
                        {title}
                      </Link>
                      <p className="text-sm text-gray-500 mt-1">
                        Trạng thái:{' '}
                        <span className="font-medium text-gray-700">
                          {pending
                            ? 'Chờ xác nhận thanh toán (sau khi admin duyệt bạn sẽ vào học được)'
                            : en.status || '—'}
                        </span>
                      </p>
                    </div>
                    {active ? (
                      <Link to={`/courses/${cid}`} className="btn-primary text-sm shrink-0 text-center">
                        Vào học
                      </Link>
                    ) : (
                      <Link
                        to={`/courses/${cid}`}
                        className="text-sm shrink-0 text-center px-4 py-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50"
                      >
                        Xem khóa học
                      </Link>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </PageLayout>
  );
}
