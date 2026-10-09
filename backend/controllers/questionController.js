const { pool } = require('../config/db');

// 1. GET /api/questions/:id - Chi tiet 1 cau hoi kem dap an
async function getQuestionById(req, res) {
  try {
    const questionId = req.params.id;
    const [questions] = await pool.query(
      'SELECT id, exam_id, content, type FROM questions WHERE id = ?',
      [questionId]
    );

    if (questions.length === 0) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy câu hỏi!' });
    }

    const [answers] = await pool.query(
      'SELECT id, question_id, content, is_correct, match_target FROM answers WHERE question_id = ? ORDER BY id ASC',
      [questionId]
    );

    res.json({
      success: true,
      data: {
        ...questions[0],
        answers: answers.map(a => ({ 
          ...a, 
          is_correct: Boolean(a.is_correct) 
        }))
      }
    });
  } catch (error) {
    console.error('[Question getQuestionById error]:', error);
    res.status(500).json({ success: false, message: 'Đã xảy ra lỗi trên hệ thống khi lấy chi tiết câu hỏi.' });
  }
}

// 2. POST /api/questions - Tao cau hoi moi
// Body: { exam_id, content, type: 'SINGLE_CHOICE'|'MULTIPLE_CHOICE'|'TRUE_FALSE'|'FILL_BLANK'|'CLASSIFICATION', answers: [...] }
async function createQuestion(req, res) {
  const connection = await pool.getConnection();
  try {
    const { exam_id, content, type = 'SINGLE_CHOICE', answers } = req.body;

    if (!exam_id || !content || !Array.isArray(answers) || answers.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Dữ liệu không hợp lệ! Cần có exam_id, nội dung câu hỏi và danh sách đáp án.'
      });
    }

    const validTypes = ['SINGLE_CHOICE', 'MULTIPLE_CHOICE', 'TRUE_FALSE', 'FILL_BLANK', 'CLASSIFICATION'];
    const qType = validTypes.includes(type) ? type : 'SINGLE_CHOICE';

    await connection.beginTransaction();

    // 1. Tao question
    const [qResult] = await connection.query(
      'INSERT INTO questions (exam_id, content, type) VALUES (?, ?, ?)',
      [exam_id, content.trim(), qType]
    );
    const questionId = qResult.insertId;

    // 2. Tao answers
    for (const ans of answers) {
      await connection.query(
        'INSERT INTO answers (question_id, content, is_correct, match_target) VALUES (?, ?, ?, ?)',
        [
          questionId, 
          (ans.content || '').trim(), 
          (ans.is_correct ? 1 : 0),
          ans.match_target ? (ans.match_target || '').trim() : null
        ]
      );
    }

    await connection.commit();

    res.status(201).json({
      success: true,
      message: 'Thêm câu hỏi thành công!',
      data: {
        id: questionId,
        exam_id,
        content: content.trim(),
        type: qType
      }
    });
  } catch (error) {
    await connection.rollback();
    console.error('[Question createQuestion error]:', error);
    res.status(500).json({ success: false, message: 'Đã xảy ra lỗi trên hệ thống khi tạo câu hỏi.' });
  } finally {
    connection.release();
  }
}

// 3. PUT /api/questions/:id - Cap nhat cau hoi va dap an (Chi ADMIN)
async function updateQuestion(req, res) {
  const connection = await pool.getConnection();
  try {
    const questionId = req.params.id;
    const { content, type, answers } = req.body;

    if (!content) {
      return res.status(400).json({
        success: false,
        message: 'Nội dung câu hỏi không được để trống!'
      });
    }

    await connection.beginTransaction();

    const updateFields = ['content = ?'];
    const updateParams = [content.trim()];

    if (type) {
      updateFields.push('type = ?');
      updateParams.push(type);
    }
    updateParams.push(questionId);

    const [upResult] = await connection.query(
      `UPDATE questions SET ${updateFields.join(', ')} WHERE id = ?`,
      updateParams
    );

    if (upResult.affectedRows === 0) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: 'Không tìm thấy câu hỏi để cập nhật!' });
    }

    // Neu co gui kem answers de cap nhat lai
    if (Array.isArray(answers) && answers.length > 0) {
      await connection.query('DELETE FROM answers WHERE question_id = ?', [questionId]);

      for (const ans of answers) {
        await connection.query(
          'INSERT INTO answers (question_id, content, is_correct, match_target) VALUES (?, ?, ?, ?)',
          [
            questionId, 
            (ans.content || '').trim(), 
            (ans.is_correct ? 1 : 0),
            ans.match_target ? (ans.match_target || '').trim() : null
          ]
        );
      }
    }

    await connection.commit();

    res.json({
      success: true,
      message: 'Cập nhật câu hỏi và đáp án thành công!'
    });
  } catch (error) {
    await connection.rollback();
    console.error('[Question updateQuestion error]:', error);
    res.status(500).json({ success: false, message: 'Đã xảy ra lỗi trên hệ thống khi cập nhật câu hỏi.' });
  } finally {
    connection.release();
  }
}

// 4. DELETE /api/questions/:id - Xoa cau hoi (Chi ADMIN)
async function deleteQuestion(req, res) {
  try {
    const questionId = req.params.id;
    const [delResult] = await pool.query('DELETE FROM questions WHERE id = ?', [questionId]);

    if (delResult.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy câu hỏi để xóa!' });
    }

    res.json({
      success: true,
      message: 'Đã xóa câu hỏi thành công!'
    });
  } catch (error) {
    console.error('[Question deleteQuestion error]:', error);
    res.status(500).json({ success: false, message: 'Đã xảy ra lỗi trên hệ thống khi xóa câu hỏi.' });
  }
}

module.exports = {
  getQuestionById,
  createQuestion,
  updateQuestion,
  deleteQuestion
};
