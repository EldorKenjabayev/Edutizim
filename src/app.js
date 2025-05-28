// src/app.js - To'g'rilangan versiya
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const { errorHandler } = require('./middleware/errorHandler');

const app = express();

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://yourdomain.com'] 
    : ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.',
    message_uz: 'Bu IP manzildan juda ko\'p so\'rov yuborildi, keyinroq urinib ko\'ring.'
  }
});
app.use('/api/', limiter);

// Logging
app.use(morgan('combined'));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files
app.use('/uploads', express.static('uploads'));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    service: 'EduSmartSystem Backend'
  });
});

// Import routes with proper error handling
function safeImportRoute(routePath, fallbackMessage, fallbackMessageUz) {
  try {
    return require(routePath);
  } catch (error) {
    console.warn(`Route ${routePath} not found:`, error.message);
    const router = express.Router();
    router.all('*', (req, res) => {
      res.status(501).json({
        success: false,
        message: fallbackMessage,
        message_uz: fallbackMessageUz
      });
    });
    return router;
  }
}

// Import all routes
const authRoutes = safeImportRoute('./routes/auth', 
  'Auth routes not implemented yet', 
  'Auth yo\'nalishlari hali amalga oshirilmagan'
);

const studentRoutes = safeImportRoute('./routes/students', 
  'Student routes not implemented yet', 
  'Talaba yo\'nalishlari hali amalga oshirilmagan'
);

const teacherRoutes = safeImportRoute('./routes/teachers', 
  'Teacher routes not implemented yet', 
  'O\'qituvchi yo\'nalishlari hali amalga oshirilmagan'
);

const gradeRoutes = safeImportRoute('./routes/grades', 
  'Grade routes not implemented yet', 
  'Baho yo\'nalishlari hali amalga oshirilmagan'
);

const attendanceRoutes = safeImportRoute('./routes/attendance', 
  'Attendance routes not implemented yet', 
  'Davomat yo\'nalishlari hali amalga oshirilmagan'
);

const reportRoutes = safeImportRoute('./routes/reports', 
  'Report routes not implemented yet', 
  'Hisobot yo\'nalishlari hali amalga oshirilmagan'
);

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/teachers', teacherRoutes);
app.use('/api/grades', gradeRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/reports', reportRoutes);

// API documentation endpoint
app.get('/api/docs', (req, res) => {
  res.json({
    title: 'EduSmartSystem API Documentation',
    version: '1.0.0',
    description: 'Student Management System API for Uzbekistan Schools',
    endpoints: {
      auth: {
        'POST /api/auth/login': 'User authentication',
        'POST /api/auth/register': 'User registration',
        'POST /api/auth/refresh': 'Token refresh',
        'POST /api/auth/logout': 'User logout',
        'GET /api/auth/profile': 'Get user profile'
      },
      students: {
        'GET /api/students': 'Get all students',
        'POST /api/students': 'Create new student',
        'GET /api/students/:id': 'Get student by ID',
        'PUT /api/students/:id': 'Update student',
        'DELETE /api/students/:id': 'Delete student'
      },
      teachers: {
        'GET /api/teachers': 'Get all teachers',
        'POST /api/teachers': 'Create new teacher',
        'GET /api/teachers/:id': 'Get teacher by ID',
        'PUT /api/teachers/:id': 'Update teacher',
        'DELETE /api/teachers/:id': 'Delete teacher'
      },
      grades: {
        'GET /api/grades': 'Get grades',
        'POST /api/grades': 'Create grade',
        'PUT /api/grades/:id': 'Update grade'
      },
      attendance: {
        'GET /api/attendance': 'Get attendance records',
        'POST /api/attendance': 'Mark attendance',
        'PUT /api/attendance/:id': 'Update attendance'
      },
      reports: {
        'GET /api/reports/students': 'Student reports',
        'GET /api/reports/grades': 'Grade reports',
        'GET /api/reports/attendance': 'Attendance reports'
      }
    },
    status: 'Available endpoints listed above'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    message: 'The requested endpoint does not exist',
    message_uz: 'So\'ralgan endpoint mavjud emas',
    availableEndpoints: '/api/docs'
  });
});

// Global error handler
app.use(errorHandler);

module.exports = app;