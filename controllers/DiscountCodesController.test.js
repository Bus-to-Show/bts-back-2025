'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const DiscountCodesController = require('./DiscountCodesController.js');
const { use } = require('../routes/discount_codes.js');

function makeRelativeDate(addYears) {
  const date = new Date();
  date.setFullYear(date.getFullYear() + addYears);
  return date;
}

test('invalid request, no event ID', async () => {
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

test('type = 1, reusable discount code used up for event', async () => {
  const discountCode = {
    expiresOn: makeRelativeDate(1),
    type: 1,
    id: 1,
    usesPerEvent: 2,
  };

  const discountCodeEvent = {
    timesUsedThisEvent: 2,
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
  assert.equal(result.message, 'Discount code has already been used up for this event');
});

test('type = 1, discount code applied to new event', async () => {
  const discountCode = {
    expiresOn: makeRelativeDate(1),
    type: 1,
    id: 1,
    usesPerEvent: 2,
    percentage: 100,
  };

  const data = {
    getDiscountCode: () => discountCode,
    getDiscountCodeEvent: () => undefined,
    createDiscountCodeEvent: () => new Object(),
  };

  const controller = new DiscountCodesController({data});

  const result = await controller.applyDiscountCode({
    discountCode: 'FireFreeRides',
    totalPrice: 66,
    ticketQuantity: 2,
    eventId: 1,
  });

  assert.equal(result.status, 200);
  assert.equal(result.discountCodeId, 1);
  assert.equal(result.totalSavings, '66.00');
  assert.equal(result.totalPriceAfterDiscount, '0.00');
});

test('type = 1, discount code used once for event', async () => {
  const discountCode = {
    expiresOn: makeRelativeDate(1),
    type: 1,
    id: 1,
    percentage: 100,
    usesPerEvent: 2,
  };

  const discountCodeEvent = {
    timesUsedThisEvent: 1,
  };

  const data = {
    getDiscountCode: () => discountCode,
    getDiscountCodeEvent: () => discountCodeEvent,
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

test('type != 1, one-time discount code already used up', async () => {
  const discountCode = {
    expiresOn: makeRelativeDate(1),
    type: 2,
    remainingUses: 0,
    timesUsed: 2,
    percentage: 100,
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
    timesUsed: 1,
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

test('release discount code', async () => {
  const data = {
    releaseDiscountCode: () => new Object(),
  };

  const controller = new DiscountCodesController({data});

  const result = await controller.releaseDiscountCode({
    discountCode: '1FREE',
    eventId: 1,
  });

  assert.equal(result.status, 200);
  assert.equal(result.message, 'Discount code released');
});

test('release discount code, invalid request', async () => {
  const controller = new DiscountCodesController({});

  const result = await controller.releaseDiscountCode({
    discountCode: '1FREE',
  });

  assert.equal(result.status, 400);
  assert.equal(result.message, 'Invalid request');
});
