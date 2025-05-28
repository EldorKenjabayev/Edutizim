const express = require('express');
const { authenticateToken, authorize } = require('../middleware/auth');
const { validate, validateParams, validateQuery, schemas, paramSchemas } = require('../middleware/validation');
const { asyncHandler } = require('../middleware/errorHandler');
const studentController = require('../controllers/studentController');

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

/**
 * @route   GET /api/students
 * @desc    Get all students with pagination and filtering
 * @access  Private (Admin, Teacher)
 * @query   { page, limit, search, classId, status }
 */
router.get('/', 
  authorize(['admin', 'teacher']),
  validateQuery(
    require('joi').object({
      page: require('joi').number().integer().min(1).optional(),
      limit: require('joi').number().integer().min(1).max(100).optional(),
      search: require('joi').string().max(100).optional(),
      classId: require('joi').string().uuid().optional(),
      status: require('joi').string().valid('active', 'graduated', 'transferred', 'withdrawn').optional(),
      grade: require('joi').number().integer().min(1).max(11).optional(),
      sortBy: require('joi').string().valid('firstName', 'lastName', 'studentNumber', 'enrollmentDate').optional(),
      sortOrder: require('joi').string().valid('asc', 'desc').optional()
    })
  ),
  asyncHandler(studentController.getAllStudents)
);

/**
 * @route   POST /api/students
 * @desc    Create a new student
 * @access  Private (Admin only)
 * @body    { firstName, lastName, dateOfBirth, gender, classId, etc. }
 */
router.post('/', 
  authorize(['admin']), 
  validate(schemas.student), 
  asyncHandler(studentController.createStudent)
);

/**
 * @route   POST /api/students/bulk
 * @desc    Create multiple students at once (bulk import)
 * @access  Private (Admin only)
 * @body    { students: [{ firstName, lastName, dateOfBirth, etc. }] }
 */
router.post('/bulk', 
  authorize(['admin']),
  validate(
    require('joi').object({
      students: require('joi').array().items(schemas.student).min(1).max(100).required(),
      skipDuplicates: require('joi').boolean().optional(),
      updateExisting: require('joi').boolean().optional()
    })
  ),
  asyncHandler(async (req, res) => {
    // This would be implemented for bulk student creation
    res.json({
      success: true,
      message: 'Bulk student creation functionality - to be implemented',
      message_uz: 'Ommaviy talaba yaratish funksiyasi - amalga oshirilishi kerak'
    });
  })
);

/**
 * @route   GET /api/students/search
 * @desc    Advanced search for students
 * @access  Private (Admin, Teacher)
 * @query   { query, filters, page, limit }
 */
router.get('/search', 
  authorize(['admin', 'teacher']),
  validateQuery(
    require('joi').object({
      query: require('joi').string().min(1).max(100).required(),
      filters: require('joi').object({
        classId: require('joi').string().uuid().optional(),
        status: require('joi').string().valid('active', 'graduated', 'transferred', 'withdrawn').optional(),
        grade: require('joi').number().integer().min(1).max(11).optional(),
        gender: require('joi').string().valid('male', 'female').optional(),
        ageRange: require('joi').object({
          min: require('joi').number().integer().min(5).max(25).optional(),
          max: require('joi').number().integer().min(5).max(25).optional()
        }).optional()
      }).optional(),
      page: require('joi').number().integer().min(1).optional(),
      limit: require('joi').number().integer().min(1).max(50).optional()
    })
  ),
  asyncHandler(async (req, res) => {
    // This would implement advanced search functionality
    res.json({
      success: true,
      message: 'Advanced student search functionality - to be implemented',
      message_uz: 'Kengaytirilgan talaba qidiruv funksiyasi - amalga oshirilishi kerak'
    });
  })
);

/**
 * @route   GET /api/students/statistics
 * @desc    Get student statistics overview
 * @access  Private (Admin, Teacher)
 * @query   { classId, grade, academicYear }
 */
router.get('/statistics', 
  authorize(['admin', 'teacher']),
  validateQuery(
    require('joi').object({
      classId: require('joi').string().uuid().optional(),
      grade: require('joi').number().integer().min(1).max(11).optional(),
      academicYear: require('joi').string().pattern(/^\d{4}-\d{4}$/).optional()
    })
  ),
  asyncHandler(async (req, res) => {
    // This would provide comprehensive student statistics
    const statistics = {
      total: 0,
      byStatus: {
        active: 0,
        graduated: 0,
        transferred: 0,
        withdrawn: 0
      },
      byGrade: {},
      byGender: {
        male: 0,
        female: 0
      },
      enrollmentTrends: [],
      performanceOverview: {
        averageGrade: 0,
        attendanceRate: 0
      }
    };

    res.json({
      success: true,
      data: { statistics },
      message: 'Student statistics functionality - basic structure implemented',
      message_uz: 'Talaba statistikasi funksiyasi - asosiy tuzilma amalga oshirildi'
    });
  })
);

