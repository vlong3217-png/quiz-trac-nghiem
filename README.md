# HỆ THỐNG THI TRẮC NGHIỆM TRỰC TUYẾN (QUIZ SYSTEM)

Hệ thống thi trắc nghiệm trực tuyến hỗ trợ đa dạng 5 loại câu hỏi (Trắc nghiệm 1 đáp án, Chọn nhiều đáp án, Đúng/Sai, Điền vào chỗ trống, Phân loại nhóm).

---

## 1. Kiến trúc & Công nghệ

* **Frontend**: HTML5, CSS3, Vanilla JavaScript, chạy qua Web Server **Nginx** (Alpine).
* **Backend**: Node.js v20 (Alpine), Express.js RESTful API.
* **Database**: **MySQL 8.0** (InnoDB, utf8mb4_unicode_ci, persistent volume).
* **Database Management**: **phpMyAdmin** giao diện web quản lý DB trực quan.
* **Orchestration**: **Docker** & **Docker Compose** với network biệt lập.

---

## 2. Cấu trúc thư mục dự án

```text
Hệ thống Quiz - Thi trắc nghiệm/
├── backend/
│   ├── config/               # Cấu hình Pool kết nối MySQL
│   ├── controllers/          # Business logic (auth, exams, questions, results, users)
│   ├── middleware/           # Middleware xác thực JWT
│   ├── routes/               # Express routing (/api/*)
│   ├── db/                   # Script khởi tạo DB
│   ├── server.js             # Entrypoint backend Express
│   ├── Dockerfile            # Dockerfile backend (Node.js Alpine)
│   ├── .dockerignore
│   └── package.json
├── frontend/
│   ├── css/                  # CSS thiết kế giao diện
│   ├── js/                   # Vanilla JS xử lý logic & gọi API
│   ├── *.html                # Các trang giao diện người dùng & quản trị
│   ├── nginx.conf            # Cấu hình Nginx Web Server & Reverse Proxy /api/
│   ├── Dockerfile            # Dockerfile frontend (Nginx Alpine)
│   └── .dockerignore
├── database/
│   └── schema.sql            # Script tự động import schema & dữ liệu khởi tạo
├── docker-compose.yml        # Docker Compose cấu hình 4 services
├── .env.example              # File mẫu biến môi trường (an toàn, không chứa pass thật)
├── .gitignore
└── README.md
```

---

## 3. Hướng dẫn khởi chạy bằng Docker (Khuyên dùng)

### Bước 1: Chuẩn bị biến môi trường
Tạo file `.env` tại thư mục gốc từ file mẫu `.env.example`:

```bash
# Trên Linux / macOS:
cp .env.example .env

# Trên Windows (PowerShell):
Copy-Item .env.example .env
```

Nếu muốn, bạn có thể chỉnh sửa mật khẩu `DB_PASSWORD` và `DB_ROOT_PASSWORD` trong file `.env`. Mặc định đã thiết lập an toàn cho môi trường test.

### Bước 2: Khởi chạy toàn bộ hệ thống bằng Docker Compose

Tại thư mục gốc dự án, thực hiện lệnh:

```bash
docker compose up -d --build
```

Lệnh này sẽ tự động:
1. Tạo Docker Network riêng `quiz_system_network`.
2. Khởi động container MySQL `quiz_mysql` và tự động nạp toàn bộ cấu trúc bảng + dữ liệu mẫu từ `database/schema.sql`.
3. Build và khởi động container Backend `quiz_backend` kết nối tới MySQL thông qua DNS nội bộ service `mysql`.
4. Build và khởi động container Frontend `quiz_frontend` với Nginx phục vụ web và proxy ngược `/api/` về `backend:5000`.
5. Khởi động `quiz_phpmyadmin` để quản lý CSDL trực quan.

### Bước 3: Truy cập hệ thống

Sau khi khởi chạy thành công, mở trình duyệt:

| Dịch vụ | Địa chỉ URL | Ghi chú |
| :--- | :--- | :--- |
| **Giao diện Web (Frontend)** | [http://localhost](http://localhost) | Cổng 80 (chạy qua Nginx) |
| **Backend API** | [http://localhost:5000/api/health](http://localhost:5000/api/health) | Cổng 5000 (Node.js API) |
| **phpMyAdmin** | [http://localhost:8080](http://localhost:8080) | Server: `mysql`, User: `root` |

### Bước 4: Lệnh quản trị Docker hữu ích

* **Kiểm tra trạng thái các container**:
  ```bash
  docker compose ps
  ```
* **Xem nhật ký hoạt động (logs)**:
  ```bash
  docker compose logs -f
  # hoặc xem riêng từng service:
  docker compose logs -f backend
  ```
* **Dừng toàn bộ hệ thống**:
  ```bash
  docker compose down
  ```
* **Dừng và xóa cả dữ liệu volume MySQL (khi muốn reset database về ban đầu)**:
  ```bash
  docker compose down -v
  ```

---

## 4. Hướng dẫn chạy thủ công trên máy Local (Không dùng Docker)

Nếu muốn phát triển hoặc chạy trực tiếp không qua Docker:

1. **Cài đặt thư viện backend**:
   ```bash
   cd backend
   npm install
   ```
2. **Cấu hình database local**:
   Chỉnh sửa file `backend/.env` với thông số MySQL trên máy cá nhân (`DB_HOST=127.0.0.1`, mật khẩu MySQL cá nhân).
3. **Khởi tạo dữ liệu**:
   ```bash
   cd backend
   npm run init-db
   ```
4. **Khởi động server**:
   ```bash
   cd backend
   npm run dev   # hoặc npm start
   ```
   Truy cập: `http://localhost:5000`

---

## 5. Tài khoản thử nghiệm có sẵn

Hệ thống đã nạp sẵn 2 tài khoản mẫu trong cơ sở dữ liệu:

| Loại tài khoản | Tên đăng nhập (Username) | Mật khẩu (Password) | Quyền hạn |
| :--- | :--- | :--- | :--- |
| **Quản trị viên** | `admin` | `admin123` | ADMIN (Quản lý đề, câu hỏi, sinh viên, xem kết quả) |
| **Học viên** | `sinhvien` | `user123` | USER (Làm bài thi, xem điểm, lịch sử thi) |

*(Bạn cũng có thể tự tạo tài khoản học viên mới tại trang Đăng Ký).*

---

## 6. Các dạng câu hỏi được hỗ trợ

1. **Trắc nghiệm 1 đáp án** (`SINGLE_CHOICE`): 1 đáp án đúng duy nhất.
2. **Chọn nhiều đáp án** (`MULTIPLE_CHOICE`): Tích chọn checkbox từ 2 đáp án đúng trở lên.
3. **Đúng / Sai** (`TRUE_FALSE`): Chọn mệnh đề Đúng (True) hoặc Sai (False).
4. **Điền vào chỗ trống** (`FILL_BLANK`): Nhập từ/cụm từ ngắn, so khớp tự động không phân biệt hoa thường.
5. **Phân loại vào nhóm** (`CLASSIFICATION`): Phân loại danh sách các khái niệm/mục vào nhóm tương ứng.
