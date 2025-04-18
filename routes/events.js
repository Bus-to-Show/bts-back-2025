'use strict';

const express = require('express');
const router = express.Router();
const knex = require('../knex.js')



//List (get all of the resource)
router.get('/', function(req, res, next){
  knex('events')
    .select('id', 'date', 'startTime', 'venue', 'headliner', 'support1', 'support2', 'support3', 'headlinerImgLink', 'headlinerBio', 'meetsCriteria', 'isDenied', 'external')
  .then((data) => {
    res.status(200).json(data)
  })
})

//Read (get one of the resource)
// Get One
router.get('/:id', function(req, res, next){
  knex('events')
    .select('id', 'date', 'startTime', 'venue', 'headliner', 'support1', 'support2', 'support3', 'headlinerImgLink', 'headlinerBio', 'meetsCriteria', 'isDenied', 'external')
    .where('id', req.params.id)
  .then((data) => {
    res.status(200).json(data[0])
  })
})

//Create (create one of the resource)
router.post('/', function(req, res, next){
  if (!req.body.startTime) req.body.startTime = '18:00:00'
  knex('events')
    .insert(req.body)
    .returning(['id', 'date', 'startTime', 'venue', 'headliner', 'support1', 'support2', 'support3', 'headlinerImgLink', 'headlinerBio', 'meetsCriteria', 'isDenied', 'external'])
  .then((data) => {
    res.status(200).json(data[0])
  })
})

router.patch('/:id', function(req, res, next){
  console.log('is events.patch getting hit? ', req.params)
  knex('events')
    .where('id', req.params.id)
    .update(req.body)
    .returning(['id', 'date', 'startTime', 'venue', 'headliner', 'support1', 'support2', 'support3', 'headlinerImgLink', 'headlinerBio', 'meetsCriteria', 'isDenied', 'external'])
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
