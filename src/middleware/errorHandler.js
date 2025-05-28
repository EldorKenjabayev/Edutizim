const errorHandler = (err, req, res, next) => {
    console.error('Error:', err);
  
    // Sequelize validation errors
    if (err.name === 'SequelizeValidationError') {
      const errors = err.errors.map(error => ({
        field: error.path,
        message: error.message
      }));
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        message_uz: 'Ma\'lumot tekshirish xatosi',
        errors
      });
    }
  
    // Sequelize unique constraint errors
    if (err.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({
        success: false,
        message: 'Resource already exists',
        message_uz: 'Resurs allaqachon mavjud',
        field: err.errors[0]?.path
      });
    }
  
    // Sequelize foreign key constraint errors
    if (err.name === 'SequelizeForeignKeyConstraintError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid reference',
        message_uz: 'Yaroqsiz havola'
      });
    }
  
    // Default error
    res.status(err.statusCode || 500).json({
      success: false,
      message: err.message || 'Internal server error',
      message_uz: err.message_uz || 'Ichki server xatosi',
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
  };
  
  module.exports = errorHandler;