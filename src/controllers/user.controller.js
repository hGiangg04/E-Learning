const User = require('../models/user.model');

const userController = {
    // GET /api/users — chỉ admin
    getAllUsers: async (req, res) => {
        try {
            const { page = 1, limit = 10, role, search, is_active } = req.query;

            const query = {};
            if (role) query.role = role;
            if (is_active !== undefined) query.is_active = Number(is_active);
            if (search) {
                query.$or = [
                    { name: { $regex: search, $options: 'i' } },
                    { email: { $regex: search, $options: 'i' } }
                ];
            }

            const users = await User.find(query)
                .select('-password')
                .skip((page - 1) * limit)
                .limit(parseInt(limit))
                .sort({ created_at: -1 });

            const total = await User.countDocuments(query);

            res.json({
                success: true,
                data: {
                    users,
                    pagination: {
                        page: parseInt(page),
                        limit: parseInt(limit),
                        total,
                        pages: Math.ceil(total / limit)
                    }
                }
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    },

    // GET /api/users/:id — admin hoặc chính user đó
    getUserById: async (req, res) => {
        try {
            const isAdmin = req.user.role === 'admin';
            const isSelf = req.user._id.toString() === req.params.id;

            if (!isAdmin && !isSelf) {
                return res.status(403).json({
                    success: false,
                    message: 'Không có quyền xem thông tin người dùng này'
                });
            }

            const user = await User.findById(req.params.id).select('-password');
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'Người dùng không tồn tại'
                });
            }

            res.json({
                success: true,
                data: { user }
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    },

    // PUT /api/users/:id — admin hoặc chính user (không đổi role nếu không phải admin)
    updateUser: async (req, res) => {
        try {
            const isAdmin = req.user.role === 'admin';
            const isSelf = req.user._id.toString() === req.params.id;

            if (!isAdmin && !isSelf) {
                return res.status(403).json({
                    success: false,
                    message: 'Không có quyền cập nhật người dùng này'
                });
            }

            const { name, avatar, phone, address, bio, role } = req.body;
            const payload = { name, avatar, phone, address, bio, updated_at: Date.now() };

            if (isAdmin && role !== undefined) {
                if (!['admin', 'student'].includes(role)) {
                    return res.status(400).json({
                        success: false,
                        message: 'role phải là admin hoặc student'
                    });
                }
                payload.role = role;
            }

            const user = await User.findByIdAndUpdate(req.params.id, payload, {
                new: true,
                runValidators: true
            }).select('-password');

            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'Người dùng không tồn tại'
                });
            }

            res.json({
                success: true,
                message: 'Cập nhật thông tin thành công',
                data: { user }
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    },

    // PATCH /api/users/:id/status — admin: kích hoạt / khóa (is_active 1 | 0)
    setStatus: async (req, res) => {
        try {
            const { is_active } = req.body;
            if (![0, 1].includes(Number(is_active))) {
                return res.status(400).json({
                    success: false,
                    message: 'is_active phải là 0 (khóa) hoặc 1 (kích hoạt)'
                });
            }

            const user = await User.findById(req.params.id);
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'Người dùng không tồn tại'
                });
            }

            if (user._id.toString() === req.user._id.toString()) {
                return res.status(400).json({
                    success: false,
                    message: 'Không thể tự khóa tài khoản của chính mình'
                });
            }

            user.is_active = Number(is_active);
            user.updated_at = Date.now();
            await user.save();

            res.json({
                success: true,
                message: Number(is_active) === 1 ? 'Đã kích hoạt tài khoản' : 'Đã khóa tài khoản',
                data: { user: await User.findById(user._id).select('-password') }
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    },

    // PATCH /api/users/:id/role — admin: đổi vai trò
    setRole: async (req, res) => {
        try {
            const { role } = req.body;
            if (!['admin', 'student'].includes(role)) {
                return res.status(400).json({
                    success: false,
                    message: 'role phải là admin hoặc student'
                });
            }

            const user = await User.findById(req.params.id);
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'Người dùng không tồn tại'
                });
            }

            if (user._id.toString() === req.user._id.toString()) {
                return res.status(400).json({
                    success: false,
                    message: 'Không thể tự đổi vai trò của chính mình'
                });
            }

            user.role = role;
            user.updated_at = Date.now();
            await user.save();

            res.json({
                success: true,
                message: 'Đã cập nhật vai trò',
                data: { user: await User.findById(user._id).select('-password') }
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    },

    // DELETE /api/users/:id — chỉ admin
    deleteUser: async (req, res) => {
        try {
            if (req.params.id === req.user._id.toString()) {
                return res.status(400).json({
                    success: false,
                    message: 'Không thể xóa chính mình'
                });
            }

            const user = await User.findByIdAndDelete(req.params.id);
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'Người dùng không tồn tại'
                });
            }

            res.json({
                success: true,
                message: 'Xóa người dùng thành công'
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }
};

module.exports = userController;
