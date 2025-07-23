'use strict';

const knex = require('../knex.js');

function getOrder({id}) {
  return knex('orders')
    .select('*')
    .where({id})
    .first();
}

module.exports = {
  getOrder,
};
