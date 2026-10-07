const { pool } = require('../config/db');

// 1. GET /api/exams - Danh sach tat ca de thi (kem theo so luong cau hoi)
async function getAllExams(req, res) {
  try {
    const [rows] = await pool.query(`
      SELECT 
        e.id, 
        e.title, 
        e.description, 
        e.duration, 
        e.created_at,
        COUNT(q.id) AS total_questions
      FROM exams e
      LEFT JOIN questions q ON e.id = q.exam_id
      GROUP BY e.id
      ORDER BY e.id DESC
    `);

    res.json({
      success: true,
      data: rows
    });
  } catch (error) {
    console.error('[Exam getAllExams error]:', error);
    res.status(500).json({ success: false, message: 'Lỗi server khi lấy danh sách đề thi: ' + error.message });
  }
}

// 2. GET /api/exams/:id - Chi tiet 1 de thi
async function getExamById(req, res) {
  try {
    const examId = req.params.id;
    const [rows] = await pool.query(`
      SELECT 
        e.id, 
        e.title, 
        e.description, 
        e.duration, 
        e.created_at,
        COUNT(q.id) AS total_questions
      FROM exams e
      LEFT JOIN questions q ON e.id = q.exam_id
      WHERE e.id = ?
      GROUP BY e.id
    `, [examId]);

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy đề thi này!' });
    }

    res.json({
      success: true,
      data: rows[0]
    });
  } catch (error) {
    console.error('[Exam getExamById error]:', error);
    res.status(500).json({ success: false, message: 'Lỗi server khi lấy chi tiết đề thi: ' + error.message });
  }
}

// 3. POST /api/exams - Tao de thi moi (Chi ADMIN)
async function createExam(req, res) {
  try {
    const { title, description, duration } = req.body;

    if (!title || !duration) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng nhập tên đề thi và thời gian thi (phút)!'
      });
    }

    const durationNum = parseInt(duration, 10);
    if (isNaN(durationNum) || durationNum <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Thời gian thi phải là số nguyên dương (phút)!'
      });
    }

    const [result] = await pool.query(
      'INSERT INTO exams (title, description, duration) VALUES (?, ?, ?)',
      [title.trim(), (description || '').trim(), durationNum]
    );

    res.status(201).json({
      success: true,
      message: 'Tạo đề thi mới thành công!',
      data: {
        id: result.insertId,
        title: title.trim(),
        description: (description || '').trim(),
        duration: durationNum
      }
    });
  } catch (error) {
    console.error('[Exam createExam error]:', error);
    res.status(500).json({ success: false, message: 'Lỗi server khi tạo đề thi: ' + error.message });
  }
}

// 4. PUT /api/exams/:id - Cap nhat de thi (Chi ADMIN)
async function updateExam(req, res) {
  try {
    const examId = req.params.id;
    const { title, description, duration } = req.body;

    if (!title || !duration) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp tên đề thi và thời gian thi!'
      });
    }

    const durationNum = parseInt(duration, 10);
    if (isNaN(durationNum) || durationNum <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Thời gian thi phải là số nguyên dương (phút)!'
      });
    }

    const [updateResult] = await pool.query(
      'UPDATE exams SET title = ?, description = ?, duration = ? WHERE id = ?',
      [title.trim(), (description || '').trim(), durationNum, examId]
    );

    if (updateResult.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy đề thi cần cập nhật!' });
    }

    res.json({
      success: true,
      message: 'Cập nhật đề thi thành công!',
      data: {
        id: parseInt(examId, 10),
        title: title.trim(),
        description: (description || '').trim(),
        duration: durationNum
      }
    });
  } catch (error) {
    console.error('[Exam updateExam error]:', error);
    res.status(500).json({ success: false, message: 'Lỗi server khi sửa đề thi: ' + error.message });
  }
}

// 5. DELETE /api/exams/:id - Xoa de thi (Chi ADMIN)
async function deleteExam(req, res) {
  try {
    const examId = req.params.id;
    const [delResult] = await pool.query('DELETE FROM exams WHERE id = ?', [examId]);

    if (delResult.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy đề thi để xóa!' });
    }

    res.json({
      success: true,
      message: 'Đã xóa đề thi thành công!'
    });
  } catch (error) {
    console.error('[Exam deleteExam error]:', error);
    res.status(500).json({ success: false, message: 'Lỗi server khi xóa đề thi: ' + error.message });
  }
}

