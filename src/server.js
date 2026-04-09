const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const dotenv = require('dotenv');
const path = require('path');
const connectDB = require('./config/database');

dotenv.config();
connectDB();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }
}));
const corsOrigins = [
    'http://localhost:3000',
    'http://localhost:5173',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:5173',
];
if (process.env.FRONTEND_URL) {
    corsOrigins.push(process.env.FRONTEND_URL);
}
app.use(cors({
    origin: (origin, cb) => {
        if (!origin || corsOrigins.includes(origin)) {
            return cb(null, true);
        }
        cb(null, false);
    },
    credentials: true,
}));
app.use(morgan('dev'));
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// Serve uploaded videos
app.use('/uploads/videos', express.static(path.join(__dirname, 'uploads/videos')));

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', message: 'API đang hoạt động', timestamp: new Date() });
});

// Import routes
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const courseRoutes = require('./routes/course.routes');
const categoryRoutes = require('./routes/category.routes');
const enrollmentRoutes = require('./routes/enrollment.routes');
const lessonRoutes = require('./routes/lesson.routes');
const paymentRoutes = require('./routes/payment.routes');
const progressRoutes = require('./routes/progress.routes');
const quizRoutes = require('./routes/quiz.routes');
const statsRoutes = require('./routes/stats.routes');
const videoUploadRoutes = require('./routes/videoUpload.routes');
const reviewRoutes = require('./routes/review.routes');
const commentRoutes = require('./routes/comment.routes');
const certificateRoutes = require('./routes/certificate.routes');

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/enrollments', enrollmentRoutes);
app.use('/api/lessons', lessonRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/quizzes', quizRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/upload', videoUploadRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/certificates', certificateRoutes);

// 404 handler
app.use((req, res) => {
    res.status(404).json({ success: false, message: 'Endpoint không tìm thấy' });
});

// Error handler
app.use((err, req, res, next) => {
    console.error('Lỗi:', err);
    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Lỗi server nội bộ'
    });
});

app.listen(PORT, () => {
    console.log(`🚀 Server đang chạy tại http://localhost:${PORT}`);
    console.log(`📦 Môi trường: ${process.env.NODE_ENV}`);
});

module.exports = app;
