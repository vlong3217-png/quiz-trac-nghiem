-- ============================================================
-- ĐỀ TÀI 35: HỆ THỐNG QUIZ / THI TRẮC NGHIỆM
-- CƠ SỞ DỮ LIỆU: quiz_system
-- ============================================================

CREATE DATABASE IF NOT EXISTS `quiz_system` 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

USE `quiz_system`;

-- 1. BẢNG USERS (Người dùng hệ thống: ADMIN và USER)
DROP TABLE IF EXISTS `result_details`;
DROP TABLE IF EXISTS `results`;
DROP TABLE IF EXISTS `answers`;
DROP TABLE IF EXISTS `questions`;
DROP TABLE IF EXISTS `exams`;
DROP TABLE IF EXISTS `users`;

CREATE TABLE `users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `username` VARCHAR(50) NOT NULL UNIQUE,
  `email` VARCHAR(100) NOT NULL UNIQUE,
  `password` VARCHAR(255) NOT NULL,
  `role` ENUM('USER', 'ADMIN') NOT NULL DEFAULT 'USER',
  `class_name` VARCHAR(100) NULL COMMENT 'Lớp học',
  `school_name` VARCHAR(150) NULL COMMENT 'Trường học',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. BẢNG EXAMS (Đề thi trắc nghiệm)
CREATE TABLE `exams` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `title` VARCHAR(255) NOT NULL,
  `description` TEXT,
  `duration` INT NOT NULL COMMENT 'Thời gian thi tính bằng phút',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. BẢNG QUESTIONS (Câu hỏi theo đề thi)
CREATE TABLE `questions` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `exam_id` INT NOT NULL,
  `content` TEXT NOT NULL,
  `type` ENUM('SINGLE_CHOICE', 'MULTIPLE_CHOICE', 'TRUE_FALSE', 'FILL_BLANK', 'CLASSIFICATION') NOT NULL DEFAULT 'SINGLE_CHOICE',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_questions_exam` FOREIGN KEY (`exam_id`) 
    REFERENCES `exams` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. BẢNG ANSWERS (Các lựa chọn đáp án hoặc mục phân loại)
CREATE TABLE `answers` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `question_id` INT NOT NULL,
  `content` TEXT NOT NULL,
  `is_correct` TINYINT(1) NOT NULL DEFAULT 0,
  `match_target` VARCHAR(255) NULL COMMENT 'Nhóm/Thể loại đối với câu hỏi Phân loại',
  CONSTRAINT `fk_answers_question` FOREIGN KEY (`question_id`) 
    REFERENCES `questions` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. BẢNG RESULTS (Kết quả nộp bài thi)
CREATE TABLE `results` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `exam_id` INT NOT NULL,
  `score` DECIMAL(4, 2) NOT NULL COMMENT 'Thang điểm 10',
  `correct_answers` INT NOT NULL,
  `total_questions` INT NOT NULL,
  `submitted_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_results_user` FOREIGN KEY (`user_id`) 
    REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_results_exam` FOREIGN KEY (`exam_id`) 
    REFERENCES `exams` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. BẢNG RESULT_DETAILS (Chi tiết câu trả lời của thí sinh)
CREATE TABLE `result_details` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `result_id` INT NOT NULL,
  `question_id` INT NOT NULL,
  `selected_answer_id` INT NULL,
  `correct_answer_id` INT NULL,
  `user_answer_text` TEXT NULL COMMENT 'Lưu chuỗi JSON hoặc text đối với loại Điền từ, Nhiều đáp án, Phân loại',
  CONSTRAINT `fk_details_result` FOREIGN KEY (`result_id`) 
    REFERENCES `results` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_details_question` FOREIGN KEY (`question_id`) 
    REFERENCES `questions` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_details_selected_ans` FOREIGN KEY (`selected_answer_id`) 
    REFERENCES `answers` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_details_correct_ans` FOREIGN KEY (`correct_answer_id`) 
    REFERENCES `answers` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- DỮ LIỆU MẪU (SEED DATA)
-- ============================================================

-- Mật khẩu mặc định:
-- admin: admin123  ($2a$10$REmtCuGlirwyb7b8BNezOeT.P7ttYnPLbMfd3eR.l/ZcGjnY2f6De)
-- sinhvien: user123 ($2a$10$8sQNZKdSBFrfzz30N1ntVOi4f1AAhY5YtTYK6Bu6ugeQR2TZGLGVa)

