import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { courseService } from '../api';
import CourseCard from './CourseCard';

export default function FeaturedCourses() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('popular');

  useEffect(() => {
    fetchCourses();
  }, []);

  const normalizeCourse = (c) => ({
    ...c,
    category: c.category || c.category_id,
    instructor: c.instructor || c.instructor_id,
  });

  const fetchCourses = async () => {
    try {
      const response = await courseService.getAll({ limit: 8, sort: 'newest' });
      const raw = response.data?.data?.courses || [];
      setCourses(raw.map(normalizeCourse));
    } catch (error) {
      console.error('Lỗi khi tải khóa học:', error);
      // Không dùng dữ liệu demo giả (_id demo1, …) — link tới /courses/demo1 sẽ lỗi vì không có trong DB
      setCourses([]);
    } finally {
      setLoading(false);
    }
  };

  const filterOptions = [
    { id: 'popular', label: 'Phổ biến' },
    { id: 'newest', label: 'Mới nhất' },
    { id: 'rating', label: 'Đánh giá cao' },
    { id: 'free', label: 'Miễn phí' },
  ];

  const getSortedCourses = () => {
    if (!courses.length) return [];
    const sorted = [...courses];
    switch (filter) {
      case 'rating':
        return sorted.sort((a, b) => (b.average_rating || 0) - (a.average_rating || 0));
      case 'newest':
        return sorted.reverse();
      case 'free':
        return sorted.filter(c => c.price === 0 || c.discount_price === 0);
      default:
        return sorted.sort((a, b) => (b.student_count || 0) - (a.student_count || 0));
    }
  };

  return (
    <section className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-10">
          <div>
            <span className="inline-block px-4 py-1.5 bg-primary-100 text-primary-700 rounded-full text-sm font-medium mb-4">
              Khóa học nổi bật
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
              Khám phá khóa học hàng đầu
            </h2>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-2 mt-4 md:mt-0">
            {filterOptions.map((option) => (
              <button
                key={option.id}
                onClick={() => setFilter(option.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  filter === option.id
                    ? 'bg-primary-600 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Courses Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl overflow-hidden animate-pulse">
                <div className="aspect-video bg-gray-200" />
                <div className="p-5">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-3" />
                  <div className="h-3 bg-gray-200 rounded w-full mb-2" />
                  <div className="h-3 bg-gray-200 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : getSortedCourses().length === 0 ? (
          <p className="text-center text-gray-600 py-8">
            Chưa có khóa học nổi bật. Hãy bật xuất bản khóa học trong admin và đảm bảo backend đang chạy.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {getSortedCourses().map((course) => (
              <CourseCard key={course._id} course={course} />
            ))}
          </div>
        )}

        {/* View All Link */}
        <div className="text-center mt-12">
          <Link
            to="/courses"
            className="inline-flex items-center justify-center gap-2 btn-primary"
          >
            Xem tất cả khóa học
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  );
}
