const express = require("express");
const path = require("path");
const { Pool } = require("pg");
require("dotenv").config(); // Load environment variables from .env file

const app = express();
const PORT = process.env.PORT || 3000;

// Database connection setup using environment variables
const pool = new Pool({
  user: process.env.DB_USER, // Replace with your PostgreSQL username
  host: process.env.DB_HOST,
  database: process.env.DB_NAME, // Replace with your database name
  password: process.env.DB_PASSWORD, // Replace with your PostgreSQL password
  port: process.env.DB_PORT, // Default PostgreSQL port
});

// Middleware to parse JSON
app.use(express.json());

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, "public")));

// Sample route to fetch data from PostgreSQL
app.get("/data", async (req, res) => {
  try {
    const result = await db.query("SELECT * FROM users"); // Replace 'your_table' with your actual table name
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
