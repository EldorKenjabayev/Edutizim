const { Teacher, User, Subject, Class, Grade, Attendance, Student, sequelize } = require('../models');
const { Op } = require('sequelize');

const getAllTeachers = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, status } = req.query;
    const offset = (page - 1) * limit;

    const whereClause = {};
    if (search) {
      whereClause[Op.or] = [
        { firstName: { [Op.iLike]: `%${search}%` } },
        { lastName: { [Op.iLike]: `%${search}%` } },
        { employeeNumber: { [Op.iLike]: `%${search}%` } }
      ];
    }
    if (status) whereClause.status = status;

    const { count, rows: teachers } = await Teacher.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'user',
          attributes: { exclude: ['password', 'refreshToken'] }
        },
        {
          model: Subject,
          as: 'subjects',
          through: { attributes: [] },
          attributes: ['id', 'name', 'nameUz', 'code']
        },
        {
          model: Class,
          as: 'classes',
          through: { attributes: [] },
          attributes: ['id', 'name', 'grade', 'section']
        }
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['firstName', 'ASC']]
    });

    res.json({
      success: true,
      data: {
        teachers,
        pagination: {
          total: count,
          page: parseInt(page),
          pages: Math.ceil(count / limit),
          limit: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Get teachers error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get teachers',
      message_uz: 'O\'qituvchilarni olishda xato'
    });
  }
};

const getTeacherById = async (req, res) => {
  try {
    const { id } = req.params;

    const teacher = await Teacher.findByPk(id, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: { exclude: ['password', 'refreshToken'] }
        },
        {
          model: Subject,
          as: 'subjects',
          through: { attributes: [] }
        },
        {
          model: Class,
          as: 'classes',
          through: { attributes: [] },
          include: [
            {
              model: Student,
              as: 'students',
              attributes: ['id', 'firstName', 'lastName', 'studentNumber'],
              limit: 5
            }
          ]
        }
      ]
    });

    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: 'Teacher not found',
        message_uz: 'O\'qituvchi topilmadi'
      });
    }

    const teacherStats = await getTeacherStatistics(id);

    res.json({
      success: true,
      data: { 
        teacher,
        statistics: teacherStats
      }
    });
  } catch (error) {
    console.error('Get teacher error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get teacher',
      message_uz: 'O\'qituvchini olishda xato'
    });
  }
};

const createTeacher = async (req, res) => {
  try {
    const teacherData = req.body;
    
    const teacherCount = await Teacher.count();
    const employeeNumber = `EMP${new Date().getFullYear()}${String(teacherCount + 1).padStart(3, '0')}`;

    const teacher = await Teacher.create({
      ...teacherData,
      employeeNumber
    });

    if (req.body.subjects && req.body.subjects.length > 0) {
      const subjectIds = req.body.subjects.map(s => s.id || s);
      await teacher.setSubjects(subjectIds);
    }

    if (req.body.classes && req.body.classes.length > 0) {
      const classIds = req.body.classes.map(c => c.id || c);
      await teacher.setClasses(classIds);
    }

    const createdTeacher = await Teacher.findByPk(teacher.id, {
      include: [
        { model: User, as: 'user', attributes: { exclude: ['password', 'refreshToken'] } },
        { model: Subject, as: 'subjects', through: { attributes: [] } },
        { model: Class, as: 'classes', through: { attributes: [] } }
      ]
    });

    res.status(201).json({
      success: true,
      message: 'Teacher created successfully',
      message_uz: 'O\'qituvchi muvaffaqiyatli yaratildi',
      data: { teacher: createdTeacher }
    });
  } catch (error) {
    console.error('Create teacher error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create teacher',
      message_uz: 'O\'qituvchi yaratishda xato'
    });
  }
};

