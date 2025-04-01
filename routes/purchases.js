'use strict';

const express = require('express');
const router = express.Router();
const knex = require('../knex.js')
// Parse the environment variable into an object
const parse = require("pg-connection-string").parse;
const pgconfig = parse(process.env.DATABASE_URL);

const Pool = require('pg').Pool
const pool = new Pool(pgconfig)

//List (get all of the resource)
router.get('/', (req, res, next) => {
    pool.connect((err, client, release) => {
        if (err) {
          return console.error('Error acquiring client', err.stack)
        }
        client.query(`
        `, (err, result) => {
          release()
          if (err) {
            return console.error('Error executing query', err.stack)
          }
          res.status(200).json(result.rows)
        })
      })

  })


//Read (get one of the resource)
// Get One
router.get('/:id', function(req, res, next){
knex('purchases')
    .select('id', 'date', 'doors_time', 'startTime', 'venue', 'headliner', 'support1', 'support2', 'support3', 'headlinerImgLink', 'headlinerBio', 'meetsCriteria', 'isDenied', 'external')
    .where('id', req.params.id)
.then((data) => {
    res.status(200).json(data[0])
})
})

//Create (create one of the resource)
router.post('/', function(req, res, next){
  console.log('purchases req.body ==>>==>> ', req.body);
  const card = req.body.token.card;
  const product = req.body.token.product
	const product_id = product.id
	const purchased_by_first = product.name
	const purchased_by_last = product.name
	const purchased_for_email = req.body.token.email
	const purchased_by_email = req.body.token.email
	const billing_zip = card.address_zip
  const billing_address=`${card.address_line1} ${card.address_city}, ${card.address_state} ${card.address_zip}`

  const values = [product_id, purchased_by_first, purchased_by_last, purchased_for_email, purchased_by_email, billing_zip, billing_address];


  // {
  //   token: {
  //     id: 'tok_1Mlm5HGUkq1Hzg0nv5LMUIqj',
  //     object: 'token',
  //     card: {
  //       id: 'card_1Mlm5HGUkq1Hzg0nsbOcr7Tz',
  //       object: 'card',
  //       address_city: 'PENROSE',
  //       address_country: 'United States',
  //       address_line1: 'PO BOX 909',
  //       address_line1_check: 'unchecked',
  //       address_line2: null,
  //       address_state: 'CO',
  //       address_zip: '81240',
  //       address_zip_check: 'unchecked',
  //       brand: 'Visa',
  //       country: 'US',
  //       cvc_check: 'unchecked',
  //       dynamic_last4: null,
  //       exp_month: 1,
  //       exp_year: 2024,
  //       funding: 'credit',
  //       last4: '4242',
  //       name: 'Dustin C Huth',
  //       tokenization_method: null
  //     },
  //     client_ip: '97.121.143.186',
  //     created: 1678855027,
  //     email: 'dustin@undefinedindustries.com',
  //     livemode: false,
  //     type: 'card',
  //     used: false,
  //     product: {
  //       id: '1',
  //       name: 'Season Pass',
  //       type: 'Pass',
  //       price: 300,
  //       image: 'src/Images/dustin.jpeg',
  //       description: 'All you can ride busfet'
  //     }
  //   }
  // }
  pool.connect((err, client, release) => {
      if (err) {
        return console.error('Error acquiring client', err.stack)
      }
      client.query(`
      INSERT INTO purchases (product_id, purchased_by_first, purchased_by_last, purchased_for_email, purchased_by_email, billing_zip, billing_address) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`, values
      , (err, result) => {
        release()
        if (err) {
          return console.error('Error executing query', err.stack)
        }
        console.log('result.rows ==>> ==>> ', result.rows);
        // {
          //   id: 8,
          //   product_id: 1,
          //   purchased_on: 2023-03-19T08:55:28.512Z,
          //   purchased_by_first: 'Season Pass',
          //   purchased_by_last: 'Season Pass',
          //   purchased_for_email: 'dustin@undefinedindustries.com',
          //   purchased_by_email: 'dustin@undefinedindustries.com',
          //   billing_zip: '81240',
          //   billing_address: 'PO BOX 909 PENROSE, CO 81240'
          // }
          if(result && result.rows){

        }

        res.status(200).json(result.rows)
      })
    })
})

router.patch('/:id', function(req, res, next){
  knex('purchases')
    .where('id', req.params.id)
    .update(req.body)
    .returning(['id', 'date', 'doors_time', 'startTime', 'venue', 'headliner', 'support1', 'support2', 'support3', 'headlinerImgLink', 'headlinerBio', 'meetsCriteria', 'isDenied', 'external'])
  .then((data) => {
    res.status(200).json(data[0])
  })
})

//Delete (delete one of the resource)
// router.delete('/:id', function(req, res, next){
//   knex('events')
//     .where('id', req.params.id)
//     .del('*')
//     .returning(['id', 'date', 'startTime', 'venue', 'headliner', 'support1', 'support2', 'support3', 'headlinerImgLink', 'headlinerBio', 'meetsCriteria', 'isDenied', 'external'])
//   .then((data) => {
//     res.status(200).json(data[0])
//   })
// })
module.exports = router;
