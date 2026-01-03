'use strict';

/**
 * unit-usage service
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::unit-usage.unit-usage');

