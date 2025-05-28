const express = require('express');
const { authenticateToken, authorize } = require('../middleware/auth');
const { validate, validateParams, validateQuery, schemas, paramSchemas } = require('../middleware/validation');
const { asyncHandler } = require('../middleware/errorHandler');
const gradeController = require('../controllers/gradeController');

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

/**
 * @route   GET /api/grades
 * @desc    Get all grades with filtering and pagination
 * @access  Private (Admin, Teacher - own grades, Parent/Student - limited)
 * @query   { page, limit, studentId, subjectId, classId, semester, academicYear, gradeType }
 */
router.get('/', 
  validateQuery(
    require('joi').object({
      page: require('joi').number().integer().min(1).optional(),
      limit: require('joi').number().integer().min(1).max(100).optional(),
      studentId: require('joi').string().uuid().optional(),
      subjectId: require('joi').string().uuid().optional(),
      classId: require('joi').string().uuid().optional(),
      semester: require('joi').number().integer().min(1).max(2).optional(),
      academicYear: require('joi').string().pattern(/^\d{4}-\d{4}$/).optional(),
      gradeType: require('joi').string().valid('assignment', 'quiz', 'exam', 'project', 'participation').optional()
    })
  ),
  asyncHandler(async (req, res, next) => {
    // Role-based filtering
    const { role } = req.user;
    
    if (role === 'teacher') {
      // Teachers can only see grades they've given
      // This will be handled in the controller
    } else if (role === 'student') {
      // Students can only see their own grades
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
      // Parents can only see their children's grades
      // This would require checking guardian relationships
      // For now, we'll let the controller handle it
    }
    
    next();
  }),
  asyncHandler(gradeController.getAllGrades)
);

/**
 * @route   POST /api/grades
 * @desc    Create a single grade
 * @access  Private (Admin, Teacher)
 * @body    { studentId, subjectId, classId, gradeValue, gradeType, semester, academicYear, etc. }
 */
router.post('/', 
  authorize(['admin', 'teacher']), 
  validate(schemas.grade), 
  asyncHandler(gradeController.createGrade)
);

/**
 * @route   POST /api/grades/batch
 * @desc    Create multiple grades at once
 * @access  Private (Admin, Teacher)
 * @body    { grades: [{ studentId, subjectId, classId, gradeValue, gradeType, etc. }] }
 */
router.post('/batch', 
  authorize(['admin', 'teacher']), 
  validate(schemas.batchGrades), 
  asyncHandler(gradeController.batchCreateGrades)
);

/**
 * @route   GET /api/grades/statistics
 * @desc    Get grade statistics with filtering
 * @access  Private (Admin, Teacher)
 * @query   { classId, subjectId, semester, academicYear }
 */
router.get('/statistics', 
  authorize(['admin', 'teacher']),
  validateQuery(
    require('joi').object({
      classId: require('joi').string().uuid().optional(),
      subjectId: require('joi').string().uuid().optional(),
      semester: require('joi').number().integer().min(1).max(2).optional(),
      academicYear: require('joi').string().pattern(/^\d{4}-\d{4}$/).optional()
    })
  ),
  asyncHandler(gradeController.getGradeStatistics)
);

/**
 * @route   GET /api/grades/:id
 * @desc    Get a specific grade by ID
 * @access  Private (Admin, Teacher - own grades, Student/Parent - limited)
 */
router.get('/:id', 
  validateParams(paramSchemas.id),
  asyncHandler(async (req, res) => {
    // This would be implemented to get a single grade
    res.json({
      success: true,
      message: 'Get single grade functionality - to be implemented',
      message_uz: 'Bitta baho olish funksiyasi - amalga oshirilishi kerak'
    });
  })
);

/**
 * @route   PUT /api/grades/:id
 * @desc    Update a specific grade
 * @access  Private (Admin, Teacher - own grades)
 */
router.put('/:id', 
  authorize(['admin', 'teacher']), 
  validateParams(paramSchemas.id),
  validate(schemas.grade), 
  asyncHandler(gradeController.updateGrade)
);

/**
 * @route   DELETE /api/grades/:id
 * @desc    Delete a specific grade
 * @access  Private (Admin, Teacher - own grades)
 */