const updateTeacher = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const teacher = await Teacher.findByPk(id);
    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: 'Teacher not found',
        message_uz: 'O\'qituvchi topilmadi'
      });
    }

    await teacher.update(updateData);

    if (updateData.subjects) {
      const subjectIds = updateData.subjects.map(s => s.id || s);
      await teacher.setSubjects(subjectIds);
    }

    if (updateData.classes) {
      const classIds = updateData.classes.map(c => c.id || c);
      await teacher.setClasses(classIds);
    }

    const updatedTeacher = await Teacher.findByPk(id, {
      include: [
        { model: Subject, as: 'subjects', through: { attributes: [] } },
        { model: Class, as: 'classes', through: { attributes: [] } }
      ]
    });

    res.json({
      success: true,
      message: 'Teacher updated successfully',
      message_uz: 'O\'qituvchi muvaffaqiyatli yangilandi',
      data: { teacher: updatedTeacher }
    });
  } catch (error) {
    console.error('Update teacher error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update teacher',
      message_uz: 'O\'qituvchini yangilashda xato'
    });
  }
};

const deleteTeacher = async (req, res) => {
  try {
    const { id } = req.params;

    const teacher = await Teacher.findByPk(id);
    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: 'Teacher not found',
        message_uz: 'O\'qituvchi topilmadi'
      });
    }

    await teacher.update({ status: 'terminated' });

    res.json({
      success: true,
      message: 'Teacher deleted successfully',
      message_uz: 'O\'qituvchi muvaffaqiyatli o\'chirildi'
    });
  } catch (error) {
    console.error('Delete teacher error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete teacher',
      message_uz: 'O\'qituvchini o\'chirishda xato'
    });
  }
};

const getTeacherClasses = async (req, res) => {
  try {
    const { id } = req.params;
    const { includeStudents = 'false' } = req.query;

    const includeOptions = {
      model: Class,
      as: 'classes',
      through: { attributes: [] }
    };

    if (includeStudents === 'true') {
      includeOptions.include = [
        {
          model: Student,
          as: 'students',
          attributes: ['id', 'firstName', 'lastName', 'studentNumber', 'status'],
          where: { status: 'active' },
          required: false
        }
      ];
    }

    const teacher = await Teacher.findByPk(id, {
      include: [includeOptions]
    });

    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: 'Teacher not found',
        message_uz: 'O\'qituvchi topilmadi'
      });
    }

    const classStats = await Promise.all(
      teacher.classes.map(async (cls) => {
        const studentCount = await Student.count({
          where: { classId: cls.id, status: 'active' }
        });

        const averageGrade = await Grade.findOne({
          where: { classId: cls.id, teacherId: id },
          attributes: [
            [sequelize.fn('AVG', sequelize.col('gradeValue')), 'avg']
          ],
          raw: true
        });

        const attendanceRate = await Attendance.findAll({
          where: { classId: cls.id, teacherId: id },
          attributes: [
            'status',
            [sequelize.fn('COUNT', sequelize.col('status')), 'count']
          ],
          group: ['status'],
          raw: true
        });

        let totalAttendance = 0;
        let presentCount = 0;
        attendanceRate.forEach(record => {
          totalAttendance += parseInt(record.count);
          if (['present', 'late'].includes(record.status)) {
            presentCount += parseInt(record.count);
          }
        });

        return {
          ...cls.toJSON(),
          statistics: {
            studentCount,
            averageGrade: averageGrade?.avg ? Math.round(averageGrade.avg * 100) / 100 : 0,
            attendanceRate: totalAttendance > 0 ? Math.round((presentCount / totalAttendance) * 100) : 0
          }
        };
      })
    );

    res.json({
      success: true,
      data: { classes: classStats }
    });
  } catch (error) {
    console.error('Get teacher classes error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get teacher classes',
      message_uz: 'O\'qituvchi sinflarini olishda xato'
    });
  }
};

