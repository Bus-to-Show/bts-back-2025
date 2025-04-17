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

function useDiscountCodeEvent(discountCodeId, eventId, timesUsedThisEvent) {
  return knex('discount_codes_events')
    .select('*')
    .where('discountCodeId', discountCodeId)
    .andWhere('eventsId', eventId)
    .update({timesUsedThisEvent});
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
  releaseDiscountCodeEvent,
};
