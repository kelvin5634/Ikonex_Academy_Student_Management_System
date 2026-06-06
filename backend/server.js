const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

// ====================== MIDDLEWARE ======================
app.use(cors({
  origin: ['http://localhost:3000'],   // ← Add your frontend URL
  credentials: true,
}));

app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check (keep this at the top)
app.get('/api/health', (_req, res) => 
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
);

// ====================== ROUTES ======================
app.use('/api/auth',      require('./routes/auth'));
app.use('/api/streams',   require('./routes/streams'));
app.use('/api/students',  require('./routes/students'));
app.use('/api/subjects',  require('./routes/subjects'));
app.use('/api/scores',    require('./routes/scores'));
app.use('/api/results',   require('./routes/results'));
app.use('/api/reports',   require('./routes/reports'));
app.use('/api/dashboard', require('./routes/dashboard'));

// ====================== ERROR HANDLING ======================
app.use((err, _req, res, _next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.path}` });
});

// ====================== START SERVER ======================
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Ikonex API running on http://localhost:${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/api/health`);
});


