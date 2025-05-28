const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Grade = sequelize.define('Grade', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    studentId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'students',
        key: 'id'
      }
    },
    subjectId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'subjects',
        key: 'id'
      }
    },
    classId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'classes',
        key: 'id'
      }
    },
    teacherId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'teachers',
        key: 'id'
      }
    },
    gradeValue: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      validate: {
        min: 0,
        max: 100
      }
    },
    gradeType: {
      type: DataTypes.ENUM('assignment', 'quiz', 'exam', 'project', 'participation'),
      allowNull: false
    },
    semester: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1,
        max: 2
      }
    },
    academicYear: {
      type: DataTypes.STRING,
      allowNull: false
    },
    gradeDate: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    weight: {
      type: DataTypes.DECIMAL(3, 2),
      defaultValue: 1.0
    },
    comments: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    tableName: 'grades'
  });

  Grade.associate = (models) => {
    Grade.belongsTo(models.Student, { foreignKey: 'studentId', as: 'student' });
    Grade.belongsTo(models.Subject, { foreignKey: 'subjectId', as: 'subject' });
    Grade.belongsTo(models.Class, { foreignKey: 'classId', as: 'class' });
    Grade.belongsTo(models.Teacher, { foreignKey: 'teacherId', as: 'teacher' });
  };

  return Grade;
};