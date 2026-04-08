import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { categoryService } from '../api';

const icons = ['💻', '🎨', '📊', '📱', '🌐', '🤖', '📈', '🎵'];

export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await categoryService.getAll();
      const list = response.data?.data?.categories || [];
      const activeCategories = list.filter((cat) => cat.is_active !== 0 && cat.is_active !== false);
      setCategories(activeCategories);
    } catch (error) {
      console.error('Lỗi khi tải danh mục:', error);
      // Dữ liệu mẫu nếu API chưa có
      setCategories([
        { _id: '1', name: 'Lập trình', icon: '💻', description: 'Các khóa học lập trình', course_count: 120 },
        { _id: '2', name: 'Thiết kế', icon: '🎨', description: 'Thiết kế đồ họa & UI/UX', course_count: 85 },
        { _id: '3', name: 'Marketing', icon: '📊', description: 'Marketing số & quảng cáo', course_count: 76 },
        { _id: '4', name: 'Kinh doanh', icon: '📈', description: 'Kinh doanh & khởi nghiệp', course_count: 92 },
        { _id: '5', name: 'Ngoại ngữ', icon: '🌐', description: 'Học ngoại ngữ trực tuyến', course_count: 68 },
        { _id: '6', name: 'AI & Data', icon: '🤖', description: 'Trí tuệ nhân tạo & Dữ liệu', course_count: 54 },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-12">
          <span className="inline-block px-4 py-1.5 bg-primary-100 text-primary-700 rounded-full text-sm font-medium mb-4">
            Danh mục
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Khám phá theo lĩnh vực
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Chọn từ nhiều danh mục phong phú để tìm khóa học phù hợp với mục tiêu của bạn
          </p>
        </div>

        {/* Categories Grid */}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-gray-100 animate-pulse rounded-xl h-32" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {categories.slice(0, 6).map((category, index) => (
              <Link
                key={category._id}
                to={`/courses?category=${category._id}`}
                className="group bg-gray-50 hover:bg-primary-50 rounded-xl p-6 text-center transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
              >
                <div className="text-4xl mb-3">
                  {category.icon || icons[index % icons.length]}
                </div>
                <h3 className="font-semibold text-gray-900 group-hover:text-primary-600 transition-colors mb-1">
                  {category.name}
                </h3>
                <p className="text-sm text-gray-500">
                  {category.course_count || `${Math.floor(Math.random() * 100)}+`} khóa học
                </p>
              </Link>
            ))}
          </div>
        )}

        {/* View All Link */}
        <div className="text-center mt-10">
          <Link
            to="/categories"
            className="inline-flex items-center gap-2 text-primary-600 font-medium hover:text-primary-700 transition-colors"
          >
            Xem tất cả danh mục
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  );
}
