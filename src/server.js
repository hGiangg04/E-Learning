const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const dotenv = require('dotenv');
const path = require('path');
const http = require('http');
const connectDB = require('./config/database');

dotenv.config();
connectDB();

const app = express();
const PORT = Number(process.env.PORT) || 5000;
// Windows: có thể có 2 process trên "cùng" cổng 5000 (IPv4 vs IPv6). Mặc định chỉ IPv4 loopback
// để trùng Vite proxy (127.0.0.1) và tránh trúng process cũ chỉ bám [::]:5000.
const LISTEN_HOST = process.env.LISTEN_HOST || '127.0.0.1';

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

// Health check — thêm api_version để phân biệt process cũ / trùng cổng (Windows IPv4 vs IPv6)
app.get('/api/health', (req, res) => {
    res.set('X-E-Learning-API', '1');
    res.json({
        status: 'OK',
        message: 'API đang hoạt động',
        timestamp: new Date(),
        api_version: 2,
        pid: process.pid,
        instructor_paths: ['/api/instructors/:id', '/api/courses/instructor/:id']
    });
});

app.get('/api/__whoami', (req, res) => {
    res.set('X-E-Learning-API', '1');
    res.json({ app: 'e-learning-api', pid: process.pid, port: PORT });
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
const wishlistRoutes = require('./routes/wishlist.routes');
const reviewRoutes = require('./routes/review.routes');
const notificationRoutes = require('./routes/notification.routes');
const certificateRoutes = require('./routes/certificate.routes');
const cartRoutes = require('./routes/cart.routes');
const quizQuestionRoutes = require('./routes/quizQuestion.routes');
const instructorController = require('./controllers/instructor.controller');
const instructorDashboardRoutes = require('./routes/instructorDashboard.routes');
const couponRoutes = require('./routes/coupon.routes');

// Giảng viên: dùng Router + đặt sớm (trùng với route trong course.routes.js)
const instructorPublicRouter = express.Router();
instructorPublicRouter.get('/:id', instructorController.getProfile);
app.use('/api/instructors', instructorPublicRouter);
app.use('/api/instructor', instructorPublicRouter);

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
app.use('/api/quiz-questions', quizQuestionRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/upload', videoUploadRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/certificates', certificateRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/instructors', instructorDashboardRoutes);
app.use('/api/coupons', couponRoutes);

// Socket.io — khởi tạo sau khi đã require tất cả routes
const { initSocket } = require('./config/socket');
const httpServer = http.createServer(app);
initSocket(httpServer);

// 404 handler
app.use((req, res) => {
    res.set('X-E-Learning-API', '1');
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

httpServer.listen(PORT, LISTEN_HOST, () => {
    console.log(`🚀 Server (pid ${process.pid}) tại http://${LISTEN_HOST}:${PORT}`);
    console.log(`📦 Môi trường: ${process.env.NODE_ENV}`);
    console.log(`🔌 Socket.io tại http://${LISTEN_HOST}:${PORT}/socket.io`);
    console.log('📍 Giảng viên: GET /api/instructors/:id | /api/courses/instructor/:id');
    console.log('💡 /api/health phải có api_version: 2 — nếu không: đang gọi nhầm process khác trên cổng này');
    console.log('💡 Mở từ xa/LAN: đặt LISTEN_HOST=0.0.0.0 trong .env');
    if (LISTEN_HOST === '127.0.0.1') {
        console.log('💡 Trình duyệt: dùng http://127.0.0.1:' + PORT + ' (localhost đôi khi trúng IPv6 khác process)');
    }
});

module.exports = app;
