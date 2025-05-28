const sequelize = require('../config/database');
const User = require('./User');
const Student = require('./Student');
const Teacher = require('./Teacher');
const Class = require('./Class');
const Subject = require('./Subject');
const Grade = require('./Grade');
const Attendance = require('./Attendance');
const Guardian = require('./Guardian');

// Initialize models
const models = {
  User: User(sequelize),
  Student: Student(sequelize),
  Teacher: Teacher(sequelize),
  Class: Class(sequelize),
  Subject: Subject(sequelize),
  Grade: Grade(sequelize),
  Attendance: Attendance(sequelize),
  Guardian: Guardian(sequelize)
};

// Set up associations
Object.keys(models).forEach(modelName => {
  if (models[modelName].associate) {
    models[modelName].associate(models);
  }
});

models.sequelize = sequelize;

module.exports = models;