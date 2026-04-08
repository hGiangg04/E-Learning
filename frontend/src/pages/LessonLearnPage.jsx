import { useEffect, useState, useMemo, useCallback } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { lessonService, courseService } from '../api';

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

  const videoUrl = useMemo(() => {
    if (!lesson?.video_url) return null;
    const url = String(lesson.video_url);
    if (url.startsWith('/uploads/videos/')) {
      // Cùng origin + proxy Vite (`/uploads` → backend); prod: gốc API bỏ hậu tố /api
      const base = import.meta.env.VITE_API_BASE_URL?.trim().replace(/\/+$/, '') || '';
      if (base && !import.meta.env.DEV) {
        const origin = base.replace(/\/api$/i, '');
        return origin ? `${origin}${url}` : url;
      }
      return url;
    }
    return url;
  }, [lesson?.video_url]);

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

  useEffect(() => {
    if (lessonId) syncBookmark(lessonId);
  }, [lessonId, syncBookmark]);

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
  const hasObjectives = hasText(lesson.objectives);
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
                    <IconVideo />
                    <span className="leading-snug min-w-0">
                      <span className="text-zinc-600 mr-1.5">{idx + 1}.</span>
                      <span className="break-words">{l.title}</span>
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

            {/* Bookmark */}
            <button
              type="button"
              onClick={toggleBookmark}
              className="flex items-center gap-2 mb-6 text-sm text-zinc-400 hover:text-amber-400/90 transition-colors"
            >
              <IconBookmark filled={bookmarked} />
              <span>Đánh dấu trang này</span>
            </button>

            {/* Video block */}
            {videoUrl && (
              <section className="rounded-xl border border-zinc-800 bg-[#161616] overflow-hidden shadow-xl mb-10">
                <div className="px-4 py-3 border-b border-zinc-800 bg-zinc-900/50">
                  <h2 className="text-sm font-medium text-zinc-200">
                    Video bài học
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
                    <video
                      key={videoUrl}
                      controls
                      autoPlay={false}
                      className="w-full h-full"
                      preload="metadata"
                    >
                      <source src={videoUrl} />
                      Trình duyệt của bạn không hỗ trợ phát video.
                    </video>
                  </div>
                </div>
              </section>
            )}

            {/* Thời lượng — chỉ hiển thị nếu không có video */}
            {!videoUrl && (
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
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </span>
                Mục tiêu bài học
              </h2>
              {hasObjectives ? (
                <div
                  className={lessonHtmlClass}
                  dangerouslySetInnerHTML={{ __html: lesson.objectives }}
                />
              ) : (
                <p className="text-sm text-zinc-500">
                  Chưa có mục tiêu bài học. Nội dung sẽ hiển thị tại đây khi được cập nhật trong quản trị.
                </p>
              )}
            </section>

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

      <style>{`
        .lesson-content-dark ul { list-style-type: disc; padding-left: 1.25rem; margin: 0.75rem 0; }
        .lesson-content-dark ol { list-style-type: decimal; padding-left: 1.25rem; margin: 0.75rem 0; }
        .lesson-content-dark h1, .lesson-content-dark h2, .lesson-content-dark h3 { margin-top: 1.25rem; margin-bottom: 0.5rem; }
      `}</style>
    </div>
  );
}
