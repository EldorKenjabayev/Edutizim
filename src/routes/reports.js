const express = require('express');
const { authenticateToken, authorize } = require('../middleware/auth');
const { validateQuery, validateParams } = require('../middleware/validation');
const { asyncHandler } = require('../middleware/errorHandler');
const reportController = require('../controllers/reportController');

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

/**
 * @route   GET /api/reports/students
 * @desc    Get comprehensive student reports
 * @access  Private (Admin, Teacher)
 * @query   { classId, startDate, endDate, format }
 */
router.get('/students', 
  authorize(['admin', 'teacher']), 
  validateQuery(
    require('joi').object({
      classId: require('joi').string().uuid().optional(),
      startDate: require('joi').date().optional(),
      endDate: require('joi').date().min(require('joi').ref('startDate')).optional(),
      format: require('joi').string().valid('json', 'csv', 'pdf', 'excel').optional(),
      includeGrades: require('joi').boolean().optional(),
      includeAttendance: require('joi').boolean().optional()
    })
  ),
  asyncHandler(reportController.getStudentReport)
);

/**
 * @route   GET /api/reports/grades
 * @desc    Get comprehensive grade reports
 * @access  Private (Admin, Teacher)
 * @query   { classId, subjectId, semester, academicYear, format }
 */
router.get('/grades', 
  authorize(['admin', 'teacher']), 
  validateQuery(
    require('joi').object({
      classId: require('joi').string().uuid().optional(),
      subjectId: require('joi').string().uuid().optional(),
      semester: require('joi').number().integer().min(1).max(2).optional(),
      academicYear: require('joi').string().pattern(/^\d{4}-\d{4}$/).optional(),
      format: require('joi').string().valid('json', 'csv', 'pdf', 'excel').optional(),
      includeStatistics: require('joi').boolean().optional()
    })
  ),
  asyncHandler(reportController.getGradeReport)
);

/**
 * @route   GET /api/reports/attendance
 * @desc    Get comprehensive attendance reports
 * @access  Private (Admin, Teacher)
 * @query   { classId, startDate, endDate, studentId, format }
 */
router.get('/attendance', 
  authorize(['admin', 'teacher']), 
  validateQuery(
    require('joi').object({
      classId: require('joi').string().uuid().optional(),
      startDate: require('joi').date().optional(),
      endDate: require('joi').date().min(require('joi').ref('startDate')).optional(),
      studentId: require('joi').string().uuid().optional(),
      format: require('joi').string().valid('json', 'csv', 'pdf', 'excel').optional(),
      includeStatistics: require('joi').boolean().optional()
    })
  ),
  asyncHandler(reportController.getAttendanceReport)
);

/**
 * @route   GET /api/reports/class-performance
 * @desc    Get class performance reports
 * @access  Private (Admin, Teacher)
 * @query   { classId, academicYear, semester, format }
 */
router.get('/class-performance', 
  authorize(['admin', 'teacher']), 
  validateQuery(
    require('joi').object({
      classId: require('joi').string().uuid().required(),
      academicYear: require('joi').string().pattern(/^\d{4}-\d{4}$/).optional(),
      semester: require('joi').number().integer().min(1).max(2).optional(),
      format: require('joi').string().valid('json', 'csv', 'pdf', 'excel').optional(),
      includeComparison: require('joi').boolean().optional()
    })
  ),
  asyncHandler(reportController.getClassPerformanceReport)
);

/**
 * @route   GET /api/reports/teacher-performance
 * @desc    Get teacher performance reports
 * @access  Private (Admin, Teacher - own performance)
 * @query   { teacherId, startDate, endDate, format }
 */
router.get('/teacher-performance', 
  validateQuery(
    require('joi').object({
      teacherId: require('joi').string().uuid().optional(),
      startDate: require('joi').date().optional(),
      endDate: require('joi').date().min(require('joi').ref('startDate')).optional(),
      format: require('joi').string().valid('json', 'csv', 'pdf', 'excel').optional()
    })
  ),
  asyncHandler(async (req, res, next) => {
    // Authorization check
    const { role } = req.user;
    
    if (role === 'teacher') {
      // Teachers can only view their own performance
      const teacherProfile = req.user.teacherProfile;
      if (!teacherProfile) {
        return res.status(403).json({
          success: false,
          message: 'Teacher profile not found',
          message_uz: 'O\'qituvchi profili topilmadi'
        });
      }
      
      // If teacherId is provided, check if it matches the authenticated teacher
      if (req.query.teacherId && req.query.teacherId !== teacherProfile.id) {
        return res.status(403).json({
          success: false,
          message: 'Access forbidden - can only view own performance',
          message_uz: 'Kirish taqiqlangan - faqat o\'z samaradorligingizni ko\'rishingiz mumkin'
        });
      }
      
      // Set teacherId to current teacher
      req.query.teacherId = teacherProfile.id;
    } else if (role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access forbidden',
        message_uz: 'Kirish taqiqlangan'
      });
    }
    
    next();
  }),
  asyncHandler(reportController.getTeacherPerformanceReport)
);

