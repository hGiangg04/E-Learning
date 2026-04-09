/**
 * Script tạo dữ liệu demo cho E-Learning
 * Chạy: node seed-demo-data.js
 */
require('dotenv').config();
const { MongoClient, ObjectId } = require('mongodb');

const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/elearning';

async function seedData() {
    const client = new MongoClient(uri);
    await client.connect();
    const db = client.db();

    // Xóa dữ liệu cũ (nếu có)
    await db.collection('users').deleteMany({});
    await db.collection('categories').deleteMany({});
    await db.collection('courses').deleteMany({});
    await db.collection('lessons').deleteMany({});
    await db.collection('enrollments').deleteMany({});
    await db.collection('payments').deleteMany({});

    console.log('🗑️  Đã xóa dữ liệu cũ\n');

    // 1. Tạo Categories (Danh mục)
    const categories = [
        { _id: new ObjectId(), name: 'Lập trình Web', slug: 'lap-trinh-web', description: 'Học cách xây dựng website', createdAt: new Date() },
        { _id: new ObjectId(), name: 'JavaScript', slug: 'javascript', description: 'Ngôn ngữ lập trình phổ biến nhất', createdAt: new Date() },
        { _id: new ObjectId(), name: 'React', slug: 'react', description: 'Thư viện UI phổ biến', createdAt: new Date() },
        { _id: new ObjectId(), name: 'Node.js', slug: 'nodejs', description: 'Runtime JavaScript phía server', createdAt: new Date() },
    ];
    await db.collection('categories').insertMany(categories);
    console.log('✅ Đã tạo 4 danh mục');

    // 2. Tạo Admin User
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    const adminUser = {
        _id: new ObjectId(),
        name: 'Admin User',
        email: 'admin@example.com',
        password: hashedPassword,
        role: 'admin',
        avatar: '',
        createdAt: new Date()
    };
    await db.collection('users').insertOne(adminUser);
    console.log('✅ Đã tạo user admin: admin@example.com / admin123');

    // 3. Tạo Student User
    const studentUser = {
        _id: new ObjectId(),
        name: 'Học Viên Demo',
        email: 'student@example.com',
        password: await bcrypt.hash('student123', 10),
        role: 'student',
        avatar: '',
        createdAt: new Date()
    };
    await db.collection('users').insertOne(studentUser);
    console.log('✅ Đã tạo user student: student@example.com / student123');

    // 4. Tạo Courses (Khóa học)
    const courses = [
        {
            _id: new ObjectId(),
            title: 'HTML & CSS Cơ Bản',
            slug: 'html-css-co-ban',
            description: 'Khóa học nền tảng về HTML và CSS cho người mới bắt đầu',
            price: 0,
            instructor_id: adminUser._id,
            category_id: categories[0]._id,
            thumbnail: 'https://via.placeholder.com/400x225/3498db/ffffff?text=HTML+CSS',
            is_published: 1,
            createdAt: new Date(),
            updatedAt: new Date()
        },
        {
            _id: new ObjectId(),
            title: 'JavaScript Từ Zero Đến Hero',
            slug: 'javascript-tu-zero-den-hero',
            description: 'Học JavaScript từ cơ bản đến nâng cao',
            price: 299000,
            instructor_id: adminUser._id,
            category_id: categories[1]._id,
            thumbnail: 'https://via.placeholder.com/400x225/f7dc6f/000000?text=JavaScript',
            is_published: 1,
            createdAt: new Date(),
            updatedAt: new Date()
        },
        {
            _id: new ObjectId(),
            title: 'React Hooks Toàn Tập',
            slug: 'react-hooks-toan-tap',
            description: 'Nắm vững useState, useEffect, useContext và các hooks khác',
            price: 499000,
            instructor_id: adminUser._id,
            category_id: categories[2]._id,
            thumbnail: 'https://via.placeholder.com/400x225/61dafb/000000?text=React+Hooks',
            is_published: 1,
            createdAt: new Date(),
            updatedAt: new Date()
        },
        {
            _id: new ObjectId(),
            title: 'Node.js Backend Development',
            slug: 'nodejs-backend',
            description: 'Xây dựng REST API với Node.js và Express',
            price: 599000,
            instructor_id: adminUser._id,
            category_id: categories[3]._id,
            thumbnail: 'https://via.placeholder.com/400x225/68a063/ffffff?text=Node.js',
            is_published: 1,
            createdAt: new Date(),
            updatedAt: new Date()
        },
    ];
    await db.collection('courses').insertMany(courses);
    console.log('✅ Đã tạo 4 khóa học');

    // 5. Tạo Lessons (Bài học)
    const lessons = [
        // HTML & CSS Course
        { _id: new ObjectId(), course_id: courses[0]._id, title: 'Giới thiệu HTML', slug: 'gioi-thieu-html', content: '# Giới thiệu HTML\n\nHTML là ngôn ngữ đánh dấu siêu văn bản...', video_url: '', duration: 15, order: 1, is_published: 1, createdAt: new Date() },
        { _id: new ObjectId(), course_id: courses[0]._id, title: 'Cấu trúc HTML cơ bản', slug: 'cau-truc-html', content: '# Cấu trúc HTML\n\nMỗi trang web HTML đều có cấu trúc cơ bản...', video_url: '', duration: 20, order: 2, is_published: 1, createdAt: new Date() },
        { _id: new ObjectId(), course_id: courses[0]._id, title: 'CSS là gì?', slug: 'css-la-gi', content: '# CSS\n\nCSS dùng để tạo kiểu cho trang web...', video_url: '', duration: 18, order: 3, is_published: 1, createdAt: new Date() },
        
        // JavaScript Course
        { _id: new ObjectId(), course_id: courses[1]._id, title: 'Biến và kiểu dữ liệu', slug: 'bien-va-kieu-du-lieu', content: '# Biến trong JavaScript\n\nKhai báo biến với let, const, var...', video_url: '', duration: 25, order: 1, is_published: 1, createdAt: new Date() },
        { _id: new ObjectId(), course_id: courses[1]._id, title: 'Hàm (Functions)', slug: 'ham-functions', content: '# Functions\n\nCách khai báo và sử dụng hàm...', video_url: '', duration: 30, order: 2, is_published: 1, createdAt: new Date() },
        { _id: new ObjectId(), course_id: courses[1]._id, title: 'Arrays và Objects', slug: 'arrays-objects', content: '# Arrays & Objects\n\nLàm việc với mảng và đối tượng...', video_url: '', duration: 35, order: 3, is_published: 1, createdAt: new Date() },
        
        // React Course
        { _id: new ObjectId(), course_id: courses[2]._id, title: 'useState Hook', slug: 'usestate-hook', content: '# useState\n\nQuản lý state trong component...', video_url: '', duration: 20, order: 1, is_published: 1, createdAt: new Date() },
        { _id: new ObjectId(), course_id: courses[2]._id, title: 'useEffect Hook', slug: 'useeffect-hook', content: '# useEffect\n\nXử lý side effects trong React...', video_url: '', duration: 25, order: 2, is_published: 1, createdAt: new Date() },
        
        // Node.js Course
        { _id: new ObjectId(), course_id: courses[3]._id, title: 'Giới thiệu Node.js', slug: 'gioi-thieu-nodejs', content: '# Node.js\n\nRuntime JavaScript phía server...', video_url: '', duration: 15, order: 1, is_published: 1, createdAt: new Date() },
        { _id: new ObjectId(), course_id: courses[3]._id, title: 'Express.js cơ bản', slug: 'express-co-ban', content: '# Express.js\n\nFramework web cho Node.js...', video_url: '', duration: 30, order: 2, is_published: 1, createdAt: new Date() },
    ];
    await db.collection('lessons').insertMany(lessons);
    console.log('✅ Đã tạo 10 bài học');

    // 6. Đăng ký + thanh toán mẫu (đúng schema Mongoose)
    const enrFree = new ObjectId();
    const enrJsPending = new ObjectId();
    const enrReactPending = new ObjectId();
    const enrNodePaid = new ObjectId();

    const enrollments = [
        {
            _id: enrFree,
            user_id: studentUser._id,
            course_id: courses[0]._id,
            enrolled_at: new Date(),
            status: 'active',
            progress_percent: 0,
        },
        {
            _id: enrJsPending,
            user_id: studentUser._id,
            course_id: courses[1]._id,
            enrolled_at: new Date(),
            status: 'pending',
            progress_percent: 0,
        },
        {
            _id: enrReactPending,
            user_id: studentUser._id,
            course_id: courses[2]._id,
            enrolled_at: new Date(),
            status: 'pending',
            progress_percent: 0,
        },
        {
            _id: enrNodePaid,
            user_id: studentUser._id,
            course_id: courses[3]._id,
            enrolled_at: new Date(),
            status: 'active',
            progress_percent: 0,
        },
    ];
    await db.collection('enrollments').insertMany(enrollments);

    const ts = Date.now();
    const payments = [
        {
            user_id: studentUser._id,
            course_id: courses[1]._id,
            enrollment_id: enrJsPending,
            order_code: `DEMO-PEND-${ts}-JS`,
            amount: 299000,
            payment_method: 'banking',
            status: 'pending',
            created_at: new Date(),
        },
        {
            user_id: studentUser._id,
            course_id: courses[2]._id,
            enrollment_id: enrReactPending,
            order_code: `DEMO-PEND-${ts}-RE`,
            amount: 499000,
            payment_method: 'momo',
            status: 'pending',
            created_at: new Date(),
        },
        {
            user_id: studentUser._id,
            course_id: courses[3]._id,
            enrollment_id: enrNodePaid,
            order_code: `DEMO-OK-${ts}-ND`,
            amount: 599000,
            payment_method: 'vnpay',
            status: 'completed',
            paid_at: new Date(),
            auto_processed: 1,
            created_at: new Date(),
        },
    ];
    await db.collection('payments').insertMany(payments);

    await db.collection('courses').updateOne(
        { _id: courses[3]._id },
        { $inc: { student_count: 1 } }
    );

    console.log('✅ Đã tạo 4 enrollment + 3 giao dịch thanh toán mẫu (2 chờ duyệt, 1 đã hoàn thành)');

    console.log('\n🎉 Hoàn thành! Dữ liệu demo đã được thêm vào database.');
    console.log('\n📋 Thông tin đăng nhập:');
    console.log('   Admin:   admin@example.com / admin123');
    console.log('   Student: student@example.com / student123');

    await client.close();
}

seedData().catch((e) => {
    console.error('❌ Lỗi:', e.message);
    process.exit(1);
});
