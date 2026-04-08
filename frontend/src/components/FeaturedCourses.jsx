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

  const fetchCourses = async () => {
    try {
      const response = await courseService.getAll({ limit: 8, is_published: true });
      setCourses(response.data.courses || response.data);
    } catch (error) {
      console.error('Lỗi khi tải khóa học:', error);
      // Demo data
      setCourses([
        {
          _id: 'demo1',
          title: 'Lập trình React từ cơ bản đến nâng cao',
          description: 'Khóa học React JS toàn diện giúp bạn xây dựng ứng dụng web hiện đại',
          thumbnail: '',
          price: 1500000,
          discount_price: 990000,
          duration_hours: 40,
          level: 'intermediate',
          average_rating: 4.8,
          review_count: 1250,
          student_count: 5420,
          instructor: { name: 'Nguyễn Văn A' },
          category: { name: 'Lập trình' }
        },
        {
          _id: 'demo2',
          title: 'Thiết kế UI/UX cho người mới bắt đầu',
          description: 'Học cách thiết kế giao diện người dùng đẹp mắt và chuyên nghiệp',
          thumbnail: '',
          price: 1200000,
          discount_price: 0,
          duration_hours: 28,
          level: 'beginner',
          average_rating: 4.9,
          review_count: 890,
          student_count: 3210,
          instructor: { name: 'Trần Thị B' },
          category: { name: 'Thiết kế' }
        },
        {
          _id: 'demo3',
          title: 'Python cho Khoa học Dữ liệu',
          description: 'Phân tích dữ liệu và Machine Learning với Python',
          thumbnail: '',
          price: 2000000,
          discount_price: 1490000,
          duration_hours: 50,
          level: 'advanced',
          average_rating: 4.7,
          review_count: 756,
          student_count: 2890,
          instructor: { name: 'Lê Văn C' },
          category: { name: 'AI & Data' }
        },
        {
          _id: 'demo4',
          title: 'Marketing thực chiến A-Z',
          description: 'Chiến lược marketing online hiệu quả cho doanh nghiệp',
          thumbnail: '',
          price: 1800000,
          duration_hours: 35,
          level: 'beginner',
          average_rating: 4.6,
          review_count: 543,
          student_count: 4120,
          instructor: { name: 'Phạm Thị D' },
          category: { name: 'Marketing' }
        },
        {
          _id: 'demo5',
          title: 'Node.js Backend Development',
          description: 'Xây dựng API và server-side applications với Node.js',
          thumbnail: '',
          price: 1600000,
          discount_price: 1190000,
          duration_hours: 38,
          level: 'intermediate',
          average_rating: 4.8,
          review_count: 678,
          student_count: 2340,
          instructor: { name: 'Hoàng Văn E' },
          category: { name: 'Lập trình' }
        },
        {
          _id: 'demo6',
          title: 'Tiếng Anh giao tiếp cơ bản',
          description: 'Cải thiện kỹ năng tiếng Anh giao tiếp trong 30 ngày',
          thumbnail: '',
          price: 0,
          duration_hours: 20,
          level: 'beginner',
          average_rating: 4.5,
          review_count: 2100,
          student_count: 8900,
          instructor: { name: 'Emily Smith' },
          category: { name: 'Ngoại ngữ' }
        },
        {
          _id: 'demo7',
          title: 'Figma Master - Thiết kế UI/UX chuyên nghiệp',
          description: 'Thành thạo Figma từ cơ bản đến portfolio hoàn chỉnh',
          thumbnail: '',
          price: 1400000,
          duration_hours: 32,
          level: 'intermediate',
          average_rating: 4.9,
          review_count: 432,
          student_count: 1780,
          instructor: { name: 'Ngô Văn F' },
          category: { name: 'Thiết kế' }
        },
        {
          _id: 'demo8',
          title: 'Docker & Kubernetes cơ bản',
          description: 'Triển khai ứng dụng container hóa chuyên nghiệp',
          thumbnail: '',
          price: 1900000,
          discount_price: 1590000,
          duration_hours: 42,
          level: 'advanced',
          average_rating: 4.7,
          review_count: 321,
          student_count: 1560,
          instructor: { name: 'Đặng Văn G' },
          category: { name: 'Lập trình' }
        }
      ]);
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
