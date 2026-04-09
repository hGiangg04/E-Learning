const { MongoClient } = require('mongodb');

const MONGO_URI = 'mongodb://127.0.0.1:27017';
const DB_NAME = 'elearning';

async function createDatabase() {
    const client = new MongoClient(MONGO_URI);
    
    try {
        await client.connect();
        console.log('✓ Kết nối MongoDB thành công!');
        
        const db = client.db(DB_NAME);
        
        // ==================== 1. USERS ====================
        const users = db.collection('users');
        await users.createIndex({ email: 1 }, { unique: true });
        console.log('✓ Collection users đã tạo');
        
        // ==================== 2. CATEGORIES ====================
        const categories = db.collection('categories');
        console.log('✓ Collection categories đã tạo');
        
        // ==================== 3. COURSES ====================
        const courses = db.collection('courses');
        await courses.createIndex({ category_id: 1 });
        console.log('✓ Collection courses đã tạo');
        
        // ==================== 4. LESSONS ====================
        const lessons = db.collection('lessons');
        await lessons.createIndex({ course_id: 1 });
        await lessons.createIndex({ course_id: 1, position: 1 });
        console.log('✓ Collection lessons đã tạo');
        
        // ==================== 5. ENROLLMENTS ====================
        const enrollments = db.collection('enrollments');
        await enrollments.createIndex({ user_id: 1 });
        await enrollments.createIndex({ course_id: 1 });
        await enrollments.createIndex({ user_id: 1, course_id: 1 }, { unique: true });
        console.log('✓ Collection enrollments đã tạo');
        
        // ==================== 6. COMMENTS ====================
        const comments = db.collection('comments');
        await comments.createIndex({ user_id: 1 });
        await comments.createIndex({ lesson_id: 1 });
        console.log('✓ Collection comments đã tạo');
        
        // ==================== 7. LESSON_PROGRESS ====================
        const lessonProgress = db.collection('lesson_progress');
        await lessonProgress.createIndex({ user_id: 1 });
        await lessonProgress.createIndex({ lesson_id: 1 });
        await lessonProgress.createIndex({ user_id: 1, lesson_id: 1 }, { unique: true });
        console.log('✓ Collection lesson_progress đã tạo');
        
        // ==================== 8. COURSE_PROGRESS ====================
        const courseProgress = db.collection('course_progress');
        await courseProgress.createIndex({ user_id: 1 });
        await courseProgress.createIndex({ user_id: 1, course_id: 1 }, { unique: true });
        console.log('✓ Collection course_progress đã tạo');
        
        // ==================== 9. QUIZZES ====================
        const quizzes = db.collection('quizzes');
        await quizzes.createIndex({ course_id: 1 });
        await quizzes.createIndex({ lesson_id: 1 });
        console.log('✓ Collection quizzes đã tạo');
        
        // ==================== 10. QUIZ_QUESTIONS ====================
        const quizQuestions = db.collection('quiz_questions');
        await quizQuestions.createIndex({ quiz_id: 1 });
        console.log('✓ Collection quiz_questions đã tạo');
        
        // ==================== 11. QUESTION_OPTIONS ====================
        const questionOptions = db.collection('question_options');
        await questionOptions.createIndex({ question_id: 1 });
        console.log('✓ Collection question_options đã tạo');
        
        // ==================== 12. QUIZ_ATTEMPTS ====================
        const quizAttempts = db.collection('quiz_attempts');
        await quizAttempts.createIndex({ user_id: 1 });
        await quizAttempts.createIndex({ quiz_id: 1 });
        console.log('✓ Collection quiz_attempts đã tạo');
        
        // ==================== 13. QUIZ_ANSWERS ====================
        const quizAnswers = db.collection('quiz_answers');
        await quizAnswers.createIndex({ attempt_id: 1 });
        await quizAnswers.createIndex({ attempt_id: 1, question_id: 1 }, { unique: true });
        console.log('✓ Collection quiz_answers đã tạo');
        
        // ==================== 14. CERTIFICATES ====================
        const certificates = db.collection('certificates');
        await certificates.createIndex({ course_id: 1 });
        console.log('✓ Collection certificates đã tạo');
        
        // ==================== 15. USER_CERTIFICATES ====================
        const userCertificates = db.collection('user_certificates');
        await userCertificates.createIndex({ user_id: 1 });
        await userCertificates.createIndex({ certificate_number: 1 }, { unique: true });
        await userCertificates.createIndex({ verification_code: 1 }, { unique: true });
        await userCertificates.createIndex({ user_id: 1, course_id: 1 }, { unique: true });
        console.log('✓ Collection user_certificates đã tạo');
        
        // ==================== 16. COURSE_REVIEWS ====================
        const courseReviews = db.collection('course_reviews');
        await courseReviews.createIndex({ user_id: 1 });
        await courseReviews.createIndex({ course_id: 1 });
        await courseReviews.createIndex({ user_id: 1, course_id: 1 }, { unique: true });
        console.log('✓ Collection course_reviews đã tạo');
        
        // ==================== 17. NOTIFICATIONS ====================
        const notifications = db.collection('notifications');
        await notifications.createIndex({ user_id: 1 });
        await notifications.createIndex({ is_read: 1 });
        console.log('✓ Collection notifications đã tạo');
        
        // ==================== 18. WISHLIST ====================
        const wishlist = db.collection('wishlist');
        await wishlist.createIndex({ user_id: 1 });
        await wishlist.createIndex({ user_id: 1, course_id: 1 }, { unique: true });
        console.log('✓ Collection wishlist đã tạo');
        
        // ==================== 19. PAYMENTS ====================
        const payments = db.collection('payments');
        await payments.createIndex({ user_id: 1 });
        await payments.createIndex({ order_code: 1 }, { unique: true });
        console.log('✓ Collection payments đã tạo');
        
        // ==================== 20. CART ====================
        const cart = db.collection('cart');
        await cart.createIndex({ user_id: 1 });
        await cart.createIndex({ user_id: 1, course_id: 1 }, { unique: true });
        console.log('✓ Collection cart đã tạo');
        
        // ==================== 21. PAYMENT_ITEMS ====================
        const paymentItems = db.collection('payment_items');
        await paymentItems.createIndex({ payment_id: 1 });
        console.log('✓ Collection payment_items đã tạo');
        
        // ==================== 22. PAYMENT_CONFIG ====================
        const paymentConfig = db.collection('payment_config');
        console.log('✓ Collection payment_config đã tạo');
        
        // ==================== 23. BANK_CONFIG ====================
        const bankConfig = db.collection('bank_config');
        console.log('✓ Collection bank_config đã tạo');

        // ==================== CHÈN DỮ LIỆU MẪU ====================
        
        // Insert Users
        const now = new Date();
        await users.insertMany([
            { name: 'Admin', email: 'admin@elearning.com', password: '$2b$10$...', role: 'admin', is_active: 1, created_at: now },
            { name: 'Nguyễn Văn A', email: 'student1@email.com', password: '$2b$10$...', role: 'student', is_active: 1, created_at: now },
            { name: 'Trần Thị B', email: 'student2@email.com', password: '$2b$10$...', role: 'student', is_active: 1, created_at: now },
            { name: 'Lê Văn C', email: 'student3@email.com', password: '$2b$10$...', role: 'student', is_active: 1, created_at: now },
            { name: 'Phạm Thị D', email: 'student4@email.com', password: '$2b$10$...', role: 'student', is_active: 1, created_at: now }
        ]);
        console.log('✓ Đã chèn 5 users mẫu');

        // Insert Categories
        await categories.insertMany([
            { name: 'Lập trình Web' },
            { name: 'Lập trình Mobile' },
            { name: 'Data Science' },
            { name: 'DevOps' },
            { name: 'UI/UX Design' }
        ]);
        console.log('✓ Đã chèn 5 categories mẫu');

        // Insert Courses
        // is_published: 1 — API công khai GET /api/courses chỉ trả khóa đã xuất bản
        const coursesData = [
            { title: 'HTML & CSS cơ bản', description: 'Khóa học HTML CSS cho người mới bắt đầu', category_id: 1, price: 0, thumbnail: '', average_rating: 4.5, review_count: 120, is_published: 1, created_at: now },
            { title: 'JavaScript nâng cao', description: 'Học JavaScript từ cơ bản đến nâng cao', category_id: 1, price: 299000, thumbnail: '', average_rating: 4.8, review_count: 85, is_published: 1, created_at: now },
            { title: 'React JS Master', description: 'Xây dựng ứng dụng React chuyên nghiệp', category_id: 1, price: 599000, thumbnail: '', average_rating: 4.9, review_count: 200, is_published: 1, created_at: now },
            { title: 'Node.js Backend', description: 'Xây dựng RESTful API với Node.js', category_id: 1, price: 499000, thumbnail: '', average_rating: 4.7, review_count: 150, is_published: 1, created_at: now },
            { title: 'Flutter Mobile', description: 'Phát triển ứng dụng di động đa nền tảng', category_id: 2, price: 699000, thumbnail: '', average_rating: 4.6, review_count: 90, is_published: 1, created_at: now },
            { title: 'Python cho Data Science', description: 'Phân tích dữ liệu với Python', category_id: 3, price: 799000, thumbnail: '', average_rating: 4.8, review_count: 180, is_published: 1, created_at: now },
            { title: 'Docker & Kubernetes', description: 'DevOps tools cho developer', category_id: 4, price: 899000, thumbnail: '', average_rating: 4.5, review_count: 75, is_published: 1, created_at: now }
        ];
        await courses.insertMany(coursesData);
        console.log('✓ Đã chèn 7 courses mẫu');

        // Insert Lessons
        const lessonsData = [
            { course_id: 1, title: 'Bài 1: Giới thiệu HTML', content: 'HTML là ngôn ngữ đánh dấu siêu văn bản...', video_url: '', position: 1, is_published: 1, created_at: now },
            { course_id: 1, title: 'Bài 2: Cấu trúc HTML', content: 'Cấu trúc cơ bản của một trang web...', video_url: '', position: 2, is_published: 1, created_at: now },
            { course_id: 1, title: 'Bài 3: CSS cơ bản', content: 'CSS dùng để tạo kiểu cho trang web...', video_url: '', position: 3, is_published: 1, created_at: now },
            { course_id: 2, title: 'Bài 1: Biến và Kiểu dữ liệu', content: 'Trong JavaScript có các kiểu dữ liệu...', video_url: '', position: 1, is_published: 1, created_at: now },
            { course_id: 2, title: 'Bài 2: Hàm và Closure', content: 'Function trong JavaScript...', video_url: '', position: 2, is_published: 1, created_at: now },
            { course_id: 3, title: 'Bài 1: Giới thiệu React', content: 'React là thư viện JavaScript...', video_url: '', position: 1, is_published: 1, created_at: now },
            { course_id: 3, title: 'Bài 2: Component & Props', content: 'Props là cách truyền dữ liệu...', video_url: '', position: 2, is_published: 1, created_at: now },
            { course_id: 3, title: 'Bài 3: State & Lifecycle', content: 'State dùng để quản lý dữ liệu...', video_url: '', position: 3, is_published: 1, created_at: now }
        ];
        await lessons.insertMany(lessonsData);
        console.log('✓ Đã chèn 8 lessons mẫu');

        // Insert Enrollments
        await enrollments.insertMany([
            { user_id: 2, course_id: 1, enrolled_at: now, status: 'active' },
            { user_id: 2, course_id: 2, enrolled_at: now, status: 'active' },
            { user_id: 3, course_id: 1, enrolled_at: now, status: 'active' },
            { user_id: 3, course_id: 3, enrolled_at: now, status: 'active' },
            { user_id: 4, course_id: 2, enrolled_at: now, status: 'pending' }
        ]);
        console.log('✓ Đã chèn 4 enrollments mẫu');

        // Insert Payments
        await payments.insertMany([
            { user_id: 2, order_code: 'ORD001', course_id: 2, enrollment_id: null, amount: 299000, payment_method: 'vnpay', status: 'completed', auto_processed: 1, paid_at: now },
            { user_id: 3, order_code: 'ORD002', course_id: 3, enrollment_id: null, amount: 599000, payment_method: 'bank_transfer', status: 'completed', auto_processed: 1, paid_at: now },
            { user_id: 4, order_code: 'ORD003', course_id: 2, enrollment_id: null, amount: 299000, payment_method: 'momo', status: 'pending', auto_processed: 0, paid_at: null }
        ]);
        console.log('✓ Đã chèn 3 payments mẫu');

        // Insert Notifications
        await notifications.insertMany([
            { user_id: 2, type: 'enrollment_activated', title: 'Đăng ký thành công', message: 'Bạn đã được ghi danh vào khóa học JavaScript nâng cao', link: '/courses/2', is_read: 0, read_at: null },
            { user_id: 3, type: 'enrollment_activated', title: 'Đăng ký thành công', message: 'Bạn đã được ghi danh vào khóa học React JS Master', link: '/courses/3', is_read: 1, read_at: now }
        ]);
        console.log('✓ Đã chèn 2 notifications mẫu');

        // Insert Wishlist
        await wishlist.insertMany([
            { user_id: 2, course_id: 3, created_at: now },
            { user_id: 3, course_id: 5, created_at: now },
            { user_id: 4, course_id: 6, created_at: now }
        ]);
        console.log('✓ Đã chèn 3 wishlist mẫu');

        // Insert Certificates
        await certificates.insertMany([
            { course_id: 1, title: 'Chứng chỉ HTML & CSS', description: 'Hoàn thành khóa học HTML & CSS cơ bản', template_path: '/templates/cert_html_css.pdf' },
            { course_id: 2, title: 'Chứng chỉ JavaScript', description: 'Hoàn thành khóa học JavaScript nâng cao', template_path: '/templates/cert_javascript.pdf' }
        ]);
        console.log('✓ Đã chèn 2 certificates mẫu');

        // Insert User Certificates
        await userCertificates.insertMany([
            { 
                user_id: 2, course_id: 1, certificate_number: 'CERT-001-2025', 
                issued_at: now, completion_date: new Date(), final_score: 95.5,
                verification_code: 'VC-ABC123', status: 'active' 
            },
            { 
                user_id: 3, course_id: 3, certificate_number: 'CERT-002-2025', 
                issued_at: now, completion_date: new Date(), final_score: 88.0,
                verification_code: 'VC-DEF456', status: 'active' 
            }
        ]);
        console.log('✓ Đã chèn 2 user_certificates mẫu');

        // Insert Quiz
        await quizzes.insertMany([
            { 
                lesson_id: 1, course_id: 1, title: 'Kiểm tra Bài 1',
                description: 'Kiểm tra kiến thức HTML cơ bản',
                passing_score: 70, time_limit: 15, max_attempts: 3,
                shuffle_questions: 1, shuffle_options: 1,
                show_correct_answer: 1, show_results_immediately: 1, is_active: 1
            }
        ]);
        console.log('✓ Đã chèn 1 quiz mẫu');

        // Insert Quiz Questions
        const q1 = await quizQuestions.insertOne({
            quiz_id: null, question_type: 'multiple_choice',
            question_text: 'HTML là viết tắt của gì?',
            explanation: 'HTML = HyperText Markup Language',
            points: 10, position: 1, is_active: 1
        });
        console.log('✓ Đã chèn 1 quiz_question mẫu');

        // Insert Question Options
        await questionOptions.insertMany([
            { question_id: q1.insertedId, option_text: 'HyperText Markup Language', is_correct: 1, position: 1 },
            { question_id: q1.insertedId, option_text: 'High Tech Modern Language', is_correct: 0, position: 2 },
            { question_id: q1.insertedId, option_text: 'Home Tool Markup Language', is_correct: 0, position: 3 }
        ]);
        console.log('✓ Đã chèn 3 question_options mẫu');

        // Insert Quiz Attempt
        await quizAttempts.insertOne({
            user_id: 2, quiz_id: null, attempt_number: 1,
            started_at: now, completed_at: now, time_spent: 300,
            score: 100, total_points: 10, earned_points: 10, is_passed: 1, status: 'completed'
        });
        console.log('✓ Đã chèn 1 quiz_attempt mẫu');

        // Insert Course Reviews
        await courseReviews.insertMany([
            { user_id: 2, course_id: 1, rating: 5, review_text: 'Khóa học rất hay, dễ hiểu!', status: 'approved' },
            { user_id: 3, course_id: 3, rating: 5, review_text: 'Giảng viên dạy rất chi tiết', status: 'approved' }
        ]);
        console.log('✓ Đã chèn 2 course_reviews mẫu');

        // Insert Cart
        await cart.insertMany([
            { user_id: 2, course_id: 5, created_at: now },
            { user_id: 4, course_id: 4, created_at: now }
        ]);
        console.log('✓ Đã chèn 2 cart mẫu');

        // Insert Payment Config
        await paymentConfig.insertOne({
            vnpay_url: 'https://sandbox.vnpayment.vn',
            vnpay_hash_key: '',
            bank_account: '',
            syntax_pattern: 'ORD[0-9]+'
        });
        console.log('✓ Đã chèn payment_config mẫu');

        // Insert Bank Config
        await bankConfig.insertOne({
            bank_name: 'Vietcombank',
            account_number: '1234567890',
            account_holder: 'E-Learning Co.',
            branch: 'Hanoi'
        });
        console.log('✓ Đã chèn bank_config mẫu');

        console.log('\n========================================');
        console.log('🎉 TẠO DATABASE ELEARNING THÀNH CÔNG!');
        console.log('========================================');
        console.log(`📊 Database: ${DB_NAME}`);
        console.log('📁 Collections đã tạo:');
        console.log('   1. users');
        console.log('   2. categories');
        console.log('   3. courses');
        console.log('   4. lessons');
        console.log('   5. enrollments');
        console.log('   6. comments');
        console.log('   7. lesson_progress');
        console.log('   8. course_progress');
        console.log('   9. quizzes');
        console.log('   10. quiz_questions');
        console.log('   11. question_options');
        console.log('   12. quiz_attempts');
        console.log('   13. quiz_answers');
        console.log('   14. certificates');
        console.log('   15. user_certificates');
        console.log('   16. course_reviews');
        console.log('   17. notifications');
        console.log('   18. wishlist');
        console.log('   19. payments');
        console.log('   20. cart');
        console.log('   21. payment_items');
        console.log('   22. payment_config');
        console.log('   23. bank_config');
        console.log('========================================\n');

    } catch (error) {
        console.error('❌ Lỗi:', error.message);
    } finally {
        await client.close();
    }
}

createDatabase();
