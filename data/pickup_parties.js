'use strict';

const knex = require('../knex.js');

function getPickupParty({id}) {
  return knex.select('*')
    .select(
      knex.count('id')
        .from('reservations')
        .where('pickupPartiesId', id)
        .whereIn('status', [1, 2])
        .as('reservations')
    )
    .from('pickup_parties')
    .where({id})
    .first()
}

module.exports = {
  getPickupParty,
};
