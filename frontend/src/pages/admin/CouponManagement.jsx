import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import AdminLayout from '../../components/admin/AdminLayout';
import DataTable from '../../components/admin/DataTable';
import Modal from '../../components/admin/Modal';
import { couponApi } from '../../api/couponService';
import { adminApi } from '../../api/adminApi';

const PlusIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
  </svg>
);

const TagIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
  </svg>
);

export default function CouponManagement() {
  const [coupons, setCoupons] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 });
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState(null);
  const [formData, setFormData] = useState({
    code: '',
    course_id: '',
    discount_percent: '',
    usage_limit: 1,
    start_date: '',
    end_date: '',
    is_active: true,
  });

  const fetchCoupons = async (page = 1, searchTerm = search) => {
    try {
      setLoading(true);
      const params = { page, limit: pagination.limit };
      if (searchTerm) params.search = searchTerm;

      const response = await couponApi.getCoupons(params);
      if (response.data.success) {
        setCoupons(response.data.data);
        setPagination(response.data.pagination);
      }
    } catch (error) {
      console.error('Error fetching coupons:', error);
      toast.error('Không thể tải danh sách coupon');
    } finally {
      setLoading(false);
    }
  };

  const fetchCourses = async () => {
    try {
      const response = await adminApi.getCourses({ limit: 500 });
      if (response.data.success) {
        setCourses(response.data.data.courses || []);
      }
    } catch (error) {
      console.error('Error fetching courses:', error);
    }
  };

  useEffect(() => {
    fetchCoupons();
    fetchCourses();
  }, []);

  const getCourseTitle = (courseId) => {
    if (!courseId) return '-';
    if (typeof courseId === 'object') return courseId.title || '-';
    const course = courses.find((c) => c._id === courseId);
    return course ? course.title : courseId;
  };

  const formatDate = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const isCouponExpired = (coupon) => {
    if (!coupon.end_date) return false;
    return new Date(coupon.end_date) < new Date();
  };

  const isCouponActive = (coupon) => {
    const now = new Date();
    const started = !coupon.start_date || new Date(coupon.start_date) <= now;
    const notExpired = !coupon.end_date || new Date(coupon.end_date) >= now;
    const hasUsage = coupon.used_count < coupon.usage_limit;
    return coupon.is_active && started && notExpired && hasUsage;
  };

  const columns = [
    {
      key: 'code',
      label: 'Mã Coupon',
      render: (value, item) => (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center">
            <TagIcon />
          </div>
          <span className="font-mono font-bold text-primary-700 bg-primary-50 px-2 py-1 rounded">
            {value}
          </span>
        </div>
      ),
    },
    {
      key: 'course_id',
      label: 'Khóa học',
      render: (value) => (
        <span className="text-sm text-gray-700 max-w-[200px] truncate block" title={getCourseTitle(value)}>
          {getCourseTitle(value)}
        </span>
      ),
    },
    {
      key: 'discount_percent',
      label: 'Giảm giá',
      render: (value) => (
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-green-100 text-green-800">
          -{value}%
        </span>
      ),
    },
    {
      key: 'usage',
      label: 'Số lượt',
      render: (_, item) => (
        <div className="text-sm">
          <span className="font-medium text-gray-900">{item.used_count || 0}</span>
          <span className="text-gray-400"> / </span>
          <span className="text-gray-600">{item.usage_limit}</span>
        </div>
      ),
    },
    {
      key: 'date_range',
      label: 'Thời hạn',
      render: (_, item) => (
        <div className="text-sm text-gray-600">
          <div>{formatDate(item.start_date)}</div>
          <div className="text-xs text-gray-400">đến {formatDate(item.end_date)}</div>
        </div>
      ),
    },
    {
      key: 'is_active',
      label: 'Trạng thái',
      render: (_, item) => {
        const active = isCouponActive(item);
        const expired = isCouponExpired(item);
        const exhausted = (item.used_count || 0) >= (item.usage_limit || 1);

        let label = 'Hoạt động';
        let color = 'bg-green-100 text-green-800';

        if (expired) {
          label = 'Đã hết hạn';
          color = 'bg-gray-100 text-gray-800';
        } else if (!item.is_active) {
          label = 'Bị vô hiệu';
          color = 'bg-red-100 text-red-800';
        } else if (exhausted) {
          label = 'Hết lượt';
          color = 'bg-yellow-100 text-yellow-800';
        } else if (!active) {
          label = 'Chưa có hiệu lực';
          color = 'bg-blue-100 text-blue-800';
        }

        return (
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${color}`}>
            {label}
          </span>
        );
      },
    },
    {
      key: 'created_at',
      label: 'Ngày tạo',
      render: (value) => (
        <span className="text-sm text-gray-500">{formatDate(value)}</span>
      ),
    },
  ];

  const handleEdit = (coupon) => {
    setEditingCoupon(coupon);
    setFormData({
      code: coupon.code || '',
      course_id: typeof coupon.course_id === 'object' ? coupon.course_id._id : coupon.course_id || '',
      discount_percent: coupon.discount_percent || '',
      usage_limit: coupon.usage_limit || 1,
      start_date: coupon.start_date ? new Date(coupon.start_date).toISOString().slice(0, 16) : '',
      end_date: coupon.end_date ? new Date(coupon.end_date).toISOString().slice(0, 16) : '',
      is_active: coupon.is_active !== false,
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (coupon) => {
    if (window.confirm(`Bạn có chắc muốn xóa coupon "${coupon.code}"?`)) {
      try {
        const response = await couponApi.deleteCoupon(coupon._id);
        if (response.data.success) {
          toast.success('Xóa coupon thành công');
          fetchCoupons();
        }
      } catch (error) {
        toast.error(error.response?.data?.message || 'Không thể xóa coupon');
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.code.trim()) {
      toast.error('Mã coupon không được để trống');
      return;
    }
    if (!formData.course_id) {
      toast.error('Vui lòng chọn khóa học');
      return;
    }
    if (!formData.discount_percent || formData.discount_percent < 1 || formData.discount_percent > 100) {
      toast.error('Phần trăm giảm giá phải từ 1 đến 100');
      return;
    }
    if (formData.end_date && formData.start_date && new Date(formData.end_date) <= new Date(formData.start_date)) {
      toast.error('Ngày kết thúc phải sau ngày bắt đầu');
      return;
    }

    try {
      const payload = {
        code: formData.code.trim().toUpperCase(),
        course_id: formData.course_id,
        discount_percent: Number(formData.discount_percent),
        usage_limit: Number(formData.usage_limit) || 1,
        start_date: formData.start_date ? new Date(formData.start_date).toISOString() : new Date().toISOString(),
        end_date: formData.end_date ? new Date(formData.end_date).toISOString() : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        is_active: formData.is_active,
      };

      if (editingCoupon) {
        const response = await couponApi.updateCoupon(editingCoupon._id, payload);
        if (response.data.success) {
          toast.success('Cập nhật coupon thành công');
          setIsModalOpen(false);
          fetchCoupons();
        }
      } else {
        const response = await couponApi.createCoupon(payload);
        if (response.data.success) {
          toast.success('Tạo coupon thành công');
          setIsModalOpen(false);
          fetchCoupons();
        }
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra');
    }
  };

  const handlePageChange = (page) => {
    fetchCoupons(page, search);
  };

  const handleSearch = (value) => {
    setSearch(value);
    fetchCoupons(1, value);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Quản lý Coupon</h1>
            <p className="text-gray-500">Tạo và quản lý mã giảm giá cho khóa học</p>
          </div>
          <button
            onClick={() => {
              setEditingCoupon(null);
              setFormData({
                code: '',
                course_id: '',
                discount_percent: '',
                usage_limit: 1,
                start_date: '',
                end_date: '',
                is_active: true,
              });
              setIsModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            <PlusIcon />
            Tạo Coupon
          </button>
        </div>

        <DataTable
          title="Danh sách Coupon"
          columns={columns}
          data={coupons}
          searchKey="code"
          searchPlaceholder="Tìm theo mã coupon..."
          onEdit={handleEdit}
          onDelete={handleDelete}
          onSearch={handleSearch}
          onPageChange={handlePageChange}
          loading={loading}
          actions={true}
          pagination={true}
          pageSize={pagination.limit}
          currentPage={pagination.page}
          totalPages={pagination.totalPages}
        />

        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={editingCoupon ? 'Chỉnh sửa Coupon' : 'Tạo Coupon mới'}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mã Coupon</label>
              <input
                type="text"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                placeholder="VD: SUMMER2026"
                maxLength={20}
                minLength={4}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 font-mono uppercase"
                required
              />
              <p className="text-xs text-gray-500 mt-1">4-20 ký tự, không phân biệt hoa thường</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Khóa học</label>
              <select
                value={formData.course_id}
                onChange={(e) => setFormData({ ...formData, course_id: e.target.value })}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              >
                <option value="">-- Chọn khóa học --</option>
                {courses.map((course) => (
                  <option key={course._id} value={course._id}>
                    {course.title}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">% Giảm giá</label>
                <div className="relative">
                  <input
                    type="number"
                    value={formData.discount_percent}
                    onChange={(e) => setFormData({ ...formData, discount_percent: e.target.value })}
                    placeholder="10"
                    min={1}
                    max={100}
                    className="w-full px-4 py-2 pr-10 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    required
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">%</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Số lượt sử dụng</label>
                <input
                  type="number"
                  value={formData.usage_limit}
                  onChange={(e) => setFormData({ ...formData, usage_limit: e.target.value })}
                  placeholder="1"
                  min={1}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ngày bắt đầu</label>
                <input
                  type="datetime-local"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ngày kết thúc</label>
                <input
                  type="datetime-local"
                  value={formData.end_date}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>

            <div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                />
                <span className="text-sm font-medium text-gray-700">Kích hoạt ngay</span>
              </label>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                {editingCoupon ? 'Lưu thay đổi' : 'Tạo Coupon'}
              </button>
            </div>
          </form>
        </Modal>
      </div>
    </AdminLayout>
  );
}
