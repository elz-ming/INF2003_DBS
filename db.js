const { Pool } = require("pg");
require("dotenv").config(); // Load environment variables from .env file

// Create a new pool of connections using environment variables
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

// Export the query function for executing SQL commands
module.exports = {
  query: (text, params) => pool.query(text, params),
};
