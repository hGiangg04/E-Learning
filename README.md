# E-Learning API

API backend cho nền tảng E-Learning, được xây dựng bằng **Node.js + Express + MongoDB**.

---

## Cấu trúc thư mục

```
d:\E-Learning\
├── src/
│   ├── config/          # Cấu hình database, env
│   ├── controllers/     # Xử lý logic API
│   ├── middleware/      # Middleware (auth, validate)
│   ├── models/          # Schema MongoDB (Mongoose)
│   ├── routes/          # Định nghĩa endpoint
│   └── server.js        # Entry point
├── .env                 # Biến môi trường (KHÔNG push lên Git)
├── .env.example         # Mẫu biến môi trường
├── .gitignore
├── package.json
└── README.md
```

---

## Các API Endpoints

### 🔐 Xác thực (Auth)

| Method | Endpoint | Mô tả | Cần login |
|--------|----------|--------|-----------|
| POST | `/api/auth/register` | Đăng ký tài khoản mới | Không |
| POST | `/api/auth/login` | Đăng nhập | Không |
| GET | `/api/auth/me` | Lấy thông tin user đang login | Có |

### 👥 Người dùng (Users)

| Method | Endpoint | Mô tả | Cần login |
|--------|----------|--------|-----------|
| GET | `/api/users` | Danh sách users (có phân trang) | Có |
| GET | `/api/users/:id` | Lấy thông tin user theo ID | Có |
| PUT | `/api/users/:id` | Cập nhật thông tin user | Có |

### 📚 Khóa học (Courses)

| Method | Endpoint | Mô tả | Cần login |
|--------|----------|--------|-----------|
| GET | `/api/courses` | Danh sách khóa học (có lọc, phân trang) | Không |
| GET | `/api/courses/:id` | Chi tiết khóa học | Không |
| POST | `/api/courses` | Tạo khóa học mới | Có (Instructor/Admin) |
| PUT | `/api/courses/:id` | Cập nhật khóa học | Có (Instructor/Admin) |
| DELETE | `/api/courses/:id` | Xóa khóa học | Có (Admin) |

### 📁 Danh mục (Categories)

| Method | Endpoint | Mô tả | Cần login |
|--------|----------|--------|-----------|
| GET | `/api/categories` | Danh sách danh mục | Không |
| GET | `/api/categories/:id` | Chi tiết danh mục | Không |
| POST | `/api/categories` | Tạo danh mục mới | Có (Admin) |

### 📝 Bài học (Lessons)

| Method | Endpoint | Mô tả | Cần login |
|--------|----------|--------|-----------|
| GET | `/api/lessons/course/:courseId` | Danh sách bài học | Không |
| GET | `/api/lessons/:id` | Chi tiết bài học | Không |
| POST | `/api/lessons` | Tạo bài học mới | Có (Instructor/Admin) |

### 🎓 Đăng ký (Enrollments)

| Method | Endpoint | Mô tả | Cần login |
|--------|----------|--------|-----------|
| GET | `/api/enrollments` | Danh sách khóa đã đăng ký | Có |
| POST | `/api/enrollments` | Đăng ký khóa học | Có |
| DELETE | `/api/enrollments/:courseId` | Hủy đăng ký | Có |

---

## Cách chạy

### 1. Cài đặt dependencies

```bash
npm install
```

### 2. Cấu hình MongoDB

Mở file `.env` và sửa MongoDB URI nếu cần:

```env
MONGODB_URI=mongodb://127.0.0.1:27017/elearning
```

### 3. Chạy server

```bash
npm start
```

Server sẽ chạy tại: `http://localhost:5000`

---

## Tạo Database

Nếu chưa có database, chạy script tạo:

```bash
node create-database.js
```

Kiểm tra database:

```bash
node check-database.js
```

---

## Xác thực JWT

Khi đăng nhập thành công, API trả về `token`. 
Gửi token trong header của các request cần xác thực:

```
Authorization: Bearer <token>
```

---

## Phân quyền

| Role | Quyền |
|------|-------|
| `student` | Xem courses, enroll, học bài |
| `instructor` | Tạo course, lesson |
| `admin` | Toàn quyền |

---

## Commit vào nhánh API

```bash
git checkout api
git add .
git commit -m "feat: mô tả chức năng"
git push origin api
```

---

## Quy trình làm việc nhóm

1. **Tạo nhánh mới**: `git checkout -b feature/tên-chức-năng`
2. **Code và commit** vào nhánh mới
3. **Push lên GitHub**: `git push origin feature/tên-chức-năng`
4. **Tạo Pull Request** vào nhánh `api`
5. **Review** và **Merge** khi đã hoàn chỉnh

> ⚠️ **KHÔNG bao giờ push trực tiếp lên nhánh `main`**

---

## Thứ tự thực hiện (Workflow nhóm)

```
1. Lấy code mới nhất từ GitHub
       ↓
2. Tạo nhánh mới từ api
       ↓
3. Code chức năng hoàn chỉnh
       ↓
4. Commit với commit message rõ ràng
       ↓
5. Push lên nhánh feature
       ↓
6. Tạo Pull Request vào api
       ↓
7. Leader/Team review code
       ↓
8. Fix comments nếu có
       ↓
9. Merge vào nhánh api
       ↓
10. Khi API hoàn chỉnh → Merge vào main
```
