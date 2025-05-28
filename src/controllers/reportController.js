const { Student, Grade, Attendance, Class, Subject, Teacher } = require('../models');
const { Op } = require('sequelize');
const moment = require('moment');

const getStudentReport = async (req, res) => {
  try {
    const { classId, startDate, endDate, format = 'json' } = req.query;

    const whereClause = {};
    if (classId) whereClause.classId = classId;

    const students = await Student.findAll({
      where: whereClause,
      include: [
        {
          model: Class,
          as: 'class',
          attributes: ['id', 'name', 'grade', 'section']
        },
        {
          model: Grade,
          as: 'grades',
          where: startDate && endDate ? {
            gradeDate: {
              [Op.between]: [startDate, endDate]
            }
          } : {},
          required: false,
          include: [
            {
              model: Subject,
              as: 'subject',
              attributes: ['id', 'name', 'nameUz']
            }
          ]
        },
        {
          model: Attendance,
          as: 'attendanceRecords',
          where: startDate && endDate ? {
            date: {
              [Op.between]: [startDate, endDate]
            }
          } : {},
          required: false
        }
      ],
      order: [['firstName', 'ASC'], ['lastName', 'ASC']]
    });

    // Process student data
    const studentsReport = students.map(student => {
      const grades = student.grades || [];
      const attendance = student.attendanceRecords || [];

      // Calculate average grade
      const averageGrade = grades.length > 0 
        ? grades.reduce((sum, grade) => sum + grade.gradeValue, 0) / grades.length 
        : 0;

      // Calculate attendance rate
      const totalDays = attendance.length;
      const presentDays = attendance.filter(a => ['present', 'late'].includes(a.status)).length;
      const attendanceRate = totalDays > 0 ? (presentDays / totalDays) * 100 : 0;

      return {
        id: student.id,
        studentNumber: student.studentNumber,
        name: `${student.firstName} ${student.lastName}`,
        class: student.class ? `${student.class.grade}-${student.class.section}` : 'N/A',
        averageGrade: Math.round(averageGrade * 100) / 100,
        attendanceRate: Math.round(attendanceRate * 100) / 100,
        totalGrades: grades.length,
        totalAttendanceDays: totalDays,
        status: student.status
      };
    });

    res.json({
      success: true,
      data: {
        students: studentsReport,
        summary: {
          totalStudents: studentsReport.length,
          averageGrade: studentsReport.length > 0 
            ? studentsReport.reduce((sum, s) => sum + s.averageGrade, 0) / studentsReport.length 
            : 0,
          averageAttendance: studentsReport.length > 0 
            ? studentsReport.reduce((sum, s) => sum + s.attendanceRate, 0) / studentsReport.length 
            : 0
        }
      }
    });
  } catch (error) {
    console.error('Get student report error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get student report',
      message_uz: 'O\'quvchilar hisobotini olishda xato'
    });
  }
};

const getGradeReport = async (req, res) => {
  try {
    const { classId, subjectId, semester, academicYear } = req.query;

    const whereClause = {};
    if (classId) whereClause.classId = classId;
    if (subjectId) whereClause.subjectId = subjectId;
    if (semester) whereClause.semester = semester;
    if (academicYear) whereClause.academicYear = academicYear;

    const grades = await Grade.findAll({
      where: whereClause,
      include: [
        {
          model: Student,
          as: 'student',
          attributes: ['id', 'firstName', 'lastName', 'studentNumber']
        },
        {
          model: Subject,
          as: 'subject',
          attributes: ['id', 'name', 'nameUz', 'code']
        },
        {
          model: Class,
          as: 'class',
          attributes: ['id', 'name', 'grade', 'section']
        },
        {
          model: Teacher,
          as: 'teacher',
          attributes: ['id', 'firstName', 'lastName']
        }
      ],
      order: [['gradeDate', 'DESC']]
    });

    // Group grades by subject
    const subjectGrades = {};
    grades.forEach(grade => {
      const subjectId = grade.subjectId;
      if (!subjectGrades[subjectId]) {
        subjectGrades[subjectId] = {
          subject: grade.subject,
          grades: [],
          statistics: {
            total: 0,
            average: 0,
            highest: 0,
            lowest: 100,
            distribution: {
              excellent: 0,
              good: 0,
              satisfactory: 0,
              unsatisfactory: 0
            }
          }
        };
      }
      subjectGrades[subjectId].grades.push(grade);
    });

    // Calculate statistics for each subject
    Object.keys(subjectGrades).forEach(subjectId => {
      const subjectData = subjectGrades[subjectId];
      const gradeValues = subjectData.grades.map(g => g.gradeValue);
      
      subjectData.statistics.total = gradeValues.length;
      subjectData.statistics.average = gradeValues.length > 0 
        ? gradeValues.reduce((sum, val) => sum + val, 0) / gradeValues.length 
        : 0;
      subjectData.statistics.highest = Math.max(...gradeValues);
      subjectData.statistics.lowest = Math.min(...gradeValues);
      
      // Distribution
      subjectData.statistics.distribution.excellent = gradeValues.filter(g => g >= 85).length;
      subjectData.statistics.distribution.good = gradeValues.filter(g => g >= 70 && g < 85).length;
      subjectData.statistics.distribution.satisfactory = gradeValues.filter(g => g >= 60 && g < 70).length;
      subjectData.statistics.distribution.unsatisfactory = gradeValues.filter(g => g < 60).length;
    });

    res.json({
      success: true,
      data: {
        subjectGrades: Object.values(subjectGrades),
        summary: {
          totalGrades: grades.length,
          totalSubjects: Object.keys(subjectGrades).length
        }
      }
    });
  } catch (error) {
    console.error('Get grade report error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get grade report',
      message_uz: 'Baholar hisobotini olishda xato'
    });
  }
};

