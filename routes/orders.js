'use strict';

const express = require('express');
const router = express.Router();
const knex = require('../knex.js')
var convertTime = require('convert-time')
const nodemailer = require('nodemailer')
const EMAIL_PASS = process.env.EMAIL_PASS
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const jwt = require('jsonwebtoken')
const JWT_KEY = process.env.JWT_KEY
const verifyToken = require('./api').verifyToken

const OrdersController = require('../controllers/OrdersController.js');
const ordersData = require('../data/orders.js');
const reservationsData = require('../data/reservations.js');
const { getPickupParty } = require('../data/pickup_parties.js');
const controller = new OrdersController({ordersData, reservationsData});

// We should move this to an environment variable,
// e.g., process.env.BLOCKED_EMAIL_DOMAINS.split(',')
const BLOCKED_DOMAINS = [
  'otvus.com',
];

// and extract this somewhere reusable too
const isEmailDomainBlocked = (email) => {
  if (!email) return false;
  const domain = email.split('@')[1];
  return BLOCKED_DOMAINS.includes(domain?.toLowerCase());
};

// helper data object for confirmation email sponsor deals
  // should be extracted to a diff file w/ email functions in the future
const sponsorDeals = {
  'College Inn': [
    '$6.50 Pony Rider: Montucky & shot of well whiskey or tequila',
    '$10 Day Drinker: NÜTRL & shot of Pink Whitney',
    '$7 Dill-Light: Bud Light Draft & pickle shot',
    '$8.50 Mexican Lunchbox: Estrella Jalisco draft & shot of Camarena',
  ],
  "Wyman's No. 5": [
    "$8 Dew 'n a Blue: Labatt Blue and shot of Tullamore dew",
    "$3 Cheese slice",
    "$4 Pepperoni slice",
    "$10 Day Drinker: NÜTRL & shot of Pink Whitney",
    "$7 Pink Pony: Montucky & shot of Pink Whitney"
  ],
  "Three Dogs Tavern": [
    "$3.25 Montucky",
    "$5 Stadium Nachos",
    "$5 Taquitos",
    "$5 Pretzel Bites",
    "$8.50 Mexican Lunchbox: Estrella Jalisco draft & shot of Camarena"
  ],
  "Bierstadt Lagerhaus": [
    "$2 off soft pretzels",
    "$2 off a liter of Helles",
    "Free water with purchase"
  ],
  "Fire on the Mountain": [
    "$8 medium fry/tot",
    "$11 loaded FOTM fries (basket of fries or tots, tossed in Medium Buffalo sauce, topped with blue cheese crumbles and green onion)",
    "$4 cans of Montucky, PBR, Rainer, NA Kolsch, Thirst Mutilator NA"
  ],
  "Front Range Inn": [
    "$10 2x Herradura tequila ($4 off)",
    "$10 2x Jack Daniel's whiskey ($2 off)",
    "$10 2x Titos vodka ($2 off)",
    "$10 cauliflower wings ($3 off)",
    "$10 pretzel bites ($1 off)",
    "$15 BTS (Burger to Show) - signature burger details TBD"
  ],
  "Over Yonder": [
    "1 free tap room pour",
    "1 $5 can for the bus ride"
  ],
  "Mr. Oso": [
    "Spend $15 and get a free house margarita or house-made agua fresca!",
    "$4 Chips and salsa",
  ]
};

// helper function for building the confirmation email body
  // should be extracted to a diff file in the future
