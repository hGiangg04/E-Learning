const express = require('express');
const path = require('path');
const fs = require('fs');
const upload = require('../config/upload');
const { ensureUploadDir } = require('../middleware/upload.middleware');
const { authMiddleware, contentAdminOnly } = require('../middleware/auth.middleware');

const router = express.Router();

const UPLOAD_DIR = path.join(__dirname, '../uploads/videos');

router.use(ensureUploadDir);

router.post('/video', authMiddleware, contentAdminOnly, upload.single('video'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng chọn file video'
            });
        }

        const videoUrl = `/uploads/videos/${req.file.filename}`;

        res.json({
            success: true,
            message: 'Upload video thành công',
            data: {
                video_url: videoUrl,
                filename: req.file.filename,
                original_name: req.file.originalname,
                size: req.file.size
            }
        });
    } catch (error) {
        console.error('[POST /upload/video] Lỗi:', error.message);
        res.status(500).json({
            success: false,
            message: error.message || 'Lỗi khi upload video'
        });
    }
});

router.delete('/video', authMiddleware, contentAdminOnly, (req, res) => {
    try {
        const { filepath } = req.body;
        if (!filepath) {
            return res.status(400).json({
                success: false,
                message: 'Thiếu đường dẫn file'
            });
        }

        let fullPath;
        if (filepath.startsWith('/uploads/videos/')) {
            fullPath = path.join(__dirname, '..', filepath);
        } else if (!filepath.startsWith('http')) {
            fullPath = path.join(UPLOAD_DIR, path.basename(filepath));
        } else {
            return res.status(400).json({
                success: false,
                message: 'Đường dẫn không hợp lệ'
            });
        }

        if (fs.existsSync(fullPath)) {
            fs.unlinkSync(fullPath);
            res.json({
                success: true,
                message: 'Xóa video thành công'
            });
        } else {
            res.status(404).json({
                success: false,
                message: 'File không tồn tại'
            });
        }
    } catch (error) {
        console.error('[DELETE /upload/video] Lỗi:', error.message);
        res.status(500).json({
            success: false,
            message: error.message || 'Lỗi khi xóa video'
        });
    }
});

router.get('/videos/:filename', (req, res) => {
    const { filename } = req.params;
    const filepath = path.join(UPLOAD_DIR, filename);

    if (!fs.existsSync(filepath)) {
        return res.status(404).json({
            success: false,
            message: 'File không tồn tại'
        });
    }

    const ext = path.extname(filename).toLowerCase();
    const mimeTypes = {
        '.mp4': 'video/mp4',
        '.webm': 'video/webm',
        '.ogg': 'video/ogg',
        '.mov': 'video/quicktime',
        '.avi': 'video/x-msvideo'
    };

    const contentType = mimeTypes[ext] || 'application/octet-stream';
    res.setHeader('Content-Type', contentType);
    res.setHeader('Accept-Ranges', 'bytes');
    res.sendFile(filepath);
});

module.exports = router;
