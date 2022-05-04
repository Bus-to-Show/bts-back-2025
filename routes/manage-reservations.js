'use strict';
const express = require('express');
const { update } = require('../knex');
const router = express.Router();

const whitelist = process.env.ORIGIN_URL.split(' ')
// Parse the environment variable into an object
const parse = require("pg-connection-string").parse;
const pgconfig = parse(process.env.DATABASE_URL);
pgconfig.ssl = { rejectUnauthorized: false };
const Pool = require('pg').Pool
const pool = new Pool(pgconfig)

//List (get all of the reservations by location)
router.get('/:id', (req, res, next) => {
    (whitelist.indexOf(req.headers.origin) === -1)
    ?
    setTimeout(() => {
          res.sendStatus(404)
        }, 2000)
    :
    pool.connect((err, client, release) => {
        if (err) {
          return console.error('Error acquiring client', err.stack)
        }

        client.query(`

        SELECT * FROM reservations where reservations."pickupPartiesId" = ${req.params.id}
        ORDER BY reservations."willCallLastName", reservations."willCallFirstName" 
        
        `, (err, result) => {
          release()
          if (err) {
            return console.error('Error executing query', err.stack)
          }
          res.status(200).json(result.rows)
        })
      })

  })


  router.patch('/:id', function(req, res, next){
    (whitelist.indexOf(req.headers.origin) === -1)
    ?
    setTimeout(() => {
          res.sendStatus(404)
        }, 2000)
    :
    pool.connect((err, client, release) => {
        if (err) {
          return console.error('Error acquiring client', err.stack)
        }
        client.query(` 
            UPDATE reservations
            SET status = ${req.body.status}
            WHERE id = ${req.params.id}
            RETURNING *
        ;
        `, (err, result) => {
          release()
          if (err) {
            return console.error('Error executing query', err.stack)
          }
          res.status(200).json(result.rows)
        })
      })
  })

  router.put('/:id', function(req, res, next){
    (whitelist.indexOf(req.headers.origin) === -1)
    ?
    setTimeout(() => {
          res.sendStatus(404)
        }, 2000)
    :
    pool.connect((err, client, release) => {
        if (err) {
          return console.error('Error acquiring client', err.stack)
        }
        

        // const partyBody = {
        //     id: req.body.party_id,
        //     eventId: req.body.eventid,
        //     pickupLocationId: req.body.location_id,
        //     lastBusDepartureTime: req.body.lastBusDepartureTime,
        //     firstBusLoadTime: req.body.firstBusLoadTime,
        //     partyPrice: req.body.partyPrice,
        //     capacity: req.body.capacity,
        //   }
          
        //   if(partyBody.capacity == null) partyBody.capacity = 0
        //   if(partyBody.partyPrice == null) partyBody.partyPrice = 30
        //   if(partyBody.lastBusDepartureTime == null) partyBody.lastBusDepartureTime = '17:30'
        //   if(partyBody.firstBusLoadTime == null) partyBody.firstBusLoadTime = partyBody.lastBusDepartureTime

        // const {id, eventId, pickupLocationId, lastBusDepartureTime, firstBusLoadTime, partyPrice, capacity, created_at, updated_at} = req.body
        const updateQuery = `

                ;`

        const insertQuery = `

                ;`
        const homeMadeUpsertQuery = partyBody.id ?  updateQuery : insertQuery; 
        client.query(`${homeMadeUpsertQuery}`, (err, result) => {
          release()
          if (err) {
            throw new Error('Error executing query', err.stack)
          }
          res.status(200).json(result.rows)
        })

      })
  })


  module.exports = router;
