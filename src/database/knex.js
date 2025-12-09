const knex = require('knex');
const parse = require('pg-connection-string').parse;
const config = require('../config/index.js');

/**
 * Database connection module
 * Configures and exports Knex instance for database operations
 */

// Parse the database URL
const dbConfig = parse(config.database.url);

// Create Knex instance with configuration
const db = knex({
  client: 'pg',
  connection: dbConfig,
  pool: {
    min: 2,
    max: 10
  }
});

// Test database connection
db.raw('SELECT 1')
  .then(() => {
    if (config.env === 'development') {
      console.log('Database connection established successfully');
    }
  })
  .catch((err) => {
    console.error('Database connection failed:', err.message);
    // Don't exit process - let the application handle the error
  });

module.exports = db;
