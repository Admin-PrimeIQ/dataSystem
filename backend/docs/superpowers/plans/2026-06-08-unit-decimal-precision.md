# Unit Decimal Precision Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Widen precision/scale of the 19 `decimal` columns on `api::unit.unit` so the database stops truncating sizes, prices and absorption values — non-destructively, losing no existing data.

**Architecture:** Follow the exact pattern this repo already used for `project.latitude`/`longitude` ([2026.01.12T10.21.56-update-project-coordinates-precision.js](../../../database/migrations/2026.01.12T10.21.56-update-project-coordinates-precision.js)): a **migration-only** solution. That precedent did NOT edit `schema.json` (lat/long are still plain `"type": "decimal"`); the precision came solely from a multi-dialect Knex migration that picks its SQL branch from `knex.client.config.client` at runtime. We do the same here. Editing `schema.json` is **optional** (Task 2) and only affects fresh-DB column creation — it is not how the precedent solved it and is not required, because migrations run on every Strapi boot.

**Tech Stack:** Strapi 5.30.0, `@strapi/database` (Knex). Runtime engine in this checkout is **MySQL** (`.env` → `DATABASE_CLIENT="mysql"`, `mysql2` installed, `pg` NOT installed). Migration is written multi-dialect (mysql / postgres / sqlite / fallback) so it also runs correctly if production uses Postgres — exactly like the lat/long precedent.

---

## ⚠️ Critical corrections to the original request (read before implementing)

1. **Follow the lat/long precedent: migration-only.** The repo already solved this exact problem for `project.latitude/longitude` with a migration and **no schema.json change**. We mirror that. The migration is multi-dialect and selects its branch at runtime via `knex.client.config.client`.

2. **Runtime engine here is MySQL — confirm prod.** `.env` → `DATABASE_CLIENT="mysql"` at `strapi.cfkkoyk00gnr.us-east-2.rds.amazonaws.com`; `mysql2` is installed and **`pg` is NOT installed** (so this checkout cannot connect to Postgres as-is). Existing columns are therefore `DECIMAL(10,2)` (Knex/Strapi default — see [schema.js:192-198](../../../node_modules/@strapi/database/dist/schema/schema.js)). **If production actually runs Postgres via a different env/driver**, the migration's `pg` branch (`ALTER COLUMN … TYPE`) runs automatically — no change needed. Open question to the requester: is prod Postgres or MySQL?

3. **A migration is mandatory; the optional schema.json edit never auto-ALTERs.** `diff.js` has the comment `// NOTE: compare args at some point` ([diff.js:125](../../../node_modules/@strapi/database/dist/schema/diff.js)) — Strapi does not compare column `args`, so editing `schema.json` will **never** alter an existing column (Task 2 is purely fresh-DB cosmetics and is safe / no-op on the live DB). If you do the optional schema edit, use the `column` override (`"column": { "type": "decimal", "args": [p, s] }`) — Strapi honors that ([schema.js:19-30](../../../node_modules/@strapi/database/dist/schema/schema.js)) — not bare `precision`/`scale` keys, which `getColumnType` ignores.

4. **Column names are confirmed, not guessed.** Strapi derives column names with `identifiers.getColumnName(_.snakeCase(attributeName))` ([metadata.js:93](../../../node_modules/@strapi/database/dist/metadata/metadata.js)). Run through lodash `snakeCase`, the names are e.g. `front_m_2`, `price_per_m_2_usd`, `rental_price_without_vatusd`. The `m2`/`USD` casing produces non-obvious names — these are the authoritative values used in the migration. The longest (`rental_price_per_m_2_without_vatusd`, 35 chars) is under MySQL's 64-char limit, so no shortening applies. **Task 1 still verifies them against `information_schema` before any ALTER runs — belt and suspenders.**

5. **One genuine data-risk: the absorption columns shrink integer capacity.** Current `DECIMAL(10,2)` allows 8 integer digits (max `99,999,999.99`). Target `DECIMAL(18,12)` allows only **6** integer digits (max `999,999.999999999999`). If any existing `unit_absorption` / `absorption_per_m_2` value is `>= 1,000,000`, MySQL would error (strict mode) or clamp — i.e. **lose a value**. Absorption is a rate/fraction so this is unlikely, but **the migration includes a hard pre-check that aborts** if any value would overflow, satisfying "no debemos perder ningún valor". Sizes `(14,4)` → 10 integer digits and money `(15,2)` → 13 integer digits both *grow* capacity vs the current 8, so they are unconditionally safe.