/**
 * @route   GET /api/students/:id
 * @desc    Get student by ID with full details
 * @access  Private (Admin, Teacher, Parent - limited access, Student - own profile)
 */
router.get('/:id', 
  validateParams(paramSchemas.id),
  asyncHandler(async (req, res, next) => {
    // Authorization check based on user role
    const { id } = req.params;
    const { role } = req.user;
    
    if (role === 'student') {
      // Students can only access their own profile
      const studentProfile = req.user.studentProfile;
      if (!studentProfile || studentProfile.id !== id) {
        return res.status(403).json({
          success: false,
          message: 'Access forbidden - can only view own profile',
          message_uz: 'Kirish taqiqlangan - faqat o\'z profilingizni ko\'rishingiz mumkin'
        });
      }
    } else if (role === 'parent') {
      // Parents can only access their own children
      // This logic would be implemented based on guardian relationships
      // For now, we'll allow access and let the controller handle it
    }
    next();
  }),
  asyncHandler(studentController.getStudentById)
);

/**
 * @route   PUT /api/students/:id
 * @desc    Update student information
 * @access  Private (Admin only)
 */
router.put('/:id', 
  authorize(['admin']), 
  validateParams(paramSchemas.id),
  validate(schemas.updateStudent), 
  asyncHandler(studentController.updateStudent)
);

/**
 * @route   PATCH /api/students/:id/status
 * @desc    Update student status only
 * @access  Private (Admin only)
 * @body    { status, reason }
 */
router.patch('/:id/status', 
  authorize(['admin']), 
  validateParams(paramSchemas.id),
  validate(
    require('joi').object({
      status: require('joi').string().valid('active', 'graduated', 'transferred', 'withdrawn').required(),
      reason: require('joi').string().max(500).optional(),
      effectiveDate: require('joi').date().optional()
    })
  ),
  asyncHandler(async (req, res) => {
    // This would update only the student status
    res.json({
      success: true,
      message: 'Student status update functionality - to be implemented',
      message_uz: 'Talaba holat yangilash funksiyasi - amalga oshirilishi kerak'
    });
  })
);

/**
 * @route   DELETE /api/students/:id
 * @desc    Delete (soft delete) student
 * @access  Private (Admin only)
 */
router.delete('/:id', 
  authorize(['admin']), 
  validateParams(paramSchemas.id),
  asyncHandler(studentController.deleteStudent)
);

/**
 * @route   GET /api/students/:id/grades
 * @desc    Get student grades with filtering
 * @access  Private (Admin, Teacher, Parent - own children, Student - own grades)
 * @query   { semester, academicYear, subjectId, gradeType, page, limit }
 */
router.get('/:id/grades', 
  validateParams(paramSchemas.id),
  validateQuery(
    require('joi').object({
      semester: require('joi').number().integer().min(1).max(2).optional(),
      academicYear: require('joi').string().pattern(/^\d{4}-\d{4}$/).optional(),
      subjectId: require('joi').string().uuid().optional(),
      gradeType: require('joi').string().valid('assignment', 'quiz', 'exam', 'project', 'participation').optional(),
      page: require('joi').number().integer().min(1).optional(),
      limit: require('joi').number().integer().min(1).max(100).optional(),
      includeStatistics: require('joi').boolean().optional()
    })
  ),
  asyncHandler(async (req, res, next) => {
    // Authorization check based on user role
    const { id } = req.params;
    const { role } = req.user;
    
    if (role === 'student') {
      // Students can only access their own grades
      const studentProfile = req.user.studentProfile;
      if (!studentProfile || studentProfile.id !== id) {
        return res.status(403).json({
          success: false,
          message: 'Access forbidden - can only view own grades',
          message_uz: 'Kirish taqiqlangan - faqat o\'z baholaringizni ko\'rishingiz mumkin'
        });
      }
    } else if (role === 'parent') {
      // Parents can only access their children's grades
      // This would require checking guardian relationships
      // For now, we'll proceed and let the controller handle it
    }
    next();
  }),
  asyncHandler(studentController.getStudentGrades)
);

/**
 * @route   GET /api/students/:id/grades/summary
 * @desc    Get student grades summary with analytics
 * @access  Private (Admin, Teacher, Parent - own children, Student - own grades)
 * @query   { semester, academicYear }
 */
