const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const fileUpload = require('express-fileupload');
const { PrismaClient } = require('@prisma/client');

// Import routes
const authRoutes = require('../routes/auth');
const serviceRoutes = require('../routes/services');
const applicationRoutes = require('../routes/applications');
const complaintRoutes = require('../routes/complaints');
const rtiRoutes = require('../routes/rti');
const paymentRoutes = require('../routes/payments');
const dashboardRoutes = require('../routes/dashboard');
const adminRoutes = require('../routes/admin');
const userRoutes = require('../routes/user');
const documentRoutes = require('../routes/documents');

function createApp() {
  const app = express();
  const prisma = new PrismaClient();

  app.use(helmet());
  app.use(cors({
    origin: function (origin, callback) {
      const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:3000,http://localhost:5173').split(',').map((value) => value.trim());
      const isAllowed = !origin || allowedOrigins.includes(origin) || /\.vercel\.app$/i.test(origin || '') || /localhost(:\d+)?$/i.test(origin || '');
      if (isAllowed) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true
  }));

  app.use(express.json());
  app.use(express.urlencoded({ limit: '10mb', extended: true }));
  app.use(fileUpload({
    limits: { fileSize: 10 * 1024 * 1024 },
    abortOnLimit: true,
    responseOnLimit: 'File size exceeds the maximum limit of 10MB',
  }));

  const limiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || 900000),
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || 100),
    message: 'Too many requests, please try again later'
  });
  app.use('/api/', limiter);

  app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
      const duration = Date.now() - start;
      console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} ${res.statusCode} ${duration}ms`);
    });
    next();
  });

  app.use((req, res, next) => {
    req.prisma = prisma;
    next();
  });

  app.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
  });

  app.use('/api/auth', authRoutes);
  app.use('/api/services', serviceRoutes);
  app.use('/api/applications', applicationRoutes);
  app.use('/api/complaints', complaintRoutes);
  app.use('/api/rti', rtiRoutes);
  app.use('/api/payments', paymentRoutes);
  app.use('/api/dashboard', dashboardRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api/user', userRoutes);
  app.use('/api/documents', documentRoutes);
  app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
  });

  app.use((req, res) => {
    res.status(404).json({
      error: {
        code: 'NOT_FOUND',
        message: 'The requested resource was not found',
        path: req.path
      }
    });
  });

  app.use((err, req, res, next) => {
    console.error('Error:', err);

    if (err.name === 'UnauthorizedError') {
      return res.status(401).json({
        error: { code: 'UNAUTHORIZED', message: 'Unauthorized access' }
      });
    }

    if (err.name === 'ForbiddenError') {
      return res.status(403).json({
        error: { code: 'FORBIDDEN', message: 'Access forbidden' }
      });
    }

    if (err.status === 429) {
      return res.status(429).json({
        error: { code: 'RATE_LIMIT_EXCEEDED', message: 'Too many requests' }
      });
    }

    res.status(err.status || 500).json({
      error: {
        code: err.code || 'INTERNAL_SERVER_ERROR',
        message: err.message || 'Internal server error'
      }
    });
  });

  return app;
}

module.exports = createApp;
