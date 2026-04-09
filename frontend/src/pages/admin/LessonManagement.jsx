import { useState, useEffect, useRef } from 'react';
import { toast } from 'react-hot-toast';
import AdminLayout from '../../components/admin/AdminLayout';
import { adminApi } from '../../api/adminApi';
import { lessonService } from '../../api/lessonService';
import api from '../../api/axios';
import { parseYouTubeEmbedUrl } from '../../utils/youtubeEmbed';

function isLikelyServerUpload(url) {
  if (!url || typeof url !== 'string') return false;
  return url.startsWith('/uploads/') || url.includes('/uploads/videos/');
}

/* ── Icons ── */
const PlusIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
  </svg>
);
const TrashIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);
const EditIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
  </svg>
);
const VideoIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
  </svg>
);
const UploadIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
  </svg>
);
const CloseIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

/* ── Styles ── */
const inputDark = 'w-full px-4 py-2.5 rounded-lg bg-zinc-800/90 border border-zinc-600 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent';
const labelDark = 'block text-sm font-medium text-zinc-300 mb-1.5';

/* ── Form ban đầu ── */
function blankForm() {
  return {
    title: '',
    content: '',
    video_url: '',
    video_duration: 0,
    position: 0,
    is_free: 0,
    is_published: 1,
  };
}

