'use strict';

const knex = require('../knex.js');

function addDiscountCodeEvent(discountCodeId, eventId, timesUsedThisEvent, usesPerEvent) {
  return knex('discount_codes_events')
    .insert({
      discountCodeId,
      eventsId: eventId,
      timesUsedThisEvent,
      usesPerEvent
    }); // no logic here, calculate values in the controller
}

function getDiscountCode(discountCode) {
  return knex('discount_codes')
    .select('*')
    .where('discountCode', discountCode)
    .first();
}

function getDiscountCodeEvent(discountCodeId, eventId) {
  return knex('discount_codes_events')
    .select('*')
    .where('discountCodeId', discountCodeId)
    .andWhere('eventsId', eventId)
    .first();
}

function useDiscountCode(discountCode, remainingUses, timesUsed) {
  return knex('discount_codes')
    .select('*')
    .where('discountCode', discountCode)
    .update({remainingUses, timesUsed}); // no logic here, calculate values in the controller
}

// NOTE: - new context for EVENTS table - 
// for single-use (type 2) discount codes, events.`usesPerEvent` maps to the initial/starting/creation discount_codes.`remainingUses` value
// for reusable (type 1) discount codes events.`usesPerEvent` maps to discount_codes.`usesPerEvent`
function useDiscountCodeEvent(discountCodeId, eventId, timesUsedThisEvent, usesPerEvent) {
  return knex('discount_codes_events')
    .select('*')
    .where('discountCodeId', discountCodeId)
    .andWhere('eventsId', eventId)
    .update({timesUsedThisEvent, usesPerEvent}); // no logic here, calculate values in the controller
}

function releaseDiscountCode(discountCode, remainingUses, timesUsed) {
  return knex('discount_codes')
    .select('*')
    .where('discountCode', discountCode)
    .update({remainingUses, timesUsed}); // no logic here, calculate values in the controller
}

function releaseDiscountCodeEvent(discountCodeId, eventId, timesUsedThisEvent = 0) {
  return knex('discount_codes_events')
    .select('*')
    .where('discountCodeId', discountCodeId)
    .andWhere('eventsId', eventId)
    .update({timesUsedThisEvent}); // no logic here, calculate values in the controller
}

module.exports = {
  addDiscountCodeEvent,
  getDiscountCode,
  getDiscountCodeEvent,
  useDiscountCode,
  useDiscountCodeEvent,
  releaseDiscountCode,
  releaseDiscountCodeEvent,
};
