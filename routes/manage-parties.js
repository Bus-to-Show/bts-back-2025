'use strict';

const express = require('express');
const router = express.Router();

// Parse the environment variable into an object
const parse = require("pg-connection-string").parse;
const pgconfig = parse(process.env.DATABASE_URL);

const Pool = require('pg').Pool;
const pool = new Pool(pgconfig);

//List (get all of the parties with manage details)
router.get('/:id', (req, res, next) => {
  pool.connect((err, client, release) => {
    if (err) {
      console.error(err);
      res.status(500).json({message: 'An unknown error occurred.'});
      return;
    }

    client.query(`
      WITH active AS (SELECT DISTINCT pp.id AS party_id, pp."lastBusDepartureTime", pp."firstBusLoadTime", pp."partyPrice", pp."inCart", pp.capacity
        , pl.id AS loc_id
        , COALESCE(
        (SELECT COUNT(reservations.id) FROM reservations
        WHERE pp.id = reservations."pickupPartiesId"
        AND  reservations.status IN (1, 2)), 0) AS reservations
        , TRUE AS created
        FROM  pickup_locations pl
        right join  pickup_parties pp ON pl.id = pp."pickupLocationId"
        WHERE pp."eventId" = ${req.params.id})
      SELECT DISTINCT pl.id AS location_id, pl.city, pl."locationName", pl."type", ${req.params.id} AS eventId, active.*
      FROM pickup_locations pl
      FULL OUTER JOIN pickup_parties pp ON pl.id = pp."pickupLocationId"
      FULL OUTER JOIN active
      ON pl.id = active.loc_id
      WHERE pl."type" != 'unpublished'
      ORDER BY active.created, pl."type", pl.id
    `, (err, result) => {
      release();

      if (err) {
        console.error(err);
        res.status(500).json({message: 'An unknown error occurred.'});
        return;
      }

      res.status(200).json(result.rows);
    });
  });
});

router.patch('/:id', (req, res) => {
  pool.connect((err, client, release) => {
    if (err) {
      console.error(err);
      res.status(500).json({message: 'An unknown error occurred.'});
      return;
    }

    client.query(`
      UPDATE pickup_parties
      SET capacity = ${req.body.capacity}
      WHERE id = ${req.params.id}
      RETURNING *
    `, (err, result) => {
      release();

      if (err) {
        console.error(err);
        res.status(500).json({message: 'An unknown error occurred.'});
        return;
      }

      res.status(200).json(result.rows);
    });
  });
});

router.put('/:id', (req, res) => {
  pool.connect((err, client, release) => {
    if (err) {
      console.error(err);
      res.status(500).json({message: 'An unknown error occurred.'});
      return;
    }

    const partyBody = {
      id: req.body.party_id,
      eventId: req.body.eventid,
      pickupLocationId: req.body.location_id,
      lastBusDepartureTime: req.body.lastBusDepartureTime,
      firstBusLoadTime: req.body.firstBusLoadTime,
      partyPrice: req.body.partyPrice,
      capacity: req.body.capacity,
    };

    if (partyBody.capacity == null) partyBody.capacity = 0;
    if (partyBody.partyPrice == null) partyBody.partyPrice = 30;
    if (partyBody.lastBusDepartureTime == null) partyBody.lastBusDepartureTime = '17:30';
    if (partyBody.firstBusLoadTime == null) partyBody.firstBusLoadTime = partyBody.lastBusDepartureTime;

    const updateQuery = `
      UPDATE pickup_parties SET "lastBusDepartureTime" = '${partyBody.lastBusDepartureTime}',
        "firstBusLoadTime" = '${partyBody.firstBusLoadTime}',
        "partyPrice" = ${partyBody.partyPrice},
        capacity = ${partyBody.capacity},
        updated_at = CURRENT_TIMESTAMP
      WHERE pickup_parties.id = ${partyBody.id}
      AND pickup_parties."eventId" = ${partyBody.eventId}
      AND pickup_parties."pickupLocationId" = ${partyBody.pickupLocationId}
      RETURNING *
    `;

    const insertQuery = `
      INSERT INTO pickup_parties("eventId", "pickupLocationId", "lastBusDepartureTime", "firstBusLoadTime", "partyPrice", "capacity", created_at, updated_at)
      VALUES(${partyBody.eventId}, ${partyBody.pickupLocationId}, '${partyBody.lastBusDepartureTime}', '${partyBody.firstBusLoadTime}', ${partyBody.partyPrice}, ${partyBody.capacity}, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP )
      ON CONFLICT (id)
      DO
        UPDATE SET "lastBusDepartureTime" = '${partyBody.lastBusDepartureTime}',
          "firstBusLoadTime" = '${partyBody.firstBusLoadTime}',
          "partyPrice" = ${partyBody.partyPrice},
          capacity = ${partyBody.capacity},
          updated_at = CURRENT_TIMESTAMP
      WHERE pickup_parties.id = ${partyBody.id}
      AND pickup_parties."eventId" = ${partyBody.eventId}
      AND pickup_parties."pickupLocationId" = ${partyBody.pickupLocationId}
      RETURNING *
    `;

    const homeMadeUpsertQuery = partyBody.id ?  updateQuery : insertQuery;

    client.query(`${homeMadeUpsertQuery}`, (err, result) => {
      release();

      if (err) {
        console.error(err);
        res.status(500).json({message: 'An unknown error occurred.'});
        return;
      }

      res.status(200).json(result.rows);
    });
  });
});

module.exports = router;
