const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const resultController = require('../controllers/resultController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// Lịch sử làm bài của 1 user (User xem của mình, hoặc Admin xem)
router.get('/:id/results', authenticateToken, resultController.getUserResults);

// Các API Quản lý tài khoản sinh viên (Chỉ Admin)
router.get('/', authenticateToken, requireAdmin, userController.getAllUsers);
router.post('/', authenticateToken, requireAdmin, userController.createUser);
router.put('/:id', authenticateToken, requireAdmin, userController.updateUser);
router.delete('/:id', authenticateToken, requireAdmin, userController.deleteUser);

module.exports = router;
