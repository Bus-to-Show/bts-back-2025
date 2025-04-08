const assert = require('node:assert/strict');
const test = require('node:test');

test('PATCH with invalid discount code returns 400', async () => {
  const response = await fetch('http://localhost:3000/discount_codes', {
    body: JSON.stringify({
      applyOrRelease: 'apply',
      discountCode: 'test',
      eventId: 1,
      ticketQuantity: 2,
      totalPrice: '66.00',
    }),
    headers: {
      'content-type': 'application/json',
      origin: 'http://localhost:4200',
    },
    method: 'PATCH',
  });

  const responseJson = await response.json();

  assert.equal(response.status, 400);
  assert.equal(responseJson.message, 'This code is not in our database.');
});

test('PATCH with missing discount code returns 500', async () => {
  const response = await fetch('http://localhost:3000/discount_codes', {
    body: JSON.stringify({
      applyOrRelease: 'apply',
      eventId: 1,
      ticketQuantity: 2,
      totalPrice: '66.00',
    }),
    headers: {
      'content-type': 'application/json',
      origin: 'http://localhost:4200',
    },
    method: 'PATCH',
  });

  const responseJson = await response.json();

  assert.equal(response.status, 500);
  assert.equal(responseJson.message, 'An unknown error occurred.');
});