const generateConfirmationEmailBody = (
  ticketQuantity,
  result, // needed properties: result.locationName, result.streetAddress, result.headliner, result.venue, result.date, result.lastBusDepartureTime
  convertTime,
  firstName,
  lastName,
  willCallFirstName,
  willCallLastName,
  sponsorDeals,
) => {
  const sponsorName = result.locationName.split(" - ")[1];

  return `
Hi ${firstName} ${lastName}! Thank you for riding with Bus to Show!

You have ${ticketQuantity} round-trip ${ticketQuantity === 1 ? 'seat' : 'seats'} reserved under check-in name [${willCallFirstName} ${willCallLastName}] departing from ${result.locationName}, ${result.streetAddress} and going to ${result.headliner} at ${result.venue} on ${result.date}. ${sponsorName === "Fire on the Mountain" ? "Please note, since Fire on the Mountain is closed by the time we get back, we drop back off at Three Dogs Tavern (just 2 blocks away) so you've got a place to hang out while you wait for your rideshare if you want - they also offer deals for Bus to Show riders!! If you need to be dropped off at Fire on the Mountain specifically, just let your driver know, and we can still absolutely swing by there for you." : ""}

Last call / bus departure is currently ${convertTime(result.lastBusDepartureTime)}. Please show up at least 10-15 minutes before that to check in. Make sure everyone in your group has their IDs, even if they aren't the ones who bought their ticket (see instructions below for anyone under 18). If we have enough demand for multiple buses, we will usually start loading the first bus 30-60 min earlier, and sending them out as soon as they are full. ${sponsorDeals[sponsorName] ? "Even better, come early to enjoy the deals our pick-up locations offer just for our riders!!" : ""}
${sponsorDeals[sponsorName] ? "\n" + sponsorName + " offers Bus to Show riders:\n" : ""}${sponsorDeals[sponsorName] ? sponsorDeals[sponsorName].map(deal => " * " + deal).join("\n") + "\n" : ""}
PLEASE NOTE: Time adjustments do occasionally happen (when show times change, for example, because we don't want you missing music). The most up-to-date departure times are always available on our website. We'll send out emails to let you know whenever a change occurs, but just to be safe, please go to the website again and double check the times day-of. There are no refunds for missing the bus.

Just riding with us after the show? The bus leaves 30 minutes after the show ends and you can find your bus in Lower South Lot 2, https://maps.app.goo.gl/QxWZw6vtgsCC7z34A. Check with the drivers to ensure you end up at the correct destination!

Under 18? No problem - anyone under 18 just needs to have a parent/guardian send an email to reservations@bustoshow.org including explicit permission to ride Bus to Show, their name and a picture of their ID, their kid's name (yours), and the date of the show. Then, just show your ID and that email at check-in and you're good to go!!

Can't wait to get this bus party going!!

Love,
Bus to Show, Inc.
(844) BUS-SHOW [844.287.7469]
reservations@bustoshow.org
bustoshow.org

P.S. Have any other questions? Check out our FAQ page at https://bustoshow.org/faq or send us an email at the address above. We are here to help!
P.P.S. Here's a link to the waiver terms and refund policy you agreed to when you made your reservation: https://bustoshow.org/waiver
`;
};


//List (get all of the resource)
router.get('/', verifyToken, function (req, res, next) {
  jwt.verify(req.token, JWT_KEY, (err, authData) => {
    if (err) {
      res.sendStatus(403)
    } else {
      knex('orders')
        .select('*')
        .then((data) => {
          res.status(200).json(data)
        })
    }
  })
})

//Get All reservations associated with a userId (passed in as req.params.id)
router.get('/:id', function (req, res, next) {
  knex('orders')
    .select('orderedByFirstName', 'orderedByLastName', 'orderedByEmail', 'userId', 'orderId', 'willCallFirstName', 'willCallLastName', 'status', 'lastBusDepartureTime', 'firstBusLoadTime', 'city', 'locationName', 'streetAddress', 'date', 'venue', 'headliner', 'support1', 'support2', 'support3', 'headlinerBio', 'headlinerImgLink')
    .join('reservations', 'orders.id', '=', 'reservations.orderId')
    .select('reservations.id as reservationsId')
    .join('pickup_parties', 'reservations.pickupPartiesId', '=', 'pickup_parties.id')
    .join('pickup_locations', 'pickup_locations.id', '=', 'pickup_parties.pickupLocationId')
    .join('events', 'events.id', '=', 'pickup_parties.eventId')
    .select('events.id as eventsId')
    .orderBy('date')
    .where('orders.userId', req.params.id)
    .then((data) => {
      res.status(200).json(data)
    })
})

//Read (get one of the resource)
// Get One
// router.get('/:id', function(req, res, next){
//   knex('orders')
//     .select('id', 'orderedByFirstName', 'orderedByLastName', 'orderedByEmail')
//     .where('id', req.params.id)
//   .then((data) => {
//     res.status(200).json(data[0])
//   })
//   .catch(err => {
//     res.status(400).json(err)
//   })
// })

