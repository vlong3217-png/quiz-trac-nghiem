# HỆ THỐNG THI TRẮC NGHIỆM TRỰC TUYẾN (QUIZ SYSTEM)

Hệ thống thi trắc nghiệm trực tuyến hỗ trợ đa dạng 5 loại câu hỏi (Trắc nghiệm 1 đáp án, Chọn nhiều đáp án, Đúng/Sai, Điền vào chỗ trống, Phân loại nhóm).

---

## 1. Kiến trúc Hệ thống (Commit 3: Nginx Proxy + HTTPS + Prometheus + Grafana + cAdvisor + Loki + Promtail)

Hệ thống kết hợp ngăn xếp ứng dụng, bảo mật và toàn bộ hạ tầng giám sát Metrics & Log tập trung:

```text
       Trình duyệt (Browser)
                │
                │ HTTPS :443   [HTTP :80 tự động Redirect 301 sang 443]
                ▼
┌────────────────────────────────────────────────────────┐
│            quiz_proxy (Nginx Reverse Proxy)            │
│  - SSL/TLS Termination (HTTPS)                         │
│  - Security Headers                                    │
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
       ┌────────────────┴────────────────────────┐
       │                                         │
┌──────┴──────────────┐               ┌──────────┴──────────┐
│    quiz_cadvisor    │               │    quiz_grafana     │
│ Docker Metrics (CPU,│               │ Metrics & Logs      │
│  RAM, Disk, Network)│               │ Dashboard (:3001)   │
└─────────────────────┘               └──────────▲──────────┘
                                                 │
                                                 │ LogQL
                                      ┌──────────┴──────────┐
                                      │      quiz_loki      │
                                      │ Log Aggregator      │
                                      │ (Port 3101 nội bộ)  │
                                      └──────────▲──────────┘
                                                 │
                                                 │ Push logs
                                      ┌──────────┴──────────┐
                                      │    quiz_promtail    │
                                      │ Đọc Docker logs qua │
                                      │ /var/run/docker.sock│
                                      └─────────────────────┘
```

---

## 2. Cấu trúc thư mục dự án

```text
Hệ thống Quiz - Thi trắc nghiệm/
├── monitoring/
│   ├── loki/
│   │   └── loki-config.yml                 # Cấu hình lưu trữ & schema Loki (TSDB)
│   ├── promtail/
│   │   └── promtail-config.yml             # Cấu hình Promtail đọc Docker container logs
│   ├── prometheus/
│   │   └── prometheus.yml                  # Scrape config (Prometheus, cAdvisor, Node.js)
│   └── grafana/
│       ├── provisioning/
│       │   ├── datasources/datasource.yml  # Tự động nạp Prometheus & Loki Data Sources
│       │   └── dashboards/dashboard-provider.yml
│       └── dashboards/
│           └── quiz-system-dashboard.json  # Dashboard: Metrics + Live Logs Panel
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
├── docker-compose.yml                      # Định nghĩa 10 services & volume & network
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
docker compose up -d
```

*(Hoặc `docker compose up -d --build` khi cần build lại hình ảnh).*

### Bước 3: Kiểm tra trạng thái các container

```bash
docker compose ps
```

Toàn bộ **10 containers** sẽ hiển thị trạng thái `Up`:
* `quiz_proxy`: Nginx Reverse Proxy (Up - Ports: `80`, `443`)
* `quiz_frontend`: Frontend Web (Up - Port `80/tcp` nội bộ)
* `quiz_backend`: Node.js API (Up - Port `5000/tcp` nội bộ)
* `quiz_mysql`: MySQL 8.0 (Up healthy - Port `3308->3306`)
* `quiz_phpmyadmin`: phpMyAdmin (Up - Port `8088->80`)
* `quiz_prometheus`: Prometheus Server (Up - Port `9091->9090`)
* `quiz_cadvisor`: cAdvisor Container Metrics (Up healthy)
* `quiz_grafana`: Grafana Dashboard (Up - Port `3001->3000`)
* `quiz_loki`: Loki Log Store (Up - Port `3101->3100`)
* `quiz_promtail`: Promtail Log Shipper (Up)

---

## 4. Địa chỉ truy cập các dịch vụ

