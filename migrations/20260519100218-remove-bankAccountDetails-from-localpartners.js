'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.removeColumn('local_partners', 'bankAccountDetails');
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.addColumn('local_partners', 'bankAccountDetails', {
      type: Sequelize.STRING,
      allowNull: true,
      defaultValue: null
    });
  }
};