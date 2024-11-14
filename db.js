const { Pool } = require("pg");
const mongoose = require("mongoose"); // MongoDB library
require("dotenv").config(); // Load environment variables from .env file

// Create a new pool of connections using environment variables
const postgresPool = new Pool({
  connectionString: process.env.POSTGRES_URL,
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

// Function to close the PostgreSQL connection pool
async function endPostgresConnection() {
  try {
    await postgresPool.end();
    console.log("PostgreSQL connection pool closed.");
  } catch (error) {
    console.error("Error closing PostgreSQL connection pool:", error);
  }
}

// MongoDB connection function
async function connectToMongoDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("Connected to MongoDB Atlas");
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
    process.exit(1);
  }
}

// Connect to MongoDB
connectToMongoDB();

// Export the query function for PostgreSQL and the end function
module.exports = {
  query: (text, params) => postgresPool.query(text, params),
  end: endPostgresConnection, // Added end function to close PostgreSQL connections
  mongoose,
};
