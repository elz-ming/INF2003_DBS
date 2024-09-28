const db = require("../db"); // Import your database connection setup

module.exports = async (req, res) => {
  if (req.method === "GET") {
    try {
      // Query to fetch stock tickers from the stockdata table
      const result = await db.query(`
        SELECT DISTINCT stocks.ticker, stocks.longname, sentiments.sentiment, latest_price.regularmarketprice 
        FROM stocks
        JOIN sentiments
        ON stocks.ticker = sentiments.ticker
        JOIN (
          -- Subquery to get the latest price for each ticker
          SELECT prices.ticker, prices.regularmarketprice
          FROM prices
          JOIN (
            -- Subquery to get the latest date for each ticker
            SELECT ticker, MAX(date) AS date
            FROM prices
            GROUP BY ticker
          ) latest_date 
          ON prices.ticker = latest_date.ticker 
          AND prices.date = latest_date.date
          ORDER BY prices.date DESC
        ) latest_price
        ON stocks.ticker = latest_price.ticker;
      `);

      const rows = result.rows;

      // Send the tickers as a JSON response
      res.status(200).json(rows);
    } catch (error) {
      console.error("Error fetching stock data:", error);
      res.status(500).send("Internal Server Error");
    }
  } else {
    res.setHeader("Allow", ["GET"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
};