router.get('/:id/grades/summary', 
  validateParams(paramSchemas.id),
  validateQuery(
    require('joi').object({
      semester: require('joi').number().integer().min(1).max(2).optional(),
      academicYear: require('joi').string().pattern(/^\d{4}-\d{4}$/).optional()
    })
  ),
  asyncHandler(async (req, res, next) => {
    // Authorization check
    const { id } = req.params;
    const { role } = req.user;
    
    if (role === 'student') {
      const studentProfile = req.user.studentProfile;
      if (!studentProfile || studentProfile.id !== id) {
        return res.status(403).json({
          success: false,
          message: 'Access forbidden - can only view own grade summary',
          message_uz: 'Kirish taqiqlangan - faqat o\'z baho xulosangizni ko\'rishingiz mumkin'
        });
      }
    }
    next();
  }),
  asyncHandler(async (req, res) => {
    // This would provide grade summary with analytics
    res.json({
      success: true,
      message: 'Student grade summary functionality - to be implemented',
      message_uz: 'Talaba baho xulosa funksiyasi - amalga oshirilishi kerak'
    });
  })
);

/**
 * @route   GET /api/students/:id/attendance
 * @desc    Get student attendance records
 * @access  Private (Admin, Teacher, Parent - own children, Student - own attendance)
 * @query   { startDate, endDate, subjectId, status, page, limit }
 */
router.get('/:id/attendance', 
  validateParams(paramSchemas.id),
  validateQuery(
    require('joi').object({
      startDate: require('joi').date().optional(),
      endDate: require('joi').date().min(require('joi').ref('startDate')).optional(),
      subjectId: require('joi').string().uuid().optional(),
      status: require('joi').string().valid('present', 'absent', 'late', 'excused').optional(),
      page: require('joi').number().integer().min(1).optional(),
      limit: require('joi').number().integer().min(1).max(100).optional(),
      includeStatistics: require('joi').boolean().optional()
    })
  ),
  asyncHandler(async (req, res, next) => {
    // Authorization check based on user role
    const { id } = req.params;
    const { role } = req.user;
    
    if (role === 'student') {
      // Students can only access their own attendance
      const studentProfile = req.user.studentProfile;
      if (!studentProfile || studentProfile.id !== id) {
        return res.status(403).json({
          success: false,
          message: 'Access forbidden - can only view own attendance',
          message_uz: 'Kirish taqiqlangan - faqat o\'z davomatingizni ko\'rishingiz mumkin'
        });
      }
    } else if (role === 'parent') {
      // Parents can only access their children's attendance
      // This would require checking guardian relationships
      // For now, we'll proceed and let the controller handle it
    }
    next();
  }),
  asyncHandler(studentController.getStudentAttendance)
);

/**
 * @route   GET /api/students/:id/attendance/summary
 * @desc    Get student attendance summary with analytics
 * @access  Private (Admin, Teacher, Parent - own children, Student - own attendance)
 * @query   { startDate, endDate }
 */
router.get('/:id/attendance/summary', 
  validateParams(paramSchemas.id),
  validateQuery(
    require('joi').object({
      startDate: require('joi').date().optional(),
      endDate: require('joi').date().min(require('joi').ref('startDate')).optional()
    })
  ),
  asyncHandler(async (req, res, next) => {
    // Authorization check
    const { id } = req.params;
    const { role } = req.user;
    
    if (role === 'student') {
      const studentProfile = req.user.studentProfile;
      if (!studentProfile || studentProfile.id !== id) {
        return res.status(403).json({
          success: false,
          message: 'Access forbidden - can only view own attendance summary',
          message_uz: 'Kirish taqiqlangan - faqat o\'z davomat xulosangizni ko\'rishingiz mumkin'
        });
      }
    }
    next();
  }),
  asyncHandler(async (req, res) => {
    // This would provide attendance summary with analytics
    res.json({
      success: true,
      message: 'Student attendance summary functionality - to be implemented',
      message_uz: 'Talaba davomat xulosa funksiyasi - amalga oshirilishi kerak'
    });
  })
);

/**
 * @route   GET /api/students/:id/report-card
 * @desc    Get student's comprehensive report card
 * @access  Private (Admin, Teacher, Parent - own children, Student - own report)
 * @query   { semester, academicYear, format }
 */
