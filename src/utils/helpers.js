const moment = require('moment');
const crypto = require('crypto');

class Helpers {
  // ===== DATE AND TIME HELPERS =====

  /**
   * Get current academic year in format YYYY-YYYY
   * @returns {string} - Academic year string
   */
  static getCurrentAcademicYear() {
    const now = moment();
    const currentYear = now.year();
    const currentMonth = now.month() + 1; // moment months are 0-indexed

    // Academic year starts in September in Uzbekistan
    if (currentMonth >= 9) {
      return `${currentYear}-${currentYear + 1}`;
    } else {
      return `${currentYear - 1}-${currentYear}`;
    }
  }

  /**
   * Get current semester (1 or 2)
   * @returns {number} - Semester number
   */
  static getCurrentSemester() {
    const now = moment();
    const currentMonth = now.month() + 1;

    // First semester: September - January
    // Second semester: February - June
    // Summer break: July - August
    if (currentMonth >= 9 || currentMonth <= 1) {
      return 1;
    } else if (currentMonth >= 2 && currentMonth <= 6) {
      return 2;
    } else {
      // Summer period - return next semester
      return 1;
    }
  }

  /**
   * Get academic year for a specific date
   * @param {Date|string} date - Date to check
   * @returns {string} - Academic year string
   */
  static getAcademicYearForDate(date) {
    const momentDate = moment(date);
    const year = momentDate.year();
    const month = momentDate.month() + 1;

    if (month >= 9) {
      return `${year}-${year + 1}`;
    } else {
      return `${year - 1}-${year}`;
    }
  }

  /**
   * Get semester for a specific date
   * @param {Date|string} date - Date to check
   * @returns {number} - Semester number
   */
  static getSemesterForDate(date) {
    const momentDate = moment(date);
    const month = momentDate.month() + 1;

    if (month >= 9 || month <= 1) {
      return 1;
    } else if (month >= 2 && month <= 6) {
      return 2;
    } else {
      return 1; // Summer defaults to next semester
    }
  }

  /**
   * Format date for display
   * @param {Date|string} date - Date to format
   * @param {string} format - Moment.js format string
   * @returns {string} - Formatted date
   */
  static formatDate(date, format = 'DD.MM.YYYY') {
    return moment(date).format(format);
  }

  /**
   * Format date with Uzbek month names
   * @param {Date|string} date - Date to format
   * @returns {string} - Formatted date in Uzbek
   */
  static formatDateUzbek(date) {
    const momentDate = moment(date);
    const uzbekMonths = [
      'yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun',
      'iyul', 'avgust', 'sentabr', 'oktabr', 'noyabr', 'dekabr'
    ];
    
    const day = momentDate.date();
    const month = uzbekMonths[momentDate.month()];
    const year = momentDate.year();
    
    return `${day} ${month} ${year}`;
  }

  /**
   * Calculate age from date of birth
   * @param {Date|string} dateOfBirth - Date of birth
   * @returns {number} - Age in years
   */
  static calculateAge(dateOfBirth) {
    return moment().diff(moment(dateOfBirth), 'years');
  }

  /**
   * Check if date is in current academic year
   * @param {Date|string} date - Date to check
   * @returns {boolean} - Is in current academic year
   */
  static isInCurrentAcademicYear(date) {
    const currentAcademicYear = this.getCurrentAcademicYear();
    const dateAcademicYear = this.getAcademicYearForDate(date);
    return currentAcademicYear === dateAcademicYear;
  }

  /**
   * Get date range for academic year
   * @param {string} academicYear - Academic year (e.g., '2024-2025')
   * @returns {Object} - Start and end dates
   */
  static getAcademicYearDateRange(academicYear) {
    const [startYear, endYear] = academicYear.split('-').map(Number);
    return {
      startDate: moment(`${startYear}-09-01`).toDate(),
      endDate: moment(`${endYear}-08-31`).toDate()
    };
  }

  // ===== NUMBER GENERATION HELPERS =====

