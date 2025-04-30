'use strict';

const knex = require('../knex.js');

function addDiscountCodeEvent(discountCodeId, eventId, timesUsedThisEvent, usesPerEvent) {
  return knex('discount_codes_events')
    .insert({
      discountCodeId,
      eventsId: eventId,
      timesUsedThisEvent,
      usesPerEvent
    });
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
    .update({remainingUses, timesUsed});
}

function useDiscountCodeEvent(discountCodeId, eventId, timesUsedThisEvent, usesPerEvent) {
  return knex('discount_codes_events')
    .select('*')
    .where('discountCodeId', discountCodeId)
    .andWhere('eventsId', eventId)
    .increment({timesUsedThisEvent, usesPerEvent});
}

function releaseDiscountCode(discountCode, remainingUses, timesUsed) {
  return knex('discount_codes')
    .select('*')
    .where('discountCode', discountCode)
    .update({remainingUses, timesUsed});
}

function releaseDiscountCodeEvent(discountCodeId, eventId) {
  return knex('discount_codes_events')
    .select('*')
    .where('discountCodeId', discountCodeId)
    .andWhere('eventsId', eventId)
    .update({timesUsedThisEvent: 0});
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
