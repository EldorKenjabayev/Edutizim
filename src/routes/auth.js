// src/routes/auth.js - Minimal working version
const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { User } = require('../models');

const router = express.Router();

// Simple asyncHandler
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Simple validation middleware
const validateLogin = (req, res, next) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Email and password are required',
      message_uz: 'Email va parol talab qilinadi'
    });
  }
  
  next();
};

// Generate tokens
const generateTokens = (userId) => {
  const secret = process.env.JWT_SECRET || 'fallback-secret-key';
  
  const accessToken = jwt.sign({ userId }, secret, { expiresIn: '24h' });
  const refreshToken = jwt.sign({ userId }, secret, { expiresIn: '7d' });

  return { accessToken, refreshToken };
};

/**
 * @route   POST /api/auth/login
 * @desc    Authenticate user and get token
 * @access  Public
 */
router.post('/login', validateLogin, asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  try {
    // Find user
    const user = await User.findOne({ where: { email } });
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
        message_uz: 'Yaroqsiz ma\'lumotlar'
      });
    }

    // Check password
    let isValidPassword = false;
    
    if (user.checkPassword && typeof user.checkPassword === 'function') {
      isValidPassword = await user.checkPassword(password);
    } else {
      // Fallback direct comparison
      isValidPassword = await bcrypt.compare(password, user.password);
    }

    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
        message_uz: 'Yaroqsiz ma\'lumotlar'
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account deactivated',
        message_uz: 'Hisob faolsizlantirilgan'
      });
    }

    const { accessToken, refreshToken } = generateTokens(user.id);

    // Update last login and refresh token
    await user.update({ 
      lastLogin: new Date(),
      refreshToken 
    });

    res.json({
      success: true,
      message: 'Login successful',
      message_uz: 'Muvaffaqiyatli kirish',
      data: {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role
        },
        tokens: {
          accessToken,
          refreshToken
        }
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed',
      message_uz: 'Kirish xatosi',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}));

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user (admin only for now)
 * @access  Public (temporary)
 */
router.post('/register', asyncHandler(async (req, res) => {
  const { username, email, password, firstName, lastName, role = 'student' } = req.body;

  try {
    // Basic validation
    if (!username || !email || !password || !firstName || !lastName) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required',
        message_uz: 'Barcha maydonlar talab qilinadi'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({
      where: { 
        [require('sequelize').Op.or]: [{ email }, { username }] 
      }
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'User already exists',
        message_uz: 'Foydalanuvchi allaqachon mavjud'
      });
    }

    // Create user
    const user = await User.create({
      username,
      email,
      password, // Will be hashed by the model hook
      firstName,
      lastName,
      role
    });

    const { accessToken, refreshToken } = generateTokens(user.id);

    // Save refresh token
    await user.update({ refreshToken });

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      message_uz: 'Foydalanuvchi muvaffaqiyatli ro\'yxatdan o\'tdi',
      data: {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role
        },
        tokens: {
          accessToken,
          refreshToken
        }
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Registration failed',
      message_uz: 'Ro\'yxatdan o\'tish xatosi',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}));

/**
 * @route   GET /api/auth/test
 * @desc    Test endpoint
 * @access  Public
 */
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'Auth routes working',
    message_uz: 'Auth yo\'nalishlari ishlayapti',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;