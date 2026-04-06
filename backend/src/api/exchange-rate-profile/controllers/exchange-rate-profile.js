'use strict';

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController(
  'api::exchange-rate-profile.exchange-rate-profile'
);
