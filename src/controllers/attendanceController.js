const { Attendance, Student, Subject, Teacher, Class } = require('../models');
const { Op } = require('sequelize');
const moment = require('moment');

const getAllAttendance = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      studentId, 
      classId, 
      subjectId, 
      date, 
      startDate, 
      endDate,
      status 
    } = req.query;
    
    const offset = (page - 1) * limit;
    const whereClause = {};

    if (studentId) whereClause.studentId = studentId;
    if (classId) whereClause.classId = classId;
    if (subjectId) whereClause.subjectId = subjectId;
    if (status) whereClause.status = status;
    
    if (date) {
      whereClause.date = date;
    } else if (startDate && endDate) {
      whereClause.date = {
        [Op.between]: [startDate, endDate]
      };
    }

    // For teachers, limit to their own classes
    if (req.user.role === 'teacher') {
      whereClause.teacherId = req.user.teacherProfile?.id;
    }

    const { count, rows: attendance } = await Attendance.findAndCountAll({
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
        },
        {
          model: Teacher,
          as: 'teacher',
          attributes: ['id', 'firstName', 'lastName']
        },
        {
          model: Class,
          as: 'class',
          attributes: ['id', 'name', 'grade', 'section']
        }
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['date', 'DESC'], ['timeIn', 'ASC']]
    });

    res.json({
      success: true,
      data: {
        attendance,
        pagination: {
          total: count,
          page: parseInt(page),
          pages: Math.ceil(count / limit),
          limit: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Get attendance error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get attendance',
      message_uz: 'Davomatni olishda xato'
    });
  }
};

const markAttendance = async (req, res) => {
  try {
    const attendanceData = req.body;
    
    // Set teacher ID from authenticated user if teacher role
    if (req.user.role === 'teacher') {
      attendanceData.teacherId = req.user.teacherProfile?.id;
    }

    // Check if attendance already exists for this student on this date
    const existingAttendance = await Attendance.findOne({
      where: {
        studentId: attendanceData.studentId,
        classId: attendanceData.classId,
        date: attendanceData.date
      }
    });

    let attendance;
    if (existingAttendance) {
      // Update existing attendance
      await existingAttendance.update(attendanceData);
      attendance = existingAttendance;
    } else {
      // Create new attendance record
      attendance = await Attendance.create(attendanceData);
    }

    const result = await Attendance.findByPk(attendance.id, {
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

    res.status(existingAttendance ? 200 : 201).json({
      success: true,
      message: existingAttendance ? 'Attendance updated successfully' : 'Attendance marked successfully',
      message_uz: existingAttendance ? 'Davomat muvaffaqiyatli yangilandi' : 'Davomat muvaffaqiyatli belgilandi',
      data: { attendance: result }
    });
  } catch (error) {
    console.error('Mark attendance error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark attendance',
      message_uz: 'Davomatni belgilashda xato'
    });
  }
};

const batchMarkAttendance = async (req, res) => {
  try {
    const { attendanceRecords } = req.body;

    if (!Array.isArray(attendanceRecords) || attendanceRecords.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Attendance records array is required',
        message_uz: 'Davomat yozuvlari massivi talab qilinadi'
      });
    }

    // Set teacher ID for all records if teacher role
    if (req.user.role === 'teacher') {
      attendanceRecords.forEach(record => {
        record.teacherId = req.user.teacherProfile?.id;
      });
    }

    const results = [];
    for (const record of attendanceRecords) {
      const existingAttendance = await Attendance.findOne({
        where: {
          studentId: record.studentId,
          classId: record.classId,
          date: record.date
        }
      });

      if (existingAttendance) {
        await existingAttendance.update(record);
        results.push(existingAttendance);
      } else {
        const newAttendance = await Attendance.create(record);
        results.push(newAttendance);
      }
    }

    res.json({
      success: true,
      message: `${results.length} attendance records processed successfully`,
      message_uz: `${results.length} ta davomat yozuvi muvaffaqiyatli qayta ishlandi`,
      data: { attendance: results }
    });
  } catch (error) {
    console.error('Batch mark attendance error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process attendance records',
      message_uz: 'Davomat yozuvlarini qayta ishlashda xato'
    });
  }
};

const getAttendanceReport = async (req, res) => {
  try {
    const { classId, startDate, endDate, studentId } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Start date and end date are required',
        message_uz: 'Boshlanish va tugash sanasi talab qilinadi'
      });
    }

    const whereClause = {
      date: {
        [Op.between]: [startDate, endDate]
      }
    };

    if (classId) whereClause.classId = classId;
    if (studentId) whereClause.studentId = studentId;

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
        }
      ],
      order: [['date', 'ASC'], ['student', 'firstName', 'ASC']]
    });

    // Group attendance by student
    const studentAttendance = {};
    attendance.forEach(record => {
      const studentId = record.studentId;
      if (!studentAttendance[studentId]) {
        studentAttendance[studentId] = {
          student: record.student,
          records: [],
          summary: {
            present: 0,
            absent: 0,
            late: 0,
            excused: 0,
            total: 0
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

const getAttendanceStatistics = async (req, res) => {
  try {
    const { classId, startDate, endDate } = req.query;

    const whereClause = {};
    if (classId) whereClause.classId = classId;
    if (startDate && endDate) {
      whereClause.date = {
        [Op.between]: [startDate, endDate]
      };
    }

    const attendance = await Attendance.findAll({
      where: whereClause,
      attributes: ['status'],
      raw: true
    });

    const totalRecords = attendance.length;
    const statistics = {
      total: totalRecords,
      present: attendance.filter(a => a.status === 'present').length,
      absent: attendance.filter(a => a.status === 'absent').length,
      late: attendance.filter(a => a.status === 'late').length,
      excused: attendance.filter(a => a.status === 'excused').length
    };

    // Calculate percentages
    if (totalRecords > 0) {
      statistics.percentages = {
        present: Math.round((statistics.present / totalRecords) * 100),
        absent: Math.round((statistics.absent / totalRecords) * 100),
        late: Math.round((statistics.late / totalRecords) * 100),
        excused: Math.round((statistics.excused / totalRecords) * 100)
      };
    } else {
      statistics.percentages = {
        present: 0,
        absent: 0,
        late: 0,
        excused: 0
      };
    }

    res.json({
      success: true,
      data: { statistics }
    });
  } catch (error) {
    console.error('Get attendance statistics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get attendance statistics',
      message_uz: 'Davomat statistikasini olishda xato'
    });
  }
};

module.exports = {
  getAllAttendance,
  markAttendance,
  batchMarkAttendance,
  getAttendanceReport,
  getAttendanceStatistics
};