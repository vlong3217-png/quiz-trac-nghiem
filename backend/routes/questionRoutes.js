const express = require('express');
const router = express.Router();
const questionController = require('../controllers/questionController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// Chi tiet 1 cau hoi
router.get('/:id', authenticateToken, questionController.getQuestionById);

// Admin: Them, sua, xoa cau hoi
router.post('/', authenticateToken, requireAdmin, questionController.createQuestion);
router.put('/:id', authenticateToken, requireAdmin, questionController.updateQuestion);
router.delete('/:id', authenticateToken, requireAdmin, questionController.deleteQuestion);

module.exports = router;
