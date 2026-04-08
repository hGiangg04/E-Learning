import api from './axios';

const BASE = '/quizzes';

/** Lấy quiz gắn với lesson */
export const quizService = {
  /** GET /api/quizzes/lesson/:lessonId */
  getQuizByLesson: (lessonId) => api.get(`${BASE}/lesson/${lessonId}`),

  /** GET /api/quizzes/:id/take — lấy quiz để làm (không lộ đáp án) */
  getQuizForTake: (quizId) => api.get(`${BASE}/${quizId}/take`),

  /** POST /api/quizzes/:id/start — bắt đầu lượt làm bài */
  startQuiz: (quizId) => api.post(`${BASE}/${quizId}/start`),

  /** POST /api/quizzes/attempts/:attemptId/submit — nộp bài */
  submitQuiz: (attemptId, data) => api.post(`${BASE}/attempts/${attemptId}/submit`, data),

  /** GET /api/quizzes/:id/attempts/mine — lịch sử làm bài */
  getMyAttempts: (quizId) => api.get(`${BASE}/${quizId}/attempts/mine`),
};
