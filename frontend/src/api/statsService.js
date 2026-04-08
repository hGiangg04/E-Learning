import api from './axios';

export const statsService = {
  async getPublicStats() {
    const { data } = await api.get('/stats/public', {
      params: { _t: Date.now() },
      headers: { 'Cache-Control': 'no-cache' },
    });
    if (!data.success) {
      throw new Error(data.message || 'Không lấy được thống kê');
    }
    return data.data;
  },
};
