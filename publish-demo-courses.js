/**
 * Gán is_published = 1 cho mọi khóa học & bài học (sửa dữ liệu seed cũ).
 * Chạy từ thư mục gốc: node publish-demo-courses.js
 */
require('dotenv').config();
const { MongoClient } = require('mongodb');

const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/elearning';

async function main() {
    const client = new MongoClient(uri);
    await client.connect();
    const db = client.db();

    const courses = await db.collection('courses').updateMany(
        { $or: [{ is_published: { $ne: 1 } }, { is_published: { $exists: false } }] },
        { $set: { is_published: 1 } }
    );
    const lessons = await db.collection('lessons').updateMany(
        { $or: [{ is_published: { $ne: 1 } }, { is_published: { $exists: false } }] },
        { $set: { is_published: 1 } }
    );

    console.log('✓ courses:', courses.modifiedCount, 'bản ghi → is_published = 1');
    console.log('✓ lessons:', lessons.modifiedCount, 'bản ghi → is_published = 1');
    await client.close();
}

main().catch((e) => {
    console.error('Lỗi:', e.message);
    process.exit(1);
});
