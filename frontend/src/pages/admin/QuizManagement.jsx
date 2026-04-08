import { useState, useEffect } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import DataTable from '../../components/admin/DataTable';
import Modal from '../../components/admin/Modal';

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
    title: '',
    course: '',
    duration: 30,
    passingScore: 70,
    maxAttempts: 3,
  });

  useEffect(() => {
    fetchQuizzes();
  }, []);

  const fetchQuizzes = async () => {
    try {
      setLoading(true);
      // Mock data
      setQuizzes([
        { _id: '1', title: 'React Fundamentals Quiz', course: { title: 'React cơ bản' }, questions: 20, duration: 30, passingScore: 70, attempts: 45, status: 'active' },
        { _id: '2', title: 'Node.js Basics Test', course: { title: 'Node.js Advanced' }, questions: 15, duration: 25, passingScore: 60, attempts: 30, status: 'active' },
        { _id: '3', title: 'Python Data Types Quiz', course: { title: 'Python for Data Science' }, questions: 25, duration: 45, passingScore: 75, attempts: 60, status: 'active' },
        { _id: '4', title: 'Docker Commands Test', course: { title: 'Docker & Kubernetes' }, questions: 10, duration: 20, passingScore: 80, attempts: 20, status: 'inactive' },
        { _id: '5', title: 'TypeScript Types Quiz', course: { title: 'TypeScript Masterclass' }, questions: 18, duration: 35, passingScore: 70, attempts: 35, status: 'active' },
        { _id: '6', title: 'MongoDB Query Test', course: { title: 'MongoDB Fundamentals' }, questions: 12, duration: 25, passingScore: 65, attempts: 15, status: 'pending' },
      ]);
    } catch (error) {
      console.error('Error fetching quizzes:', error);
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    { key: 'title', label: 'Tên quiz' },
    { key: 'course', label: 'Khóa học', render: (value) => <span className="font-medium">{value.title}</span> },
    { key: 'questions', label: 'Số câu hỏi' },
    { key: 'duration', label: 'Thời gian (phút)' },
    { key: 'passingScore', label: 'Điểm đạt (%)' },
    { key: 'attempts', label: 'Lượt thi' },
    {
      key: 'status',
      label: 'Trạng thái',
      badge: true,
      render: (value) => {
        const statusLabels = { active: 'Hoạt động', inactive: 'Tắt', pending: 'Chờ duyệt' };
        const statusColors = {
          active: 'bg-green-100 text-green-800',
          inactive: 'bg-gray-100 text-gray-800',
          pending: 'bg-yellow-100 text-yellow-800',
        };
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
      title: quiz.title,
      course: quiz.course.title,
      duration: quiz.duration,
      passingScore: quiz.passingScore,
      maxAttempts: quiz.maxAttempts,
    });
    setIsModalOpen(true);
  };

  const handleView = (quiz) => {
    setSelectedQuiz(quiz);
    setIsModalOpen(true);
  };

  const handleDelete = (quiz) => {
    if (window.confirm(`Bạn có chắc muốn xóa quiz "${quiz.title}"?`)) {
      setQuizzes(quizzes.filter((q) => q._id !== quiz._id));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingQuiz) {
      setQuizzes(quizzes.map((q) => (q._id === editingQuiz._id ? { ...q, ...formData } : q)));
    } else {
      setQuizzes([{ ...formData, _id: Date.now().toString(), questions: 0, attempts: 0, status: 'pending' }, ...quizzes]);
    }
    setIsModalOpen(false);
    setEditingQuiz(null);
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
              setFormData({ title: '', course: '', duration: 30, passingScore: 70, maxAttempts: 3 });
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
                  <p className="font-medium">{selectedQuiz.title}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Khóa học</label>
                  <p className="font-medium">{selectedQuiz.course.title}</p>
                </div>
              </div>
              <div className="grid grid-cols-4 gap-4">
                <div>
                  <label className="text-sm text-gray-500">Số câu hỏi</label>
                  <p className="font-medium">{selectedQuiz.questions}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Thời gian</label>
                  <p className="font-medium">{selectedQuiz.duration} phút</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Điểm đạt</label>
                  <p className="font-medium">{selectedQuiz.passingScore}%</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Lượt thi</label>
                  <p className="font-medium">{selectedQuiz.attempts}</p>
                </div>
              </div>
              <div>
                <label className="text-sm text-gray-500">Trạng thái</label>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  selectedQuiz.status === 'active' ? 'bg-green-100 text-green-800' :
                  selectedQuiz.status === 'inactive' ? 'bg-gray-100 text-gray-800' : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {selectedQuiz.status === 'active' ? 'Hoạt động' : selectedQuiz.status === 'inactive' ? 'Tắt' : 'Chờ duyệt'}
                </span>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t">
                <a
                  href={`/admin/quizzes/${selectedQuiz._id}/questions`}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                  Quản lý câu hỏi
                </a>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Khóa học</label>
                <input
                  type="text"
                  value={formData.course}
                  onChange={(e) => setFormData({ ...formData, course: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  required
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Thời gian (phút)</label>
                  <input
                    type="number"
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Điểm đạt (%)</label>
                  <input
                    type="number"
                    value={formData.passingScore}
                    onChange={(e) => setFormData({ ...formData, passingScore: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Số lần thi tối đa</label>
                  <input
                    type="number"
                    value={formData.maxAttempts}
                    onChange={(e) => setFormData({ ...formData, maxAttempts: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    required
                  />
                </div>
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
