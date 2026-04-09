import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import PageLayout from '../components/PageLayout';
import CourseCard from '../components/CourseCard';
import { courseService } from '../api';

function normalizeCourse(c) {
  return {
    ...c,
    category: c.category || c.category_id,
    instructor: c.instructor || c.instructor_id,
  };
}

export default function CoursesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const categoryId = searchParams.get('category') || searchParams.get('category_id');
  const level = searchParams.get('level') || '';
  const searchFromUrl = searchParams.get('search') || '';
  const sortFromUrl = searchParams.get('sort') || 'newest';
  const minPrice = searchParams.get('min_price') || '';
  const maxPrice = searchParams.get('max_price') || '';
  const minRating = searchParams.get('min_rating') || '';
  const language = searchParams.get('language') || '';

  const [inputSearch, setInputSearch] = useState(searchFromUrl);
  const [page, setPage] = useState(1);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pages, setPages] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    setInputSearch(searchFromUrl);
  }, [searchFromUrl]);

  useEffect(() => {
    setPage(1);
  }, [categoryId, level, searchFromUrl, sortFromUrl, minPrice, maxPrice, minRating, language]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const params = {
          page,
          limit: 12,
          ...(categoryId ? { category_id: categoryId } : {}),
          ...(level ? { level } : {}),
          ...(searchFromUrl.trim() ? { search: searchFromUrl.trim() } : {}),
          ...(sortFromUrl ? { sort: sortFromUrl } : {}),
          ...(minPrice ? { min_price: minPrice } : {}),
          ...(maxPrice ? { max_price: maxPrice } : {}),
          ...(minRating ? { min_rating: minRating } : {}),
          ...(language ? { language } : {}),
        };
        const res = await courseService.getAll(params);
        const data = res.data?.data;
        const list = (data?.courses || []).map(normalizeCourse);
        setCourses(list);
        setPages(data?.pagination?.pages || 1);
      } catch (e) {
        console.error(e);
        setCourses([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [page, categoryId, level, searchFromUrl, sortFromUrl, minPrice, maxPrice, minRating, language]);

  const handleSearch = (e) => {
    e.preventDefault();
    const next = new URLSearchParams(searchParams);
    if (inputSearch.trim()) next.set('search', inputSearch.trim());
    else next.delete('search');
    setSearchParams(next);
  };

  const handleFilterChange = (key, value) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    setPage(1);
    setSearchParams(next);
  };

  const clearAllFilters = () => {
    const next = new URLSearchParams();
    if (categoryId) next.set('category_id', categoryId);
    setPage(1);
    setSearchParams(next);
  };

  const hasActiveFilters = minPrice || maxPrice || minRating || language || (sortFromUrl !== 'newest');

  const sortOptions = [
    { value: 'newest', label: 'Mới nhất' },
    { value: 'oldest', label: 'Cũ nhất' },
    { value: 'price_asc', label: 'Giá: Thấp đến Cao' },
    { value: 'price_desc', label: 'Giá: Cao đến Thấp' },
    { value: 'rating', label: 'Đánh giá cao nhất' },
    { value: 'students', label: 'Nhiều học viên nhất' },
    { value: 'title_asc', label: 'A-Z' },
    { value: 'title_desc', label: 'Z-A' },
  ];

  const levelOptions = [
    { value: '', label: 'Tất cả cấp độ' },
    { value: 'beginner', label: 'Người mới bắt đầu' },
    { value: 'intermediate', label: 'Trung cấp' },
    { value: 'advanced', label: 'Nâng cao' },
  ];

  const languageOptions = [
    { value: '', label: 'Tất cả ngôn ngữ' },
    { value: 'vi', label: 'Tiếng Việt' },
    { value: 'en', label: 'Tiếng Anh' },
  ];

  return (
    <PageLayout>
      <div className="bg-gray-50 border-b border-gray-200 pt-24 pb-10 px-4 sm:px-8 lg:px-12">
        <div className="max-w-7xl mx-auto">
          <nav className="text-sm text-gray-500 mb-4">
            <Link to="/" className="hover:text-primary-600">
              Trang chủ
            </Link>
            <span className="mx-2">/</span>
            <span className="text-gray-900">Khóa học</span>
          </nav>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Khóa học</h1>
          <p className="mt-2 text-gray-600 max-w-2xl">
            Danh sách khóa học đang mở đăng ký. Dữ liệu lấy trực tiếp từ API backend.
          </p>

          <div className="mt-8 flex flex-col lg:flex-row gap-4 max-w-5xl">
            <form onSubmit={handleSearch} className="flex-1 flex gap-3">
              <input
                type="search"
                placeholder="Tìm theo tên hoặc mô tả…"
                value={inputSearch}
                onChange={(e) => setInputSearch(e.target.value)}
                className="flex-1 rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/30"
              />
              <button type="submit" className="btn-primary shrink-0">
                Tìm kiếm
              </button>
            </form>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="lg:hidden flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-300 rounded-lg bg-white hover:bg-gray-50"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
              </svg>
              Bộ lọc
              {hasActiveFilters && <span className="w-2 h-2 bg-red-500 rounded-full"></span>}
            </button>
          </div>

          {/* Bộ lọc nâng cao */}
          <div className={`mt-4 max-w-5xl ${showFilters ? 'block' : 'hidden lg:block'}`}>
            <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">Bộ lọc nâng cao</h3>
                {hasActiveFilters && (
                  <button
                    onClick={clearAllFilters}
                    className="text-sm text-red-600 hover:text-red-700 font-medium"
                  >
                    Xóa tất cả
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Sắp xếp */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sắp xếp theo</label>
                  <select
                    value={sortFromUrl}
                    onChange={(e) => handleFilterChange('sort', e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/30"
                  >
                    {sortOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>

                {/* Cấp độ */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cấp độ</label>
                  <select
                    value={level}
                    onChange={(e) => handleFilterChange('level', e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/30"
                  >
                    {levelOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>

                {/* Ngôn ngữ */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ngôn ngữ</label>
                  <select
                    value={language}
                    onChange={(e) => handleFilterChange('language', e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/30"
                  >
                    {languageOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>

                {/* Đánh giá tối thiểu */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Đánh giá tối thiểu</label>
                  <select
                    value={minRating}
                    onChange={(e) => handleFilterChange('min_rating', e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/30"
                  >
                    <option value="">Tất cả</option>
                    <option value="4">4+ sao</option>
                    <option value="3">3+ sao</option>
                    <option value="2">2+ sao</option>
                    <option value="1">1+ sao</option>
                  </select>
                </div>
              </div>

              {/* Khoảng giá */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Khoảng giá (VNĐ)</label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    placeholder="Từ"
                    value={minPrice}
                    onChange={(e) => setSearchParams(prev => {
                      const next = new URLSearchParams(prev);
                      if (e.target.value) next.set('min_price', e.target.value);
                      else next.delete('min_price');
                      return next;
                    })}
                    onBlur={() => setPage(1)}
                    min="0"
                    className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/30"
                  />
                  <span className="text-gray-400">—</span>
                  <input
                    type="number"
                    placeholder="Đến"
                    value={maxPrice}
                    onChange={(e) => setSearchParams(prev => {
                      const next = new URLSearchParams(prev);
                      if (e.target.value) next.set('max_price', e.target.value);
                      else next.delete('max_price');
                      return next;
                    })}
                    onBlur={() => setPage(1)}
                    min="0"
                    className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/30"
                  />
                  <button
                    onClick={() => setPage(1)}
                    className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm hover:bg-primary-700"
                  >
                    Áp dụng
                  </button>
                </div>
              </div>

              {/* Hiển thị filters đang active */}
              {hasActiveFilters && (
                <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-100">
                  {sortFromUrl !== 'newest' && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-primary-50 text-primary-700 rounded-full text-sm">
                      {sortOptions.find(o => o.value === sortFromUrl)?.label}
                      <button onClick={() => handleFilterChange('sort', '')} className="ml-1 hover:text-primary-900">×</button>
                    </span>
                  )}
                  {level && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-primary-50 text-primary-700 rounded-full text-sm">
                      {levelOptions.find(o => o.value === level)?.label}
                      <button onClick={() => handleFilterChange('level', '')} className="ml-1 hover:text-primary-900">×</button>
                    </span>
                  )}
                  {language && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-primary-50 text-primary-700 rounded-full text-sm">
                      {languageOptions.find(o => o.value === language)?.label}
                      <button onClick={() => handleFilterChange('language', '')} className="ml-1 hover:text-primary-900">×</button>
                    </span>
                  )}
                  {minRating && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-primary-50 text-primary-700 rounded-full text-sm">
                      {minRating}+ sao
                      <button onClick={() => handleFilterChange('min_rating', '')} className="ml-1 hover:text-primary-900">×</button>
                    </span>
                  )}
                  {(minPrice || maxPrice) && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-primary-50 text-primary-700 rounded-full text-sm">
                      Giá: {minPrice || '0'} - {maxPrice || '∞'}
                      <button onClick={() => { handleFilterChange('min_price', ''); handleFilterChange('max_price', ''); }} className="ml-1 hover:text-primary-900">×</button>
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-12 py-12">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl overflow-hidden animate-pulse border border-gray-100">
                <div className="aspect-video bg-gray-200" />
                <div className="p-5 space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                  <div className="h-3 bg-gray-200 rounded w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : courses.length === 0 ? (
          <p className="text-center text-gray-600 py-16">Chưa có khóa học phù hợp hoặc API chưa trả dữ liệu.</p>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses.map((course) => (
                <CourseCard key={course._id} course={course} />
              ))}
            </div>
            {pages > 1 && (
              <div className="flex justify-center gap-2 mt-12">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="px-4 py-2 rounded-lg border border-gray-300 disabled:opacity-50 hover:bg-gray-50"
                >
                  Trước
                </button>
                <span className="px-4 py-2 text-gray-700">
                  {page} / {pages}
                </span>
                <button
                  type="button"
                  disabled={page >= pages}
                  onClick={() => setPage((p) => Math.min(pages, p + 1))}
                  className="px-4 py-2 rounded-lg border border-gray-300 disabled:opacity-50 hover:bg-gray-50"
                >
                  Sau
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </PageLayout>
  );
}
