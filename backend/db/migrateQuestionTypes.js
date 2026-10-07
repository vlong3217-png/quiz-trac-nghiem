const { pool } = require('../config/db');

async function updateDB() {
  try {
    try {
      await pool.query("ALTER TABLE questions ADD COLUMN type ENUM('SINGLE_CHOICE', 'MULTIPLE_CHOICE', 'TRUE_FALSE', 'FILL_BLANK', 'MATCHING', 'CLASSIFICATION') NOT NULL DEFAULT 'SINGLE_CHOICE'");
    } catch(err) {
      console.log('questions.type column already exists or error:', err.message);
    }

    try {
      await pool.query("ALTER TABLE answers ADD COLUMN match_target VARCHAR(255) NULL");
    } catch(err) {
      console.log('answers.match_target column already exists or error:', err.message);
    }

    try {
      await pool.query("ALTER TABLE result_details ADD COLUMN user_answer_text TEXT NULL");
    } catch(err) {
      console.log('result_details.user_answer_text column already exists or error:', err.message);
    }

    try {
      await pool.query("ALTER TABLE result_details MODIFY COLUMN correct_answer_id INT NULL");
    } catch(err) {
      console.log('modify correct_answer_id error:', err.message);
    }

    const [qCols] = await pool.query('DESCRIBE questions');
    console.log('QUESTIONS COLS:', qCols.map(c => c.Field));
    const [aCols] = await pool.query('DESCRIBE answers');
    console.log('ANSWERS COLS:', aCols.map(c => c.Field));
    const [rdCols] = await pool.query('DESCRIBE result_details');
    console.log('RESULT_DETAILS COLS:', rdCols.map(c => c.Field));
    process.exit(0);
  } catch(e) {
    console.error('Fatal migration error:', e);
    process.exit(1);
  }
}

updateDB();
