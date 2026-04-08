import { useState, useEffect } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import DataTable from '../../components/admin/DataTable';
import Modal from '../../components/admin/Modal';

const PlusIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
  </svg>
);

const StarIcon = () => (
  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
  </svg>
);

export default function CourseManagement() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    category: '',
    instructor: '',
    thumbnail: '',
    status: 'pending',
  });

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      // Mock data - will connect to real API
      setCourses([
        { _id: '1', title: 'React cơ bản', description: 'Học React từ đầu', price: 499000, category: 'Programming', instructor: 'Nguyễn Văn A', students: 120, rating: 4.8, status: 'approved' },
        { _id: '2', title: 'Node.js Advanced', description: 'Node.js nâng cao', price: 799000, category: 'Backend', instructor: 'Trần Thị B', students: 85, rating: 4.6, status: 'approved' },
        { _id: '3', title: 'Python for Data Science', description: 'Python cho khoa học dữ liệu', price: 699000, category: 'Data Science', instructor: 'Lê Văn C', students: 200, rating: 4.9, status: 'pending' },
        { _id: '4', title: 'Docker & Kubernetes', description: 'Container orchestration', price: 599000, category: 'DevOps', instructor: 'Phạm Thị D', students: 65, rating: 4.7, status: 'approved' },
        { _id: '5', title: 'TypeScript Masterclass', description: 'TypeScript toàn tập', price: 549000, category: 'Programming', instructor: 'Hoàng Văn E', students: 95, rating: 4.5, status: 'pending' },
        { _id: '6', title: 'MongoDB Fundamentals', description: 'Cơ sở dữ liệu MongoDB', price: 449000, category: 'Database', instructor: 'Đặng Thị F', students: 50, rating: 4.4, status: 'rejected' },
      ]);
    } catch (error) {
      console.error('Error fetching courses:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const columns = [
    { key: 'title', label: 'Tên khóa học' },
    { key: 'category', label: 'Danh mục' },
    { key: 'instructor', label: 'Giáo viên' },
    {
      key: 'price',
      label: 'Giá',
      render: (value) => <span className="font-medium text-gray-900">{formatCurrency(value)}</span>,
    },
    { key: 'students', label: 'Học viên' },
    {
      key: 'rating',
      label: 'Đánh giá',
      render: (value) => (
        <div className="flex items-center gap-1 text-yellow-500">
          <StarIcon />
          <span className="text-gray-900">{value}</span>
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Trạng thái',
      badge: true,
      render: (value) => {
        const statusLabels = { approved: 'Đã duyệt', pending: 'Chờ duyệt', rejected: 'Từ chối' };
        const statusColors = {
          approved: 'bg-green-100 text-green-800',
          pending: 'bg-yellow-100 text-yellow-800',
          rejected: 'bg-red-100 text-red-800',
        };
        return (
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusColors[value]}`}>
            {statusLabels[value]}
          </span>
        );
      },
    },
  ];

  const handleEdit = (course) => {
    setEditingCourse(course);
    setFormData(course);
    setIsModalOpen(true);
  };

  const handleDelete = (course) => {
    if (window.confirm(`Bạn có chắc muốn xóa khóa học "${course.title}"?`)) {
      setCourses(courses.filter((c) => c._id !== course._id));
    }
  };

  const handleApprove = (course) => {
    setCourses(courses.map((c) => (c._id === course._id ? { ...c, status: 'approved' } : c)));
  };

  const handleReject = (course) => {
    setCourses(courses.map((c) => (c._id === course._id ? { ...c, status: 'rejected' } : c)));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingCourse) {
      setCourses(courses.map((c) => (c._id === editingCourse._id ? { ...c, ...formData } : c)));
    } else {
      setCourses([{ ...formData, _id: Date.now().toString(), students: 0, rating: 0 }, ...courses]);
    }
    setIsModalOpen(false);
    setEditingCourse(null);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Quản lý khóa học</h1>
            <p className="text-gray-500">Quản lý khóa học trong hệ thống</p>
          </div>
          <button
            onClick={() => {
              setEditingCourse(null);
              setFormData({ title: '', description: '', price: '', category: '', instructor: '', thumbnail: '', status: 'pending' });
              setIsModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            <PlusIcon />
            Thêm khóa học
          </button>
        </div>

        <DataTable
          title="Danh sách khóa học"
          columns={columns}
          data={courses}
          searchKey="title"
          searchPlaceholder="Tìm theo tên..."
          onEdit={handleEdit}
          onDelete={handleDelete}
          loading={loading}
        />

        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={editingCourse ? 'Chỉnh sửa khóa học' : 'Thêm khóa học mới'}
          size="lg"
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tên khóa học</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
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
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Giá (VND)</label>
                <input
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Danh mục</label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Giáo viên</label>
              <input
                type="text"
                value={formData.instructor}
                onChange={(e) => setFormData({ ...formData, instructor: e.target.value })}
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
                {editingCourse ? 'Lưu thay đổi' : 'Thêm mới'}
              </button>
            </div>
          </form>
        </Modal>
      </div>
    </AdminLayout>
  );
}
