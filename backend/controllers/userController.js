const bcrypt = require('bcryptjs');
const { pool } = require('../config/db');

// 1. GET /api/users - Danh sách sinh viên (USER)
async function getAllUsers(req, res) {
  try {
    const [users] = await pool.query(`
      SELECT 
        u.id, 
        u.username, 
        u.email, 
        u.role, 
        u.class_name,
        u.school_name,
        u.created_at,
        COUNT(r.id) AS total_exams_taken,
        IFNULL(ROUND(AVG(r.score), 2), 0) AS average_score
      FROM users u
      LEFT JOIN results r ON u.id = r.user_id
      WHERE u.role = 'USER'
      GROUP BY u.id
      ORDER BY u.id DESC
    `);

    res.json({
      success: true,
      data: users
    });
  } catch (error) {
    console.error('[User getAllUsers error]:', error);
    res.status(500).json({ success: false, message: 'Lỗi server khi lấy danh sách sinh viên: ' + error.message });
  }
}

// 2. POST /api/users - Thêm tài khoản sinh viên mới (Admin tạo)
async function createUser(req, res) {
  try {
    const { username, email, password, class_name, school_name } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng nhập đầy đủ tên đăng nhập, email và mật khẩu!'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Mật khẩu phải từ 6 ký tự trở lên!'
      });
    }

    // Kiểm tra trùng username hoặc email
    const [existing] = await pool.query(
      'SELECT id, username, email FROM users WHERE username = ? OR email = ?',
      [username.trim(), email.trim().toLowerCase()]
    );

    if (existing.length > 0) {
      const match = existing[0];
      if (match.username === username.trim()) {
        return res.status(409).json({ success: false, message: 'Tên đăng nhập đã tồn tại!' });
      }
      return res.status(409).json({ success: false, message: 'Email đã tồn tại trong hệ thống!' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const [insertResult] = await pool.query(
      'INSERT INTO users (username, email, password, role, class_name, school_name) VALUES (?, ?, ?, "USER", ?, ?)',
      [username.trim(), email.trim().toLowerCase(), hashedPassword, (class_name || '').trim(), (school_name || '').trim()]
    );

    res.status(201).json({
      success: true,
      message: 'Thêm tài khoản sinh viên thành công!',
      data: {
        id: insertResult.insertId,
        username: username.trim(),
        email: email.trim().toLowerCase(),
        role: 'USER',
        class_name: (class_name || '').trim(),
        school_name: (school_name || '').trim()
      }
    });
  } catch (error) {
    console.error('[User createUser error]:', error);
    res.status(500).json({ success: false, message: 'Lỗi server khi tạo sinh viên: ' + error.message });
  }
}

// 3. PUT /api/users/:id - Cập nhật thông tin hoặc đặt lại mật khẩu sinh viên
async function updateUser(req, res) {
  try {
    const userId = req.params.id;
    const { email, password, class_name, school_name } = req.body;

    // Kiểm tra sinh viên có tồn tại không
    const [users] = await pool.query('SELECT * FROM users WHERE id = ? AND role = "USER"', [userId]);
    if (users.length === 0) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy tài khoản sinh viên này!' });
    }

    if (email) {
      // Kiểm tra trùng email với người khác
      const [emailCheck] = await pool.query(
        'SELECT id FROM users WHERE email = ? AND id != ?',
        [email.trim().toLowerCase(), userId]
      );
      if (emailCheck.length > 0) {
        return res.status(409).json({ success: false, message: 'Email này đã được sử dụng bởi tài khoản khác!' });
      }

      await pool.query('UPDATE users SET email = ? WHERE id = ?', [email.trim().toLowerCase(), userId]);
    }

    // Cập nhật Lớp và Trường
    if (class_name !== undefined) {
      await pool.query('UPDATE users SET class_name = ? WHERE id = ?', [(class_name || '').trim(), userId]);
    }
    if (school_name !== undefined) {
      await pool.query('UPDATE users SET school_name = ? WHERE id = ?', [(school_name || '').trim(), userId]);
    }

    // Nếu có đổi/reset mật khẩu
    if (password) {
      if (password.length < 6) {
        return res.status(400).json({ success: false, message: 'Mật khẩu mới phải từ 6 ký tự trở lên!' });
      }
      const hashedPassword = await bcrypt.hash(password, 10);
      await pool.query('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, userId]);
    }

    res.json({
      success: true,
      message: 'Cập nhật tài khoản sinh viên thành công!'
    });
  } catch (error) {
    console.error('[User updateUser error]:', error);
    res.status(500).json({ success: false, message: 'Lỗi server khi sửa tài khoản: ' + error.message });
  }
}

// 4. DELETE /api/users/:id - Xóa tài khoản sinh viên
async function deleteUser(req, res) {
  try {
    const userId = req.params.id;

    const [delResult] = await pool.query(
      'DELETE FROM users WHERE id = ? AND role = "USER"',
      [userId]
    );

    if (delResult.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy sinh viên để xóa!' });
    }

    res.json({
      success: true,
      message: 'Đã xóa tài khoản sinh viên thành công!'
    });
  } catch (error) {
    console.error('[User deleteUser error]:', error);
    res.status(500).json({ success: false, message: 'Lỗi server khi xóa sinh viên: ' + error.message });
  }
}

module.exports = {
  getAllUsers,
  createUser,
  updateUser,
  deleteUser
};
