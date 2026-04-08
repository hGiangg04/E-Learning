const { MongoClient } = require('mongodb');

const MONGO_URI = 'mongodb://127.0.0.1:27017';
const DB_NAME = 'elearning';

async function checkDatabase() {
    const client = new MongoClient(MONGO_URI);
    
    try {
        await client.connect();
        console.log('✓ Kết nối MongoDB thành công!\n');
        
        const db = client.db(DB_NAME);
        
        // Lấy danh sách collections
        const collections = await db.listCollections().toArray();
        
        console.log('📁 Các Collections trong database', DB_NAME + ':\n');
        
        let totalDocs = 0;
        for (const coll of collections) {
            const count = await db.collection(coll.name).countDocuments();
            totalDocs += count;
            console.log(`   ${coll.name}: ${count} documents`);
        }
        
        console.log(`\n📊 Tổng cộng: ${collections.length} collections, ${totalDocs} documents\n`);
        
        // Hiển thị chi tiết users
        console.log('👤 Users trong hệ thống:');
        const users = await db.collection('users').find().toArray();
        users.forEach(u => console.log(`   - ${u.name} | ${u.email} | ${u.role}`));
        
        // Hiển thị chi tiết courses
        console.log('\n📚 Courses:');
        const courses = await db.collection('courses').find().toArray();
        courses.forEach(c => console.log(`   - ${c.title} | Giá: ${c.price}`));
        
        console.log('\n✅ Database hoạt động tốt!');
        
    } catch (error) {
        console.error('❌ Lỗi:', error.message);
    } finally {
        await client.close();
    }
}

checkDatabase();
