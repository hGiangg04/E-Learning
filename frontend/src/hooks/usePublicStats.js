import { useCallback, useEffect, useState } from 'react';
import { statsService } from '../api/statsService';

const emptyStats = {
  student_count: 0,
  course_count: 0,
  instructor_count: 0,
  completion_rate_percent: 0,
  average_rating: 0,
  spotlight_course: null,
};

/** Tải thống kê trang chủ; tự làm mới định kỳ và khi tab được mở lại (dữ liệu DB mới nhất). */
export function usePublicStats() {
  const [publicStats, setPublicStats] = useState(null);

  const fetchStats = useCallback(async () => {
    try {
      const data = await statsService.getPublicStats();
      setPublicStats(data);
    } catch {
      setPublicStats((prev) => prev ?? emptyStats);
    }
  }, []);

  useEffect(() => {
    fetchStats();

    const intervalMs = 45000;
    const timer = setInterval(fetchStats, intervalMs);

    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        fetchStats();
      }
    };
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [fetchStats]);

  return publicStats;
}
