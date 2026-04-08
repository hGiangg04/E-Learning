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

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 0 });
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'student',
  });

  const fetchUsers = async (page = 1, searchTerm = search) => {
    try {
      setLoading(true);
      const params = { page, limit: pagination.limit };
      if (searchTerm) params.search = searchTerm;
      
      const response = await adminApi.getUsers(params);
      if (response.data.success) {
        setUsers(response.data.data.users);
        setPagination(response.data.data.pagination);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Không thể tải danh sách người dùng');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleSearch = (value) => {
    setSearch(value);
    fetchUsers(1, value);
  };

  const handlePageChange = (page) => {
    fetchUsers(page, search);
  };

  const columns = [
    {
      key: 'name',
      label: 'Tên',
      render: (value, item) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-medium">
            {value?.charAt(0)?.toUpperCase() || '?'}
          </div>
          <span className="font-medium text-gray-900">{value}</span>
        </div>
      ),
    },
    { key: 'email', label: 'Email' },
    {
      key: 'role',
      label: 'Vai trò',
      badge: true,
      render: (value) => {
        const roleLabels = { admin: 'Admin', instructor: 'Giáo viên', student: 'Học viên' };
        const roleColors = {
          admin: 'bg-red-100 text-red-800',
          instructor: 'bg-purple-100 text-purple-800',
          student: 'bg-blue-100 text-blue-800',
        };
        return (
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${roleColors[value] || 'bg-gray-100 text-gray-800'}`}>
            {roleLabels[value] || value}
          </span>
        );
      },
    },
    {
      key: 'is_active',
      label: 'Trạng thái',
      badge: true,
      render: (value) => {
        const statusLabels = { 1: 'Hoạt động', 0: 'Khóa' };
        const statusColors = { 1: 'bg-green-100 text-green-800', 0: 'bg-gray-100 text-gray-800' };
        return (
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusColors[value]}`}>
            {statusLabels[value]}
          </span>
        );
      },
    },
    {
      key: 'created_at',
      label: 'Ngày tạo',
      render: (value) => value ? new Date(value).toLocaleDateString('vi-VN') : '-',
    },
  ];

  const handleEdit = (user) => {
    setEditingUser(user);
    setFormData({
      name: user.name || '',
      email: user.email || '',
      password: '',
      role: user.role || 'student',
    });
    setIsModalOpen(true);
  };

  const handleToggleStatus = async (user) => {
    const newStatus = user.is_active === 1 ? 0 : 1;
    try {
      const response = await adminApi.setUserStatus(user._id, newStatus);
      if (response.data.success) {
        toast.success(newStatus === 1 ? 'Đã kích hoạt tài khoản' : 'Đã khóa tài khoản');
        fetchUsers(pagination.page, search);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Không thể thay đổi trạng thái');
    }
  };

  const handleChangeRole = async (user) => {
    const newRole = user.role === 'admin' ? 'student' : 'admin';
    try {
      const response = await adminApi.setUserRole(user._id, newRole);
      if (response.data.success) {
        toast.success('Đã cập nhật vai trò');
        fetchUsers(pagination.page, search);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Không thể thay đổi vai trò');
    }
  };

  const handleDelete = async (user) => {
    if (window.confirm(`Bạn có chắc muốn xóa người dùng "${user.name}"?`)) {
      try {
        const response = await adminApi.deleteUser(user._id);
        if (response.data.success) {
          toast.success('Xóa người dùng thành công');
          fetchUsers(pagination.page, search);
        }
      } catch (error) {
        toast.error(error.response?.data?.message || 'Không thể xóa người dùng');
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingUser) {
        const response = await adminApi.updateUser(editingUser._id, formData);
        if (response.data.success) {
          toast.success('Cập nhật người dùng thành công');
          setIsModalOpen(false);
          fetchUsers(pagination.page, search);
        }
      } else {
        const response = await adminApi.createUser(formData);
        if (response.data.success) {
          toast.success('Thêm người dùng thành công');
          setIsModalOpen(false);
          fetchUsers(1, search);
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
            <h1 className="text-2xl font-bold text-gray-900">Quản lý người dùng</h1>
            <p className="text-gray-500">Quản lý tài khoản người dùng trong hệ thống</p>
          </div>
          <button
            onClick={() => {
              setEditingUser(null);
              setFormData({ name: '', email: '', password: '', role: 'student' });
              setIsModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            <PlusIcon />
            Thêm người dùng
          </button>
        </div>

        <DataTable
          title="Danh sách người dùng"
          columns={columns}
          data={users}
          searchKey="search"
          searchPlaceholder="Tìm theo tên, email..."
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
            { label: 'Đổi vai trò', onClick: handleChangeRole, color: 'purple' },
            { label: 'Khóa/Mở', onClick: handleToggleStatus, color: 'yellow' },
          ]}
        />

        <Modal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setEditingUser(null);
          }}
          title={editingUser ? 'Chỉnh sửa người dùng' : 'Thêm người dùng mới'}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tên</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              />
            </div>
            {!editingUser && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mật khẩu</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  required
                />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Vai trò</label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="student">Học viên</option>
                <option value="instructor">Giáo viên</option>
                <option value="admin">Admin</option>
              </select>
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
                {editingUser ? 'Lưu thay đổi' : 'Thêm mới'}
              </button>
            </div>
          </form>
        </Modal>
      </div>
    </AdminLayout>
  );
}
