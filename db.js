const { Pool } = require("pg");
const mongoose = require("mongoose"); // MongoDB library
require("dotenv").config(); // Load environment variables from .env file

// Create a new pool of connections using environment variables
const postgresPool = new Pool({
  connectionString: process.env.POSTGRES_URL,
  // Explicitly set SSL options based on the environment
  ssl:
    process.env.NODE_ENV === "production"
      ? { rejectUnauthorized: false }
      : false, // Set false for local development
});

// Add error handling to log connection issues
postgresPool.on("error", (err) => {
  console.error("Unexpected error on idle client", err);
  process.exit(-1);
});

async function connectToMongoDB() {
  mongoose
    .connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })
    .then(() => console.log("Connected to MongoDB Atlas"))
    .catch((err) => console.error("Connection error:", err));
}

connectToMongoDB();

// Export the query function for executing SQL commands
module.exports = {
  // PostgreSQL query function
  query: (text, params) => postgresPool.query(text, params),

  // MongoDB connection (useful if you need to access it elsewhere)
  mongoose,
};
