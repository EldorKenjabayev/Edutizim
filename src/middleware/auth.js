const jwt = require('jsonwebtoken');
const { User } = require('../models');
const authConfig = require('../config/auth');

const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access token required',
        message_uz: 'Kirish tokeni talab qilinadi'
      });
    }

    const decoded = jwt.verify(token, authConfig.jwt.secret);
    const user = await User.findByPk(decoded.userId);

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or deactivated user',
        message_uz: 'Yaroqsiz yoki faolsizlantirilgan foydalanuvchi'
      });
    }

    req.user = user;
    req.userId = user.id;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(403).json({
        success: false,
        message: 'Invalid token',
        message_uz: 'Yaroqsiz token'
      });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(403).json({
        success: false,
        message: 'Token expired',
        message_uz: 'Token muddati tugagan'
      });
    }
    return res.status(500).json({
      success: false,
      message: 'Authentication failed',
      message_uz: 'Autentifikatsiya xatosi'
    });
  }
};

const authorize = (roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions',
        message_uz: 'Ruxsat etilmagan'
      });
    }
    next();
  };
};

module.exports = {
  authenticateToken,
  authorize
};