router.get('/:id/report-card', 
  validateParams(paramSchemas.id),
  validateQuery(
    require('joi').object({
      semester: require('joi').number().integer().min(1).max(2).optional(),
      academicYear: require('joi').string().pattern(/^\d{4}-\d{4}$/).optional(),
      format: require('joi').string().valid('json', 'pdf').optional()
    })
  ),
  asyncHandler(async (req, res, next) => {
    // Authorization check similar to grades and attendance
    const { id } = req.params;
    const { role } = req.user;
    
    if (role === 'student') {
      const studentProfile = req.user.studentProfile;
      if (!studentProfile || studentProfile.id !== id) {
        return res.status(403).json({
          success: false,
          message: 'Access forbidden - can only view own report card',
          message_uz: 'Kirish taqiqlangan - faqat o\'z hisobotingizni ko\'rishingiz mumkin'
        });
      }
    }
    next();
  }),
  asyncHandler(async (req, res) => {
    // This would combine grades and attendance for a comprehensive report
    res.json({
      success: true,
      message: 'Report card functionality - to be implemented',
      message_uz: 'Hisobot kartasi funksiyasi - amalga oshirilishi kerak'
    });
  })
);

/**
 * @route   GET /api/students/:id/performance-summary
 * @desc    Get student's performance summary with analytics
 * @access  Private (Admin, Teacher, Parent - own children, Student - own summary)
 */
router.get('/:id/performance-summary', 
  validateParams(paramSchemas.id),
  validateQuery(
    require('joi').object({
      period: require('joi').string().valid('current-semester', 'current-year', 'all-time').optional(),
      includeComparison: require('joi').boolean().optional()
    })
  ),
  asyncHandler(async (req, res, next) => {
    // Authorization check
    const { id } = req.params;
    const { role } = req.user;
    
    if (role === 'student') {
      const studentProfile = req.user.studentProfile;
      if (!studentProfile || studentProfile.id !== id) {
        return res.status(403).json({
          success: false,
          message: 'Access forbidden - can only view own performance summary',
          message_uz: 'Kirish taqiqlangan - faqat o\'z natija xulosangizni ko\'rishingiz mumkin'
        });
      }
    }
    next();
  }),
  asyncHandler(async (req, res) => {
    // This would provide analytics and trends for the student
    res.json({
      success: true,
      message: 'Performance summary functionality - to be implemented',
      message_uz: 'Natija xulosa funksiyasi - amalga oshirilishi kerak'
    });
  })
);

/**
 * @route   GET /api/students/:id/guardian-info
 * @desc    Get student's guardian information
 * @access  Private (Admin, Teacher, Parent - own children, Student - own guardians)
 */
router.get('/:id/guardian-info', 
  validateParams(paramSchemas.id),
  asyncHandler(async (req, res, next) => {
    // Authorization check
    const { id } = req.params;
    const { role } = req.user;
    
    if (role === 'student') {
      const studentProfile = req.user.studentProfile;
      if (!studentProfile || studentProfile.id !== id) {
        return res.status(403).json({
          success: false,
          message: 'Access forbidden - can only view own guardian information',
          message_uz: 'Kirish taqiqlangan - faqat o\'z vasiy ma\'lumotlaringizni ko\'rishingiz mumkin'
        });
      }
    }
    next();
  }),
  asyncHandler(async (req, res) => {
    // This would get guardian information for the student
    res.json({
      success: true,
      message: 'Guardian information functionality - to be implemented',
      message_uz: 'Vasiy ma\'lumotlari funksiyasi - amalga oshirilishi kerak'
    });
  })
);

/**
 * @route   POST /api/students/:id/guardians
 * @desc    Add guardian to student
 * @access  Private (Admin only)
 * @body    { guardianId, relationship, isPrimary }
 */
router.post('/:id/guardians', 
  authorize(['admin']), 
  validateParams(paramSchemas.id),
  validate(
    require('joi').object({
      guardianId: require('joi').string().uuid().required(),
      relationship: require('joi').string().valid('father', 'mother', 'guardian', 'other').optional(),
      isPrimary: require('joi').boolean().optional(),
      emergencyContact: require('joi').boolean().optional()
    })
  ),
  asyncHandler(async (req, res) => {
    // This would add a guardian relationship to the student
    res.json({
      success: true,
      message: 'Add guardian functionality - to be implemented',
      message_uz: 'Vasiy qo\'shish funksiyasi - amalga oshirilishi kerak'
    });
  })
);

/**
 * @route   PUT /api/students/:id/guardians/:guardianId
 * @desc    Update guardian relationship
 * @access  Private (Admin only)
 * @body    { relationship, isPrimary, emergencyContact }
 */
