const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Guardian = sequelize.define('Guardian', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: true,
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
    relationship: {
      type: DataTypes.ENUM('father', 'mother', 'guardian', 'other'),
      allowNull: false
    },
    phoneNumber: {
      type: DataTypes.STRING,
      allowNull: false
    },
    email: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        isEmail: true
      }
    },
    address: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    occupation: {
      type: DataTypes.STRING,
      allowNull: true
    },
    workPhone: {
      type: DataTypes.STRING,
      allowNull: true
    },
    emergencyContact: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive'),
      defaultValue: 'active'
    }
  }, {
    tableName: 'guardians'
  });

  Guardian.associate = (models) => {
    Guardian.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
    Guardian.belongsToMany(models.Student, { 
      through: 'StudentGuardians', 
      foreignKey: 'guardianId', 
      as: 'students' 
    });
  };

  return Guardian;
};