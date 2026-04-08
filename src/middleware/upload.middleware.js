const path = require('path');
const fs = require('fs');

const UPLOAD_DIR = path.join(__dirname, '../uploads/videos');

function ensureUploadDir(req, res, next) {
    if (!fs.existsSync(UPLOAD_DIR)) {
        fs.mkdirSync(UPLOAD_DIR, { recursive: true });
    }
    next();
}

function videoUpload(req, res, next) {
    const file = req.file;
    if (!file) {
        return res.status(400).json({
            success: false,
            message: 'Vui lòng chọn file video'
        });
    }

    const allowedTypes = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime', 'video/x-msvideo'];
    if (!allowedTypes.includes(file.mimetype)) {
        if (fs.existsSync(file.path)) {
            fs.unlinkSync(file.path);
        }
        return res.status(400).json({
            success: false,
            message: 'Chỉ chấp nhận file video: mp4, webm, ogg, mov, avi'
        });
    }

    const maxSize = 500 * 1024 * 1024;
    if (file.size > maxSize) {
        if (fs.existsSync(file.path)) {
            fs.unlinkSync(file.path);
        }
        return res.status(400).json({
            success: false,
            message: 'File video tối đa 500MB'
        });
    }

    req.videoFile = {
        filename: file.filename,
        originalName: file.originalname,
        path: file.path,
        url: `/uploads/videos/${file.filename}`,
        size: file.size
    };
    next();
}

function deleteVideoFile(filepath) {
    if (!filepath) return;
    if (filepath.startsWith('/uploads/videos/')) {
        const fullPath = path.join(__dirname, '..', filepath);
        if (fs.existsSync(fullPath)) {
            fs.unlinkSync(fullPath);
        }
    } else if (!filepath.startsWith('http')) {
        const fullPath = path.join(UPLOAD_DIR, path.basename(filepath));
        if (fs.existsSync(fullPath)) {
            fs.unlinkSync(fullPath);
        }
    }
}

module.exports = {
    ensureUploadDir,
    videoUpload,
    deleteVideoFile,
    UPLOAD_DIR
};