const getAttendanceReport = async (req, res) => {
  try {
    const { classId, startDate, endDate, studentId } = req.query;

    const whereClause = {};
    if (classId) whereClause.classId = classId;
    if (studentId) whereClause.studentId = studentId;
    if (startDate && endDate) {
      whereClause.date = {
        [Op.between]: [startDate, endDate]
      };
    }

    const attendance = await Attendance.findAll({
      where: whereClause,
      include: [
        {
          model: Student,
          as: 'student',
          attributes: ['id', 'firstName', 'lastName', 'studentNumber']
        },
        {
          model: Class,
          as: 'class',
          attributes: ['id', 'name', 'grade', 'section']
        },
        {
          model: Subject,
          as: 'subject',
          attributes: ['id', 'name', 'nameUz']
        }
      ],
      order: [['date', 'DESC']]
    });

    // Group by student
    const studentAttendance = {};
    attendance.forEach(record => {
      const studentId = record.studentId;
      if (!studentAttendance[studentId]) {
        studentAttendance[studentId] = {
          student: record.student,
          class: record.class,
          records: [],
          summary: {
            present: 0,
            absent: 0,
            late: 0,
            excused: 0,
            total: 0,
            attendanceRate: 0
          }
        };
      }

      studentAttendance[studentId].records.push(record);
      studentAttendance[studentId].summary[record.status]++;
      studentAttendance[studentId].summary.total++;
    });

    // Calculate attendance rates
    Object.keys(studentAttendance).forEach(studentId => {
      const summary = studentAttendance[studentId].summary;
      const presentDays = summary.present + summary.late;
      summary.attendanceRate = summary.total > 0 
        ? Math.round((presentDays / summary.total) * 100) 
        : 0;
    });

    res.json({
      success: true,
      data: {
        period: { startDate, endDate },
        studentAttendance: Object.values(studentAttendance)
      }
    });
  } catch (error) {
    console.error('Get attendance report error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get attendance report',
      message_uz: 'Davomat hisobotini olishda xato'
    });
  }
};

const getClassPerformanceReport = async (req, res) => {
  try {
    const { classId, academicYear, semester } = req.query;

    const whereClause = {};
    if (classId) whereClause.classId = classId;
    if (academicYear) whereClause.academicYear = academicYear;
    if (semester) whereClause.semester = semester;

    // Get class information
    const classInfo = await Class.findByPk(classId, {
      include: [
        {
          model: Student,
          as: 'students',
          where: { status: 'active' },
          required: false
        }
      ]
    });

    // Get grades for the class
    const grades = await Grade.findAll({
      where: whereClause,
      include: [
        {
          model: Student,
          as: 'student',
          attributes: ['id', 'firstName', 'lastName', 'studentNumber']
        },
        {
          model: Subject,
          as: 'subject',
          attributes: ['id', 'name', 'nameUz']
        }
      ]
    });

    // Get attendance for the class
    const attendance = await Attendance.findAll({
      where: { classId },
      attributes: ['studentId', 'status'],
      raw: true
    });

    // Calculate class statistics
    const gradeValues = grades.map(g => g.gradeValue);
    const classAverage = gradeValues.length > 0 
      ? gradeValues.reduce((sum, val) => sum + val, 0) / gradeValues.length 
      : 0;

    // Attendance statistics
    const totalAttendanceRecords = attendance.length;
    const presentRecords = attendance.filter(a => ['present', 'late'].includes(a.status)).length;
    const classAttendanceRate = totalAttendanceRecords > 0 
      ? (presentRecords / totalAttendanceRecords) * 100 
      : 0;

    // Subject-wise performance
    const subjectPerformance = {};
    grades.forEach(grade => {
      const subjectId = grade.subjectId;
      if (!subjectPerformance[subjectId]) {
        subjectPerformance[subjectId] = {
          subject: grade.subject,
          grades: [],
          average: 0
        };
      }
      subjectPerformance[subjectId].grades.push(grade.gradeValue);
    });

    Object.keys(subjectPerformance).forEach(subjectId => {
      const subject = subjectPerformance[subjectId];
      subject.average = subject.grades.length > 0 
        ? subject.grades.reduce((sum, val) => sum + val, 0) / subject.grades.length 
        : 0;
    });

    res.json({
      success: true,
      data: {
        class: classInfo,
        performance: {
          averageGrade: Math.round(classAverage * 100) / 100,
          attendanceRate: Math.round(classAttendanceRate * 100) / 100,
          totalStudents: classInfo?.students?.length || 0,
          totalGrades: grades.length,
          subjectPerformance: Object.values(subjectPerformance)
        }
      }
    });
  } catch (error) {
    console.error('Get class performance report error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get class performance report',
      message_uz: 'Sinf samaradorligi hisobotini olishda xato'
    });
  }
};

