const jwt = require("jsonwebtoken");
const cookie = require("cookie");
const db = require("../db");
const Stock = require("../models/Stock");
const Portfolio = require("../models/Portfolio");

const JWT_SECRET_KEY = process.env.JWT_SECRET_KEY;

// MongoDB Helper Function: Update Portfolio
async function updatePortfolio(userId, stockId, quantityChange) {
  try {
    // Ensure stockId is a valid ObjectId
    if (!db.mongoose.Types.ObjectId.isValid(stockId)) {
      throw new Error(`Invalid stock ID: ${stockId}`);
    }

    // Update or insert the portfolio record
    const portfolioUpdate = await Portfolio.findOneAndUpdate(
      { user_id: userId, stock_id: stockId },
      { $inc: { quantity: quantityChange } }, // Increment or decrement quantity
      { upsert: true, new: true } // Create a new record if none exists, and return the updated document
    );

    if (!portfolioUpdate) {
      throw new Error("Failed to update portfolio");
    }

    // Check for negative quantity
    if (portfolioUpdate.quantity < 0) {
      throw new Error("Insufficient stock quantity. Transaction rolled back.");
    }

    return portfolioUpdate;
  } catch (error) {
    console.error("Error updating portfolio:", error);
    throw error;
  }
}

// MongoDB Helper Function: Get Stock Details
async function getStockDetails(ticker) {
  try {
    const stock = await Stock.findOne({ ticker }).select("id prices").lean();
    if (!stock) {
      throw new Error("Stock not found");
    }

    // Extract the latest price
    const latestPrice =
      stock.prices?.length > 0
        ? stock.prices[stock.prices.length - 1].regularmarketprice
        : null;

    if (!latestPrice) {
      throw new Error("No price data available for the stock");
    }

    return { stockId: stock._id, latestPrice };
  } catch (error) {
    console.error("Error fetching stock details:", error);
    throw error;
  }
}

module.exports = async (req, res) => {
  await db.connectToMongoDB();
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
      try {
        // Update portfolio
        const mongoSell = await updatePortfolio(userId, stockId, -quantity);

        // Ensure wallet balance and transaction record are updated atomically
        const sellQuery = `UPDATE users SET wallet_balance = wallet_balance + $1 WHERE id = $2`;
        const transactionQuery = `
          INSERT INTO stock_transactions (amount, user_id, type, stock_id, price, quantity)
          VALUES ($1, $2, 'sell', $3, $4, $5)
        `;

        await Promise.all([
          db.queryPostgres(sellQuery, [amount, userId]),
          db.queryPostgres(transactionQuery, [
            amount,
            userId,
            stockId,
            price,
            quantity,
          ]),
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
      try {
        // Update portfolio
        const mongoBuy = await updatePortfolio(userId, stockId, quantity);

        // Ensure wallet balance and transaction record are updated atomically
        const buyQuery = `UPDATE users SET wallet_balance = wallet_balance - $1 WHERE id = $2`;
        const transactionQuery = `
          INSERT INTO stock_transactions (amount, user_id, type, stock_id, price, quantity)
          VALUES ($1, $2, 'buy', $3, $4, $5)
        `;

        await Promise.all([
          db.queryPostgres(buyQuery, [amount, userId]),
          db.queryPostgres(transactionQuery, [
            amount,
            userId,
            stockId,
            price,
            quantity,
          ]),
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
