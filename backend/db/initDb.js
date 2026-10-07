require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

async function importDatabase() {
  const host = process.env.DB_HOST || '127.0.0.1';
  const port = parseInt(process.env.DB_PORT, 10) || 3306;
  const user = process.env.DB_USER || 'root';
  const password = process.env.DB_PASSWORD || '';
  // database nằm ngoài thư mục backend
  const sqlPath = path.resolve(__dirname, '..', '..', 'database', 'schema.sql');

  console.log('--------------------------------------------------');
  console.log(`[Database Init] Đang kết nối tới MySQL (${host}:${port}) với user='${user}'...`);

  try {
    const connection = await mysql.createConnection({
      host,
      port,
      user,
      password,
      multipleStatements: true
    });

    console.log('[Database Init] Kết nối MySQL thành công!');
    console.log(`[Database Init] Đang đọc file SQL: ${sqlPath}`);
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');

    console.log('[Database Init] Đang thực thi khởi tạo Database & nạp dữ liệu mẫu...');
    await connection.query(sqlContent);

    console.log('==================================================');
    console.log(' [Thành công] Database `quiz_system` đã được tạo và nạp dữ liệu mẫu!');
    console.log(' Đã tạo tài khoản test:');
    console.log('   - Admin:    admin / admin123');
    console.log('   - Học viên: sinhvien / user123');
    console.log('==================================================');

    await connection.end();
  } catch (err) {
    console.error('==================================================');
    console.error('[Database Init Thất Bại]:', err.message);
    console.error('Vui lòng kiểm tra:');
    console.error('  1. Dịch vụ MySQL đã khởi động chưa?');
    console.error('  2. Mật khẩu trong file backend/.env có đúng với tài khoản root trên máy bạn không?');
    console.error('==================================================');
    process.exit(1);
  }
}

importDatabase();
