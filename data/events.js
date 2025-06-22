'use strict';

const knex = require('../knex.js');

function getAllEvents() {
  return knex('events')
    .select('*');
}

function getEventById(id) {
  return knex('events')
    .select('*')
    .where('id', id)
    .first();
}

module.exports = {
  getAllEvents,
  getEventById,
}