const getTeacherSubjects = async (req, res) => {
  try {
    const { id } = req.params;

    const teacher = await Teacher.findByPk(id, {
      include: [
        {
          model: Subject,
          as: 'subjects',
          through: { attributes: [] }
        }
      ]
    });

    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: 'Teacher not found',
        message_uz: 'O\'qituvchi topilmadi'
      });
    }

    const subjectsWithStats = await Promise.all(
      teacher.subjects.map(async (subject) => {
        const gradeStats = await Grade.findOne({
          where: { subjectId: subject.id, teacherId: id },
          attributes: [
            [sequelize.fn('COUNT', sequelize.col('id')), 'totalGrades'],
            [sequelize.fn('AVG', sequelize.col('gradeValue')), 'averageGrade'],
            [sequelize.fn('MAX', sequelize.col('gradeValue')), 'highestGrade'],
            [sequelize.fn('MIN', sequelize.col('gradeValue')), 'lowestGrade']
          ],
          raw: true
        });

        return {
          ...subject.toJSON(),
          statistics: {
            totalGrades: parseInt(gradeStats?.totalGrades) || 0,
            averageGrade: gradeStats?.averageGrade ? Math.round(gradeStats.averageGrade * 100) / 100 : 0,
            highestGrade: gradeStats?.highestGrade || 0,
            lowestGrade: gradeStats?.lowestGrade || 0
          }
        };
      })
    );

    res.json({
      success: true,
      data: { subjects: subjectsWithStats }
    });
  } catch (error) {
    console.error('Get teacher subjects error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get teacher subjects',
      message_uz: 'O\'qituvchi fanlarini olishda xato'
    });
  }
};

const getTeacherGrades = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      semester, 
      academicYear, 
      subjectId, 
      classId, 
      page = 1, 
      limit = 20,
      gradeType,
      startDate,
      endDate
    } = req.query;

    const offset = (page - 1) * limit;
    const whereClause = { teacherId: id };
    
    if (semester) whereClause.semester = semester;
    if (academicYear) whereClause.academicYear = academicYear;
    if (subjectId) whereClause.subjectId = subjectId;
    if (classId) whereClause.classId = classId;
    if (gradeType) whereClause.gradeType = gradeType;
    
    if (startDate && endDate) {
      whereClause.gradeDate = {
        [Op.between]: [startDate, endDate]
      };
    }

    const { count, rows: grades } = await Grade.findAndCountAll({
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
        }
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['gradeDate', 'DESC']]
    });

    const statistics = await Grade.findOne({
      where: { teacherId: id },
      attributes: [
        [sequelize.fn('COUNT', sequelize.col('id')), 'totalGrades'],
        [sequelize.fn('AVG', sequelize.col('gradeValue')), 'averageGrade'],
        [sequelize.fn('MAX', sequelize.col('gradeValue')), 'highestGrade'],
        [sequelize.fn('MIN', sequelize.col('gradeValue')), 'lowestGrade']
      ],
      raw: true
    });

    res.json({
      success: true,
      data: {
        grades,
        pagination: {
          total: count,
          page: parseInt(page),
          pages: Math.ceil(count / limit),
          limit: parseInt(limit)
        },
        statistics: {
          totalGrades: parseInt(statistics?.totalGrades) || 0,
          averageGrade: statistics?.averageGrade ? Math.round(statistics.averageGrade * 100) / 100 : 0,
          highestGrade: statistics?.highestGrade || 0,
          lowestGrade: statistics?.lowestGrade || 0
        }
      }
    });
  } catch (error) {
    console.error('Get teacher grades error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get teacher grades',
      message_uz: 'O\'qituvchi baholarini olishda xato'
    });
  }
};

