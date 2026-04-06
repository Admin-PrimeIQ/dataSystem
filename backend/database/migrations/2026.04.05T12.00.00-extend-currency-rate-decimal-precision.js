'use strict';

const CURRENCY_COMPONENT_TABLES = [
  'components_currencies_currency_quetzals',
  'components_currencies_currency_peso_mexicanos',
  'components_currencies_currency_lempiras',
  'components_currencies_currency_cordobas',
  'components_currencies_currency_colon_costarricenses',
  'components_currencies_currency_balboas',
  'components_currencies_currency_belizes',
];

async function mysqlTableExists(knex, table) {
  const [rows] = await knex.raw(
    'SELECT 1 AS ok FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = ? LIMIT 1',
    [table]
  );
  const row = Array.isArray(rows) ? rows[0] : rows;
  return Boolean(row);
}

async function postgresTableExists(knex, table) {
  const r = await knex.raw(
    'SELECT 1 AS ok FROM information_schema.tables WHERE table_schema = current_schema() AND table_name = ? LIMIT 1',
    [table]
  );
  const rows = r.rows ?? r;
  const row = Array.isArray(rows) ? rows[0] : rows;
  return Boolean(row);
}

module.exports = {
  async up(knex) {
    const client = knex.client.config.client;

    if (client === 'mysql' || client === 'mysql2') {
      for (const table of CURRENCY_COMPONENT_TABLES) {
        if (!(await mysqlTableExists(knex, table))) continue;
        await knex.raw(
          `ALTER TABLE \`${table}\` MODIFY COLUMN \`buy_rate\` DECIMAL(18, 8) NULL, MODIFY COLUMN \`sell_rate\` DECIMAL(18, 8) NULL`
        );
      }
    } else if (client === 'postgres' || client === 'pg') {
      for (const table of CURRENCY_COMPONENT_TABLES) {
        if (!(await postgresTableExists(knex, table))) continue;
        await knex.raw(
          `ALTER TABLE "${table}" ALTER COLUMN buy_rate TYPE DECIMAL(18,8)`
        );
        await knex.raw(
          `ALTER TABLE "${table}" ALTER COLUMN sell_rate TYPE DECIMAL(18,8)`
        );
      }
    } else if (client === 'sqlite3' || client === 'better-sqlite3') {
      // eslint-disable-next-line no-console
      console.log(
        'SQLite: skipping ALTER; currency rate precision is defined in component schemas.'
      );
    } else {
      for (const table of CURRENCY_COMPONENT_TABLES) {
        const exists = await knex.schema.hasTable(table);
        if (!exists) continue;
        await knex.schema.alterTable(table, (t) => {
          t.decimal('buy_rate', 18, 8).nullable().alter();
          t.decimal('sell_rate', 18, 8).nullable().alter();
        });
      }
    }
  },

  async down(knex) {
    const client = knex.client.config.client;

    if (client === 'mysql' || client === 'mysql2') {
      for (const table of CURRENCY_COMPONENT_TABLES) {
        if (!(await mysqlTableExists(knex, table))) continue;
        await knex.raw(
          `ALTER TABLE \`${table}\` MODIFY COLUMN \`buy_rate\` DECIMAL(10, 2) NULL, MODIFY COLUMN \`sell_rate\` DECIMAL(10, 2) NULL`
        );
      }
    } else if (client === 'postgres' || client === 'pg') {
      for (const table of CURRENCY_COMPONENT_TABLES) {
        if (!(await postgresTableExists(knex, table))) continue;
        await knex.raw(
          `ALTER TABLE "${table}" ALTER COLUMN buy_rate TYPE DECIMAL(10,2)`
        );
        await knex.raw(
          `ALTER TABLE "${table}" ALTER COLUMN sell_rate TYPE DECIMAL(10,2)`
        );
      }
    } else if (client === 'sqlite3' || client === 'better-sqlite3') {
      // eslint-disable-next-line no-console
      console.log('SQLite: skipping ALTER on down.');
    } else {
      for (const table of CURRENCY_COMPONENT_TABLES) {
        const exists = await knex.schema.hasTable(table);
        if (!exists) continue;
        await knex.schema.alterTable(table, (t) => {
          t.decimal('buy_rate', 10, 2).nullable().alter();
          t.decimal('sell_rate', 10, 2).nullable().alter();
        });
      }
    }
  },
};
