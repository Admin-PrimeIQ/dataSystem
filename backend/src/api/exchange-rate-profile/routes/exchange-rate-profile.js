'use strict';

const { createCoreRouter } = require('@strapi/strapi').factories;

module.exports = createCoreRouter(
  'api::exchange-rate-profile.exchange-rate-profile'
);
