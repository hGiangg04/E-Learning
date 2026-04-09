import { useEffect, useLayoutEffect, useState, useMemo, useCallback, useRef } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { lessonService, courseService, progressService, quizService } from '../api';
import { parseYouTubeEmbedUrl } from '../utils/youtubeEmbed';

const BOOKMARK_KEY = 'elearning-lesson-bookmarks';

function readBookmarks() {
  try {
    const raw = localStorage.getItem(BOOKMARK_KEY);
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    return new Set(Array.isArray(arr) ? arr : []);
  } catch {
    return new Set();
  }
}

function writeBookmarks(set) {
  localStorage.setItem(BOOKMARK_KEY, JSON.stringify([...set]));
}

function formatDurationClock(sec) {
  if (sec == null || Number(sec) <= 0) return null;
  const n = Math.floor(Number(sec));
  const m = Math.floor(n / 60);
  const s = n % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function formatDurationVi(sec) {
  if (sec == null || Number(sec) <= 0) return null;
  const n = Math.floor(Number(sec));
  if (n < 60) return `${n} giây`;
  const m = Math.floor(n / 60);
  const s = n % 60;
  if (m < 60) return s > 0 ? `${m} phút ${s} giây` : `${m} phút`;
  const h = Math.floor(m / 60);
  const m2 = m % 60;
  return m2 > 0 ? `${h} giờ ${m2} phút` : `${h} giờ`;
}

/** Tổng giây đã học → hiển thị ngắn */
function formatStudyTimeTotal(seconds) {
  const n = Math.floor(Number(seconds) || 0);
  if (n <= 0) return '0 phút';
  if (n < 60) return `${n} giây`;
  const m = Math.floor(n / 60);
  if (m < 60) return `${m} phút`;
  const h = Math.floor(m / 60);
  const m2 = m % 60;
  return m2 > 0 ? `${h} giờ ${m2} phút` : `${h} giờ`;
}

function hasText(htmlOrText) {
  if (htmlOrText == null) return false;
  const s = String(htmlOrText).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  return s.length > 0;
}

const IconBack = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
  </svg>
);
const IconChevronDown = ({ open }) => (
  <svg
    className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
  </svg>
);
const IconVideo = () => (
  <svg className="w-4 h-4 shrink-0 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
    />
  </svg>
);
const IconMenu = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
  </svg>
);
const IconBookmark = ({ filled }) => (
  <svg
    className={`w-5 h-5 ${filled ? 'text-amber-400 fill-amber-400' : 'text-zinc-500'}`}
    fill={filled ? 'currentColor' : 'none'}
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
  </svg>
);
const IconArrowNav = ({ dir }) => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    {dir === 'left' ? (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
    ) : (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    )}
  </svg>
);
const IconCheck = () => (
  <svg className="w-3.5 h-3.5 text-emerald-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

export default function LessonLearnPage() {
  const { courseId, lessonId } = useParams();
  const navigate = useNavigate();
  const [lesson, setLesson] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [courseTitle, setCourseTitle] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tocOpen, setTocOpen] = useState(true);
  const [mobileSidebar, setMobileSidebar] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [lessonProgressById, setLessonProgressById] = useState({});
  const [courseProgress, setCourseProgress] = useState(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const [quiz, setQuiz] = useState(null);
  const [quizLoading, setQuizLoading] = useState(false);
  const [showQuiz, setShowQuiz] = useState(false);
  const [quizData, setQuizData] = useState(null);
  const [quizAttempt, setQuizAttempt] = useState(null);
  const [quizAnswers, setQuizAnswers] = useState({});
  const [quizSubmitting, setQuizSubmitting] = useState(false);
  const [quizResult, setQuizResult] = useState(null);
  const [timeLeft, setTimeLeft] = useState(null);
  const timerRef = useRef(null);

  const videoRef = useRef(null);
  const videoSegmentStartRef = useRef(Date.now());
  const textStudyAccumRef = useRef(0);
  const videoCompleteSentRef = useRef(false);

  /** YouTube nhúng iframe; file: URL video (upload hoặc mp4/webm trực tiếp) */
  const lessonVideo = useMemo(() => {
    if (!lesson?.video_url) return { kind: 'none' };
    const raw = String(lesson.video_url).trim();
    if (!raw) return { kind: 'none' };

    const yt = parseYouTubeEmbedUrl(raw);
    if (yt) return { kind: 'youtube', embedSrc: yt };

    if (raw.startsWith('/uploads/videos/')) {
      const base = import.meta.env.VITE_API_BASE_URL?.trim().replace(/\/+$/, '') || '';
      if (base && !import.meta.env.DEV) {
        const origin = base.replace(/\/api$/i, '');
        const src = origin ? `${origin}${raw}` : raw;
        return { kind: 'file', src };
      }
      return { kind: 'file', src: raw };
    }

    return { kind: 'file', src: raw };
  }, [lesson?.video_url]);

  const fileVideoSrc = lessonVideo.kind === 'file' ? lessonVideo.src : null;

  const lessonIndex = useMemo(() => {
    if (!lesson?._id || !lessons.length) return -1;
    return lessons.findIndex((l) => String(l._id) === String(lesson._id));
  }, [lesson, lessons]);

  const prevLesson = lessonIndex > 0 ? lessons[lessonIndex - 1] : null;
  const nextLesson = lessonIndex >= 0 && lessonIndex < lessons.length - 1 ? lessons[lessonIndex + 1] : null;

  const syncBookmark = useCallback((id) => {
    const set = readBookmarks();
    setBookmarked(set.has(String(id)));
  }, []);

  const patchLessonProgress = useCallback(
    async ({ time_spent = 0, progress_percentage, is_completed } = {}) => {
      if (!lessonId) return;
      const v = videoRef.current;
      let pct = progress_percentage;
      if (pct == null && v && v.duration > 0 && !Number.isNaN(v.duration)) {
        pct = Math.min(100, Math.round((v.currentTime / v.duration) * 1000) / 10);
      }
      if (pct == null) pct = 0;
      try {
        const res = await progressService.updateLessonProgress(lessonId, {
          time_spent,
          progress_percentage: pct,
          ...(is_completed !== undefined ? { is_completed } : {}),
        });
        if (res?.success && res.data?.lesson_progress) {
          const lp = res.data.lesson_progress;
          setLessonProgressById((prev) => ({ ...prev, [String(lp.lesson_id || lessonId)]: lp }));
          if (res.data.course_progress) setCourseProgress(res.data.course_progress);
          if (Number(lp.is_completed) === 1) setIsCompleted(true);
        }
      } catch (err) {
        const st = err?.response?.status;
        const msg = err?.response?.data?.message;
        if (st === 403) {
          toast.error(msg || 'Không thể lưu tiến độ — cần ghi danh khóa học (hoặc chỉ xem bài miễn phí).');
        }
      }
    },
    [lessonId]
  );

  useEffect(() => {
    if (lessonId) syncBookmark(lessonId);
  }, [lessonId, syncBookmark]);

  useEffect(() => {
    if (lessonId) {
      const prog = lessonProgressById[String(lessonId)];
      setIsCompleted(!!(prog && Number(prog.is_completed) === 1));
    }
  }, [lessonId, lessonProgressById]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('Vui lòng đăng nhập');
      navigate('/login', { state: { from: { pathname: `/courses/${courseId}/lesson/${lessonId}` } } });
      return;
    }

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const [lessonRes, listRes, courseRes] = await Promise.all([
          lessonService.getLesson(lessonId),
          lessonService.getLessonsByCourse(courseId),
          courseService.getById(courseId).catch(() => null),
        ]);

        const c = courseRes?.data?.data?.course;
        if (c?.title) setCourseTitle(c.title);

        if (lessonRes.success && lessonRes.data?.lesson) {
          setLesson(lessonRes.data.lesson);
        } else {
          setError(lessonRes.message || 'Không tải được bài học');
        }

        if (listRes.success && listRes.data?.lessons) {
          setLessons(listRes.data.lessons);
        }

        try {
          const [progList, progCourse] = await Promise.all([
            progressService.getLessonProgressByCourse(courseId),
            progressService.getCourseProgress(courseId),
          ]);
          if (progList?.success && Array.isArray(progList.data?.lesson_progress)) {
            const m = {};
            for (const row of progList.data.lesson_progress) {
              m[String(row.lesson_id)] = row;
            }
            setLessonProgressById(m);
            setIsCompleted(!!(m[String(lessonId)] && Number(m[String(lessonId)].is_completed) === 1));
          }
          if (progCourse?.success && progCourse.data?.course_progress) {
            setCourseProgress(progCourse.data.course_progress);
          }
        } catch {
          /* chưa có tiến độ / lỗi mạng — bỏ qua */
        }
      } catch (err) {
        const msg = err.response?.data?.message || 'Không tải được bài học';
        const code = err.response?.status;
        setError(msg);
        if (code === 403) toast.error(msg);
      } finally {
        setLoading(false);
      }
    };

    if (courseId && lessonId) load();
  }, [courseId, lessonId, navigate]);

  useEffect(() => {
    textStudyAccumRef.current = 0;
    videoCompleteSentRef.current = false;
  }, [lessonId]);

  useLayoutEffect(() => {
    if (!lessonId || !fileVideoSrc) return undefined;
    const el = videoRef.current;
    if (!el) return undefined;

    const onPlay = () => {
      videoSegmentStartRef.current = Date.now();
    };

    const markVideoComplete = () => {
      if (videoCompleteSentRef.current) return;
      videoCompleteSentRef.current = true;
      void patchLessonProgress({
        time_spent: 0,
        progress_percentage: 100,
        is_completed: 1,
      });
      videoSegmentStartRef.current = Date.now();
    };

    const onTimeUpdate = () => {
      const v = videoRef.current;
      if (!v || v.paused || v.ended) return;
      const dur = v.duration;
      if (dur > 0 && !Number.isNaN(dur) && v.currentTime >= dur - 0.5) {
        markVideoComplete();
        return;
      }
      const now = Date.now();
      if (now - videoSegmentStartRef.current < 8000) return;
      videoSegmentStartRef.current = now;
      void patchLessonProgress({ time_spent: 8 });
    };

    const onPause = () => {
      const v = videoRef.current;
      if (!v || v.ended) return;
      const dur = v.duration;
      if (dur > 0 && !Number.isNaN(dur) && v.currentTime >= dur - 0.5) {
        markVideoComplete();
        return;
      }
      const now = Date.now();
      const wall = Math.max(0, Math.floor((now - videoSegmentStartRef.current) / 1000));
      if (wall < 3) return;
      videoSegmentStartRef.current = now;
      void patchLessonProgress({ time_spent: wall });
    };

    const onEnded = () => {
      markVideoComplete();
    };

    el.addEventListener('play', onPlay);
    el.addEventListener('timeupdate', onTimeUpdate);
    el.addEventListener('pause', onPause);
    el.addEventListener('ended', onEnded);
    return () => {
      el.removeEventListener('play', onPlay);
      el.removeEventListener('timeupdate', onTimeUpdate);
      el.removeEventListener('pause', onPause);
      el.removeEventListener('ended', onEnded);
    };
  }, [lessonId, fileVideoSrc, patchLessonProgress]);

  useEffect(() => {
    if (!lessonId || lessonVideo.kind === 'file' || lessonVideo.kind === 'youtube') return undefined;
    textStudyAccumRef.current = 0;
    const timer = window.setInterval(() => {
      if (document.visibilityState !== 'visible') return;
      textStudyAccumRef.current += 30;
      const pct = Math.min(100, Math.round((textStudyAccumRef.current / 90) * 100));
      void patchLessonProgress({ time_spent: 30, progress_percentage: pct });
    }, 30000);
    return () => window.clearInterval(timer);
  }, [lessonId, lessonVideo.kind, patchLessonProgress]);

  const toggleBookmark = () => {
    if (!lessonId) return;
    const set = readBookmarks();
    const id = String(lessonId);
    if (set.has(id)) {
      set.delete(id);
    } else {
      set.add(id);
    }
    writeBookmarks(set);
    setBookmarked(set.has(id));
    toast.success(set.has(id) ? 'Đã đánh dấu trang' : 'Đã bỏ đánh dấu');
  };

  const handleComplete = async () => {
    if (!lessonId) return;
    try {
      const res = await progressService.updateLessonProgress(lessonId, {
        progress_percentage: 100,
        is_completed: 1,
      });
      if (res?.success) {
        setIsCompleted(true);
        if (res.data?.lesson_progress) {
          const lp = res.data.lesson_progress;
          setLessonProgressById((prev) => ({ ...prev, [String(lp.lesson_id || lessonId)]: lp }));
        }
        if (res.data?.course_progress) setCourseProgress(res.data.course_progress);
        toast.success('Bạn đã hoàn thành bài học này!');
      }
    } catch (err) {
      const msg = err?.response?.data?.message;
      toast.error(msg || 'Không thể đánh dấu hoàn thành');
    }
  };

  const loadQuiz = useCallback(async () => {
    if (!lessonId || !isCompleted) return;
    setQuizLoading(true);
    try {
      const res = await quizService.getQuizByLesson(lessonId);
      if (res?.data?.quiz) {
        setQuiz(res.data.quiz);
      }
    } catch {
      // không có quiz thì thôi
    } finally {
      setQuizLoading(false);
    }
  }, [lessonId, isCompleted]);

  useEffect(() => {
    if (isCompleted) {
      loadQuiz();
    }
  }, [isCompleted, loadQuiz]);

  const startQuiz = async () => {
    if (!quiz?.id) return;
    setShowQuiz(true);
    setQuizResult(null);
    setQuizAnswers({});
    try {
      const res = await quizService.getQuizForTake(quiz.id);
      if (res?.data) {
        setQuizData(res.data);
        if (res.data.quiz?.time_limit > 0) {
          setTimeLeft(res.data.quiz.time_limit * 60);
          timerRef.current = setInterval(() => {
            setTimeLeft((t) => {
              if (t <= 1) {
                clearInterval(timerRef.current);
                handleSubmitQuiz(true);
                return 0;
              }
              return t - 1;
            });
          }, 1000);
        }
      }
      const startRes = await quizService.startQuiz(quiz.id);
      if (startRes?.data?.attempt_id) {
        setQuizAttempt({ id: startRes.data.attempt_id, number: startRes.data.attempt_number });
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Không thể bắt đầu bài kiểm tra');
      setShowQuiz(false);
    }
  };

  const handleSelectAnswer = (questionId, optionId) => {
    setQuizAnswers((prev) => ({ ...prev, [questionId]: optionId }));
  };

  const handleSubmitQuiz = async (autoSubmit = false) => {
    if (!quizAttempt?.id || quizSubmitting) return;
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    setQuizSubmitting(true);
    const timeSpent = quizData?.quiz?.time_limit
      ? (quizData.quiz.time_limit * 60) - (timeLeft || 0)
      : 0;
    try {
      const answers = Object.entries(quizAnswers).map(([question_id, option_id]) => ({
        question_id,
        option_id,
      }));
      const res = await quizService.submitQuiz(quizAttempt.id, { answers, time_spent: timeSpent });
      if (res?.data) {
        setQuizResult(res.data.attempt);
        toast.success(autoSubmit ? 'Hết giờ! Bài đã được nộp tự động.' : 'Đã nộp bài!');
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Không thể nộp bài');
    } finally {
      setQuizSubmitting(false);
    }
  };

  const closeQuiz = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setShowQuiz(false);
    setQuizData(null);
    setQuizAttempt(null);
    setQuizAnswers({});
    setQuizResult(null);
    setTimeLeft(null);
  };

  const formatTimeLeft = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#121212] flex items-center justify-center text-zinc-500">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-zinc-600 border-t-blue-500 rounded-full animate-spin" />
          <span>Đang tải bài học…</span>
        </div>
      </div>
    );
  }

  if (error || !lesson) {
    return (
      <div className="min-h-screen bg-[#121212] flex flex-col items-center justify-center px-4 text-zinc-300">
        <p className="text-center">{error || 'Không tìm thấy bài học.'}</p>
        <Link
          to={`/courses/${courseId}`}
          className="mt-6 px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium transition-colors"
        >
          Về trang khóa học
        </Link>
      </div>
    );
  }

  const durationClock = formatDurationClock(lesson.video_duration);
  const durationVi = formatDurationVi(lesson.video_duration);
  const hasContent = hasText(lesson.content);

  const lessonHtmlClass =
    'lesson-content-dark max-w-none text-sm sm:text-base leading-relaxed text-zinc-300 [&_h1]:text-xl [&_h1]:font-semibold [&_h1]:text-white [&_h1]:mt-6 [&_h1]:mb-2 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-zinc-100 [&_h2]:mt-5 [&_h2]:mb-2 [&_h3]:text-base [&_h3]:font-semibold [&_h3]:text-zinc-200 [&_h3]:mt-4 [&_h3]:mb-2 [&_p]:my-2 [&_strong]:text-zinc-100 [&_a]:text-blue-400 [&_a]:underline [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:my-3 [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:my-3 [&_li]:my-1';

  const sidebarContent = (
    <>
      <div className="p-4 border-b border-zinc-800/80 flex items-center gap-3">
        <Link
          to={`/courses/${courseId}`}
          className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          aria-label="Quay lại"
        >
          <IconBack />
        </Link>
        <div className="min-w-0 flex-1">
          <p className="text-xs text-zinc-500 truncate">{courseTitle || 'Khóa học'}</p>
          <p className="text-sm font-medium text-zinc-100 truncate leading-tight">{lesson.title}</p>
        </div>
        <button
          type="button"
          className="p-2 rounded-lg text-zinc-500 hover:text-zinc-300 lg:hidden"
          onClick={() => setMobileSidebar(false)}
          aria-label="Đóng"
        >
          <span className="text-lg leading-none">×</span>
        </button>
      </div>

      <div className="p-2">
        <button
          type="button"
          onClick={() => setTocOpen((v) => !v)}
          className="w-full flex items-center justify-between px-3 py-3 rounded-lg text-left text-sm font-medium text-zinc-200 hover:bg-zinc-800/60 transition-colors"
        >
          <span className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-zinc-700 flex items-center justify-center text-xs text-zinc-300">
              1
            </span>
            Nội dung khóa học
          </span>
          <IconChevronDown open={tocOpen} />
        </button>
        {tocOpen && (
          <ul className="mt-1 space-y-0.5 pl-2 border-l border-zinc-800 ml-4">
            {lessons.map((l, idx) => {
              const active = String(l._id) === String(lesson._id);
              const prog = lessonProgressById[String(l._id)];
              const done = prog && Number(prog.is_completed) === 1;
              const pct =
                prog?.progress_percentage != null ? Math.round(Number(prog.progress_percentage)) : null;
              return (
                <li key={l._id}>
                  <Link
                    to={`/courses/${courseId}/lesson/${l._id}`}
                    onClick={() => setMobileSidebar(false)}
                    className={`flex items-start gap-2 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                      active
                        ? 'bg-zinc-800 text-white border-l-2 border-blue-500 -ml-px pl-[calc(0.75rem-1px)]'
                        : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200'
                    }`}
                  >
                    <span className="shrink-0 mt-0.5">{done ? <IconCheck /> : <IconVideo />}</span>
                    <span className="leading-snug min-w-0 flex-1">
                      <span className="flex flex-wrap items-baseline gap-x-2 gap-y-0">
                        <span>
                          <span className="text-zinc-600 mr-1.5">{idx + 1}.</span>
                          <span className="break-words">{l.title}</span>
                        </span>
                        {!done && pct != null && pct > 0 ? (
                          <span className="text-xs text-blue-400/90 tabular-nums">{pct}%</span>
                        ) : null}
                      </span>
                      {formatDurationClock(l.video_duration) ? (
                        <span className="block text-xs text-zinc-600 mt-0.5 font-normal tabular-nums">
                          {formatDurationVi(l.video_duration) || formatDurationClock(l.video_duration)}
                        </span>
                      ) : null}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
        {lessons.length === 0 && (
          <p className="px-3 py-4 text-sm text-zinc-500">Chưa có bài học.</p>
        )}
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-[#121212] text-zinc-200 flex flex-col">
      {/* Top bar — desktop */}
      <header className="h-14 shrink-0 border-b border-zinc-800 bg-[#141414] flex items-center justify-between px-4 lg:hidden">
        <button
          type="button"
          onClick={() => setMobileSidebar(true)}
          className="p-2 text-zinc-400 hover:text-white"
          aria-label="Mở menu"
        >
          <IconMenu />
        </button>
        <span className="text-sm font-medium text-zinc-200 truncate max-w-[60%]">{lesson.title}</span>
        <Link to={`/courses/${courseId}`} className="text-xs text-blue-400 hover:underline">
          Khóa học
        </Link>
      </header>

      <div className="flex flex-1 min-h-0">
        {/* Sidebar desktop */}
        <aside className="hidden lg:flex w-[320px] shrink-0 flex-col border-r border-zinc-800 bg-[#161616]">
          {sidebarContent}
        </aside>

        {/* Mobile drawer */}
        {mobileSidebar && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <button
              type="button"
              className="absolute inset-0 bg-black/70"
              aria-label="Đóng menu"
              onClick={() => setMobileSidebar(false)}
            />
            <div className="absolute left-0 top-0 bottom-0 w-[min(100%,320px)] bg-[#161616] border-r border-zinc-800 flex flex-col shadow-2xl">
              {sidebarContent}
            </div>
          </div>
        )}

        {/* Main */}
        <main className="flex-1 min-w-0 overflow-y-auto bg-[#121212]">
          <div className="max-w-4xl mx-auto px-4 sm:px-8 py-6 lg:py-10">
            {/* Title row + nav */}
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
              <h1 className="text-xl sm:text-2xl font-semibold text-white leading-snug pr-4">
                {lesson.title}
              </h1>
              <div className="flex items-center gap-2 shrink-0">
                {prevLesson ? (
                  <Link
                    to={`/courses/${courseId}/lesson/${prevLesson._id}`}
                    className="p-2 rounded-lg border border-zinc-700 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                    title="Bài trước"
                  >
                    <IconArrowNav dir="left" />
                  </Link>
                ) : (
                  <span className="p-2 rounded-lg border border-zinc-800 text-zinc-700 cursor-not-allowed">
                    <IconArrowNav dir="left" />
                  </span>
                )}
                {nextLesson ? (
                  <Link
                    to={`/courses/${courseId}/lesson/${nextLesson._id}`}
                    className="p-2 rounded-lg border border-zinc-700 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                    title="Bài sau"
                  >
                    <IconArrowNav dir="right" />
                  </Link>
                ) : (
                  <span className="p-2 rounded-lg border border-zinc-800 text-zinc-700 cursor-not-allowed">
                    <IconArrowNav dir="right" />
                  </span>
                )}
              </div>
            </div>

            {courseProgress ? (
              <div className="mb-6 rounded-xl border border-zinc-800 bg-zinc-900/50 px-4 py-3 text-sm text-zinc-300">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <span className="font-medium text-zinc-100">Tiến độ khóa học</span>
                  <span className="text-zinc-600 hidden sm:inline">·</span>
                  <span>
                    {Math.min(100, Math.round(Number(courseProgress.progress_percentage) || 0))}% hoàn thành
                  </span>
                  <span className="text-zinc-600">·</span>
                  <span>
                    {Number(courseProgress.lessons_completed) || 0}/{Number(courseProgress.total_lessons) || 0}{' '}
                    bài
                  </span>
                  <span className="text-zinc-600">·</span>
                  <span className="text-zinc-400">
                    Đã học ~{formatStudyTimeTotal(courseProgress.total_time_spent)}
                  </span>
                </div>
                <div className="mt-2 h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-blue-500 transition-all duration-500"
                    style={{
                      width: `${Math.min(100, Math.round(Number(courseProgress.progress_percentage) || 0))}%`,
                    }}
                  />
                </div>
              </div>
            ) : null}

            {/* Bookmark */}
            <button
              type="button"
              onClick={toggleBookmark}
              className="flex items-center gap-2 mb-4 text-sm text-zinc-400 hover:text-amber-400/90 transition-colors"
            >
              <IconBookmark filled={bookmarked} />
              <span>Đánh dấu trang này</span>
            </button>

            {/* Quiz section */}
            {isCompleted && (
              <div className="mb-6 rounded-xl border border-zinc-800 bg-gradient-to-r from-purple-900/30 to-indigo-900/30 p-4">
                {quizLoading ? (
                  <div className="flex items-center gap-3 text-zinc-400">
                    <div className="w-5 h-5 border-2 border-zinc-600 border-t-purple-400 rounded-full animate-spin" />
                    <span className="text-sm">Đang tải bài kiểm tra...</span>
                  </div>
                ) : quiz ? (
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h3 className="text-base font-semibold text-white flex items-center gap-2">
                        <svg className="w-5 h-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Kiểm tra kiến thức
                      </h3>
                      <p className="text-sm text-zinc-400 mt-1">
                        {quiz.title} — {quiz.question_count} câu hỏi
                        {quiz.time_limit > 0 && ` · ${quiz.time_limit} phút`}
                        {quiz.passing_score > 0 && ` · Đạt từ ${quiz.passing_score}%`}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={startQuiz}
                      className="px-5 py-2.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-medium transition-colors flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Làm bài kiểm tra
                    </button>
                  </div>
                ) : null}
              </div>
            )}

            {/* Hoàn thành bài học */}
            <button
              type="button"
              onClick={handleComplete}
              disabled={isCompleted}
              className={`flex items-center gap-2 mb-4 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isCompleted
                  ? 'bg-emerald-500/20 text-emerald-400 cursor-default'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white'
              }`}
            >
              {isCompleted ? (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Đã hoàn thành
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Hoàn thành bài học
                </>
              )}
            </button>

            {/* Video block — file upload / mp4 hoặc YouTube nhúng */}
            {(lessonVideo.kind === 'youtube' || lessonVideo.kind === 'file') && (
              <section className="rounded-xl border border-zinc-800 bg-[#161616] overflow-hidden shadow-xl mb-10">
                <div className="px-4 py-3 border-b border-zinc-800 bg-zinc-900/50">
                  <h2 className="text-sm font-medium text-zinc-200">
                    {lessonVideo.kind === 'youtube' ? 'Video YouTube' : 'Video bài học'}
                    {durationVi ? (
                      <span className="text-zinc-500 font-normal">
                        {' '}
                        — {durationVi}
                        {durationClock ? (
                          <span className="tabular-nums text-zinc-600"> ({durationClock})</span>
                        ) : null}
                      </span>
                    ) : null}
                  </h2>
                </div>
                <div className="p-3 sm:p-4">
                  <div className="aspect-video w-full rounded-lg overflow-hidden bg-black ring-1 ring-zinc-800">
                    {lessonVideo.kind === 'youtube' ? (
                      <iframe
                        title="YouTube"
                        src={`${lessonVideo.embedSrc}?rel=0`}
                        className="w-full h-full border-0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        allowFullScreen
                      />
                    ) : (
                      <video
                        ref={videoRef}
                        key={fileVideoSrc}
                        controls
                        autoPlay={false}
                        className="w-full h-full"
                        preload="metadata"
                      >
                        <source src={fileVideoSrc} />
                        Trình duyệt của bạn không hỗ trợ phát video.
                      </video>
                    )}
                  </div>
                </div>
              </section>
            )}

            {/* Thời lượng — chỉ hiển thị nếu không có video */}
            {lessonVideo.kind === 'none' && (
              <div className="mb-8">
                <h2 className="text-xs font-medium uppercase tracking-wide text-zinc-500 mb-2">
                  Thời lượng
                </h2>
                {durationVi ? (
                  <p className="text-sm text-zinc-200">
                    <span className="text-zinc-100 font-medium">{durationVi}</span>
                    {durationClock ? (
                      <span className="text-zinc-500 tabular-nums ml-2">({durationClock})</span>
                    ) : null}
                  </p>
                ) : (
                  <p className="text-sm text-zinc-500">Chưa có thông tin thời lượng video.</p>
                )}
              </div>
            )}

            <section className="mb-10">
              <h2 className="flex items-center gap-2.5 text-base font-semibold text-zinc-100 mb-4">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-800 text-zinc-300 border border-zinc-700">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"
                    />
                  </svg>
                </span>
                Nội dung bài học
              </h2>
              {hasContent ? (
                <div className={lessonHtmlClass} dangerouslySetInnerHTML={{ __html: lesson.content }} />
              ) : (
                <p className="text-sm text-zinc-500">Chưa có nội dung văn bản cho bài này.</p>
              )}
            </section>
          </div>
        </main>
      </div>

      {/* Quiz Modal */}
      {showQuiz && quizData && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4">
          <div className="w-full max-w-3xl max-h-[90vh] bg-[#1a1a2e] rounded-2xl border border-zinc-700 flex flex-col overflow-hidden">
            {/* Quiz Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-700 bg-[#16162a]">
              <div>
                <h2 className="text-lg font-semibold text-white">{quizData.quiz?.title || 'Bài kiểm tra'}</h2>
                {quizData.quiz?.description && (
                  <p className="text-sm text-zinc-400 mt-1">{quizData.quiz.description}</p>
                )}
              </div>
              {timeLeft != null && timeLeft > 0 && (
                <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${timeLeft < 60 ? 'bg-red-600' : 'bg-zinc-800'}`}>
                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-white font-mono font-semibold">{formatTimeLeft(timeLeft)}</span>
                </div>
              )}
              <button
                type="button"
                onClick={closeQuiz}
                className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-700 rounded-lg transition-colors"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Quiz Content - Hiển thị kết quả */}
            {quizResult ? (
              <div className="flex-1 overflow-y-auto p-6">
                <div className={`text-center py-8 ${quizResult.is_passed ? 'text-emerald-400' : 'text-red-400'}`}>
                  <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center ${quizResult.is_passed ? 'bg-emerald-500/20' : 'bg-red-500/20'}`}>
                    {quizResult.is_passed ? (
                      <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    )}
                  </div>
                  <h3 className="text-2xl font-bold mt-4">
                    {quizResult.is_passed ? 'Chúc mừng! Bạn đã đạt!' : 'Chưa đạt. Cố gắng lần sau!'}
                  </h3>
                  <p className="text-4xl font-bold mt-2">{quizResult.score}%</p>
                  <p className="text-zinc-400 mt-2">
                    {quizResult.earned_points}/{quizResult.total_points} điểm
                    · Điểm đạt: {quizData.quiz?.passing_score || 0}%
                  </p>
                </div>

                {/* Hiển thị đáp án đúng */}
                {quizData.quiz?.show_correct_answer && (
                  <div className="mt-6 space-y-4">
                    <h4 className="text-lg font-semibold text-white">Đáp án</h4>
                    {quizData.questions?.map((q, idx) => {
                      const selectedOptionId = quizAnswers[q.id];
                      const correctOption = q.options?.find((o) => o.is_correct);
                      const isCorrect = selectedOptionId === correctOption?.id;
                      return (
                        <div key={q.id} className={`p-4 rounded-xl border ${isCorrect ? 'border-emerald-600 bg-emerald-900/20' : 'border-red-600 bg-red-900/20'}`}>
                          <div className="flex items-start gap-3">
                            <span className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold ${isCorrect ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'}`}>
                              {idx + 1}
                            </span>
                            <div className="flex-1">
                              <p className="text-zinc-100 font-medium">{q.question_text}</p>
                              <div className="mt-3 space-y-2">
                                {q.options?.map((opt) => {
                                  const isSelected = opt.id === selectedOptionId;
                                  const isCorrectOpt = opt.is_correct;
                                  return (
                                    <div
                                      key={opt.id}
                                      className={`p-3 rounded-lg text-sm ${
                                        isCorrectOpt
                                          ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500'
                                          : isSelected
                                          ? 'bg-red-600/30 text-red-300 border border-red-500'
                                          : 'bg-zinc-800/50 text-zinc-400'
                                      }`}
                                    >
                                      {opt.option_text}
                                      {isCorrectOpt && <span className="ml-2 text-emerald-400">✓ Đáp án đúng</span>}
                                      {isSelected && !isCorrectOpt && <span className="ml-2 text-red-400">✗ Bạn chọn</span>}
                                    </div>
                                  );
                                })}
                              </div>
                              {q.explanation && (
                                <p className="mt-3 text-sm text-zinc-400 italic">Giải thích: {q.explanation}</p>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                <div className="mt-6 flex justify-center">
                  <button
                    type="button"
                    onClick={closeQuiz}
                    className="px-6 py-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium transition-colors"
                  >
                    Quay lại bài học
                  </button>
                </div>
              </div>
            ) : (
              /* Quiz Questions */
              <div className="flex-1 overflow-y-auto p-6">
                <div className="space-y-6">
                  {quizData.questions?.map((q, idx) => (
                    <div key={q.id} className="p-5 rounded-xl bg-zinc-800/50 border border-zinc-700">
                      <div className="flex items-start gap-3 mb-4">
                        <span className="shrink-0 w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center text-sm font-bold">
                          {idx + 1}
                        </span>
                        <p className="text-zinc-100 font-medium text-lg leading-relaxed">{q.question_text}</p>
                      </div>
                      <div className="space-y-3 ml-11">
                        {q.options?.map((opt) => {
                          const isSelected = quizAnswers[q.id] === opt.id;
                          return (
                            <button
                              key={opt.id}
                              type="button"
                              onClick={() => handleSelectAnswer(q.id, opt.id)}
                              className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                                isSelected
                                  ? 'border-purple-500 bg-purple-500/20 text-white'
                                  : 'border-zinc-600 bg-zinc-800/50 text-zinc-300 hover:border-zinc-500 hover:bg-zinc-700/50'
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <span className={`shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                                  isSelected ? 'border-purple-500 bg-purple-500' : 'border-zinc-500'
                                }`}>
                                  {isSelected && (
                                    <span className="w-2.5 h-2.5 rounded-full bg-white" />
                                  )}
                                </span>
                                <span>{opt.option_text}</span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Quiz Footer - Nút nộp bài */}
            {!quizResult && (
              <div className="px-6 py-4 border-t border-zinc-700 bg-[#16162a] flex justify-between items-center">
                <p className="text-sm text-zinc-400">
                  {Object.keys(quizAnswers).length}/{quizData.questions?.length || 0} câu đã trả lời
                </p>
                <button
                  type="button"
                  onClick={() => handleSubmitQuiz(false)}
                  disabled={quizSubmitting}
                  className="px-6 py-3 rounded-lg bg-purple-600 hover:bg-purple-500 disabled:bg-zinc-600 disabled:cursor-not-allowed text-white font-medium transition-colors flex items-center gap-2"
                >
                  {quizSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Đang nộp...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Nộp bài
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <style>{`
        .lesson-content-dark ul { list-style-type: disc; padding-left: 1.25rem; margin: 0.75rem 0; }
        .lesson-content-dark ol { list-style-type: decimal; padding-left: 1.25rem; margin: 0.75rem 0; }
        .lesson-content-dark h1, .lesson-content-dark h2, .lesson-content-dark h3 { margin-top: 1.25rem; margin-bottom: 0.5rem; }
      `}</style>
    </div>
  );
}
