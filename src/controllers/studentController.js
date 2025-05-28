const { Student, User, Class, Grade, Attendance, Guardian, Subject } = require('../models');
const { Op } = require('sequelize');

const getAllStudents = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, classId, status } = req.query;
    const offset = (page - 1) * limit;

    const whereClause = {};
    if (search) {
      whereClause[Op.or] = [
        { firstName: { [Op.iLike]: `%${search}%` } },
        { lastName: { [Op.iLike]: `%${search}%` } },
        { studentNumber: { [Op.iLike]: `%${search}%` } }
      ];
    }
    if (classId) whereClause.classId = classId;
    if (status) whereClause.status = status;

    const { count, rows: students } = await Student.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'email', 'isActive']
        },
        {
          model: Class,
          as: 'class',
          attributes: ['id', 'name', 'grade', 'section']
        },
        {
          model: Guardian,
          as: 'guardians',
          attributes: ['id', 'firstName', 'lastName', 'relationship', 'phoneNumber'],
          through: { attributes: [] }
        }
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['firstName', 'ASC'], ['lastName', 'ASC']]
    });

    res.json({
      success: true,
      data: {
        students,
        pagination: {
          total: count,
          page: parseInt(page),
          pages: Math.ceil(count / limit),
          limit: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Get students error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get students',
      message_uz: 'O\'quvchilarni olishda xato'
    });
  }
};

const getStudentById = async (req, res) => {
  try {
    const { id } = req.params;

    const student = await Student.findByPk(id, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: { exclude: ['password', 'refreshToken'] }
        },
        {
          model: Class,
          as: 'class'
        },
        {
          model: Guardian,
          as: 'guardians',
          through: { attributes: [] }
        },
        {
          model: Grade,
          as: 'grades',
          include: [
            { model: Subject, as: 'subject', attributes: ['id', 'name', 'nameUz'] }
          ],
          limit: 10,
          order: [['gradeDate', 'DESC']]
        },
        {
          model: Attendance,
          as: 'attendanceRecords',
          limit: 10,
          order: [['date', 'DESC']]
        }
      ]
    });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found',
        message_uz: 'O\'quvchi topilmadi'
      });
    }

    res.json({
      success: true,
      data: { student }
    });
  } catch (error) {
    console.error('Get student error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get student',
      message_uz: 'O\'quvchini olishda xato'
    });
  }
};

const createStudent = async (req, res) => {
  try {
    const studentData = req.body;
    
    // Generate student number
    const studentCount = await Student.count();
    const studentNumber = `STU${new Date().getFullYear()}${String(studentCount + 1).padStart(4, '0')}`;

    const student = await Student.create({
      ...studentData,
      studentNumber
    });

    // If guardians data provided, create relationships
    if (req.body.guardians && req.body.guardians.length > 0) {
      const guardianIds = req.body.guardians.map(g => g.id);
      await student.setGuardians(guardianIds);
    }

    const createdStudent = await Student.findByPk(student.id, {
      include: [
        { model: Class, as: 'class' },
        { model: Guardian, as: 'guardians', through: { attributes: [] } }
      ]
    });

    res.status(201).json({
      success: true,
      message: 'Student created successfully',
      message_uz: 'O\'quvchi muvaffaqiyatli yaratildi',
      data: { student: createdStudent }
    });
  } catch (error) {
    console.error('Create student error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create student',
      message_uz: 'O\'quvchi yaratishda xato'
    });
  }
};

const updateStudent = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const student = await Student.findByPk(id);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found',
        message_uz: 'O\'quvchi topilmadi'
      });
    }

    await student.update(updateData);

    // Update guardian relationships if provided
    if (updateData.guardians) {
      const guardianIds = updateData.guardians.map(g => g.id);
      await student.setGuardians(guardianIds);
    }

    const updatedStudent = await Student.findByPk(id, {
      include: [
        { model: Class, as: 'class' },
        { model: Guardian, as: 'guardians', through: { attributes: [] } }
      ]
    });

    res.json({
      success: true,
      message: 'Student updated successfully',
      message_uz: 'O\'quvchi muvaffaqiyatli yangilandi',
      data: { student: updatedStudent }
    });
  } catch (error) {
    console.error('Update student error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update student',
      message_uz: 'O\'quvchini yangilashda xato'
    });
  }
};

const deleteStudent = async (req, res) => {
  try {
    const { id } = req.params;

    const student = await Student.findByPk(id);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found',
        message_uz: 'O\'quvchi topilmadi'
      });
    }

    // Soft delete by updating status
    await student.update({ status: 'withdrawn' });

    res.json({
      success: true,
      message: 'Student deleted successfully',
      message_uz: 'O\'quvchi muvaffaqiyatli o\'chirildi'
    });
  } catch (error) {
    console.error('Delete student error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete student',
      message_uz: 'O\'quvchini o\'chirishda xato'
    });
  }
};

const getStudentGrades = async (req, res) => {
  try {
    const { id } = req.params;
    const { semester, academicYear, subjectId } = req.query;

    const whereClause = { studentId: id };
    if (semester) whereClause.semester = semester;
    if (academicYear) whereClause.academicYear = academicYear;
    if (subjectId) whereClause.subjectId = subjectId;

    const grades = await Grade.findAll({
      where: whereClause,
      include: [
        { model: Subject, as: 'subject', attributes: ['id', 'name', 'nameUz'] }
      ],
      order: [['gradeDate', 'DESC']]
    });

    res.json({
      success: true,
      data: { grades }
    });
  } catch (error) {
    console.error('Get student grades error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get student grades',
      message_uz: 'O\'quvchi baholarini olishda xato'
    });
  }
};

const getStudentAttendance = async (req, res) => {
  try {
    const { id } = req.params;
    const { startDate, endDate, subjectId } = req.query;

    const whereClause = { studentId: id };
    if (startDate && endDate) {
      whereClause.date = {
        [Op.between]: [startDate, endDate]
      };
    }
    if (subjectId) whereClause.subjectId = subjectId;

    const attendance = await Attendance.findAll({
      where: whereClause,
      include: [
        { model: Subject, as: 'subject', attributes: ['id', 'name', 'nameUz'] }
      ],
      order: [['date', 'DESC']]
    });

    // Calculate attendance statistics
    const totalDays = attendance.length;
    const presentDays = attendance.filter(a => a.status === 'present').length;
    const absentDays = attendance.filter(a => a.status === 'absent').length;
    const lateDays = attendance.filter(a => a.status === 'late').length;
    const excusedDays = attendance.filter(a => a.status === 'excused').length;

    const stats = {
      totalDays,
      presentDays,
      absentDays,
      lateDays,
      excusedDays,
      attendanceRate: totalDays > 0 ? ((presentDays + lateDays) / totalDays * 100).toFixed(2) : 0
    };

    res.json({
      success: true,
      data: { attendance, stats }
    });
  } catch (error) {
    console.error('Get student attendance error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get student attendance',
      message_uz: 'O\'quvchi davomatini olishda xato'
    });
  }
};

module.exports = {
  getAllStudents,
  getStudentById,
  createStudent,
  updateStudent,
  deleteStudent,
  getStudentGrades,
  getStudentAttendance
};