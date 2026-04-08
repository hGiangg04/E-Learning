import api from './axios';

export const statsService = {
  async getPublicStats() {
    const { data } = await api.get('/stats/public');
    if (!data.success) {
      throw new Error(data.message || 'Không lấy được thống kê');
    }
    return data.data;
  },
};
