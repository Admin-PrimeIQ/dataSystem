'use strict';

/**
 * block-status service
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::block-status.block-status');