router.delete('/:id', 
  authorize(['admin', 'teacher']), 
  validateParams(paramSchemas.id),
  asyncHandler(async (req, res) => {
    // This would be implemented to delete a grade
    res.json({
      success: true,
      message: 'Delete grade functionality - to be implemented',
      message_uz: 'Baho o\'chirish funksiyasi - amalga oshirilishi kerak'
    });
  })
);

/**
 * @route   GET /api/grades/student/:studentId/summary
 * @desc    Get grade summary for a specific student
 * @access  Private (Admin, Teacher, Parent - own children, Student - own grades)
 * @query   { semester, academicYear }
 */
router.get('/student/:studentId/summary', 
  validateParams(
    require('joi').object({
      studentId: require('joi').string().uuid().required()
    })
  ),
  validateQuery(
    require('joi').object({
      semester: require('joi').number().integer().min(1).max(2).optional(),
      academicYear: require('joi').string().pattern(/^\d{4}-\d{4}$/).optional()
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
          message: 'Access forbidden - can only view own grade summary',
          message_uz: 'Kirish taqiqlangan - faqat o\'z baho xulosangizni ko\'rishingiz mumkin'
        });
      }
    } else if (role === 'parent') {
      // Check if this student is the parent's child
      // This would require guardian relationship checking
    }
    next();
  }),
  asyncHandler(async (req, res) => {
    // This would provide a comprehensive grade summary
    res.json({
      success: true,
      message: 'Student grade summary functionality - to be implemented',
      message_uz: 'Talaba baho xulosa funksiyasi - amalga oshirilishi kerak'
    });
  })
);

/**
 * @route   GET /api/grades/class/:classId/summary
 * @desc    Get grade summary for a specific class
 * @access  Private (Admin, Teacher)
 * @query   { semester, academicYear, subjectId }
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
      semester: require('joi').number().integer().min(1).max(2).optional(),
      academicYear: require('joi').string().pattern(/^\d{4}-\d{4}$/).optional(),
      subjectId: require('joi').string().uuid().optional()
    })
  ),
  asyncHandler(async (req, res) => {
    // This would provide class-wide grade statistics
    res.json({
      success: true,
      message: 'Class grade summary functionality - to be implemented',
      message_uz: 'Sinf baho xulosa funksiyasi - amalga oshirilishi kerak'
    });
  })
);

/**
 * @route   GET /api/grades/subject/:subjectId/statistics
 * @desc    Get grade statistics for a specific subject
 * @access  Private (Admin, Teacher)
 * @query   { classId, semester, academicYear }
 */
router.get('/subject/:subjectId/statistics', 
  authorize(['admin', 'teacher']),
  validateParams(
    require('joi').object({
      subjectId: require('joi').string().uuid().required()
    })
  ),
  validateQuery(
    require('joi').object({
      classId: require('joi').string().uuid().optional(),
      semester: require('joi').number().integer().min(1).max(2).optional(),
      academicYear: require('joi').string().pattern(/^\d{4}-\d{4}$/).optional()
    })
  ),
  asyncHandler(async (req, res) => {
    // This would provide subject-specific grade statistics
    res.json({
      success: true,
      message: 'Subject grade statistics functionality - to be implemented',
      message_uz: 'Fan baho statistika funksiyasi - amalga oshirilishi kerak'
    });
  })
);

/**
 * @route   POST /api/grades/calculate-gpa
 * @desc    Calculate GPA for students
 * @access  Private (Admin, Teacher)
 * @body    { studentIds, semester, academicYear }
 */
router.post('/calculate-gpa', 
  authorize(['admin', 'teacher']),
  validate(
    require('joi').object({
      studentIds: require('joi').array().items(require('joi').string().uuid()).min(1).required(),
      semester: require('joi').number().integer().min(1).max(2).optional(),
      academicYear: require('joi').string().pattern(/^\d{4}-\d{4}$/).optional(),
      includeWeights: require('joi').boolean().optional()
    })
  ),
  asyncHandler(async (req, res) => {
    // This would calculate GPA for specified students
    res.json({
      success: true,
      message: 'GPA calculation functionality - to be implemented',
      message_uz: 'GPA hisoblash funksiyasi - amalga oshirilishi kerak'
    });
  })
);

module.exports = router;