INSERT INTO `users` (`id`, `username`, `email`, `password`, `role`) VALUES
(1, 'admin', 'admin@quizsystem.vn', '$2a$10$REmtCuGlirwyb7b8BNezOeT.P7ttYnPLbMfd3eR.l/ZcGjnY2f6De', 'ADMIN'),
(2, 'sinhvien', 'sinhvien@quizsystem.vn', '$2a$10$8sQNZKdSBFrfzz30N1ntVOi4f1AAhY5YtTYK6Bu6ugeQR2TZGLGVa', 'USER');

-- 3 Đề thi mẫu
INSERT INTO `exams` (`id`, `title`, `description`, `duration`) VALUES
(1, 'Đề 1: Kiến thức cơ bản về Linux & Quản trị Hệ thống', 'Kiểm tra hiểu biết cơ bản về lệnh Linux, quản trị tiến trình và dịch vụ hệ thống mạng.', 15),
(2, 'Đề 2: Nền tảng Mạng máy tính & Giao thức Web', 'Các kiến thức cốt lõi về mô hình OSI, TCP/IP, HTTP/HTTPS và DNS trong hệ thống mạng.', 20),
(3, 'Đề 3: Lập trình Web & Cơ sở dữ liệu Node.js - MySQL', 'Các câu hỏi về RESTful API, Express.js, cơ chế Async/Await và truy vấn MySQL.', 15);

-- ------------------------------------------------------------
-- CÂU HỎI & ĐÁP ÁN CHO ĐỀ 1 (5 câu, mỗi câu 4 đáp án A, B, C, D)
-- ------------------------------------------------------------
INSERT INTO `questions` (`id`, `exam_id`, `content`) VALUES
(1, 1, 'Lệnh nào trong Linux dùng để xem danh sách các tập tin và thư mục hiện tại?'),
(2, 1, 'Lệnh nào được dùng để kiểm tra địa chỉ IP mạng trên hầu hết hệ thống Linux hiện đại?'),
(3, 1, 'Trong Linux, quyền truy cập số 755 đối với một tập tin có ý nghĩa gì?'),
(4, 1, 'Lệnh nào dùng để theo dõi tài nguyên hệ thống (CPU, RAM, Processes) theo thời gian thực?'),
(5, 1, 'Thư mục nào trong hệ điều hành Linux chứa các tập tin cấu hình của toàn bộ hệ thống?');

INSERT INTO `answers` (`id`, `question_id`, `content`, `is_correct`) VALUES
(1, 1, 'cd', 0),
(2, 1, 'ls -la', 1),
(3, 1, 'pwd', 0),
(4, 1, 'mkdir', 0),

(5, 2, 'ip a hoặc ip addr', 1),
(6, 2, 'ping localhost', 0),
(7, 2, 'route -n', 0),
(8, 2, 'netstat -only', 0),

(9, 3, 'Chủ sở hữu có quyền Đọc, người khác toàn quyền', 0),
(10, 3, 'Chủ sở hữu đọc/ghi/thực thi (rwx), nhóm và người khác chỉ đọc/thực thi (r-x)', 1),
(11, 3, 'Tất cả mọi người đều có quyền ghi vào tập tin', 0),
(12, 3, 'Chỉ người dùng root mới có quyền đọc tập tin', 0),

(13, 4, 'top hoặc htop', 1),
(14, 4, 'ps -aux', 0),
(15, 4, 'free -m', 0),
(16, 4, 'df -h', 0),

(17, 5, '/dev', 0),
(18, 5, '/var/log', 0),
(19, 5, '/etc', 1),
(20, 5, '/bin', 0);

-- ------------------------------------------------------------
-- CÂU HỎI & ĐÁP ÁN CHO ĐỀ 2 (5 câu, mỗi câu 4 đáp án)
-- ------------------------------------------------------------
INSERT INTO `questions` (`id`, `exam_id`, `content`) VALUES
(6, 2, 'Cổng (Port) mặc định của giao thức HTTPS là bao nhiêu?'),
(7, 2, 'Giao thức nào chịu trách nhiệm phân giải tên miền (domain name) thành địa chỉ IP?'),
(8, 2, 'Mã trạng thái HTTP (Status Code) nào biểu thị yêu cầu thành công nhưng không có nội dung trả về?'),
(9, 2, 'Giao thức TCP khác giao thức UDP ở điểm cốt lõi nào sau đây?'),
(10, 2, 'Lớp nào trong mô hình OSI chịu trách nhiệm định tuyến (routing) gói tin qua mạng?');

