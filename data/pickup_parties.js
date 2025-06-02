'use strict';

const knex = require('../knex.js');

function getPickupParty(id) {
  return knex.raw(`
    SELECT *
    FROM pickup_parties,
    (
      SELECT COUNT(id) AS reservations
      FROM reservations
      WHERE "pickupPartiesId" = ?
      AND status IN (1, 2)
    )
    WHERE id = ?
    LIMIT 1
  `, id);
}

module.exports = {
  getPickupParty,
};
