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

// Prometheus Metrics Setup
const client = require('prom-client');
const register = new client.Registry();
client.collectDefaultMetrics({ register });

// Custom HTTP Metrics
const httpRequestDurationMicroseconds = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'code'],
  buckets: [0.01, 0.05, 0.1, 0.3, 0.5, 1, 2, 5]
});
register.registerMetric(httpRequestDurationMicroseconds);

// Middleware co ban
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Metrics & Logging Middleware
app.use((req, res, next) => {
  const timestamp = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');
  console.log(`[${timestamp}] ${req.method} ${req.url}`);

  const start = process.hrtime();
  res.on('finish', () => {
    const diff = process.hrtime(start);
    const duration = diff[0] + diff[1] / 1e9;
    const route = req.route ? req.route.path : req.path;
    httpRequestDurationMicroseconds
      .labels(req.method, route, res.statusCode)
      .observe(duration);
  });

  next();
});

// Prometheus Scrape Endpoint
app.get('/metrics', async (req, res) => {
  try {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  } catch (ex) {
    res.status(500).end(ex);
  }
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
