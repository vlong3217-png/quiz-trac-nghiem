const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/db');

// Đăng ký tài khoản mới (mặc định role = 'USER')
async function register(req, res) {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng điền đầy đủ username, email và password!'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Mật khẩu phải có ít nhất 6 ký tự!'
      });
    }

    // Kiểm tra trùng username hoặc email
    const [existingUsers] = await pool.query(
      'SELECT id, username, email FROM users WHERE username = ? OR email = ?',
      [username.trim(), email.trim().toLowerCase()]
    );

    if (existingUsers.length > 0) {
      const match = existingUsers[0];
      if (match.username === username.trim()) {
        return res.status(409).json({ success: false, message: 'Tên đăng nhập đã tồn tại!' });
      }
      return res.status(409).json({ success: false, message: 'Email đã được đăng ký!' });
    }

    // Hash mật khẩu
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const [insertResult] = await pool.query(
      'INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)',
      [username.trim(), email.trim().toLowerCase(), hashedPassword, 'USER']
    );

    const newUserId = insertResult.insertId;

    // Tự động tạo token đăng nhập ngay sau khi đăng ký
    const token = jwt.sign(
      { id: newUserId, username: username.trim(), email: email.trim().toLowerCase(), role: 'USER' },
      process.env.JWT_SECRET || 'quiz_system_super_secret_jwt_key_2026',
      { expiresIn: '7d' }
    );

    res.status(201).json({
      success: true,
      message: 'Đăng ký tài khoản thành công!',
      data: {
        token,
        user: {
          id: newUserId,
          username: username.trim(),
          email: email.trim().toLowerCase(),
          role: 'USER'
        }
      }
    });
  } catch (error) {
    console.error('[Auth register error]:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi đăng ký: ' + error.message
    });
  }
}

// Đăng nhập
async function login(req, res) {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng nhập tên đăng nhập (hoặc email) và mật khẩu!'
      });
    }

    // Cho phép đăng nhập bằng cả username hoặc email
    const [users] = await pool.query(
      'SELECT * FROM users WHERE username = ? OR email = ?',
      [username.trim(), username.trim().toLowerCase()]
    );

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Tài khoản không tồn tại trong hệ thống!'
      });
    }

    const user = users[0];

    // So khớp mật khẩu với hash
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Mật khẩu không chính xác!'
      });
    }

    // Ký JWT Token
    const token = jwt.sign(
      { id: user.id, username: user.username, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'quiz_system_super_secret_jwt_key_2026',
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      message: 'Đăng nhập thành công!',
      data: {
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role
        }
      }
    });
  } catch (error) {
    console.error('[Auth login error]:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi đăng nhập: ' + error.message
    });
  }
}

// Lấy thông tin user hiện tại qua Token
async function getMe(req, res) {
  try {
    const [users] = await pool.query(
      'SELECT id, username, email, role, created_at FROM users WHERE id = ?',
      [req.user.id]
    );

    if (users.length === 0) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng' });
    }

    res.json({
      success: true,
      data: users[0]
    });
  } catch (error) {
    console.error('[Auth getMe error]:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy thông tin người dùng: ' + error.message
    });
  }
}

module.exports = {
  register,
  login,
  getMe
};
