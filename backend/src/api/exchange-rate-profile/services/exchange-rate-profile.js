'use strict';

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService(
  'api::exchange-rate-profile.exchange-rate-profile'
);
