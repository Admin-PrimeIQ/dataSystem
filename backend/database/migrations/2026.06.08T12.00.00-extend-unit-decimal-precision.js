'use strict';

const TABLE = 'units';

// attribute -> db column (lodash snakeCase, verified against information_schema in Task 1)
const COLUMN_TARGETS = [
  // Sizes (m²) -> (14,4)
  { column: 'front_m_2', precision: 14, scale: 4 },
  { column: 'depth_m_2', precision: 14, scale: 4 },
  { column: 'land_m_2', precision: 14, scale: 4 },
  { column: 'unit_size_m_2', precision: 14, scale: 4 },
  { column: 'parking_size_m_2', precision: 14, scale: 4 },
  { column: 'total_size_m_2', precision: 14, scale: 4 },
  { column: 'habitable_construction_m_2', precision: 14, scale: 4 },
  // Absorption -> (18,12)
  { column: 'unit_absorption', precision: 18, scale: 12 },
  { column: 'absorption_per_m_2', precision: 18, scale: 12 },
  // Money (USD) -> (15,2)
  { column: 'total_price_usd', precision: 15, scale: 2 },
  { column: 'price_without_vatusd', precision: 15, scale: 2 },
  { column: 'price_per_m_2_usd', precision: 15, scale: 2 },
  { column: 'rental_price_usd', precision: 15, scale: 2 },
  { column: 'rental_price_without_vatusd', precision: 15, scale: 2 },
  { column: 'rental_price_per_m_2_without_vatusd', precision: 15, scale: 2 },
  { column: 'maintenance_total_price_m_2_usd', precision: 15, scale: 2 },
  { column: 'maintenance_price_per_m_2_usd', precision: 15, scale: 2 },
  { column: 'installment_usd', precision: 15, scale: 2 },
  { column: 'income_usd', precision: 15, scale: 2 },
  // Bathrooms: integer -> decimal to allow half-baths (e.g. 2.5). TYPE change.
  // `revertToInteger` makes down() restore INT instead of DECIMAL(10,2).
  { column: 'bathrooms', precision: 4, scale: 1, revertToInteger: true },
];

// Revert target = Strapi/Knex default for `decimal`
const DEFAULT_PRECISION = 10;
const DEFAULT_SCALE = 2;

async function mysqlColumnExists(knex, column) {
  const [rows] = await knex.raw(
    'SELECT 1 AS ok FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = ? AND column_name = ? LIMIT 1',
    [TABLE, column]
  );
  const row = Array.isArray(rows) ? rows[0] : rows;
  return Boolean(row);
}

async function postgresColumnExists(knex, column) {
  const r = await knex.raw(
    'SELECT 1 AS ok FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = ? AND column_name = ? LIMIT 1',
    [TABLE, column]
  );
  const rows = r.rows ?? r;
  const row = Array.isArray(rows) ? rows[0] : rows;
  return Boolean(row);
}

// Abort if any existing value would overflow the new integer-digit capacity (no data loss allowed).
async function assertNoOverflow(knex, targets) {
  for (const { column, precision, scale } of targets) {
    const intDigits = precision - scale;
    if (intDigits >= 8) continue; // all decimal cols default to (10,2) = 8 int digits; >=8 means capacity grows/stays. (bathrooms is INT but intDigits=3<8 so it is still checked.)
    const limit = Math.pow(10, intDigits); // values must satisfy |v| < 10^intDigits
    const [rows] = await knex.raw(
      `SELECT MAX(ABS(\`${column}\`)) AS max_abs FROM \`${TABLE}\``
    );
    const row = Array.isArray(rows) ? rows[0] : rows;
    const maxAbs = row && row.max_abs != null ? Number(row.max_abs) : 0;
    if (maxAbs >= limit) {
      throw new Error(
        `[extend-unit-decimal-precision] ABORT: column "${column}" has value ${maxAbs} ` +
        `which exceeds DECIMAL(${precision},${scale}) capacity (max < ${limit}). ` +
        `Altering would lose data. Resolve before migrating.`
      );
    }
  }
}

