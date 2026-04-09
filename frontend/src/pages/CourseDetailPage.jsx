import { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import PageLayout from '../components/PageLayout';
import { courseService, enrollmentService, lessonService, certificateService } from '../api';

export default function CourseDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lessonsLoading, setLessonsLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [access, setAccess] = useState(null);
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  /* ── Chứng chỉ ── */
  const [myCert, setMyCert] = useState(null);
  const [certLoading, setCertLoading] = useState(false);
  const [generatingCert, setGeneratingCert] = useState(false);

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
    if (!id) return;
    let cancelled = false;
    const loadLessons = async () => {
      setLessonsLoading(true);
      try {
        const res = await lessonService.getLessonsByCourse(id);
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
  }, [id]);

  useEffect(() => {
    if (!id || !token) {
      setAccess(null);
      return;
    }
    let cancelled = false;
    enrollmentService
      .checkAccess(id)
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
  }, [id, token]);

  /* ── Load chứng chỉ ── */
  useEffect(() => {
    if (!id || !token) return;
    let cancelled = false;
    certificateService.checkCertificate(id)
      .then(res => { if (!cancelled && res?.success) setMyCert(res.data?.certificate || null); })
      .catch(() => { if (!cancelled) setMyCert(null); });
    return () => { cancelled = true; };
  }, [id, token]);

  const handleGetCertificate = async () => {
    if (!token) { toast.error('Vui lòng đăng nhập'); navigate('/login'); return; }
    setGeneratingCert(true);
    try {
      const res = await certificateService.generateCertificate(id);
      if (res?.success) {
        setMyCert(res.data?.certificate || null);
        toast.success(res.message || 'Chúc mừng bạn đã nhận được chứng chỉ!');
      } else {
        toast.error(res.message || 'Không thể tạo chứng chỉ');
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Lỗi khi tạo chứng chỉ');
    } finally {
      setGeneratingCert(false);
    }
  };

  const handleViewCert = () => {
    navigate('/my-certificates');
  };
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
      try {
        const check = await enrollmentService.checkAccess(id);
        if (check.data?.success) setAccess(check.data.data);
      } catch {
        setAccess({ enrolled: true, status: 'pending', canLearn: false });
      }
    } catch (err) {
      const msg = err.response?.data?.message;
      if (msg?.includes('đã đăng ký') || err.response?.status === 400) {
        toast.success('Bạn đã ghi danh khóa học này');
        try {
          const check = await enrollmentService.checkAccess(id);
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
                <div className="sm:ml-auto flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                  {canLearn && firstLessonId ? (
                    <Link
                      to={`/courses/${id}/lesson/${firstLessonId}`}
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

          {/* ── Chứng chỉ ── */}
          {canLearn && (
            <div className="mt-6 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 p-5">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-emerald-800 mb-1">Nhận chứng chỉ hoàn thành</h3>
                  <p className="text-sm text-emerald-700 mb-3">
                    Hoàn thành tối thiểu 80% khóa học để nhận chứng chỉ.
                  </p>
                  {myCert ? (
                    <div className="flex items-center gap-3">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-100 text-emerald-700 text-sm font-medium rounded-full">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Đã có chứng chỉ
                      </span>
                      <button
                        onClick={handleViewCert}
                        className="text-sm text-emerald-700 hover:text-emerald-900 font-medium underline"
                      >
                        Xem &amp; tải
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={handleGetCertificate}
                      disabled={generatingCert}
                      className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white text-sm font-medium rounded-lg transition-colors"
                    >
                      {generatingCert ? 'Đang kiểm tra…' : 'Nhận chứng chỉ'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

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
                          to={`/courses/${id}/lesson/${lesson._id}`}
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
        </div>
      </article>
    </PageLayout>
  );
}