  /**
   * Generate student number
   * @param {number} sequence - Sequence number
   * @returns {string} - Generated student number
   */
  static generateStudentNumber(sequence = null) {
    const year = moment().year();
    const seqNum = sequence || Math.floor(Math.random() * 10000);
    return `STU${year}${String(seqNum).padStart(4, '0')}`;
  }

  /**
   * Generate employee number
   * @param {number} sequence - Sequence number
   * @returns {string} - Generated employee number
   */
  static generateEmployeeNumber(sequence = null) {
    const year = moment().year();
    const seqNum = sequence || Math.floor(Math.random() * 1000);
    return `EMP${year}${String(seqNum).padStart(3, '0')}`;
  }

  /**
   * Generate unique ID
   * @param {string} prefix - ID prefix
   * @param {number} length - Random part length
   * @returns {string} - Generated unique ID
   */
  static generateUniqueId(prefix = '', length = 8) {
    const timestamp = Date.now().toString(36);
    const randomPart = Math.random().toString(36).substring(2, 2 + length);
    return `${prefix}${timestamp}${randomPart}`.toUpperCase();
  }

  /**
   * Generate random password
   * @param {number} length - Password length
   * @param {Object} options - Password options
   * @returns {string} - Generated password
   */
  static generateRandomPassword(length = 8, options = {}) {
    const {
      includeUppercase = true,
      includeLowercase = true,
      includeNumbers = true,
      includeSymbols = false,
      excludeSimilar = true
    } = options;

    let chars = '';
    if (includeUppercase) chars += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    if (includeLowercase) chars += 'abcdefghijklmnopqrstuvwxyz';
    if (includeNumbers) chars += '0123456789';
    if (includeSymbols) chars += '!@#$%^&*()_+-=[]{}|;:,.<>?';

    // Remove similar looking characters if requested
    if (excludeSimilar) {
      chars = chars.replace(/[0O1lI]/g, '');
    }

    let password = '';
    for (let i = 0; i < length; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    return password;
  }

  // ===== VALIDATION HELPERS =====

  /**
   * Validate email format
   * @param {string} email - Email to validate
   * @returns {boolean} - Is valid email
   */
  static isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Validate Uzbekistan phone number
   * @param {string} phone - Phone number to validate
   * @returns {boolean} - Is valid phone number
   */
  static isValidUzbekPhoneNumber(phone) {
    // Remove all non-digit characters
    const cleanPhone = phone.replace(/\D/g, '');
    
    // Check various Uzbek phone formats
    const patterns = [
      /^998\d{9}$/,     // 998XXXXXXXXX
      /^\+998\d{9}$/,   // +998XXXXXXXXX
      /^8\d{9}$/,       // 8XXXXXXXXX
      /^\d{9}$/         // XXXXXXXXX
    ];

    return patterns.some(pattern => pattern.test(phone)) || 
           patterns.some(pattern => pattern.test(cleanPhone));
  }

  /**
   * Validate student number format
   * @param {string} studentNumber - Student number to validate
   * @returns {boolean} - Is valid student number
   */
  static isValidStudentNumber(studentNumber) {
    const pattern = /^STU\d{8}$/; // STU + 8 digits
    return pattern.test(studentNumber);
  }

  /**
   * Validate employee number format
   * @param {string} employeeNumber - Employee number to validate
   * @returns {boolean} - Is valid employee number
   */
  static isValidEmployeeNumber(employeeNumber) {
    const pattern = /^EMP\d{7}$/; // EMP + 7 digits
    return pattern.test(employeeNumber);
  }

  /**
   * Validate academic year format
   * @param {string} academicYear - Academic year to validate
   * @returns {boolean} - Is valid academic year
   */
  static isValidAcademicYear(academicYear) {
    const pattern = /^\d{4}-\d{4}$/;
    if (!pattern.test(academicYear)) return false;

    const [startYear, endYear] = academicYear.split('-').map(Number);
    return endYear === startYear + 1;
  }

  // ===== STRING MANIPULATION HELPERS =====

  /**
   * Sanitize string input
   * @param {string} str - String to sanitize
   * @returns {string} - Sanitized string
   */
  static sanitizeString(str) {
    if (typeof str !== 'string') return '';
    return str.trim()
              .replace(/[<>]/g, '') // Remove potential HTML tags
              .replace(/\s+/g, ' ')  // Replace multiple spaces with single space
              .substring(0, 1000);   // Limit length
  }

  /**
   * Capitalize first letter of each word
   * @param {string} str - String to capitalize
   * @returns {string} - Capitalized string
   */
  static capitalizeWords(str) {
    if (typeof str !== 'string') return '';
    return str.toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  }

  /**
   * Generate initials from name
   * @param {string} firstName - First name
   * @param {string} lastName - Last name
   * @returns {string} - Initials
   */
  static generateInitials(firstName, lastName) {
    const first = firstName ? firstName.charAt(0).toUpperCase() : '';
    const last = lastName ? lastName.charAt(0).toUpperCase() : '';
    return `${first}${last}`;
  }

  /**
   * Mask sensitive information
   * @param {string} str - String to mask
   * @param {number} visibleStart - Characters visible at start
   * @param {number} visibleEnd - Characters visible at end
   * @returns {string} - Masked string
   */
  static maskString(str, visibleStart = 2, visibleEnd = 2) {
    if (!str || str.length <= visibleStart + visibleEnd) return str;
    
    const start = str.substring(0, visibleStart);
    const end = str.substring(str.length - visibleEnd);
    const maskLength = str.length - visibleStart - visibleEnd;
    const mask = '*'.repeat(maskLength);
    
    return `${start}${mask}${end}`;
  }

  // ===== CALCULATION HELPERS =====

  /**
   * Calculate GPA from grades
   * @param {Array} grades - Array of grade objects
   * @param {boolean} useWeights - Whether to use grade weights
   * @returns {number} - Calculated GPA
   */
  static calculateGPA(grades, useWeights = true) {
    if (!grades || grades.length === 0) return 0;
    
    if (useWeights) {
      const totalPoints = grades.reduce((sum, grade) => {
        const weight = grade.weight || 1;
        return sum + (grade.gradeValue * weight);
      }, 0);
      
      const totalWeight = grades.reduce((sum, grade) => {
        return sum + (grade.weight || 1);
      }, 0);
      
      return totalWeight > 0 ? Math.round((totalPoints / totalWeight) * 100) / 100 : 0;
    } else {
      const total = grades.reduce((sum, grade) => sum + grade.gradeValue, 0);
      return Math.round((total / grades.length) * 100) / 100;
    }
  }

  /**
   * Get grade level description
   * @param {number} gradeValue - Grade value (0-100)
   * @returns {Object} - Grade level info
   */
  static getGradeLevel(gradeValue) {
    if (gradeValue >= 85) {
      return { 
        level: 'excellent', 
        description: 'A\'lo', 
        color: '#27ae60',
        points: 5 
      };
    }
    if (gradeValue >= 70) {
      return { 
        level: 'good', 
        description: 'Yaxshi', 
        color: '#3498db',
        points: 4 
      };
    }
    if (gradeValue >= 60) {
      return { 
        level: 'satisfactory', 
        description: 'Qoniqarli', 
        color: '#f39c12',
        points: 3 
      };
    }
    return { 
      level: 'unsatisfactory', 
      description: 'Qoniqarsiz', 
      color: '#e74c3c',
      points: 2 
    };
  }

  /**
   * Calculate attendance rate
   * @param {Array} attendanceRecords - Array of attendance records
   * @returns {Object} - Attendance statistics
   */
  static calculateAttendanceRate(attendanceRecords) {
    if (!attendanceRecords || attendanceRecords.length === 0) {
      return {
        rate: 0,
        total: 0,
        present: 0,
        absent: 0,
        late: 0,
        excused: 0
      };
    }

    const total = attendanceRecords.length;
    const present = attendanceRecords.filter(a => a.status === 'present').length;
    const absent = attendanceRecords.filter(a => a.status === 'absent').length;
    const late = attendanceRecords.filter(a => a.status === 'late').length;
    const excused = attendanceRecords.filter(a => a.status === 'excused').length;
    
    const attendedDays = present + late; // Late is considered attended
    const rate = Math.round((attendedDays / total) * 100);

    return { rate, total, present, absent, late, excused };
  }

  /**
   * Calculate percentage
   * @param {number} value - Current value
   * @param {number} total - Total value
   * @param {number} decimals - Decimal places
   * @returns {number} - Percentage
   */
  static calculatePercentage(value, total, decimals = 2) {
    if (total === 0) return 0;
    return Math.round((value / total * 100) * Math.pow(10, decimals)) / Math.pow(10, decimals);
  }

  // ===== FORMATTING HELPERS =====

  /**
   * Format currency for Uzbekistan
   * @param {number} amount - Amount to format
   * @param {string} currency - Currency code
   * @returns {string} - Formatted currency
   */
  static formatCurrency(amount, currency = 'UZS') {
    try {
      return new Intl.NumberFormat('uz-UZ', {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(amount);
    } catch (error) {
      // Fallback formatting
      return `${amount.toLocaleString()} ${currency}`;
    }
  }

  /**
   * Format number with thousand separators
   * @param {number} number - Number to format
   * @returns {string} - Formatted number
   */
  static formatNumber(number) {
    return number.toLocaleString('uz-UZ');
  }

  /**
   * Format file size
   * @param {number} bytes - File size in bytes
   * @param {number} decimals - Decimal places
   * @returns {string} - Formatted file size
   */
  static formatFileSize(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];

    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }

  // ===== PAGINATION HELPERS =====

  /**
   * Calculate pagination parameters
   * @param {number} page - Current page
   * @param {number} limit - Items per page
   * @param {number} total - Total items
   * @returns {Object} - Pagination info
   */
  static paginate(page = 1, limit = 10, total = 0) {
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.max(1, Math.min(100, parseInt(limit))); // Max 100 items per page
    const offset = (pageNum - 1) * limitNum;
    const totalPages = Math.ceil(total / limitNum);

    return {
      page: pageNum,
      limit: limitNum,
      offset: offset,
      total: total,
      totalPages: totalPages,
      hasNext: pageNum < totalPages,
      hasPrev: pageNum > 1,
      startIndex: offset + 1,
      endIndex: Math.min(offset + limitNum, total)
    };
  }

  // ===== ARRAY HELPERS =====

  /**
   * Group array by key
   * @param {Array} array - Array to group
   * @param {string} key - Key to group by
   * @returns {Object} - Grouped object
   */
  static groupBy(array, key) {
    return array.reduce((groups, item) => {
      const group = item[key];
      if (!groups[group]) {
        groups[group] = [];
      }
      groups[group].push(item);
      return groups;
    }, {});
  }

  /**
   * Sort array by multiple keys
   * @param {Array} array - Array to sort
   * @param {Array} keys - Array of sort keys
   * @returns {Array} - Sorted array
   */
  static sortBy(array, keys) {
    return array.sort((a, b) => {
      for (let key of keys) {
        let direction = 1;
        if (key.startsWith('-')) {
          direction = -1;
          key = key.substring(1);
        }
        
        if (a[key] < b[key]) return -1 * direction;
        if (a[key] > b[key]) return 1 * direction;
      }
      return 0;
    });
  }

  /**
   * Remove duplicates from array
   * @param {Array} array - Array with duplicates
   * @param {string} key - Key to check for duplicates (optional)
   * @returns {Array} - Array without duplicates
   */
  static removeDuplicates(array, key = null) {
    if (key) {
      const seen = new Set();
      return array.filter(item => {
        const value = item[key];
        if (seen.has(value)) {
          return false;
        }
        seen.add(value);
        return true;
      });
    }
    return [...new Set(array)];
  }

  // ===== OBJECT HELPERS =====

  /**
   * Deep clone object
   * @param {Object} obj - Object to clone
   * @returns {Object} - Cloned object
   */
  static deepClone(obj) {
    if (obj === null || typeof obj !== 'object') return obj;
    if (obj instanceof Date) return new Date(obj.getTime());
    if (obj instanceof Array) return obj.map(item => this.deepClone(item));
    
    const clonedObj = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        clonedObj[key] = this.deepClone(obj[key]);
      }
    }
    return clonedObj;
  }

