const nodemailer = require('nodemailer');
const path = require('path');

class EmailService {
  constructor() {
    this.transporter = null;
    this.isConfigured = false;
    this.initializeTransporter();
  }

  /**
   * Initialize email transporter
   */
  initializeTransporter() {
    try {
      // Check if email configuration is available
      if (!process.env.EMAIL_HOST || !process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        console.warn('Email configuration not found. Email service will be disabled.');
        return;
      }

      this.transporter = nodemailer.createTransporter({
        host: process.env.EMAIL_HOST,
        port: parseInt(process.env.EMAIL_PORT) || 587,
        secure: process.env.EMAIL_SECURE === 'true', // true for 465, false for other ports
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        },
        tls: {
          rejectUnauthorized: false
        }
      });

      this.isConfigured = true;
      console.log('✅ Email service initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize email service:', error.message);
      this.isConfigured = false;
    }
  }

  /**
   * Verify email connection
   * @returns {boolean} - Connection status
   */
  async verifyConnection() {
    if (!this.isConfigured) {
      return false;
    }

    try {
      await this.transporter.verify();
      return true;
    } catch (error) {
      console.error('Email connection verification failed:', error);
      return false;
    }
  }

  /**
   * Send email with error handling
   * @param {Object} mailOptions - Email options
   * @returns {Object} - Send result
   */
  async sendEmail(mailOptions) {
    if (!this.isConfigured) {
      console.warn('Email service not configured. Email not sent.');
      return { success: false, message: 'Email service not configured' };
    }

    try {
      const defaultOptions = {
        from: {
          name: process.env.APP_NAME || 'EduSmartSystem',
          address: process.env.EMAIL_USER
        }
      };

      const finalOptions = { ...defaultOptions, ...mailOptions };

      const result = await this.transporter.sendMail(finalOptions);
      
      console.log(`📧 Email sent successfully: ${result.messageId}`);
      return { 
        success: true, 
        messageId: result.messageId,
        message: 'Email sent successfully'
      };
    } catch (error) {
      console.error('❌ Email sending failed:', error);
      return { 
        success: false, 
        error: error.message,
        message: 'Failed to send email'
      };
    }
  }

  /**
   * Generate email template
   * @param {string} templateName - Template name
   * @param {Object} data - Template data
   * @returns {string} - HTML content
   */
  generateTemplate(templateName, data) {
    const templates = {
      welcome: this.getWelcomeTemplate(data),
      passwordReset: this.getPasswordResetTemplate(data),
      passwordChanged: this.getPasswordChangedTemplate(data),
      gradeNotification: this.getGradeNotificationTemplate(data),
      attendanceAlert: this.getAttendanceAlertTemplate(data),
      parentNotification: this.getParentNotificationTemplate(data),
      systemAlert: this.getSystemAlertTemplate(data)
    };

    return templates[templateName] || this.getGenericTemplate(data);
  }

  /**
   * Welcome email template
   * @param {Object} data - Template data
   * @returns {string} - HTML content
   */
  getWelcomeTemplate(data) {
    const { user, tempPassword } = data;
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Welcome to EduSmartSystem</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #2c5aa0; color: white; padding: 20px; text-align: center; }
          .content { padding: 30px 20px; background: #f9f9f9; }
          .footer { background: #333; color: white; padding: 20px; text-align: center; font-size: 12px; }
          .button { background: #2c5aa0; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 10px 0; }
          .alert { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 15px 0; }
          .uzbek-text { margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to EduSmartSystem</h1>
            <p>Student Management System</p>
          </div>
          
          <div class="content">
            <h2>Hello ${user.firstName} ${user.lastName}!</h2>
            
            <p>Welcome to EduSmartSystem, your comprehensive school management platform. Your account has been successfully created.</p>
            
            <div class="alert">
              <strong>Account Details:</strong><br>
              <strong>Username:</strong> ${user.username}<br>
              <strong>Email:</strong> ${user.email}<br>
              <strong>Role:</strong> ${user.role}<br>
              ${tempPassword ? `<strong>Temporary Password:</strong> ${tempPassword}<br>` : ''}
            </div>
            
            ${tempPassword ? `
            <p><strong>Important:</strong> Please change your temporary password after your first login for security reasons.</p>
            ` : ''}
            
            <p>You can now access the system using your credentials. If you have any questions or need assistance, please contact your system administrator.</p>
            
            <a href="${process.env.APP_URL || 'http://localhost:3000'}" class="button">Login to EduSmartSystem</a>
            
            <div class="uzbek-text">
              <h3>EduSmartSystem ga xush kelibsiz!</h3>
              <p>Hurmatli ${user.firstName} ${user.lastName}!</p>
              <p>EduSmartSystem ga xush kelibsiz! Sizning hisobingiz muvaffaqiyatli yaratildi.</p>
              
              <p><strong>Hisob ma'lumotlari:</strong></p>
              <ul>
                <li><strong>Foydalanuvchi nomi:</strong> ${user.username}</li>
                <li><strong>Email:</strong> ${user.email}</li>
                <li><strong>Rol:</strong> ${user.role}</li>
                ${tempPassword ? `<li><strong>Vaqtinchalik parol:</strong> ${tempPassword}</li>` : ''}
              </ul>
              
              ${tempPassword ? `<p><strong>Muhim:</strong> Xavfsizlik uchun birinchi kirishdan keyin vaqtinchalik parolingizni o'zgartiring.</p>` : ''}
              
              <p>Agar savollaringiz bo'lsa, tizim administratori bilan bog'laning.</p>
            </div>
          </div>
          
          <div class="footer">
            <p>&copy; 2025 EduSmartSystem. All rights reserved.</p>
            <p>This is an automated message. Please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Password reset email template
   * @param {Object} data - Template data
   * @returns {string} - HTML content
   */
  getPasswordResetTemplate(data) {
    const { user, resetToken, resetUrl } = data;
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Password Reset Request</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #e74c3c; color: white; padding: 20px; text-align: center; }
          .content { padding: 30px 20px; background: #f9f9f9; }
          .footer { background: #333; color: white; padding: 20px; text-align: center; font-size: 12px; }
          .button { background: #e74c3c; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 10px 0; }
          .warning { background: #f8d7da; border: 1px solid #f5c6cb; padding: 15px; border-radius: 5px; margin: 15px 0; }
          .uzbek-text { margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Password Reset Request</h1>
            <p>EduSmartSystem</p>
          </div>
          
          <div class="content">
            <h2>Hello ${user.firstName} ${user.lastName},</h2>
            
            <p>We received a request to reset your password for your EduSmartSystem account.</p>
            
            <p>If you requested this password reset, click the button below to create a new password:</p>
            
            <a href="${resetUrl || '#'}" class="button">Reset Password</a>
            
            <div class="warning">
              <strong>Security Notice:</strong><br>
              • This reset link will expire in 1 hour<br>
              • If you didn't request this reset, please ignore this email<br>
              • Your password won't be changed unless you click the link above
            </div>
            
            <p>If the button doesn't work, copy and paste this link into your browser:</p>
            <p style="word-break: break-all; background: #f5f5f5; padding: 10px; border-radius: 3px;">${resetUrl || '#'}</p>
            
            <div class="uzbek-text">
              <h3>Parolni tiklash so'rovi</h3>
              <p>Hurmatli ${user.firstName} ${user.lastName},</p>
              <p>EduSmartSystem hisobingiz uchun parolni tiklash so'rovi oldik.</p>
              <p>Agar siz ushbu parolni tiklash so'rovini yuborganingiz bo'lsa, yangi parol yaratish uchun quyidagi tugmani bosing:</p>
              <p><strong>Xavfsizlik eslatmasi:</strong></p>
              <ul>
                <li>Ushbu havola 1 soat ichida yaroqsiz bo'ladi</li>
                <li>Agar siz bu so'rovni yubormaganingiz bo'lsa, ushbu emailni e'tiborsiz qoldiring</li>
                <li>Yuqoridagi havolani bosmaguningizcha parolingiz o'zgartirilmaydi</li>
              </ul>
            </div>
          </div>
          
          <div class="footer">
            <p>&copy; 2025 EduSmartSystem. All rights reserved.</p>
            <p>This is an automated message. Please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Password changed notification template
   * @param {Object} data - Template data
   * @returns {string} - HTML content
   */
  getPasswordChangedTemplate(data) {
    const { user } = data;
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Password Changed Successfully</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #27ae60; color: white; padding: 20px; text-align: center; }
          .content { padding: 30px 20px; background: #f9f9f9; }
          .footer { background: #333; color: white; padding: 20px; text-align: center; font-size: 12px; }
          .success { background: #d4edda; border: 1px solid #c3e6cb; padding: 15px; border-radius: 5px; margin: 15px 0; }
          .uzbek-text { margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Password Changed Successfully</h1>
            <p>EduSmartSystem</p>
          </div>
          
          <div class="content">
            <h2>Hello ${user.firstName} ${user.lastName},</h2>
            
            <div class="success">
              <strong>✅ Your password has been changed successfully!</strong>
            </div>
            
            <p>This email confirms that your EduSmartSystem account password was changed on ${new Date().toLocaleString()}.</p>
            
            <p>If you made this change, no further action is required.</p>
            
            <p>If you did not change your password, please contact your system administrator immediately as your account may have been compromised.</p>
            
            <div class="uzbek-text">
              <h3>Parol muvaffaqiyatli o'zgartirildi</h3>
              <p>Hurmatli ${user.firstName} ${user.lastName},</p>
              <p>Ushbu email EduSmartSystem hisobingiz paroli ${new Date().toLocaleString()} da o'zgartirilganini tasdiqlaydi.</p>
              <p>Agar siz ushbu o'zgarishni amalga oshirgan bo'lsangiz, boshqa hech narsa qilish shart emas.</p>
              <p>Agar parolingizni o'zgartirmagan bo'lsangiz, darhol tizim administratori bilan bog'laning, chunki hisobingiz buzilgan bo'lishi mumkin.</p>
            </div>
          </div>
          
          <div class="footer">
            <p>&copy; 2025 EduSmartSystem. All rights reserved.</p>
            <p>This is an automated message. Please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Grade notification template
   * @param {Object} data - Template data
   * @returns {string} - HTML content
   */
  getGradeNotificationTemplate(data) {
    const { student, grade, subject, parent } = data;
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>New Grade Notification</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #3498db; color: white; padding: 20px; text-align: center; }
          .content { padding: 30px 20px; background: #f9f9f9; }
          .footer { background: #333; color: white; padding: 20px; text-align: center; font-size: 12px; }
          .grade-info { background: white; border: 2px solid #3498db; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .grade-value { font-size: 24px; font-weight: bold; color: #2c5aa0; text-align: center; margin: 10px 0; }
          .uzbek-text { margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📊 New Grade Notification</h1>
            <p>EduSmartSystem</p>
          </div>
          
          <div class="content">
            <h2>Dear ${parent ? parent.firstName + ' ' + parent.lastName : 'Parent/Guardian'},</h2>
            
            <p>A new grade has been recorded for <strong>${student.firstName} ${student.lastName}</strong>.</p>
            
            <div class="grade-info">
              <h3>Grade Details</h3>
              <p><strong>Student:</strong> ${student.firstName} ${student.lastName} (${student.studentNumber})</p>
              <p><strong>Subject:</strong> ${subject.name}</p>
              <p><strong>Assessment Type:</strong> ${grade.gradeType}</p>
              <p><strong>Date:</strong> ${new Date(grade.gradeDate).toLocaleDateString()}</p>
              
              <div class="grade-value">
                Grade: ${grade.gradeValue}/100
              </div>
              
              ${grade.comments ? `<p><strong>Teacher Comments:</strong> ${grade.comments}</p>` : ''}
            </div>
            
            <p>You can view detailed academic progress by logging into the EduSmartSystem parent portal.</p>
            
            <div class="uzbek-text">
              <h3>📊 Yangi baho haqida xabar</h3>
              <p>Hurmatli ${parent ? parent.firstName + ' ' + parent.lastName : 'Ota-ona/Vasiy'},</p>
              <p><strong>${student.firstName} ${student.lastName}</strong> uchun yangi baho kiritildi.</p>
              
              <p><strong>Baho tafsilotlari:</strong></p>
              <ul>
                <li><strong>Talaba:</strong> ${student.firstName} ${student.lastName} (${student.studentNumber})</li>
                <li><strong>Fan:</strong> ${subject.nameUz || subject.name}</li>
                <li><strong>Baholash turi:</strong> ${grade.gradeType}</li>
                <li><strong>Sana:</strong> ${new Date(grade.gradeDate).toLocaleDateString()}</li>
                <li><strong>Baho:</strong> ${grade.gradeValue}/100</li>
              </ul>
              
              <p>Batafsil akademik muvaffaqiyatni ko'rish uchun EduSmartSystem ota-ona portaliga kiring.</p>
            </div>
          </div>
          
          <div class="footer">
            <p>&copy; 2025 EduSmartSystem. All rights reserved.</p>
            <p>This is an automated message. Please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Attendance alert template
   * @param {Object} data - Template data
   * @returns {string} - HTML content
   */
  getAttendanceAlertTemplate(data) {
    const { student, attendanceStats, parent } = data;
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Attendance Alert</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #f39c12; color: white; padding: 20px; text-align: center; }
          .content { padding: 30px 20px; background: #f9f9f9; }
          .footer { background: #333; color: white; padding: 20px; text-align: center; font-size: 12px; }
          .alert { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 15px 0; }
          .stats { background: white; border: 1px solid #ddd; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .uzbek-text { margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>⚠️ Attendance Alert</h1>
            <p>EduSmartSystem</p>
          </div>
          
          <div class="content">
            <h2>Dear ${parent ? parent.firstName + ' ' + parent.lastName : 'Parent/Guardian'},</h2>
            
            <div class="alert">
              <strong>Attendance Alert for ${student.firstName} ${student.lastName}</strong><br>
              This notification is to inform you about your child's recent attendance pattern.
            </div>
            
            <div class="stats">
              <h3>Attendance Statistics</h3>
              <p><strong>Student:</strong> ${student.firstName} ${student.lastName} (${student.studentNumber})</p>
              <p><strong>Current Attendance Rate:</strong> ${attendanceStats.attendanceRate}%</p>
              <p><strong>Total Days:</strong> ${attendanceStats.totalDays}</p>
              <p><strong>Present Days:</strong> ${attendanceStats.presentDays}</p>
              <p><strong>Absent Days:</strong> ${attendanceStats.absentDays}</p>
              <p><strong>Late Days:</strong> ${attendanceStats.lateDays}</p>
            </div>
            
            <p>Regular attendance is crucial for academic success. If there are any issues affecting attendance, please contact the school administration.</p>
            
            <div class="uzbek-text">
              <h3>⚠️ Davomat haqida ogohlantirish</h3>
              <p>Hurmatli ${parent ? parent.firstName + ' ' + parent.lastName : 'Ota-ona/Vasiy'},</p>
              <p>Bu xabar ${student.firstName} ${student.lastName}ning so'nggi davomat holati haqida ma'lumot berish uchun yuborilmoqda.</p>
              
              <p><strong>Davomat statistikasi:</strong></p>
              <ul>
                <li><strong>Davomat ko'rsatkichi:</strong> ${attendanceStats.attendanceRate}%</li>
                <li><strong>Jami kunlar:</strong> ${attendanceStats.totalDays}</li>
                <li><strong>Qatnashgan kunlar:</strong> ${attendanceStats.presentDays}</li>
                <li><strong>Qatnashmagan kunlar:</strong> ${attendanceStats.absentDays}</li>
                <li><strong>Kech kelgan kunlar:</strong> ${attendanceStats.lateDays}</li>
              </ul>
              
              <p>Muntazam davomat akademik muvaffaqiyat uchun juda muhim. Agar davomatga ta'sir qiluvchi muammolar bo'lsa, maktab ma'muriyati bilan bog'laning.</p>
            </div>
          </div>
          
          <div class="footer">
            <p>&copy; 2025 EduSmartSystem. All rights reserved.</p>
            <p>This is an automated message. Please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Parent notification template
   * @param {Object} data - Template data
   * @returns {string} - HTML content
   */
  getParentNotificationTemplate(data) {
    const { parent, student, message, type } = data;
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>School Notification</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #8e44ad; color: white; padding: 20px; text-align: center; }
          .content { padding: 30px 20px; background: #f9f9f9; }
          .footer { background: #333; color: white; padding: 20px; text-align: center; font-size: 12px; }
          .message { background: white; border-left: 4px solid #8e44ad; padding: 20px; margin: 20px 0; }
          .uzbek-text { margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📢 School Notification</h1>
            <p>EduSmartSystem</p>
          </div>
          
          <div class="content">
            <h2>Dear ${parent.firstName} ${parent.lastName},</h2>
            
            <p>We have an important notification regarding your child <strong>${student.firstName} ${student.lastName}</strong>.</p>
            
            <div class="message">
              <h3>Notification Type: ${type}</h3>
              <p>${message}</p>
            </div>
            
            <p>If you have any questions or concerns, please don't hesitate to contact us.</p>
            
            <div class="uzbek-text">
              <h3>📢 Maktab xabarnomasi</h3>
              <p>Hurmatli ${parent.firstName} ${parent.lastName},</p>
              <p>Sizning farzandingiz <strong>${student.firstName} ${student.lastName}</strong> haqida muhim xabar bor.</p>
              <p><strong>Xabar turi:</strong> ${type}</p>
              <p>${message}</p>
              <p>Agar savollaringiz yoki tashvishlaringiz bo'lsa, biz bilan bog'lanishdan tortinmang.</p>
            </div>
          </div>
          
          <div class="footer">
            <p>&copy; 2025 EduSmartSystem. All rights reserved.</p>
            <p>This is an automated message. Please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * System alert template
   * @param {Object} data - Template data
   * @returns {string} - HTML content
   */
  getSystemAlertTemplate(data) {
    const { recipient, alertType, message, priority } = data;
    
    const priorityColors = {
      low: '#95a5a6',
      medium: '#f39c12',
      high: '#e74c3c',
      critical: '#c0392b'
    };
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>System Alert</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: ${priorityColors[priority] || '#e74c3c'}; color: white; padding: 20px; text-align: center; }
          .content { padding: 30px 20px; background: #f9f9f9; }
          .footer { background: #333; color: white; padding: 20px; text-align: center; font-size: 12px; }
          .alert { background: #f8d7da; border: 1px solid #f5c6cb; padding: 15px; border-radius: 5px; margin: 15px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🚨 System Alert - ${priority.toUpperCase()}</h1>
            <p>EduSmartSystem</p>
          </div>
          
          <div class="content">
            <h2>Dear ${recipient.firstName} ${recipient.lastName},</h2>
            
            <div class="alert">
              <strong>Alert Type:</strong> ${alertType}<br>
              <strong>Priority:</strong> ${priority.toUpperCase()}<br>
              <strong>Time:</strong> ${new Date().toLocaleString()}
            </div>
            
            <p>${message}</p>
            
            <p>Please review this alert and take appropriate action if necessary.</p>
          </div>
          
          <div class="footer">
            <p>&copy; 2025 EduSmartSystem. All rights reserved.</p>
            <p>This is an automated message. Please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Generic email template
   * @param {Object} data - Template data
   * @returns {string} - HTML content
   */
  getGenericTemplate(data) {
    const { recipient, subject, message } = data;
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>${subject || 'EduSmartSystem Notification'}</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #2c5aa0; color: white; padding: 20px; text-align: center; }
          .content { padding: 30px 20px; background: #f9f9f9; }
          .footer { background: #333; color: white; padding: 20px; text-align: center; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>EduSmartSystem</h1>
            <p>Student Management System</p>
          </div>
          
          <div class="content">
            <h2>Dear ${recipient ? recipient.firstName + ' ' + recipient.lastName : 'User'},</h2>
            <p>${message || 'This is a notification from EduSmartSystem.'}</p>
          </div>
          
          <div class="footer">
            <p>&copy; 2025 EduSmartSystem. All rights reserved.</p>
            <p>This is an automated message. Please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  // === PUBLIC METHODS FOR SENDING SPECIFIC EMAILS ===

  /**
   * Send welcome email to new user
   * @param {Object} user - User object
   * @param {string} tempPassword - Temporary password (optional)
   * @returns {Object} - Send result
   */
  async sendWelcomeEmail(user, tempPassword = null) {
    const html = this.generateTemplate('welcome', { user, tempPassword });
    
    return await this.sendEmail({
      to: user.email,
      subject: 'Welcome to EduSmartSystem / EduSmartSystem ga xush kelibsiz',
      html
    });
  }

  /**
   * Send password reset email
   * @param {Object} user - User object
   * @param {string} resetToken - Reset token
   * @returns {Object} - Send result
   */
  async sendPasswordResetEmail(user, resetToken) {
    const resetUrl = `${process.env.APP_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;
    const html = this.generateTemplate('passwordReset', { user, resetToken, resetUrl });
    
    return await this.sendEmail({
      to: user.email,
      subject: 'Password Reset Request / Parolni tiklash so\'rovi',
      html
    });
  }

  /**
   * Send password change confirmation
   * @param {Object} user - User object
   * @returns {Object} - Send result
   */
  async sendPasswordChangeNotification(user) {
    const html = this.generateTemplate('passwordChanged', { user });
    
    return await this.sendEmail({
      to: user.email,
      subject: 'Password Changed Successfully / Parol muvaffaqiyatli o\'zgartirildi',
      html
    });
  }

  /**
   * Send grade notification to parents
   * @param {Object} student - Student object
   * @param {Object} grade - Grade object
   * @param {Object} subject - Subject object
   * @param {Array} parents - Array of parent objects
   * @returns {Array} - Send results
   */
  async sendGradeNotification(student, grade, subject, parents) {
    const results = [];
    
    for (const parent of parents) {
      const html = this.generateTemplate('gradeNotification', { student, grade, subject, parent });
      
      const result = await this.sendEmail({
        to: parent.email,
        subject: `New Grade for ${student.firstName} ${student.lastName} / ${student.firstName} ${student.lastName} uchun yangi baho`,
        html
      });
      
      results.push({ parent: parent.id, result });
    }
    
    return results;
  }

  /**
   * Send attendance alert to parents
   * @param {Object} student - Student object
   * @param {Object} attendanceStats - Attendance statistics
   * @param {Array} parents - Array of parent objects
   * @returns {Array} - Send results
   */
  async sendAttendanceAlert(student, attendanceStats, parents) {
    const results = [];
    
    for (const parent of parents) {
      const html = this.generateTemplate('attendanceAlert', { student, attendanceStats, parent });
      
      const result = await this.sendEmail({
        to: parent.email,
        subject: `Attendance Alert for ${student.firstName} ${student.lastName} / ${student.firstName} ${student.lastName} uchun davomat ogohlantirishisi`,
        html
      });
      
      results.push({ parent: parent.id, result });
    }
    
    return results;
  }

  /**
   * Send general notification to parents
   * @param {Object} parent - Parent object
   * @param {Object} student - Student object
   * @param {string} message - Message content
   * @param {string} type - Notification type
   * @returns {Object} - Send result
   */
  async sendParentNotification(parent, student, message, type = 'General') {
    const html = this.generateTemplate('parentNotification', { parent, student, message, type });
    
    return await this.sendEmail({
      to: parent.email,
      subject: `School Notification - ${type} / Maktab xabarnomasi - ${type}`,
      html
    });
  }

  /**
   * Send system alert to administrators
   * @param {Object} recipient - Recipient object
   * @param {string} alertType - Alert type
   * @param {string} message - Alert message
   * @param {string} priority - Alert priority
   * @returns {Object} - Send result
   */
  async sendSystemAlert(recipient, alertType, message, priority = 'medium') {
    const html = this.generateTemplate('systemAlert', { recipient, alertType, message, priority });
    
    return await this.sendEmail({
      to: recipient.email,
      subject: `System Alert - ${alertType} [${priority.toUpperCase()}]`,
      html
    });
  }

  /**
   * Send bulk emails
   * @param {Array} recipients - Array of recipient objects
   * @param {string} subject - Email subject
   * @param {string} template - Template name
   * @param {Object} templateData - Template data
   * @returns {Array} - Send results
   */
  async sendBulkEmails(recipients, subject, template, templateData = {}) {
    const results = [];
    
    for (const recipient of recipients) {
      const html = this.generateTemplate(template, { ...templateData, recipient });
      
      const result = await this.sendEmail({
        to: recipient.email,
        subject,
        html
      });
      
      results.push({ recipient: recipient.id, result });
      
      // Add small delay to avoid overwhelming email server
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    return results;
  }

  /**
   * Test email configuration
   * @returns {Object} - Test result
   */
  async testEmailConfiguration() {
    if (!this.isConfigured) {
      return {
        success: false,
        message: 'Email service not configured'
      };
    }

    try {
      const testResult = await this.sendEmail({
        to: process.env.EMAIL_USER,
        subject: 'EduSmartSystem Email Test',
        html: this.generateTemplate('generic', {
          recipient: { firstName: 'System', lastName: 'Administrator' },
          message: 'This is a test email to verify email configuration is working correctly.'
        })
      });

      return testResult;
    } catch (error) {
      return {
        success: false,
        message: 'Email test failed',
        error: error.message
      };
    }
  }
}

module.exports = new EmailService();