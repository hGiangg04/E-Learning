import { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import PageLayout from '../components/PageLayout';
import { courseService, enrollmentService, lessonService, reviewService, commentService } from '../api';

/* ─── Shared star rating display ─── */
function StarRow({ rating, size = 'sm' }) {
  const dim = size === 'sm' ? 'w-3.5 h-3.5' : 'w-5 h-5';
  return (
    <div className="flex items-center gap-0.5">
      {[1,2,3,4,5].map(n => (
        <svg key={n} className={`${dim} ${n <= Math.round(rating) ? 'text-yellow-400' : 'text-gray-300'}`} fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      ))}
    </div>
  );
}

/* ─── Single comment item (top-level + replies) ─── */
function CommentItem({ comment, currentUserId, onDelete, onReplySubmit, onCancelReply }) {
  const [showReply, setShowReply] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const isMine = currentUserId && comment.user_id?._id === currentUserId;

  const handleReply = async (e) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    setSubmitting(true);
    const res = await onReplySubmit(comment._id, replyText.trim());
    setSubmitting(false);
    if (res?.success) {
      setReplyText('');
      setShowReply(false);
    }
  };

  return (
    <div className="py-3">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-sm font-semibold uppercase">
          {comment.user_id?.name?.[0] || '?'}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-sm text-gray-900">{comment.user_id?.name || 'Học viên ẩn danh'}</span>
            <span className="text-xs text-gray-400">{new Date(comment.created_at).toLocaleDateString('vi-VN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
          </div>
          <p className="text-sm text-gray-700 whitespace-pre-line">{comment.content}</p>
          <div className="flex items-center gap-3 mt-1.5">
            {currentUserId && (
              <button onClick={() => setShowReply(v => !v)} className="text-xs text-primary-600 hover:underline">
                {showReply ? 'Ẩn trả lời' : 'Trả lời'}
              </button>
            )}
            {isMine && (
              <button onClick={() => onDelete(comment._id)} className="text-xs text-red-500 hover:underline">
                Xóa
              </button>
            )}
          </div>

          {showReply && (
            <form onSubmit={handleReply} className="mt-2 flex gap-2">
              <input
                type="text"
                value={replyText}
                onChange={e => setReplyText(e.target.value)}
                placeholder="Viết trả lời…"
                maxLength={500}
                className="flex-1 text-sm px-3 py-1.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
              <button type="submit" disabled={submitting || !replyText.trim()} className="text-xs px-3 py-1.5 bg-primary-600 text-white rounded-lg disabled:opacity-60">
                {submitting ? '…' : 'Gửi'}
              </button>
              {onCancelReply && <button type="button" onClick={() => { setShowReply(false); setReplyText(''); }} className="text-xs px-2 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-50">Hủy</button>}
            </form>
          )}

          {/* Replies */}
          {comment.replies?.length > 0 && (
            <div className="mt-3 ml-4 pl-3 border-l-2 border-gray-100 space-y-2">
              {comment.replies.map(reply => {
                const replyMine = currentUserId && reply.user_id?._id === currentUserId;
                return (
                  <div key={reply._id} className="flex items-start gap-2">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center text-xs font-semibold uppercase">
                      {reply.user_id?.name?.[0] || '?'}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="font-medium text-xs text-gray-900">{reply.user_id?.name || 'Học viên'}</span>
                        <span className="text-xs text-gray-400">{new Date(reply.created_at).toLocaleDateString('vi-VN', { day: 'numeric', month: 'short' })}</span>
                      </div>
                      <p className="text-xs text-gray-700 whitespace-pre-line">{reply.content}</p>
                      {replyMine && (
                        <button onClick={() => onDelete(reply._id)} className="text-xs text-red-400 hover:underline mt-0.5">Xóa</button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Review form (inline stars) ─── */
function ReviewForm({ initialRating, initialComment, onSubmit, onCancel, submitting }) {
  const [rating, setRating] = useState(initialRating || 5);
  const [comment, setComment] = useState(initialComment || '');

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(rating, comment); }} className="space-y-3">
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-600">Sao:</span>
        {[1,2,3,4,5].map(n => (
          <button key={n} type="button" onClick={() => setRating(n)} className="focus:outline-none">
            <svg className={`w-6 h-6 ${n <= rating ? 'text-yellow-400' : 'text-gray-300 hover:text-yellow-200'}`} fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
          </button>
        ))}
        <span className="text-sm font-medium text-gray-700">{rating}/5</span>
      </div>
      <textarea
        value={comment}
        onChange={e => setComment(e.target.value)}
        rows={2}
        maxLength={1000}
        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary-500 resize-none"
        placeholder="Chia sẻ trải nghiệm của bạn… (tùy chọn)"
      />
      <div className="flex gap-2">
        <button type="submit" disabled={submitting} className="px-4 py-1.5 bg-primary-600 text-white text-sm rounded-lg hover:bg-primary-700 disabled:opacity-60">
          {submitting ? 'Đang gửi…' : onCancel ? 'Cập nhật' : 'Gửi đánh giá'}
        </button>
        {onCancel && (
          <button type="button" onClick={onCancel} className="px-3 py-1.5 border border-gray-300 text-sm rounded-lg hover:bg-gray-50">Hủy</button>
        )}
      </div>
    </form>
  );
}

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
  const currentUserId = typeof window !== 'undefined'
    ? (() => { try { const t = localStorage.getItem('token'); if (!t) return null; const p = JSON.parse(atob(t.split('.')[1])); return p.id; } catch { return null; } })()
    : null;

  /* ── Bình luận ── */
  const [comments, setComments] = useState([]);
  const [commentLoading, setCommentLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  /* ── Đánh giá ── */
  const [reviewStats, setReviewStats] = useState({ average_rating: 0, review_count: 0 });
  const [myReview, setMyReview] = useState(null);
  const [reviewLoading, setReviewLoading] = useState(true);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [editReview, setEditReview] = useState(false);

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

  /* ── Load bình luận ── */
  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    setCommentLoading(true);
    commentService.getComments('course', id, { limit: 50 })
      .then(res => { if (!cancelled && res?.success) setComments(res.data?.comments ?? []); })
      .catch(() => { if (!cancelled) setComments([]); })
      .finally(() => { if (!cancelled) setCommentLoading(false); });
    return () => { cancelled = true; };
  }, [id]);

  /* ── Load đánh giá ── */
  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    setReviewLoading(true);

    const load = async () => {
      try {
        const res = await reviewService.getReviewsByCourse(id);
        if (cancelled) return;
        if (res?.success) {
          setReviewStats(res.data?.stats ?? { average_rating: 0, review_count: 0 });
        }
      } catch { /* ignore */ }
      if (!cancelled) setReviewLoading(false);
    };

    const loadMy = async () => {
      if (!token) return;
      try {
        const res = await reviewService.getMyReview(id);
        if (cancelled || !res?.success) return;
        const mine = (res.data?.reviews ?? []).find(r => String(r.course_id?._id ?? r.course_id) === String(id));
        if (mine) setMyReview(mine);
      } catch { /* ignore */ }
    };

    Promise.all([load(), loadMy()]);
    return () => { cancelled = true; };
  }, [id, token]);

  /* ── Xử lý bình luận ── */
  const handlePostComment = async (e) => {
    e.preventDefault();
    if (!token) { toast.error('Vui lòng đăng nhập để bình luận'); navigate('/login'); return; }
    if (!commentText.trim()) return;
    setSubmittingComment(true);
    try {
      const res = await commentService.postComment({ target_type: 'course', target_id: id, content: commentText.trim() });
      if (res?.success) {
        setCommentText('');
        toast.success('Đã gửi bình luận');
        const fresh = await commentService.getComments('course', id, { limit: 50 });
        if (fresh?.success) setComments(fresh.data?.comments ?? []);
      }
    } catch (err) { toast.error(err?.response?.data?.message || 'Gửi bình luận thất bại'); }
    finally { setSubmittingComment(false); }
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('Xóa bình luận này?')) return;
    try {
      const res = await commentService.deleteComment(commentId);
      if (res?.success) {
        setComments(prev => {
          const topLevel = prev.filter(c => String(c._id) !== String(commentId));
          return topLevel.map(c => ({ ...c, replies: c.replies?.filter(r => String(r._id) !== String(commentId)) }));
        });
        toast.success('Đã xóa bình luận');
      }
    } catch { toast.error('Xóa bình luận thất bại'); }
  };

  const handleReplySubmit = async (parentId, content) => {
    if (!token) { toast.error('Vui lòng đăng nhập'); navigate('/login'); return null; }
    try {
      const res = await commentService.postComment({ target_type: 'course', target_id: id, content, parent_id: parentId });
      if (res?.success) {
        const fresh = await commentService.getComments('course', id, { limit: 50 });
        if (fresh?.success) setComments(fresh.data?.comments ?? []);
      }
      return res;
    } catch (err) { toast.error(err?.response?.data?.message || 'Gửi trả lời thất bại'); return null; }
  };

  /* ── Xử lý đánh giá ── */
  const handleSubmitReview = async (rating, comment) => {
    if (!token) { toast.error('Vui lòng đăng nhập để đánh giá'); navigate('/login'); return; }
    setSubmittingReview(true);
    try {
      const res = await reviewService.submitReview({ course_id: id, rating, comment });
      if (res?.success) {
        setMyReview(res.data?.review ?? null);
        setEditReview(false);
        toast.success(myReview ? 'Đã cập nhật đánh giá' : 'Cảm ơn bạn đã đánh giá!');
        const statsRes = await reviewService.getReviewsByCourse(id);
        if (statsRes?.success) setReviewStats(statsRes.data?.stats ?? reviewStats);
      } else { toast.error(res.message || 'Gửi đánh giá thất bại'); }
    } catch (err) { toast.error(err?.response?.data?.message || 'Gửi đánh giá thất bại'); }
    finally { setSubmittingReview(false); }
  };

  const handleDeleteReview = async () => {
    if (!myReview?._id || !window.confirm('Xóa đánh giá của bạn?')) return;
    try {
      const res = await reviewService.deleteReview(myReview._id);
      if (res?.success) {
        setMyReview(null);
        setEditReview(false);
        toast.success('Đã xóa đánh giá');
        const statsRes = await reviewService.getReviewsByCourse(id);
        if (statsRes?.success) setReviewStats(statsRes.data?.stats ?? reviewStats);
      }
    } catch { toast.error('Xóa đánh giá thất bại'); }
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
              <h2 className="text-lg font-semibold text-gray-900">Đánh giá</h2>
              <div className="flex items-center gap-3 mt-1">
                <StarRow rating={reviewStats.average_rating} size="md" />
                <span className="font-semibold text-gray-900">{Number(reviewStats.average_rating).toFixed(1)}</span>
                <span className="text-gray-500 text-sm">({reviewStats.review_count} đánh giá)</span>
              </div>
            </div>
            {enrolled ? (
              <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                {editReview || !myReview ? (
                  <ReviewForm
                    initialRating={myReview?.rating || 5}
                    initialComment={myReview?.comment || ''}
                    onSubmit={handleSubmitReview}
                    onCancel={myReview ? () => setEditReview(false) : undefined}
                    submitting={submittingReview}
                  />
                ) : (
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-9 h-9 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-sm font-semibold">
                      {myReview?.user_id?.name?.[0]?.toUpperCase() || 'U'}
                    </div>
                    <div className="flex-1">
                      <StarRow rating={myReview.rating} />
                      <p className="text-sm text-gray-700 mt-1">{myReview.comment || 'Đã đánh giá.'}</p>
                      <div className="flex gap-3 mt-2">
                        <button onClick={() => setEditReview(true)} className="text-xs text-primary-600 hover:underline">Sửa</button>
                        <button onClick={handleDeleteReview} className="text-xs text-red-500 hover:underline">Xóa</button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="px-6 py-3 border-b border-gray-100">
                <p className="text-sm text-gray-500">Đăng ký khóa học để đánh giá.</p>
              </div>
            )}
            <div className="px-6 py-3">
              <p className="text-sm font-medium text-gray-500">Danh sách đánh giá</p>
            </div>
          </section>

          {/* ── Bình luận ── */}
          <section className="mt-10 rounded-2xl bg-white shadow-lg border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
              <h2 className="text-lg font-semibold text-gray-900">Bình luận</h2>
              <p className="text-sm text-gray-500 mt-1">{commentLoading ? '…' : `${comments.length} bình luận`}</p>
            </div>

            {/* Form bình luận */}
            <div className="px-6 py-4 border-b border-gray-100">
              {token ? (
                <form onSubmit={handlePostComment} className="flex gap-3">
                  <div className="flex-shrink-0 w-9 h-9 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-sm font-semibold uppercase">
                    {currentUserId ? (() => { try { const u = JSON.parse(atob(localStorage.getItem('token') || ''.split('.')[1])); return (u.name || u.email || 'U')[0].toUpperCase(); } catch { return 'U'; } })() : 'U'} </div>
                  <div className="flex-1">
                    <textarea
                      value={commentText}
                      onChange={e => setCommentText(e.target.value)}
                      rows={2}
                      maxLength={2000}
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary-500 resize-none"
                      placeholder="Viết bình luận…"
                    />
                    <div className="flex justify-end mt-2">
                      <button type="submit" disabled={submittingComment || !commentText.trim()} className="px-4 py-1.5 bg-primary-600 text-white text-sm rounded-lg hover:bg-primary-700 disabled:opacity-60">
                        {submittingComment ? 'Đang gửi…' : 'Gửi bình luận'}
                      </button>
                    </div>
                  </div>
                </form>
              ) : (
                <p className="text-sm text-gray-500">
                  <Link to="/login" className="text-primary-600 hover:underline">Đăng nhập</Link> để bình luận.
                </p>
              )}
            </div>

            {/* Danh sách bình luận */}
            <ul className="divide-y divide-gray-100 px-6">
              {commentLoading ? (
                <li className="py-6 text-center text-gray-400">Đang tải bình luận…</li>
              ) : comments.length === 0 ? (
                <li className="py-6 text-center text-gray-500">Chưa có bình luận nào.</li>
              ) : (
                comments.map(c => (
                  <CommentItem
                    key={c._id}
                    comment={c}
                    currentUserId={currentUserId}
                    onDelete={handleDeleteComment}
                    onReplySubmit={handleReplySubmit}
                  />
                ))
              )}
            </ul>
          </section>
        </div>
      </article>
    </PageLayout>
  );
}
