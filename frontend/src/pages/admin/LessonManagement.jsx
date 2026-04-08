import { useState, useEffect, useRef, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import AdminLayout from '../../components/admin/AdminLayout';
import Modal from '../../components/admin/Modal';
import { adminApi } from '../../api/adminApi';
import { lessonService } from '../../api/lessonService';
import api from '../../api/axios';

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
const UploadIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
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
  const [loadingLessonDetail, setLoadingLessonDetail] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);

  const dragOverRef = useRef(null);
  const videoInputRef = useRef(null);

  function lessonToFormData(l) {
    if (!l) return initialForm();
    return {
      title: l.title != null ? String(l.title) : '',
      objectives: l.objectives != null ? String(l.objectives) : '',
      content: l.content != null ? String(l.content) : '',
      video_url: l.video_url != null ? String(l.video_url) : '',
      video_duration: l.video_duration != null && l.video_duration !== '' ? Number(l.video_duration) : 0,
      position: l.position != null && l.position !== '' ? Number(l.position) : 0,
      is_free: Number(l.is_free) === 1 ? 1 : 0,
      is_published: Number(l.is_published) === 1 ? 1 : 0,
    };
  }

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

  const fetchLessons = useCallback(async (courseId) => {
    if (!courseId) {
      setLessons([]);
      return;
    }
    const cid = String(courseId).trim();
    setLoadingLessons(true);
    try {
      const res = await lessonService.getLessonsByCourseAdmin(cid);
      if (res?.success) {
        setLessons(res.data?.lessons ?? []);
        return;
      }
      throw new Error(res?.message || 'API không trả success');
    } catch (err) {
      const detail =
        err?.response?.data?.message || err?.message || 'Không tải được danh sách bài học';
      try {
        const res2 = await lessonService.getLessonsByCourse(cid);
        if (res2?.success) {
          setLessons(res2.data?.lessons ?? []);
          toast.error(`${detail} — hiển thị tạm các bài đã publish (thiếu nội dung khi sửa).`);
          return;
        }
      } catch {
        /* fall through */
      }
      toast.error(detail);
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

  const handleAddLesson = () => {
    setEditingLesson(null);
    setLoadingLessonDetail(false);
    setFormData(initialForm());
    setIsModalOpen(true);
  };

  const handleEditLesson = async (lesson) => {
    setEditingLesson(lesson);
    setIsModalOpen(true);
    setLoadingLessonDetail(true);
    setFormData(lessonToFormData(lesson));
    try {
      const res = await lessonService.getLesson(lesson._id);
      if (res?.success && res.data?.lesson) {
        setFormData(lessonToFormData(res.data.lesson));
      } else {
        toast.error(res?.message || 'Không tải đủ chi tiết bài học');
      }
    } catch (err) {
      toast.error(
        err?.response?.data?.message || 'Không tải đủ chi tiết bài học — đang dùng dữ liệu từ danh sách (có thể thiếu).'
      );
    } finally {
      setLoadingLessonDetail(false);
    }
  };

  const handleVideoFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime', 'video/x-msvideo'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Chỉ chấp nhận file video: mp4, webm, ogg, mov, avi');
      e.target.value = '';
      return;
    }

    const maxSize = 500 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error('File video tối đa 500MB');
      e.target.value = '';
      return;
    }

    setUploadingVideo(true);
    try {
      const formDataUpload = new FormData();
      formDataUpload.append('video', file);

      const { data } = await api.post('/upload/video', formDataUpload, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (data.success) {
        setFormData((prev) => ({ ...prev, video_url: data.data.video_url }));
        toast.success('Upload video thành công');
      } else {
        toast.error(data.message || 'Upload video thất bại');
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Upload video thất bại');
    } finally {
      setUploadingVideo(false);
      e.target.value = '';
    }
  };

  const handleRemoveVideo = async () => {
    const currentVideo = formData.video_url;
    if (currentVideo) {
      try {
        await api.delete('/upload/video', { data: { filepath: currentVideo } });
      } catch {
        // Ignore delete errors
      }
    }
    setFormData((prev) => ({ ...prev, video_url: '' }));
  };

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
    if (editingLesson && loadingLessonDetail) {
      return;
    }
    try {
      const payload = {
        course_id: selectedCourseId,
        title: formData.title.trim(),
        objectives: formData.objectives != null ? String(formData.objectives) : '',
        content: formData.content != null ? String(formData.content) : '',
        video_url: formData.video_url != null ? String(formData.video_url) : '',
        video_duration: Number(formData.video_duration) || 0,
        position: Number(formData.position) || 0,
        is_free: formData.is_free ? 1 : 0,
        is_published: formData.is_published ? 1 : 0,
      };

      console.log('[FE handleSubmit] gửi payload:', JSON.stringify(payload, null, 2));

      if (editingLesson) {
        const res = await lessonService.updateLesson(editingLesson._id, payload);
        console.log('[FE handleSubmit] PUT response:', JSON.stringify(res, null, 2));
        if (res.success) {
          toast.success('Cập nhật bài học thành công');
          setIsModalOpen(false);
          fetchLessons(selectedCourseId);
        } else {
          toast.error(res.message || 'Cập nhật thất bại');
        }
      } else {
        const res = await lessonService.createLesson(payload);
        console.log('[FE handleSubmit] POST response:', JSON.stringify(res, null, 2));
        if (res.success) {
          toast.success('Tạo bài học thành công');
          setIsModalOpen(false);
          fetchLessons(selectedCourseId);
        } else {
          toast.error(res.message || 'Tạo thất bại');
        }
      }
    } catch (err) {
      console.error('[FE handleSubmit] LỖI:', err);
      toast.error(err?.response?.data?.message || 'Có lỗi xảy ra');
    }
  };

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
                      <div className="w-14 h-14 rounded-lg bg-zinc-100 border border-gray-200 overflow-hidden shrink-0 flex items-center justify-center">
                        {lesson.video_url ? (
                          <VideoIcon />
                        ) : (
                          <span className="text-xl text-gray-400">📹</span>
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

      {/* Add / Edit modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setLoadingLessonDetail(false);
        }}
        title={editingLesson ? 'Chỉnh sửa bài học' : 'Thêm bài học mới'}
        size="xl"
        variant="dark"
      >
        {editingLesson && loadingLessonDetail ? (
          <div className="py-16 flex flex-col items-center justify-center gap-4 text-zinc-400">
            <div className="h-8 w-8 border-2 border-zinc-500 border-t-blue-500 rounded-full animate-spin" />
            <p className="text-sm">Đang tải nội dung bài học…</p>
            <button
              type="button"
              onClick={() => {
                setIsModalOpen(false);
                setLoadingLessonDetail(false);
              }}
              className="px-4 py-2 rounded-lg border border-zinc-600 text-zinc-300 hover:bg-zinc-800 text-sm"
            >
              Hủy
            </button>
          </div>
        ) : null}
        <form
          onSubmit={handleSubmit}
          className={`space-y-5 ${editingLesson && loadingLessonDetail ? 'hidden' : ''}`}
        >
          <div>
            <label className={labelDark}>
              Tiêu đề bài học <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className={inputDark}
              placeholder="VD: Bài 1: React"
              required
            />
          </div>

          <div>
            <label className={labelDark}>Video bài học</label>
            <input
              type="file"
              ref={videoInputRef}
              accept="video/mp4,video/webm,video/ogg,video/quicktime,video/x-msvideo"
              onChange={handleVideoFileSelect}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => videoInputRef.current?.click()}
              disabled={uploadingVideo}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 border-dashed border-zinc-600 text-zinc-400 hover:border-blue-500 hover:text-blue-400 transition-colors disabled:opacity-50"
            >
              {uploadingVideo ? (
                <>
                  <div className="h-5 w-5 border-2 border-zinc-500 border-t-blue-500 rounded-full animate-spin" />
                  <span>Đang upload video...</span>
                </>
              ) : (
                <>
                  <UploadIcon />
                  <span>Chọn file video (mp4, webm, mov, avi)</span>
                </>
              )}
            </button>
            <p className={hintDark}>File tối đa 500MB</p>

            {formData.video_url && (
              <div className="mt-3 flex items-center gap-3 p-3 bg-zinc-800/50 rounded-lg border border-zinc-700">
                <VideoIcon />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-zinc-200 truncate">
                    {formData.video_url.split('/').pop()}
                  </p>
                  <p className="text-xs text-zinc-500">Video đã upload</p>
                </div>
                <button
                  type="button"
                  onClick={handleRemoveVideo}
                  className="text-sm text-red-400 hover:text-red-300 hover:underline"
                >
                  Xóa video
                </button>
              </div>
            )}
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
              disabled={!!editingLesson && loadingLessonDetail}
              className="px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium transition-colors disabled:opacity-50 disabled:pointer-events-none"
            >
              {editingLesson ? 'Lưu thay đổi' : 'Thêm bài học'}
            </button>
          </div>
        </form>
      </Modal>
    </AdminLayout>
  );
}
