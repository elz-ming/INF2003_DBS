require("dotenv").config(); // Ensure this is at the top to load .env variables

// Log the POSTGRES_URL to check if it's being loaded correctly
console.log("Postgres URL:", process.env.POSTGRES_URL);

const https = require('https');
const { Pool } = require('pg');

// PostgreSQL connection setup
const pool = new Pool({
  connectionString: process.env.POSTGRES_URL, // Using the environment variable for connection
  ssl: false, // Disable SSL for local development
});

// API call options
const options = {
  method: 'GET',
  hostname: 'yahoo-finance127.p.rapidapi.com',
  port: null,
  path: '/esg-scores/aapl',
  headers: {
    'x-rapidapi-key': '3b8176f567mshfe182ece9bca3e9p10225ejsn9c9dc605c7e7',
    'x-rapidapi-host': 'yahoo-finance127.p.rapidapi.com',
  },
};

// Function to store the ESG data in PostgreSQL
async function insertESGData(data) {
  const queryText = `
    INSERT INTO esg_scores (symbol, total_esg, environment_score, social_score, governance_score)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *;
  `;
  
  const values = [
    data.symbol,
    data.totalEsg,
    data.environmentScore,
    data.socialScore,
    data.governanceScore,
  ];

  try {
    const result = await pool.query(queryText, values);
    console.log('Data inserted successfully:', result.rows[0]);
  } catch (err) {
    console.error('Error inserting data into PostgreSQL:', err.message);
  } finally {
    await pool.end(); // Close the PostgreSQL connection
  }
}

// Function to fetch data from the ESG API
const req = https.request(options, (res) => {
  const chunks = [];

  res.on('data', (chunk) => {
    chunks.push(chunk);
  });

  res.on('end', async () => {
    const body = Buffer.concat(chunks).toString();
    
    try {
      // Parse the response body as JSON
      const parsedData = JSON.parse(body);

      // Log the parsed API response to verify the data
      console.log('API Response:', parsedData);

      // Prepare data for insertion into PostgreSQL by extracting the raw values
      const esgData = {
        symbol: 'AAPL', // Since the symbol is not in the API response, we set it manually
        totalEsg: parsedData.totalEsg?.raw || null,
        environmentScore: parsedData.environmentScore?.raw || null,
        socialScore: parsedData.socialScore?.raw || null,
        governanceScore: parsedData.governanceScore?.raw || null,
      };

      // Log the esgData object to check if it's being populated correctly
      console.log('Prepared ESG Data for Insertion:', esgData);

      // Insert data into PostgreSQL
      await insertESGData(esgData);

    } catch (err) {
      console.error('Error parsing or inserting ESG data:', err.message);
    }
  });
});

req.on('error', (error) => {
  console.error('Error with the API request:', error.message);
});

req.end();
