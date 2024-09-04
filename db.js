const { Pool } = require("pg");
require("dotenv").config(); // Load environment variables from .env file

// Create a new pool of connections using environment variables
const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
});

// Export the query function for executing SQL commands
module.exports = {
  query: (text, params) => pool.query(text, params),
};