/**
 * @route   GET /api/reports/academic-summary
 * @desc    Get academic year summary report
 * @access  Private (Admin, Teacher)
 * @query   { academicYear, classId, format }
 */
router.get('/academic-summary', 
  authorize(['admin', 'teacher']), 
  validateQuery(
    require('joi').object({
      academicYear: require('joi').string().pattern(/^\d{4}-\d{4}$/).required(),
      classId: require('joi').string().uuid().optional(),
      format: require('joi').string().valid('json', 'csv', 'pdf', 'excel').optional()
    })
  ),
  asyncHandler(async (req, res) => {
    // This would provide comprehensive academic year summary
    res.json({
      success: true,
      message: 'Academic summary report functionality - to be implemented',
      message_uz: 'Akademik yil xulosa hisoboti funksiyasi - amalga oshirilishi kerak'
    });
  })
);

/**
 * @route   GET /api/reports/progress-tracking
 * @desc    Get student progress tracking report
 * @access  Private (Admin, Teacher, Parent - own children)
 * @query   { studentId, startDate, endDate, subjects, format }
 */
router.get('/progress-tracking', 
  validateQuery(
    require('joi').object({
      studentId: require('joi').string().uuid().required(),
      startDate: require('joi').date().required(),
      endDate: require('joi').date().min(require('joi').ref('startDate')).required(),
      subjects: require('joi').array().items(require('joi').string().uuid()).optional(),
      format: require('joi').string().valid('json', 'csv', 'pdf', 'excel').optional()
    })
  ),
  asyncHandler(async (req, res, next) => {
    // Authorization check
    const { studentId } = req.query;
    const { role } = req.user;
    
    if (role === 'parent') {
      // Parents can only view their children's progress
      // This would require checking guardian relationships
      // For now, we'll proceed and let the controller handle it
    } else if (role === 'student') {
      // Students can only view their own progress
      const studentProfile = req.user.studentProfile;
      if (!studentProfile || studentProfile.id !== studentId) {
        return res.status(403).json({
          success: false,
          message: 'Access forbidden - can only view own progress',
          message_uz: 'Kirish taqiqlangan - faqat o\'z rivojlanishingizni ko\'rishingiz mumkin'
        });
      }
    } else if (!['admin', 'teacher'].includes(role)) {
      return res.status(403).json({
        success: false,
        message: 'Access forbidden',
        message_uz: 'Kirish taqiqlangan'
      });
    }
    
    next();
  }),
  asyncHandler(async (req, res) => {
    // This would provide detailed progress tracking
    res.json({
      success: true,
      message: 'Progress tracking report functionality - to be implemented',
      message_uz: 'Rivojlanish kuzatuv hisoboti funksiyasi - amalga oshirilishi kerak'
    });
  })
);

/**
 * @route   GET /api/reports/parent-summary
 * @desc    Get parent summary report for their children
 * @access  Private (Parent only)
 * @query   { startDate, endDate, format }
 */
router.get('/parent-summary', 
  authorize(['parent']),
  validateQuery(
    require('joi').object({
      startDate: require('joi').date().optional(),
      endDate: require('joi').date().min(require('joi').ref('startDate')).optional(),
      format: require('joi').string().valid('json', 'csv', 'pdf', 'excel').optional()
    })
  ),
  asyncHandler(async (req, res) => {
    // This would provide summary for all children of the parent
    res.json({
      success: true,
      message: 'Parent summary report functionality - to be implemented',
      message_uz: 'Ota-ona xulosa hisoboti funksiyasi - amalga oshirilishi kerak'
    });
  })
);

/**
 * @route   GET /api/reports/dashboard-summary
 * @desc    Get dashboard summary statistics
 * @access  Private (Admin, Teacher, Parent - limited)
 */
router.get('/dashboard-summary', 
  asyncHandler(async (req, res) => {
    const { role } = req.user;
    
    // Role-based dashboard summary
    let summary = {};
    
    if (role === 'admin') {
      // Admin gets system-wide statistics
      summary = {
        totalStudents: 0,
        totalTeachers: 0,
        totalClasses: 0,
        recentActivity: [],
        systemAlerts: []
      };
    } else if (role === 'teacher') {
      // Teacher gets their class/subject statistics
      summary = {
        myClasses: 0,
        myStudents: 0,
        recentGrades: [],
        upcomingClasses: [],
        attendanceAlerts: []
      };
    } else if (role === 'parent') {
      // Parent gets their children's summary
      summary = {
        children: [],
        recentGrades: [],
        attendanceAlerts: [],
        upcomingEvents: []
      };
    } else if (role === 'student') {
      // Student gets their own summary
      summary = {
        recentGrades: [],
        attendanceRate: 0,
        upcomingAssignments: [],
        achievements: []
      };
    }
    
    res.json({
      success: true,
      data: summary,
      message: 'Dashboard summary functionality - basic structure implemented',
      message_uz: 'Boshqaruv paneli xulosa funksiyasi - asosiy tuzilma amalga oshirildi'
    });
  })
);

