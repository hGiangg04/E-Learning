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

  const [inputSearch, setInputSearch] = useState(searchFromUrl);
  const [page, setPage] = useState(1);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pages, setPages] = useState(1);

  useEffect(() => {
    setInputSearch(searchFromUrl);
  }, [searchFromUrl]);

  useEffect(() => {
    setPage(1);
  }, [categoryId, level, searchFromUrl]);

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
  }, [page, categoryId, level, searchFromUrl]);

  const handleSearch = (e) => {
    e.preventDefault();
    const next = new URLSearchParams(searchParams);
    if (inputSearch.trim()) next.set('search', inputSearch.trim());
    else next.delete('search');
    setSearchParams(next);
  };

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

          <form onSubmit={handleSearch} className="mt-8 flex flex-col sm:flex-row gap-3 max-w-xl">
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
