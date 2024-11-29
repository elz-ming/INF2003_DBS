const db = require("../db"); // Import your database connection setup
const Stock = require("../models/Stock");

module.exports = async (req, res) => {
  if (req.method === "GET") {
    try {
      // Query to fetch stock tickers from the stockdata table
      const result = await Stock.aggregate([
        {
          $project: {
            ticker: 1,
            longname: 1,
            sentimentValue: "$sentiment.value", // Extract sentiment value
            latestPrice: {
              $arrayElemAt: [
                {
                  $filter: {
                    input: "$prices",
                    as: "price",
                    cond: {
                      $eq: ["$$price.date", { $max: "$prices.date" }],
                    },
                  },
                },
                0,
              ],
            },
          },
        },
        {
          $project: {
            ticker: 1,
            longname: 1,
            sentimentValue: 1,
            regularmarketprice: "$latestPrice.regularmarketprice", // Extract latest price
          },
        },
      ]);

      // Send the tickers as a JSON response
      res.status(200).json(result);
    } catch (error) {
      console.error("Error fetching stock data:", error);
      res.status(500).send("Internal Server Error");
    }
  } else {
    res.setHeader("Allow", ["GET"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
};
