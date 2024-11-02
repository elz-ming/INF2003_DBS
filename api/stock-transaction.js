const jwt = require("jsonwebtoken");
const cookie = require("cookie");
const db = require("../db");
const Portfolio = require("../models/Portfolio");
const StockTransaction = require("../models/Stock-Transaction");

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
    const read_result = await db.query(
      `SELECT stocks.id, 
                prices.regularmarketprice 
      FROM stocks
      JOIN prices
      ON stocks.ticker = prices.ticker 
      WHERE stocks.ticker = $1`,
      [ticker]
    );

    if (read_result.rows.length === 0) {
      return res.status(404).json({ error: "Stock not found." });
    }

    const read_row = read_result.rows[0];
    const stockId = read_row.id;
    const price = read_row.regularmarketprice;

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

        // Update portfolio
        const updatePortfolioQuery = `
          UPDATE portfolios
          SET quantity = quantity - $3
          WHERE user_id = $1 AND stock_id = $2 AND quantity >= $3
        `;
        const portfolioValues = [userId, stockId, quantity];

        const portfolio = await Portfolio.findOne({
          user_id: userId,
          stock_id: stockId,
          quantity: { $gte: quantity }, // Ensure quantity is sufficient
        });

        if (!portfolio) {
          return res
            .status(400)
            .json({ error: "Insufficient stock quantity to sell." });
        }

        // Proceed with inserting the sell transaction record
        const mongoSellTransaction = await StockTransaction.create({
          amount: amount,
          user_id: userId, // This should be an ObjectId
          type: "sell",
          stock_id: stockId, // This should also be an ObjectId
          price: price,
          quantity: quantity,
        });

        // Update portfolio to decrement the quantity
        const mongoSell = await Portfolio.findOneAndUpdate(
          { user_id: userId, stock_id: stockId },
          { $inc: { quantity: -quantity } },
          { new: true }
        );

        // Execute the queries concurrently using Promise.all
        const [sellResult, transactionResult, updateResult] = await Promise.all(
          [
            db.query(sellQuery, sellValues),
            db.query(insertTransactionQuery, transactionValues),
            db.query(updatePortfolioQuery, portfolioValues),
          ]
        );

        if (updateResult.rowCount === 0) {
          return res
            .status(400)
            .json({ error: "Insufficient stock quantity to sell." });
        }

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

        // Insert buy transaction record in MongoDB
        const mongoBuyTransaction = await StockTransaction.create({
          amount: amount,
          user_id: userId, // This should be an ObjectId
          type: "buy",
          stock_id: stockId, // This should also be an ObjectId
          price: price,
          quantity: quantity,
        });

        // Insert or update portfolio record
        const insertPortfolioQuery = `
          INSERT INTO portfolios (user_id, stock_id, quantity)
          VALUES ($1, $2, $3)
          ON CONFLICT (user_id, stock_id)
          DO UPDATE SET quantity = portfolios.quantity + EXCLUDED.quantity;
        `;
        const portfolioValues = [userId, stockId, quantity];

        // Insert or update portfolio record in MongoDB
        const mongoBuy = await Portfolio.findOneAndUpdate(
          { user_id: userId, stock_id: stockId },
          { $inc: { quantity } },
          { upsert: true, new: true }
        );

        // Execute the queries concurrently using Promise.all
        const [buyResult, transactionResult, portfolioResult] =
          await Promise.all([
            db.query(buyQuery, buyValues),
            db.query(insertTransactionQuery, transactionValues),
            db.query(insertPortfolioQuery, portfolioValues),
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