const getTeacherAttendance = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      startDate, 
      endDate, 
      classId, 
      page = 1, 
      limit = 20,
      status 
    } = req.query;

    const offset = (page - 1) * limit;
    const whereClause = { teacherId: id };
    
    if (startDate && endDate) {
      whereClause.date = {
        [Op.between]: [startDate, endDate]
      };
    }
    if (classId) whereClause.classId = classId;
    if (status) whereClause.status = status;

    const { count, rows: attendance } = await Attendance.findAndCountAll({
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
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['date', 'DESC']]
    });

    const attendanceStats = await Attendance.findAll({
      where: { teacherId: id },
      attributes: [
        'status',
        [sequelize.fn('COUNT', sequelize.col('status')), 'count']
      ],
      group: ['status'],
      raw: true
    });

    const statistics = {
      present: 0,
      absent: 0,
      late: 0,
      excused: 0,
      total: 0
    };

    attendanceStats.forEach(stat => {
      const count = parseInt(stat.count);
      statistics[stat.status] = count;
      statistics.total += count;
    });

    statistics.percentages = {
      present: statistics.total > 0 ? Math.round((statistics.present / statistics.total) * 100) : 0,
      absent: statistics.total > 0 ? Math.round((statistics.absent / statistics.total) * 100) : 0,
      late: statistics.total > 0 ? Math.round((statistics.late / statistics.total) * 100) : 0,
      excused: statistics.total > 0 ? Math.round((statistics.excused / statistics.total) * 100) : 0
    };

    res.json({
      success: true,
      data: {
        attendance,
        pagination: {
          total: count,
          page: parseInt(page),
          pages: Math.ceil(count / limit),
          limit: parseInt(limit)
        },
        statistics
      }
    });
  } catch (error) {
    console.error('Get teacher attendance error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get teacher attendance',
      message_uz: 'O\'qituvchi davomatini olishda xato'
    });
  }
};

const getTeacherSchedule = async (req, res) => {
  try {
    const { id } = req.params;

    const teacher = await Teacher.findByPk(id, {
      include: [
        {
          model: Class,
          as: 'classes',
          through: { attributes: [] },
          attributes: ['id', 'name', 'grade', 'section', 'schedule']
        }
      ]
    });

    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: 'Teacher not found',
        message_uz: 'O\'qituvchi topilmadi'
      });
    }

    const schedule = teacher.classes.map(cls => ({
      classId: cls.id,
      className: cls.name,
      grade: cls.grade,
      section: cls.section,
      schedule: cls.schedule || {}
    }));

    res.json({
      success: true,
      data: { schedule }
    });
  } catch (error) {
    console.error('Get teacher schedule error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get teacher schedule',
      message_uz: 'O\'qituvchi jadvalini olishda xato'
    });
  }
};

const getTeacherDashboard = async (req, res) => {
  try {
    const { id } = req.params;

    const teacher = await Teacher.findByPk(id, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: { exclude: ['password', 'refreshToken'] }
        }
      ]
    });

    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: 'Teacher not found',
        message_uz: 'O\'qituvchi topilmadi'
      });
    }

    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;
    const academicYear = currentMonth >= 9 ? `${currentYear}-${currentYear + 1}` : `${currentYear - 1}-${currentYear}`;
    const semester = (currentMonth >= 9 || currentMonth <= 1) ? 1 : 2;

    const stats = await getTeacherStatistics(id);

    const recentGrades = await Grade.findAll({
      where: { teacherId: id },
      include: [
        {
          model: Student,
          as: 'student',
          attributes: ['firstName', 'lastName', 'studentNumber']
        },
        {
          model: Subject,
          as: 'subject',
          attributes: ['name', 'nameUz']
        }
      ],
      limit: 10,
      order: [['gradeDate', 'DESC']]
    });

    const today = new Date().toISOString().split('T')[0];
    const todayAttendance = await Attendance.findAll({
      where: { 
        teacherId: id,
        date: today
      },
      include: [
        {
          model: Student,
          as: 'student',
          attributes: ['firstName', 'lastName']
        },
        {
          model: Class,
          as: 'class',
          attributes: ['name', 'grade', 'section']
        }
      ]
    });

    const upcomingClasses = await Class.findAll({
      include: [
        {
          model: Teacher,
          as: 'teachers',
          through: { attributes: [] },
          where: { id }
        }
      ],
      limit: 5
    });

    res.json({
      success: true,
      data: {
        teacher: {
          id: teacher.id,
          name: `${teacher.firstName} ${teacher.lastName}`,
          employeeNumber: teacher.employeeNumber,
          email: teacher.user?.email,
          phone: teacher.phoneNumber,
          experience: teacher.experience,
          qualification: teacher.qualification
        },
        statistics: stats,
        recentActivity: {
          recentGrades: recentGrades.slice(0, 5),
          todayAttendance: todayAttendance.length,
          upcomingClasses: upcomingClasses.map(cls => ({
            id: cls.id,
            name: cls.name,
            grade: cls.grade,
            section: cls.section
          }))
        },
        academicInfo: {
          academicYear,
          semester
        }
      }
    });
  } catch (error) {
    console.error('Get teacher dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get teacher dashboard',
      message_uz: 'O\'qituvchi boshqaruv panelini olishda xato'
    });
  }
};

