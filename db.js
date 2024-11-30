const { Pool } = require("pg");
const mongoose = require("mongoose");
require("dotenv").config(); // Load environment variables

// PostgreSQL Configuration
const postgresPool = new Pool({
  connectionString: process.env.POSTGRES_URL,
  ssl:
    process.env.NODE_ENV === "production"
      ? { rejectUnauthorized: false }
      : false, // Enable SSL in production
});

// PostgreSQL Error Handling
postgresPool.on("error", (err) => {
  console.error("Unexpected error on idle PostgreSQL client", err);
  process.exit(-1); // Exit if there's a persistent error
});

// Function to execute PostgreSQL queries
async function queryPostgres(queryText, params) {
  try {
    const result = await postgresPool.query(queryText, params);
    return result;
  } catch (error) {
    console.error("PostgreSQL Query Error:", error);
    throw error;
  }
}

// MongoDB Connection Setup
let isMongoConnected = false;

async function connectToMongoDB() {
  try {
    if (!isMongoConnected) {
      await mongoose.connect(process.env.MONGODB_URI, {
        bufferCommands: true, // Allow buffering until the connection is ready
        serverSelectionTimeoutMS: 30000, // 30 seconds
        maxPoolSize: 10, // Set connection pool size
      });
      isMongoConnected = true; // Prevent multiple connections
    }
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
    process.exit(1);
  }
}

// Export Both PostgreSQL and MongoDB
module.exports = {
  queryPostgres, // Function to query PostgreSQL
  connectToMongoDB, // Function to connect to MongoDB
  mongoose, // Export Mongoose for model definition
};
