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
router.get('/', function(req, res, next){
  knex('pickup_parties')
    .select('*')
  .then((data) => {
    res.status(200).json(data)
  })
})

//Read (get one of the resource)
// Get One
router.get('/:id', function(req, res, next){
  knex('pickup_parties')
    .select('*')
    .where('id', req.params.id)
  .then((data) => {
    res.status(200).json(data[0])
  })
})

//Get one pickup party for an eventId and pickupLocationId
router.patch('/findId', function(req, res, next){
  console.log('pickup_parties/${pickupPartyId}/cartQty req.params => ', req.params)
  knex('pickup_parties')
    .where({'pickupLocationId': req.body.pickupLocationId, 'eventId': req.body.eventId})
    .returning(['*'])
  .then((data) => {
    res.status(200).json(data[0])
  })
})

// Get all pickup parties for one eventId
router.patch('/findParties', function(req, res, next){
  knex('pickup_parties')
    .select('*')
    .where({'eventId': req.body.eventId})
    .returning(['*'])
  .then((data) => {
    res.status(200).json(data)
  })
})

//Create (create one of the resource)
router.post('/', function(req, res, next){
  knex('pickup_parties')
    .insert(req.body)
    .returning(['*'])
  .then((data) => {
    res.status(200).json(data[0])
  })
})

router.patch('/:id', function(req, res, next){
  knex('pickup_parties')
    .where('id', req.params.id)
    .update(req.body)
    .returning(['*'])
  .then((data) => {
    res.status(200).json(data[0])
  })
})

router.patch('/:id/cartQty/', function(req, res, next){
  console.log(req.params, '<<<<---req.params cartQty')
  console.log(req.body, '<<<<---req.body cartQty')
  knex('pickup_parties')
    .select('*')
    .where({'id': req.params.id})
    .increment('inCart', req.body.inCart)
    .update('updated_at', req.body.updated_at)
    .returning(['*'])
  .then((data) => {
    console.log('router.patch(/:id/cartQty/ response data::: ', data)
    res.status(200).json(data[0])
  })
})

//Delete (delete one of the resource)
// router.delete('/:id', function(req, res, next){
//   knex('pickup_parties')
//     .where('id', req.params.id)
//     .del('*')
//     .returning(['*'])
//   .then((data) => {
//     res.status(200).json(data[0])
//   })
// })

module.exports = router;
