'use strict';

/**
 * `blocks.domain` y `blocks.parking_for_sale`.
 *
 * DOMAIN es identidad de origen: dice de qué universo del warehouse salió el
 * bloque, y es lo que decide qué tablas lee y escribe el sync. Hasta hoy no
 * existía porque sólo había un dominio migrado, y eso dejaba tres agujeros:
 *
 *   - el pull busca su bloque por `legacyId`, pero `cod_proyecto` sólo es único
 *     DENTRO de un dominio; con dos activos la consulta puede traer el ajeno
 *   - el push trae TODOS los bloques sin filtro, así que escribiría bloques de
 *     vivienda dentro de `office_universe`
 *   - nada en el admin dice de qué universo salió un bloque
 *
 * Los valores del enum son las llaves de `DOMAIN_REGISTRY` en el repo del
 * pipeline (`tablesForDomain(block.domain)`). No son etiquetas: si acá dijera
 * "Vivienda", el worker fallaría con «dominio desconocido».
 *
 * PARKING_FOR_SALE es `office_universe.parqueos_para_venta`, la única columna
 * de oficinas sin destino en Strapi. Sin ella el pull la perdería y el push la
 * borraría del warehouse en cada ciclo.
 *
 * ── Por qué la migración CREA las columnas en vez de esperar a Strapi ──
 *
 * `@strapi/database` corre las migraciones ANTES de sincronizar el esquema:
 *
 *     if (await db.migrations.shouldRun()) {
 *       await db.migrations.up();
 *       return this.syncSchema();
 *     }
 *
 * Así que en el primer arranque la columna todavía no existe. Y una migración
 * que se rinda ahí queda igual registrada en `strapi_migrations` —terminó sin
 * error— y NO vuelve a correr: el relleno no ocurriría nunca y los 1.361
 * bloques quedarían en null.
 *
 * Creándolas acá, `syncSchema()` las encuentra después con el tipo que un
 * `enumeration` produce (VARCHAR 255) y las deja como están.
 *
 * Es idempotente: sólo crea lo que falta y sólo rellena lo que está vacío.
 */
module.exports = {
  async up(knex) {
    const client = knex.client.config.client;
    const esMysql = client === 'mysql' || client === 'mysql2';
    const esPg = client === 'postgres' || client === 'pg';

    const tiene = async (columna) => {
      const has = await knex.schema.hasColumn('blocks', columna);
      return has;
    };

    if (!(await tiene('domain'))) {
      if (esMysql) {
        // En MySQL, ADD COLUMN con DEFAULT rellena las filas existentes en el
        // mismo ALTER. El UPDATE de abajo es redundante a propósito: cubre el
        // caso de que la columna ya existiera sin default.
        await knex.raw(
          "ALTER TABLE `blocks` ADD COLUMN `domain` VARCHAR(255) NULL DEFAULT 'housing'"
        );
      } else if (esPg) {
        await knex.raw("ALTER TABLE blocks ADD COLUMN domain VARCHAR(255) DEFAULT 'housing'");
      } else {
        await knex.schema.alterTable('blocks', (t) => {
          t.string('domain', 255).defaultTo('housing');
        });
      }
    }

    if (!(await tiene('parking_for_sale'))) {
      if (esMysql) {
        await knex.raw('ALTER TABLE `blocks` ADD COLUMN `parking_for_sale` INT NULL');
      } else if (esPg) {
        await knex.raw('ALTER TABLE blocks ADD COLUMN parking_for_sale INTEGER');
      } else {
        await knex.schema.alterTable('blocks', (t) => {
          t.integer('parking_for_sale');
        });
      }
    }

    // Todo bloque que existe hoy es de vivienda: era el único dominio migrado.
    const rellenados = await knex('blocks').whereNull('domain').update({ domain: 'housing' });
    if (rellenados > 0) {
      // eslint-disable-next-line no-console
      console.log(`[migration] blocks.domain = 'housing' en ${rellenados} filas`);
    }
  },

  async down(knex) {
    // Revertir sólo tiene sentido si el campo nunca se usó: con dos dominios
    // activos, borrar la columna deja bloques que nadie puede clasificar.
    if (await knex.schema.hasColumn('blocks', 'parking_for_sale')) {
      await knex.schema.alterTable('blocks', (t) => t.dropColumn('parking_for_sale'));
    }
    if (await knex.schema.hasColumn('blocks', 'domain')) {
      await knex.schema.alterTable('blocks', (t) => t.dropColumn('domain'));
    }
  },
};
