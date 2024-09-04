const { Pool } = require("pg");

const pool = new Pool({
  user: "postgres", // Replace with your PostgreSQL username
  host: "localhost",
  database: "INF2003_local", // Replace with your database name
  password: "postgres", // Replace with your PostgreSQL password
  port: 5432, // Default PostgreSQL port
});

module.exports = {
  query: (text, params) => pool.query(text, params),
};