  /**
   * Check if object is empty
   * @param {Object} obj - Object to check
   * @returns {boolean} - Is empty
   */
  static isEmpty(obj) {
    return obj == null || Object.keys(obj).length === 0;
  }

  /**
   * Pick specific keys from object
   * @param {Object} obj - Source object
   * @param {Array} keys - Keys to pick
   * @returns {Object} - Object with picked keys
   */
  static pick(obj, keys) {
    const result = {};
    keys.forEach(key => {
      if (obj.hasOwnProperty(key)) {
        result[key] = obj[key];
      }
    });
    return result;
  }

  /**
   * Omit specific keys from object
   * @param {Object} obj - Source object
   * @param {Array} keys - Keys to omit
   * @returns {Object} - Object without omitted keys
   */
  static omit(obj, keys) {
    const result = { ...obj };
    keys.forEach(key => {
      delete result[key];
    });
    return result;
  }

  // ===== SECURITY HELPERS =====

  /**
   * Generate hash for string
   * @param {string} str - String to hash
   * @param {string} algorithm - Hash algorithm
   * @returns {string} - Hash string
   */
  static generateHash(str, algorithm = 'sha256') {
    return crypto.createHash(algorithm).update(str).digest('hex');
  }

  /**
   * Generate secure random token
   * @param {number} length - Token length in bytes
   * @returns {string} - Random token
   */
  static generateSecureToken(length = 32) {
    return crypto.randomBytes(length).toString('hex');
  }