const getTeacherPerformanceReport = async (req, res) => {
  try {
    const { teacherId, startDate, endDate } = req.query;

    if (!teacherId) {
      return res.status(400).json({
        success: false,
        message: 'Teacher ID is required',
        message_uz: 'O\'qituvchi ID si talab qilinadi'
      });
    }

    const whereClause = { teacherId };
    if (startDate && endDate) {
      whereClause.gradeDate = {
        [Op.between]: [startDate, endDate]
      };
    }

    // Get teacher info
    const teacher = await Teacher.findByPk(teacherId, {
      include: [
        { model: User, as: 'user', attributes: ['firstName', 'lastName'] }
      ]
    });

    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: 'Teacher not found',
        message_uz: 'O\'qituvchi topilmadi'
      });
    }

    // Get grades given by teacher
    const grades = await Grade.findAll({
      where: whereClause,
      include: [
        {
          model: Subject,
          as: 'subject',
          attributes: ['id', 'name', 'nameUz']
        },
        {
          model: Class,
          as: 'class',
          attributes: ['id', 'name', 'grade', 'section']
        }
      ]
    });

    // Calculate statistics
    const gradeValues = grades.map(g => g.gradeValue);
    const averageGrade = gradeValues.length > 0 
      ? gradeValues.reduce((sum, val) => sum + val, 0) / gradeValues.length 
      : 0;

    // Group by subject
    const subjectStats = {};
    grades.forEach(grade => {
      const subjectId = grade.subjectId;
      if (!subjectStats[subjectId]) {
        subjectStats[subjectId] = {
          subject: grade.subject,
          totalGrades: 0,
          averageGrade: 0,
          grades: []
        };
      }
      subjectStats[subjectId].grades.push(grade.gradeValue);
      subjectStats[subjectId].totalGrades++;
    });

    // Calculate averages for each subject
    Object.keys(subjectStats).forEach(subjectId => {
      const stats = subjectStats[subjectId];
      stats.averageGrade = stats.grades.reduce((sum, val) => sum + val, 0) / stats.grades.length;
    });

    res.json({
      success: true,
      data: {
        teacher: {
          id: teacher.id,
          name: `${teacher.firstName} ${teacher.lastName}`,
          employeeNumber: teacher.employeeNumber
        },
        performance: {
          totalGrades: grades.length,
          averageGrade: Math.round(averageGrade * 100) / 100,
          subjectStatistics: Object.values(subjectStats)
        },
        period: { startDate, endDate }
      }
    });
  } catch (error) {
    console.error('Get teacher performance report error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get teacher performance report',
      message_uz: 'O\'qituvchi samaradorligi hisobotini olishda xato'
    });
  }
};

const exportReport = async (req, res) => {
  try {
    const { type } = req.params;
    const { format = 'json' } = req.query;

    // This is a placeholder for export functionality
    // In a full implementation, you would generate CSV, PDF, or Excel files
    
    res.json({
      success: true,
      message: `${type} report export functionality - to be implemented`,
      message_uz: `${type} hisoboti eksport funksiyasi - amalga oshirilishi kerak`,
      data: { 
        type, 
        format,
        note: 'Export functionality would generate actual files in production'
      }
    });
  } catch (error) {
    console.error('Export report error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export report',
      message_uz: 'Hisobotni eksport qilishda xato'
    });
  }
};

module.exports = {
  getStudentReport,
  getGradeReport,
  getAttendanceReport,
  getClassPerformanceReport,
  getTeacherPerformanceReport,
  exportReport
};