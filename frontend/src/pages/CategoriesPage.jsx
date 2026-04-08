import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import PageLayout from '../components/PageLayout';
import { categoryService } from '../api';

const icons = ['💻', '🎨', '📊', '📱', '🌐', '🤖', '📈', '🎵'];

export default function CategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await categoryService.getAll();
        const list = res.data?.data?.categories || [];
        setCategories(list.filter((c) => c.is_active !== 0 && c.is_active !== false));
      } catch (e) {
        console.error(e);
        setCategories([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <PageLayout>
      <div className="pt-28 pb-16 px-4 sm:px-8 lg:px-12">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Tất cả danh mục</h1>
          <p className="mt-2 text-gray-600">Chọn danh mục để xem khóa học tương ứng.</p>

          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-12">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="h-36 bg-gray-100 animate-pulse rounded-xl" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-12">
              {categories.map((cat, index) => (
                <Link
                  key={cat._id}
                  to={`/courses?category=${cat._id}`}
                  className="group bg-gray-50 hover:bg-primary-50 rounded-xl p-6 text-center border border-gray-100 transition-all hover:shadow-lg hover:-translate-y-0.5"
                >
                  <div className="text-4xl mb-3">{cat.icon || icons[index % icons.length]}</div>
                  <h2 className="font-semibold text-gray-900 group-hover:text-primary-600">{cat.name}</h2>
                  {cat.description && (
                    <p className="text-sm text-gray-500 mt-2 line-clamp-2">{cat.description}</p>
                  )}
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </PageLayout>
  );
}
