const Joi = require('joi');

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

module.exports = { validateQuery }; 