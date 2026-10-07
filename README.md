# HỆ THỐNG QUIZ / THI TRẮC NGHIỆM TRỰC TUYẾN (ĐỀ TÀI 35)

> Dự án phục vụ bài thực hành môn **Triển khai và Quản trị Hệ thống Phần mềm**.

Hệ thống cho phép:
* Tạo đề thi trắc nghiệm và quản lý câu hỏi, đáp án (A, B, C, D).
* Thí sinh đăng ký, đăng nhập và tham gia thi trắc nghiệm trực tuyến có đồng hồ đếm ngược.
* Chấm điểm tự động trên thang điểm 10 ngay khi nộp bài.
* Xem lại chi tiết kết quả, giải thích đáp án đúng/sai và lưu lịch sử thi.
* Quản trị viên (ADMIN) theo dõi thống kê kết quả thi toàn hệ thống.

---

## 1. Công nghệ sử dụng

* **Frontend**: HTML5, CSS3, JavaScript thuần (Vanilla JS), không sử dụng framework trung gian, giao diện Responsive hiện đại.
* **Backend**: Node.js, Express.js (RESTful API).
* **Database**: MySQL (kết nối qua thư viện `mysql2` Promise pool).
* **Authentication**: JSON Web Token (JWT) và mã hóa mật khẩu Bcrypt.

---

## 2. Cấu trúc thư mục

```text
Hệ thống Quiz - Thi trắc nghiệm/
│
├── backend/
│   ├── config/
│   │   └── db.js                 # Cấu hình Pool kết nối MySQL
│   ├── controllers/
│   │   ├── authController.js     # Đăng ký, đăng nhập, hồ sơ
│   │   ├── examController.js     # Quản lý đề thi, nộp bài & chấm điểm
│   │   ├── questionController.js # Quản lý câu hỏi & đáp án A, B, C, D
│   │   └── resultController.js   # Kết quả thi, thống kê Dashboard
│   ├── middleware/
│   │   └── auth.js               # Xác thực JWT & phân quyền ADMIN/USER
│   ├── routes/
│   │   ├── authRoutes.js         # Routes /api/auth
│   │   ├── examRoutes.js         # Routes /api/exams
│   │   ├── questionRoutes.js     # Routes /api/questions
│   │   ├── resultRoutes.js       # Routes /api/results
│   │   └── userRoutes.js         # Routes /api/users
│   ├── db/
│   │   └── initDb.js             # Script tự động import schema vào MySQL
│   ├── server.js                 # Khởi chạy Express server
│   ├── package.json
│   ├── .env.example
│   └── .env
│
├── frontend/
│   ├── css/
│   │   └── style.css             # Giao diện chính đồng bộ toàn website
│   ├── js/
│   │   └── auth.js               # Quản lý phiên đăng nhập & gọi API
│   ├── index.html                # Trang chủ giới thiệu
│   ├── login.html                # Trang đăng nhập
│   ├── register.html             # Trang đăng ký
│   ├── exams.html                # Danh sách các đề thi
│   ├── exam-detail.html          # Chi tiết thông tin & thể lệ đề thi
│   ├── quiz.html                 # Phòng thi: Làm bài, đếm giờ, nộp bài
│   ├── result.html               # Kết quả bài thi & xem lại đáp án chi tiết
│   ├── history.html              # Lịch sử các lần thi của thí sinh
│   ├── admin.html                # Bảng điều khiển quản trị (Admin Dashboard)
│   ├── admin-exams.html          # Quản lý đề thi (CRUD)
│   ├── admin-questions.html      # Quản lý câu hỏi & các đáp án A-B-C-D
│   └── admin-results.html        # Xem kết quả thi của tất cả thí sinh
│
├── database/
│   └── schema.sql                # Script tạo bảng và nạp sẵn dữ liệu mẫu
│
├── .gitignore
└── README.md
```

---

## 3. Yêu cầu môi trường

1. **Node.js**: Phiên bản 18 trở lên (đã kiểm tra tương thích tốt với Node 20 & 24).
2. **MySQL Server**: Phiên bản 8.0 trở lên hoặc MariaDB (đang chạy trên cổng `3306`).

---

## 4. Hướng dẫn cài đặt và khởi chạy

### Bước 1: Cài đặt Dependencies cho Backend

Mở terminal tại thư mục gốc của dự án hoặc thư mục `backend`:

```powershell
cd backend
npm install
```

### Bước 2: Cấu hình biến môi trường Database (.env)

