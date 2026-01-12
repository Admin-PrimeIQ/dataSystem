'use strict';

module.exports = {
  async up(knex) {
    const client = knex.client.config.client;

    if (client === 'mysql' || client === 'mysql2') {
      // MySQL requires MODIFY COLUMN syntax
      await knex.raw('ALTER TABLE `projects` MODIFY COLUMN `latitude` DECIMAL(10, 8)');
      await knex.raw('ALTER TABLE `projects` MODIFY COLUMN `longitude` DECIMAL(10, 8)');
    } else if (client === 'postgres' || client === 'pg') {
      // PostgreSQL uses ALTER COLUMN TYPE
      await knex.raw('ALTER TABLE projects ALTER COLUMN latitude TYPE DECIMAL(10, 8)');
      await knex.raw('ALTER TABLE projects ALTER COLUMN longitude TYPE DECIMAL(10, 8)');
    } else if (client === 'sqlite3' || client === 'better-sqlite3') {
      // SQLite doesn't support ALTER COLUMN for changing precision
      // The precision is handled at the application level in SQLite
      // This migration will be a no-op for SQLite, but the schema change will work
      console.log('SQLite detected: Precision changes are handled at application level');
    } else {
      // Fallback to Knex schema builder
      await knex.schema.alterTable('projects', (table) => {
        table.decimal('latitude', 10, 8).alter();
      });
      await knex.schema.alterTable('projects', (table) => {
        table.decimal('longitude', 10, 8).alter();
      });
    }
  },

  async down(knex) {
    const client = knex.client.config.client;

    if (client === 'mysql' || client === 'mysql2') {
      // Revert to default precision (10, 2)
      await knex.raw('ALTER TABLE `projects` MODIFY COLUMN `latitude` DECIMAL(10, 2)');
      await knex.raw('ALTER TABLE `projects` MODIFY COLUMN `longitude` DECIMAL(10, 2)');
    } else if (client === 'postgres' || client === 'pg') {
      // Revert to default precision (10, 2)
      await knex.raw('ALTER TABLE projects ALTER COLUMN latitude TYPE DECIMAL(10, 2)');
      await knex.raw('ALTER TABLE projects ALTER COLUMN longitude TYPE DECIMAL(10, 2)');
    } else if (client === 'sqlite3' || client === 'better-sqlite3') {
      // SQLite doesn't support ALTER COLUMN for changing precision
      console.log('SQLite detected: Precision changes are handled at application level');
    } else {
      // Fallback to Knex schema builder
      await knex.schema.alterTable('projects', (table) => {
        table.decimal('latitude', 10, 2).alter();
      });
      await knex.schema.alterTable('projects', (table) => {
        table.decimal('longitude', 10, 2).alter();
      });
    }
  },
};
