import api from './axios';

export const lessonService = {
  async getLessonsByCourse(courseId) {
    const { data } = await api.get(`/lessons/course/${courseId}`);
    return data;
  },

  async getLesson(id) {
    const { data } = await api.get(`/lessons/${id}`);
    return data;
  },

  async createLesson(payload) {
    const { data } = await api.post('/lessons', payload);
    return data;
  },

  async updateLesson(id, payload) {
    const { data } = await api.put(`/lessons/${id}`, payload);
    return data;
  },

  async deleteLesson(id) {
    const { data } = await api.delete(`/lessons/${id}`);
    return data;
  },

  async reorderLessons(courseId, orderedIds) {
    const updates = orderedIds.map((id, index) =>
      api.put(`/lessons/${id}`, { position: index + 1 })
    );
    await Promise.all(updates);
    return { success: true };
  },
};
