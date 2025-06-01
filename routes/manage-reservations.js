'use strict';

const express = require('express');
const router = express.Router();

// Parse the environment variable into an object
const parse = require("pg-connection-string").parse;
const pgconfig = parse(process.env.DATABASE_URL);

const Pool = require('pg').Pool;
const pool = new Pool(pgconfig);

//List (get all of the reservations by location)
router.get('/:id', (req, res) => {
  pool.connect((err, client, release) => {
    if (err) {
      console.error(err);
      res.status(500).json({message: 'An unknown error occurred.'});
      return;
    }

    client.query(`
      SELECT * FROM reservations where reservations."pickupPartiesId" = ${req.params.id}
      ORDER BY reservations."willCallLastName", reservations."willCallFirstName", reservations."id"
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

//List (get all of the orders by party)
router.get('/orders-by-party/:id', (req, res) => {
  pool.connect((err, client, release) => {
    if (err) {
      console.error(err);
      res.status(500).json({message: 'An unknown error occurred.'});
      return;
    }

    const query =  `
      SELECT reservations.id as id, reservations.* , orders."orderedByFirstName", orders."orderedByLastName", orders."orderedByEmail", orders."userId"  FROM reservations
      JOIN orders on reservations."orderId" = orders.id
      where reservations."pickupPartiesId" = ${req.params.id}
      ORDER BY orders."orderedByLastName", orders."orderedByFirstName", reservations."willCallLastName", reservations."willCallFirstName", reservations."id"
    `;

    client.query(query, (err, result) => {
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
      UPDATE reservations
      SET status = ${req.body.status}
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

    const updateQuery = `...`;
    const insertQuery = `...`;
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
