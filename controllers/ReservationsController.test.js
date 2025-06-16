'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const ReservationsController = require('./ReservationsController.js');

test('invalid request returns 400', async () => {
  const controller = new ReservationsController({
    reservationsData: {},
    pickupPartiesData: {},
  });

  const result = await controller.updateReservation({
    id: 1,
    orderId: 1,
    pickupPartiesId: 1,
    willCallFirstName: 'Steve',
    willCallLastName: 'Holt',
  });

  assert.equal(result.status, 400);
  assert.equal(result.message, 'Invalid request');
});

test('reservation not found returns 404', async () => {
  const controller = new ReservationsController({
    reservationsData: {
      getReservation: () => undefined,
    },
    pickupPartiesData: {},
  });

  const result = await controller.updateReservation({
    id: 1,
    orderId: 1,
    pickupPartiesId: 1,
    willCallFirstName: 'Steve',
    willCallLastName: 'Holt',
    status: 1,
  });

  assert.equal(result.status, 404);
  assert.equal(result.message, 'Reservation not found');
});

test('pickup party not found returns 404', async () => {
  const controller = new ReservationsController({
    reservationsData: {
      getReservation: () => ({id: 1}),
    },
    pickupPartiesData: {
      getPickupParty: () => undefined,
    },
  });

  const result = await controller.updateReservation({
    id: 1,
    orderId: 1,
    pickupPartiesId: 1,
    willCallFirstName: 'Steve',
    willCallLastName: 'Holt',
    status: 1,
  });

  assert.equal(result.status, 404);
  assert.equal(result.message, 'Pickup party not found');
});

test('pickup party at capacity returns 400', async () => {
  const controller = new ReservationsController({
    reservationsData: {
      getReservation: () => ({id: 1}),
    },
    pickupPartiesData: {
      getPickupParty: () => ({id: 1, reservations: 10, capacity: 10}),
    },
  });

  const result = await controller.updateReservation({
    id: 1,
    orderId: 1,
    pickupPartiesId: 1,
    willCallFirstName: 'Steve',
    willCallLastName: 'Holt',
    status: 1,
  });

  assert.equal(result.status, 400);
  assert.equal(result.message, 'Pickup party is full');
});

test('happy path returns 200', async () => {
  const controller = new ReservationsController({
    reservationsData: {
      getReservation: () => ({id: 1}),
      updateReservation: () => true,
    },
    pickupPartiesData: {
      getPickupParty: () => ({id: 1, reservations: 9, capacity: 10}),
    },
  });

  const result = await controller.updateReservation({
    id: 1,
    orderId: 1,
    pickupPartiesId: 1,
    willCallFirstName: 'Steve',
    willCallLastName: 'Holt',
    status: 1,
  });

  assert.equal(result.status, 200);
  assert.equal(result.message, 'Reservation updated');
});
