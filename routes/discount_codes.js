'use strict';

const express = require('express');
const router = express.Router();
const knex = require('../knex.js')

const DiscountCodesController = require('../controllers/DiscountCodesController.js');
const data = require('../data/discount_codes.js');
const controller = new DiscountCodesController({data});

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

router.patch('/', async (req, res, next) => {
  try {
    if (req.body.applyOrRelease === 'release') {
      const {status, ...rest} = await controller.releaseDiscountCode(req.body);
      return res.status(status).json(rest);
    }

    const {status, ...rest} = await controller.applyDiscountCode(req.body);
    return res.status(status).json(rest);
  } catch (error) {
    next(error);
  }
});

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
