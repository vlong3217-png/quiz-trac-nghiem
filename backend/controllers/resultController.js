const { pool } = require('../config/db');

// 1. GET /api/results - Lay danh sach ket qua thi
// Neu la ADMIN: lay tat ca ket qua cua tat ca user
// Neu la USER: chi lay ket qua cua chinh user do
async function getAllResults(req, res) {
  try {
    const user = req.user;
    let query = `
      SELECT 
        r.id,
        r.user_id,
        u.username,
        u.email,
        r.exam_id,
        e.title AS exam_title,
        r.score,
        r.correct_answers,
        r.total_questions,
        r.submitted_at
      FROM results r
      JOIN users u ON r.user_id = u.id
      JOIN exams e ON r.exam_id = e.id
    `;
    const params = [];

    // Neu khong phai ADMIN thi chi xem duoc bai cua chinh minh
    if (user.role !== 'ADMIN') {
      query += ' WHERE r.user_id = ?';
      params.push(user.id);
    }

    query += ' ORDER BY r.submitted_at DESC';

    const [rows] = await pool.query(query, params);

    res.json({
      success: true,
      data: rows
    });
  } catch (error) {
    console.error('[Result getAllResults error]:', error);
    res.status(500).json({ success: false, message: 'Lỗi server khi lấy danh sách kết quả: ' + error.message });
  }
}

// 2. GET /api/results/:id - Xem chi tiet 1 ket qua lam bai
async function getResultById(req, res) {
  try {
    const resultId = req.params.id;
    const user = req.user;

    // Lay thong tin tong quan ve lan thi
    const [resultRows] = await pool.query(`
      SELECT 
        r.id,
        r.user_id,
        u.username,
        u.email,
        r.exam_id,
        e.title AS exam_title,
        e.duration AS exam_duration,
        r.score,
        r.correct_answers,
        r.total_questions,
        r.submitted_at
      FROM results r
      JOIN users u ON r.user_id = u.id
      JOIN exams e ON r.exam_id = e.id
      WHERE r.id = ?
    `, [resultId]);

    if (resultRows.length === 0) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy kết quả làm bài này!' });
    }

    const resultData = resultRows[0];

    // Bao ve quyen rieng tu: user thuong khong duoc xem ket qua nguoi khac
    if (user.role !== 'ADMIN' && resultData.user_id !== user.id) {
      return res.status(403).json({ success: false, message: 'Bạn không có quyền xem kết quả của người khác!' });
    }

    // Lay chi tiet tung cau hoi, lua chon cua user va dap an dung
    const [detailRows] = await pool.query(`
      SELECT 
        rd.id,
        rd.question_id,
        q.content AS question_content,
        q.type AS question_type,
        rd.selected_answer_id,
        sa.content AS selected_answer_content,
        rd.correct_answer_id,
        ca.content AS correct_answer_content,
        rd.user_answer_text
      FROM result_details rd
      JOIN questions q ON rd.question_id = q.id
      LEFT JOIN answers sa ON rd.selected_answer_id = sa.id
      LEFT JOIN answers ca ON rd.correct_answer_id = ca.id
      WHERE rd.result_id = ?
      ORDER BY rd.id ASC
    `, [resultId]);

    // Lay them toan bo cac dap an/muc phan loai cua moi cau hoi
    const questionIds = detailRows.map(d => d.question_id);
    let allAnswersMap = {};
    if (questionIds.length > 0) {
      const [allAnswers] = await pool.query(
        'SELECT id, question_id, content, is_correct, match_target FROM answers WHERE question_id IN (?) ORDER BY id ASC',
        [questionIds]
      );
      for (const ans of allAnswers) {
        if (!allAnswersMap[ans.question_id]) allAnswersMap[ans.question_id] = [];
        allAnswersMap[ans.question_id].push({
          id: ans.id,
          content: ans.content,
          is_correct: Boolean(ans.is_correct),
          match_target: ans.match_target
        });
      }
    }

    const detailsWithAllOptions = detailRows.map(d => {
      const options = allAnswersMap[d.question_id] || [];
      const qType = d.question_type || 'SINGLE_CHOICE';
      let isCorrect = false;

      if (qType === 'SINGLE_CHOICE' || qType === 'TRUE_FALSE') {
        const correctOpt = options.find(o => o.is_correct);
        isCorrect = (correctOpt && d.selected_answer_id && d.selected_answer_id === correctOpt.id);
      } else if (qType === 'MULTIPLE_CHOICE') {
        let userSelectedIds = [];
        try {
          userSelectedIds = JSON.parse(d.user_answer_text || '[]');
        } catch(e) {}
        const correctIds = options.filter(o => o.is_correct).map(o => o.id).sort();
        userSelectedIds.sort();
        if (correctIds.length > 0 && correctIds.length === userSelectedIds.length) {
          isCorrect = correctIds.every((id, idx) => id === userSelectedIds[idx]);
        }
      } else if (qType === 'FILL_BLANK') {
        const correctWords = options.map(o => o.content.trim().toLowerCase());
        const userWord = (d.user_answer_text || '').trim().toLowerCase();
        isCorrect = userWord && correctWords.includes(userWord);
      } else if (qType === 'CLASSIFICATION') {
        let userClassification = {};
        try {
          userClassification = JSON.parse(d.user_answer_text || '{}');
        } catch(e) {}
        let allOk = options.length > 0;
        for (const opt of options) {
          const userCategory = (userClassification[opt.id] || '').trim().toLowerCase();
          const targetCategory = (opt.match_target || '').trim().toLowerCase();
          if (!userCategory || userCategory !== targetCategory) {
            allOk = false;
            break;
          }
        }
        isCorrect = allOk;
      }

      return {
        ...d,
        is_correct: isCorrect,
        all_options: options
      };
    });

    res.json({
      success: true,
      data: {
        summary: resultData,
        details: detailsWithAllOptions
      }
    });

  } catch (error) {
    console.error('[Result getResultById error]:', error);
    res.status(500).json({ success: false, message: 'Lỗi server khi lấy chi tiết kết quả: ' + error.message });
  }
}

