const express = require('express');
const { validate, schemas } = require('../middleware/validation');
const { authenticateToken } = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');
const authController = require('../controllers/authController');

const router = express.Router();

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 * @body    { username, email, password, firstName, lastName, role }
 */
router.post('/register', 
  validate(schemas.register), 
  asyncHandler(authController.register)
);

/**
 * @route   POST /api/auth/login
 * @desc    Authenticate user and get token
 * @access  Public
 * @body    { email, password }
 */
router.post('/login', 
  validate(schemas.login), 
  asyncHandler(authController.login)
);

/**
 * @route   POST /api/auth/refresh
 * @desc    Refresh access token using refresh token
 * @access  Public
 * @body    { refreshToken }
 */
router.post('/refresh', 
  validate(schemas.refreshToken), 
  asyncHandler(authController.refreshToken)
);

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user and invalidate refresh token
 * @access  Private
 */
router.post('/logout', 
  authenticateToken, 
  asyncHandler(authController.logout)
);

/**
 * @route   GET /api/auth/profile
 * @desc    Get current user profile
 * @access  Private
 */
router.get('/profile', 
  authenticateToken, 
  asyncHandler(authController.getProfile)
);

/**
 * @route   PUT /api/auth/profile
 * @desc    Update current user profile
 * @access  Private
 * @body    { firstName, lastName, phoneNumber, etc. }
 */
router.put('/profile', 
  authenticateToken,
  validate(
    require('joi').object({
      firstName: require('joi').string().min(2).max(50).optional(),
      lastName: require('joi').string().min(2).max(50).optional(),
      phoneNumber: require('joi').string().pattern(/^(\+998|998|8)?[0-9]{9}$/).optional(),
      address: require('joi').string().max(500).optional()
    })
  ),
  asyncHandler(async (req, res) => {
    // This would be implemented in authController
    res.json({
      success: true,
      message: 'Profile update functionality - to be implemented',
      message_uz: 'Profil yangilash funksiyasi - amalga oshirilishi kerak'
    });
  })
);

/**
 * @route   POST /api/auth/change-password
 * @desc    Change user password
 * @access  Private
 * @body    { currentPassword, newPassword }
 */
router.post('/change-password',
  authenticateToken,
  validate(
    require('joi').object({
      currentPassword: require('joi').string().required(),
      newPassword: require('joi').string().min(6).required(),
      confirmPassword: require('joi').string().valid(require('joi').ref('newPassword')).required()
    })
  ),
  asyncHandler(async (req, res) => {
    // This would be implemented in authController
    res.json({
      success: true,
      message: 'Password change functionality - to be implemented',
      message_uz: 'Parol o\'zgartirish funksiyasi - amalga oshirilishi kerak'
    });
  })
);

/**
 * @route   POST /api/auth/forgot-password
 * @desc    Request password reset email
 * @access  Public
 * @body    { email }
 */
router.post('/forgot-password',
  validate(
    require('joi').object({
      email: require('joi').string().email().required()
    })
  ),
  asyncHandler(async (req, res) => {
    // This would be implemented in authController
    res.json({
      success: true,
      message: 'Password reset functionality - to be implemented',
      message_uz: 'Parolni tiklash funksiyasi - amalga oshirilishi kerak'
    });
  })
);

/**
 * @route   POST /api/auth/reset-password
 * @desc    Reset password using reset token
 * @access  Public
 * @body    { token, newPassword }
 */
router.post('/reset-password',
  validate(
    require('joi').object({
      token: require('joi').string().required(),
      newPassword: require('joi').string().min(6).required(),
      confirmPassword: require('joi').string().valid(require('joi').ref('newPassword')).required()
    })
  ),
  asyncHandler(async (req, res) => {
    // This would be implemented in authController
    res.json({
      success: true,
      message: 'Password reset functionality - to be implemented',
      message_uz: 'Parolni tiklash funksiyasi - amalga oshirilishi kerak'
    });
  })
);

/**
 * @route   POST /api/auth/verify-email
 * @desc    Verify email address
 * @access  Public
 * @body    { token }
 */
router.post('/verify-email',
  validate(
    require('joi').object({
      token: require('joi').string().required()
    })
  ),
  asyncHandler(async (req, res) => {
    // This would be implemented in authController
    res.json({
      success: true,
      message: 'Email verification functionality - to be implemented',
      message_uz: 'Email tasdiqlash funksiyasi - amalga oshirilishi kerak'
    });
  })
);

module.exports = router;