6. **Table rebuild / locking.** Changing decimal precision in MySQL is not an `INSTANT` operation; InnoDB rebuilds the table (`ALGORITHM=COPY` or `INPLACE` with a metadata lock). On a large `units` table this can take time and briefly block writes. All 19 changes are batched into **one** `ALTER TABLE` to trigger a single rebuild. Run during low traffic.

7. **`bathrooms`: integer → `DECIMAL(4,1)` (TYPE change — special rules).** To allow half-baths (e.g. `2.5`). Unlike the 19 precision fields, this is a **type** change, which Strapi *does* diff ([diff.js:123](../../../node_modules/@strapi/database/dist/schema/diff.js)). Therefore the `schema.json` edit for `bathrooms` is **MANDATORY** (Task 2b): if the DB became decimal but `schema.json` still said `integer`, Strapi would revert the column to integer on the next boot and truncate the `.5`. `int → decimal` conversion is lossless; the rollback (`decimal → int`) is NOT (a stored `2.5` rounds/truncates) — acceptable for an emergency-only `down()`. `parkingSpaces` stays `integer`, unchanged.

### Final precision map

| Group | Columns (attribute → db column) | Target |
|---|---|---|
| Sizes (m²) | `frontM2`→`front_m_2`, `depthM2`→`depth_m_2`, `landM2`→`land_m_2`, `unitSizeM2`→`unit_size_m_2`, `parkingSizeM2`→`parking_size_m_2`, `totalSizeM2`→`total_size_m_2`, `habitableConstructionM2`→`habitable_construction_m_2` | `DECIMAL(14,4)` |
| Absorption | `unitAbsorption`→`unit_absorption`, `absorptionPerM2`→`absorption_per_m_2` | `DECIMAL(18,12)` |
| Money (USD) | `totalPriceUSD`→`total_price_usd`, `priceWithoutVATUSD`→`price_without_vatusd`, `pricePerM2USD`→`price_per_m_2_usd`, `rentalPriceUSD`→`rental_price_usd`, `rentalPriceWithoutVATUSD`→`rental_price_without_vatusd`, `rentalPricePerM2WithoutVATUSD`→`rental_price_per_m_2_without_vatusd`, `maintenanceTotalPriceM2USD`→`maintenance_total_price_m_2_usd`, `maintenancePricePerM2USD`→`maintenance_price_per_m_2_usd`, `installmentUSD`→`installment_usd`, `incomeUSD`→`income_usd` | `DECIMAL(15,2)` |
| Bathrooms (TYPE change) | `bathrooms`→`bathrooms` (`integer` → `decimal`) | `DECIMAL(4,1)` |

---

## File Structure

- **Create (the core change):** `database/migrations/2026.06.08T12.00.00-extend-unit-decimal-precision.js` — the ALTER + rollback, following the lat/long precedent and `database/migrations/2026.04.05T12.00.00-extend-currency-rate-decimal-precision.js`.
- **Create (verification helper):** `scripts/verify-unit-precision.sql` — before/after introspection. Run via the DB client.
- **Modify (MANDATORY for `bathrooms` only):** `src/api/unit/content-types/unit/schema.json` — change `bathrooms` from `integer` to `decimal` (+ `column` override `[4,1]`). Required because Strapi diffs `type` and would otherwise revert the column to integer on boot (Task 2b).
- **(Optional) Modify:** the 19 decimal attributes in the same `schema.json` with a `column` override. NOT done in the lat/long precedent; only affects fresh-DB column creation. Skip to match the established pattern, or include for fresh-DB correctness. No-op on the existing DB either way (Task 2a).

---

## Task 0: Create the feature branch

**Files:** none (git only)

- [ ] **Step 1: Confirm clean baseline & stash unrelated docs change**

The working tree has an unrelated `M src/extensions/.../full_documentation.json` (auto-regenerated OpenAPI). Keep it out of this feature's commits.

Run:
```bash
git status -sb
git stash push -m "wip: regenerated documentation" -- src/extensions/documentation/documentation/1.0.2/full_documentation.json
```
Expected: working tree clean except for files we create.

- [ ] **Step 2: Branch from develop**

Run:
```bash
git checkout develop
git pull --ff-only origin develop
git checkout -b feature/unit-decimal-precision
```
Expected: `Switched to a new branch 'feature/unit-decimal-precision'`.

