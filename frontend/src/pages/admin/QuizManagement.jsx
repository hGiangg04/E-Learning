import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import AdminLayout from '../../components/admin/AdminLayout';
import DataTable from '../../components/admin/DataTable';
import Modal from '../../components/admin/Modal';
import { adminApi } from '../../api/adminApi';
import { quizQuestionService } from '../../api/quizQuestionService';
import { lessonService } from '../../api/lessonService';

const QUIZ_TYPE_LABELS = {
  multiple_choice: 'Trắc nghiệm',
  essay: 'Tự luận',
  true_false: 'Đúng / Sai',
};

function defaultQuestionFormForQuizType(quizType) {
  if (quizType === 'essay') {
    return {
      question_text: '',
      question_type: 'short_answer',
      points: 1,
      explanation: '',
      options: [],
    };
  }
  if (quizType === 'true_false') {
    return {
      question_text: '',
      question_type: 'true_false',
      points: 1,
      explanation: '',
      options: [
        { option_text: 'Đúng', is_correct: true },
        { option_text: 'Sai', is_correct: false },
      ],
    };
  }
  return {
    question_text: '',
    question_type: 'multiple_choice',
    points: 1,
    explanation: '',
    options: [
      { option_text: '', is_correct: true },
      { option_text: '', is_correct: false },
      { option_text: '', is_correct: false },
      { option_text: '', is_correct: false },
    ],
  };
}

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
  const [questions, setQuestions] = useState([]);
  const [questionsLoading, setQuestionsLoading] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [questionForm, setQuestionForm] = useState({
    question_text: '',
    question_type: 'single',
    points: 1,
    explanation: '',
    options: [
      { option_text: '', is_correct: true },
      { option_text: '', is_correct: false },
      { option_text: '', is_correct: false },
      { option_text: '', is_correct: false }
    ]
  });
  const [courses, setCourses] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [filterCourseId, setFilterCourseId] = useState('');
  const [lessonsLoading, setLessonsLoading] = useState(false);
  const [formData, setFormData] = useState({
    lesson_id: '',
    quiz_type: 'multiple_choice',
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

  useEffect(() => {
    const loadCourses = async () => {
      try {
        const response = await adminApi.getCourses({ limit: 500 });
        if (response.data?.success) {
          setCourses(response.data.data?.courses || []);
        }
      } catch (e) {
        console.error(e);
      }
    };
    loadCourses();
  }, []);

  useEffect(() => {
    if (!filterCourseId) {
      setLessons([]);
      return;
    }
    let cancelled = false;
    (async () => {
      setLessonsLoading(true);
      try {
        const res = await lessonService.getLessonsByCourseAdmin(filterCourseId);
        if (!cancelled && res?.success) {
          setLessons(res.data?.lessons || []);
        }
      } catch (e) {
        if (!cancelled) setLessons([]);
      } finally {
        if (!cancelled) setLessonsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [filterCourseId]);

  const columns = [
    { key: 'title', label: 'Tên quiz' },
    {
      key: 'course_id',
      label: 'Khóa học',
      render: (value) => <span className="font-medium">{value?.title || '-'}</span>,
    },
    {
      key: 'lesson_id',
      label: 'Bài học',
      render: (value) => <span className="font-medium">{value?.title || '-'}</span>,
    },
    {
      key: 'quiz_type',
      label: 'Loại quiz',
      render: (value) => <span>{QUIZ_TYPE_LABELS[value] || value || '-'}</span>,
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

  const handleEdit = async (quiz) => {
    setEditingQuiz(quiz);
    const cid = String(quiz.course_id?._id || quiz.course_id || '');
    const lid = String(quiz.lesson_id?._id || quiz.lesson_id || '');
    setFilterCourseId(cid);
    setFormData({
      lesson_id: lid,
      quiz_type: quiz.quiz_type || 'multiple_choice',
      title: quiz.title || '',
      description: quiz.description || '',
      time_limit: quiz.time_limit ?? 30,
      passing_score: quiz.passing_score ?? 70,
      max_attempts: quiz.max_attempts ?? 3,
      is_active: quiz.is_active ?? 1,
      shuffle_questions: !!quiz.shuffle_questions,
      shuffle_options: !!quiz.shuffle_options,
      show_results_immediately: quiz.show_results_immediately !== 0,
      show_correct_answer: quiz.show_correct_answer !== 0,
    });
    setIsModalOpen(true);
    if (cid) {
      try {
        const res = await lessonService.getLessonsByCourseAdmin(cid);
        if (res?.success) setLessons(res.data?.lessons || []);
      } catch {
        setLessons([]);
      }
    }
  };

  const openQuizQuestionEditor = async (quizId) => {
    try {
      const response = await adminApi.getQuiz(quizId);
      if (response.data.success) {
        setEditingQuiz(null);
        setSelectedQuiz(response.data.data);
        setIsModalOpen(true);
        loadQuestions(quizId);
      }
    } catch (error) {
      toast.error('Không thể tải chi tiết quiz');
    }
  };

  const handleView = async (quiz) => {
    await openQuizQuestionEditor(quiz._id);
  };

  const loadQuestions = async (quizId) => {
    setQuestionsLoading(true);
    try {
      const res = await quizQuestionService.getQuestionsByQuiz(quizId);
      if (res.success) {
        setQuestions(res.data?.questions || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setQuestionsLoading(false);
    }
  };

  const handleAddQuestion = () => {
    setEditingQuestion(null);
    const qt = selectedQuiz?.quiz?.quiz_type || 'multiple_choice';
    setQuestionForm(defaultQuestionFormForQuizType(qt));
  };

  const handleEditQuestion = (q) => {
    setEditingQuestion(q);
    const isEssay = q.question_type === 'short_answer';
    setQuestionForm({
      question_text: q.question_text || '',
      question_type: q.question_type || 'multiple_choice',
      points: q.points || 1,
      explanation: q.explanation || '',
      options: isEssay
        ? []
        : q.options?.length > 0
          ? q.options.map((o) => ({
              option_text: o.option_text || '',
              is_correct: !!o.is_correct,
            }))
          : defaultQuestionFormForQuizType('multiple_choice').options,
    });
  };

  const handleDeleteQuestion = async (q) => {
    if (!window.confirm('Bạn có chắc muốn xóa câu hỏi này?')) return;
    try {
      await quizQuestionService.deleteQuestion(q._id);
      toast.success('Đã xóa câu hỏi');
      if (selectedQuiz) loadQuestions(selectedQuiz._id || selectedQuiz.quiz?._id);
    } catch (e) {
      toast.error('Không thể xóa câu hỏi');
    }
  };

  const handleQuestionOptionChange = (index, field, value) => {
    const newOptions = [...questionForm.options];
    if (field === 'is_correct') {
      newOptions.forEach((opt, i) => { opt.is_correct = i === index; });
    } else {
      newOptions[index][field] = value;
    }
    setQuestionForm({ ...questionForm, options: newOptions });
  };

  const handleAddOption = () => {
    setQuestionForm({
      ...questionForm,
      options: [...questionForm.options, { option_text: '', is_correct: false }]
    });
  };

  const handleRemoveOption = (index) => {
    if (questionForm.options.length <= 2) {
      toast.error('Cần ít nhất 2 đáp án');
      return;
    }
    const newOptions = questionForm.options.filter((_, i) => i !== index);
    setQuestionForm({ ...questionForm, options: newOptions });
  };

  const handleSubmitQuestion = async (e) => {
    e.preventDefault();
    if (!questionForm.question_text.trim()) {
      toast.error('Vui lòng nhập nội dung câu hỏi');
      return;
    }

    const quizId = selectedQuiz?._id || selectedQuiz?.quiz?._id;
    const quizKind = selectedQuiz?.quiz?.quiz_type || 'multiple_choice';

    try {
      if (quizKind === 'essay') {
        if (editingQuestion) {
          await quizQuestionService.updateQuestion(editingQuestion._id, {
            question_text: questionForm.question_text.trim(),
            question_type: 'short_answer',
            points: questionForm.points,
            explanation: questionForm.explanation,
            options: [],
          });
          toast.success('Đã cập nhật câu hỏi');
        } else {
          await quizQuestionService.addQuestion({
            quiz_id: quizId,
            question_text: questionForm.question_text.trim(),
            question_type: 'short_answer',
            points: questionForm.points,
            explanation: questionForm.explanation,
          });
          toast.success('Đã thêm câu hỏi');
        }
      } else {
        const validOptions = questionForm.options.filter((o) => o.option_text.trim());
        if (validOptions.length < 2) {
          toast.error('Cần ít nhất 2 đáp án hợp lệ');
          return;
        }
        if (!validOptions.some((o) => o.is_correct)) {
          toast.error('Cần chọn ít nhất 1 đáp án đúng');
          return;
        }
        const qType = quizKind === 'true_false' ? 'true_false' : 'multiple_choice';
        if (editingQuestion) {
          await quizQuestionService.updateQuestion(editingQuestion._id, {
            question_text: questionForm.question_text.trim(),
            question_type: qType,
            points: questionForm.points,
            explanation: questionForm.explanation,
            options: validOptions,
          });
          toast.success('Đã cập nhật câu hỏi');
        } else {
          await quizQuestionService.addQuestion({
            quiz_id: quizId,
            question_text: questionForm.question_text.trim(),
            question_type: qType,
            points: questionForm.points,
            explanation: questionForm.explanation,
            options: validOptions,
          });
          toast.success('Đã thêm câu hỏi');
        }
      }
      loadQuestions(quizId);
      setQuestionForm(defaultQuestionFormForQuizType(quizKind));
      setEditingQuestion(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Có lỗi xảy ra');
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

  const buildQuizPayload = () => ({
    lesson_id: formData.lesson_id,
    quiz_type: formData.quiz_type,
    title: formData.title.trim(),
    description: formData.description,
    time_limit: Number(formData.time_limit),
    passing_score: Number(formData.passing_score),
    max_attempts: Number(formData.max_attempts),
    is_active: formData.is_active ? 1 : 0,
    shuffle_questions: formData.shuffle_questions ? 1 : 0,
    shuffle_options: formData.shuffle_options ? 1 : 0,
    show_correct_answer: formData.show_correct_answer ? 1 : 0,
    show_results_immediately: formData.show_results_immediately ? 1 : 0,
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.lesson_id) {
      toast.error('Vui lòng chọn khóa học và bài học');
      return;
    }
    try {
      if (editingQuiz) {
        const response = await adminApi.updateQuiz(editingQuiz._id, buildQuizPayload());
        if (response.data.success) {
          toast.success('Cập nhật quiz thành công');
          setIsModalOpen(false);
          setEditingQuiz(null);
          fetchQuizzes();
        }
      } else {
        const response = await adminApi.createQuiz(buildQuizPayload());
        if (response.data.success) {
          const created = response.data.data?.quiz;
          await fetchQuizzes();
          if (created?._id) {
            toast.success('Đã tạo quiz — thêm câu hỏi và đáp án đúng bên dưới');
            await openQuizQuestionEditor(created._id);
          } else {
            toast.success('Tạo quiz thành công');
            setIsModalOpen(false);
            fetchQuizzes();
          }
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
              setFilterCourseId('');
              setLessons([]);
              setFormData({
                lesson_id: '',
                quiz_type: 'multiple_choice',
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
            setFilterCourseId('');
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
                <div>
                  <label className="text-sm text-gray-500">Bài học</label>
                  <p className="font-medium">{selectedQuiz.quiz?.lesson_id?.title || '-'}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Loại quiz</label>
                  <p className="font-medium">
                    {QUIZ_TYPE_LABELS[selectedQuiz.quiz?.quiz_type] || selectedQuiz.quiz?.quiz_type || '-'}
                  </p>
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

              {/* Question Management */}
              <div className="border-t pt-4">
                {questions.length === 0 && (
                  <p className="mb-4 text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                    Chưa có câu hỏi. Nhấn <strong>+ Thêm câu hỏi</strong> — với <strong>trắc nghiệm / đúng–sai</strong> điền các đáp án và chọn{' '}
                    <strong>ô tròn</strong> bên cạnh đáp án <strong>đúng</strong>. <strong>Tự luận</strong>: chỉ nhập nội dung câu (học viên trả lời bằng văn bản).
                  </p>
                )}
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-medium">Danh sách câu hỏi ({questions.length})</h4>
                  <button
                    type="button"
                    onClick={handleAddQuestion}
                    className="px-3 py-1.5 bg-primary-600 text-white text-sm rounded-lg hover:bg-primary-700 transition-colors"
                  >
                    + Thêm câu hỏi
                  </button>
                </div>

                {editingQuestion !== undefined && !editingQuestion ? (
                  <form onSubmit={handleSubmitQuestion} className="p-4 bg-gray-50 rounded-lg space-y-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Câu hỏi</label>
                      <textarea
                        value={questionForm.question_text}
                        onChange={e => setQuestionForm({ ...questionForm, question_text: e.target.value })}
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                        placeholder="Nhập nội dung câu hỏi..."
                        required
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Điểm</label>
                        <input
                          type="number"
                          value={questionForm.points}
                          onChange={e => setQuestionForm({ ...questionForm, points: Number(e.target.value) })}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                          min={1}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Giải thích</label>
                        <input
                          type="text"
                          value={questionForm.explanation}
                          onChange={e => setQuestionForm({ ...questionForm, explanation: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                          placeholder="Giải thích đáp án đúng..."
                        />
                      </div>
                    </div>
                    {selectedQuiz?.quiz?.quiz_type === 'essay' ? (
                      <p className="text-sm text-gray-600">
                        Quiz tự luận: học viên nhập câu trả lời; điểm tính khi có nội dung (hệ thống tự chấm đơn giản).
                      </p>
                    ) : (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Đáp án</label>
                        {questionForm.options.map((opt, idx) => (
                          <div key={idx} className="flex items-center gap-2 mb-2">
                            <input
                              type="radio"
                              name="correct"
                              checked={opt.is_correct}
                              onChange={() => handleQuestionOptionChange(idx, 'is_correct', true)}
                              className="w-4 h-4 text-primary-600"
                              title="Đáp án đúng"
                            />
                            <input
                              type="text"
                              value={opt.option_text}
                              onChange={(e) => handleQuestionOptionChange(idx, 'option_text', e.target.value)}
                              className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                              placeholder={`Đáp án ${idx + 1}`}
                              required
                            />
                            {selectedQuiz?.quiz?.quiz_type !== 'true_false' && (
                              <button
                                type="button"
                                onClick={() => handleRemoveOption(idx)}
                                className="p-2 text-gray-400 hover:text-red-500"
                              >
                                ×
                              </button>
                            )}
                          </div>
                        ))}
                        {selectedQuiz?.quiz?.quiz_type !== 'true_false' && (
                          <button
                            type="button"
                            onClick={handleAddOption}
                            className="text-sm text-primary-600 hover:underline mt-1"
                          >
                            + Thêm đáp án
                          </button>
                        )}
                      </div>
                    )}
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setEditingQuestion(undefined)}
                        className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        Hủy
                      </button>
                      <button type="submit" className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">
                        Thêm câu hỏi
                      </button>
                    </div>
                  </form>
                ) : editingQuestion ? (
                  <form onSubmit={handleSubmitQuestion} className="p-4 bg-gray-50 rounded-lg space-y-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Câu hỏi</label>
                      <textarea
                        value={questionForm.question_text}
                        onChange={e => setQuestionForm({ ...questionForm, question_text: e.target.value })}
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                        required
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Điểm</label>
                        <input
                          type="number"
                          value={questionForm.points}
                          onChange={e => setQuestionForm({ ...questionForm, points: Number(e.target.value) })}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                          min={1}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Giải thích</label>
                        <input
                          type="text"
                          value={questionForm.explanation}
                          onChange={e => setQuestionForm({ ...questionForm, explanation: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                      </div>
                    </div>
                    {selectedQuiz?.quiz?.quiz_type === 'essay' ? (
                      <p className="text-sm text-gray-600">Câu hỏi tự luận — không có đáp án trắc nghiệm.</p>
                    ) : (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Đáp án</label>
                        {questionForm.options.map((opt, idx) => (
                          <div key={idx} className="flex items-center gap-2 mb-2">
                            <input
                              type="radio"
                              name="correct_edit"
                              checked={opt.is_correct}
                              onChange={() => handleQuestionOptionChange(idx, 'is_correct', true)}
                              className="w-4 h-4 text-primary-600"
                            />
                            <input
                              type="text"
                              value={opt.option_text}
                              onChange={(e) => handleQuestionOptionChange(idx, 'option_text', e.target.value)}
                              className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                              required
                            />
                            {selectedQuiz?.quiz?.quiz_type !== 'true_false' && (
                              <button
                                type="button"
                                onClick={() => handleRemoveOption(idx)}
                                className="p-2 text-gray-400 hover:text-red-500"
                              >
                                ×
                              </button>
                            )}
                          </div>
                        ))}
                        {selectedQuiz?.quiz?.quiz_type !== 'true_false' && (
                          <button
                            type="button"
                            onClick={handleAddOption}
                            className="text-sm text-primary-600 hover:underline mt-1"
                          >
                            + Thêm đáp án
                          </button>
                        )}
                      </div>
                    )}
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setEditingQuestion(undefined)}
                        className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        Hủy
                      </button>
                      <button type="submit" className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">
                        Lưu câu hỏi
                      </button>
                    </div>
                  </form>
                ) : null}

                {questionsLoading ? (
                  <p className="text-center text-gray-400 py-4">Đang tải...</p>
                ) : questions.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">Chưa có câu hỏi nào</p>
                ) : (
                  <div className="space-y-3 max-h-80 overflow-y-auto">
                    {questions.map((q, idx) => (
                      <div key={q._id} className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <p className="font-medium text-sm">{idx + 1}. {q.question_text}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              Điểm: {q.points || 1} | {q.options?.length || 0} đáp án
                            </p>
                            <div className="mt-2 space-y-1">
                              {q.options?.map((opt, i) => (
                                <div key={i} className={`text-sm ${opt.is_correct ? 'text-green-600 font-medium' : 'text-gray-600'}`}>
                                  {opt.is_correct ? '✓' : '○'} {opt.option_text}
                                </div>
                              ))}
                            </div>
                          </div>
                          <div className="flex gap-1 shrink-0">
                            <button
                              onClick={() => handleEditQuestion(q)}
                              className="p-1.5 text-blue-500 hover:bg-blue-50 rounded"
                              title="Sửa"
                            >
                              ✏️
                            </button>
                            <button
                              onClick={() => handleDeleteQuestion(q)}
                              className="p-1.5 text-red-500 hover:bg-red-50 rounded"
                              title="Xóa"
                            >
                              🗑️
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Khóa học</label>
                  <select
                    value={filterCourseId}
                    onChange={(e) => {
                      const v = e.target.value;
                      setFilterCourseId(v);
                      setFormData((prev) => ({ ...prev, lesson_id: '' }));
                    }}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
                    required
                  >
                    <option value="">— Chọn khóa học —</option>
                    {courses.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.title}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bài học</label>
                  <select
                    value={formData.lesson_id}
                    onChange={(e) => setFormData({ ...formData, lesson_id: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
                    required
                    disabled={!filterCourseId || lessonsLoading}
                  >
                    <option value="">{lessonsLoading ? 'Đang tải…' : '— Chọn bài học —'}</option>
                    {lessons.map((l) => (
                      <option key={l._id} value={l._id}>
                        {l.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <span className="block text-sm font-medium text-gray-700 mb-2">Loại quiz</span>
                <div className="flex flex-wrap gap-4">
                  {[
                    { value: 'multiple_choice', label: 'Trắc nghiệm' },
                    { value: 'essay', label: 'Tự luận' },
                    { value: 'true_false', label: 'Đúng / Sai' },
                  ].map((opt) => (
                    <label key={opt.value} className="inline-flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="quiz_type"
                        value={opt.value}
                        checked={formData.quiz_type === opt.value}
                        onChange={() => setFormData({ ...formData, quiz_type: opt.value })}
                        className="w-4 h-4 text-primary-600"
                        disabled={!!editingQuiz}
                      />
                      <span className="text-sm text-gray-700">{opt.label}</span>
                    </label>
                  ))}
                </div>
                {editingQuiz && (
                  <p className="text-xs text-amber-600 mt-1">Loại quiz không đổi khi sửa (để tránh lệch dữ liệu câu hỏi).</p>
                )}
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
              {!editingQuiz && (
                <p className="text-sm text-gray-600 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2">
                  <strong>Bước tiếp theo:</strong> Nhấn <strong>Thêm mới</strong> để lưu quiz, sau đó màn hình sẽ chuyển sang phần{' '}
                  <strong>thêm câu hỏi</strong>. Với trắc nghiệm / đúng–sai, chọn <strong>ô tròn</strong> cạnh đáp án đúng; với tự luận chỉ cần nhập nội dung câu hỏi.
                </p>
              )}
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