module.exports = {
  async up(knex) {
    const client = knex.client.config.client;

    if (client === 'mysql' || client === 'mysql2') {
      // Safety: confirm no value would overflow the narrowed integer capacity (absorption).
      await assertNoOverflow(knex, COLUMN_TARGETS);

      const clauses = [];
      for (const t of COLUMN_TARGETS) {
        if (!(await mysqlColumnExists(knex, t.column))) {
          // eslint-disable-next-line no-console
          console.warn(`[extend-unit-decimal-precision] skip missing column: ${t.column}`);
          continue;
        }
        // All target unit columns are nullable with no default (verified in schema.json), so forcing NULL is safe.
        clauses.push(`MODIFY COLUMN \`${t.column}\` DECIMAL(${t.precision}, ${t.scale}) NULL`);
      }
      if (clauses.length) {
        // Single ALTER => single table rebuild.
        await knex.raw(`ALTER TABLE \`${TABLE}\` ${clauses.join(', ')}`);
      }
    } else if (client === 'postgres' || client === 'pg') {
      for (const t of COLUMN_TARGETS) {
        if (!(await postgresColumnExists(knex, t.column))) continue;
        await knex.raw(
          `ALTER TABLE "${TABLE}" ALTER COLUMN "${t.column}" TYPE DECIMAL(${t.precision}, ${t.scale})`
        );
      }
    } else if (client === 'sqlite3' || client === 'better-sqlite3') {
      // SQLite stores decimals as NUMERIC/REAL (no fixed scale); precision lives in schema.json.
      // eslint-disable-next-line no-console
      console.log('SQLite: skipping ALTER; unit decimal precision is defined in the content-type schema.');
    } else {
      for (const t of COLUMN_TARGETS) {
        const exists = await knex.schema.hasColumn(TABLE, t.column);
        if (!exists) continue;
        await knex.schema.alterTable(TABLE, (tbl) => {
          tbl.decimal(t.column, t.precision, t.scale).nullable().alter();
        });
      }
    }
  },

  async down(knex) {
    const client = knex.client.config.client;

    if (client === 'mysql' || client === 'mysql2') {
      const clauses = [];
      for (const t of COLUMN_TARGETS) {
        if (!(await mysqlColumnExists(knex, t.column))) continue;
        clauses.push(
          t.revertToInteger
            ? `MODIFY COLUMN \`${t.column}\` INT NULL` // NOTE: any stored .5 is lost on this rollback
            : `MODIFY COLUMN \`${t.column}\` DECIMAL(${DEFAULT_PRECISION}, ${DEFAULT_SCALE}) NULL`
        );
      }
      if (clauses.length) {
        await knex.raw(`ALTER TABLE \`${TABLE}\` ${clauses.join(', ')}`);
      }
    } else if (client === 'postgres' || client === 'pg') {
      for (const t of COLUMN_TARGETS) {
        if (!(await postgresColumnExists(knex, t.column))) continue;
        if (t.revertToInteger) {
          await knex.raw(
            `ALTER TABLE "${TABLE}" ALTER COLUMN "${t.column}" TYPE INTEGER USING ROUND("${t.column}")::integer`
          );
        } else {
          await knex.raw(
            `ALTER TABLE "${TABLE}" ALTER COLUMN "${t.column}" TYPE DECIMAL(${DEFAULT_PRECISION}, ${DEFAULT_SCALE})`
          );
        }
      }
    } else if (client === 'sqlite3' || client === 'better-sqlite3') {
      // eslint-disable-next-line no-console
      console.log('SQLite: skipping ALTER on down.');
    } else {
      for (const t of COLUMN_TARGETS) {
        const exists = await knex.schema.hasColumn(TABLE, t.column);
        if (!exists) continue;
        await knex.schema.alterTable(TABLE, (tbl) => {
          if (t.revertToInteger) {
            tbl.integer(t.column).nullable().alter();
          } else {
            tbl.decimal(t.column, DEFAULT_PRECISION, DEFAULT_SCALE).nullable().alter();
          }
        });
      }
    }
  },
};