// 6. GET /api/exams/:id/questions - Lay danh sach cau hoi kem cac lua chon
async function getExamQuestions(req, res) {
  try {
    const examId = req.params.id;
    const isAdmin = req.user && req.user.role === 'ADMIN';

    // Kiem tra de thi co ton tai khong
    const [examRows] = await pool.query('SELECT * FROM exams WHERE id = ?', [examId]);
    if (examRows.length === 0) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy đề thi này!' });
    }

    // Lay toan bo cau hoi thuoc de thi (kem theo type)
    const [questions] = await pool.query(
      'SELECT id, exam_id, content, type, created_at FROM questions WHERE exam_id = ? ORDER BY id ASC',
      [examId]
    );

    if (questions.length === 0) {
      return res.json({
        success: true,
        exam: examRows[0],
        data: []
      });
    }

    const questionIds = questions.map(q => q.id);

    // Lay dap an cho tat ca cau hoi
    // Neu la CLASSIFICATION: tra ve danh sach categories (nhom) khong tiet lo dap an
    const [answers] = await pool.query(
      `SELECT id, question_id, content, match_target ${isAdmin ? ', is_correct' : ''} 
       FROM answers 
       WHERE question_id IN (?) 
       ORDER BY id ASC`,
      [questionIds]
    );

    // Group answers by question_id
    const answersMap = {};
    for (const ans of answers) {
      if (!answersMap[ans.question_id]) {
        answersMap[ans.question_id] = [];
      }
      answersMap[ans.question_id].push({
        id: ans.id,
        content: ans.content,
        match_target: isAdmin ? ans.match_target : (ans.match_target ? '' : null),
        ...(isAdmin ? { is_correct: Boolean(ans.is_correct) } : {})
      });
    }

    const result = questions.map(q => {
      const qAnswers = answersMap[q.id] || [];
      // Neu la CLASSIFICATION, trich xuat danh sach unique categories de client render cac cot/hop phan loai
      let categories = [];
      if (q.type === 'CLASSIFICATION') {
        const fullAnsForCats = answers.filter(a => a.question_id === q.id && a.match_target);
        categories = [...new Set(fullAnsForCats.map(a => a.match_target))];
      }

      return {
        ...q,
        answers: qAnswers,
        ...(categories.length > 0 ? { categories } : {})
      };
    });

    res.json({
      success: true,
      exam: examRows[0],
      data: result
    });
  } catch (error) {
    console.error('[Exam getExamQuestions error]:', error);
    res.status(500).json({ success: false, message: 'Lỗi server khi lấy câu hỏi đề thi: ' + error.message });
  }
}

