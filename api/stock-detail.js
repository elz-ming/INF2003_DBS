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

      // Find the stock document in MongoDB
      const stock = await Stock.findOne({ ticker });

      if (!stock) {
        return res.status(404).json({ error: "Stock not found" });
      }

      // Extract the latest price, ESG data, and related news
      const latestPrice =
        stock.prices?.length > 0
          ? stock.prices.reduce((latest, current) =>
              new Date(current.date) > new Date(latest.date) ? current : latest
            )
          : null;

      const esgData = stock.esg || null;
      const newsData = stock.news || [];

      // Send the results of all three queries as a single JSON response
      res.status(200).json({
        stockData: {
          longname: stock.longname,
          price: latestPrice?.regularmarketprice || null,
          volume: latestPrice?.volume || null,
          fiftyTwoWeekHigh: latestPrice?.fiftytwoweekhigh || null,
          fiftyTwoWeekLow: latestPrice?.fiftytwoweeklow || null,
          date: latestPrice?.date || null,
        },
        esgData: esgData
          ? {
              environmental_pillar_score: esgData.environment_pillar_score,
              social_pillar_score: esgData.social_pillar_score,
              governance_pillar_score: esgData.governance_pillar_score,
              date: esgData.date,
            }
          : null,
        newsData: newsData.map((news) => ({
          title: news.title,
          source: news.source,
          url: news.url,
          date: news.date,
        })),
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
