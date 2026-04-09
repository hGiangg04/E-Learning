import axios from './axios';

export const quizQuestionService = {
    // Lấy câu hỏi theo quiz
    getQuestionsByQuiz: async (quizId) => {
        const res = await axios.get(`/quiz-questions/quiz/${quizId}`);
        return res.data;
    },

    // Thêm câu hỏi
    addQuestion: async (data) => {
        const res = await axios.post('/quiz-questions', data);
        return res.data;
    },

    // Cập nhật câu hỏi
    updateQuestion: async (questionId, data) => {
        const res = await axios.put(`/quiz-questions/${questionId}`, data);
        return res.data;
    },

    // Xóa câu hỏi
    deleteQuestion: async (questionId) => {
        const res = await axios.delete(`/quiz-questions/${questionId}`);
        return res.data;
    }
};
