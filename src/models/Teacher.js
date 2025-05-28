const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Teacher = sequelize.define('Teacher', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    employeeNumber: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    firstName: {
      type: DataTypes.STRING,
      allowNull: false
    },
    lastName: {
      type: DataTypes.STRING,
      allowNull: false
    },
    phoneNumber: {
      type: DataTypes.STRING,
      allowNull: true
    },
    address: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    qualification: {
      type: DataTypes.STRING,
      allowNull: true
    },
    experience: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    hireDate: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    salary: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive', 'terminated'),
      defaultValue: 'active'
    }
  }, {
    tableName: 'teachers'
  });

  Teacher.associate = (models) => {
    Teacher.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
    Teacher.belongsToMany(models.Subject, { 
      through: 'TeacherSubjects', 
      foreignKey: 'teacherId', 
      as: 'subjects' 
    });
    Teacher.belongsToMany(models.Class, { 
      through: 'ClassTeachers', 
      foreignKey: 'teacherId', 
      as: 'classes' 
    });
  };

  return Teacher;
};