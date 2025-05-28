const sequelize = require('../config/database');
const { DataTypes } = require('sequelize');

// Model'larni import qilish
const User = require('./User')(sequelize, DataTypes);
const Student = require('./Student')(sequelize, DataTypes);
const Teacher = require('./Teacher')(sequelize, DataTypes);
const Class = require('./Class')(sequelize, DataTypes);
const Subject = require('./Subject')(sequelize, DataTypes);
const Grade = require('./Grade')(sequelize, DataTypes);
const Attendance = require('./Attendance')(sequelize, DataTypes);
const Guardian = require('./Guardian')(sequelize, DataTypes);

// Model'larni bir joyga yig'ish
const models = {
  User,
  Student,
  Teacher,
  Class,
  Subject,
  Grade,
  Attendance,
  Guardian,
  sequelize
};

// Association'larni o'rnatish
Object.keys(models).forEach(modelName => {
  if (models[modelName].associate) {
    models[modelName].associate(models);
  }
});

module.exports = models;