const getTeacherStatistics = async (teacherId) => {
  try {
    const classesWithStudents = await Class.findAll({
      include: [
        {
          model: Teacher,
          as: 'teachers',
          through: { attributes: [] },
          where: { id: teacherId }
        },
        {
          model: Student,
          as: 'students',
          attributes: ['id'],
          where: { status: 'active' },
          required: false
        }
      ]
    });

    const totalStudents = classesWithStudents.reduce((sum, cls) => sum + cls.students.length, 0);
    const totalClasses = classesWithStudents.length;

    const gradeStats = await Grade.findOne({
      where: { teacherId },
      attributes: [
        [sequelize.fn('COUNT', sequelize.col('id')), 'totalGrades'],
        [sequelize.fn('AVG', sequelize.col('gradeValue')), 'averageGrade'],
        [sequelize.fn('MAX', sequelize.col('gradeValue')), 'highestGrade'],
        [sequelize.fn('MIN', sequelize.col('gradeValue')), 'lowestGrade']
      ],
      raw: true
    });

    const attendanceStats = await Attendance.findAll({
      where: { teacherId },
      attributes: [
        'status',
        [sequelize.fn('COUNT', sequelize.col('status')), 'count']
      ],
      group: ['status'],
      raw: true
    });

    let totalAttendanceRecords = 0;
    let presentRecords = 0;
    attendanceStats.forEach(stat => {
      const count = parseInt(stat.count);
      totalAttendanceRecords += count;
      if (['present', 'late'].includes(stat.status)) {
        presentRecords += count;
      }
    });

    const attendanceRate = totalAttendanceRecords > 0 ? Math.round((presentRecords / totalAttendanceRecords) * 100) : 0;

    const subjects = await Subject.findAll({
      include: [
        {
          model: Teacher,
          as: 'teachers',
          through: { attributes: [] },
          where: { id: teacherId }
        }
      ]
    });

    return {
      totalStudents,
      totalClasses,
      totalSubjects: subjects.length,
      gradeStatistics: {
        totalGrades: parseInt(gradeStats?.totalGrades) || 0,
        averageGrade: gradeStats?.averageGrade ? Math.round(gradeStats.averageGrade * 100) / 100 : 0,
        highestGrade: gradeStats?.highestGrade || 0,
        lowestGrade: gradeStats?.lowestGrade || 0
      },
      attendanceStatistics: {
        totalRecords: totalAttendanceRecords,
        attendanceRate
      }
    };
  } catch (error) {
    console.error('Get teacher statistics error:', error);
    return {
      totalStudents: 0,
      totalClasses: 0,
      totalSubjects: 0,
      gradeStatistics: {
        totalGrades: 0,
        averageGrade: 0,
        highestGrade: 0,
        lowestGrade: 0
      },
      attendanceStatistics: {
        totalRecords: 0,
        attendanceRate: 0
      }
    };
  }
};

module.exports = {
  getAllTeachers,
  getTeacherById,
  createTeacher,
  updateTeacher,
  deleteTeacher,
  getTeacherClasses,
  getTeacherSubjects,
  getTeacherGrades,
  getTeacherAttendance,
  getTeacherSchedule,
  getTeacherDashboard
};