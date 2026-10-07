# HỆ THỐNG THI TRẮC NGHIỆM TRỰC TUYẾN (QUIZ SYSTEM)

Hệ thống thi trắc nghiệm trực tuyến hỗ trợ đa dạng 5 loại câu hỏi (Trắc nghiệm 1 đáp án, Chọn nhiều đáp án, Đúng/Sai, Điền vào chỗ trống, Phân loại nhóm).

---

## 1. Kiến trúc Hệ thống (Commit 1: Nginx Reverse Proxy + HTTPS + Security Headers)

Hệ thống được thiết kế theo mô hình Microservices an toàn với **Nginx Reverse Proxy** tiếp nhận traffic từ trình duyệt, phục vụ HTTPS và bảo vệ các service bên trong:

```text
       Client Browser
             │
             │ HTTPS (:443)  [HTTP:80 tự động Redirect 301 sang 443]
             ▼
┌────────────────────────────────────────────────────────┐
│               quiz_proxy (Nginx Reverse Proxy)         │
│  - SSL/TLS Termination (Self-Signed Certificate)       │
│  - Security Headers: X-Content-Type-Options, CSP,...   │
└───────────────────────────┬────────────────────────────┘
                            │ (quiz_system_network)
             ┌──────────────┴──────────────┐
             ▼                             ▼
┌─────────────────────────┐   ┌─────────────────────────┐
│      quiz_frontend      │   │      quiz_backend       │
│  Nginx Alpine tĩnh      │   │   Node.js v20 Express   │
│  (Port 80 nội bộ)       │   │   (Port 5000 nội bộ)    │
└─────────────────────────┘   └────────────┬────────────┘
                                           │
                                           ▼
┌─────────────────────────┐   ┌─────────────────────────┐
│     quiz_phpmyadmin     │──>│       quiz_mysql        │
│  Port 8088 (Host)       │   │   MySQL 8.0 (Port 3308) │
└─────────────────────────┘   └─────────────────────────┘
```

* **Frontend**: HTML5, CSS3, Vanilla JS chạy qua Web Server Nginx nội bộ (không expose trực tiếp ra ngoài Internet).
* **Backend**: Node.js v20 Express RESTful API chạy nội bộ (không expose trực tiếp ra ngoài Internet).
* **Nginx Reverse Proxy**: Nhận traffic từ port 80/443, tự động chuyển tiếp `/` tới frontend và `/api/` tới backend.
* **Database**: MySQL 8.0 với volume persistent `quiz_mysql_data`.
* **phpMyAdmin**: Quản trị database trực quan trên cổng 8088.

---

## 2. Cấu trúc thư mục dự án

```text
Hệ thống Quiz - Thi trắc nghiệm/
├── nginx/
│   ├── nginx.conf            # Cấu hình Reverse Proxy, SSL HTTPS, Security Headers
│   └── certs/
│       ├── nginx.crt         # SSL Certificate (Self-signed)
│       └── nginx.key         # SSL Private Key
├── backend/
│   ├── config/               # Cấu hình kết nối MySQL
│   ├── controllers/          # Logic xử lý (auth, exams, questions, results, users)
│   ├── routes/               # Express routing (/api/*)
│   ├── server.js             # Entrypoint backend Express
│   ├── Dockerfile            # Dockerfile backend (Node.js Alpine)
│   └── package.json
├── frontend/
│   ├── css/                  # CSS thiết kế giao diện
│   ├── js/                   # Vanilla JS xử lý logic & gọi API
│   ├── *.html                # Các trang giao diện
│   ├── nginx.conf            # Nginx config phục vụ static files nội bộ
│   └── Dockerfile            # Dockerfile frontend
├── database/
│   └── schema.sql            # Script tự động import schema & dữ liệu khởi tạo
├── docker-compose.yml        # Docker Compose định nghĩa 5 services & network
├── .env.example              # Mẫu biến môi trường an toàn
├── .gitignore
└── README.md
```

---

## 3. Hướng dẫn khởi chạy hệ thống (Docker Compose)

