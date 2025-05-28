const express = require('express');
const { authenticateToken, authorize } = require('../middleware/auth');
const { validate, validateParams, validateQuery, schemas, paramSchemas } = require('../middleware/validation');
const { asyncHandler } = require('../middleware/errorHandler');
const teacherController = require('../controllers/teacherController');

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

/**
 * @route   GET /api/teachers
 * @desc    Get all teachers with pagination and filtering
 * @access  Private (Admin only)
 * @query   { page, limit, search, status }
 */
router.get('/', 
  authorize(['admin']),
  validateQuery(
    require('joi').object({
      page: require('joi').number().integer().min(1).optional(),
      limit: require('joi').number().integer().min(1).max(100).optional(),
      search: require('joi').string().max(100).optional(),
      status: require('joi').string().valid('active', 'inactive', 'terminated').optional()
    })
  ),
  asyncHandler(teacherController.getAllTeachers)
);

/**
 * @route   POST /api/teachers
 * @desc    Create a new teacher
 * @access  Private (Admin only)
 * @body    { firstName, lastName, phoneNumber, qualification, etc. }
 */
router.post('/', 
  authorize(['admin']), 
  validate(schemas.teacher), 
  asyncHandler(teacherController.createTeacher)
);

/**
 * @route   GET /api/teachers/:id
 * @desc    Get teacher by ID with full details and statistics
 * @access  Private (Admin, Teacher - own profile)
 */
router.get('/:id', 
  validateParams(paramSchemas.id),
  asyncHandler(async (req, res, next) => {
    // Teachers can only access their own profile unless they're admin
    if (req.user.role === 'teacher') {
      const teacherProfile = req.user.teacherProfile;
      if (!teacherProfile || teacherProfile.id !== req.params.id) {
        return res.status(403).json({
          success: false,
          message: 'Access forbidden - can only view own profile',
          message_uz: 'Kirish taqiqlangan - faqat o\'z profilingizni ko\'rishingiz mumkin'
        });
      }
    }
    next();
  }),
  asyncHandler(teacherController.getTeacherById)
);

/**
 * @route   PUT /api/teachers/:id
 * @desc    Update teacher information
 * @access  Private (Admin only)
 */
router.put('/:id', 
  authorize(['admin']), 
  validateParams(paramSchemas.id),
  validate(schemas.updateTeacher), 
  asyncHandler(teacherController.updateTeacher)
);

/**
 * @route   DELETE /api/teachers/:id
 * @desc    Delete (soft delete) teacher
 * @access  Private (Admin only)
 */
router.delete('/:id', 
  authorize(['admin']), 
  validateParams(paramSchemas.id),
  asyncHandler(teacherController.deleteTeacher)
);

/**
 * @route   GET /api/teachers/:id/classes
 * @desc    Get teacher's classes with optional student details
 * @access  Private (Admin, Teacher - own classes)
 * @query   { includeStudents }
 */
router.get('/:id/classes', 
  validateParams(paramSchemas.id),
  validateQuery(
    require('joi').object({
      includeStudents: require('joi').string().valid('true', 'false').optional()
    })
  ),
  asyncHandler(async (req, res, next) => {
    // Teachers can only access their own classes unless they're admin
    if (req.user.role === 'teacher') {
      const teacherProfile = req.user.teacherProfile;
      if (!teacherProfile || teacherProfile.id !== req.params.id) {
        return res.status(403).json({
          success: false,
          message: 'Access forbidden - can only view own classes',
          message_uz: 'Kirish taqiqlangan - faqat o\'z sinflaringizni ko\'rishingiz mumkin'
        });
      }
    }
    next();
  }),
  asyncHandler(teacherController.getTeacherClasses)
);

/**
 * @route   GET /api/teachers/:id/subjects
 * @desc    Get teacher's subjects with statistics
 * @access  Private (Admin, Teacher - own subjects)
 */
router.get('/:id/subjects', 
  validateParams(paramSchemas.id),
  asyncHandler(async (req, res, next) => {
    // Teachers can only access their own subjects unless they're admin
    if (req.user.role === 'teacher') {
      const teacherProfile = req.user.teacherProfile;
      if (!teacherProfile || teacherProfile.id !== req.params.id) {
        return res.status(403).json({
          success: false,
          message: 'Access forbidden - can only view own subjects',
          message_uz: 'Kirish taqiqlangan - faqat o\'z fanlaringizni ko\'rishingiz mumkin'
        });
      }
    }
    next();
  }),
  asyncHandler(teacherController.getTeacherSubjects)
);

