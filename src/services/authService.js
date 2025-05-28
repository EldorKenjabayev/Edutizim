const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { User, Student, Teacher, Guardian } = require('../models');
const authConfig = require('../config/auth');
const emailService = require('./emailService');

class AuthService {
  /**
   * Generate JWT access and refresh tokens
   * @param {string} userId - User ID
   * @param {Object} additionalPayload - Additional payload for token
   * @returns {Object} - Access token and refresh token
   */
  static generateTokens(userId, additionalPayload = {}) {
    const payload = {
      userId,
      timestamp: Date.now(),
      ...additionalPayload
    };

    const accessToken = jwt.sign(payload, authConfig.jwt.secret, {
      expiresIn: authConfig.jwt.expiresIn,
      issuer: 'EduSmartSystem',
      audience: 'edu-smart-users'
    });
    
    const refreshToken = jwt.sign(
      { userId, type: 'refresh', timestamp: Date.now() }, 
      authConfig.jwt.secret, 
      {
        expiresIn: authConfig.jwt.refreshExpiresIn,
        issuer: 'EduSmartSystem',
        audience: 'edu-smart-users'
      }
    );

    return { accessToken, refreshToken };
  }

  /**
   * Verify JWT token
   * @param {string} token - JWT token to verify
   * @returns {Object} - Decoded token payload
   */
  static async verifyToken(token) {
    try {
      const decoded = jwt.verify(token, authConfig.jwt.secret, {
        issuer: 'EduSmartSystem',
        audience: 'edu-smart-users'
      });
      return decoded;
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new Error('TOKEN_EXPIRED');
      } else if (error.name === 'JsonWebTokenError') {
        throw new Error('INVALID_TOKEN');
      } else {
        throw new Error('TOKEN_VERIFICATION_FAILED');
      }
    }
  }

  /**
   * Hash password using bcrypt
   * @param {string} password - Plain text password
   * @returns {string} - Hashed password
   */
  static async hashPassword(password) {
    try {
      const salt = await bcrypt.genSalt(authConfig.bcrypt.rounds);
      return await bcrypt.hash(password, salt);
    } catch (error) {
      throw new Error('PASSWORD_HASHING_FAILED');
    }
  }

  /**
   * Compare password with hash
   * @param {string} password - Plain text password
   * @param {string} hashedPassword - Hashed password
   * @returns {boolean} - Password match result
   */
  static async comparePassword(password, hashedPassword) {
    try {
      return await bcrypt.compare(password, hashedPassword);
    } catch (error) {
      throw new Error('PASSWORD_COMPARISON_FAILED');
    }
  }

  /**
   * Create new user with associated profile
   * @param {Object} userData - User data
   * @returns {Object} - Created user with profile
   */
  static async createUser(userData) {
    const { username, email, password, firstName, lastName, role, profileData = {} } = userData;

    try {
      // Check if user already exists
      const existingUser = await this.findUserByEmailOrUsername(email, username);
      if (existingUser) {
        throw new Error('USER_ALREADY_EXISTS');
      }

      // Hash password
      const hashedPassword = await this.hashPassword(password);

      // Create user
      const user = await User.create({
        username,
        email,
        password: hashedPassword,
        firstName,
        lastName,
        role
      });

      // Create associated profile based on role
      let profile = null;
      switch (role) {
        case 'student':
          profile = await this.createStudentProfile(user.id, { firstName, lastName, ...profileData });
          break;
        case 'teacher':
          profile = await this.createTeacherProfile(user.id, { firstName, lastName, ...profileData });
          break;
        case 'parent':
          profile = await this.createGuardianProfile(user.id, { firstName, lastName, ...profileData });
          break;
      }

      return {
        user,
        profile
      };
    } catch (error) {
      if (error.message === 'USER_ALREADY_EXISTS') {
        throw error;
      }
      throw new Error('USER_CREATION_FAILED');
    }
  }

  /**
   * Create student profile
   * @param {string} userId - User ID
   * @param {Object} profileData - Student profile data
   * @returns {Object} - Created student profile
   */
  static async createStudentProfile(userId, profileData) {
    const { firstName, lastName, dateOfBirth, gender, classId, ...otherData } = profileData;
    
    // Generate student number
    const studentCount = await Student.count();
    const studentNumber = `STU${new Date().getFullYear()}${String(studentCount + 1).padStart(4, '0')}`;

    return await Student.create({
      userId,
      firstName,
      lastName,
      studentNumber,
      dateOfBirth: dateOfBirth || new Date('2000-01-01'), // Default date
      gender: gender || 'male', // Default gender
      classId: classId || null,
      ...otherData
    });
  }

  /**
   * Create teacher profile
   * @param {string} userId - User ID
   * @param {Object} profileData - Teacher profile data
   * @returns {Object} - Created teacher profile
   */
  static async createTeacherProfile(userId, profileData) {
    const { firstName, lastName, ...otherData } = profileData;
    
    // Generate employee number
    const teacherCount = await Teacher.count();
    const employeeNumber = `EMP${new Date().getFullYear()}${String(teacherCount + 1).padStart(3, '0')}`;

    return await Teacher.create({
      userId,
      firstName,
      lastName,
      employeeNumber,
      ...otherData
    });
  }

  /**
   * Create guardian profile
   * @param {string} userId - User ID
   * @param {Object} profileData - Guardian profile data
   * @returns {Object} - Created guardian profile
   */
  static async createGuardianProfile(userId, profileData) {
    const { firstName, lastName, relationship = 'guardian', phoneNumber = 'Not provided', ...otherData } = profileData;

    return await Guardian.create({
      userId,
      firstName,
      lastName,
      relationship,
      phoneNumber,
      ...otherData
    });
  }

  /**
   * Authenticate user login
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Object} - User data and tokens
   */
  static async authenticateUser(email, password) {
    try {
      // Find user by email
      const user = await this.findUserByEmail(email);
      if (!user) {
        throw new Error('INVALID_CREDENTIALS');
      }

      // Check if user is active
      if (!user.isActive) {
        throw new Error('ACCOUNT_DEACTIVATED');
      }

      // Verify password
      const isValidPassword = await this.comparePassword(password, user.password);
      if (!isValidPassword) {
        throw new Error('INVALID_CREDENTIALS');
      }

      // Generate tokens
      const tokens = this.generateTokens(user.id, { role: user.role });

      // Update last login and save refresh token
      await user.update({
        lastLogin: new Date(),
        refreshToken: tokens.refreshToken
      });

      // Get user with profile
      const userWithProfile = await this.getUserWithProfile(user.id);

      return {
        user: userWithProfile,
        tokens
      };
    } catch (error) {
      if (['INVALID_CREDENTIALS', 'ACCOUNT_DEACTIVATED'].includes(error.message)) {
        throw error;
      }
      throw new Error('AUTHENTICATION_FAILED');
    }
  }

  /**
   * Refresh access token
   * @param {string} refreshToken - Refresh token
   * @returns {Object} - New tokens
   */
  static async refreshAccessToken(refreshToken) {
    try {
      // Verify refresh token
      const decoded = await this.verifyToken(refreshToken);
      
      if (decoded.type !== 'refresh') {
        throw new Error('INVALID_REFRESH_TOKEN');
      }

      // Find user and verify stored refresh token
      const user = await User.findByPk(decoded.userId);
      if (!user || user.refreshToken !== refreshToken || !user.isActive) {
        throw new Error('INVALID_REFRESH_TOKEN');
      }

      // Generate new tokens
      const newTokens = this.generateTokens(user.id, { role: user.role });

      // Update stored refresh token
      await user.update({ refreshToken: newTokens.refreshToken });

      return newTokens;
    } catch (error) {
      if (error.message === 'INVALID_REFRESH_TOKEN') {
        throw error;
      }
      throw new Error('TOKEN_REFRESH_FAILED');
    }
  }

  /**
   * Logout user by invalidating refresh token
   * @param {string} userId - User ID
   * @returns {boolean} - Logout success
   */
  static async logoutUser(userId) {
    try {
      await User.update(
        { refreshToken: null },
        { where: { id: userId } }
      );
      return true;
    } catch (error) {
      throw new Error('LOGOUT_FAILED');
    }
  }

  /**
   * Find user by email
   * @param {string} email - User email
   * @returns {Object|null} - User object or null
   */
  static async findUserByEmail(email) {
    try {
      return await User.findOne({ 
        where: { email: email.toLowerCase() } 
      });
    } catch (error) {
      throw new Error('USER_LOOKUP_FAILED');
    }
  }

  /**
   * Find user by email or username
   * @param {string} email - User email
   * @param {string} username - Username
   * @returns {Object|null} - User object or null
   */
  static async findUserByEmailOrUsername(email, username) {
    try {
      return await User.findOne({
        where: {
          [require('sequelize').Op.or]: [
            { email: email.toLowerCase() },
            { username: username.toLowerCase() }
          ]
        }
      });
    } catch (error) {
      throw new Error('USER_LOOKUP_FAILED');
    }
  }

  /**
   * Find user by ID
   * @param {string} id - User ID
   * @returns {Object|null} - User object or null
   */
  static async findUserById(id) {
    try {
      return await User.findByPk(id, {
        attributes: { exclude: ['password', 'refreshToken'] }
      });
    } catch (error) {
      throw new Error('USER_LOOKUP_FAILED');
    }
  }

  /**
   * Get user with associated profile
   * @param {string} userId - User ID
   * @returns {Object} - User with profile
   */
  static async getUserWithProfile(userId) {
    try {
      return await User.findByPk(userId, {
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
    } catch (error) {
      throw new Error('USER_PROFILE_LOOKUP_FAILED');
    }
  }

  /**
   * Update user profile
   * @param {string} userId - User ID
   * @param {Object} updateData - Data to update
   * @returns {Object} - Updated user
   */
  static async updateUserProfile(userId, updateData) {
    try {
      const user = await User.findByPk(userId);
      if (!user) {
        throw new Error('USER_NOT_FOUND');
      }

      // Update user data
      const { firstName, lastName, ...otherData } = updateData;
      await user.update({
        firstName,
        lastName,
        ...otherData
      });

      // Update associated profile
      if (user.role === 'student' && user.studentProfile) {
        await user.studentProfile.update({ firstName, lastName });
      } else if (user.role === 'teacher' && user.teacherProfile) {
        await user.teacherProfile.update({ firstName, lastName });
      } else if (user.role === 'parent' && user.guardianProfile) {
        await user.guardianProfile.update({ firstName, lastName });
      }

      return await this.getUserWithProfile(userId);
    } catch (error) {
      if (error.message === 'USER_NOT_FOUND') {
        throw error;
      }
      throw new Error('PROFILE_UPDATE_FAILED');
    }
  }

  /**
   * Change user password
   * @param {string} userId - User ID
   * @param {string} currentPassword - Current password
   * @param {string} newPassword - New password
   * @returns {boolean} - Success status
   */
  static async changePassword(userId, currentPassword, newPassword) {
    try {
      const user = await User.findByPk(userId);
      if (!user) {
        throw new Error('USER_NOT_FOUND');
      }

      // Verify current password
      const isValidPassword = await this.comparePassword(currentPassword, user.password);
      if (!isValidPassword) {
        throw new Error('INVALID_CURRENT_PASSWORD');
      }

      // Hash new password
      const hashedNewPassword = await this.hashPassword(newPassword);

      // Update password
      await user.update({ password: hashedNewPassword });

      // Send password change notification email
      try {
        await emailService.sendPasswordChangeNotification(user);
      } catch (emailError) {
        // Log email error but don't fail the password change
        console.error('Failed to send password change notification:', emailError);
      }

      return true;
    } catch (error) {
      if (['USER_NOT_FOUND', 'INVALID_CURRENT_PASSWORD'].includes(error.message)) {
        throw error;
      }
      throw new Error('PASSWORD_CHANGE_FAILED');
    }
  }

  /**
   * Generate password reset token
   * @param {string} email - User email
   * @returns {string} - Reset token
   */
  static async generatePasswordResetToken(email) {
    try {
      const user = await this.findUserByEmail(email);
      if (!user) {
        throw new Error('USER_NOT_FOUND');
      }

      // Generate reset token
      const resetToken = crypto.randomBytes(32).toString('hex');
      const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour

      // Save token to user (you might want to create a separate table for this)
      await user.update({
        resetToken,
        resetTokenExpiry
      });

      // Send reset email
      await emailService.sendPasswordResetEmail(user, resetToken);

      return resetToken;
    } catch (error) {
      if (error.message === 'USER_NOT_FOUND') {
        throw error;
      }
      throw new Error('RESET_TOKEN_GENERATION_FAILED');
    }
  }

  /**
   * Reset password using token
   * @param {string} token - Reset token
   * @param {string} newPassword - New password
   * @returns {boolean} - Success status
   */
  static async resetPassword(token, newPassword) {
    try {
      const user = await User.findOne({
        where: {
          resetToken: token,
          resetTokenExpiry: {
            [require('sequelize').Op.gt]: new Date()
          }
        }
      });

      if (!user) {
        throw new Error('INVALID_OR_EXPIRED_TOKEN');
      }

      // Hash new password
      const hashedPassword = await this.hashPassword(newPassword);

      // Update password and clear reset token
      await user.update({
        password: hashedPassword,
        resetToken: null,
        resetTokenExpiry: null
      });

      // Send password reset confirmation email
      try {
        await emailService.sendPasswordResetConfirmation(user);
      } catch (emailError) {
        console.error('Failed to send password reset confirmation:', emailError);
      }

      return true;
    } catch (error) {
      if (error.message === 'INVALID_OR_EXPIRED_TOKEN') {
        throw error;
      }
      throw new Error('PASSWORD_RESET_FAILED');
    }
  }

  /**
   * Deactivate user account
   * @param {string} userId - User ID
   * @param {string} reason - Deactivation reason
   * @returns {boolean} - Success status
   */
  static async deactivateUser(userId, reason = '') {
    try {
      const user = await User.findByPk(userId);
      if (!user) {
        throw new Error('USER_NOT_FOUND');
      }

      await user.update({
        isActive: false,
        refreshToken: null, // Invalidate any active sessions
        deactivationReason: reason,
        deactivatedAt: new Date()
      });

      return true;
    } catch (error) {
      if (error.message === 'USER_NOT_FOUND') {
        throw error;
      }
      throw new Error('USER_DEACTIVATION_FAILED');
    }
  }

  /**
   * Reactivate user account
   * @param {string} userId - User ID
   * @returns {boolean} - Success status
   */
  static async reactivateUser(userId) {
    try {
      const user = await User.findByPk(userId);
      if (!user) {
        throw new Error('USER_NOT_FOUND');
      }

      await user.update({
        isActive: true,
        deactivationReason: null,
        deactivatedAt: null
      });

      return true;
    } catch (error) {
      if (error.message === 'USER_NOT_FOUND') {
        throw error;
      }
      throw new Error('USER_REACTIVATION_FAILED');
    }
  }

  /**
   * Get user activity statistics
   * @param {string} userId - User ID
   * @returns {Object} - Activity statistics
   */
  static async getUserActivityStats(userId) {
    try {
      const user = await User.findByPk(userId);
      if (!user) {
        throw new Error('USER_NOT_FOUND');
      }

      return {
        lastLogin: user.lastLogin,
        accountCreated: user.createdAt,
        isActive: user.isActive,
        role: user.role,
        loginCount: user.loginCount || 0, // You might want to track this
        profileCompleteness: this.calculateProfileCompleteness(user)
      };
    } catch (error) {
      if (error.message === 'USER_NOT_FOUND') {
        throw error;
      }
      throw new Error('ACTIVITY_STATS_FAILED');
    }
  }

  /**
   * Calculate profile completeness percentage
   * @param {Object} user - User object
   * @returns {number} - Completeness percentage
   */
  static calculateProfileCompleteness(user) {
    const requiredFields = ['firstName', 'lastName', 'email', 'username'];
    const completedFields = requiredFields.filter(field => user[field] && user[field].trim() !== '');
    
    return Math.round((completedFields.length / requiredFields.length) * 100);
  }
}

module.exports = AuthService;