const { Pool } = require('pg');
require('dotenv').config();

// PostgreSQL connection setup
const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
  ssl: {
    rejectUnauthorized: false // For cloud-hosted PostgreSQL services, remove this for local connections
  },
});

// Vercel API route
export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      // Query the database for stock name (symbol) and ESG score
      const queryText = 'SELECT symbol, total_esg FROM esg_scores';
      const result = await pool.query(queryText);

      // Send the results back as JSON
      res.status(200).json(result.rows);
    } catch (error) {
      console.error("Error fetching data from PostgreSQL:", error.message);
      res.status(500).json({ error: "Error fetching data." });
    }
  } else {
    // Only allow GET requests
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
