const jwt = require('jsonwebtoken');
const { User, Student, Teacher, Guardian } = require('../models');
const authConfig = require('../config/auth');

// Login funksiyasida:
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ 
      where: { email },
      include: [
        { model: Student, as: 'studentProfile', required: false },
        { model: Teacher, as: 'teacherProfile', required: false },
        { model: Guardian, as: 'guardianProfile', required: false }
      ]
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
        message_uz: 'Yaroqsiz ma\'lumotlar'
      });
    }

    // Check password
    const isValidPassword = await user.checkPassword(password);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
        message_uz: 'Yaroqsiz ma\'lumotlar'
      });
    }

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user.id);

    // Update last login
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
          role: user.role,
          profile: user.studentProfile || user.teacherProfile || user.guardianProfile
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
      message_uz: 'Kirish xatosi'
    });
  }
};