// Update with your config settings.
require('dotenv').config();

// in your knexfile.js
// Should come with install of pg 
const parse = require("pg-connection-string").parse;
// Parse the environment variable into an object
const pgconfig = parse(process.env.DATABASE_URL);
// Add SSL setting to default environment variable

module.exports = {

  development: {  
    client: "pg",  
    connection: pgconfig
    
    // client: 'pg',
    // connection: {
    //   host: process.env.DATABASE_URL,
    //   user: process.env.DATABASE_URL,
    //   password: process.env.DATABASE_URL,
    //   database: process.env.DATABASE_URL,
    //   ssl: {rejectUnauthorized: false}
  },
  // development: {
  //   client: 'pg',
  //   connection: 'postgresql://localhost:5432/bts_q3'
  // },
  test: {
    client: 'pg',
    connection: 'postgresql://localhost:5432/bts_q3_test'
  },
  production: {
    client: 'pg',
    connection: pgconfig
  },
}


