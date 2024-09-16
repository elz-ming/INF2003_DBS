const { Pool } = require("pg");
require("dotenv").config(); // Load environment variables from .env file

// Create a new pool of connections using environment variables
const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
  // Explicitly set SSL options based on the environment
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false, // Set false for local development
});

// Add error handling to log connection issues
pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

// Export the query function for executing SQL commands
module.exports = {
  query: (text, params) => pool.query(text, params),
};