---

## Task 1: Capture the current DB state (the "failing test")

**Files:**
- Create: `scripts/verify-unit-precision.sql`

This is the baseline assertion: before the change, all 19 columns must read `numeric_precision=10, numeric_scale=2`. We also pre-check absorption for overflow risk so we *know* the migration is safe before running it.

- [ ] **Step 1: Write the introspection query**

Create `scripts/verify-unit-precision.sql`:
```sql
-- Current precision/scale of unit decimal columns (expect 10,2 before migration)
SELECT column_name, data_type, numeric_precision, numeric_scale, is_nullable
FROM information_schema.columns
WHERE table_schema = DATABASE()
  AND table_name = 'units'
  AND column_name IN (
    'front_m_2','depth_m_2','land_m_2','unit_size_m_2','parking_size_m_2',
    'total_size_m_2','habitable_construction_m_2',
    'unit_absorption','absorption_per_m_2',
    'total_price_usd','price_without_vatusd','price_per_m_2_usd',
    'rental_price_usd','rental_price_without_vatusd','rental_price_per_m_2_without_vatusd',
    'maintenance_total_price_m_2_usd','maintenance_price_per_m_2_usd',
    'installment_usd','income_usd',
    'bathrooms'
  )
ORDER BY column_name;

-- Overflow pre-check: absorption target (18,12) allows only 6 integer digits.
-- Both values MUST be 0 rows / max < 1,000,000 for the migration to be lossless.
SELECT
  MAX(ABS(unit_absorption))    AS max_unit_absorption,
  MAX(ABS(absorption_per_m_2)) AS max_absorption_per_m_2
FROM units;
```

- [ ] **Step 2: Run it against the target DB**

Use the same credentials Strapi uses (from `.env`). Example with the mysql client:
```bash
mysql -h "$DATABASE_HOST" -u "$DATABASE_USERNAME" -p"$DATABASE_PASSWORD" "$DATABASE_NAME" < scripts/verify-unit-precision.sql
```
Expected:
- First result set: 20 rows. The 19 decimal columns read `numeric_precision = 10`, `numeric_scale = 2`. `bathrooms` reads `data_type = int`, `numeric_scale = 0` (it is still an integer pre-migration). **If any column name is missing from the result, STOP** — the snake_case name differs from expectation; reconcile before proceeding.
- Second result set: `max_unit_absorption` and `max_absorption_per_m_2` both `NULL` or `< 1000000`. **If either is `>= 1000000`, STOP and escalate** — altering to `(18,12)` would lose data; revisit the absorption scale with the requester.

- [ ] **Step 3: Commit the verification script**

```bash
git add scripts/verify-unit-precision.sql
git commit -m "chore(unit): add decimal precision verification query"
```

---

## Task 2a (OPTIONAL — skip to match the lat/long precedent): Add `column` overrides to the 19 decimal attributes

> The lat/long precedent did **not** do this; the migration alone is sufficient. Include this task only if you want fresh databases (new dev clones, CI) to create the columns at full precision before the migration runs. It is a no-op on the existing DB (Strapi never diffs `args`). If you skip it, go straight to Task 2b. **Task 2b below is NOT optional.**

**Files:**
- Modify: `src/api/unit/content-types/unit/schema.json`

Add a `column` override to each of the 19 decimal attributes.

- [ ] **Step 1: Edit the size attributes (×7) → `[14, 4]`**

For each of `frontM2`, `depthM2`, `landM2`, `unitSizeM2`, `parkingSizeM2`, `totalSizeM2`, `habitableConstructionM2`, change the attribute from:
```json
"frontM2": {
  "type": "decimal"
}
```
to (example for `frontM2`; repeat the identical `column` block for the other six, preserving each one's existing extra keys such as `parkingSizeM2`'s `conditions`):
```json
"frontM2": {
  "type": "decimal",
  "column": { "type": "decimal", "args": [14, 4] }
}
```
Note: `parkingSizeM2` already has a `conditions` block — keep it and add the `column` key alongside:
```json
"parkingSizeM2": {
  "type": "decimal",
  "conditions": {
    "visible": { "==": [ { "var": "hasParking" }, true ] }
  },
  "column": { "type": "decimal", "args": [14, 4] }
}
```

- [ ] **Step 2: Edit the absorption attributes (×2) → `[18, 12]`**