// 7. POST /api/exams/:id/submit - Nop bai thi, cham diem tu dong da dang loai cau hoi va luu vao DB
async function submitExam(req, res) {
  const connection = await pool.getConnection();
  try {
    const examId = req.params.id;
    const userId = req.user.id;
    // userAnswers format: 
    // [
    //   { question_id: 1, selected_answer_id: 2 }, // SINGLE_CHOICE / TRUE_FALSE
    //   { question_id: 2, selected_answer_ids: [3, 4] }, // MULTIPLE_CHOICE
    //   { question_id: 3, user_answer_text: "ip a" }, // FILL_BLANK
    //   { question_id: 4, classification_data: { 5: "Lớp Mạng", 6: "Lớp Truyền Vận" } } // CLASSIFICATION (item_id -> category)
    // ]
    const { answers: userAnswers } = req.body;

    if (!Array.isArray(userAnswers)) {
      return res.status(400).json({
        success: false,
        message: 'Dữ liệu nộp bài không hợp lệ. Phải là mảng câu trả lời!'
      });
    }

    // 1. Lay toan bo cau hoi va dap an tu database
    const [questions] = await pool.query(
      'SELECT id, type, content FROM questions WHERE exam_id = ? ORDER BY id ASC',
      [examId]
    );

    const totalQuestions = questions.length;
    if (totalQuestions === 0) {
      return res.status(400).json({
        success: false,
        message: 'Đề thi này chưa có câu hỏi nào!'
      });
    }

    const questionIds = questions.map(q => q.id);

    const [allAnswersRows] = await pool.query(
      'SELECT id, question_id, content, is_correct, match_target FROM answers WHERE question_id IN (?) ORDER BY id ASC',
      [questionIds]
    );

    // Group answers by question_id
    const dbAnswersByQ = {};
    for (const ans of allAnswersRows) {
      if (!dbAnswersByQ[ans.question_id]) dbAnswersByQ[ans.question_id] = [];
      dbAnswersByQ[ans.question_id].push(ans);
    }

    // Map: question_id -> user submission item
    const submittedMap = {};
    for (const ans of userAnswers) {
      if (ans && ans.question_id) {
        submittedMap[ans.question_id] = ans;
      }
    }

    // 2. Cham diem tung loai cau hoi
    let correctCount = 0;
    const detailsToInsert = [];

    for (const q of questions) {
      const qId = q.id;
      const qType = q.type || 'SINGLE_CHOICE';
      const userSubmission = submittedMap[qId] || {};
      const dbAnswers = dbAnswersByQ[qId] || [];

      let isQuestionCorrect = false;
      let selectedAnswerId = null;
      let correctAnswerId = null;
      let userAnswerText = null;

      if (qType === 'SINGLE_CHOICE' || qType === 'TRUE_FALSE') {
        const correctAns = dbAnswers.find(a => Boolean(a.is_correct));
        correctAnswerId = correctAns ? correctAns.id : null;
        selectedAnswerId = userSubmission.selected_answer_id ? parseInt(userSubmission.selected_answer_id, 10) : null;

        if (correctAnswerId && selectedAnswerId && selectedAnswerId === correctAnswerId) {
          isQuestionCorrect = true;
        }
      } 
      else if (qType === 'MULTIPLE_CHOICE') {
        const correctAnsIds = dbAnswers.filter(a => Boolean(a.is_correct)).map(a => a.id).sort();
        let userSelectedIds = [];
        if (Array.isArray(userSubmission.selected_answer_ids)) {
          userSelectedIds = userSubmission.selected_answer_ids.map(id => parseInt(id, 10)).sort();
        } else if (userSubmission.selected_answer_id) {
          userSelectedIds = [parseInt(userSubmission.selected_answer_id, 10)];
        }

        userAnswerText = JSON.stringify(userSelectedIds);
        correctAnswerId = correctAnsIds[0] || null; // Tham chiếu 1 đáp án làm mốc

        // Đúng hoàn toàn khi các id đã chọn khớp hoàn toàn danh sách đáp án đúng
        if (correctAnsIds.length > 0 && correctAnsIds.length === userSelectedIds.length) {
          isQuestionCorrect = correctAnsIds.every((id, idx) => id === userSelectedIds[idx]);
        }
      } 
      else if (qType === 'FILL_BLANK') {
        // user_answer_text
        const userText = (userSubmission.user_answer_text || '').trim();
        userAnswerText = userText;
        const correctAnswersList = dbAnswers.map(a => a.content.trim().toLowerCase());

        // So khớp từ khóa không phân biệt hoa thường
        if (userText && correctAnswersList.includes(userText.toLowerCase())) {
          isQuestionCorrect = true;
        }
        correctAnswerId = dbAnswers[0] ? dbAnswers[0].id : null;
      } 
      else if (qType === 'CLASSIFICATION') {
        // userSubmission.classification_data format: { [answer_id]: category_name }
        const userClassification = userSubmission.classification_data || {};
        userAnswerText = JSON.stringify(userClassification);

        let allClassifiedCorrect = dbAnswers.length > 0;
        for (const ans of dbAnswers) {
          const userChosenCategory = (userClassification[ans.id] || '').trim().toLowerCase();
          const correctCategory = (ans.match_target || '').trim().toLowerCase();
          if (!userChosenCategory || userChosenCategory !== correctCategory) {
            allClassifiedCorrect = false;
            break;
          }
        }

        if (allClassifiedCorrect) {
          isQuestionCorrect = true;
        }
        correctAnswerId = dbAnswers[0] ? dbAnswers[0].id : null;
      }

      if (isQuestionCorrect) {
        correctCount++;
      }

      detailsToInsert.push({
        question_id: qId,
        selected_answer_id: selectedAnswerId,
        correct_answer_id: correctAnswerId,
        user_answer_text: userAnswerText,
        is_correct: isQuestionCorrect
      });
    }

    // Tinh diem tren thang 10
    const rawScore = (correctCount / totalQuestions) * 10;
    const score = Math.round(rawScore * 100) / 100;

    // 3. Bat dau Transaction de luu vao DB
    await connection.beginTransaction();

    const [resultInsert] = await connection.query(
      `INSERT INTO results (user_id, exam_id, score, correct_answers, total_questions) 
       VALUES (?, ?, ?, ?, ?)`,
      [userId, examId, score, correctCount, totalQuestions]
    );

    const resultId = resultInsert.insertId;

    // Insert vao result_details
    for (const d of detailsToInsert) {
      await connection.query(
        `INSERT INTO result_details (result_id, question_id, selected_answer_id, correct_answer_id, user_answer_text)
         VALUES (?, ?, ?, ?, ?)`,
        [resultId, d.question_id, d.selected_answer_id, d.correct_answer_id, d.user_answer_text]
      );
    }

    await connection.commit();

    res.status(201).json({
      success: true,
      message: 'Nộp bài và chấm điểm thành công!',
      data: {
        result_id: resultId,
        exam_id: parseInt(examId, 10),
        score: score,
        correct_answers: correctCount,
        total_questions: totalQuestions,
        percentage: Math.round((correctCount / totalQuestions) * 100)
      }
    });

  } catch (error) {
    await connection.rollback();
    console.error('[Exam submitExam error]:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi nộp bài thi: ' + error.message
    });
  } finally {
    connection.release();
  }
}

module.exports = {
  getAllExams,
  getExamById,
  createExam,
  updateExam,
  deleteExam,
  getExamQuestions,
  submitExam
};
