const jwt = require('jsonwebtoken');

// Middleware xac thuc JWT token
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Format: Bearer <TOKEN>

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Ban chua dang nhap hoac thieu Token xac thuc!'
    });
  }

  const secret = process.env.JWT_SECRET || 'quiz_system_super_secret_jwt_key_2026';

  jwt.verify(token, secret, (err, decodedUser) => {
    if (err) {
      return res.status(403).json({
        success: false,
        message: 'Token khong hop le hoac da het han!'
      });
    }
    req.user = decodedUser;
    next();
  });
}

// Middleware kiem tra quyen ADMIN
function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'ADMIN') {
    return res.status(403).json({
      success: false,
      message: 'Quyen truy cap bi tu choi: Chi ADMIN moi duoc thuc hien thao tac nay!'
    });
  }
  next();
}

module.exports = {
  authenticateToken,
  requireAdmin
};
