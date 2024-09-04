const { Pool } = require("pg");
require("dotenv").config(); // Load environment variables from .env file

// Create a new pool of connections using environment variables
const pool = new Pool({
  user: process.env.POSTGRES_USER,
  host: process.env.POSTGRES_HOST,
  database: process.env.POSTGRES_NAME,
  password: process.env.POSTGRES_PASSWORD,
  port: process.env.POSTGRES_PORT,
});

// Export the query function for executing SQL commands
module.exports = {
  query: (text, params) => pool.query(text, params),
};
