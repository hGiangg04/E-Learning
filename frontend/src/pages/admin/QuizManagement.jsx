import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import AdminLayout from '../../components/admin/AdminLayout';
import DataTable from '../../components/admin/DataTable';
import Modal from '../../components/admin/Modal';
import { adminApi } from '../../api/adminApi';

const PlusIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
  </svg>
);

export default function QuizManagement() {
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingQuiz, setEditingQuiz] = useState(null);
  const [selectedQuiz, setSelectedQuiz] = useState(null);
  const [formData, setFormData] = useState({
    course_id: '',
    title: '',
    description: '',
    time_limit: 30,
    passing_score: 70,
    max_attempts: 3,
    is_active: 1,
    shuffle_questions: false,
    shuffle_options: false,
    show_results_immediately: true,
    show_correct_answer: true,
  });

  const fetchQuizzes = async () => {
    try {
      setLoading(true);
      const response = await adminApi.getQuizzes();
      if (response.data.success) {
        setQuizzes(response.data.data.quizzes || []);
      }
    } catch (error) {
      console.error('Error fetching quizzes:', error);
      toast.error('Không thể tải danh sách quiz');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuizzes();
  }, []);

  const columns = [
    { key: 'title', label: 'Tên quiz' },
    {
      key: 'course_id',
      label: 'Khóa học',
      render: (value) => <span className="font-medium">{value?.title || '-'}</span>,
    },
    { key: 'time_limit', label: 'Thời gian (phút)' },
    { key: 'passing_score', label: 'Điểm đạt (%)' },
    { key: 'max_attempts', label: 'Số lần thi tối đa' },
    {
      key: 'is_active',
      label: 'Trạng thái',
      badge: true,
      render: (value) => {
        const statusLabels = { 1: 'Hoạt động', 0: 'Tắt' };
        const statusColors = { 1: 'bg-green-100 text-green-800', 0: 'bg-gray-100 text-gray-800' };
        return (
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusColors[value]}`}>
            {statusLabels[value]}
          </span>
        );
      },
    },
  ];

  const handleEdit = (quiz) => {
    setEditingQuiz(quiz);
    setFormData({
      course_id: quiz.course_id?._id || quiz.course_id || '',
      title: quiz.title || '',
      description: quiz.description || '',
      time_limit: quiz.time_limit || 30,
      passing_score: quiz.passing_score || 70,
      max_attempts: quiz.max_attempts || 3,
      is_active: quiz.is_active ?? 1,
      shuffle_questions: quiz.shuffle_questions || false,
      shuffle_options: quiz.shuffle_options || false,
      show_results_immediately: quiz.show_results_immediately ?? true,
      show_correct_answer: quiz.show_correct_answer ?? true,
    });
    setIsModalOpen(true);
  };

  const handleView = async (quiz) => {
    try {
      const response = await adminApi.getQuiz(quiz._id);
      if (response.data.success) {
        setSelectedQuiz(response.data.data);
        setIsModalOpen(true);
      }
    } catch (error) {
      toast.error('Không thể tải chi tiết quiz');
    }
  };

  const handleDelete = async (quiz) => {
    if (window.confirm(`Bạn có chắc muốn xóa quiz "${quiz.title}"?`)) {
      try {
        const response = await adminApi.deleteQuiz(quiz._id);
        if (response.data.success) {
          toast.success('Xóa quiz thành công');
          fetchQuizzes();
        }
      } catch (error) {
        toast.error(error.response?.data?.message || 'Không thể xóa quiz');
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingQuiz) {
        const response = await adminApi.updateQuiz(editingQuiz._id, formData);
        if (response.data.success) {
          toast.success('Cập nhật quiz thành công');
          setIsModalOpen(false);
          fetchQuizzes();
        }
      } else {
        const response = await adminApi.createQuiz(formData);
        if (response.data.success) {
          toast.success('Tạo quiz thành công');
          setIsModalOpen(false);
          fetchQuizzes();
        }
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra');
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Quản lý Quiz</h1>
            <p className="text-gray-500">Quản lý bài kiểm tra và câu hỏi</p>
          </div>
          <button
            onClick={() => {
              setEditingQuiz(null);
              setSelectedQuiz(null);
              setFormData({
                course_id: '',
                title: '',
                description: '',
                time_limit: 30,
                passing_score: 70,
                max_attempts: 3,
                is_active: 1,
                shuffle_questions: false,
                shuffle_options: false,
                show_results_immediately: true,
                show_correct_answer: true,
              });
              setIsModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            <PlusIcon />
            Thêm Quiz
          </button>
        </div>

        <DataTable
          title="Danh sách Quiz"
          columns={columns}
          data={quizzes}
          searchKey="title"
          searchPlaceholder="Tìm theo tên..."
          onView={handleView}
          onEdit={handleEdit}
          onDelete={handleDelete}
          loading={loading}
        />

        <Modal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setEditingQuiz(null);
            setSelectedQuiz(null);
          }}
          title={editingQuiz ? 'Chỉnh sửa Quiz' : selectedQuiz ? 'Chi tiết Quiz' : 'Thêm Quiz mới'}
          size="lg"
        >
          {selectedQuiz && !editingQuiz ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-500">Tên Quiz</label>
                  <p className="font-medium">{selectedQuiz.quiz?.title || selectedQuiz.title}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Khóa học</label>
                  <p className="font-medium">{selectedQuiz.quiz?.course_id?.title || '-'}</p>
                </div>
              </div>
              <div className="grid grid-cols-4 gap-4">
                <div>
                  <label className="text-sm text-gray-500">Thời gian</label>
                  <p className="font-medium">{selectedQuiz.quiz?.time_limit || 30} phút</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Điểm đạt</label>
                  <p className="font-medium">{selectedQuiz.quiz?.passing_score || 70}%</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Số lần thi tối đa</label>
                  <p className="font-medium">{selectedQuiz.quiz?.max_attempts || 3}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Câu hỏi</label>
                  <p className="font-medium">{selectedQuiz.questions?.length || 0}</p>
                </div>
              </div>
              <div className="border-t pt-4">
                <h4 className="font-medium mb-2">Danh sách câu hỏi ({selectedQuiz.questions?.length || 0})</h4>
                {selectedQuiz.questions?.length > 0 ? (
                  <div className="space-y-3 max-h-60 overflow-y-auto">
                    {selectedQuiz.questions.map((q, idx) => (
                      <div key={q._id || idx} className="p-3 bg-gray-50 rounded-lg">
                        <p className="font-medium">{idx + 1}. {q.question_text}</p>
                        <p className="text-sm text-gray-500 mt-1">
                          Loại: {q.question_type} | Điểm: {q.points || 1}
                        </p>
                        {q.options?.length > 0 && (
                          <div className="mt-2 space-y-1">
                            {q.options.map((opt, i) => (
                              <div key={i} className={`text-sm ${opt.is_correct ? 'text-green-600 font-medium' : 'text-gray-600'}`}>
                                {opt.is_correct ? '✓' : '○'} {opt.option_text}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">Chưa có câu hỏi nào</p>
                )}
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Khóa học ID</label>
                <input
                  type="text"
                  value={formData.course_id}
                  onChange={(e) => setFormData({ ...formData, course_id: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="ObjectId của khóa học"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tên Quiz</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={2}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Thời gian (phút)</label>
                  <input
                    type="number"
                    value={formData.time_limit}
                    onChange={(e) => setFormData({ ...formData, time_limit: Number(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Điểm đạt (%)</label>
                  <input
                    type="number"
                    value={formData.passing_score}
                    onChange={(e) => setFormData({ ...formData, passing_score: Number(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Số lần thi tối đa</label>
                  <input
                    type="number"
                    value={formData.max_attempts}
                    onChange={(e) => setFormData({ ...formData, max_attempts: Number(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.shuffle_questions}
                    onChange={(e) => setFormData({ ...formData, shuffle_questions: e.target.checked })}
                    className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                  />
                  <span className="text-sm text-gray-700">Xáo trộn câu hỏi</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.shuffle_options}
                    onChange={(e) => setFormData({ ...formData, shuffle_options: e.target.checked })}
                    className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                  />
                  <span className="text-sm text-gray-700">Xáo trộn đáp án</span>
                </label>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Hủy
                </button>
                <button type="submit" className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">
                  {editingQuiz ? 'Lưu thay đổi' : 'Thêm mới'}
                </button>
              </div>
            </form>
          )}
        </Modal>
      </div>
    </AdminLayout>
  );
}
