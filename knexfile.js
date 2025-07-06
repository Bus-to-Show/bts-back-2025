'use strict';

const parse = require('pg-connection-string').parse;

require('dotenv').config();

module.exports = {
  client: 'pg',
  connection: parse(process.env.DATABASE_URL),
};
