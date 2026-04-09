import { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import PageLayout from '../components/PageLayout';
import ReviewsSection from '../components/ReviewsSection';
import { courseService, enrollmentService, lessonService, wishlistService, cartService } from '../api';

export default function CourseDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lessonsLoading, setLessonsLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [access, setAccess] = useState(null);
  const [inWishlist, setInWishlist] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const [inCart, setInCart] = useState(false);
  const [cartLoading, setCartLoading] = useState(false);
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const viewer =
    typeof window !== 'undefined' && localStorage.getItem('user')
      ? JSON.parse(localStorage.getItem('user'))
      : null;
  const isAdmin = viewer?.role === 'admin';
  /** MongoDB _id — API bài học/ghi danh chỉ nhận ObjectId, không dùng slug từ URL */
  const courseId = course?._id ? String(course._id) : null;

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

  useEffect(() => {
    if (!courseId) {
      setLessons([]);
      return;
    }
    let cancelled = false;
    const loadLessons = async () => {
      setLessonsLoading(true);
      try {
        const res = await lessonService.getLessonsByCourse(courseId);
        if (!cancelled && res?.success && res.data?.lessons) {
          setLessons(res.data.lessons);
        } else if (!cancelled) {
          setLessons([]);
        }
      } catch {
        if (!cancelled) setLessons([]);
      } finally {
        if (!cancelled) setLessonsLoading(false);
      }
    };
    loadLessons();
    return () => {
      cancelled = true;
    };
  }, [courseId]);

  useEffect(() => {
    if (!courseId || !token) {
      setAccess(null);
      return;
    }
    let cancelled = false;
    enrollmentService
      .checkAccess(courseId)
      .then((res) => {
        if (cancelled || !res.data?.success) return;
        setAccess(res.data.data);
      })
      .catch(() => {
        if (!cancelled) setAccess(null);
      });
    return () => {
      cancelled = true;
    };
  }, [courseId, token]);

  useEffect(() => {
    if (!courseId || !token) {
      setInWishlist(false);
      return;
    }
    wishlistService.checkWishlist(courseId)
      .then(res => {
        if (res.success) setInWishlist(res.data?.in_wishlist);
      })
      .catch(() => setInWishlist(false));
  }, [courseId, token]);

  useEffect(() => {
    if (!courseId || !token) {
      setInCart(false);
      return;
    }
    cartService.getMyCart()
      .then(res => {
        if (res.success) {
          const hasItem = res.data?.items?.some(item => String(item.course._id) === String(courseId));
          setInCart(!!hasItem);
        }
      })
      .catch(() => setInCart(false));
  }, [courseId, token]);

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
    if (!courseId) return;
    setEnrolling(true);
    try {
      const res = await enrollmentService.enroll(courseId);
      toast.success(res.data?.message || 'Ghi danh thành công');
      try {
        const check = await enrollmentService.checkAccess(courseId);
        if (check.data?.success) setAccess(check.data.data);
      } catch {
        setAccess({ enrolled: true, status: 'pending', canLearn: false });
      }
    } catch (err) {
      const msg = err.response?.data?.message;
      if (msg?.includes('đã đăng ký') || err.response?.status === 400) {
        toast.success('Bạn đã ghi danh khóa học này');
        try {
          const check = await enrollmentService.checkAccess(courseId);
          if (check.data?.success) setAccess(check.data.data);
        } catch {
          /* ignore */
        }
      } else {
        toast.error(msg || 'Ghi danh thất bại');
      }
    } finally {
      setEnrolling(false);
    }
  };

  const toggleWishlist = async () => {
    if (!token) {
      toast.error('Vui lòng đăng nhập để thêm vào yêu thích');
      navigate('/login');
      return;
    }
    if (!courseId) return;
    setWishlistLoading(true);
    try {
      if (inWishlist) {
        await wishlistService.removeFromWishlist(courseId);
        setInWishlist(false);
        toast.success('Đã xóa khỏi danh sách yêu thích');
      } else {
        await wishlistService.addToWishlist(courseId);
        setInWishlist(true);
        toast.success('Đã thêm vào danh sách yêu thích');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Có lỗi xảy ra');
    } finally {
      setWishlistLoading(false);
    }
  };

  const toggleCart = async () => {
    if (!token) {
      toast.error('Vui lòng đăng nhập để thêm vào giỏ hàng');
      navigate('/login');
      return;
    }
    if (course.price === 0) {
      toast.error('Khóa học miễn phí, vui lòng đăng ký trực tiếp');
      return;
    }
    if (!courseId) return;
    setCartLoading(true);
    try {
      if (inCart) {
        await cartService.removeFromCart(courseId);
        setInCart(false);
        toast.success('Đã xóa khỏi giỏ hàng');
        window.dispatchEvent(new Event('cart-changed'));
      } else {
        await cartService.addToCart(courseId);
        setInCart(true);
        toast.success('Đã thêm vào giỏ hàng');
        window.dispatchEvent(new Event('cart-changed'));
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Có lỗi xảy ra');
    } finally {
      setCartLoading(false);
    }
  };

  const category = course?.category_id || course?.category;
  const instructor = course?.instructor_id || course?.instructor;
  const payPrice = course?.discount_price > 0 ? course.discount_price : course?.price;

  const canLearn = access?.canLearn === true;
  const enrolled = access?.enrolled === true;
  const pendingApproval = enrolled && access?.status === 'pending';

  const firstLessonId = lessons[0]?._id;

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
                  Giảng viên:{' '}
                  <Link
                    to={`/instructor/${String(instructor._id ?? '')}`}
                    className="font-medium text-gray-900 hover:text-primary-600 transition-colors"
                  >
                    {instructor.name}
                  </Link>
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
                  {isAdmin && Number(payPrice) > 0 && (
                    <p className="text-xs text-primary-700 mt-2 max-w-md">
                      Tài khoản admin: được mở khóa học ngay, không cần thanh toán.
                    </p>
                  )}
                </div>
                <div className="sm:ml-auto flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={toggleWishlist}
                    disabled={wishlistLoading}
                    className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg border transition-colors disabled:opacity-60 ${
                      inWishlist
                        ? 'border-red-200 bg-red-50 text-red-600 hover:bg-red-100'
                        : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <svg className={`w-5 h-5 ${inWishlist ? 'fill-red-500' : ''}`} fill={inWishlist ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                    {inWishlist ? 'Đã yêu thích' : 'Yêu thích'}
                  </button>
                  {canLearn && firstLessonId ? (
                    <Link
                      to={`/courses/${courseId}/lesson/${firstLessonId}`}
                      className="btn-primary text-center"
                    >
                      Vào học ngay
                    </Link>
                  ) : canLearn && !firstLessonId ? (
                    <span className="px-4 py-2 rounded-lg bg-gray-100 text-gray-600 text-center">
                      Khóa học chưa có bài học
                    </span>
                  ) : pendingApproval ? (
                    <span className="px-4 py-2 rounded-lg bg-amber-50 text-amber-800 border border-amber-200 text-center">
                      Đang chờ duyệt / thanh toán
                    </span>
                  ) : course.price > 0 ? (
                    <button
                      type="button"
                      onClick={toggleCart}
                      disabled={cartLoading}
                      className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg border transition-colors disabled:opacity-60 ${
                        inCart
                          ? 'border-green-200 bg-green-50 text-green-600 hover:bg-green-100'
                          : 'border-green-200 bg-green-50 text-green-700 hover:bg-green-100'
                      }`}
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      {inCart ? 'Đã thêm vào giỏ' : 'Thêm vào giỏ hàng'}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleEnroll}
                      disabled={enrolling}
                      className="btn-primary disabled:opacity-60"
                    >
                      {enrolling ? 'Đang xử lý…' : 'Ghi danh khóa học'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Danh sách bài học */}
          <section id="curriculum" className="mt-10 rounded-2xl bg-white shadow-lg border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
              <h2 className="text-lg font-semibold text-gray-900">Nội dung khóa học</h2>
              <p className="text-sm text-gray-500 mt-1">
                {lessonsLoading
                  ? 'Đang tải…'
                  : `${lessons.length} bài học${canLearn ? ' — Bạn có thể mở từng bài bên dưới' : ''}`}
              </p>
            </div>
            <ul className="divide-y divide-gray-100">
              {lessonsLoading ? (
                <li className="px-6 py-8 text-center text-gray-400">Đang tải danh sách bài…</li>
              ) : lessons.length === 0 ? (
                <li className="px-6 py-8 text-center text-gray-500">
                  Chưa có bài học nào. Admin có thể thêm trong mục <strong>Bài học</strong> (admin).
                </li>
              ) : (
                lessons.map((lesson, index) => {
                  const open = canLearn || Number(lesson.is_free) === 1;
                  return (
                    <li key={lesson._id} className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50">
                      <span className="flex-shrink-0 w-8 h-8 rounded-full bg-primary-100 text-primary-700 text-sm font-semibold flex items-center justify-center">
                        {index + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900">{lesson.title}</p>
                        {lesson.video_url && (
                          <p className="text-xs text-gray-500 truncate">Có video</p>
                        )}
                      </div>
                      {open ? (
                        <Link
                          to={`/courses/${courseId}/lesson/${lesson._id}`}
                          className="text-sm font-medium text-primary-600 hover:underline shrink-0"
                        >
                          Học
                        </Link>
                      ) : (
                        <span className="text-xs text-gray-400 shrink-0">Đăng nhập &amp; ghi danh</span>
                      )}
                    </li>
                  );
                })
              )}
            </ul>
          </section>

          {/* Reviews Section */}
          <ReviewsSection courseId={courseId} />
        </div>
      </article>
    </PageLayout>
  );
}
