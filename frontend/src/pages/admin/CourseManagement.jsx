import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import AdminLayout from '../../components/admin/AdminLayout';
import DataTable from '../../components/admin/DataTable';
import Modal from '../../components/admin/Modal';
import { adminApi } from '../../api/adminApi';

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
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 0 });
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    category_id: '',
    level: 'beginner',
    thumbnail: '',
    is_published: 0,
  });

  const fetchCourses = async (page = 1, searchTerm = search) => {
    try {
      setLoading(true);
      const params = { page, limit: pagination.limit };
      if (searchTerm) params.search = searchTerm;

      const response = await adminApi.getCourses(params);
      if (response.data.success) {
        setCourses(response.data.data.courses);
        setPagination(response.data.data.pagination);
      }
    } catch (error) {
      console.error('Error fetching courses:', error);
      toast.error('Không thể tải danh sách khóa học');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const handleSearch = (value) => {
    setSearch(value);
    fetchCourses(1, value);
  };

  const handlePageChange = (page) => {
    fetchCourses(page, search);
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0,
    }).format(value || 0);
  };

  const columns = [
    {
      key: 'title',
      label: 'Tên khóa học',
      render: (value, item) => (
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-lg bg-gray-200 flex items-center justify-center overflow-hidden">
            {item.thumbnail ? (
              <img src={item.thumbnail} alt={value} className="w-full h-full object-cover" />
            ) : (
              <span className="text-xl">📚</span>
            )}
          </div>
          <span className="font-medium text-gray-900">{value}</span>
        </div>
      ),
    },
    {
      key: 'category_id',
      label: 'Danh mục',
      render: (value) => <span className="text-gray-700">{value?.name || '-'}</span>,
    },
    {
      key: 'instructor_id',
      label: 'Giáo viên',
      render: (value) => <span className="text-gray-700">{value?.name || '-'}</span>,
    },
    {
      key: 'price',
      label: 'Giá',
      render: (value) => <span className="font-medium text-gray-900">{formatCurrency(value)}</span>,
    },
    {
      key: 'student_count',
      label: 'Học viên',
      render: (value) => <span>{value || 0}</span>,
    },
    {
      key: 'is_published',
      label: 'Trạng thái',
      badge: true,
      render: (value) => {
        const statusLabels = { 1: 'Đã publish', 0: 'Nháp' };
        const statusColors = { 1: 'bg-green-100 text-green-800', 0: 'bg-yellow-100 text-yellow-800' };
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
    setFormData({
      title: course.title || '',
      description: course.description || '',
      price: course.price || '',
      category_id: course.category_id?._id || '',
      level: course.level || 'beginner',
      thumbnail: course.thumbnail || '',
      is_published: course.is_published || 0,
    });
    setIsModalOpen(true);
  };

  const handlePublish = async (course) => {
    try {
      const response = await adminApi.publishCourse(course._id);
      if (response.data.success) {
        toast.success('Đã publish khóa học');
        fetchCourses(pagination.page, search);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Không thể publish khóa học');
    }
  };

  const handleUnpublish = async (course) => {
    try {
      const response = await adminApi.unpublishCourse(course._id);
      if (response.data.success) {
        toast.success('Đã hủy publish khóa học');
        fetchCourses(pagination.page, search);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Không thể hủy publish');
    }
  };

  const handleDelete = async (course) => {
    if (window.confirm(`Bạn có chắc muốn xóa khóa học "${course.title}"?`)) {
      try {
        const response = await adminApi.deleteCourse(course._id);
        if (response.data.success) {
          toast.success('Xóa khóa học thành công');
          fetchCourses(pagination.page, search);
        }
      } catch (error) {
        toast.error(error.response?.data?.message || 'Không thể xóa khóa học');
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        price: Number(formData.price) || 0,
      };

      if (editingCourse) {
        const response = await adminApi.updateCourse(editingCourse._id, payload);
        if (response.data.success) {
          toast.success('Cập nhật khóa học thành công');
          setIsModalOpen(false);
          fetchCourses(pagination.page, search);
        }
      } else {
        const response = await adminApi.createCourse(payload);
        if (response.data.success) {
          toast.success('Tạo khóa học thành công');
          setIsModalOpen(false);
          fetchCourses(1, search);
        }
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra');
    }
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
              setFormData({
                title: '',
                description: '',
                price: '',
                category_id: '',
                level: 'beginner',
                thumbnail: '',
                is_published: 0,
              });
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
          searchKey="search"
          searchPlaceholder="Tìm theo tên..."
          onEdit={handleEdit}
          onDelete={handleDelete}
          loading={loading}
          pagination={true}
          pageSize={pagination.limit}
          totalPages={pagination.pages}
          currentPage={pagination.page}
          onPageChange={handlePageChange}
          onSearch={handleSearch}
          customActions={[
            { label: 'Publish', onClick: handlePublish, color: 'green' },
            { label: 'Unpublish', onClick: handleUnpublish, color: 'yellow' },
          ]}
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Cấp độ</label>
                <select
                  value={formData.level}
                  onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="beginner">Người mới</option>
                  <option value="intermediate">Trung cấp</option>
                  <option value="advanced">Nâng cao</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Thumbnail URL</label>
              <input
                type="text"
                value={formData.thumbnail}
                onChange={(e) => setFormData({ ...formData, thumbnail: e.target.value })}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="https://..."
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
