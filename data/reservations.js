'use strict';

const knex = require('../knex.js');

function getAllReservations() {
  return knex('reservations')
    .select('*');
}

function getReservation(id) {
  return knex('reservations')
    .select('*')
    .where('id', id)
    .first();
}

function getReservationsByDiscountCodeId(discountCodeId) {
  return knex.raw(`
    select * from reservations r where r."discountCodeId" = ?;`
  , [discountCodeId]);
}

function getReservationsByDiscountByEventThroughPickupParties(discountCodeId, eventId) {
  return knex.raw(`
    SELECT * FROM reservations r
    INNER JOIN pickup_parties pp ON r."pickupPartiesId" = pp.id
    INNER JOIN events e ON pp."eventId" = e.id
    WHERE r."discountCodeId" = ?
    AND pp."eventId" = ?;
  `, [discountCodeId, eventId]);
}

function updateReservation({
  id,
  orderId,
  pickupPartiesId,
  willCallFirstName,
  willCallLastName,
  status,
  discountCodeId,
}) {
  return knex('reservations')
    .where({id})
    .update({
      orderId,
      pickupPartiesId,
      willCallFirstName,
      willCallLastName,
      status,
      discountCodeId,
    });
}

function updateReservations({
  orderId,
  willCallFirstName,
  willCallLastName,
}) {
  return knex('reservations')
    .where({orderId})
    .update({
      willCallFirstName,
      willCallLastName,
    });
}

module.exports = {
  getAllReservations,
  getReservation,
  getReservationsByDiscountCodeId,
  getReservationsByDiscountByEventThroughPickupParties,
  updateReservation,
  updateReservations,
};
