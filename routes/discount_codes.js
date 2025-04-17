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



//check user entered discount code against database then return code id, new price, and remaining uses.
router.patch('/', function (req, res, next) {
  let discountCode = req.body.discountCode
  let totalPrice = req.body.totalPrice
  let ticketQuantity = req.body.ticketQuantity
  let ticketsAndUses = []
  let priceWithoutFeesPerTicket = totalPrice * 10 / 11 / ticketQuantity
  let afterDiscountObj = {}
  afterDiscountObj.ticketQuantity = ticketQuantity
  afterDiscountObj.eventsId = req.body.eventId
  if(req.body.applyOrRelease === 'release'){
    knex('discount_codes_events')
    .where(function() {
      this.where('discountCodeId', function() {
        this.select('id').from('discount_codes').where('discountCode', '=', req.body.discountCode);
      })
      .andWhere('eventsId', '=', req.body.eventId);
    })
    .increment('timesUsedThisEvent', -1)
    .then(data => {
      res.status(200).json(data)
    });
  }
  else{
    knex('discount_codes')
      // .join('discount_codes_events', 'discount_codes.id', 'discount_codes_events.discountCodeId')
      // .join('events', 'discount_codes_events.eventsId', 'events.id')
      .select('*')
      .where('discountCode', discountCode)
      .then((match) => {
        if (!match || !match.length || !match[0].remainingUses) {
          return res.status(400).json({ message: 'This code is not in our database.' })
        }
        else if (match) {
          match = match[0]
          console.log('match! ==>>==>> ', match );
          afterDiscountObj.newRemainingUses = match.remainingUses
          afterDiscountObj.type = match.type
          //afterDiscountObj.discountCodeEventsId = match.id
          afterDiscountObj.discountCodeId = match.id
          let effectiveRate = (100 - match.percentage) / 100
          let expiration = Date.parse(new Date(match.expiresOn).toLocaleString('en-US'))
          let today = Date.parse(new Date().toLocaleString('en-US', {
            timeZone: 'America/Denver'
          }
          ))
          if (expiration < today) {
            return res.status(200).json({ message: 'This code has expired.' })
          }
          // if code is for one time use and has been used, return message
          else if (match.type === 1) {
            return knex('discount_codes_events')
            .select('*')
              .where('discountCodeId', match.id)
              .andWhere('eventsId', req.body.eventId)
              .then((match2) => {
                match2 = match2[0]
                if (match2.timesUsedThisEvent > 0) {
                  return res.status(200).json({ message: 'This code is all used up.' })
                } else {
                  afterDiscountObj.timesUsed = match.timesUsed + 1
                  afterDiscountObj.timesUsedThisEvent = match2.timesUsedThisEvent + 1
                  afterDiscountObj.totalPriceAfterDiscount =
                    (totalPrice / ticketQuantity) // price per ticket
                    * (ticketQuantity - 1) // minus one ticket
                  afterDiscountObj.savings = totalPrice - afterDiscountObj.totalPriceAfterDiscount
                  return afterDiscountObj
                }
              })
          } else if (match.type != 1) {
            if (match.remainingUses <= 0) {
              return res.status(200).json({ message: 'This code is all used up.' })
            } // if more remaing uses than tickets requested, allow useage
            else if (match.remainingUses >= ticketQuantity) {
              afterDiscountObj.timesUsed = ticketQuantity
              afterDiscountObj.totalPriceAfterDiscount = priceWithoutFeesPerTicket * ticketQuantity * effectiveRate * 1.10
              afterDiscountObj.newRemainingUses = match.remainingUses - ticketQuantity
              afterDiscountObj.savings = totalPrice - afterDiscountObj.totalPriceAfterDiscount
              return (afterDiscountObj)
            } // if fewer remaining uses than tickets requested, only apply discount on qty remainingUses
            else if (match.remainingUses < ticketQuantity) {
              afterDiscountObj.timesUsed = match.remainingUses
              afterDiscountObj.totalPriceAfterDiscount = (priceWithoutFeesPerTicket * (ticketQuantity - match.remainingUses) + priceWithoutFeesPerTicket * effectiveRate * match.remainingUses) * 1.10
              afterDiscountObj.newRemainingUses = 0
              afterDiscountObj.savings = totalPrice - afterDiscountObj.totalPriceAfterDiscount

              return afterDiscountObj

            }
          }
          console.log('afterDiscountObj nothin ===>', afterDiscountObj)

        }
      })
      .then((afterDiscountObj) => {
        if (afterDiscountObj.type === 1) {
          //update discount_codes_events table with new timesUsedThisEvent
          knex('discount_codes_events')
            .select('*')
            .where('discountCodeId', afterDiscountObj.discountCodeId)
            .andWhere('eventsId', afterDiscountObj.eventsId)
            .update({
              timesUsedThisEvent: afterDiscountObj.timesUsedThisEvent
            })
            .returning(['eventsId'])
            .then((data) => {
              data[0].savings = afterDiscountObj.savings
              data[0].totalPriceAfterDiscount = afterDiscountObj.totalPriceAfterDiscount
              return res.status(200).json(data)
            })
        } else if (afterDiscountObj.newRemainingUses || afterDiscountObj.newRemainingUses === 0) {

          knex('discount_codes')
            .select('*')
            .where('discountCode', discountCode)
            .update({
              remainingUses: afterDiscountObj.newRemainingUses,
              totalPriceAfterDiscount: afterDiscountObj.totalPriceAfterDiscount,
              timesUsed: afterDiscountObj.timesUsed
            })
            .returning(['id', 'remainingUses', 'totalPriceAfterDiscount', 'timesUsed', 'type'])
            .then((data) => {
              data[0].savings = afterDiscountObj.savings
              return res.status(200).json(data)
            })
        }

      })
      .catch(error => {
        console.error(error);
        return res.status(500).json({message: 'An unknown error occurred.'});
      });
  }
})

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
