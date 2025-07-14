'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const EventsController = require('./EventsController.js');

test('getEvents returns empty list', async () => {
  let getEventsArgs;

  const controller = new EventsController({
    eventsData: {
      getEvents: args => {
        getEventsArgs = args;
        return [];
      },
    },
  });

  const result = await controller.getEvents({});

  assert.equal(result.status, 200);
  assert.equal(result.events.length, 0);

  assert.equal(getEventsArgs.sum.length, 0);
  assert.equal(getEventsArgs.startDate, undefined);
  assert.equal(getEventsArgs.endDate, undefined);
  assert.equal(getEventsArgs.sort.length, 0);
});

test('getEvents returns list of events', async () => {
  let getEventsArgs;

  const controller = new EventsController({
    eventsData: {
      getEvents: args => {
        getEventsArgs = args;

        return [
          {id: 1, headliner: 'Test 1'},
          {id: 2, headliner: 'Test 2'},
          {id: 3, headliner: 'Test 3'},
        ];
      },
    },
  });

  const result = await controller.getEvents({
    sum: 'green,yellow',
    startDate: '7/1/2025',
    endDate: '7/31/2025',
    sort: 'red,blue',
  });

  assert.equal(result.status, 200);
  assert.equal(result.events.length, 3);
  assert.equal(result.events[0].id, 1);
  assert.equal(result.events[0].headliner, 'Test 1');
  assert.equal(result.events[1].id, 2);
  assert.equal(result.events[1].headliner, 'Test 2');
  assert.equal(result.events[2].id, 3);
  assert.equal(result.events[2].headliner, 'Test 3');

  assert.equal(getEventsArgs.sum[0], 'green');
  assert.equal(getEventsArgs.sum[1], 'yellow');
  assert.equal(getEventsArgs.startDate.getTime(), 1751349600000);
  assert.equal(getEventsArgs.endDate.getTime(), 1753941600000);
  assert.equal(getEventsArgs.sort[0], 'red');
  assert.equal(getEventsArgs.sort[1], 'blue');
});

test('getEvent returns not found error', async () => {
  const controller = new EventsController({
    eventsData: {
      getEvent: () => undefined,
    },
  });

  const result = await controller.getEvent({id: 3});

  assert.equal(result.status, 404);
  assert.equal(result.message, 'Not found');
});

test('getEvent returns event', async () => {
  const controller = new EventsController({
    eventsData: {
      getEvent: params => ({id: params.id, headliner: `Test ${params.id}`}),
    },
  });

  const result = await controller.getEvent({id: 3});

  assert.equal(result.status, 200);
  assert.equal(result.id, 3);
  assert.equal(result.headliner, 'Test 3');
});

test('createEvent returns generic error', async () => {
  const controller = new EventsController({
    eventsData: {
      createEvent: () => undefined,
    },
  });

  const result = await controller.createEvent({headliner: 'Test 3'});

  assert.equal(result.status, 500);
  assert.equal(result.message, 'Unable to create event');
});

test('createEvent returns event', async () => {
  const controller = new EventsController({
    eventsData: {
      createEvent: params => ({id: 3, ...params}),
    },
  });

  const result = await controller.createEvent({headliner: 'Test 3'});

  assert.equal(result.status, 200);
  assert.equal(result.id, 3);
  assert.equal(result.headliner, 'Test 3');
});

test('updateEvent returns generic error', async () => {
  const controller = new EventsController({
    eventsData: {
      updateEvent: () => undefined,
    },
  });

  const result = await controller.updateEvent({id: 3, headliner: 'Test 3'});

  assert.equal(result.status, 500);
  assert.equal(result.message, 'Unable to update event');
});

test('updateEvent returns event', async () => {
  const controller = new EventsController({
    eventsData: {
      updateEvent: params => params,
    },
  });

  const result = await controller.updateEvent({id: 3, headliner: 'Test 3'});

  assert.equal(result.status, 200);
  assert.equal(result.id, 3);
  assert.equal(result.headliner, 'Test 3');
});

test('deleteEvent returns generic error', async () => {
  const controller = new EventsController({
    eventsData: {
      deleteEvent: () => undefined,
    },
  });

  const result = await controller.deleteEvent({id: 3});

  assert.equal(result.status, 500);
  assert.equal(result.message, 'Unable to delete event');
});

test('deleteEvent returns event', async () => {
  const controller = new EventsController({
    eventsData: {
      deleteEvent: params => ({id: params.id, headliner: `Test ${params.id}`}),
    },
  });

  const result = await controller.deleteEvent({id: 3});

  assert.equal(result.status, 200);
  assert.equal(result.id, 3);
  assert.equal(result.headliner, 'Test 3');
});

test('parseDate returns correct value', () => {
  assert.equal(EventsController.parseDate(), undefined);
  assert.equal(EventsController.parseDate(null), undefined);
  assert.equal(EventsController.parseDate(undefined), undefined);
  assert.equal(EventsController.parseDate(''), undefined);
  assert.equal(EventsController.parseDate(' '), undefined);
  assert.equal(EventsController.parseDate('asdf'), undefined);
  assert.equal(EventsController.parseDate('7/1/25').getTime(), 1751349600000);
  assert.equal(EventsController.parseDate('07/01/2025').getTime(), 1751349600000);
  assert.equal(EventsController.parseDate('2025/07/01').getTime(), 1751349600000);

  // This is ISO format, so JavaScript converts it to UTC
  assert.equal(EventsController.parseDate('2025-07-01').getTime(), 1751328000000);
});