INSERT INTO `answers` (`id`, `question_id`, `content`, `is_correct`) VALUES
(21, 6, '80', 0),
(22, 6, '443', 1),
(23, 6, '8080', 0),
(24, 6, '22', 0),

(25, 7, 'DHCP', 0),
(26, 7, 'DNS', 1),
(27, 7, 'FTP', 0),
(28, 7, 'ARP', 0),

(29, 8, '200 OK', 0),
(30, 8, '201 Created', 0),
(31, 8, '204 No Content', 1),
(32, 8, '304 Not Modified', 0),

(33, 9, 'TCP hướng kết nối và đảm bảo toàn vẹn dữ liệu, UDP không kết nối và tốc độ nhanh hơn', 1),
(34, 9, 'UDP hướng kết nối, TCP truyền dữ liệu không cần bắt tay', 0),
(35, 9, 'TCP chỉ dùng cho mạng LAN, UDP dùng cho Internet', 0),
(36, 9, 'Không có sự khác biệt giữa hai giao thức', 0),

(37, 10, 'Data Link Layer (Lớp liên kết dữ liệu)', 0),
(38, 10, 'Network Layer (Lớp mạng)', 1),
(39, 10, 'Transport Layer (Lớp truyền vận)', 0),
(40, 10, 'Session Layer (Lớp phiên)', 0);

-- ------------------------------------------------------------
-- CÂU HỎI & ĐÁP ÁN CHO ĐỀ 3 (5 câu, mỗi câu 4 đáp án)
-- ------------------------------------------------------------
INSERT INTO `questions` (`id`, `exam_id`, `content`) VALUES
(11, 3, 'Trong Express.js, middleware nào được sử dụng để phân tích dữ liệu JSON từ request body?'),
(12, 3, 'Phương thức HTTP nào tuân theo chuẩn RESTful được dùng để cập nhật toàn bộ thông tin tài nguyên?'),
(13, 3, 'Khóa ngoại (FOREIGN KEY) trong MySQL có tác dụng chính là gì?'),
(14, 3, 'Từ khóa async/await trong JavaScript bản chất là cú pháp rút gọn hoạt động trên nền tảng nào?'),
(15, 3, 'Biện pháp nào hiệu quả nhất để phòng chống lỗ hổng SQL Injection khi làm việc với MySQL trong Node.js?');

INSERT INTO `answers` (`id`, `question_id`, `content`, `is_correct`) VALUES
(41, 11, 'express.urlencoded()', 0),
(42, 11, 'express.static()', 0),
(43, 11, 'express.json()', 1),
(44, 11, 'express.router()', 0),

(45, 12, 'POST', 0),
(46, 12, 'PUT', 1),
(47, 12, 'PATCH', 0),
(48, 12, 'GET', 0),

(49, 13, 'Tăng tốc độ truy vấn SELECT lên gấp đôi', 0),
(50, 13, 'Ràng buộc toàn vẹn dữ liệu tham chiếu giữa hai bảng', 1),
(51, 13, 'Tự động mã hóa mật khẩu khi insert', 0),
(52, 13, 'Xóa toàn bộ dữ liệu bảng cha khi bảng con có dữ liệu', 0),

(53, 14, 'Callback Hell', 0),
(54, 14, 'Promise', 1),
(55, 14, 'Web Workers', 0),
(56, 14, 'Event Loop Thread Pool', 0),

(57, 15, 'Nối chuỗi trực tiếp câu lệnh SQL với biến của người dùng', 0),
(58, 15, 'Sử dụng Prepared Statements (tham số hóa với dấu ?)', 1),
(59, 15, 'Chỉ cho phép người dùng gửi request dạng GET', 0),
(60, 15, 'Lọc bỏ tất cả dấu cách trong câu query', 0);

-- 7. TẠO TÀI KHOẢN DATABASE DÀNH RIÊNG CHO ỨNG DỤNG (Least Privilege)
CREATE USER IF NOT EXISTS 'quiz_user'@'%' IDENTIFIED BY 'quiz_secure_pass_2026';
GRANT SELECT, INSERT, UPDATE, DELETE ON `quiz_system`.* TO 'quiz_user'@'%';
FLUSH PRIVILEGES;

