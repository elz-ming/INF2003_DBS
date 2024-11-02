const jwt = require("jsonwebtoken");
const cookie = require("cookie");
const db = require("../db"); // Import the SQL database connection
const StockTransaction = require("../models/Stock-Transaction"); // Import the StockTransaction model
const MoneyTransaction = require("../models/Money-Transaction"); // Import the MoneyTransaction model

const JWT_SECRET_KEY = process.env.JWT_SECRET_KEY;

module.exports = async (req, res) => {
  if (req.method === "GET") {
    const cookies = req.headers.cookie ? cookie.parse(req.headers.cookie) : {};
    const token = cookies.authToken;

    try {
      const decoded = jwt.verify(token, JWT_SECRET_KEY);
      const userId = decoded.userId;

      // Fetch stock transactions from MongoDB
      const stockTransactions = await StockTransaction.find({
        user_id: userId,
      });

      // Fetch money transactions from MongoDB
      const moneyTransactions = await MoneyTransaction.find({
        user_id: userId,
      });

      // Create an array to hold stock IDs from the stock transactions
      const stockIds = stockTransactions.map((tx) => tx.stock_id);

      // Fetch stock details from SQL
      const stockDetailsQuery = `
        SELECT id, ticker, longname 
        FROM stocks 
        WHERE id = ANY($1::uuid[])
      `;
      const stockDetailsValues = [stockIds];
      const stockDetailsResult = await db.query(
        stockDetailsQuery,
        stockDetailsValues
      );
      const stockDetailsMap = new Map(
        stockDetailsResult.rows.map((stock) => [stock.id, stock])
      );

      // Combine stock transactions with stock details
      const combinedStockTransactions = stockTransactions.map((tx) => ({
        id: tx._id,
        amount: tx.amount,
        order_executed: tx.order_executed,
        transaction_type: tx.type,
        price: tx.price,
        quantity: tx.quantity,
        ticker_code: stockDetailsMap.get(tx.stock_id)?.ticker || null,
        stock_name: stockDetailsMap.get(tx.stock_id)?.longname || null,
        bank: null, // No bank info for stock transactions
      }));

      // Combine with money transactions
      const combinedTransactions = [
        ...combinedStockTransactions,
        ...moneyTransactions.map((tx) => ({
          id: tx._id,
          amount: tx.amount,
          order_executed: tx.order_executed,
          transaction_type: tx.type,
          price: null, // No price for money transactions
          quantity: null, // No quantity for money transactions
          ticker_code: null, // No ticker for money transactions
          stock_name: null, // No stock name for money transactions
          bank: tx.bank, // Bank info from money transaction
        })),
      ];

      // Sort combined transactions by order_executed descending
      combinedTransactions.sort(
        (a, b) => new Date(b.order_executed) - new Date(a.order_executed)
      );

      res.status(200).json(combinedTransactions);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Server Error", message: err.message });
    }
  } else {
    res.setHeader("Allow", ["GET"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
};
