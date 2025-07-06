'use strict';

const express = require('express');
const router = express.Router();
const knex = require('../knex.js');

// Get all
router.get('/', (req, res, next) => {
  knex('events')
    .select('id', 'date', 'startTime', 'venue', 'headliner', 'support1', 'support2', 'support3', 'headlinerImgLink', 'headlinerBio', 'meetsCriteria', 'isDenied', 'external')
    .then(data => res.status(200).json(data));
});

// Get upcoming
router.get('/upcoming', (req, res, next) => {
  const today = new Date().toLocaleDateString('en-US');

  knex('events')
    .select('id', 'date', 'startTime', 'venue', 'headliner', 'support1', 'support2', 'support3', 'headlinerImgLink', 'headlinerBio', 'meetsCriteria', 'isDenied', 'external')
    .whereRaw('date::date >= ?', today)
    .orderByRaw('date::date')
    .then(data => res.status(200).json(data));
});

// Get one
router.get('/:id', (req, res, next) => {
  knex('events')
    .select('id', 'date', 'startTime', 'venue', 'headliner', 'support1', 'support2', 'support3', 'headlinerImgLink', 'headlinerBio', 'meetsCriteria', 'isDenied', 'external')
    .where('id', req.params.id)
    .then(data => res.status(200).json(data[0]));
});

// Create
router.post('/', (req, res, next) => {
  if (!req.body.startTime) req.body.startTime = '18:00:00';

  knex('events')
    .insert(req.body)
    .returning(['id', 'date', 'startTime', 'venue', 'headliner', 'support1', 'support2', 'support3', 'headlinerImgLink', 'headlinerBio', 'meetsCriteria', 'isDenied', 'external'])
    .then(data => res.status(200).json(data[0]));
});

// Update
router.patch('/:id', (req, res, next) => {
  knex('events')
    .where('id', req.params.id)
    .update(req.body)
    .returning(['id', 'date', 'startTime', 'venue', 'headliner', 'support1', 'support2', 'support3', 'headlinerImgLink', 'headlinerBio', 'meetsCriteria', 'isDenied', 'external'])
    .then(data => res.status(200).json(data[0]));
});

// Delete
// router.delete('/:id', (req, res, next) => {
//   knex('events')
//     .where('id', req.params.id)
//     .del('*')
//     .returning(['id', 'date', 'startTime', 'venue', 'headliner', 'support1', 'support2', 'support3', 'headlinerImgLink', 'headlinerBio', 'meetsCriteria', 'isDenied', 'external'])
//     .then(data => res.status(200).json(data[0]));
// });

module.exports = router;
