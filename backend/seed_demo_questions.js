const { pool } = require('./config/db');

async function seed() {
  console.log('Seeding demo question types...');

  const [exams] = await pool.query('SELECT id, title FROM exams ORDER BY id ASC');
  let targetExamId = exams[0]?.id;

  if (!targetExamId) {
    const [res] = await pool.query('INSERT INTO exams (title, description, duration) VALUES (?, ?, ?)', [
      'Bài thi thử nghiệm đa dạng câu hỏi',
      'Đề thi thử nghiệm 5 dạng câu hỏi: Single Choice, Multiple Choice, True/False, Điền từ, Phân loại',
      20
    ]);
    targetExamId = res.insertId;
  }

  const [existingQ] = await pool.query('SELECT id, type, content FROM questions WHERE exam_id = ?', [targetExamId]);

  const hasMulti = existingQ.some(q => q.type === 'MULTIPLE_CHOICE');
  const hasTF = existingQ.some(q => q.type === 'TRUE_FALSE');
  const hasFill = existingQ.some(q => q.type === 'FILL_BLANK');
  const hasClass = existingQ.some(q => q.type === 'CLASSIFICATION');

  if (!hasMulti) {
    const [q] = await pool.query('INSERT INTO questions (exam_id, content, type) VALUES (?, ?, ?)', [
      targetExamId,
      'Những giao thức nào sau đây thuộc tầng Giao vận (Transport Layer) trong mô hình OSI / TCP-IP? (Chọn nhiều đáp án)',
      'MULTIPLE_CHOICE'
    ]);
    await pool.query('INSERT INTO answers (question_id, content, is_correct) VALUES (?, ?, ?), (?, ?, ?), (?, ?, ?), (?, ?, ?)', [
      q.insertId, 'TCP (Transmission Control Protocol)', 1,
      q.insertId, 'UDP (User Datagram Protocol)', 1,
      q.insertId, 'HTTP (Hypertext Transfer Protocol)', 0,
      q.insertId, 'IP (Internet Protocol)', 0
    ]);
    console.log('Inserted MULTIPLE_CHOICE question');
  }

  if (!hasTF) {
    const [q] = await pool.query('INSERT INTO questions (exam_id, content, type) VALUES (?, ?, ?)', [
      targetExamId,
      'Giao thức IPv4 sử dụng không gian địa chỉ có độ dài là 32 bit, đúng hay sai?',
      'TRUE_FALSE'
    ]);
    await pool.query('INSERT INTO answers (question_id, content, is_correct) VALUES (?, ?, ?), (?, ?, ?)', [
      q.insertId, 'Đúng', 1,
      q.insertId, 'Sai', 0
    ]);
    console.log('Inserted TRUE_FALSE question');
  }

  if (!hasFill) {
    const [q] = await pool.query('INSERT INTO questions (exam_id, content, type) VALUES (?, ?, ?)', [
      targetExamId,
      'Cổng mặc định của giao thức HTTPS (bảo mật) trên máy chủ web là cổng số mấy?',
      'FILL_BLANK'
    ]);
    await pool.query('INSERT INTO answers (question_id, content, is_correct) VALUES (?, ?, ?), (?, ?, ?)', [
      q.insertId, '443', 1,
      q.insertId, 'cổng 443', 1
    ]);
    console.log('Inserted FILL_BLANK question');
  }

  if (!hasClass) {
    const [q] = await pool.query('INSERT INTO questions (exam_id, content, type) VALUES (?, ?, ?)', [
      targetExamId,
      'Hãy phân loại các mục/giao thức sau vào nhóm tầng tương ứng trong mô hình mạng OSI/TCP-IP:',
      'CLASSIFICATION'
    ]);
    await pool.query('INSERT INTO answers (question_id, content, is_correct, match_target) VALUES (?, ?, ?, ?), (?, ?, ?, ?), (?, ?, ?, ?), (?, ?, ?, ?)', [
      q.insertId, 'TCP', 1, 'Tầng Giao Vận (Transport)',
      q.insertId, 'UDP', 1, 'Tầng Giao Vận (Transport)',
      q.insertId, 'IP Packet', 1, 'Tầng Mạng (Network)',
      q.insertId, 'ICMP', 1, 'Tầng Mạng (Network)'
    ]);
    console.log('Inserted CLASSIFICATION question');
  }

  console.log('Finished seeding successfully for Exam ID:', targetExamId);
  process.exit(0);
}

seed().catch(err => {
  console.error('Seed error:', err);
  process.exit(1);
});
