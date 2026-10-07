# HỆ THỐNG THI TRẮC NGHIỆM TRỰC TUYẾN (QUIZ SYSTEM)

Hệ thống thi trắc nghiệm trực tuyến hỗ trợ đa dạng 5 loại câu hỏi (Trắc nghiệm 1 đáp án, Chọn nhiều đáp án, Đúng/Sai, Điền vào chỗ trống, Phân loại nhóm).

---

## 1. Kiến trúc Hệ thống (Commit 2: Reverse Proxy + HTTPS + Prometheus + Grafana + cAdvisor)

Hệ thống tích hợp đầy đủ ngăn xếp ứng dụng, proxy bảo mật và giám sát metrics thời gian thực:

```text
       Trình duyệt (Browser)
                │
                │ HTTPS :443   [HTTP :80 tự động Redirect 301 sang 443]
                ▼
┌────────────────────────────────────────────────────────┐
│            quiz_proxy (Nginx Reverse Proxy)            │
│  - SSL/TLS Termination (Self-signed cert cho localhost)│
│  - Cấu hình Security Headers                           │
└───────────────────────────┬────────────────────────────┘
                            │ (quiz_system_network)
             ┌──────────────┴──────────────┐
             ▼                             ▼
┌─────────────────────────┐   ┌─────────────────────────┐
│      quiz_frontend      │   │      quiz_backend       │
│  Nginx Alpine tĩnh      │   │   Node.js Express API   │
│  (Port 80 nội bộ)       │   │   - Metrics (/metrics)  │
└─────────────────────────┘   └────────┬───────┬────────┘
                                       │       │
                        ┌──────────────┘       ▼
                        │             ┌─────────────────┐
                        │             │   quiz_mysql    │
                        │             │   MySQL 8.0     │
                        │             └────────▲────────┘
                        ▼                      │
             ┌─────────────────────┐  ┌────────┴────────┐
             │   quiz_prometheus   │  │ quiz_phpmyadmin │
             │   Metrics Scraper   │  │ Port 8088 (Host)│
             └──────────▲──────────┘  └─────────────────┘
                        │
       ┌────────────────┴────────────────┐
       │                                 │
┌──────┴──────────────┐       ┌──────────┴──────────┐
│    quiz_cadvisor    │       │    quiz_grafana     │
│ Docker Metrics (CPU,│       │ Dashboards (Port    │
│  RAM, Disk, Network)│       │ 3001) Auto-provision│
└─────────────────────┘       └─────────────────────┘
```

---

## 2. Cấu trúc thư mục dự án