| Dịch vụ | Địa chỉ URL | Tài khoản / Ghi chú |
| :--- | :--- | :--- |
| **Website chính (HTTPS)** | [https://localhost](https://localhost) | Cổng 443 có SSL bảo mật |
| **Website (HTTP redirect)** | [http://localhost](http://localhost) | Tự động chuyển hướng (Redirect 301) sang HTTPS |
| **phpMyAdmin** | [http://localhost:8088](http://localhost:8088) | Quản trị CSDL (Server: `mysql`, User: `root`) |
| **Prometheus** | [http://localhost:9091](http://localhost:9091) | Xem trạng thái scrape targets & query PromQL |
| **Grafana** | [http://localhost:3001](http://localhost:3001) | **User:** `admin` \| **Pass:** `admin123` |
| **Loki API** | `http://loki:3100` (Nội bộ Docker) \| [http://localhost:3101](http://localhost:3101) (Host) | Tiếp nhận & phân tích LogQL |

---

## 5. Hướng dẫn Giám sát Log tập trung (Loki + Promtail + LogQL)

### A. Vai trò của Loki & Promtail trong hệ thống
* **Promtail**: Là log shipper đóng vai trò thu thập log liên tục từ Docker socket (`/var/run/docker.sock`) của tất cả các container (`quiz_backend`, `quiz_proxy`, `quiz_mysql`,...), tự động gán nhãn metadata (`container`, `service`, `job`), sau đó đẩy log qua mạng Docker về Loki.
* **Loki**: Đóng vai trò là log aggregation server (tương tự như Prometheus nhưng dành cho log), đánh chỉ mục nhãn và lưu trữ an toàn log trong volume Docker `quiz_loki_data`.

### B. Cách truy cập và tra cứu LogQL trong Grafana
1. Đăng nhập Grafana tại [http://localhost:3001](http://localhost:3001) (`admin` / `admin123`).
2. Vào biểu tượng menu **Explore** (hình la bàn ở thanh bên trái).
3. Ở dropdown chọn Data Source phía trên góc trái, chọn **Loki** (hệ thống đã nạp sẵn tự động cả 2 Data Sources: `Prometheus` và `Loki`).
4. Nhập câu truy vấn LogQL vào ô tìm kiếm và bấm **Run query**.

### C. 3 Truy vấn LogQL cơ bản đã kiểm tra thành công

#### 🔍 Query 1: Xem toàn bộ log của Backend API
```logql
{container="quiz_backend"}
```
* **Ý nghĩa:** Lọc toàn bộ luồng log xuất ra từ container `quiz_backend` (bao gồm các request API, trạng thái kết nối MySQL, và các tiến trình Express runtime).

#### 🔍 Query 2: Lọc các log lỗi hoặc kiểm tra lỗi của Backend
```logql
{container="quiz_backend"} |= "error"
```
* **Ý nghĩa:** Lọc các dòng log trong container `quiz_backend` có chứa từ khóa `"error"` (không phân biệt ngữ cảnh), giúp quản trị viên truy vết nhanh chóng các request lỗi, exception hoặc HTTP 4xx/5xx.

#### 🔍 Query 3: Xem log truy cập và cảnh báo của Nginx Reverse Proxy
```logql
{container="quiz_proxy"}
```
* **Ý nghĩa:** Lọc toàn bộ log truy cập (access log) và log lỗi (error log) của Nginx Reverse Proxy `quiz_proxy`, bao gồm IP client, phương thức HTTP, mã HTTP status code (200, 301, 404, 502) và đường dẫn URL truy cập.

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
3. **Kiểm tra phpMyAdmin**: Mở `http://localhost:8088` kết nối thành công tới MySQL `quiz_mysql` (chỉ lắng nghe nội bộ máy chủ `127.0.0.1`).
4. **Kiểm tra Prometheus & Grafana**: Mở `http://localhost:9091` và `http://localhost:3001` hoạt động trơn tru.
5. **Kiểm tra Loki & LogQL**: Mở Grafana Explore $\rightarrow$ chọn Data Source `Loki` $\rightarrow$ chạy 3 câu truy vấn LogQL ở mục 5.

---

## 7. Báo cáo Tăng cường Bảo mật (Security Hardening)

Hệ thống đã được củng cố bảo mật toàn diện trên toàn bộ các tầng kiến trúc:
* **Docker Hardening**: 
  - Backend chạy dưới quyền non-root (`USER node`, UID 1000).
  - Thêm `no-new-privileges:true` ngăn chặn leo thang đặc quyền cho toàn bộ các dịch vụ trọng yếu.
  - Cổng MySQL (3308) và phpMyAdmin (8088) được giới hạn loopback `127.0.0.1`, không phơi bày ra mạng bên ngoài.
* **MySQL Least Privilege**:
  - Tạo người dùng riêng `quiz_user` với quyền tối thiểu (`SELECT`, `INSERT`, `UPDATE`, `DELETE`) thay vì cấp quyền `root`.
* **Backend Security**:
  - Tắt `X-Powered-By: Express` tránh lộ fingerprint công nghệ.
  - Giới hạn body payload `1MB` chống tấn công DoS/ReDoS.
  - Che giấu toàn bộ `error.message` và stack trace phía API response, chỉ ghi nhận chi tiết tại server log.
* **Nginx Hardening**:
  - Bật `server_tokens off;` ẩn phiên bản Nginx.
  - Giới hạn `client_max_body_size 10M;`.
  - Thiết lập đầy đủ HTTP Security Headers (`nosniff`, `SAMEORIGIN`, `Permissions-Policy`, `CSP`, `Referrer-Policy`).

