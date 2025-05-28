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

  grade: Joi.object({
    studentId: Joi.string().uuid().required(),
    subjectId: Joi.string().uuid().required(),
    classId: Joi.string().uuid().required(),
    gradeValue: Joi.number().min(0).max(100).required(),
    gradeType: Joi.string().valid('assignment', 'quiz', 'exam', 'project', 'participation').required(),
    semester: Joi.number().min(1).max(2).required(),
    academicYear: Joi.string().required(),
    weight: Joi.number().min(0).max(1).optional(),
    comments: Joi.string().optional()
  }),

  attendance: Joi.object({
    studentId: Joi.string().uuid().required(),
    classId: Joi.string().uuid().required(),
    subjectId: Joi.string().uuid().optional(),
    date: Joi.date().required(),
    status: Joi.string().valid('present', 'absent', 'late', 'excused').required(),
    timeIn: Joi.string().optional(),
    timeOut: Joi.string().optional(),
    reason: Joi.string().optional(),
    notes: Joi.string().optional()
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