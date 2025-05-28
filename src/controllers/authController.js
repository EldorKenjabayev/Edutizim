const jwt = require('jsonwebtoken');
const { User, Student, Teacher, Guardian } = require('../models');
const authConfig = require('../config/auth');

const generateTokens = (userId) => {
  const accessToken = jwt.sign({ userId }, authConfig.jwt.secret, {
    expiresIn: authConfig.jwt.expiresIn
  });
  
  const refreshToken = jwt.sign({ userId }, authConfig.jwt.secret, {
    expiresIn: authConfig.jwt.refreshExpiresIn
  });

  return { accessToken, refreshToken };
};

const register = async (req, res) => {
  try {
    const { username, email, password, firstName, lastName, role } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({
      where: { 
        $or: [{ email }, { username }] 
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
      password,
      firstName,
      lastName,
      role
    });

    // Create profile based on role
    if (role === 'student') {
      await Student.create({
        userId: user.id,
        firstName,
        lastName,
        studentNumber: `STU${Date.now()}`,
        dateOfBirth: new Date('2000-01-01'), // Default, should be updated
        gender: 'male' // Default, should be updated
      });
    } else if (role === 'teacher') {
      await Teacher.create({
        userId: user.id,
        firstName,
        lastName,
        employeeNumber: `EMP${Date.now()}`
      });
    } else if (role === 'parent') {
      await Guardian.create({
        userId: user.id,
        firstName,
        lastName,
        relationship: 'guardian',
        phoneNumber: 'Not provided' // Should be updated
      });
    }

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
      message_uz: 'Ro\'yxatdan o\'tish xatosi'
    });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

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
    const isValidPassword = await user.checkPassword(password);
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
      message_uz: 'Kirish xatosi'
    });
  }
};

const refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: 'Refresh token required',
        message_uz: 'Yangilash tokeni talab qilinadi'
      });
    }

    const decoded = jwt.verify(refreshToken, authConfig.jwt.secret);
    const user = await User.findByPk(decoded.userId);

    if (!user || user.refreshToken !== refreshToken) {
      return res.status(403).json({
        success: false,
        message: 'Invalid refresh token',
        message_uz: 'Yaroqsiz yangilash tokeni'
      });
    }

    const tokens = generateTokens(user.id);
    await user.update({ refreshToken: tokens.refreshToken });

    res.json({
      success: true,
      message: 'Token refreshed successfully',
      message_uz: 'Token muvaffaqiyatli yangilandi',
      data: { tokens }
    });

  } catch (error) {
    res.status(403).json({
      success: false,
      message: 'Invalid refresh token',
      message_uz: 'Yaroqsiz yangilash tokeni'
    });
  }
};

const logout = async (req, res) => {
  try {
    await User.update(
      { refreshToken: null },
      { where: { id: req.userId } }
    );

    res.json({
      success: true,
      message: 'Logout successful',
      message_uz: 'Muvaffaqiyatli chiqish'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Logout failed',
      message_uz: 'Chiqish xatosi'
    });
  }
};

const getProfile = async (req, res) => {
  try {
    const user = await User.findByPk(req.userId, {
      attributes: { exclude: ['password', 'refreshToken'] },
      include: [
        {
          model: Student,
          as: 'studentProfile',
          required: false
        },
        {
          model: Teacher,
          as: 'teacherProfile',
          required: false
        },
        {
          model: Guardian,
          as: 'guardianProfile',
          required: false
        }
      ]
    });

    res.json({
      success: true,
      data: { user }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get profile',
      message_uz: 'Profilni olishda xato'
    });
  }
};

module.exports = {
  register,
  login,
  refreshToken,
  logout,
  getProfile
};