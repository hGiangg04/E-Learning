import { useEffect, useState, useMemo } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import PageLayout from '../components/PageLayout';
import { lessonService } from '../api';

function youtubeEmbedUrl(url) {
  if (!url || typeof url !== 'string') return null;
  const s = url.trim();
  try {
    const u = new URL(s);
    if (u.hostname.includes('youtube.com')) {
      const v = u.searchParams.get('v');
      if (v) return `https://www.youtube.com/embed/${v}`;
    }
    if (u.hostname === 'youtu.be') {
      const id = u.pathname.replace(/^\//, '').split('/')[0];
      if (id) return `https://www.youtube.com/embed/${id}`;
    }
  } catch {
    return null;
  }
  return null;
}

export default function LessonLearnPage() {
  const { courseId, lessonId } = useParams();
  const navigate = useNavigate();
  const [lesson, setLesson] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const embedUrl = useMemo(() => youtubeEmbedUrl(lesson?.video_url), [lesson?.video_url]);

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
        const [lessonRes, listRes] = await Promise.all([
          lessonService.getLesson(lessonId),
          lessonService.getLessonsByCourse(courseId),
        ]);

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
        if (code === 403) {
          toast.error(msg);
        }
      } finally {
        setLoading(false);
      }
    };

    if (courseId && lessonId) load();
  }, [courseId, lessonId, navigate]);

  if (loading) {
    return (
      <PageLayout>
        <div className="pt-28 px-4 max-w-6xl mx-auto animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/2" />
          <div className="aspect-video bg-gray-200 rounded-xl max-w-3xl" />
        </div>
      </PageLayout>
    );
  }

  if (error || !lesson) {
    return (
      <PageLayout>
        <div className="pt-28 px-4 max-w-2xl mx-auto text-center">
          <p className="text-gray-700">{error || 'Không tìm thấy bài học.'}</p>
          <Link to={`/courses/${courseId}`} className="btn-primary mt-6 inline-flex">
            Về trang khóa học
          </Link>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-8">
          {/* Sidebar — danh sách bài */}
          <aside className="lg:w-72 shrink-0 order-2 lg:order-1">
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 sticky top-24">
              <Link
                to={`/courses/${courseId}`}
                className="text-sm text-primary-600 hover:underline mb-4 inline-block"
              >
                ← Về khóa học
              </Link>
              <h2 className="font-semibold text-gray-900 mb-3 text-sm uppercase tracking-wide">
                Bài học
              </h2>
              <ol className="space-y-1 max-h-[60vh] overflow-y-auto">
                {lessons.map((l, idx) => {
                  const active = l._id === lesson._id || String(l._id) === String(lesson._id);
                  return (
                    <li key={l._id}>
                      <Link
                        to={`/courses/${courseId}/lesson/${l._id}`}
                        className={`block px-3 py-2 rounded-lg text-sm transition-colors ${
                          active
                            ? 'bg-primary-50 text-primary-800 font-medium'
                            : 'text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <span className="text-gray-400 mr-2">{idx + 1}.</span>
                        {l.title}
                      </Link>
                    </li>
                  );
                })}
              </ol>
              {lessons.length === 0 && (
                <p className="text-sm text-gray-500">Chưa có bài học.</p>
              )}
            </div>
          </aside>

          {/* Main */}
          <main className="flex-1 min-w-0 order-1 lg:order-2">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">{lesson.title}</h1>

            {embedUrl ? (
              <div className="aspect-video w-full max-w-3xl rounded-xl overflow-hidden bg-black shadow-lg mb-8">
                <iframe
                  title={lesson.title}
                  src={embedUrl}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            ) : lesson.video_url ? (
              <div className="mb-8 max-w-3xl">
                <a
                  href={lesson.video_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary-600 font-medium hover:underline break-all"
                >
                  Mở video → {lesson.video_url}
                </a>
              </div>
            ) : null}

            {lesson.content ? (
              <div
                className="prose prose-gray max-w-3xl prose-headings:font-semibold"
                dangerouslySetInnerHTML={{ __html: lesson.content }}
              />
            ) : (
              <p className="text-gray-500">Chưa có nội dung văn bản cho bài này.</p>
            )}
          </main>
        </div>
      </div>
    </PageLayout>
  );
}
