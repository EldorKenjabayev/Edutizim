const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Class = sequelize.define('Class', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    grade: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1,
        max: 11
      }
    },
    section: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'A'
    },
    academicYear: {
      type: DataTypes.STRING,
      allowNull: false
    },
    maxStudents: {
      type: DataTypes.INTEGER,
      defaultValue: 30
    },
    classTeacherId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'teachers',
        key: 'id'
      }
    },
    schedule: {
      type: DataTypes.JSONB,
      allowNull: true
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive'),
      defaultValue: 'active'
    }
  }, {
    tableName: 'classes'
  });

  Class.associate = (models) => {
    Class.hasMany(models.Student, { foreignKey: 'classId', as: 'students' });
    Class.belongsTo(models.Teacher, { foreignKey: 'classTeacherId', as: 'classTeacher' });
    Class.belongsToMany(models.Teacher, { 
      through: 'ClassTeachers', 
      foreignKey: 'classId', 
      as: 'teachers' 
    });
    Class.hasMany(models.Grade, { foreignKey: 'classId', as: 'grades' });
    Class.hasMany(models.Attendance, { foreignKey: 'classId', as: 'attendanceRecords' });
  };

  return Class;
};