/**
 * @route   GET /api/teachers/:id/grades
 * @desc    Get teacher's grades with filtering and pagination
 * @access  Private (Admin, Teacher - own grades)
 * @query   { semester, academicYear, subjectId, classId, page, limit, gradeType, startDate, endDate }
 */
router.get('/:id/grades', 
  validateParams(paramSchemas.id),
  validateQuery(
    require('joi').object({
      semester: require('joi').number().integer().min(1).max(2).optional(),
      academicYear: require('joi').string().pattern(/^\d{4}-\d{4}$/).optional(),
      subjectId: require('joi').string().uuid().optional(),
      classId: require('joi').string().uuid().optional(),
      page: require('joi').number().integer().min(1).optional(),
      limit: require('joi').number().integer().min(1).max(100).optional(),
      gradeType: require('joi').string().valid('assignment', 'quiz', 'exam', 'project', 'participation').optional(),
      startDate: require('joi').date().optional(),
      endDate: require('joi').date().min(require('joi').ref('startDate')).optional()
    })
  ),
  asyncHandler(async (req, res, next) => {
    // Teachers can only access their own grades unless they're admin
    if (req.user.role === 'teacher') {
      const teacherProfile = req.user.teacherProfile;
      if (!teacherProfile || teacherProfile.id !== req.params.id) {
        return res.status(403).json({
          success: false,
          message: 'Access forbidden - can only view own grades',
          message_uz: 'Kirish taqiqlangan - faqat o\'z baholaringizni ko\'rishingiz mumkin'
        });
      }
    }
    next();
  }),
  asyncHandler(teacherController.getTeacherGrades)
);

/**
 * @route   GET /api/teachers/:id/attendance
 * @desc    Get teacher's attendance records with filtering
 * @access  Private (Admin, Teacher - own attendance)
 * @query   { startDate, endDate, classId, page, limit, status }
 */
router.get('/:id/attendance', 
  validateParams(paramSchemas.id),
  validateQuery(
    require('joi').object({
      startDate: require('joi').date().optional(),
      endDate: require('joi').date().min(require('joi').ref('startDate')).optional(),
      classId: require('joi').string().uuid().optional(),
      page: require('joi').number().integer().min(1).optional(),
      limit: require('joi').number().integer().min(1).max(100).optional(),
      status: require('joi').string().valid('present', 'absent', 'late', 'excused').optional()
    })
  ),
  asyncHandler(async (req, res, next) => {
    // Teachers can only access their own attendance unless they're admin
    if (req.user.role === 'teacher') {
      const teacherProfile = req.user.teacherProfile;
      if (!teacherProfile || teacherProfile.id !== req.params.id) {
        return res.status(403).json({
          success: false,
          message: 'Access forbidden - can only view own attendance records',
          message_uz: 'Kirish taqiqlangan - faqat o\'z davomat yozuvlaringizni ko\'rishingiz mumkin'
        });
      }
    }
    next();
  }),
  asyncHandler(teacherController.getTeacherAttendance)
);

/**
 * @route   GET /api/teachers/:id/schedule
 * @desc    Get teacher's class schedule
 * @access  Private (Admin, Teacher - own schedule)
 */
router.get('/:id/schedule', 
  validateParams(paramSchemas.id),
  asyncHandler(async (req, res, next) => {
    // Teachers can only access their own schedule unless they're admin
    if (req.user.role === 'teacher') {
      const teacherProfile = req.user.teacherProfile;
      if (!teacherProfile || teacherProfile.id !== req.params.id) {
        return res.status(403).json({
          success: false,
          message: 'Access forbidden - can only view own schedule',
          message_uz: 'Kirish taqiqlangan - faqat o\'z jadvalingizni ko\'rishingiz mumkin'
        });
      }
    }
    next();
  }),
  asyncHandler(teacherController.getTeacherSchedule)
);

/**
 * @route   GET /api/teachers/:id/dashboard
 * @desc    Get teacher's dashboard with comprehensive data
 * @access  Private (Admin, Teacher - own dashboard)
 */
router.get('/:id/dashboard', 
  validateParams(paramSchemas.id),
  asyncHandler(async (req, res, next) => {
    // Teachers can only access their own dashboard unless they're admin
    if (req.user.role === 'teacher') {
      const teacherProfile = req.user.teacherProfile;
      if (!teacherProfile || teacherProfile.id !== req.params.id) {
        return res.status(403).json({
          success: false,
          message: 'Access forbidden - can only view own dashboard',
          message_uz: 'Kirish taqiqlangan - faqat o\'z boshqaruv panelingizni ko\'rishingiz mumkin'
        });
      }
    }
    next();
  }),
  asyncHandler(teacherController.getTeacherDashboard)
);

module.exports = router;