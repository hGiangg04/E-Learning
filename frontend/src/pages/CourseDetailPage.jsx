import { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import PageLayout from '../components/PageLayout';
import { courseService, enrollmentService } from '../api';

export default function CourseDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await courseService.getById(id);
        const c = res.data?.data?.course;
        setCourse(c || null);
      } catch {
        setCourse(null);
        toast.error('Không tải được khóa học');
      } finally {
        setLoading(false);
      }
    };
    if (id) load();
  }, [id]);

  const formatPrice = (price) => {
    if (price === 0 || price == null) return 'Miễn phí';
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      maximumFractionDigits: 0,
    }).format(price);
  };

  const handleEnroll = async () => {
    if (!token) {
      toast.error('Vui lòng đăng nhập để ghi danh');
      navigate('/login', { state: { from: { pathname: `/courses/${id}` } } });
      return;
    }
    setEnrolling(true);
    try {
      const res = await enrollmentService.enroll(id);
      toast.success(res.data?.message || 'Ghi danh thành công');
      navigate('/my-courses');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Ghi danh thất bại');
    } finally {
      setEnrolling(false);
    }
  };

  const category = course?.category_id || course?.category;
  const instructor = course?.instructor_id || course?.instructor;
  const payPrice = course?.discount_price > 0 ? course.discount_price : course?.price;

  if (loading) {
    return (
      <PageLayout>
        <div className="pt-28 px-4 max-w-4xl mx-auto animate-pulse space-y-6">
          <div className="h-10 bg-gray-200 rounded w-2/3" />
          <div className="aspect-video bg-gray-200 rounded-xl" />
          <div className="h-24 bg-gray-200 rounded" />
        </div>
      </PageLayout>
    );
  }

  if (!course) {
    return (
      <PageLayout>
        <div className="pt-28 px-4 text-center">
          <p className="text-gray-600">Không tìm thấy khóa học.</p>
          <Link to="/courses" className="btn-primary mt-6 inline-flex">
            Về danh sách khóa học
          </Link>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <article className="pt-24 pb-16 px-4 sm:px-8 lg:px-12">
        <div className="max-w-4xl mx-auto">
          <nav className="text-sm text-gray-500 mb-6">
            <Link to="/" className="hover:text-primary-600">
              Trang chủ
            </Link>
            <span className="mx-2">/</span>
            <Link to="/courses" className="hover:text-primary-600">
              Khóa học
            </Link>
            <span className="mx-2">/</span>
            <span className="text-gray-900 line-clamp-1">{course.title}</span>
          </nav>

          <div className="rounded-2xl overflow-hidden bg-white shadow-lg border border-gray-100">
            <div className="aspect-video bg-gradient-to-br from-primary-100 to-primary-200">
              {course.thumbnail ? (
                <img src={course.thumbnail} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-7xl">📚</div>
              )}
            </div>
            <div className="p-6 md:p-10">
              {category?.name && (
                <span className="text-sm font-medium text-primary-600">{category.name}</span>
              )}
              <h1 className="text-3xl font-bold text-gray-900 mt-2">{course.title}</h1>
              {instructor?.name && (
                <p className="mt-2 text-gray-600">
                  Giảng viên: <span className="font-medium text-gray-900">{instructor.name}</span>
                </p>
              )}
              <p className="mt-6 text-gray-700 leading-relaxed whitespace-pre-line">
                {course.description || 'Đang cập nhật mô tả.'}
              </p>

              <div className="mt-8 flex flex-col sm:flex-row sm:items-center gap-4 border-t border-gray-100 pt-8">
                <div>
                  <p className="text-sm text-gray-500">Học phí</p>
                  <p className="text-2xl font-bold text-primary-600">{formatPrice(payPrice)}</p>
                  {course.discount_price > 0 && course.price > course.discount_price && (
                    <p className="text-sm text-gray-400 line-through">{formatPrice(course.price)}</p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={handleEnroll}
                  disabled={enrolling}
                  className="btn-primary sm:ml-auto disabled:opacity-60"
                >
                  {enrolling ? 'Đang xử lý…' : 'Ghi danh khóa học'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </article>
    </PageLayout>
  );
}
