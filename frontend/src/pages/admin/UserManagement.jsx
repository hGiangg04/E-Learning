import { useState, useEffect } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import DataTable from '../../components/admin/DataTable';
import Modal from '../../components/admin/Modal';

const PlusIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
  </svg>
);

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'user',
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      // Mock data - will connect to real API
      setUsers([
        { _id: '1', name: 'Nguyễn Văn A', email: 'vana@gmail.com', role: 'user', status: 'active', createdAt: '2024-01-15' },
        { _id: '2', name: 'Trần Thị B', email: 'thib@gmail.com', role: 'instructor', status: 'active', createdAt: '2024-01-14' },
        { _id: '3', name: 'Lê Văn C', email: 'vanc@gmail.com', role: 'user', status: 'inactive', createdAt: '2024-01-13' },
        { _id: '4', name: 'Phạm Thị D', email: 'thid@gmail.com', role: 'instructor', status: 'active', createdAt: '2024-01-12' },
        { _id: '5', name: 'Hoàng Văn E', email: 'vane@gmail.com', role: 'user', status: 'active', createdAt: '2024-01-11' },
        { _id: '6', name: 'Đặng Thị F', email: 'thif@gmail.com', role: 'user', status: 'pending', createdAt: '2024-01-10' },
        { _id: '7', name: 'Bùi Văn G', email: 'vang@gmail.com', role: 'instructor', status: 'active', createdAt: '2024-01-09' },
        { _id: '8', name: 'Ngô Thị H', email: 'thih@gmail.com', role: 'user', status: 'active', createdAt: '2024-01-08' },
      ]);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      key: 'name',
      label: 'Tên',
      render: (value, item) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-medium">
            {value.charAt(0)}
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
        const roleLabels = { admin: 'Admin', instructor: 'Giáo viên', user: 'Học viên' };
        const roleColors = {
          admin: 'bg-red-100 text-red-800',
          instructor: 'bg-purple-100 text-purple-800',
          user: 'bg-blue-100 text-blue-800',
        };
        return (
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${roleColors[value]}`}>
            {roleLabels[value]}
          </span>
        );
      },
    },
    {
      key: 'status',
      label: 'Trạng thái',
      badge: true,
      render: (value) => {
        const statusLabels = { active: 'Hoạt động', inactive: 'Khóa', pending: 'Chờ duyệt' };
        const statusColors = {
          active: 'bg-green-100 text-green-800',
          inactive: 'bg-gray-100 text-gray-800',
          pending: 'bg-yellow-100 text-yellow-800',
        };
        return (
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusColors[value]}`}>
            {statusLabels[value]}
          </span>
        );
      },
    },
    { key: 'createdAt', label: 'Ngày tạo' },
  ];

  const handleEdit = (user) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      password: '',
      role: user.role,
    });
    setIsModalOpen(true);
  };

  const handleDelete = (user) => {
    if (window.confirm(`Bạn có chắc muốn xóa người dùng "${user.name}"?`)) {
      setUsers(users.filter((u) => u._id !== user._id));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingUser) {
      setUsers(users.map((u) => (u._id === editingUser._id ? { ...u, ...formData } : u)));
    } else {
      setUsers([{ ...formData, _id: Date.now().toString(), status: 'active', createdAt: new Date().toISOString().split('T')[0] }, ...users]);
    }
    setIsModalOpen(false);
    setEditingUser(null);
    setFormData({ name: '', email: '', password: '', role: 'user' });
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
              setFormData({ name: '', email: '', password: '', role: 'user' });
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
          searchKey="name"
          searchPlaceholder="Tìm theo tên..."
          onEdit={handleEdit}
          onDelete={handleDelete}
          loading={loading}
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
                  required={!editingUser}
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
                <option value="user">Học viên</option>
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
