'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('classes', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      grade: {
        type: Sequelize.INTEGER,
        allowNull: false,
        validate: {
          min: 1,
          max: 11
        }
      },
      section: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: 'A'
      },
      academic_year: {
        type: Sequelize.STRING,
        allowNull: false
      },
      max_students: {
        type: Sequelize.INTEGER,
        defaultValue: 30
      },
      class_teacher_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'teachers',
          key: 'id'
        }
      },
      schedule: {
        type: Sequelize.JSONB,
        allowNull: true
      },
      status: {
        type: Sequelize.ENUM('active', 'inactive'),
        defaultValue: 'active'
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    await queryInterface.addIndex('classes', ['grade', 'section']);
    await queryInterface.addIndex('classes', ['academic_year']);
    await queryInterface.addIndex('classes', ['status']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('classes');
  }
};