//POST ROUTE ORDERS
router.post('/', function (req, res, next) {

  const {
    userId,
    pickupLocationId,
    eventId,
    firstName,
    lastName,
    willCallFirstName,
    willCallLastName,
    email,
    orderedByPhone,
    ticketQuantity,
    discountCode
  } = req.body

  if (!firstName || !lastName || !email || !pickupLocationId || !eventId || !ticketQuantity) {
    return res.status(400).send({message: 'Missing required fields'});
  }
  if (isEmailDomainBlocked(email)) {
    console.log(`Blocked email: ${email}`)
    return res.status(400).send({message: 'Unable to process this order.'});
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'updates@bustoshow.org',
      pass: EMAIL_PASS
    }
  });

  const confirmationDetailsQuery = () => {
    return knex('pickup_parties')
      .join('events', 'events.id', '=', 'pickup_parties.eventId')
      .join('pickup_locations', 'pickup_locations.id', '=', 'pickup_parties.pickupLocationId')
      .where('eventId', eventId)
      .where('pickupLocationId', pickupLocationId)
      .select('events.date', 'events.headliner', 'events.venue', 'pickup_locations.locationName', 'pickup_locations.streetAddress', 'firstBusLoadTime', 'lastBusDepartureTime')
      .then((data) => {
        return data[0]
      })
  };

  let newPickupPartyId
  let newOrderId

  knex('orders')
    .insert({
      userId: userId,
      orderedByFirstName: firstName,
      orderedByLastName: lastName,
      orderedByEmail: email,
      orderedByPhone
    })
    .returning('*')
    .then((newOrder) => {
      newOrderId = newOrder[0].id
      return newOrderId
    })
    .then((newOrderId) => {
      knex('pickup_parties')
        .where({
          eventId: eventId,
          pickupLocationId: pickupLocationId,
        })
        .returning('*')
        .then((newPickupParty) => {
          newPickupPartyId = newPickupParty[0].id
          let newOrdersArr = [newOrderId, newPickupPartyId]
          return newOrdersArr
        })
        .then((ordersArr) => {
          let ticketQuantity = req.body.ticketQuantity
          let reservationsArr = []
          for (let ii = 0; ii < ticketQuantity; ii++) {
            reservationsArr.push({
              orderId: ordersArr[0],
              pickupPartiesId: ordersArr[1],
              willCallFirstName: req.body.willCallFirstName,
              willCallLastName: req.body.willCallLastName,
              discountCodeId: req.body.discountCode
            })
          }
          knex('reservations')
            .insert(reservationsArr)
            .returning('*')
            .then((newReservation) => {
              res.status(200).json(newReservation[0])
            })
        })
        .then(async () => {
          let result = await confirmationDetailsQuery()
          result.email = email
          transporter.sendMail({
            from: 'updates@bustoshow.org',
            to: result.email,
            subject: 'Your Bus to Show Order Confirmation',
            text: generateConfirmationEmailBody(ticketQuantity, result, convertTime, firstName, lastName, willCallFirstName, willCallLastName, sponsorDeals)
          }, function (error, info) {
            if (error) {
              console.error('Email not sent', error);
            } else {
              console.log('Email sent', info);
            }
          })
        })
        .catch(err => {
          res.status(400).json(err)
        })
    })
})

router.patch('/:id', async (req, res) => {
  try {
    const {status, ...rest} = await controller.updateOrder({id: req.params.id, ...req.body});
    return res.status(status).json(rest);
  } catch (error) {
    console.error(error);
    res.status(500).json({message: 'An unknown error occurred.'});
  }
});

//Delete (delete one of the resource)
// router.delete('/:id', function(req, res, next){
//   knex('orders')
//     .where('id', req.params.id)
//     .del('*')
//     .returning(['id', 'orderedByFirstName', 'orderedByLastName', 'orderedByEmail'])
//   .then((data) => {
//     res.status(200).json(data[0])
//   })
// })

router.post('/charge', async (req, res) => {
  try {
    if (isEmailDomainBlocked(req.body.stripeEmail)) {
      console.log(`Blocked email: ${req.body.stripeEmail}`)
      return res.status(400).json({message: 'Unable to process this order.'});
    }

    // check capacity of pickup party before charging customer
    const {pickupPartyId, ticketQuantity} = req.body.metadata;

    const party = await getPickupParty({id: pickupPartyId});

    if (!party) {
      return res.status(404).json({message: 'That pickup was not found. Please try again.'});
    }

    const availableCapacity = party.capacity - party.reservations;

    if (ticketQuantity > availableCapacity) {
      return res.status(400).json({message: 'Not enough tickets left to complete this order. Please try again or select another pickup location.'});
    }

    const customer = await stripe.customers.create({
      email: req.body.stripeEmail,
      source: req.body.stripeToken.id,
    });

    const charge = await stripe.charges.create({
      amount: req.body.amount,
      description: req.body.metadata.eventId,
      currency: 'usd',
      customer: customer.id,
      metadata: req.body.metadata,
    });
    res.json(charge);
  } catch (err) {
    handleStripeError(err, res);
  }
});

const handleStripeError = (err, res) => {
  console.error(err);

  if (err.type === 'StripeCardError') {
    res.status(err.statusCode).json({message: err.message});
  } else {
    res.status(500).json({message: 'An unknown error occurred.'});
  }
};

module.exports = router;
