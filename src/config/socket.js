/**
 * Cấu hình Socket.io server — chạy song song với HTTP server.
 *
 * Cách dùng:
 *   const { io } = require('./config/socket');
 *   io.to(`user:${userId}`).emit('notification', data);
 */
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

let io = null;

/**
 * Khởi tạo Socket.io gắn vào HTTP server đã có.
 * @param {import('http').Server} httpServer
 */
function initSocket(httpServer) {
    io = new Server(httpServer, {
        cors: {
            origin: '*',
            methods: ['GET', 'POST'],
        },
        path: '/socket.io',
    });

    // Xác thực token khi client kết nối
    io.use((socket, next) => {
        const token = socket.handshake.auth?.token || socket.handshake.query?.token;
        if (!token) {
            return next(new Error('Không có token xác thực'));
        }
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            socket.userId = decoded.id;
            socket.userRole = decoded.role;
            next();
        } catch {
            next(new Error('Token không hợp lệ'));
        }
    });

    io.on('connection', (socket) => {
        console.log(`🔌 Socket connected: user=${socket.userId}, socket=${socket.id}`);

        // Gia nhập phòng riêng của user để nhận thông báo cá nhân
        socket.join(`user:${socket.userId}`);

        // Admin nhận phòng admin
        if (socket.userRole === 'admin') {
            socket.join('room:admin');
        }

        socket.on('disconnect', () => {
            console.log(`🔌 Socket disconnected: user=${socket.userId}, socket=${socket.id}`);
        });
    });

    console.log('✅ Socket.io server khởi tạo thành công');
    return io;
}

/**
 * Lấy instance io (sau khi initSocket đã được gọi).
 */
function getIO() {
    return io;
}

module.exports = { initSocket, getIO };
