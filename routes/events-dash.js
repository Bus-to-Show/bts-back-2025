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
        SELECT e.id,
        e.date,
        e."startTime",
        e.doors_time,
        e.venue,
        e.headliner,
        e.support1,
        e.support2,
        e.support3,
        e."headlinerBio",
        e."headlinerImgLink",
        e."meetsCriteria",
        e."isDenied",
        e.external,
        e.created_at,
        e.updated_at,
        e.date::date AS sort_date,
        COALESCE(( SELECT sum(pp.capacity) AS sum
              FROM pickup_parties pp
              WHERE pp."eventId" = e.id), 0::bigint) AS capacity,
        COALESCE( 
          (SELECT count(reservations.id) AS count
              FROM reservations
                JOIN pickup_parties pp ON pp.id = reservations."pickupPartiesId"
              WHERE e.id = pp."eventId" AND reservations.status = ANY (ARRAY[1, 2])
          )
      
      + (SELECT SUM(pp2."inCart") FROM pickup_parties pp2 WHERE pp2."eventId" = e.id)
        , 0::bigint) AS reservations,
        CURRENT_DATE AS refreshed_at
      FROM events e
      WHERE to_date(e.date::text, 'MM/DD/YYYY'::text) >= (current_date - INTERVAL '1 day')::date
      GROUP BY e.id
      ORDER BY (e.date::date)
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
            knex('events')
                .select('id', 'date', 'doors_time', 'startTime', 'venue', 'headliner', 'support1', 'support2', 'support3', 'headlinerImgLink', 'headlinerBio', 'meetsCriteria', 'isDenied', 'external')
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
    .returning(['id', 'date', 'doors_time', 'startTime', 'venue', 'headliner', 'support1', 'support2', 'support3', 'headlinerImgLink', 'headlinerBio', 'meetsCriteria', 'isDenied', 'external'])
  .then((data) => {
    res.status(200).json(data[0])
  })
})

router.patch('/:id', function(req, res, next){
  knex('events')
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