router.put('/:id/guardians/:guardianId', 
  authorize(['admin']), 
  validateParams(
    require('joi').object({
      id: require('joi').string().uuid().required(),
      guardianId: require('joi').string().uuid().required()
    })
  ),
  validate(
    require('joi').object({
      relationship: require('joi').string().valid('father', 'mother', 'guardian', 'other').optional(),
      isPrimary: require('joi').boolean().optional(),
      emergencyContact: require('joi').boolean().optional()
    })
  ),
  asyncHandler(async (req, res) => {
    // This would update guardian relationship
    res.json({
      success: true,
      message: 'Update guardian relationship functionality - to be implemented',
      message_uz: 'Vasiy munosabat yangilash funksiyasi - amalga oshirilishi kerak'
    });
  })
);

/**
 * @route   DELETE /api/students/:id/guardians/:guardianId
 * @desc    Remove guardian from student
 * @access  Private (Admin only)
 */
router.delete('/:id/guardians/:guardianId', 
  authorize(['admin']), 
  validateParams(
    require('joi').object({
      id: require('joi').string().uuid().required(),
      guardianId: require('joi').string().uuid().required()
    })
  ),
  asyncHandler(async (req, res) => {
    // This would remove guardian relationship
    res.json({
      success: true,
      message: 'Remove guardian functionality - to be implemented',
      message_uz: 'Vasiyni olib tashlash funksiyasi - amalga oshirilishi kerak'
    });
  })
);

/**
 * @route   POST /api/students/:id/transfer
 * @desc    Transfer student to another class
 * @access  Private (Admin only)
 * @body    { newClassId, transferDate, reason }
 */
router.post('/:id/transfer', 
  authorize(['admin']), 
  validateParams(paramSchemas.id),
  validate(
    require('joi').object({
      newClassId: require('joi').string().uuid().required(),
      transferDate: require('joi').date().optional(),
      reason: require('joi').string().max(500).optional(),
      notes: require('joi').string().max(1000).optional()
    })
  ),
  asyncHandler(async (req, res) => {
    // This would handle student transfer between classes
    res.json({
      success: true,
      message: 'Student transfer functionality - to be implemented',
      message_uz: 'Talaba ko\'chirish funksiyasi - amalga oshirilishi kerak'
    });
  })
);

/**
 * @route   GET /api/students/:id/academic-history
 * @desc    Get student's complete academic history
 * @access  Private (Admin, Teacher, Parent - own children, Student - own history)
 */
router.get('/:id/academic-history', 
  validateParams(paramSchemas.id),
  asyncHandler(async (req, res, next) => {
    // Authorization check
    const { id } = req.params;
    const { role } = req.user;
    
    if (role === 'student') {
      const studentProfile = req.user.studentProfile;
      if (!studentProfile || studentProfile.id !== id) {
        return res.status(403).json({
          success: false,
          message: 'Access forbidden - can only view own academic history',
          message_uz: 'Kirish taqiqlangan - faqat o\'z akademik tarixingizni ko\'rishingiz mumkin'
        });
      }
    }
    next();
  }),
  asyncHandler(async (req, res) => {
    // This would provide complete academic history
    res.json({
      success: true,
      message: 'Academic history functionality - to be implemented',
      message_uz: 'Akademik tarix funksiyasi - amalga oshirilishi kerak'
    });
  })
);

/**
 * @route   GET /api/students/:id/dashboard
 * @desc    Get student's personalized dashboard
 * @access  Private (Admin, Teacher, Parent - own children, Student - own dashboard)
 */
router.get('/:id/dashboard', 
  validateParams(paramSchemas.id),
  asyncHandler(async (req, res, next) => {
    // Authorization check
    const { id } = req.params;
    const { role } = req.user;
    
    if (role === 'student') {
      const studentProfile = req.user.studentProfile;
      if (!studentProfile || studentProfile.id !== id) {
        return res.status(403).json({
          success: false,
          message: 'Access forbidden - can only view own dashboard',
          message_uz: 'Kirish taqiqlangan - faqat o\'z boshqaruv panelingizni ko\'rishingiz mumkin'
        });
      }
    }
    next();
  }),
  asyncHandler(async (req, res) => {
    // This would provide personalized dashboard data
    const dashboardData = {
      student: {
        id: req.params.id,
        recentGrades: [],
        attendanceRate: 0,
        upcomingAssignments: [],
        recentActivity: [],
        alerts: []
      },
      performance: {
        currentGPA: 0,
        semesterAverage: 0,
        subjectPerformance: []
      },
      attendance: {
        currentRate: 0,
        monthlyTrend: [],
        alerts: []
      }
    };

    res.json({
      success: true,
      data: dashboardData,
      message: 'Student dashboard functionality - basic structure implemented',
      message_uz: 'Talaba boshqaruv paneli funksiyasi - asosiy tuzilma amalga oshirildi'
    });
  })
);

module.exports = router;