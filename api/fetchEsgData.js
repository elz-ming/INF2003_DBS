require("dotenv").config(); // Ensure this is at the top to load .env variables

const https = require('https');
const { Pool } = require('pg');

// PostgreSQL connection setup
const pool = new Pool({
  connectionString: process.env.POSTGRES_URL, // Using the environment variable for connection
  ssl: false, // Disable SSL for local development
});

// Company names for the companies
const companies = {
  1: { name: "Apple Inc." },
  2: { name: "Microsoft Corporation" },
  3: { name: "Tesla, Inc." },
  4: { name: "Amazon.com, Inc." },
  5: { name: "Alphabet Inc." },
};

// Function to store the ESG data in PostgreSQL
async function insertESGData(data) {
  const queryText = `
    INSERT INTO esg_scores (companyname, industry, country, exchangename, ticker_code, year, overall_score, overall_transparency_score, environmental_pillar_score, social_pillar_score, governance_pillar_score, overall_score_global_rank, overall_industry_rank, overall_region_rank, latest_score_date)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
    RETURNING *;
  `;

  const values = [
    data.companyname,
    data.industry,
    data.country,
    data.exchangename,
    data.ticker_code,
    data.year,
    data.overall_score,
    data.overall_transparency_score,
    data.environmental_pillar_score,
    data.social_pillar_score,
    data.governance_pillar_score,
    data.overall_score_global_rank,
    data.overall_industry_rank,
    data.overall_region_rank,
    data.latest_score_date
  ];

  try {
    const result = await pool.query(queryText, values);
    console.log('Data inserted successfully for', data.companyname, ':', result.rows[0]);
  } catch (err) {
    console.error('Error inserting data into PostgreSQL for', data.companyname, ':', err.message);
  }
}

// Function to fetch ESG data from the API using a query parameter
function fetchESGData(companyName) {
  return new Promise((resolve, reject) => {
    const encodedCompanyName = encodeURIComponent(companyName); // URL-encode the company name for the query param

    const options = {
      method: 'GET',
      hostname: 'gaialens-esg-scores.p.rapidapi.com',
      port: null,
      path: `/scores?companyname=${encodedCompanyName}`, // Use query parameter for company name
      headers: {
        'x-rapidapi-key': process.env.RAPIDAPI_KEY, // Use the environment variable for the API key
        'x-rapidapi-host': 'gaialens-esg-scores.p.rapidapi.com',
      },
    };

    const req = https.request(options, (res) => {
      const chunks = [];

      res.on('data', (chunk) => {
        chunks.push(chunk);
      });

      res.on('end', async () => {
        const body = Buffer.concat(chunks).toString();
        console.log('Raw API response:', body); // Log the raw response to inspect

        try {
          // Parse the response body as JSON
          const parsedData = JSON.parse(body);

          if (Array.isArray(parsedData) && parsedData.length > 0) {
            const data = parsedData[0]; // Access the first (and only) item in the array

            // Prepare data for insertion into PostgreSQL
            const esgData = {
              companyname: data.companyname,
              industry: data.industry || null,
              country: data.country || null,
              exchangename: data.exchangename || null,
              ticker_code: data.tickersymbol || null,
              year: data.Year || null,
              overall_score: data['Overall Score'] || null,
              overall_transparency_score: data['Overall Transparency Score'] || null,
              environmental_pillar_score: data['Environmental Pillar Score'] || null,
              social_pillar_score: data['Social Pillar Score'] || null,
              governance_pillar_score: data['Governance Pillar Score'] || null,
              overall_score_global_rank: data['Overall Score Global Rank'] || null,
              overall_industry_rank: data['Overall Industry Rank'] || null,
              overall_region_rank: data['Overall Region Rank'] || null,
              latest_score_date: data['Latest Score Date'] || null,
            };

            resolve(esgData);
          } else {
            reject(new Error('No data found in API response'));
          }
        } catch (err) {
          console.error('Error parsing ESG data for', companyName, ':', err.message);
          reject(err);
        }
      });
    });

    req.on('error', (error) => {
      console.error('Error with the API request for', companyName, ':', error.message);
      reject(error);
    });

    req.end();
  });
}

// Loop through all companies and fetch ESG data for each, then insert into PostgreSQL
async function fetchAndInsertAllESGData() {
  for (const key in companies) {
    if (companies.hasOwnProperty(key)) {
      const company = companies[key].name;  // Use company name for API calls
      
      try {
        const esgData = await fetchESGData(company); // Fetch ESG data for each company using company name as a query param
        await insertESGData(esgData); // Insert ESG data into PostgreSQL
      } catch (err) {
        console.error('Error fetching and inserting data for', company, ':', err.message);
      }
    }
  }

  // Close the PostgreSQL connection only after all data has been inserted
  pool.end();
}

// Start fetching and inserting ESG data for all companies
fetchAndInsertAllESGData().then(() => {
  console.log("Finished fetching and inserting ESG data for all companies.");
}).catch((err) => {
  console.error('Error during the fetch and insert process:', err.message);
  pool.end(); // Close the PostgreSQL connection on error
});
