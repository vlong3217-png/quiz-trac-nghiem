const express = require('express');
const router = express.Router();
const resultController = require('../controllers/resultController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// Thong ke cho Admin Dashboard
router.get('/stats/summary', authenticateToken, requireAdmin, resultController.getAdminStats);

// Lay danh sach ket qua (ADMIN xem tat ca, USER xem cua minh)
router.get('/', authenticateToken, resultController.getAllResults);

// Chi tiet 1 bai thi da nop
router.get('/:id', authenticateToken, resultController.getResultById);

module.exports = router;
