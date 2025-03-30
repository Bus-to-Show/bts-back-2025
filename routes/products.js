'use strict';

require('dotenv').config();
const express = require('express');
const router = express.Router();
const cookieParser = require('cookie-parser')
const knex = require('../knex.js')
const whitelist = process.env.ORIGIN_URL.split(' ')
// Parse the environment variable into an object
const parse = require("pg-connection-string").parse;
const pgconfig = parse(process.env.DATABASE_URL);

const Pool = require('pg').Pool
const pool = new Pool(pgconfig)

//List (get all of the resource)
router.get('/', (req, res, next) => {
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

