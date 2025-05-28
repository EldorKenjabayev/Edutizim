const Joi = require('joi');

const validate = (schema) => (req, res, next) => {
  const { error } = schema.validate(req.body);
  
  if (error) {
    return res.status(400).json({
      success: false,
      message: error.details[0].message,
      message_uz: 'So\'rov ma\'lumotlarida xatolik'
    });
  }
  
  next();
};

const validateParams = (schema) => (req, res, next) => {
  const { error } = schema.validate(req.params);
  
  if (error) {
    return res.status(400).json({
      success: false,
      message: error.details[0].message,
      message_uz: 'Yo\'l parametrlarida xatolik'
    });
  }
  
  next();
};

const validateQuery = (schema) => (req, res, next) => {
  const { error } = schema.validate(req.query);
  
  if (error) {
    return res.status(400).json({
      success: false,
      message: error.details[0].message,
      message_uz: 'So\'rov parametrlarida xatolik'
    });
  }
  
  next();
};

// Validation schemas
const schemas = {
  register: Joi.object({
    username: Joi.string().min(3).max(50).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    firstName: Joi.string().min(2).max(50).required(),
    lastName: Joi.string().min(2).max(50).required(),
    role: Joi.string().valid('admin', 'teacher', 'parent', 'student').required()
  }),

  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
  }),

  refreshToken: Joi.object({
    refreshToken: Joi.string().required()
  }),

  student: Joi.object({
    firstName: Joi.string().min(2).max(50).required(),
    lastName: Joi.string().min(2).max(50).required(),
    dateOfBirth: Joi.date().required(),
    gender: Joi.string().valid('male', 'female').required(),
    classId: Joi.string().uuid().optional(),
    address: Joi.string().optional(),
    phoneNumber: Joi.string().optional(),
    medicalInfo: Joi.string().optional(),
    notes: Joi.string().optional()
  }),

  updateStudent: Joi.object({
    firstName: Joi.string().min(2).max(50).optional(),
    lastName: Joi.string().min(2).max(50).optional(),
    dateOfBirth: Joi.date().optional(),
    gender: Joi.string().valid('male', 'female').optional(),
    classId: Joi.string().uuid().allow(null).optional(),
    address: Joi.string().allow('').optional(),
    phoneNumber: Joi.string().allow('').optional(),
    medicalInfo: Joi.string().allow('').optional(),
    notes: Joi.string().allow('').optional(),
    status: Joi.string().valid('active', 'graduated', 'transferred', 'withdrawn').optional()
  }),

  teacher: Joi.object({
    firstName: Joi.string().min(2).max(50).required(),
    lastName: Joi.string().min(2).max(50).required(),
    phoneNumber: Joi.string().optional(),
    address: Joi.string().optional(),
    qualification: Joi.string().optional(),
    experience: Joi.number().integer().min(0).optional(),
    hireDate: Joi.date().optional(),
    salary: Joi.number().min(0).optional(),
    subjects: Joi.array().items(Joi.string().uuid()).optional(),
    classes: Joi.array().items(Joi.string().uuid()).optional()
  }),

  updateTeacher: Joi.object({
    firstName: Joi.string().min(2).max(50).optional(),
    lastName: Joi.string().min(2).max(50).optional(),
    phoneNumber: Joi.string().allow('').optional(),
    address: Joi.string().allow('').optional(),
    qualification: Joi.string().allow('').optional(),
    experience: Joi.number().integer().min(0).optional(),
    hireDate: Joi.date().optional(),
    salary: Joi.number().min(0).optional(),
    subjects: Joi.array().items(Joi.string().uuid()).optional(),
    classes: Joi.array().items(Joi.string().uuid()).optional(),
    status: Joi.string().valid('active', 'inactive', 'terminated').optional()
  }),

  grade: Joi.object({
    studentId: Joi.string().uuid().required(),
    subjectId: Joi.string().uuid().required(),
    classId: Joi.string().uuid().required(),
    gradeValue: Joi.number().min(0).max(100).required(),
    gradeType: Joi.string().valid('assignment', 'quiz', 'exam', 'project', 'participation').required(),
    semester: Joi.number().min(1).max(2).required(),
    academicYear: Joi.string().pattern(/^\d{4}-\d{4}$/).required(),
    weight: Joi.number().min(0).max(1).optional(),
    comments: Joi.string().allow('').optional()
  }),

  batchGrades: Joi.object({
    grades: Joi.array().items(
      Joi.object({
        studentId: Joi.string().uuid().required(),
        subjectId: Joi.string().uuid().required(),
        classId: Joi.string().uuid().required(),
        gradeValue: Joi.number().min(0).max(100).required(),
        gradeType: Joi.string().valid('assignment', 'quiz', 'exam', 'project', 'participation').required(),
        semester: Joi.number().min(1).max(2).required(),
        academicYear: Joi.string().pattern(/^\d{4}-\d{4}$/).required(),
        weight: Joi.number().min(0).max(1).optional(),
        comments: Joi.string().allow('').optional()
      })
    ).min(1).required()
  }),

  attendance: Joi.object({
    studentId: Joi.string().uuid().required(),
    classId: Joi.string().uuid().required(),
    subjectId: Joi.string().uuid().optional(),
    date: Joi.date().required(),
    status: Joi.string().valid('present', 'absent', 'late', 'excused').required(),
    timeIn: Joi.string().optional(),
    timeOut: Joi.string().optional(),
    reason: Joi.string().allow('').optional(),
    notes: Joi.string().allow('').optional()
  }),

  batchAttendance: Joi.object({
    attendanceRecords: Joi.array().items(
      Joi.object({
        studentId: Joi.string().uuid().required(),
        classId: Joi.string().uuid().required(),
        subjectId: Joi.string().uuid().optional(),
        date: Joi.date().required(),
        status: Joi.string().valid('present', 'absent', 'late', 'excused').required(),
        timeIn: Joi.string().optional(),
        timeOut: Joi.string().optional(),
        reason: Joi.string().allow('').optional(),
        notes: Joi.string().allow('').optional()
      })
    ).min(1).required()
  })
};

const paramSchemas = {
  id: Joi.object({
    id: Joi.string().uuid().required()
  })
};

module.exports = {
  validate,
  validateParams,
  validateQuery,
  schemas,
  paramSchemas
};