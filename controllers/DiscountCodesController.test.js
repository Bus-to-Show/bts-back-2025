'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const DiscountCodesController = require('./DiscountCodesController.js');

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
  const discountCodesData = {
    getDiscountCode: () => undefined,
  };

  const controller = new DiscountCodesController({discountCodesData});

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

  const discountCodesData = {
    getDiscountCode: () => discountCode,
    getDiscountCodeEvent: () => undefined,
  };

  const controller = new DiscountCodesController({discountCodesData});

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

  const discountCodesData = {
    getDiscountCode: () => discountCode,
    getDiscountCodeEvent: () => discountCodeEvent,
  };

  const controller = new DiscountCodesController({discountCodesData});

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

  const discountCodesData = {
    getDiscountCode: () => discountCode,
    getDiscountCodeEvent: () => undefined,
    useDiscountCode: () => new Object(),
    addDiscountCodeEvent: () => new Object(),
  };

  const controller = new DiscountCodesController({discountCodesData});

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

test('type = 1, discount code previously used once for event', async () => {
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

  const discountCodesData = {
    getDiscountCode: () => discountCode,
    getDiscountCodeEvent: () => discountCodeEvent,
    useDiscountCode: () => new Object(),
    useDiscountCodeEvent: () => new Object(),
  };

  const controller = new DiscountCodesController({discountCodesData});

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

test('type = 2, single-use discount code already used up', async () => {
  const discountCode = {
    expiresOn: makeRelativeDate(1),
    type: 2,
    remainingUses: 0,
    timesUsed: 2,
    percentage: 100,
    id: 1,
  };

  const discountCodeEvent = {
    timesUsedThisEvent: 2,
  };

  const discountCodesData = {
    getDiscountCode: () => discountCode,
    getDiscountCodeEvent: () => discountCodeEvent,
  };

  const controller = new DiscountCodesController({discountCodesData});

  const result = await controller.applyDiscountCode({
    discountCode: 'SAVE20',
    totalPrice: 66,
    ticketQuantity: 2,
    eventId: 1,
  });

  assert.equal(result.status, 200);
  assert.equal(result.message, 'Discount code has no uses remaining');
});

test('type = 2, single-use remaining uses < ticket quantity', async () => {
  const discountCode = {
    expiresOn: makeRelativeDate(1),
    type: 2,
    remainingUses: 1,
    timesUsed: 1,
    percentage: 20,
    id: 1,
  };

  const discountCodeEvent = {
    timesUsedThisEvent: 1,
  };

  const discountCodesData = {
    getDiscountCode: () => discountCode,
    getDiscountCodeEvent: () => discountCodeEvent,
    useDiscountCode: () => new Object(),
    useDiscountCodeEvent: () => new Object(),
  };

  const controller = new DiscountCodesController({discountCodesData});

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

test('type = 2, single-use remaining uses > ticket quantity', async () => {
  const discountCode = {
    expiresOn: makeRelativeDate(1),
    type: 2,
    remainingUses: 3,
    timesUsed: 2,
    percentage: 20,
    id: 1,
  };

  const discountCodeEvent = {
    timesUsedThisEvent: 2,
  };

  const discountCodesData = {
    getDiscountCode: () => discountCode,
    getDiscountCodeEvent: () => discountCodeEvent,
    useDiscountCode: () => new Object(),
    useDiscountCodeEvent: () => new Object(),
  };

  const controller = new DiscountCodesController({discountCodesData});

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

test('release discount code, invalid request', async () => {
  const controller = new DiscountCodesController({});

  const result = await controller.releaseDiscountCode({
    discountCode: '1FREE',
  });

  assert.equal(result.status, 400);
  assert.equal(result.message, 'Invalid request');
});

test('release discount code, not found', async () => {
  const discountCode = {
    expiresOn: makeRelativeDate(1),
    type: 2,
    remainingUses: 3,
    timesUsed: 2,
    percentage: 20,
    id: 1,
  };

  const discountCodesData = {
    getDiscountCode: () => discountCode,
    getDiscountCodeEvent: () => undefined,
  };

  const controller = new DiscountCodesController({discountCodesData});

  const result = await controller.releaseDiscountCode({
    discountCode: '1FREE',
    eventId: 1,
  });

  assert.equal(result.status, 400);
  assert.equal(result.message, 'Discount code not found');
});

test('release discount code, already depleted type 1', async () => {
  const discountCode = {
    expiresOn: makeRelativeDate(1),
    type: 1,
    usesPerEvent: 2,
    timesUsed: 2,
    percentage: 20,
    id: 1,
  };

  const discountCodeEvent = {
    timesUsedThisEvent: 2,
  };

  const discountCodesData = {
    getDiscountCode: () => discountCode,
    getDiscountCodeEvent: () => discountCodeEvent,
  };

  const reservationsData = {
    getReservationsByDiscountByEventThroughPickupParties: () => ({
      rowCount: 2,
    }),
  };

  const controller = new DiscountCodesController({discountCodesData, reservationsData});

  const result = await controller.releaseDiscountCode({
    discountCode: '1FREE',
    eventId: 1,
  });

  assert.equal(result.status, 200);
  assert.equal(result.message, 'Discount code has already been depleted');
});

test('release discount code, already depleted type 2', async () => {
  const discountCode = {
    expiresOn: makeRelativeDate(1),
    type: 2,
    remainingUses: 0,
    timesUsed: 2,
    percentage: 20,
    id: 1,
  };

  const discountCodeEvent = {
    timesUsedThisEvent: 2,
    usesPerEvent: 2,
  };

  const discountCodesData = {
    getDiscountCode: () => discountCode,
    getDiscountCodeEvent: () => discountCodeEvent,
  };

  const reservationsData = {
    getReservationsByDiscountCodeId: () => ({
      rowCount: 2,
    }),
  };

  const controller = new DiscountCodesController({discountCodesData, reservationsData});

  const result = await controller.releaseDiscountCode({
    discountCode: '1FREE',
    eventId: 1,
  });

  assert.equal(result.status, 200);
  assert.equal(result.message, 'Discount code has already been depleted');
});

test('release discount code, success', async () => {
  const discountCode = {
    expiresOn: makeRelativeDate(1),
    type: 2,
    remainingUses: 0,
    timesUsed: 2,
    percentage: 20,
    id: 1,
  };

  const discountCodeEvent = {
    timesUsedThisEvent: 2,
    usesPerEvent: 2,
  };

  const discountCodesData = {
    getDiscountCode: () => discountCode,
    getDiscountCodeEvent: () => discountCodeEvent,
    releaseDiscountCode: () => new Object(),
    releaseDiscountCodeEvent: () => new Object(),
  };

  const reservationsData = {
    getReservationsByDiscountCodeId: () => ({
      rowCount: 1,
    }),
  };

  const controller = new DiscountCodesController({discountCodesData, reservationsData});

  const result = await controller.releaseDiscountCode({
    discountCode: '1FREE',
    eventId: 1,
  });

  assert.equal(result.status, 200);
  assert.equal(result.message, 'Discount code released');
});
