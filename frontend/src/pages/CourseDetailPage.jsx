import { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import PageLayout from '../components/PageLayout';
import { courseService, enrollmentService, lessonService, reviewService } from '../api';

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
  const [reviews, setReviews] = useState([]);
  const [reviewStats, setReviewStats] = useState({ average_rating: 0, review_count: 0 });
  const [myReview, setMyReview] = useState(null);
  const [reviewLoading, setReviewLoading] = useState(true);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');

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
        if (cancelled) return;
        const d = res?.data?.data;
        if (d !== undefined) setAccess(d);
      })
      .catch((err) => {
        if (err?.response?.status !== 401 && !cancelled) {
          setAccess(null);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [id, token]);

  /* ── Load đánh giá ── */
  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    setReviewLoading(true);

    const loadReviews = async () => {
      try {
        const res = await reviewService.getReviewsByCourse(id);
        if (cancelled) return;
        if (res?.success) {
          setReviews(res.data?.reviews ?? []);
          setReviewStats(res.data?.stats ?? { average_rating: 0, review_count: 0 });
        }
      } catch {
        if (!cancelled) setReviews([]);
      } finally {
        if (!cancelled) setReviewLoading(false);
      }
    };

    const loadMyReview = async () => {
      if (!token) return;
      try {
        const res = await reviewService.getMyReview(id);
        if (cancelled || !res?.success) return;
        const mine = (res.data?.reviews ?? []).find((r) => String(r.course_id?._id ?? r.course_id) === String(id));
        if (mine) {
          setMyReview(mine);
          setReviewRating(mine.rating);
          setReviewComment(mine.comment || '');
        }
      } catch { /* ignore */ }
    };

    Promise.all([loadReviews(), loadMyReview()]);
    return () => { cancelled = true; };
  }, [id, token]);

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!token) {
      toast.error('Vui lòng đăng nhập để đánh giá');
      navigate('/login');
      return;
    }
    setSubmittingReview(true);
    try {
      const res = await reviewService.submitReview({ course_id: id, rating: reviewRating, comment: reviewComment });
      if (res.success) {
        setMyReview(res.data?.review ?? null);
        setEditMode(false);
        toast.success(myReview ? 'Đã cập nhật đánh giá' : 'Cảm ơn bạn đã đánh giá!');
        // Reload stats
        const statsRes = await reviewService.getReviewsByCourse(id);
        if (statsRes?.success) {
          setReviewStats(statsRes.data?.stats ?? reviewStats);
          setReviews(statsRes.data?.reviews ?? reviews);
        }
      } else {
        toast.error(res.message || 'Gửi đánh giá thất bại');
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Gửi đánh giá thất bại');
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleDeleteReview = async (reviewId) => {
    if (!window.confirm('Xóa đánh giá của bạn?')) return;
    try {
      const res = await reviewService.deleteReview(reviewId);
      if (res.success) {
        setMyReview(null);
        setReviewRating(5);
        setReviewComment('');
        setEditMode(false);
        toast.success('Đã xóa đánh giá');
        const statsRes = await reviewService.getReviewsByCourse(id);
        if (statsRes?.success) {
          setReviewStats(statsRes.data?.stats ?? reviewStats);
          setReviews(statsRes.data?.reviews ?? reviews);
        }
      }
    } catch {
      toast.error('Xóa đánh giá thất bại');
    }
  };

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
  const hasReviewed = !!myReview;

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

          {/* ── Đánh giá ── */}
          <section className="mt-10 rounded-2xl bg-white shadow-lg border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
              <h2 className="text-lg font-semibold text-gray-900">Đánh giá khóa học</h2>
              <div className="flex items-center gap-3 mt-2">
                <div className="flex items-center gap-1">
                  {[1,2,3,4,5].map(n => (
                    <svg key={n} className={`w-5 h-5 ${n <= Math.round(reviewStats.average_rating) ? 'text-yellow-400' : 'text-gray-300'}`} fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                    </svg>
                  ))}
                </div>
                <span className="font-semibold text-gray-900">{Number(reviewStats.average_rating).toFixed(1)}</span>
                <span className="text-gray-500 text-sm">({reviewStats.review_count} đánh giá)</span>
              </div>
            </div>

            {/* Form đánh giá — chỉ hiện khi đã ghi danh */}
            {enrolled ? (
              <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50">
                {editMode || !hasReviewed ? (
                  <form onSubmit={handleSubmitReview} className="space-y-3">
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-gray-600">Chọn sao:</span>
                      <div className="flex items-center gap-1">
                        {[1,2,3,4,5].map(n => (
                          <button
                            key={n}
                            type="button"
                            onClick={() => setReviewRating(n)}
                            className="focus:outline-none"
                          >
                            <svg className={`w-6 h-6 transition-colors ${n <= reviewRating ? 'text-yellow-400' : 'text-gray-300 hover:text-yellow-200'}`} fill="currentColor" viewBox="0 0 24 24">
                              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                            </svg>
                          </button>
                        ))}
                      </div>
                      <span className="text-sm font-medium text-gray-700">{reviewRating}/5</span>
                    </div>
                    <textarea
                      value={reviewComment}
                      onChange={e => setReviewComment(e.target.value)}
                      rows={3}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                      placeholder="Chia sẻ trải nghiệm của bạn về khóa học... (tùy chọn)"
                    />
                    <div className="flex gap-2">
                      <button
                        type="submit"
                        disabled={submittingReview}
                        className="px-5 py-2 bg-primary-600 text-white text-sm rounded-lg hover:bg-primary-700 disabled:opacity-60 transition-colors"
                      >
                        {submittingReview ? 'Đang gửi…' : hasReviewed ? 'Cập nhật đánh giá' : 'Gửi đánh giá'}
                      </button>
                      {hasReviewed && (
                        <button
                          type="button"
                          onClick={() => { setEditMode(false); setReviewRating(myReview.rating); setReviewComment(myReview.comment || ''); }}
                          className="px-4 py-2 border border-gray-300 text-sm rounded-lg hover:bg-gray-100 transition-colors"
                        >
                          Hủy
                        </button>
                      )}
                    </div>
                  </form>
                ) : (
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-semibold text-sm">
                        {myReview?.user_id?.name?.[0]?.toUpperCase() || 'U'}
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-1 mb-1">
                        {[1,2,3,4,5].map(n => (
                          <svg key={n} className={`w-4 h-4 ${n <= myReview.rating ? 'text-yellow-400' : 'text-gray-300'}`} fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                          </svg>
                        ))}
                      </div>
                      <p className="text-sm text-gray-700">{myReview.comment || 'Đã đánh giá.'}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(myReview.created_at).toLocaleDateString('vi-VN')}
                      </p>
                    </div>
                    <div className="flex-shrink-0 flex gap-2">
                      <button
                        onClick={() => setEditMode(true)}
                        className="text-xs text-primary-600 hover:underline"
                      >
                        Sửa
                      </button>
                      <button
                        onClick={() => handleDeleteReview(myReview._id)}
                        className="text-xs text-red-500 hover:underline"
                      >
                        Xóa
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="px-6 py-4 border-b border-gray-100">
                <p className="text-sm text-gray-500">
                  Đăng ký khóa học để đánh giá.
                </p>
              </div>
            )}

            {/* Danh sách đánh giá */}
            <ul className="divide-y divide-gray-100">
              {reviewLoading ? (
                <li className="px-6 py-6 text-center text-gray-400">Đang tải đánh giá…</li>
              ) : reviews.length === 0 ? (
                <li className="px-6 py-6 text-center text-gray-500">Chưa có đánh giá nào. Hãy là người đầu tiên!</li>
              ) : (
                reviews.map(review => (
                  <li key={review._id} className="px-6 py-4">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-9 h-9 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center text-sm font-semibold">
                        {review.user_id?.name?.[0]?.toUpperCase() || '?'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-gray-900 text-sm">{review.user_id?.name || 'Học viên ẩn danh'}</span>
                          <div className="flex items-center gap-0.5">
                            {[1,2,3,4,5].map(n => (
                              <svg key={n} className={`w-3.5 h-3.5 ${n <= review.rating ? 'text-yellow-400' : 'text-gray-300'}`} fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                              </svg>
                            ))}
                          </div>
                        </div>
                        {review.comment && (
                          <p className="text-sm text-gray-700 whitespace-pre-line">{review.comment}</p>
                        )}
                        <p className="text-xs text-gray-400 mt-1">
                          {new Date(review.created_at).toLocaleDateString('vi-VN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                      </div>
                    </div>
                  </li>
                ))
              )}
            </ul>
          </section>
        </div>
      </article>
    </PageLayout>
  );
}
