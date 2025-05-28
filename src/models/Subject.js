const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Subject = sequelize.define('Subject', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    nameUz: {
      type: DataTypes.STRING,
      allowNull: true
    },
    code: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    creditHours: {
      type: DataTypes.INTEGER,
      defaultValue: 1
    },
    grade: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive'),
      defaultValue: 'active'
    }
  }, {
    tableName: 'subjects'
  });

  Subject.associate = (models) => {
    Subject.belongsToMany(models.Teacher, { 
      through: 'TeacherSubjects', 
      foreignKey: 'subjectId', 
      as: 'teachers' 
    });
    Subject.hasMany(models.Grade, { foreignKey: 'subjectId', as: 'grades' });
  };

  return Subject;
};