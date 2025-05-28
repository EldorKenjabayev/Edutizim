const express = require('express');
const { authenticateToken, authorize } = require('../middleware/auth');
const { validate, validateParams, validateQuery, schemas, paramSchemas } = require('../middleware/validation');
const { asyncHandler } = require('../middleware/errorHandler');
const attendanceController = require('../controllers/attendanceController');

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

/**
 * @route   GET /api/attendance
 * @desc    Get all attendance records with filtering and pagination
 * @access  Private (Admin, Teacher - own records, Parent/Student - limited)
 * @query   { page, limit, studentId, classId, subjectId, date, startDate, endDate, status }
 */
router.get('/', 
  validateQuery(
    require('joi').object({
      page: require('joi').number().integer().min(1).optional(),
      limit: require('joi').number().integer().min(1).max(100).optional(),
      studentId: require('joi').string().uuid().optional(),
      classId: require('joi').string().uuid().optional(),
      subjectId: require('joi').string().uuid().optional(),
      date: require('joi').date().optional(),
      startDate: require('joi').date().optional(),
      endDate: require('joi').date().min(require('joi').ref('startDate')).optional(),
      status: require('joi').string().valid('present', 'absent', 'late', 'excused').optional()
    })
  ),
  asyncHandler(async (req, res, next) => {
    // Role-based filtering
    const { role } = req.user;
    
    if (role === 'teacher') {
      // Teachers can only see attendance records they've created
      // This will be handled in the controller
    } else if (role === 'student') {
      // Students can only see their own attendance
      const studentProfile = req.user.studentProfile;
      if (!studentProfile) {
        return res.status(403).json({
          success: false,
          message: 'Student profile not found',
          message_uz: 'Talaba profili topilmadi'
        });
      }
      req.query.studentId = studentProfile.id;
    } else if (role === 'parent') {
      // Parents can only see their children's attendance
      // This would require checking guardian relationships
      // For now, we'll let the controller handle it
    }
    
    next();
  }),
  asyncHandler(attendanceController.getAllAttendance)
);

/**
 * @route   POST /api/attendance
 * @desc    Mark attendance for a single student
 * @access  Private (Admin, Teacher)
 * @body    { studentId, classId, subjectId, date, status, timeIn, timeOut, reason, notes }
 */
router.post('/', 
  authorize(['admin', 'teacher']), 
  validate(schemas.attendance), 
  asyncHandler(attendanceController.markAttendance)
);

/**
 * @route   POST /api/attendance/batch
 * @desc    Mark attendance for multiple students at once
 * @access  Private (Admin, Teacher)
 * @body    { attendanceRecords: [{ studentId, classId, date, status, etc. }] }
 */
router.post('/batch', 
  authorize(['admin', 'teacher']), 
  validate(schemas.batchAttendance), 
  asyncHandler(attendanceController.batchMarkAttendance)
);

/**
 * @route   GET /api/attendance/report
 * @desc    Get attendance report with filtering
 * @access  Private (Admin, Teacher)
 * @query   { classId, startDate, endDate, studentId }
 */
router.get('/report', 
  authorize(['admin', 'teacher']),
  validateQuery(
    require('joi').object({
      classId: require('joi').string().uuid().optional(),
      startDate: require('joi').date().required(),
      endDate: require('joi').date().min(require('joi').ref('startDate')).required(),
      studentId: require('joi').string().uuid().optional(),
      format: require('joi').string().valid('json', 'csv', 'pdf').optional()
    })
  ),
  asyncHandler(attendanceController.getAttendanceReport)
);

/**
 * @route   GET /api/attendance/statistics
 * @desc    Get attendance statistics
 * @access  Private (Admin, Teacher)
 * @query   { classId, startDate, endDate }
 */
router.get('/statistics', 
  authorize(['admin', 'teacher']),
  validateQuery(
    require('joi').object({
      classId: require('joi').string().uuid().optional(),
      startDate: require('joi').date().optional(),
      endDate: require('joi').date().min(require('joi').ref('startDate')).optional()
    })
  ),
  asyncHandler(attendanceController.getAttendanceStatistics)
);

/**
 * @route   GET /api/attendance/:id
 * @desc    Get a specific attendance record by ID
 * @access  Private (Admin, Teacher - own records, Student/Parent - limited)
 */
router.get('/:id', 
  validateParams(paramSchemas.id),
  asyncHandler(async (req, res) => {
    // This would be implemented to get a single attendance record
    res.json({
      success: true,
      message: 'Get single attendance record functionality - to be implemented',
      message_uz: 'Bitta davomat yozuvi olish funksiyasi - amalga oshirilishi kerak'
    });
  })
);

/**
 * @route   PUT /api/attendance/:id
 * @desc    Update a specific attendance record
 * @access  Private (Admin, Teacher - own records)
 */
router.put('/:id', 
  authorize(['admin', 'teacher']), 
  validateParams(paramSchemas.id),
  validate(schemas.attendance), 
  asyncHandler(async (req, res) => {
    // This would be implemented to update an attendance record
    res.json({
      success: true,
      message: 'Update attendance record functionality - to be implemented',
      message_uz: 'Davomat yozuvi yangilash funksiyasi - amalga oshirilishi kerak'
    });
  })
);

/**
 * @route   DELETE /api/attendance/:id
 * @desc    Delete a specific attendance record
 * @access  Private (Admin, Teacher - own records)
 */
