/**
 * Script tạo tài khoản Admin gốc
 * Chạy: node create-admin.js
 */

const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');

const MONGO_URI = 'mongodb://127.0.0.1:27017';
const DB_NAME = 'elearning';

async function createAdmin() {
    const client = new MongoClient(MONGO_URI);
    
    try {
        await client.connect();
        console.log('✓ Kết nối MongoDB thành công!');
        
        const db = client.db(DB_NAME);
        const users = db.collection('users');
        
        // Tạo password hash
        const hashedPassword = await bcrypt.hash('Admin123!', 12);
        
        // Xóa admin cũ nếu có
        await users.deleteOne({ email: 'admin@elearning.com' });
        
        // Thêm tài khoản admin mới
        const result = await users.insertOne({
            name: 'Administrator',
            email: 'admin@elearning.com',
            password: hashedPassword,
            role: 'admin',
            is_active: 1,
            created_at: new Date()
        });
        
        console.log('\n========================================');
        console.log('🎉 TẠO TÀI KHOẢN ADMIN THÀNH CÔNG!');
        console.log('========================================');
        console.log('📧 Email:    admin@elearning.com');
        console.log('🔑 Password: Admin123!');
        console.log('👤 Role:     admin');
        console.log('========================================\n');
        
    } catch (error) {
        console.error('❌ Lỗi:', error.message);
    } finally {
        await client.close();
    }
}

createAdmin();