/* ── Modal thêm / sửa ── */
function LessonModal({ courseId, lesson, onClose, onSaved }) {
  const [form, setForm] = useState(blankForm);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const videoRef = useRef(null);

  useEffect(() => {
    if (lesson) {
      setForm({
        title: lesson.title ?? '',
        content: lesson.content ?? '',
        video_url: lesson.video_url ?? '',
        video_duration: lesson.video_duration ?? 0,
        position: lesson.position ?? 0,
        is_free: Number(lesson.is_free) === 1 ? 1 : 0,
        is_published: Number(lesson.is_published) === 1 ? 1 : 0,
      });
    }
  }, [lesson]);

  function set(key, val) {
    setForm(f => ({ ...f, [key]: val }));
  }

  /* Upload video */
  async function handleVideoChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 500 * 1024 * 1024) {
      toast.error('Video tối đa 500MB');
      e.target.value = '';
      return;
    }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('video', file);
      const { data } = await api.post('/upload/video', fd);
      if (data.success) {
        set('video_url', data.data.video_url || '');
        toast.success('Upload video thành công');
      } else {
        toast.error(data.message || 'Upload thất bại');
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Upload video thất bại');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  }

  /* Submit */
  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.title.trim()) {
      toast.error('Tiêu đề bài học không được trống');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        course_id: courseId,
        title: form.title.trim(),
        content: form.content,
        video_url: form.video_url,
        video_duration: Number(form.video_duration) || 0,
        position: Number(form.position) || 0,
        is_free: Number(form.is_free),
        is_published: Number(form.is_published),
      };
      let res;
      if (lesson?._id) {
        res = await lessonService.updateLesson(lesson._id, payload);
      } else {
        res = await lessonService.createLesson(payload);
      }
      if (res.success) {
        toast.success(lesson?._id ? 'Cập nhật thành công' : 'Tạo bài học thành công');
        onSaved();
        onClose();
      } else {
        toast.error(res.message || 'Thao tác thất bại');
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || err.message || 'Lỗi khi lưu');
    } finally {
      setSaving(false);
    }
  }

  const isEdit = !!lesson?._id;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-zinc-900 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-zinc-700">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-700">
          <h2 className="text-lg font-semibold text-zinc-100">
            {isEdit ? 'Sửa bài học' : 'Thêm bài học mới'}
          </h2>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-200 transition-colors">
            <CloseIcon />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Tiêu đề */}
          <div>
            <label className={labelDark}>Tiêu đề bài học *</label>
            <input
              className={inputDark}
              value={form.title}
              onChange={e => set('title', e.target.value)}
              placeholder="VD: Bài 1 - Giới thiệu HTML"
              required
            />
          </div>

          {/* Nội dung */}
          <div>
            <label className={labelDark}>Nội dung bài học</label>
            <textarea
              className={`${inputDark} min-h-[120px] resize-y`}
              value={form.content}
              onChange={e => set('content', e.target.value)}
              placeholder="Nhập nội dung bài học..."
            />
          </div>

          {/* Video upload hoặc YouTube */}
          <div>
            <label className={labelDark}>Video bài giảng</label>
            {form.video_url && (
              <div className="mb-2 flex items-center gap-2 text-sm text-green-400">
                <VideoIcon />
                <span>
                  {isLikelyServerUpload(form.video_url)
                    ? `Đã upload: ${form.video_url.split('/').pop()}`
                    : parseYouTubeEmbedUrl(form.video_url)
                      ? 'Đã gắn YouTube'
                      : 'Đã gắn URL video'}
                </span>
              </div>
            )}
            <div className="flex gap-3">
              <label className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white cursor-pointer text-sm font-medium transition-colors">
                <UploadIcon />
                {uploading ? 'Đang upload...' : 'Chọn video'}
                <input
                  ref={videoRef}
                  type="file"
                  accept="video/*"
                  className="hidden"
                  onChange={handleVideoChange}
                  disabled={uploading}
                />
              </label>
              {form.video_url && (
                <button
                  type="button"
                  onClick={() => set('video_url', '')}
                  className="px-4 py-2.5 rounded-lg bg-red-600/80 hover:bg-red-700 text-white text-sm transition-colors"
                >
                  Xóa video
                </button>
              )}
            </div>
            <p className="text-xs text-zinc-500 mt-1">Hỗ trợ MP4, WebM, AVI. Tối đa 500MB.</p>

            <div className="mt-4">
              <label className={labelDark}>Hoặc nhúng YouTube</label>
              <input
                type="url"
                className={inputDark}
                value={isLikelyServerUpload(form.video_url) ? '' : form.video_url || ''}
                onChange={(e) => set('video_url', e.target.value.trim())}
                onBlur={(e) => {
                  const v = e.target.value.trim();
                  if (!v) return;
                  if (/youtube|youtu\.be/i.test(v) && !parseYouTubeEmbedUrl(v)) {
                    toast.error('Link YouTube không hợp lệ. Dùng link dạng youtube.com/watch?v=... hoặc youtu.be/...');
                  }
                }}
                placeholder="https://www.youtube.com/watch?v=..."
                disabled={uploading}
              />
              <p className="text-xs text-zinc-500 mt-1">
                Dán URL video YouTube. Upload file và link YouTube dùng chung một trường — chỉ lưu một nguồn (upload sẽ thay thế link).
              </p>
            </div>
          </div>

          {/* Thứ tự & flags */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className={labelDark}>Thứ tự</label>
              <input
                type="number"
                min="0"
                className={inputDark}
                value={form.position}
                onChange={e => set('position', e.target.value)}
              />
            </div>
            <div>
              <label className={labelDark}>Miễn phí</label>
              <select
                className={inputDark}
                value={form.is_free}
                onChange={e => set('is_free', e.target.value)}
              >
                <option value="0">Không</option>
                <option value="1">Có</option>
              </select>
            </div>
            <div>
              <label className={labelDark}>Trạng thái</label>
              <select
                className={inputDark}
                value={form.is_published}
                onChange={e => set('is_published', e.target.value)}
              >
                <option value="1">Công khai</option>
                <option value="0">Ẩn</option>
              </select>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-lg bg-zinc-700 hover:bg-zinc-600 text-zinc-300 font-medium transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors disabled:opacity-50"
            >
              {saving ? 'Đang lưu...' : isEdit ? 'Cập nhật' : 'Tạo bài học'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ── Trang chính ── */
export default function LessonManagement() {
  const [courses, setCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [lessons, setLessons] = useState([]);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [loadingLessons, setLoadingLessons] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingLesson, setEditingLesson] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  /* Load danh sách khóa học */
  useEffect(() => {
    adminApi.getCourses({ limit: 200 })
      .then(res => {
        if (res.data?.success) {
          setCourses(res.data.data?.courses ?? []);
        }
      })
      .catch(() => toast.error('Không tải được danh sách khóa học'))
      .finally(() => setLoadingCourses(false));
  }, []);

  /* Load bài học khi chọn khóa */
  useEffect(() => {
    if (!selectedCourseId) {
      setLessons([]);
      return;
    }
    setLoadingLessons(true);
    lessonService.getLessonsByCourseAdmin(selectedCourseId)
      .then(res => {
        if (res?.success) {
          setLessons(res.data?.lessons ?? []);
        } else {
          throw new Error(res?.message || 'Lỗi');
        }
      })
      .catch(err => {
        toast.error(err?.response?.data?.message || err.message || 'Không tải được bài học');
        setLessons([]);
      })
      .finally(() => setLoadingLessons(false));
  }, [selectedCourseId]);

  function openAdd() {
    setEditingLesson(null);
    setShowModal(true);
  }

  function openEdit(lesson) {
    setEditingLesson(lesson);
    setShowModal(true);
  }

  async function handleDelete(lesson) {
    if (!window.confirm(`Xóa bài học "${lesson.title}"?`)) return;
    setDeletingId(lesson._id);
    try {
      const res = await lessonService.deleteLesson(lesson._id);
      if (res.success) {
        setLessons(prev => prev.filter(l => l._id !== lesson._id));
        toast.success('Đã xóa bài học');
      } else {
        toast.error(res.message || 'Xóa thất bại');
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Xóa thất bại');
    } finally {
      setDeletingId(null);
    }
  }

  function handleSaved() {
    // Reload lessons
    setLoadingLessons(true);
    lessonService.getLessonsByCourseAdmin(selectedCourseId)
      .then(res => {
        if (res?.success) setLessons(res.data?.lessons ?? []);
      })
      .finally(() => setLoadingLessons(false));
  }

  return (
    <AdminLayout>
      <div className="p-6 max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-zinc-100">Quản lý bài học</h1>
            <p className="text-sm text-zinc-400 mt-1">Thêm, sửa, xóa bài học trong khóa học</p>
          </div>
        </div>

        {/* Chọn khóa học */}
        <div className="bg-zinc-800/60 rounded-xl p-5 mb-6 border border-zinc-700">
          <label className={labelDark}>Chọn khóa học</label>
          {loadingCourses ? (
            <div className="text-zinc-400 text-sm">Đang tải...</div>
          ) : (
            <select
              className={inputDark}
              value={selectedCourseId}
              onChange={e => setSelectedCourseId(e.target.value)}
            >
              <option value="">-- Chọn khóa học --</option>
              {courses.map(c => (
                <option key={c._id} value={c._id}>
                  {c.title}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Danh sách bài học */}
        {selectedCourseId && (
          <div className="bg-zinc-800/60 rounded-xl border border-zinc-700 overflow-hidden">
            {/* Toolbar */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-700">
              <h2 className="font-semibold text-zinc-100">
                Danh sách bài học
                <span className="ml-2 text-sm font-normal text-zinc-400">
                  ({lessons.length} bài)
                </span>
              </h2>
              <button
                onClick={openAdd}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors"
              >
                <PlusIcon />
                Thêm bài học
              </button>
            </div>

            {/* Table */}
            {loadingLessons ? (
              <div className="p-8 text-center text-zinc-400">Đang tải...</div>
            ) : lessons.length === 0 ? (
              <div className="p-8 text-center text-zinc-500">
                Chưa có bài học nào.
                <br />
                <button onClick={openAdd} className="mt-2 text-blue-400 hover:underline text-sm">
                  Thêm bài học đầu tiên
                </button>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-zinc-700/40 text-zinc-400">
                  <tr>
                    <th className="text-left px-5 py-3 font-medium w-16">#</th>
                    <th className="text-left px-5 py-3 font-medium">Tiêu đề</th>
                    <th className="text-left px-5 py-3 font-medium w-28">Video</th>
                    <th className="text-center px-5 py-3 font-medium w-20">Miễn phí</th>
                    <th className="text-center px-5 py-3 font-medium w-20">Trạng thái</th>
                    <th className="text-right px-5 py-3 font-medium w-28">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-700/60">
                  {lessons.map((lesson, idx) => (
                    <tr key={lesson._id} className="hover:bg-zinc-700/20 transition-colors">
                      <td className="px-5 py-3 text-zinc-500">{idx + 1}</td>
                      <td className="px-5 py-3 text-zinc-100 font-medium">
                        {lesson.title}
                      </td>
                      <td className="px-5 py-3">
                        {lesson.video_url ? (
                          <span className="inline-flex items-center gap-1 text-green-400 text-xs">
                            <VideoIcon /> Có
                          </span>
                        ) : (
                          <span className="text-zinc-600 text-xs">Chưa có</span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-center">
                        {Number(lesson.is_free) === 1 ? (
                          <span className="text-green-400 text-xs">Có</span>
                        ) : (
                          <span className="text-zinc-500 text-xs">Không</span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-center">
                        {Number(lesson.is_published) === 1 ? (
                          <span className="text-blue-400 text-xs">Công khai</span>
                        ) : (
                          <span className="text-zinc-500 text-xs">Ẩn</span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openEdit(lesson)}
                            className="p-2 rounded-lg hover:bg-zinc-600 text-zinc-400 hover:text-zinc-100 transition-colors"
                            title="Sửa"
                          >
                            <EditIcon />
                          </button>
                          <button
                            onClick={() => handleDelete(lesson)}
                            disabled={deletingId === lesson._id}
                            className="p-2 rounded-lg hover:bg-red-600/20 text-zinc-400 hover:text-red-400 transition-colors disabled:opacity-40"
                            title="Xóa"
                          >
                            <TrashIcon />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <LessonModal
          courseId={selectedCourseId}
          lesson={editingLesson}
          onClose={() => { setShowModal(false); setEditingLesson(null); }}
          onSaved={handleSaved}
        />
      )}
    </AdminLayout>
  );
}
