'use strict';

const express = require('express');
const router = express.Router();
const knex = require('../knex.js')


//List (get all of the resource)
router.get('/', function (req, res, next) {
    knex('discount_codes')
      .select('id', 'discountCode', 'percentage', 'expiresOn', 'issuedOn', 'issuedTo', 'issuedBy', 'issuedBecause', 'timesUsed', 'type', 'remainingUses', 'usesPerEvent')
      .then((data) => {
        res.status(200).json(data)
      })
})


//Read (get one of the resource)
// Get One
router.get('/:id', function (req, res, next) {
    knex('discount_codes')
      .select('id', 'discountCode', 'percentage', 'expiresOn', 'issuedOn', 'issuedTo', 'issuedBy', 'issuedBecause', 'timesUsed', 'type', 'remainingUses', 'usesPerEvent')
      .where('id', req.params.id)
      .then((data) => {
        res.status(200).json(data[0])
      })
})

router.get('/:user_id/:event_id', function (req, res, next) {
    knex('users')
      .select('email')
      .where('id', req.params.user_id)
      .first()
      .then((user) => {
        knex.raw("SELECT date FROM events WHERE id = ?::integer", [req.params.event_id])
          .then((eventRaw) => {
            const event = eventRaw.rows[0];
            knex('discount_codes')
              .select('discountCode', 'id')
              .where('issuedTo', user.email)
              .andWhere('type', 1)
              .andWhere('expiresOn', '>=', knex.raw("to_date(?, 'MM/DD/YYYY')", [event.date]))
              .first()
              .then((discountCode) => {
                if (discountCode) {
                  knex('discount_codes_events')
                    .select(['timesUsedThisEvent'])
                    .where('discountCodeId', discountCode.id)
                    .andWhere('eventsId', req.params.event_id)
                    .first()
                    .then((discountCodeEvent) => {
                      if (discountCodeEvent && discountCodeEvent.timesUsedThisEvent > 0) {
                        res.status(200).json({
                          message: "Season pass discount code has already been applied.",
                          discountCode: discountCode.discountCode,
                          alreadyApplied: true
                        });
                      } else {
                        res.status(200).json({
                          message: "Season pass discount code is available.",
                          discountCode: discountCode.discountCode,
                          alreadyApplied: false
                        });
                      }
                    });
                } else {
                  res.status(200).json({
                    message: "No valid season pass discount code found.",
                    discountCode: null
                  });
                }
              });
          });
      })
      .catch((error) => {
        res.status(500).json({ message: "Error fetching data.", error });
      });
});




//Create (create one of the resource)
router.post('/', function (req, res, next) {
  knex('discount_codes')
    .insert(req.body)
    .returning(['id', 'discountCode', 'percentage', 'expiresOn', 'issuedOn', 'issuedTo', 'issuedBy', 'issuedBecause', 'timesUsed', 'type', 'remainingUses', 'usesPerEvent'])
    .then((data) => {
      res.status(200).json(data[0])
    })
})

//restore discount code remaining uses after timer expires on abandoned checkout.
router.patch('/return/:id', function (req, res, next) {
  let id = req.params.id

  knex('discount_codes')
    .join('discount_codes_events', 'discount_codes.id', 'discount_codes_events.discountCodeId')
    .join('events', 'discount_codes_events.eventsId', 'events.id')
    .where('discount_codes.id', id)
    .select('*')
    .first()
    .then((match) => {
      let currentRemainingUses = match.remainingUses
      let timesUsed = req.body.timesUsed

      knex('discount_codes')
        .where('id', id)
        .increment('remainingUses', timesUsed)
        .then(data => {
          res.status(200).json(data)
        })
    })
    .catch(error => {
      return res.status(500).json({ message: 'internal server error, discount code:Patch' })
    })
})

router.patch('/', async (request, response, next) => {
  try {
    const {status, ...rest} = await handlePatch(request.body);
    return response.status(status).json(rest);
  } catch (error) {
    next(error);
  }
});

async function handlePatch({
  discountCode,
  totalPrice,
  ticketQuantity,
  eventId,
  applyOrRelease,
}) {
  if (!discountCode || !totalPrice || !ticketQuantity || !eventId || !applyOrRelease) {
    return {status: 400, message: 'Invalid request'};
  }

  if (applyOrRelease === 'release') {
    await release(discountCode, eventId);
    return {status: 200, message: 'Discount code released'};
  }

  const discountCodeObj = await getDiscountCode(discountCode);

  if (!discountCodeObj) {
    return {status: 400, message: 'Discount code not found'};
  }

  if (Date.parse(discountCodeObj.expiresOn) < Date.now()) {
    return {status: 200, message: 'Discount code expired'};
  }

  if (discountCodeObj.type === 1) {
    const discountCodeEventObj = await getDiscountCodeEvent(discountCodeObj.id, eventId);

    if (!discountCodeEventObj) {
      return {status: 400, message: 'Discount code not found for this event'};
    }

    if (discountCodeEventObj.timesUsedThisEvent > 0) {
      return {status: 200, message: 'Discount code has already been used for this event'};
    }

    await useDiscountCodeEvent(discountCodeObj.id, eventId, 1);

    const pricePerTicket = totalPrice / ticketQuantity;
    const totalSavings = pricePerTicket.toFixed(2);
    const totalPriceAfterDiscount = (totalPrice - totalSavings).toFixed(2);

    return {
      status: 200,
      discountCodeId: discountCodeObj.id,
      totalSavings,
      totalPriceAfterDiscount,
    };
  }

  if (discountCodeObj.remainingUses < 1) {
    return {status: 200, message: 'Discount code has no uses remaining'};
  }

  const timesUsedThisOrder = Math.min(discountCodeObj.remainingUses, ticketQuantity);
  const remainingUses = discountCodeObj.remainingUses - timesUsedThisOrder;
  const timesUsed = discountCodeObj.timesUsed + timesUsedThisOrder;

  await useDiscountCode(discountCode, remainingUses, timesUsed);

  const pricePerTicket = totalPrice / ticketQuantity;
  const savingsPerTicket = pricePerTicket * (discountCodeObj.percentage / 100);
  const totalSavings = (savingsPerTicket * timesUsedThisOrder).toFixed(2);
  const totalPriceAfterDiscount = (totalPrice - totalSavings).toFixed(2);

  return {
    status: 200,
    discountCodeId: discountCodeObj.id,
    totalSavings,
    totalPriceAfterDiscount,
  };
}

function release(discountCode, eventId) {
  // TODO: this only applies to type = 1, what about the rest?
  return knex('discount_codes_events')
    .where(() => {
      this.where('discountCodeId', () => {
        this.select('id').from('discount_codes').where('discountCode', discountCode);
      })
      .andWhere('eventsId', eventId);
    })
    .increment('timesUsedThisEvent', -1);
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

function useDiscountCodeEvent(discountCodeId, eventId, timesUsedThisEvent) {
  return knex('discount_codes_events')
    .select('*')
    .where('discountCodeId', discountCodeId)
    .andWhere('eventsId', eventId)
    .update({timesUsedThisEvent});
}

//Delete (delete one of the resource)
// router.delete('/:id', function(req, res, next) {
//   knex('discount_codes')
//     .where('id', req.params.id)
//     .del('*')
//     .returning(['id', 'discountCode', 'percentage', 'expiresOn', 'issuedOn', 'issuedTo', 'issuedBy', 'issuedBecause', 'timesUsed', 'type', 'remainingUses', 'usesPerEvent'])
//   .then((data) => {
//     res.status(200).json(data[0])
//   })
// })

module.exports = router;
