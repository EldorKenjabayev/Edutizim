'use strict';
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

module.exports = {
  async up(queryInterface, Sequelize) {
    const adminId = uuidv4();
    const hashedPassword = await bcrypt.hash('admin123', 12);

    await queryInterface.bulkInsert('users', [{
      id: adminId,
      username: 'admin',
      email: 'admin@edusmart.uz',
      password: hashedPassword,
      first_name: 'System',
      last_name: 'Administrator',
      role: 'admin',
      is_active: true,
      created_at: new Date(),
      updated_at: new Date()
    }], {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('users', {
      username: 'admin'
    }, {});
  }
};