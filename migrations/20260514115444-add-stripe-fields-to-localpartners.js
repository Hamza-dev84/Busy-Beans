'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('local_partners', 'stripeAccountId', {
      type: Sequelize.STRING,
      allowNull: true,
      defaultValue: null
    });

    await queryInterface.addColumn('local_partners', 'stripeAccountStatus', {
      type: Sequelize.ENUM('pending', 'active'),
      allowNull: true,
      defaultValue: null
    });

    await queryInterface.addColumn('local_partners', 'bankAccountDetails', {
      type: Sequelize.STRING,
      allowNull: true,
      defaultValue: null
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('local_partners', 'stripeAccountId');
    await queryInterface.removeColumn('local_partners', 'stripeAccountStatus');
    await queryInterface.removeColumn('local_partners', 'bankAccountDetails');
  }
};