'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const OrdersController = require('./OrdersController.js');

test('invalid request returns 400', async () => {
  const controller = new OrdersController({
    ordersData: {},
  });

  const result = await controller.updateOrder({
    id: 1,
    willCallFirstName: 'Steve',
  });

  assert.equal(result.status, 400);
  assert.equal(result.message, 'Invalid request');
});

test('order not found returns 404', async () => {
  const controller = new OrdersController({
    ordersData: {
      getOrder: () => undefined,
    },
  });

  const result = await controller.updateOrder({
    id: 1,
    willCallFirstName: 'Steve',
    willCallLastName: 'Holt',
  });

  assert.equal(result.status, 404);
  assert.equal(result.message, 'Order not found');
});

test('happy path returns 200', async () => {
  const controller = new OrdersController({
    ordersData: {
      getOrder: () => ({id: 1}),
    },
    reservationsData: {
      updateReservations: () => true,
    },
  });

  const result = await controller.updateOrder({
    id: 1,
    willCallFirstName: 'Steve',
    willCallLastName: 'Holt',
  });

  assert.equal(result.status, 200);
  assert.equal(result.message, 'Order updated');
});
