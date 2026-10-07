const express = require('express');
const router = express.Router();
const examController = require('../controllers/examController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// Public/User: Danh sach de thi
router.get('/', examController.getAllExams);

// Public/User: Chi tiet de thi
router.get('/:id', examController.getExamById);

// Public/User: Lay danh sach cau hoi cua de thi (khi lam bai)
// User can co token de lay (hoac dung khi thi)
router.get('/:id/questions', authenticateToken, examController.getExamQuestions);

// User: Nop bai thi va cham diem
router.post('/:id/submit', authenticateToken, examController.submitExam);

// Admin: Quan ly de thi
router.post('/', authenticateToken, requireAdmin, examController.createExam);
router.put('/:id', authenticateToken, requireAdmin, examController.updateExam);
router.delete('/:id', authenticateToken, requireAdmin, examController.deleteExam);

module.exports = router;