// 3. GET /api/users/:id/results - Lay danh sach ket qua cua 1 user cu the
async function getUserResults(req, res) {
  try {
    const targetUserId = parseInt(req.params.id, 10);
    const currentUser = req.user;

    // Chi cho phep chinh user do hoac ADMIN truy cap
    if (currentUser.role !== 'ADMIN' && currentUser.id !== targetUserId) {
      return res.status(403).json({ success: false, message: 'Bạn không có quyền xem kết quả của người dùng này!' });
    }

    const [rows] = await pool.query(`
      SELECT 
        r.id,
        r.user_id,
        u.username,
        r.exam_id,
        e.title AS exam_title,
        r.score,
        r.correct_answers,
        r.total_questions,
        r.submitted_at
      FROM results r
      JOIN users u ON r.user_id = u.id
      JOIN exams e ON r.exam_id = e.id
      WHERE r.user_id = ?
      ORDER BY r.submitted_at DESC
    `, [targetUserId]);

    res.json({
      success: true,
      data: rows
    });
  } catch (error) {
    console.error('[Result getUserResults error]:', error);
    res.status(500).json({ success: false, message: 'Lỗi server khi lấy lịch sử bài thi: ' + error.message });
  }
}

// 4. GET /api/results/stats/summary - Thong ke tong quan cho Admin Dashboard
async function getAdminStats(req, res) {
  try {
    const [[{ total_users }]] = await pool.query('SELECT COUNT(*) AS total_users FROM users WHERE role = "USER"');
    const [[{ total_exams }]] = await pool.query('SELECT COUNT(*) AS total_exams FROM exams');
    const [[{ total_questions }]] = await pool.query('SELECT COUNT(*) AS total_questions FROM questions');
    const [[{ total_submissions, avg_score }]] = await pool.query('SELECT COUNT(*) AS total_submissions, IFNULL(AVG(score), 0) AS avg_score FROM results');

    res.json({
      success: true,
      data: {
        total_users,
        total_exams,
        total_questions,
        total_submissions,
        avg_score: Math.round(avg_score * 10) / 10
      }
    });
  } catch (error) {
    console.error('[Result getAdminStats error]:', error);
    res.status(500).json({ success: false, message: 'Lỗi server khi lấy thống kê dashboard: ' + error.message });
  }
}

module.exports = {
  getAllResults,
  getResultById,
  getUserResults,
  getAdminStats
};
