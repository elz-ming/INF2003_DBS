const jwt = require("jsonwebtoken");
const cookie = require("cookie");
const db = require("../db");
const Stock = require("../models/Stock");
const Portfolio = require("../models/Portfolio");

const JWT_SECRET_KEY = process.env.JWT_SECRET_KEY;

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  try {
    // Extract required fields from the request body
    const { action, amount, quantity, ticker } = req.body;
    if (!action || !amount || !quantity || !ticker) {
      return res.status(400).json({ error: "Missing required fields." });
    }

    // Parse and verify JWT token
    const cookies = req.headers.cookie ? cookie.parse(req.headers.cookie) : {};
    const token = cookies.authToken;
    if (!token) {
      return res
        .status(401)
        .json({ error: "Unauthorized. No token provided." });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET_KEY);
    } catch (err) {
      return res.status(401).json({ error: "Invalid or expired token." });
    }

    const userId = decoded.userId;

    // Retrieve stock details
    const stock = await Stock.findOne({ ticker }).select("id prices").lean();

    if (!stock) {
      return res.status(404).json({ error: "Stock not found." });
    }

    // Extract the latest price from the prices array
    const latestPrice =
      stock.prices?.length > 0
        ? stock.prices[stock.prices.length - 1].regularmarketprice
        : null;

    if (!latestPrice) {
      return res
        .status(404)
        .json({ error: "No price data available for this stock." });
    }

    const stockId = stock._id; // MongoDB document ID
    const price = latestPrice;

    if (action === "sell") {
      // Handle Sell Action
      try {
        // Update user's wallet balance
        const sellQuery = `UPDATE users SET wallet_balance = wallet_balance + $1 WHERE id = $2`;
        const sellValues = [amount, userId];

        // Insert sell transaction record
        const insertTransactionQuery = `
          INSERT INTO stock_transactions (amount, user_id, type, stock_id, price, quantity)
          VALUES ($1, $2, 'sell', $3, $4, $5)
        `;
        const transactionValues = [amount, userId, stockId, price, quantity];

        // Update portfolio in MongoDB
        const mongoSell = await Portfolio.findOneAndUpdate(
          { user_id: userId, stock_id: stockId },
          { $inc: { quantity: -quantity } },
          { new: true }
        );

        if (!mongoSell || mongoSell.quantity < 0) {
          return res
            .status(400)
            .json({ error: "Insufficient stock quantity to sell." });
        }

        // Execute the queries concurrently using Promise.all
        const [sellResult, transactionResult] = await Promise.all([
          db.query(sellQuery, sellValues),
          db.query(insertTransactionQuery, transactionValues),
        ]);

        return res
          .status(200)
          .json({ success: true, message: "Sell transaction completed." });
      } catch (error) {
        console.error("Error during sell transaction:", error);
        return res
          .status(500)
          .json({ error: "Internal server error during sell transaction." });
      }
    } else if (action === "buy") {
      // Handle Buy Action
      try {
        // Update user's wallet balance
        const buyQuery = `UPDATE users SET wallet_balance = wallet_balance - $1 WHERE id = $2`;
        const buyValues = [amount, userId];

        // Insert buy transaction record
        const insertTransactionQuery = `
          INSERT INTO stock_transactions (amount, user_id, type, stock_id, price, quantity)
          VALUES ($1, $2, 'buy', $3, $4, $5)
        `;
        const transactionValues = [amount, userId, stockId, price, quantity];

        // Insert or update portfolio record in MongoDB
        const mongoBuy = await Portfolio.findOneAndUpdate(
          { user_id: userId, stock_id: stockId },
          { $inc: { quantity } },
          { upsert: true, new: true }
        );

        // Execute the queries concurrently using Promise.all
        const [buyResult, transactionResult] = await Promise.all([
          db.query(buyQuery, buyValues),
          db.query(insertTransactionQuery, transactionValues),
        ]);

        return res
          .status(200)
          .json({ success: true, message: "Buy transaction completed." });
      } catch (error) {
        console.error("Error during buy transaction:", error);
        return res
          .status(500)
          .json({ error: "Internal server error during buy transaction." });
      }
    } else {
      // Handle invalid action type
      return res
        .status(400)
        .json({ error: "Invalid action. Only 'buy' or 'sell' are allowed." });
    }
  } catch (error) {
    console.error("General error:", error);
    return res.status(500).json({ error: "Internal server error." });
  }
};
