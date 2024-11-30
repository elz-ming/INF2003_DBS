const db = require("../db"); // Import database setup
const Stock = require("../models/Stock");

module.exports = async (req, res) => {
  if (req.method === "GET") {
    try {
      // Ensure MongoDB connection
      await db.connectToMongoDB();

      // Aggregation pipeline
      const stocks = await Stock.aggregate([
        {
          $project: {
            ticker: 1,
            longname: 1,
            sentimentValue: "$sentiment.value",
            latestPrice: {
              $arrayElemAt: ["$prices", -1], // Get the last price in the prices array
            },
          },
        },
        {
          $project: {
            ticker: 1,
            longname: 1,
            sentimentValue: 1,
            regularmarketprice: "$latestPrice.regularmarketprice",
          },
        },
      ]);

      // Check if stocks were found
      if (!stocks || stocks.length === 0) {
        return res.status(404).json({
          success: false,
          message: "No stock data found.",
        });
      }

      // Respond with stocks data
      res.status(200).json({
        success: true,
        data: stocks,
      });
    } catch (error) {
      console.error("Error fetching stock data:", error);

      // Return detailed error for debugging
      res.status(500).json({
        success: false,
        message: "Internal Server Error",
        error: error.message,
      });
    }
  } else {
    // Handle unsupported methods
    res.setHeader("Allow", ["GET"]);
    res.status(405).json({
      success: false,
      message: `Method ${req.method} Not Allowed`,
    });
  }
};