```text
Hệ thống Quiz - Thi trắc nghiệm/
├── monitoring/
│   ├── prometheus/
│   │   └── prometheus.yml                  # Scrape config (Prometheus, cAdvisor, Node.js)
│   └── grafana/
│       ├── provisioning/
│       │   ├── datasources/datasource.yml  # Tự động nạp Prometheus Data Source
│       │   └── dashboards/dashboard-provider.yml
│       └── dashboards/
│           └── quiz-system-dashboard.json  # Dashboard dựng sẵn: CPU, RAM, API Traffic
├── nginx/
│   ├── nginx.conf                          # Reverse Proxy, SSL HTTPS, Security Headers
│   └── certs/
│       ├── nginx.crt                       # SSL Certificate (Self-signed)
│       └── nginx.key                       # SSL Private Key
├── backend/
│   ├── config/                             # Cấu hình kết nối MySQL
│   ├── controllers/                        # Logic xử lý nghiệp vụ
│   ├── routes/                             # Express routing (/api/*)
│   ├── server.js                           # Entrypoint Express + prom-client metrics
│   ├── Dockerfile                          # Dockerfile backend (Node.js Alpine)
│   └── package.json
├── frontend/
│   ├── css/ & js/                          # Giao diện & logic Vanilla JS
│   ├── *.html                              # Các trang thi & quản trị
│   ├── nginx.conf                          # Nginx config phục vụ static files nội bộ
│   └── Dockerfile                          # Dockerfile frontend
├── database/
│   └── schema.sql                          # Database schema & dữ liệu khởi tạo
├── docker-compose.yml                      # Định nghĩa 8 services & volume & network
├── .env.example                            # Mẫu biến môi trường an toàn
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

### Bước 2: Khởi chạy toàn bộ hệ thống

Tại thư mục gốc dự án, thực hiện lệnh:

```bash
docker compose up -d --build
```

### Bước 3: Kiểm tra trạng thái các container

```bash
docker compose ps
```

Kết quả hiển thị đầy đủ 8 containers:
* `quiz_proxy`: Nginx Reverse Proxy (Up - Ports: `80`, `443`)
* `quiz_frontend`: Frontend Web (Up - Port `80/tcp` nội bộ)
* `quiz_backend`: Node.js API (Up - Port `5000/tcp` nội bộ)
* `quiz_mysql`: MySQL 8.0 (Up healthy - Port `3308->3306`)
* `quiz_phpmyadmin`: phpMyAdmin (Up - Port `8088->80`)
* `quiz_prometheus`: Prometheus Server (Up - Port `9091->9090`)
* `quiz_cadvisor`: cAdvisor Container Metrics (Up)
* `quiz_grafana`: Grafana Dashboard (Up - Port `3001->3000`)

---

## 4. Địa chỉ truy cập các dịch vụ

| Dịch vụ | Địa chỉ URL | Tài khoản / Ghi chú |
| :--- | :--- | :--- |
| **Website chính (HTTPS)** | [https://localhost](https://localhost) | Cổng 443 có SSL bảo mật |
| **Website (HTTP redirect)** | [http://localhost](http://localhost) | Tự động chuyển hướng (Redirect 301) sang HTTPS |
| **phpMyAdmin** | [http://localhost:8088](http://localhost:8088) | Quản trị CSDL (Server: `mysql`, User: `root`) |
| **Prometheus** | [http://localhost:9091](http://localhost:9091) | Xem trạng thái targets & truy vấn PromQL |
| **Grafana** | [http://localhost:3001](http://localhost:3001) | **User:** `admin` \| **Pass:** `admin123` |

---

## 5. Giám sát hệ thống (Monitoring Guide)

### A. Kiểm tra Prometheus Targets
Truy cập [http://localhost:9091/targets](http://localhost:9091/targets) để kiểm tra các mục scrape:
1. `prometheus` (`http://localhost:9090/metrics`): **UP**
2. `cadvisor` (`http://cadvisor:8080/metrics`): **UP**
3. `quiz_backend` (`http://backend:5000/metrics`): **UP**

### B. Truy cập Grafana Dashboard
1. Truy cập [http://localhost:3001](http://localhost:3001), đăng nhập với `admin` / `admin123`.
2. Data Source `Prometheus` đã được cấu hình tự động (Provisioning) sẵn sàng.
3. Vào menu **Dashboards** $\rightarrow$ chọn **Quiz System Monitoring Dashboard**:
   - **Tổng Containers Đang Chạy**: Giám sát số container active thời gian thực.
   - **Trạng Thái Backend API**: Gauge tình trạng sống (1 = UP).
   - **CPU Usage Từng Container**: Biểu đồ % CPU tiêu thụ của từng container (cAdvisor).
   - **Bộ Nhớ RAM Từng Container**: Biểu đồ dung lượng RAM chiếm dụng (cAdvisor).
   - **Lưu Lượng Requests HTTP/s (API Traffic)**: Biểu đồ tốc độ request theo router và method (`prom-client`).
   - **Bộ Nhớ Heap Node.js Runtime**: Giám sát Heap Used / Heap Total của Node.js.

---

## 6. Hướng dẫn kiểm tra nghiệm thu (Test Checklist)

1. **Kiểm tra HTTPS & Security Headers**:
   ```bash
   curl -k -I https://localhost
   ```
   *Kết quả:* Trả về HTTP 200 kèm `X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`, `Content-Security-Policy`,...
2. **Kiểm tra chức năng ứng dụng**:
   - Đăng nhập học sinh (`sinhvien` / `user123`) hoặc admin (`admin` / `admin123`).
   - Làm bài thi trắc nghiệm, nộp bài, tính điểm tự động lưu DB bình thường.
3. **Kiểm tra phpMyAdmin**: Mở `http://localhost:8088` kết nối thành công tới MySQL `quiz_mysql`.
4. **Kiểm tra Prometheus & Grafana**: Mở `http://localhost:9091` và `http://localhost:3001` hoạt động trơn tru.
