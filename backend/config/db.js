require('dotenv').config();
const mysql = require('mysql2/promise');

// Tao connection pool den MySQL
const pool = mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  port: parseInt(process.env.DB_PORT, 10) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'quiz_system',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  timezone: '+07:00'
});

// Ham kiem tra ket noi den database khi khoi dong server
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log(`[Database] Ket noi MySQL thanh cong den DB: ${process.env.DB_NAME || 'quiz_system'}`);
    connection.release();
    return true;
  } catch (err) {
    console.error(`[Database Error] Khong the ket noi MySQL: ${err.message}`);
    console.error(`[Database Hint] Vui long kiem tra file .env va chac chan rang dich vu MySQL dang chay.`);
    return false;
  }
}

module.exports = {
  pool,
  testConnection
};
