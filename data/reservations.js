'use strict';

const knex = require('../knex.js');

function getAllReservations() {
  return knex('reservations')
    .select('*');
}

function getReservationById(id) {
  return knex('reservations')
    .select('*')
    .where('id', id)
    .first();
}

function getReservationsByDiscountCodeId(discountCodeId) {
  return knex('reservations')
    .select('*')
    .where('discountCodeId', discountCodeId);
}

function getReservationsByDiscountByEventThroughPickupParties(discountCodeId, eventId) {
  /*  RAW QUERY:
  select * from reservations r
    inner join  pickup_parties pp ON r."pickupPartiesId" = pp.id
    inner JOIN events ON pp."eventId" = events.id
    where r."discountCodeId" = {discountCodeId}
    and pp."eventId" = {eventId};
  */
  // return knex('reservations')
  //   .select('*')
  //   .innerJoin('pickup_parties', 'reservations.pickupPartiesId', 'pickup_parties.id')
  //   .innerJoin('events', 'pickup_parties.eventId', 'event.id')
  //   .where('reservations.discountCodeId', discountCodeId)
  //   .andWhere('reservations.pickupPartiesId', 'pickup_parties.id')
  //   .andWhere('pickup_parties.eventId', eventId);
  return knex.raw(`
    SELECT * FROM reservations r
    INNER JOIN pickup_parties pp ON r."pickupPartiesId" = pp.id
    INNER JOIN events e ON pp."eventId" = e.id
    WHERE r."discountCodeId" = ?
    AND pp."eventId" = ?;
  `, [discountCodeId, eventId]);
}

module.exports = {
  getAllReservations,
  getReservationById,
  getReservationsByDiscountCodeId,
  getReservationsByDiscountByEventThroughPickupParties
}