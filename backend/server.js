require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { testConnection } = require('./config/db');

// Import routes
const authRoutes = require('./routes/authRoutes');
const examRoutes = require('./routes/examRoutes');
const questionRoutes = require('./routes/questionRoutes');
const resultRoutes = require('./routes/resultRoutes');
const userRoutes = require('./routes/userRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware co ban
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging don gian cho moi Request
app.use((req, res, next) => {
  const timestamp = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');
  console.log(`[${timestamp}] ${req.method} ${req.url}`);
  next();
});

// Phuc vu static files frontend truc tiep tu backend (thuan tien khi chay 1 port hoac qua web server)
const frontendPath = path.join(__dirname, '..', 'frontend');
app.use(express.static(frontendPath));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/exams', examRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/results', resultRoutes);
app.use('/api/users', userRoutes);

// Root Healthcheck API
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Quiz System API Server is running smoothly!',
    timestamp: new Date()
  });
});

// Mac dinh khi truy cap root / chuyen thang den trang Dang nhap
app.get('/', (req, res) => {
  res.sendFile(path.join(frontendPath, 'login.html'));
});

// Fallback: tra ve trang dang nhap neu nguoi dung go URL khong phai API
app.get('*', (req, res, next) => {
  if (req.url.startsWith('/api/')) {
    return res.status(404).json({ success: false, message: 'API route not found' });
  }
  res.sendFile(path.join(frontendPath, 'login.html'));
});

// Khoi dong server
app.listen(PORT, async () => {
  console.log('==================================================');
  console.log(`  Quiz System Server dang khoi dong tren PORT ${PORT}`);
  console.log(`  URL Backend & Frontend: http://localhost:${PORT}`);
  console.log('==================================================');
  
  // Kiem tra ket noi Database MySQL
  await testConnection();
});