router.delete('/:id', 
  authorize(['admin', 'teacher']), 
  validateParams(paramSchemas.id),
  asyncHandler(async (req, res) => {
    // This would be implemented to delete an attendance record
    res.json({
      success: true,
      message: 'Delete attendance record functionality - to be implemented',
      message_uz: 'Davomat yozuvi o\'chirish funksiyasi - amalga oshirilishi kerak'
    });
  })
);

/**
 * @route   GET /api/attendance/student/:studentId/summary
 * @desc    Get attendance summary for a specific student
 * @access  Private (Admin, Teacher, Parent - own children, Student - own attendance)
 * @query   { startDate, endDate, classId }
 */
router.get('/student/:studentId/summary', 
  validateParams(
    require('joi').object({
      studentId: require('joi').string().uuid().required()
    })
  ),
  validateQuery(
    require('joi').object({
      startDate: require('joi').date().optional(),
      endDate: require('joi').date().min(require('joi').ref('startDate')).optional(),
      classId: require('joi').string().uuid().optional()
    })
  ),
  asyncHandler(async (req, res, next) => {
    // Authorization check
    const { studentId } = req.params;
    const { role } = req.user;
    
    if (role === 'student') {
      const studentProfile = req.user.studentProfile;
      if (!studentProfile || studentProfile.id !== studentId) {
        return res.status(403).json({
          success: false,
          message: 'Access forbidden - can only view own attendance summary',
          message_uz: 'Kirish taqiqlangan - faqat o\'z davomat xulosangizni ko\'rishingiz mumkin'
        });
      }
    } else if (role === 'parent') {
      // Check if this student is the parent's child
      // This would require guardian relationship checking
    }
    next();
  }),
  asyncHandler(async (req, res) => {
    // This would provide a comprehensive attendance summary
    res.json({
      success: true,
      message: 'Student attendance summary functionality - to be implemented',
      message_uz: 'Talaba davomat xulosa funksiyasi - amalga oshirilishi kerak'
    });
  })
);

/**
 * @route   GET /api/attendance/class/:classId/summary
 * @desc    Get attendance summary for a specific class
 * @access  Private (Admin, Teacher)
 * @query   { startDate, endDate, subjectId }
 */
router.get('/class/:classId/summary', 
  authorize(['admin', 'teacher']),
  validateParams(
    require('joi').object({
      classId: require('joi').string().uuid().required()
    })
  ),
  validateQuery(
    require('joi').object({
      startDate: require('joi').date().optional(),
      endDate: require('joi').date().min(require('joi').ref('startDate')).optional(),
      subjectId: require('joi').string().uuid().optional()
    })
  ),
  asyncHandler(async (req, res) => {
    // This would provide class-wide attendance statistics
    res.json({
      success: true,
      message: 'Class attendance summary functionality - to be implemented',
      message_uz: 'Sinf davomat xulosa funksiyasi - amalga oshirilishi kerak'
    });
  })
);

/**
 * @route   GET /api/attendance/daily/:date
 * @desc    Get daily attendance overview for all classes
 * @access  Private (Admin, Teacher)
 * @query   { classId, subjectId }
 */
router.get('/daily/:date', 
  authorize(['admin', 'teacher']),
  validateParams(
    require('joi').object({
      date: require('joi').date().required()
    })
  ),
  validateQuery(
    require('joi').object({
      classId: require('joi').string().uuid().optional(),
      subjectId: require('joi').string().uuid().optional()
    })
  ),
  asyncHandler(async (req, res) => {
    // This would provide daily attendance overview
    res.json({
      success: true,
      message: 'Daily attendance overview functionality - to be implemented',
      message_uz: 'Kunlik davomat ko\'rinish funksiyasi - amalga oshirilishi kerak'
    });
  })
);

/**
 * @route   POST /api/attendance/alerts
 * @desc    Get attendance alerts (students with poor attendance)
 * @access  Private (Admin, Teacher)
 * @body    { thresholdPercentage, startDate, endDate, classId }
 */
router.post('/alerts', 
  authorize(['admin', 'teacher']),
  validate(
    require('joi').object({
      thresholdPercentage: require('joi').number().min(0).max(100).required(),
      startDate: require('joi').date().required(),
      endDate: require('joi').date().min(require('joi').ref('startDate')).required(),
      classId: require('joi').string().uuid().optional()
    })
  ),
  asyncHandler(async (req, res) => {
    // This would identify students with attendance below threshold
    res.json({
      success: true,
      message: 'Attendance alerts functionality - to be implemented',
      message_uz: 'Davomat ogohlantirishlari funksiyasi - amalga oshirilishi kerak'
    });
  })
);

/**
 * @route   POST /api/attendance/bulk-update
 * @desc    Bulk update attendance records
 * @access  Private (Admin, Teacher)
 * @body    { updates: [{ id, status, reason, notes }] }
 */
router.post('/bulk-update', 
  authorize(['admin', 'teacher']),
  validate(
    require('joi').object({
      updates: require('joi').array().items(
        require('joi').object({
          id: require('joi').string().uuid().required(),
          status: require('joi').string().valid('present', 'absent', 'late', 'excused').optional(),
          reason: require('joi').string().max(200).optional(),
          notes: require('joi').string().max(500).optional()
        })
      ).min(1).required()
    })
  ),
  asyncHandler(async (req, res) => {
    // This would bulk update multiple attendance records
    res.json({
      success: true,
      message: 'Bulk attendance update functionality - to be implemented',
      message_uz: 'Ommaviy davomat yangilash funksiyasi - amalga oshirilishi kerak'
    });
  })
);

module.exports = router;