  // ===== ERROR HANDLING HELPERS =====

  /**
   * Safe JSON parse
   * @param {string} jsonString - JSON string to parse
   * @param {*} defaultValue - Default value if parsing fails
   * @returns {*} - Parsed object or default value
   */
  static safeJsonParse(jsonString, defaultValue = null) {
    try {
      return JSON.parse(jsonString);
    } catch (error) {
      return defaultValue;
    }
  }

  /**
   * Safe property access
   * @param {Object} obj - Object to access
   * @param {string} path - Property path (e.g., 'user.profile.name')
   * @param {*} defaultValue - Default value if path doesn't exist
   * @returns {*} - Property value or default value
   */
  static safeGet(obj, path, defaultValue = null) {
    try {
      return path.split('.').reduce((current, key) => current && current[key], obj) || defaultValue;
    } catch (error) {
      return defaultValue;
    }
  }

  // ===== DEBUG HELPERS =====

  /**
   * Log with timestamp and context
   * @param {string} message - Log message
   * @param {string} level - Log level
   * @param {Object} context - Additional context
   */
  static log(message, level = 'info', context = {}) {
    const timestamp = moment().format('YYYY-MM-DD HH:mm:ss');
    const logEntry = {
      timestamp,
      level: level.toUpperCase(),
      message,
      context
    };
    
    console.log(JSON.stringify(logEntry, null, 2));
  }

  /**
   * Measure execution time
   * @param {Function} fn - Function to measure
   * @param {Array} args - Function arguments
   * @returns {Object} - Result and execution time
   */
  static async measureTime(fn, ...args) {
    const startTime = process.hrtime.bigint();
    const result = await fn(...args);
    const endTime = process.hrtime.bigint();
    const executionTime = Number(endTime - startTime) / 1000000; // Convert to milliseconds
    
    return {
      result,
      executionTime: Math.round(executionTime * 100) / 100
    };
  }
}

module.exports = Helpers;