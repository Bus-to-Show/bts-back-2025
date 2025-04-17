'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const DiscountCodesController = require('./DiscountCodesController.js');

function makeRelativeDate(addYears) {
  const date = new Date();
  date.setFullYear(date.getFullYear() + addYears);
  return date;
}

test('invalid request', async () => {
  const controller = new DiscountCodesController({});

  const result = await controller.applyDiscountCode({
    discountCode: '1FREE',
    totalPrice: 66,
    ticketQuantity: 2,
  });

  assert.equal(result.status, 400);
  assert.equal(result.message, 'Invalid request');
});

test('discount code not found', async () => {
  const data = {
    getDiscountCode: () => undefined,
  };

  const controller = new DiscountCodesController({data});

  const result = await controller.applyDiscountCode({
    discountCode: '1FREE',
    totalPrice: 66,
    ticketQuantity: 2,
    eventId: 1,
  });

  assert.equal(result.status, 400);
  assert.equal(result.message, 'Discount code not found');
});

test('discount code expired', async () => {
  const discountCode = {
    expiresOn: makeRelativeDate(-1),
    type: 1,
    id: 1,
  };

  const data = {
    getDiscountCode: () => discountCode,
  };

  const controller = new DiscountCodesController({data});

  const result = await controller.applyDiscountCode({
    discountCode: '1FREE',
    totalPrice: 66,
    ticketQuantity: 2,
    eventId: 1,
  });

  assert.equal(result.status, 200);
  assert.equal(result.message, 'Discount code expired');
});

test('type = 1, discount code event not found', async () => {
  const discountCode = {
    expiresOn: makeRelativeDate(1),
    type: 1,
    id: 1,
  };

  const data = {
    getDiscountCode: () => discountCode,
    getDiscountCodeEvent: () => undefined,
  };

  const controller = new DiscountCodesController({data});

  const result = await controller.applyDiscountCode({
    discountCode: '1FREE',
    totalPrice: 66,
    ticketQuantity: 2,
    eventId: 1,
  });

  assert.equal(result.status, 400);
  assert.equal(result.message, 'Discount code not found for this event');
});

test('type = 1, discount code used', async () => {
  const discountCode = {
    expiresOn: makeRelativeDate(1),
    type: 1,
    id: 1,
  };

  const discountCodeEvent = {
    timesUsedThisEvent: 1,
  };

  const data = {
    getDiscountCode: () => discountCode,
    getDiscountCodeEvent: () => discountCodeEvent,
  };

  const controller = new DiscountCodesController({data});

  const result = await controller.applyDiscountCode({
    discountCode: '1FREE',
    totalPrice: 66,
    ticketQuantity: 2,
    eventId: 1,
  });

  assert.equal(result.status, 200);
  assert.equal(result.message, 'Discount code has already been used for this event');
});

test('type = 1, discount code unused', async () => {
  const discountCode = {
    expiresOn: makeRelativeDate(1),
    type: 1,
    id: 1,
  };

  const data = {
    getDiscountCode: () => discountCode,
    getDiscountCodeEvent: () => new Object(),
    useDiscountCodeEvent: () => new Object(),
  };

  const controller = new DiscountCodesController({data});

  const result = await controller.applyDiscountCode({
    discountCode: '1FREE',
    totalPrice: 66,
    ticketQuantity: 2,
    eventId: 1,
  });

  assert.equal(result.status, 200);
  assert.equal(result.discountCodeId, 1);
  assert.equal(result.totalSavings, '33.00');
  assert.equal(result.totalPriceAfterDiscount, '33.00');
});

test('type != 1, discount code used', async () => {
  const discountCode = {
    expiresOn: makeRelativeDate(1),
    type: 2,
    remainingUses: 0,
    timesUsed: 2,
    percentage: 20,
    id: 1,
  };

  const data = {
    getDiscountCode: () => discountCode,
  };

  const controller = new DiscountCodesController({data});

  const result = await controller.applyDiscountCode({
    discountCode: 'SAVE20',
    totalPrice: 66,
    ticketQuantity: 2,
    eventId: 1,
  });

  assert.equal(result.status, 200);
  assert.equal(result.message, 'Discount code has no uses remaining');
});

test('type != 1, remaining uses < ticket quantity', async () => {
  const discountCode = {
    expiresOn: makeRelativeDate(1),
    type: 2,
    remainingUses: 1,
    timesUsed: 2,
    percentage: 20,
    id: 1,
  };

  const data = {
    getDiscountCode: () => discountCode,
    useDiscountCode: () => new Object(),
  };

  const controller = new DiscountCodesController({data});

  const result = await controller.applyDiscountCode({
    discountCode: 'SAVE20',
    totalPrice: 66,
    ticketQuantity: 2,
    eventId: 1,
  });

  assert.equal(result.status, 200);
  assert.equal(result.discountCodeId, 1);
  assert.equal(result.totalSavings, '6.60');
  assert.equal(result.totalPriceAfterDiscount, '59.40');
});

test('type != 1, remaining uses > ticket quantity', async () => {
  const discountCode = {
    expiresOn: makeRelativeDate(1),
    type: 2,
    remainingUses: 3,
    timesUsed: 2,
    percentage: 20,
    id: 1,
  };

  const data = {
    getDiscountCode: () => discountCode,
    useDiscountCode: () => new Object(),
  };

  const controller = new DiscountCodesController({data});

  const result = await controller.applyDiscountCode({
    discountCode: 'SAVE20',
    totalPrice: 66,
    ticketQuantity: 2,
    eventId: 1,
  });

  assert.equal(result.status, 200);
  assert.equal(result.discountCodeId, 1);
  assert.equal(result.totalSavings, '13.20');
  assert.equal(result.totalPriceAfterDiscount, '52.80');
});
