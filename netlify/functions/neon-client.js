const { Pool } = require('pg');
require('dotenv').config();

// Get the connection string from environment variables
const connectionString = process.env.NEON_CONNECTION_STRING;

// Create a new pool using the connection string
const pool = new Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: false
  }
});

// Export the pool for use in other files
module.exports = {
  pool,
  query: (text, params) => pool.query(text, params),
};
