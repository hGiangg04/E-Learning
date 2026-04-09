import api from './axios';

export const progressService = {
  async updateLessonProgress(lessonId, payload) {
    const { data } = await api.patch(`/progress/lessons/${lessonId}`, payload);
    return data;
  },

  async getLessonProgressByCourse(courseId) {
    const { data } = await api.get(`/progress/courses/${courseId}/lessons`);
    return data;
  },

  async getCourseProgress(courseId) {
    const { data } = await api.get(`/progress/courses/${courseId}`);
    return data;
  },
};
