const https = require('https');
const { Pool } = require('pg');

// PostgreSQL connection setup
const pool = new Pool({
  connectionString: process.env.POSTGRES_URL, // Ensure this is set in your .env file or Vercel environment
  ssl: {
    rejectUnauthorized: false, // Required for some cloud-hosted PostgreSQL services like Heroku
  },
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

      // Prepare data for insertion into PostgreSQL
      const esgData = {
        symbol: parsedData.symbol || 'AAPL',
        totalEsg: parsedData.totalEsg || null,
        environmentScore: parsedData.environmentScore || null,
        socialScore: parsedData.socialScore || null,
        governanceScore: parsedData.governanceScore || null,
      };

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