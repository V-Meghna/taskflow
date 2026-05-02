require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const authRoutes      = require('./routes/auth');
const projectRoutes   = require('./routes/projects');
const taskRoutes      = require('./routes/tasks');
const dashboardRoutes = require('./routes/dashboard');

const app  = express();
const PORT = process.env.PORT || 5000;

// CORS — allow Railway URL + localhost in dev
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  process.env.CLIENT_URL,
].filter(Boolean);

app.use(cors({
  origin: (origin, cb) => {
    // Allow requests with no origin (mobile, Postman, same-origin)
    if (!origin) return cb(null, true);
    if (allowedOrigins.includes(origin) || process.env.NODE_ENV === 'production') {
      return cb(null, true);
    }
    cb(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));

app.use(express.json());

// API Routes
app.use('/api/auth',                       authRoutes);
app.use('/api/projects',                   projectRoutes);
app.use('/api/projects/:projectId/tasks',  taskRoutes);
app.use('/api/dashboard',                  dashboardRoutes);

// Health check (Railway uses this)
app.get('/api/health', (req, res) =>
  res.json({ status: 'ok', timestamp: new Date() })
);

// Serve built React frontend in production
if (process.env.NODE_ENV === 'production') {
  const distPath = path.join(__dirname, '../frontend/dist');
  app.use(express.static(distPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 TaskFlow running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;
