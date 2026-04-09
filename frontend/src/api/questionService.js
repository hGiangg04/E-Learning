import api from './axios';

export const questionService = {
  async getQuestionsByCourse(courseId, params) {
    const { data } = await api.get(`/questions/course/${courseId}`, { params });
    return data;
  },

  async getQuestionsByLesson(lessonId, params) {
    const { data } = await api.get(`/questions/lesson/${lessonId}`, { params });
    return data;
  },

  async getQuestionById(id) {
    const { data } = await api.get(`/questions/${id}`);
    return data;
  },

  async createQuestion(payload) {
    const { data } = await api.post('/questions', payload);
    return data;
  },

  async updateQuestion(id, payload) {
    const { data } = await api.put(`/questions/${id}`, payload);
    return data;
  },

  async deleteQuestion(id) {
    const { data } = await api.delete(`/questions/${id}`);
    return data;
  },

  async resolveQuestion(id) {
    const { data } = await api.patch(`/questions/${id}/resolve`);
    return data;
  },

  async createAnswer(questionId, content) {
    const { data } = await api.post(`/questions/${questionId}/answers`, { content });
    return data;
  },

  async updateAnswer(id, content) {
    const { data } = await api.put(`/answers/${id}`, { content });
    return data;
  },

  async deleteAnswer(id) {
    const { data } = await api.delete(`/answers/${id}`);
    return data;
  },

  async upvoteAnswer(id) {
    const { data } = await api.post(`/answers/${id}/upvote`);
    return data;
  },
};
