'use strict';

module.exports = {
  /**
   * An asynchronous register function that runs before
   * your application is initialized.
   *
   * This gives you an opportunity to extend code.
   */
  register(/*{ strapi }*/) {},

  /**
   * An asynchronous bootstrap function that runs before
   * your application gets started.
   *
   * This gives you an opportunity to set up your data model,
   * run jobs, or perform some special logic.
   */
  async bootstrap({ strapi }) {
    // Permitir que el Content Manager pueda leer roles (evita 403 al seleccionar rol en el combo de usuarios)
    const roleCt = strapi.contentType('plugin::users-permissions.role');
    if (roleCt?.pluginOptions) {
      roleCt.pluginOptions['content-manager'] = { ...roleCt.pluginOptions['content-manager'], visible: true };
    }

    const ROLES = [
      { type: 'operador', name: 'Operator', description: 'Operator. Basic system usage permissions.' },
      { type: 'supervisor', name: 'Supervisor', description: 'Supervisor. Manages and supervises operators.' },
      { type: 'administrador', name: 'Administrator', description: 'Administrator. Broad configuration and management.' },
      { type: 'super_administrador', name: 'Super Administrator', description: 'Super Administrator. Full access to the system.' },
    ];

    for (const role of ROLES) {
      const existing = await strapi.documents('plugin::users-permissions.role').findFirst({
        filters: { type: role.type },
      });
      if (!existing) {
        await strapi.documents('plugin::users-permissions.role').create({
          data: {
            name: role.name,
            description: role.description,
            type: role.type,
          },
        });
        strapi.log.info(`[bootstrap] Rol creado: ${role.name}`);
      }
    }
  },
};