Mở tập tin [backend/.env](file:///c:/Users/Admin/OneDrive/Desktop/H%E1%BB%87%20th%E1%BB%91ng%20Quiz%20-%20Thi%20tr%E1%BA%AFc%20nghi%E1%BB%87m/backend/.env) và cập nhật mật khẩu root MySQL trên máy tính của bạn:

```env
PORT=5000
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=YOUR_MYSQL_PASSWORD_HERE
DB_NAME=quiz_system
JWT_SECRET=quiz_system_super_secret_jwt_key_2026
```
*(Nếu MySQL của bạn không đặt mật khẩu, hãy để trống `DB_PASSWORD=`)*.

### Bước 3: Khởi tạo Cơ sở dữ liệu và nạp dữ liệu mẫu

Có 2 cách thực hiện:

* **Cách 1 (Tự động nhanh nhất qua lệnh Node.js)**:
  Tại thư mục `backend`, chạy lệnh:
  ```powershell
  npm run init-db
  ```
  *(Script sẽ tự động đọc [database/schema.sql](file:///c:/Users/Admin/OneDrive/Desktop/H%E1%BB%87%20th%E1%BB%91ng%20Quiz%20-%20Thi%20tr%E1%BA%AFc%20nghi%E1%BB%87m/database/schema.sql), tạo database `quiz_system`, tạo 6 bảng dữ liệu và chèn sẵn 3 đề thi mẫu).*

* **Cách 2 (Sử dụng MySQL Workbench / phpMyAdmin / MySQL CLI)**:
  Mở phpMyAdmin hoặc MySQL Workbench, copy toàn bộ nội dung file [database/schema.sql](file:///c:/Users/Admin/OneDrive/Desktop/H%E1%BB%87%20th%E1%BB%91ng%20Quiz%20-%20Thi%20tr%E1%BA%AFc%20nghi%E1%BB%87m/database/schema.sql) và bấm **Execute / Go**.

### Bước 4: Khởi động hệ thống

Tại thư mục `backend`, chạy:

```powershell
npm start
```
(Hoặc chạy `npm run dev` nếu muốn tự động reload khi sửa code với nodemon).

Mở trình duyệt web và truy cập địa chỉ:
👉 **`http://localhost:5000`**

*(Backend đã được tích hợp phục vụ trực tiếp toàn bộ trang Frontend HTML/CSS/JS mà không cần chạy thêm server phụ).*

---

## 5. Tài khoản thử nghiệm có sẵn

Hệ thống đã nạp sẵn 2 tài khoản mẫu trong Database:

| Nhóm người dùng | Tên đăng nhập (Username) | Mật khẩu (Password) | Quyền hạn |
| :--- | :--- | :--- | :--- |
| **Quản trị viên** | `admin` | `admin123` | ADMIN (Quản lý đề, câu hỏi, xem tất cả bài thi) |
| **Học viên** | `sinhvien` | `user123` | USER (Xem đề, làm bài, xem điểm, xem lời giải) |

*(Bạn cũng có thể tự đăng ký tài khoản học viên mới tại trang Đăng Ký).*

---

## 6. Danh sách RESTful API chính

### 🔐 Authentication (`/api/auth`)
* `POST /api/auth/register`: Đăng ký tài khoản người dùng mới.
* `POST /api/auth/login`: Đăng nhập, trả về JWT Token và thông tin User.
* `GET /api/auth/me`: Lấy thông tin tài khoản đang đăng nhập từ Token.

### 📝 Exams (`/api/exams`)
* `GET /api/exams`: Lấy danh sách tất cả đề thi kèm số lượng câu hỏi.
* `GET /api/exams/:id`: Lấy thông tin chi tiết một đề thi.
* `GET /api/exams/:id/questions`: Lấy danh sách câu hỏi phục vụ làm bài (User không thấy đáp án đúng; Admin thấy toàn bộ).
* `POST /api/exams/:id/submit`: Nộp bài thi, đối chiếu đáp án trong DB, tính điểm và lưu kết quả.
* `POST /api/exams`: *(Admin)* Tạo đề thi mới.
* `PUT /api/exams/:id`: *(Admin)* Cập nhật đề thi.
* `DELETE /api/exams/:id`: *(Admin)* Xóa đề thi (tự động xóa kèm câu hỏi & kết quả liên quan).

### ❓ Questions (`/api/questions`)
* `GET /api/questions/:id`: Chi tiết 1 câu hỏi và các đáp án A, B, C, D.
* `POST /api/questions`: *(Admin)* Thêm câu hỏi và 4 đáp án vào đề thi.
* `PUT /api/questions/:id`: *(Admin)* Cập nhật câu hỏi và đáp án.
* `DELETE /api/questions/:id`: *(Admin)* Xóa câu hỏi khỏi đề thi.

### 📊 Results (`/api/results` & `/api/users`)
* `GET /api/results`: Lấy danh sách kết quả (User chỉ thấy của mình, Admin thấy của mọi thí sinh).
* `GET /api/results/:id`: Xem chi tiết kết quả một bài thi (từng câu đúng hay sai, bạn đã chọn câu nào, đáp án đúng là câu nào).
* `GET /api/results/stats/summary`: *(Admin)* Thống kê tổng số đề, câu hỏi, lượt thi và điểm trung bình.
* `GET /api/users/:id/results`: Lấy lịch sử thi của thí sinh theo ID.