```json
"unitAbsorption": {
  "type": "decimal",
  "column": { "type": "decimal", "args": [18, 12] }
},
"absorptionPerM2": {
  "type": "decimal",
  "column": { "type": "decimal", "args": [18, 12] }
}
```

- [ ] **Step 3: Edit the money attributes (×10) → `[15, 2]`**

For each of `totalPriceUSD`, `priceWithoutVATUSD`, `pricePerM2USD`, `rentalPriceUSD`, `rentalPriceWithoutVATUSD`, `rentalPricePerM2WithoutVATUSD`, `maintenanceTotalPriceM2USD`, `maintenancePricePerM2USD`, `installmentUSD`, `incomeUSD`:
```json
"totalPriceUSD": {
  "type": "decimal",
  "column": { "type": "decimal", "args": [15, 2] }
}
```

- [ ] **Step 4: Validate the JSON is well-formed**

Run:
```bash
node -e "JSON.parse(require('fs').readFileSync('src/api/unit/content-types/unit/schema.json','utf8')); console.log('schema.json OK')"
```
Expected: `schema.json OK`

- [ ] **Step 5: Commit**

```bash
git add src/api/unit/content-types/unit/schema.json
git commit -m "feat(unit): declare decimal precision via column override (sizes 14,4; absorption 18,12; money 15,2)"
```

---

## Task 2b (MANDATORY): Change `bathrooms` to decimal in the schema

**Files:**
- Modify: `src/api/unit/content-types/unit/schema.json`

This is required (not optional): Strapi diffs `type`, so the schema must declare `decimal` or Strapi will revert the column to `integer` on boot and lose the `.5`.

- [ ] **Step 1: Edit the `bathrooms` attribute**

Change from:
```json
"bathrooms": {
  "type": "integer"
}
```
to:
```json
"bathrooms": {
  "type": "decimal",
  "column": { "type": "decimal", "args": [4, 1] }
}
```

- [ ] **Step 2: Validate the JSON**

Run:
```bash
node -e "JSON.parse(require('fs').readFileSync('src/api/unit/content-types/unit/schema.json','utf8')); console.log('schema.json OK')"
```
Expected: `schema.json OK`

- [ ] **Step 3: Commit**

```bash
git add src/api/unit/content-types/unit/schema.json
git commit -m "feat(unit): allow half-baths — bathrooms integer -> decimal(4,1)"
```

---

## Task 3: Write the migration

**Files:**
- Create: `database/migrations/2026.06.08T12.00.00-extend-unit-decimal-precision.js`

Follows the exact dialect-switch pattern of `database/migrations/2026.04.05T12.00.00-extend-currency-rate-decimal-precision.js`, adds a column-existence guard and an absorption overflow guard, and batches all changes into one `ALTER TABLE`.

- [ ] **Step 1: Create the migration file**

```js
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
    if (intDigits >= 8) continue; // current is (10,2) => 8 int digits; >=8 means capacity grows or stays
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
```

> ⚠️ **down() caveat:** rolling back narrows money/size columns from up to 13/10 integer digits back to 8. If, after the migration, new rows store values that need >8 integer digits, `down()` would itself risk loss. This is the standard trade-off of any widening rollback; it matches the precedent migrations. Acceptable because rollback is an emergency-only path.

- [ ] **Step 2: Lint/parse the migration file**

Run:
```bash
node -e "require('./database/migrations/2026.06.08T12.00.00-extend-unit-decimal-precision.js'); console.log('migration loads OK')"
```
Expected: `migration loads OK`

- [ ] **Step 3: Commit**

```bash
git add database/migrations/2026.06.08T12.00.00-extend-unit-decimal-precision.js
git commit -m "feat(unit): migration to widen decimal precision (sizes 14,4; absorption 18,12; money 15,2)"
```

---

## Task 4: Apply & verify on a non-production DB first

**Files:** none (run the app)

Do NOT point first runs at production RDS. Use a local copy (sqlite for app-boot smoke test is meaningless for ALTER; ideally a MySQL dump restored locally, or a staging RDS).

- [ ] **Step 1: Boot Strapi so the migration runs**

Run (against staging/local MySQL):
```bash
npm run develop
```
Expected: startup logs show the migration name being applied with no error; if absorption overflow is detected the boot fails loudly with the ABORT message (by design — investigate the data, do not bypass).

- [ ] **Step 2: Verify new precision via information_schema**

