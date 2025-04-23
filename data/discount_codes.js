'use strict';

const knex = require('../knex.js');

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

// I was trying to think of a way to upsert the discount code event but
// it doesn't appear that knex supports upserts for Postgres...
function useDiscountCodeEvent(discountCodeId, eventId, timesUsedThisEvent) {
  return knex('discount_codes_events')
    .select('*')
    .where('discountCodeId', discountCodeId)
    .andWhere('eventsId', eventId)
    .increment({timesUsedThisEvent: timesUsedThisEvent});
}

function createDiscountCodeEvent(discountCodeId, eventId, timesUsedThisEvent) {
  return knex('discount_codes_events')
    .insert({
      discountCodeId,
      eventsId: eventId,
      timesUsedThisEvent: timesUsedThisEvent,
    });
}

function releaseDiscountCodeEvent(discountCode, eventId) {
  return knex('discount_codes_events')
    .where(() => {
      this.where('discountCodeId', () => {
        this.select('id').from('discount_codes').where('discountCode', discountCode);
      })
      .andWhere('eventsId', eventId);
    })
    .increment('timesUsedThisEvent', -1);
}

module.exports = {
  getDiscountCode,
  getDiscountCodeEvent,
  useDiscountCode,
  useDiscountCodeEvent,
  createDiscountCodeEvent,
  releaseDiscountCodeEvent,
};
