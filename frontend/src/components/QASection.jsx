import { useState, useEffect, useCallback } from 'react';
import { questionService } from '../api';
import { socketService } from '../api/socketService';
import toast from 'react-hot-toast';

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const now = Date.now();
  const d = new Date(dateStr).getTime();
  const diff = Math.floor((now - d) / 1000);
  if (diff < 60) return `${diff} giây trước`;
  if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`;
  if (diff < 604800) return `${Math.floor(diff / 86400)} ngày trước`;
  return new Date(dateStr).toLocaleDateString('vi-VN');
}

function Avatar({ name, size = 'sm' }) {
  const initials = name
    ? name.split(' ').slice(-2).map((w) => w[0]).join('').toUpperCase()
    : '?';
  const colors = ['bg-blue-600', 'bg-purple-600', 'bg-emerald-600', 'bg-amber-600', 'bg-red-600', 'bg-cyan-600'];
  const idx = name ? name.charCodeAt(0) % colors.length : 0;
  const sz = size === 'sm' ? 'w-8 h-8 text-xs' : 'w-9 h-9 text-sm';
  return (
    <div className={`${sz} rounded-full ${colors[idx]} flex items-center justify-center font-semibold text-white shrink-0`}>
      {initials}
    </div>
  );
}

function UserBadge({ role }) {
  if (role === 'admin') {
    return (
      <span className="ml-1.5 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-red-500/20 text-red-300 border border-red-500/40">
        Admin
      </span>
    );
  }
  return null;
}

function stopPropagate(fn) {
  return (e, ...args) => { e.stopPropagation(); fn(e, ...args); };
}

export default function QASection({ courseId, lessonId, onNewAnswer }) {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [formTitle, setFormTitle] = useState('');
  const [formContent, setFormContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const [answerContents, setAnswerContents] = useState({});
  const [submittingAnswer, setSubmittingAnswer] = useState(null);
  const [upvotingId, setUpvotingId] = useState(null);

  const currentUser = (() => {
    try {
      const raw = localStorage.getItem('user');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  })();

  const loadQuestions = async (pg = 1) => {
    setLoading(true);
    try {
      let res;
      if (lessonId) {
        res = await questionService.getQuestionsByLesson(lessonId, { page: pg, limit: 10 });
      } else {
        res = await questionService.getQuestionsByCourse(courseId, { page: pg, limit: 10 });
      }
      if (res?.success) {
        setQuestions(pg === 1 ? res.data : (prev) => [...prev, ...res.data]);
        setTotal(res.pagination?.total || res.data.length);
        setPage(pg);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQuestions(1);
  }, [courseId, lessonId]);

  useEffect(() => {
    if (onNewAnswer) {
      const handler = (data) => {
        const { question_id, answer, question_title } = data || {};
        if (!question_id || !answer) return;
        // Chỉ cập nhật nếu câu hỏi này đang hiển thị
        setQuestions((prev) => {
          const exists = prev.some((q) => q._id === question_id);
          if (!exists) return prev;
          return prev.map((q) =>
            q._id === question_id
              ? { ...q, answers: [...(q.answers || []), answer], answer_count: (q.answer_count || 0) + 1 }
              : q
          );
        });
        if (expandedId === question_id) {
          loadQuestions(page);
        }
        // Toast thông báo (chỉ khi không phải user đang đọc câu hỏi đó)
        if (question_title) {
          toast.success(
            <div>
              <p className="font-medium">Có câu trả lời mới!</p>
              <p className="text-xs opacity-80">{question_title}</p>
            </div>,
            { duration: 4000 }
          );
        }
      };
      const off = socketService.onNewAnswer(handler);
      return off;
    }
  }, [onNewAnswer, expandedId, page]);

  const handleCreateQuestion = async (e) => {
    e.preventDefault();
    if (!formTitle.trim() || !formContent.trim()) {
      toast.error('Vui lòng nhập tiêu đề và nội dung câu hỏi');
      return;
    }
    setSubmitting(true);
    try {
      const res = await questionService.createQuestion({
        course_id: courseId,
        lesson_id: lessonId || undefined,
        title: formTitle.trim(),
        content: formContent.trim(),
      });
      if (res?.success) {
        setQuestions((prev) => [res.data, ...prev]);
        setTotal((t) => t + 1);
        setFormTitle('');
        setFormContent('');
        setShowForm(false);
        toast.success('Đã đăng câu hỏi!');
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Không thể tạo câu hỏi');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateAnswer = async (questionId) => {
    const content = (answerContents[questionId] || '').trim();
    if (!content) {
      toast.error('Vui lòng nhập nội dung câu trả lời');
      return;
    }
    setSubmittingAnswer(questionId);
    try {
      const res = await questionService.createAnswer(questionId, content);
      if (res?.success) {
        setQuestions((prev) =>
          prev.map((q) =>
            q._id === questionId
              ? { ...q, answers: [...(q.answers || []), res.data], answer_count: (q.answer_count || 0) + 1 }
              : q
          )
        );
        setAnswerContents((prev) => ({ ...prev, [questionId]: '' }));
        toast.success('Đã gửi câu trả lời!');
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Không thể gửi câu trả lời');
    } finally {
      setSubmittingAnswer(null);
    }
  };

  const handleUpvote = async (answerId, questionId) => {
    setUpvotingId(answerId);
    try {
      const res = await questionService.upvoteAnswer(answerId);
      if (res?.success) {
        const upvoted = res.data?.upvoted;
        setQuestions((prev) =>
          prev.map((q) => {
            if (q._id !== questionId) return q;
            return {
              ...q,
              answers: q.answers.map((a) => {
                if (a._id !== answerId) return a;
                const alreadyVoted = a.upvoted_by?.some(
                  (uid) => String(uid) === String(currentUser?._id)
                );
                return {
                  ...a,
                  upvotes: upvoted
                    ? alreadyVoted ? a.upvotes : a.upvotes + 1
                    : Math.max(0, a.upvotes - 1),
                  upvoted_by: upvoted
                    ? [...(a.upvoted_by || []), currentUser?._id]
                    : (a.upvoted_by || []).filter((uid) => String(uid) !== String(currentUser?._id)),
                };
              }),
            };
          })
        );
      }
    } catch {
      toast.error('Không thể upvote');
    } finally {
      setUpvotingId(null);
    }
  };

  const handleResolve = async (questionId, currentStatus) => {
    try {
      const res = await questionService.resolveQuestion(questionId);
      if (res?.success) {
        setQuestions((prev) =>
          prev.map((q) => (q._id === questionId ? { ...q, is_resolved: res.data.is_resolved } : q))
        );
        toast.success(res.message);
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Không thể cập nhật');
    }
  };

  const handleDeleteQuestion = async (questionId) => {
    if (!confirm('Xóa câu hỏi này?')) return;
    try {
      const res = await questionService.deleteQuestion(questionId);
      if (res?.success) {
        setQuestions((prev) => prev.filter((q) => q._id !== questionId));
        setTotal((t) => t - 1);
        toast.success('Đã xóa câu hỏi');
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Không thể xóa câu hỏi');
    }
  };

  const loadDetail = async (questionId) => {
    if (expandedId === questionId) {
      setExpandedId(null);
      return;
    }
    setExpandedId(questionId);
    try {
      const res = await questionService.getQuestionById(questionId);
      if (res?.success) {
        setQuestions((prev) =>
          prev.map((q) =>
            q._id === questionId
              ? { ...q, answers: res.data.answers || [], answer_count: res.data.answer_count || 0 }
              : q
          )
        );
      }
    } catch {
      // ignore
    }
  };

  const hasMore = questions.length < total;

  return (
    <section className="mt-10 border-t border-zinc-800 pt-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h2 className="flex items-center gap-2.5 text-base font-semibold text-zinc-100">
          <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Hỏi đáp
          {total > 0 && (
            <span className="ml-2 px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 text-xs font-medium">
              {total}
            </span>
          )}
        </h2>
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-colors"
        >
          {!showForm ? (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          ) : null}
          {showForm ? 'Hủy' : 'Đặt câu hỏi'}
        </button>
      </div>

      {/* Form tạo câu hỏi */}
      {showForm && (
        <form onSubmit={handleCreateQuestion} className="mb-8 rounded-xl border border-blue-500/30 bg-blue-500/5 p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1.5">Tiêu đề câu hỏi</label>
            <input
              type="text"
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
              maxLength={200}
              placeholder="Mô tả ngắn gọn vấn đề của bạn…"
              className="w-full rounded-lg bg-zinc-800 border border-zinc-600 px-4 py-2.5 text-zinc-100 placeholder:text-zinc-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
            />
            <p className="mt-1 text-xs text-zinc-500 text-right">{formTitle.length}/200</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1.5">Nội dung chi tiết</label>
            <textarea
              value={formContent}
              onChange={(e) => setFormContent(e.target.value)}
              rows={4}
              maxLength={5000}
              placeholder="Giải thích chi tiết vấn đề của bạn…"
              className="w-full rounded-lg bg-zinc-800 border border-zinc-600 px-4 py-3 text-zinc-100 placeholder:text-zinc-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none resize-y"
            />
            <p className="mt-1 text-xs text-zinc-500 text-right">{formContent.length}/5000</p>
          </div>
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2 rounded-lg border border-zinc-600 text-zinc-400 hover:text-white hover:bg-zinc-800 text-sm transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={submitting || !formTitle.trim() || !formContent.trim()}
              className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-600 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors flex items-center gap-2"
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Đang gửi…
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                  Đăng câu hỏi
                </>
              )}
            </button>
          </div>
        </form>
      )}

      {/* Danh sách câu hỏi */}
      {loading && questions.length === 0 ? (
        <div className="flex items-center justify-center py-12 text-zinc-500">
          <div className="w-6 h-6 border-2 border-zinc-600 border-t-blue-500 rounded-full animate-spin" />
          <span className="ml-3 text-sm">Đang tải câu hỏi…</span>
        </div>
      ) : questions.length === 0 ? (
        <div className="text-center py-12 text-zinc-500">
          <svg className="w-12 h-12 mx-auto mb-3 text-zinc-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-sm">Chưa có câu hỏi nào.</p>
          <p className="text-xs text-zinc-600 mt-1">Hãy là người đầu tiên đặt câu hỏi!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {questions.map((q) => {
            const isExpanded = expandedId === q._id;
            const isAuthor = currentUser && String(currentUser._id) === String(q.user_id?._id || q.user_id);
            const isAdmin = currentUser && currentUser.role === 'admin';
            const isInstructor = currentUser && currentUser.role === 'instructor';

            return (
              <div key={q._id} className="rounded-xl border border-zinc-800 bg-[#161616] overflow-hidden">
                {/* Câu hỏi */}
                <div
                  className="px-4 py-4 cursor-pointer hover:bg-zinc-800/30 transition-colors"
                  onClick={() => loadDetail(q._id)}
                >
                  <div className="flex items-start gap-3">
                    <Avatar name={q.user_id?.name} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center flex-wrap gap-1.5 min-w-0">
                          <span className="text-sm font-medium text-zinc-100 truncate">
                            {q.user_id?.name || 'Người dùng'}
                          </span>
                          <UserBadge role={q.user_id?.role} />
                          <span className="text-xs text-zinc-500 shrink-0">{timeAgo(q.created_at)}</span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {q.is_resolved && (
                            <span className="flex items-center gap-1 text-xs font-medium text-emerald-400">
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                              Đã giải quyết
                            </span>
                          )}
                          <svg
                            className={`w-4 h-4 text-zinc-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </div>
                      <h3 className="text-sm font-semibold text-zinc-100 mt-1 leading-snug">{q.title}</h3>
                      <p className="text-xs text-zinc-400 mt-1 line-clamp-2">{q.content}</p>
                      <div className="flex items-center gap-3 mt-2 text-xs text-zinc-500">
                        <span>{q.answer_count || 0} câu trả lời</span>
                        {q.lesson_id?.title && (
                          <>
                            <span>·</span>
                            <span className="truncate max-w-[150px]">{q.lesson_id.title}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Chi tiết + câu trả lời */}
                {isExpanded && (
                  <div className="border-t border-zinc-800 bg-[#141414] px-4 py-4 space-y-4">
                    {/* Nút hành động */}
                    <div className="flex flex-wrap items-center gap-2">
                      {(isAuthor || isAdmin || isInstructor) && (
                        <button
                          type="button"
                          onClick={stopPropagate(() => { handleResolve(q._id, q.is_resolved); })}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                            q.is_resolved
                              ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
                              : 'border-zinc-600 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
                          }`}
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          {q.is_resolved ? 'Đã giải quyết' : 'Đánh dấu giải quyết'}
                        </button>
                      )}
                      {(isAuthor || isAdmin) && (
                        <button
                          type="button"
                          onClick={stopPropagate(() => { handleDeleteQuestion(q._id); })}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          Xóa
                        </button>
                      )}
                    </div>

                    {/* Nội dung chi tiết câu hỏi */}
                    <div className="rounded-lg bg-zinc-800/50 border border-zinc-700 p-4">
                      <p className="text-sm text-zinc-200 whitespace-pre-wrap">{q.content}</p>
                    </div>

                    {/* Câu trả lời */}
                    {(q.answers || []).length > 0 ? (
                      <div className="space-y-3">
                        <h4 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                          {q.answers.length} câu trả lời
                        </h4>
                        {q.answers.map((a) => {
                          const alreadyVoted = a.upvoted_by?.some(
                            (uid) => String(uid) === String(currentUser?._id)
                          );
                          const isAnswerAuthor = currentUser && String(currentUser._id) === String(a.user_id?._id || a.user_id);
                          return (
                            <div key={a._id} className="flex gap-3">
                              <Avatar name={a.user_id?.name} />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center flex-wrap gap-1.5 mb-1">
                                  <span className="text-xs font-medium text-zinc-200">
                                    {a.user_id?.name || 'Người dùng'}
                                  </span>
                                  <UserBadge role={a.user_id?.role} />
                                  {a.is_instructor && (
                                    <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-violet-500/20 text-violet-300 border border-violet-500/40">
                                      Giảng viên
                                    </span>
                                  )}
                                  <span className="text-xs text-zinc-500">{timeAgo(a.created_at)}</span>
                                </div>
                                <p className="text-sm text-zinc-300 whitespace-pre-wrap">{a.content}</p>
                                <div className="flex items-center gap-3 mt-2">
                                  <button
                                    type="button"
                                    onClick={() => handleUpvote(a._id, q._id)}
                                    disabled={upvotingId === a._id}
                                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
                                      alreadyVoted
                                        ? 'border-blue-500/40 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20'
                                        : 'border-zinc-600 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
                                    }`}
                                  >
                                    <svg className="w-3.5 h-3.5" fill={alreadyVoted ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                                    </svg>
                                    {a.upvotes || 0}
                                  </button>
                                  {isAnswerAuthor && (
                                    <span className="text-xs text-zinc-600">Câu trả lời của bạn</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-sm text-zinc-500 text-center py-3">Chưa có câu trả lời nào.</p>
                    )}

                    {/* Form trả lời */}
                    <div className="border-t border-zinc-800 pt-4">
                      <textarea
                        value={answerContents[q._id] || ''}
                        onChange={(e) => setAnswerContents((prev) => ({ ...prev, [q._id]: e.target.value }))}
                        rows={3}
                        placeholder="Viết câu trả lời của bạn…"
                        className="w-full rounded-lg bg-zinc-800 border border-zinc-600 px-4 py-3 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none resize-y"
                      />
                      <div className="flex justify-end mt-2">
                        <button
                          type="button"
                          onClick={() => handleCreateAnswer(q._id)}
                          disabled={submittingAnswer === q._id || !((answerContents[q._id] || '').trim())}
                          className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-600 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors flex items-center gap-2"
                        >
                          {submittingAnswer === q._id ? (
                            <>
                              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              Đang gửi…
                            </>
                          ) : (
                            <>
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                              </svg>
                              Gửi câu trả lời
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {/* Load more */}
          {hasMore && (
            <div className="flex justify-center pt-4">
              <button
                type="button"
                onClick={() => loadQuestions(page + 1)}
                disabled={loading}
                className="px-6 py-2.5 rounded-lg border border-zinc-700 text-zinc-400 hover:text-white hover:bg-zinc-800 text-sm transition-colors disabled:opacity-50"
              >
                {loading ? 'Đang tải…' : `Xem thêm (${total - questions.length} còn lại)`}
              </button>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
