const db = require("../db"); // Import your database connection setup

module.exports = async (req, res) => {
  if (req.method === "GET") {
    try {
      // Extract the ticker from the query parameter, e.g., /api/stock?ticker=AAPL
      const { ticker } = req.query;

      // Check if the ticker is provided; if not, respond with an error
      if (!ticker) {
        return res.status(400).json({ error: "Ticker is required" });
      }

      // Use Promise.all to run the queries concurrently
      const [stockData, esgData, newsData] = await Promise.all([
        // Query 1: Fetch stock data
        db.query(
          `
          SELECT stocks.longname,
                  prices.regularmarketprice, 
                  prices.volume,
                  prices.fiftytwoweekhigh,
                  prices.fiftytwoweeklow,
                  prices.date
          FROM stocks
          JOIN prices
          ON prices.ticker = stocks.ticker
          WHERE stocks.ticker = $1
          ORDER BY prices.date DESC
          LIMIT 1;
        `,
          [ticker]
        ),

        // Query 2: Fetch ESG data
        db.query(
          `
          SELECT environmental_pillar_score, 
                 social_pillar_score, 
                 governance_pillar_score
          FROM esg
          WHERE ticker = $1;
        `,
          [ticker]
        ),

        // Query 3: Fetch related news
        db.query(
          `
          SELECT title,
                 source,
                 url,
                 date
          FROM news
          WHERE ticker = $1;
        `,
          [ticker]
        ),
      ]);

      // Send the results of all three queries as a single JSON response
      res.status(200).json({
        stockData: stockData.rows[0], // Only take the latest row if available
        esgData: esgData.rows[0], // Can have multiple rows depending on the data
        newsData: newsData.rows, // Can have multiple rows depending on the data
      });
    } catch (error) {
      // Send an error response if something goes wrong
      console.error("Error fetching data:", error);
      res.status(500).json({ error: "An error occurred while fetching data" });
    }
  } else {
    // If the request method is not GET, return a 405 Method Not Allowed status
    res.setHeader("Allow", ["GET"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
};