/**
 * @route   POST /api/reports/custom
 * @desc    Generate custom report based on criteria
 * @access  Private (Admin, Teacher)
 * @body    { reportType, filters, columns, format }
 */
router.post('/custom', 
  authorize(['admin', 'teacher']),
  require('../middleware/validation').validate(
    require('joi').object({
      reportType: require('joi').string().valid('students', 'grades', 'attendance', 'performance').required(),
      filters: require('joi').object({
        classId: require('joi').string().uuid().optional(),
        subjectId: require('joi').string().uuid().optional(),
        startDate: require('joi').date().optional(),
        endDate: require('joi').date().min(require('joi').ref('startDate')).optional(),
        semester: require('joi').number().integer().min(1).max(2).optional(),
        academicYear: require('joi').string().pattern(/^\d{4}-\d{4}$/).optional()
      }).optional(),
      columns: require('joi').array().items(require('joi').string()).optional(),
      format: require('joi').string().valid('json', 'csv', 'pdf', 'excel').optional(),
      groupBy: require('joi').string().optional(),
      sortBy: require('joi').string().optional(),
      sortOrder: require('joi').string().valid('asc', 'desc').optional()
    })
  ),
  asyncHandler(async (req, res) => {
    // This would generate custom reports based on user criteria
    res.json({
      success: true,
      message: 'Custom report generation functionality - to be implemented',
      message_uz: 'Maxsus hisobot yaratish funksiyasi - amalga oshirilishi kerak'
    });
  })
);

/**
 * @route   GET /api/reports/export/:type
 * @desc    Export reports in different formats
 * @access  Private (Admin, Teacher)
 * @query   { format, filters }
 */
router.get('/export/:type', 
  authorize(['admin', 'teacher']), 
  validateParams(
    require('joi').object({
      type: require('joi').string().valid('students', 'grades', 'attendance', 'class-performance', 'teacher-performance').required()
    })
  ),
  validateQuery(
    require('joi').object({
      format: require('joi').string().valid('csv', 'pdf', 'excel').required(),
      classId: require('joi').string().uuid().optional(),
      subjectId: require('joi').string().uuid().optional(),
      startDate: require('joi').date().optional(),
      endDate: require('joi').date().optional(),
      semester: require('joi').number().integer().min(1).max(2).optional(),
      academicYear: require('joi').string().pattern(/^\d{4}-\d{4}$/).optional()
    })
  ),
  asyncHandler(reportController.exportReport)
);

/**
 * @route   GET /api/reports/analytics/trends
 * @desc    Get analytical trends and insights
 * @access  Private (Admin, Teacher)
 * @query   { type, period, classId, subjectId }
 */
router.get('/analytics/trends', 
  authorize(['admin', 'teacher']),
  validateQuery(
    require('joi').object({
      type: require('joi').string().valid('grades', 'attendance', 'performance').required(),
      period: require('joi').string().valid('week', 'month', 'semester', 'year').optional(),
      classId: require('joi').string().uuid().optional(),
      subjectId: require('joi').string().uuid().optional(),
      compareWith: require('joi').string().valid('previous-period', 'school-average').optional()
    })
  ),
  asyncHandler(async (req, res) => {
    // This would provide trend analysis and insights
    res.json({
      success: true,
      message: 'Analytics trends functionality - to be implemented',
      message_uz: 'Analitik tendentsiyalar funksiyasi - amalga oshirilishi kerak'
    });
  })
);

/**
 * @route   GET /api/reports/alerts
 * @desc    Get system alerts and notifications for reports
 * @access  Private (Admin, Teacher)
 * @query   { type, priority, limit }
 */
router.get('/alerts', 
  authorize(['admin', 'teacher']),
  validateQuery(
    require('joi').object({
      type: require('joi').string().valid('attendance', 'grades', 'performance', 'system').optional(),
      priority: require('joi').string().valid('low', 'medium', 'high', 'critical').optional(),
      limit: require('joi').number().integer().min(1).max(50).optional()
    })
  ),
  asyncHandler(async (req, res) => {
    // This would provide alerts for administrators and teachers
    const alerts = [
      {
        id: '1',
        type: 'attendance',
        priority: 'high',
        message: '5 students have attendance below 80% this week',
        message_uz: '5 ta talabaning bu hafta davomat ko\'rsatkichi 80% dan past',
        timestamp: new Date().toISOString(),
        affected: {
          students: 5,
          classes: 2
        }
      },
      {
        id: '2',
        type: 'grades',
        priority: 'medium',
        message: 'Class 9-A average grade dropped by 10% this semester',
        message_uz: '9-A sinf o\'rtacha bahosi bu semestrda 10% ga tushdi',
        timestamp: new Date().toISOString(),
        affected: {
          class: '9-A',
          subjects: 3
        }
      }
    ];

    res.json({
      success: true,
      data: { alerts },
      message: 'System alerts functionality - basic implementation',
      message_uz: 'Tizim ogohlantirishlari funksiyasi - asosiy amalga oshirish'
    });
  })
);

module.exports = router;