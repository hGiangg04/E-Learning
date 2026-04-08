import { useState, useEffect, useRef, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import AdminLayout from '../../components/admin/AdminLayout';
import Modal from '../../components/admin/Modal';
import { adminApi } from '../../api/adminApi';
import { lessonService } from '../../api/lessonService';

const PlusIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
  </svg>
);
const DragIcon = () => (
  <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
  </svg>
);
const TrashIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);
const EditIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
  </svg>
);
const VideoIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
  </svg>
);
const TextIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);
const SaveIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

const inputDark =
  'w-full px-4 py-2.5 rounded-lg bg-zinc-800/90 border border-zinc-600 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent';
const labelDark = 'block text-sm font-medium text-zinc-300 mb-1.5';
const hintDark = 'text-xs text-zinc-500 mt-1';

function initialForm() {
  return {
    title: '',
    objectives: '',
    content: '',
    cover_image: '',
    video_url: '',
    video_duration: 0,
    position: 0,
    is_free: 0,
    is_published: 1,
  };
}

export default function LessonManagement() {
  const [courses, setCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [lessons, setLessons] = useState([]);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [loadingLessons, setLoadingLessons] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLesson, setEditingLesson] = useState(null);
  const [formData, setFormData] = useState(initialForm());
  const [draggedId, setDraggedId] = useState(null);
  const [savingOrder, setSavingOrder] = useState(false);

  const dragOverRef = useRef(null);

  // Load courses for dropdown
  useEffect(() => {
    let cancelled = false;
    adminApi
      .getCourses({ limit: 200 })
      .then((res) => {
        if (cancelled || !res.data?.success) return;
        const list = res.data.data?.courses ?? [];
        setCourses(Array.isArray(list) ? list : []);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoadingCourses(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Load lessons when course changes
  const fetchLessons = useCallback(async (courseId) => {
    if (!courseId) {
      setLessons([]);
      return;
    }
    setLoadingLessons(true);
    try {
      const res = await lessonService.getLessonsByCourseAdmin(courseId);
      if (res.success) {
        setLessons(res.data?.lessons ?? []);
      } else {
        setLessons([]);
      }
    } catch {
      toast.error('Không tải được danh sách bài học');
      setLessons([]);
    } finally {
      setLoadingLessons(false);
    }
  }, []);

  useEffect(() => {
    if (selectedCourseId) fetchLessons(selectedCourseId);
    else setLessons([]);
  }, [selectedCourseId, fetchLessons]);

  const handleSelectCourse = (e) => {
    setSelectedCourseId(e.target.value);
  };

  // Drag & drop reorder
  const handleDragStart = (e, lessonId) => {
    setDraggedId(lessonId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, targetId) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    dragOverRef.current = targetId;
  };

  const handleDrop = (e, targetId) => {
    e.preventDefault();
    if (!draggedId || draggedId === targetId) {
      setDraggedId(null);
      dragOverRef.current = null;
      return;
    }
    setLessons((prev) => {
      const arr = [...prev];
      const fromIdx = arr.findIndex((l) => l._id === draggedId);
      const toIdx = arr.findIndex((l) => l._id === targetId);
      if (fromIdx === -1 || toIdx === -1) return prev;
      const [moved] = arr.splice(fromIdx, 1);
      arr.splice(toIdx, 0, moved);
      return arr;
    });
    setDraggedId(null);
    dragOverRef.current = null;
  };

  const handleDragEnd = () => {
    setDraggedId(null);
    dragOverRef.current = null;
  };

  // Save new order to backend
  const handleSaveOrder = async () => {
    if (!selectedCourseId) return;
    setSavingOrder(true);
    try {
      const orderedIds = lessons.map((l) => l._id);
      await lessonService.reorderLessons(selectedCourseId, orderedIds);
      toast.success('Đã lưu thứ tự');
    } catch {
      toast.error('Lưu thứ tự thất bại');
      fetchLessons(selectedCourseId);
    } finally {
      setSavingOrder(false);
    }
  };

  // Open add modal
  const handleAddLesson = () => {
    setEditingLesson(null);
    setFormData(initialForm());
    setIsModalOpen(true);
  };

  // Open edit modal
  const handleEditLesson = (lesson) => {
    setEditingLesson(lesson);
    setFormData({
      title: lesson.title || '',
      objectives: lesson.objectives || '',
      content: lesson.content || '',
      cover_image: lesson.cover_image || '',
      video_url: lesson.video_url || '',
      video_duration: lesson.video_duration ?? 0,
      position: lesson.position ?? 0,
      is_free: lesson.is_free ? 1 : 0,
      is_published: lesson.is_published ? 1 : 0,
    });
    setIsModalOpen(true);
  };

  const handleCoverImageFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Vui lòng chọn file ảnh');
      e.target.value = '';
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Ảnh tối đa 2MB');
      e.target.value = '';
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setFormData((prev) => ({ ...prev, cover_image: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  // Submit add / edit
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedCourseId) {
      toast.error('Vui lòng chọn khóa học trước');
      return;
    }
    if (!formData.title.trim()) {
      toast.error('Tiêu đề bài học không được để trống');
      return;
    }
    try {
      const payload = {
        course_id: selectedCourseId,
        title: formData.title.trim(),
        objectives: formData.objectives || '',
        content: formData.content || '',
        cover_image: formData.cover_image || '',
        video_url: formData.video_url || '',
        video_duration: Number(formData.video_duration) || 0,
        position: Number(formData.position) || 0,
        is_free: formData.is_free ? 1 : 0,
        is_published: formData.is_published ? 1 : 0,
      };

      if (editingLesson) {
        const res = await lessonService.updateLesson(editingLesson._id, payload);
        if (res.success) {
          toast.success('Cập nhật bài học thành công');
          setIsModalOpen(false);
          fetchLessons(selectedCourseId);
        } else {
          toast.error(res.message || 'Cập nhật thất bại');
        }
      } else {
        const res = await lessonService.createLesson(payload);
        if (res.success) {
          toast.success('Tạo bài học thành công');
          setIsModalOpen(false);
          fetchLessons(selectedCourseId);
        } else {
          toast.error(res.message || 'Tạo thất bại');
        }
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Có lỗi xảy ra');
    }
  };

  // Delete lesson
  const handleDeleteLesson = async (lesson) => {
    if (!window.confirm(`Xóa bài học "${lesson.title}"?`)) return;
    try {
      const res = await lessonService.deleteLesson(lesson._id);
      if (res.success) {
        toast.success('Đã xóa bài học');
        fetchLessons(selectedCourseId);
      } else {
        toast.error(res.message || 'Xóa thất bại');
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Có lỗi xảy ra');
    }
  };

  const formatDuration = (seconds) => {
    if (!seconds) return '—';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return m > 0 ? `${m}p ${s > 0 ? `${s}giây` : ''}`.trim() : `${s}giây`;
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Quản lý bài học</h1>
            <p className="text-gray-500">Thêm, sửa, xóa và sắp xếp bài học trong khóa học</p>
          </div>
        </div>

        {/* Course selector */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
            <div className="flex-1 w-full">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Chọn khóa học
              </label>
              {loadingCourses ? (
                <div className="h-10 w-full bg-gray-100 rounded-lg animate-pulse" />
              ) : (
                <select
                  value={selectedCourseId}
                  onChange={handleSelectCourse}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">— Chọn khóa học —</option>
                  {courses.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.title}
                    </option>
                  ))}
                </select>
              )}
            </div>
            {selectedCourseId && (
              <button
                onClick={handleAddLesson}
                className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors whitespace-nowrap"
              >
                <PlusIcon />
                Thêm bài học
              </button>
            )}
          </div>
        </div>

        {/* Lesson list */}
        {selectedCourseId && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">
                Danh sách bài học
                <span className="ml-2 text-sm font-normal text-gray-500">
                  ({lessons.length} bài)
                </span>
              </h3>
              {lessons.length > 1 && (
                <button
                  onClick={handleSaveOrder}
                  disabled={savingOrder}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-60"
                >
                  <SaveIcon />
                  {savingOrder ? 'Đang lưu...' : 'Lưu thứ tự'}
                </button>
              )}
            </div>

            {loadingLessons ? (
              <div className="p-8 text-center text-gray-400">Đang tải…</div>
            ) : lessons.length === 0 ? (
              <div className="p-8 text-center text-gray-400">
                Chưa có bài học nào. Nhấn <strong>Thêm bài học</strong> để bắt đầu.
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {lessons.map((lesson, index) => (
                  <div
                    key={lesson._id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, lesson._id)}
                    onDragOver={(e) => handleDragOver(e, lesson._id)}
                    onDrop={(e) => handleDrop(e, lesson._id)}
                    onDragEnd={handleDragEnd}
                    className={`
                      flex items-center gap-3 p-4 hover:bg-gray-50 transition-colors cursor-move select-none
                      ${draggedId === lesson._id ? 'opacity-40 bg-primary-50' : ''}
                      ${dragOverRef.current === lesson._id && draggedId !== lesson._id
                        ? 'border-t-2 border-primary-500'
                        : ''}
                    `}
                  >
                    {/* Order badge */}
                    <span className="flex-shrink-0 w-8 h-8 rounded-full bg-primary-100 text-primary-700 text-sm font-semibold flex items-center justify-center">
                      {index + 1}
                    </span>

                    {/* Drag handle */}
                    <div className="flex-shrink-0 cursor-move">
                      <DragIcon />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0 flex items-start gap-3">
                      <div className="w-14 h-14 rounded-lg bg-gray-100 border border-gray-200 overflow-hidden shrink-0 flex items-center justify-center">
                        {lesson.cover_image ? (
                          <img
                            src={lesson.cover_image}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-xl text-gray-400">🖼</span>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-gray-900 truncate">{lesson.title}</span>
                        {lesson.is_free === 1 && (
                          <span className="px-1.5 py-0.5 text-xs bg-green-100 text-green-700 rounded">
                            Miễn phí
                          </span>
                        )}
                        {lesson.is_published === 0 && (
                          <span className="px-1.5 py-0.5 text-xs bg-yellow-100 text-yellow-700 rounded">
                            Ẩn
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                        {lesson.video_url && (
                          <span className="flex items-center gap-1">
                            <VideoIcon />
                            {formatDuration(lesson.video_duration)}
                          </span>
                        )}
                        {lesson.content && lesson.content.length > 0 && (
                          <span className="flex items-center gap-1">
                            <TextIcon />
                            Có nội dung
                          </span>
                        )}
                        {lesson.objectives && lesson.objectives.length > 0 && (
                          <span className="text-xs text-gray-500">Có mục tiêu</span>
                        )}
                      </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        onClick={() => handleEditLesson(lesson)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Sửa"
                      >
                        <EditIcon />
                      </button>
                      <button
                        onClick={() => handleDeleteLesson(lesson)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Xóa"
                      >
                        <TrashIcon />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Hint when no course selected */}
        {!selectedCourseId && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 text-center text-blue-700">
            Vui lòng chọn một khóa học ở trên để quản lý bài học.
          </div>
        )}
      </div>

      {/* Add / Edit modal — dark UI như tham chiếu */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingLesson ? 'Chỉnh sửa bài học' : 'Thêm bài học mới'}
        size="xl"
        variant="dark"
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className={labelDark}>
              Tiêu đề bài học <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className={inputDark}
              placeholder="VD: Bài 1 : React"
              required
            />
          </div>

          <div>
            <label className={labelDark}>Ảnh bìa / minh họa bài học</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleCoverImageFile}
              className="w-full text-sm text-zinc-400 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:bg-zinc-700 file:text-zinc-200"
            />
            <p className={hintDark}>PNG/JPG tối đa 2MB — hoặc dán URL bên dưới</p>
            <input
              type="text"
              value={formData.cover_image?.startsWith('data:') ? '' : formData.cover_image}
              onChange={(e) => setFormData({ ...formData, cover_image: e.target.value })}
              className={`${inputDark} mt-2`}
              placeholder="https://..."
            />
            {formData.cover_image && (
              <div className="mt-3 flex items-center gap-3">
                <img
                  src={formData.cover_image}
                  alt=""
                  className="h-24 w-40 object-cover rounded-lg border border-zinc-600"
                />
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, cover_image: '' })}
                  className="text-sm text-red-400 hover:underline"
                >
                  Xóa ảnh
                </button>
              </div>
            )}
          </div>

          <div>
            <label className={labelDark}>Video URL</label>
            <input
              type="text"
              value={formData.video_url}
              onChange={(e) => setFormData({ ...formData, video_url: e.target.value })}
              className={inputDark}
              placeholder="https://www.youtube.com/watch?v=..."
            />
            <p className={hintDark}>
              Hỗ trợ YouTube, Vimeo, hoặc link video trực tiếp (.mp4)
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelDark}>Thời lượng video (giây)</label>
              <input
                type="number"
                value={formData.video_duration}
                onChange={(e) =>
                  setFormData({ ...formData, video_duration: e.target.value })
                }
                className={inputDark}
                placeholder="0"
                min={0}
              />
            </div>
            <div>
              <label className={labelDark}>Thứ tự (vị trí)</label>
              <input
                type="number"
                value={formData.position}
                onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                className={inputDark}
                min={0}
              />
            </div>
          </div>

          <div>
            <label className={labelDark}>Mục tiêu bài học</label>
            <textarea
              value={formData.objectives}
              onChange={(e) => setFormData({ ...formData, objectives: e.target.value })}
              rows={4}
              className={`${inputDark} font-mono text-sm resize-y min-h-[100px]`}
              placeholder="Danh sách hoặc HTML: &lt;ul&gt;&lt;li&gt;…&lt;/li&gt;&lt;/ul&gt;"
            />
            <p className={hintDark}>
              Hiển thị riêng phần &quot;Mục tiêu bài học&quot; cho học viên — hỗ trợ HTML cơ bản.
            </p>
          </div>

          <div>
            <label className={labelDark}>Nội dung bài học</label>
            <textarea
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              rows={7}
              className={`${inputDark} font-mono text-sm resize-y min-h-[140px]`}
              placeholder="Nhập nội dung bài học (hỗ trợ HTML)"
            />
            <p className={hintDark}>
              Có thể dùng HTML cơ bản: &lt;b&gt;, &lt;i&gt;, &lt;br&gt;, &lt;p&gt;, danh sách…
            </p>
          </div>

          <div className="flex flex-wrap gap-6">
            <label className="flex items-center gap-2.5 cursor-pointer text-sm text-zinc-300">
              <input
                type="checkbox"
                checked={formData.is_free === 1}
                onChange={(e) =>
                  setFormData({ ...formData, is_free: e.target.checked ? 1 : 0 })
                }
                className="w-4 h-4 rounded border-zinc-500 bg-zinc-800 text-blue-500 focus:ring-blue-500 focus:ring-offset-0 focus:ring-offset-zinc-900"
              />
              Bài học miễn phí (xem trước)
            </label>
            <label className="flex items-center gap-2.5 cursor-pointer text-sm text-zinc-300">
              <input
                type="checkbox"
                checked={formData.is_published === 1}
                onChange={(e) =>
                  setFormData({ ...formData, is_published: e.target.checked ? 1 : 0 })
                }
                className="w-4 h-4 rounded border-zinc-500 bg-zinc-800 text-blue-500 focus:ring-blue-500 focus:ring-offset-0 focus:ring-offset-zinc-900"
              />
              Hiển thị với học viên
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-5 border-t border-zinc-700">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-5 py-2.5 rounded-lg border border-zinc-600 text-zinc-300 hover:bg-zinc-800 transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium transition-colors"
            >
              {editingLesson ? 'Lưu thay đổi' : 'Thêm bài học'}
            </button>
          </div>
        </form>
      </Modal>
    </AdminLayout>
  );
}
