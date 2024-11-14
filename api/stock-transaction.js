const jwt = require("jsonwebtoken");
const cookie = require("cookie");
const db = require("../db");
const Portfolio = require("../models/Portfolio");

const JWT_SECRET_KEY = process.env.JWT_SECRET_KEY;

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  try {
    const { action, amount, quantity, ticker } = req.body;
    if (!action || !amount || !quantity || !ticker) {
      return res.status(400).json({ error: "Missing required fields." });
    }

    // Parse and verify JWT token
    const cookies = req.headers.cookie ? cookie.parse(req.headers.cookie) : {};
    const token = cookies.authToken;
    if (!token) {
      return res.status(401).json({ error: "Unauthorized. No token provided." });
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
      `SELECT stocks.id, prices.regularmarketprice 
       FROM stocks
       JOIN prices ON stocks.ticker = prices.ticker 
       WHERE stocks.ticker = $1`,
      [ticker]
    );

    if (read_result.rows.length === 0) {
      return res.status(404).json({ error: "Stock not found." });
    }

    const stockId = read_result.rows[0].id;
    const price = read_result.rows[0].regularmarketprice;

    await db.query("BEGIN"); // Start transaction

    if (action === "sell") {
      try {
        // Lock portfolio for the current user and stock
        const portfolioCheck = await db.query(
          "SELECT quantity FROM portfolios WHERE user_id = $1 AND stock_id = $2 FOR UPDATE",
          [userId, stockId]
        );
        const currentQuantity = portfolioCheck.rows[0]?.quantity || 0;

        if (currentQuantity < quantity) {
          await db.query("ROLLBACK");
          return res.status(400).json({ error: "Insufficient stock quantity to sell." });
        }

        // Update user's wallet balance
        const sellQuery = `UPDATE users SET wallet_balance = wallet_balance + $1 WHERE id = $2 RETURNING wallet_balance`;
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
          WHERE user_id = $1 AND stock_id = $2
        `;
        const portfolioValues = [userId, stockId, quantity];

        const [sellResult, transactionResult, updateResult] = await Promise.all([
          db.query(sellQuery, sellValues),
          db.query(insertTransactionQuery, transactionValues),
          db.query(updatePortfolioQuery, portfolioValues)
        ]);

        if (updateResult.rowCount === 0) {
          await db.query("ROLLBACK");
          return res.status(400).json({ error: "Failed to update portfolio." });
        }

        await db.query("COMMIT");
        return res.status(200).json({ success: true, message: "Sell transaction completed." });

      } catch (error) {
        console.error("Error during sell transaction:", error);
        await db.query("ROLLBACK");
        return res.status(500).json({ error: "Internal server error during sell transaction." });
      }
    } else if (action === "buy") {
      try {
        // Lock user's balance row
        const balanceCheck = await db.query(
          "SELECT wallet_balance FROM users WHERE id = $1 FOR UPDATE",
          [userId]
        );
        const currentBalance = balanceCheck.rows[0]?.wallet_balance || 0;

        if (currentBalance < amount) {
          await db.query("ROLLBACK");
          return res.status(400).json({ error: "Insufficient balance to buy." });
        }

        // Update user's wallet balance
        const buyQuery = `UPDATE users SET wallet_balance = wallet_balance - $1 WHERE id = $2 RETURNING wallet_balance`;
        const buyValues = [amount, userId];

        // Insert buy transaction record
        const insertTransactionQuery = `
          INSERT INTO stock_transactions (amount, user_id, type, stock_id, price, quantity)
          VALUES ($1, $2, 'buy', $3, $4, $5)
        `;
        const transactionValues = [amount, userId, stockId, price, quantity];

        // Update portfolio
        const insertPortfolioQuery = `
          INSERT INTO portfolios (user_id, stock_id, quantity)
          VALUES ($1, $2, $3)
          ON CONFLICT (user_id, stock_id)
          DO UPDATE SET quantity = portfolios.quantity + EXCLUDED.quantity
        `;
        const portfolioValues = [userId, stockId, quantity];

        await Promise.all([
          db.query(buyQuery, buyValues),
          db.query(insertTransactionQuery, transactionValues),
          db.query(insertPortfolioQuery, portfolioValues)
        ]);

        await db.query("COMMIT");
        return res.status(200).json({ success: true, message: "Buy transaction completed." });

      } catch (error) {
        console.error("Error during buy transaction:", error);
        await db.query("ROLLBACK");
        return res.status(500).json({ error: "Internal server error during buy transaction." });
      }
    } else {
      return res.status(400).json({ error: "Invalid action." });
    }
  } catch (error) {
    console.error("General error:", error);
    await db.query("ROLLBACK");
    return res.status(500).json({ error: "Internal server error." });
  }
};
