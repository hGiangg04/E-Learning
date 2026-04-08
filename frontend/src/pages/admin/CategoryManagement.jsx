import { useState, useEffect } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import DataTable from '../../components/admin/DataTable';
import Modal from '../../components/admin/Modal';

const PlusIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
  </svg>
);

export default function CategoryManagement() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    icon: '',
    color: '#3b82f6',
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      // Mock data
      setCategories([
        { _id: '1', name: 'Programming', description: 'Lập trình và phát triển phần mềm', icon: '💻', color: '#3b82f6', courseCount: 15, createdAt: '2024-01-01' },
        { _id: '2', name: 'Data Science', description: 'Khoa học dữ liệu và Machine Learning', icon: '📊', color: '#10b981', courseCount: 12, createdAt: '2024-01-02' },
        { _id: '3', name: 'Web Development', description: 'Phát triển web front-end và back-end', icon: '🌐', color: '#8b5cf6', courseCount: 18, createdAt: '2024-01-03' },
        { _id: '4', name: 'DevOps', description: 'CI/CD, Container và Cloud', icon: '🚀', color: '#f59e0b', courseCount: 8, createdAt: '2024-01-04' },
        { _id: '5', name: 'Mobile Development', description: 'Phát triển ứng dụng di động', icon: '📱', color: '#ef4444', courseCount: 10, createdAt: '2024-01-05' },
        { _id: '6', name: 'Database', description: 'Cơ sở dữ liệu và SQL', icon: '🗄️', color: '#06b6d4', courseCount: 6, createdAt: '2024-01-06' },
      ]);
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      key: 'name',
      label: 'Tên danh mục',
      render: (value, item) => (
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center text-xl"
            style={{ backgroundColor: `${item.color}20` }}
          >
            {item.icon}
          </div>
          <div>
            <span className="font-medium text-gray-900">{value}</span>
            <p className="text-xs text-gray-500">{item.description}</p>
          </div>
        </div>
      ),
    },
    { key: 'courseCount', label: 'Số khóa học' },
    { key: 'createdAt', label: 'Ngày tạo' },
  ];

  const handleEdit = (category) => {
    setEditingCategory(category);
    setFormData(category);
    setIsModalOpen(true);
  };

  const handleDelete = (category) => {
    if (window.confirm(`Bạn có chắc muốn xóa danh mục "${category.name}"?`)) {
      setCategories(categories.filter((c) => c._id !== category._id));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingCategory) {
      setCategories(categories.map((c) => (c._id === editingCategory._id ? { ...c, ...formData } : c)));
    } else {
      setCategories([{ ...formData, _id: Date.now().toString(), courseCount: 0, createdAt: new Date().toISOString().split('T')[0] }, ...categories]);
    }
    setIsModalOpen(false);
    setEditingCategory(null);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Quản lý danh mục</h1>
            <p className="text-gray-500">Quản lý danh mục khóa học trong hệ thống</p>
          </div>
          <button
            onClick={() => {
              setEditingCategory(null);
              setFormData({ name: '', description: '', icon: '', color: '#3b82f6' });
              setIsModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            <PlusIcon />
            Thêm danh mục
          </button>
        </div>

        <DataTable
          title="Danh sách danh mục"
          columns={columns}
          data={categories}
          searchKey="name"
          searchPlaceholder="Tìm theo tên..."
          onEdit={handleEdit}
          onDelete={handleDelete}
          loading={loading}
        />

        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={editingCategory ? 'Chỉnh sửa danh mục' : 'Thêm danh mục mới'}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Icon</label>
                <input
                  type="text"
                  value={formData.icon}
                  onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                  placeholder="💻"
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-center text-2xl"
                  required
                />
              </div>
              <div className="col-span-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">Màu sắc</label>
                <input
                  type="color"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  className="w-full h-10 border border-gray-200 rounded-lg cursor-pointer"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tên danh mục</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              />
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Hủy
              </button>
              <button type="submit" className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">
                {editingCategory ? 'Lưu thay đổi' : 'Thêm mới'}
              </button>
            </div>
          </form>
        </Modal>
      </div>
    </AdminLayout>
  );
}
