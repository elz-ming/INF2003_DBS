const db = require("../db"); // Import your database connection setup

module.exports = async (req, res) => {
  if (req.method === "GET") {
    try {
      // Query to fetch stock tickers from the stockdata table
      const result = await db.query(`
        SELECT s.ticker,
                s.longname,
                sa.sentiment,
                s.regularmarketprice 
        FROM stocks s
        JOIN (
          SELECT ticker, 
                  sentiment
          FROM 
            sentiments
          WHERE 
              (ticker, date) IN (
                  SELECT 
                      ticker, 
                      MAX(date) AS latest_date
                  FROM 
                      sentiments
                  GROUP BY 
                      ticker
            )
        ) sa 
         ON s.ticker = sa.ticker;
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
