const { Grade, Student, Subject, Teacher, Class } = require('../models');
const { Op } = require('sequelize');

const getAllGrades = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      studentId, 
      subjectId, 
      classId, 
      semester, 
      academicYear,
      gradeType 
    } = req.query;
    
    const offset = (page - 1) * limit;
    const whereClause = {};

    if (studentId) whereClause.studentId = studentId;
    if (subjectId) whereClause.subjectId = subjectId;
    if (classId) whereClause.classId = classId;
    if (semester) whereClause.semester = semester;
    if (academicYear) whereClause.academicYear = academicYear;
    if (gradeType) whereClause.gradeType = gradeType;

    // For teachers, limit to their own grades
    if (req.user.role === 'teacher') {
      whereClause.teacherId = req.user.teacherProfile?.id;
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
      order: [['gradeDate', 'DESC']]
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
        }
      }
    });
  } catch (error) {
    console.error('Get grades error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get grades',
      message_uz: 'Baholarni olishda xato'
    });
  }
};

const createGrade = async (req, res) => {
  try {
    const gradeData = req.body;
    
    // Set teacher ID from authenticated user if teacher role
    if (req.user.role === 'teacher') {
      gradeData.teacherId = req.user.teacherProfile?.id;
    }

    const grade = await Grade.create(gradeData);

    const createdGrade = await Grade.findByPk(grade.id, {
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
        }
      ]
    });

    res.status(201).json({
      success: true,
      message: 'Grade created successfully',
      message_uz: 'Baho muvaffaqiyatli yaratildi',
      data: { grade: createdGrade }
    });
  } catch (error) {
    console.error('Create grade error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create grade',
      message_uz: 'Baho yaratishda xato'
    });
  }
};

const updateGrade = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const grade = await Grade.findByPk(id);
    if (!grade) {
      return res.status(404).json({
        success: false,
        message: 'Grade not found',
        message_uz: 'Baho topilmadi'
      });
    }

    // Check if teacher can update this grade
    if (req.user.role === 'teacher' && grade.teacherId !== req.user.teacherProfile?.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this grade',
        message_uz: 'Bu bahoni yangilash uchun ruxsat yo\'q'
      });
    }

    await grade.update(updateData);

    const updatedGrade = await Grade.findByPk(id, {
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

    res.json({
      success: true,
      message: 'Grade updated successfully',
      message_uz: 'Baho muvaffaqiyatli yangilandi',
      data: { grade: updatedGrade }
    });
  } catch (error) {
    console.error('Update grade error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update grade',
      message_uz: 'Bahoni yangilashda xato'
    });
  }
};

const batchCreateGrades = async (req, res) => {
  try {
    const { grades } = req.body;

    if (!Array.isArray(grades) || grades.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Grades array is required',
        message_uz: 'Baholar massivi talab qilinadi'
      });
    }

    // Set teacher ID for all grades if teacher role
    if (req.user.role === 'teacher') {
      grades.forEach(grade => {
        grade.teacherId = req.user.teacherProfile?.id;
      });
    }

    const createdGrades = await Grade.bulkCreate(grades, {
      validate: true,
      returning: true
    });

    res.status(201).json({
      success: true,
      message: `${createdGrades.length} grades created successfully`,
      message_uz: `${createdGrades.length} ta baho muvaffaqiyatli yaratildi`,
      data: { grades: createdGrades }
    });
  } catch (error) {
    console.error('Batch create grades error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create grades',
      message_uz: 'Baholarni yaratishda xato'
    });
  }
};

const getGradeStatistics = async (req, res) => {
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
          attributes: ['id', 'firstName', 'lastName']
        }
      ]
    });

    // Calculate statistics
    const gradeValues = grades.map(g => g.gradeValue);
    const totalGrades = gradeValues.length;
    
    if (totalGrades === 0) {
      return res.json({
        success: true,
        data: {
          statistics: {
            total: 0,
            average: 0,
            highest: 0,
            lowest: 0,
            distribution: {}
          }
        }
      });
    }

    const average = gradeValues.reduce((sum, grade) => sum + grade, 0) / totalGrades;
    const highest = Math.max(...gradeValues);
    const lowest = Math.min(...gradeValues);

    // Grade distribution
    const distribution = {
      excellent: gradeValues.filter(g => g >= 85).length, // 85-100
      good: gradeValues.filter(g => g >= 70 && g < 85).length, // 70-84
      satisfactory: gradeValues.filter(g => g >= 60 && g < 70).length, // 60-69
      unsatisfactory: gradeValues.filter(g => g < 60).length // 0-59
    };

    res.json({
      success: true,
      data: {
        statistics: {
          total: totalGrades,
          average: Math.round(average * 100) / 100,
          highest,
          lowest,
          distribution
        }
      }
    });
  } catch (error) {
    console.error('Get grade statistics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get grade statistics',
      message_uz: 'Baho statistikasini olishda xato'
    });
  }
};

module.exports = {
  getAllGrades,
  createGrade,
  updateGrade,
  batchCreateGrades,
  getGradeStatistics
};