### Bước 1: Chuẩn bị biến môi trường
Tạo file `.env` tại thư mục gốc từ file mẫu `.env.example`:

```bash
# Trên Windows (PowerShell):
Copy-Item .env.example .env

# Trên Linux / macOS:
cp .env.example .env
```

### Bước 2: Tạo SSL Certificate (Nếu cần tạo mới)
Chứng chỉ SSL mẫu cho `localhost` đã được tạo sẵn trong thư mục `nginx/certs/`. Nếu bạn muốn tạo lại chứng chỉ mới bằng OpenSSL:

```bash
docker run --rm -v "${PWD}/nginx/certs:/certs" alpine sh -c "apk add --no-cache openssl && openssl req -x509 -nodes -days 365 -newkey rsa:2048 -keyout /certs/nginx.key -out /certs/nginx.crt -subj '/C=VN/ST=Hanoi/L=Hanoi/O=QuizSystem/OU=IT/CN=localhost'"
```

### Bước 3: Khởi chạy toàn bộ hệ thống

Tại thư mục gốc dự án, thực hiện lệnh:

```bash
docker compose up -d --build
```

### Bước 4: Kiểm tra trạng thái các container

```bash
docker compose ps
```

Kết quả hiển thị đầy đủ 5 container:
* `quiz_proxy` (Up - Ports: `80`, `443`)
* `quiz_frontend` (Up - Port `80/tcp` nội bộ)
* `quiz_backend` (Up - Port `5000/tcp` nội bộ)
* `quiz_mysql` (Up healthy - Port `3308->3306`)
* `quiz_phpmyadmin` (Up - Port `8088->80`)

---

## 4. Địa chỉ truy cập các dịch vụ

| Dịch vụ | Địa chỉ URL | Mô tả |
| :--- | :--- | :--- |
| **Website (HTTPS)** | [https://localhost](https://localhost) | Truy cập chính thức bảo mật qua Nginx Reverse Proxy |
| **Website (HTTP redirect)** | [http://localhost](http://localhost) | Tự động chuyển hướng (Redirect 301) sang HTTPS |
| **Backend API qua Proxy** | [https://localhost/api/health](https://localhost/api/health) | API gọi qua đường dẫn HTTPS an toàn |
| **phpMyAdmin** | [http://localhost:8088](http://localhost:8088) | Quản trị CSDL (Server: `mysql`, User: `root`) |

> **Lưu ý về trình duyệt:** Do sử dụng chứng chỉ tự ký (Self-signed certificate) cho môi trường nội bộ demo môn học, trình duyệt sẽ hiển thị cảnh báo *"Kết nối của bạn không phải là kết nối riêng tư"* (Your connection is not private). Bạn chỉ cần chọn **Nâng cao (Advanced) -> Tiếp tục truy cập localhost (Proceed to localhost)** để vào website bình thường.

---

## 5. Hướng dẫn kiểm tra nghiệm thu (Test Checklist)

### 1. Kiểm tra HTTP tự động chuyển hướng sang HTTPS (301 Redirect):
```bash
curl -I http://localhost
```
*Kết quả:* Trả về `HTTP/1.1 301 Moved Permanently` cùng header `Location: https://localhost/`.

### 2. Kiểm tra Security Headers trên HTTPS:
```bash
curl -k -I https://localhost
```
*Kết quả:* Trả về đầy đủ các headers bảo mật:
* `X-Content-Type-Options: nosniff`
* `X-Frame-Options: SAMEORIGIN`
* `X-XSS-Protection: 1; mode=block`
* `Referrer-Policy: strict-origin-when-cross-origin`
* `Content-Security-Policy: default-src 'self' 'unsafe-inline' 'unsafe-eval' data: blob:;`

### 3. Kiểm tra các chức năng ứng dụng:
1. Đăng nhập với tài khoản:
   - Học viên: `sinhvien` / `user123`
   - Quản trị viên: `admin` / `admin123`
2. Làm bài thi, nộp bài và xem điểm: Chạy mượt mà qua giao thức HTTPS.
3. phpMyAdmin truy cập bình thường tại `http://localhost:8088`.
