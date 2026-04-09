const mongoose = require('mongoose');
const Comment = require('../models/comment.model');

const commentController = {
    /** POST /api/comments — gửi bình luận hoặc trả lời */
    create: async (req, res) => {
        try {
            const { target_type, target_id, content, parent_id } = req.body;

            if (!target_type || !['course', 'lesson'].includes(target_type)) {
                return res.status(400).json({ success: false, message: 'target_type phải là course hoặc lesson' });
            }
            if (!target_id || !mongoose.Types.ObjectId.isValid(target_id)) {
                return res.status(400).json({ success: false, message: 'target_id không hợp lệ' });
            }
            if (!content || String(content).trim().length === 0) {
                return res.status(400).json({ success: false, message: 'Nội dung bình luận không được để trống' });
            }
            if (content.trim().length > 2000) {
                return res.status(400).json({ success: false, message: 'Bình luận tối đa 2000 ký tự' });
            }

            const comment = await Comment.create({
                user_id: req.user._id,
                target_type,
                target_id,
                content: content.trim(),
                parent_id: parent_id && mongoose.Types.ObjectId.isValid(parent_id) ? parent_id : null
            });

            const populated = await Comment.findById(comment._id).populate('user_id', 'name avatar');

            res.status(201).json({
                success: true,
                message: 'Đã gửi bình luận',
                data: { comment: populated }
            });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    },

    /** GET /api/comments — lấy bình luận: ?target_type=course&target_id=...&page=1&limit=10 */
    getComments: async (req, res) => {
        try {
            const { target_type, target_id, page = 1, limit = 20 } = req.query;

            if (!target_type || !['course', 'lesson'].includes(target_type)) {
                return res.status(400).json({ success: false, message: 'target_type không hợp lệ' });
            }
            if (!target_id || !mongoose.Types.ObjectId.isValid(target_id)) {
                return res.status(400).json({ success: false, message: 'target_id không hợp lệ' });
            }

            const skip = (parseInt(page) - 1) * parseInt(limit);

            // Lấy top-level comments
            const [rootComments, total] = await Promise.all([
                Comment.find({
                    target_type,
                    target_id: new mongoose.Types.ObjectId(target_id),
                    parent_id: null,
                    is_active: 1
                })
                    .populate('user_id', 'name avatar')
                    .sort({ created_at: -1 })
                    .skip(skip)
                    .limit(parseInt(limit)),
                Comment.countDocuments({
                    target_type,
                    target_id: new mongoose.Types.ObjectId(target_id),
                    parent_id: null,
                    is_active: 1
                })
            ]);

            // Lấy replies cho các comment này
            const rootIds = rootComments.map(c => c._id);
            const replies = await Comment.find({
                parent_id: { $in: rootIds },
                is_active: 1
            })
                .populate('user_id', 'name avatar')
                .sort({ created_at: 1 });

            // Nhóm replies theo parent
            const replyMap = {};
            for (const r of replies) {
                const pid = String(r.parent_id);
                if (!replyMap[pid]) replyMap[pid] = [];
                replyMap[pid].push(r);
            }

            const comments = rootComments.map(c => ({
                ...c.toObject(),
                replies: replyMap[String(c._id)] || []
            }));

            res.json({
                success: true,
                data: {
                    comments,
                    pagination: {
                        page: parseInt(page),
                        limit: parseInt(limit),
                        total,
                        pages: Math.ceil(total / parseInt(limit))
                    }
                }
            });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    },

    /** DELETE /api/comments/:id — xóa bình luận của mình */
    deleteComment: async (req, res) => {
        try {
            const comment = await Comment.findOne({
                _id: req.params.id,
                user_id: req.user._id
            });
            if (!comment) {
                return res.status(404).json({ success: false, message: 'Không tìm thấy bình luận' });
            }

            // Xóa luôn replies của comment này (nếu là top-level)
            if (!comment.parent_id) {
                await Comment.deleteMany({ parent_id: comment._id });
            }
            await comment.deleteOne();

            res.json({ success: true, message: 'Đã xóa bình luận' });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
};

module.exports = commentController;