Run `scripts/verify-unit-precision.sql` again (Task 1, Step 2).
Expected first result set:
- Sizes columns → `numeric_precision = 14`, `numeric_scale = 4`
- Absorption columns → `numeric_precision = 18`, `numeric_scale = 12`
- Money columns → `numeric_precision = 15`, `numeric_scale = 2`
- `bathrooms` → `data_type = decimal`, `numeric_precision = 4`, `numeric_scale = 1`

- [ ] **Step 3: Round-trip precision test (the real assertion)**

Create one unit with a high-precision absorption and a long size via the API/Document Service, then read it back. Example using the Strapi console:
```bash
npm run console
```
```js
const u = await strapi.documents('api::unit.unit').create({
  data: { name: 'precision-test', unitAbsorption: 0.123456789012, unitSizeM2: 1234.5678, bathrooms: 2.5 },
});
const r = await strapi.documents('api::unit.unit').findOne({ documentId: u.documentId, fields: ['unitAbsorption','unitSizeM2','bathrooms'] });
console.log(r.unitAbsorption, r.unitSizeM2, r.bathrooms); // expect 0.123456789012, 1234.5678, 2.5 (not truncated)
await strapi.documents('api::unit.unit').delete({ documentId: u.documentId }); // cleanup
```
Expected: values print back **without truncation** (pre-migration they would have been `0.12`, `1234.57`, and `bathrooms` would have rejected/floored `2.5`).

- [ ] **Step 4: Verify rollback works (on staging only)**

Run:
```bash
# Strapi has no built-in `migrate:down`; test rollback by invoking the migration's down()
# via the console, or by restoring from the pre-migration snapshot.
```
In `npm run console`:
```js
const mig = require('./database/migrations/2026.06.08T12.00.00-extend-unit-decimal-precision.js');
await mig.down(strapi.db.connection);
```
Then re-run `verify-unit-precision.sql` → expect all columns back to `(10,2)`. Then re-apply with `mig.up(...)` to leave staging in the widened state.

---

## Task 5: Apply to production (RDS)

**Files:** none (ops)

- [ ] **Step 1: Snapshot RDS before deploying**

Take an RDS snapshot (or `mysqldump` of `units`) so rollback is guaranteed regardless of the migration's `down()`. This is the real "no data loss" guarantee.

- [ ] **Step 2: Run the overflow pre-check against production data**

Run the second query of `scripts/verify-unit-precision.sql` against prod. Confirm both absorption maxima `< 1,000,000`. If not, STOP and consult the requester about the `(18,12)` scale.

- [ ] **Step 3: Deploy during a low-traffic window**

Deploy the branch; Strapi applies the migration on boot. Expect a one-time `ALTER TABLE units` rebuild (single statement, single rebuild). Monitor for lock/timeout on large tables.

- [ ] **Step 4: Post-deploy verification**

Re-run `scripts/verify-unit-precision.sql` against prod → confirm the 14/4, 18/12, 15/2 targets. Spot-check a freshly recalculated unit from the front end keeps full precision.

---

## Task 6: Merge

- [ ] **Step 1: Open PR into develop**

```bash
git push -u origin feature/unit-decimal-precision
gh pr create --base develop --title "Widen unit decimal precision (sizes/absorption/money)" --body "See docs/superpowers/plans/2026-06-08-unit-decimal-precision.md"
```

- [ ] **Step 2: Restore the stashed docs change (if still desired)**

```bash
git checkout develop
git stash pop
```

---

## Self-Review

- **Spec coverage:** All 19 decimal columns mapped to their group target (7×`14,4`, 2×`18,12`, 10×`15,2`); `bathrooms` integer→`decimal(4,1)` (type change, schema edit mandatory); `parkingSpaces` unchanged. ✔
- **Matches established pattern:** migration-only, multi-dialect, like the lat/long precedent. Optional `column` override validated against Strapi source (honored) if used. ✔
- **Migration + rollback:** present, multi-dialect, matches precedent. ✔
- **Verification via information_schema:** Tasks 1 & 4. ✔
- **No-data-loss:** snapshot (Task 5.1) + overflow pre-check (migration + Task 1/5.2) + widening-only for sizes/money. ✔
- **Engine/version risks:** MySQL syntax, table-rebuild locking, absorption integer-capacity shrink, rollback narrowing — all flagged. ✔
- **Open question for requester:** confirm absorption can be capped at 6 integer digits (`max < 1,000,000`). If real data can exceed that, bump precision (e.g. `(20,12)` → 8 int digits) before implementing.
