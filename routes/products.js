'use strict';

const express = require('express');
const router = express.Router();
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
        select * from products where status not in ('hidden')
        `, (err, result) => {
          release()
          if (err) {
            return console.error('Error executing query', err.stack)
          }
          res.status(200).json(result.rows)
        })
      })

  })
  
  module.exports = router;

