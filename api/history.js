const jwt = require("jsonwebtoken");
const cookie = require("cookie");
const db = require("../db"); // Database setup (PostgreSQL and MongoDB)
const Stock = require("../models/Stock"); // MongoDB Stock model

const JWT_SECRET_KEY = process.env.JWT_SECRET_KEY;

module.exports = async (req, res) => {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  try {
    // Ensure MongoDB connection
    await db.connectToMongoDB();

    // Parse the cookie to get the auth token
    const cookies = cookie.parse(req.headers.cookie || "");
    const token = cookies.authToken;

    if (!token) {
      return res
        .status(401)
        .json({ error: "Unauthorized. No token provided." });
    }

    // Verify the token and extract userId
    const decoded = jwt.verify(token, JWT_SECRET_KEY);
    const userId = decoded.userId;

    // Fetch money transactions from PostgreSQL
    const moneyTransactionsQuery = `
      SELECT id, amount, order_executed, type AS transaction_type, bank
      FROM money_transactions
      WHERE user_id = $1
    `;
    const moneyTransactionsResult = await db.queryPostgres(
      moneyTransactionsQuery,
      [userId]
    );
    const moneyTransactions = moneyTransactionsResult.rows;

    // Fetch stock transactions from PostgreSQL
    const stockTransactionsQuery = `
      SELECT id, amount, order_executed, type AS transaction_type, price, quantity, stock_id
      FROM stock_transactions
      WHERE user_id = $1
    `;
    const stockTransactionsResult = await db.queryPostgres(
      stockTransactionsQuery,
      [userId]
    );
    const stockTransactions = stockTransactionsResult.rows;

    // Fetch stock details from MongoDB for the stock transactions
    const stockIds = stockTransactions.map(
      (transaction) => transaction.stock_id.replace(/^"|"$/g, "") // Remove quotes if present
    );

    const stocks = await Stock.find({
      _id: { $in: stockIds },
    }).lean();

    // Map stock IDs to their details for easy lookup
    const stockMap = stocks.reduce((acc, stock) => {
      acc[stock._id.toString()] = {
        ticker: stock.ticker,
        longname: stock.longname,
      };
      return acc;
    }, {});

    // Merge stock transactions with stock details
    const formattedStockTransactions = stockTransactions.map((transaction) => {
      const stockDetails = stockMap[transaction.stock_id.replace(/^"|"$/g, "")];
      return {
        id: transaction.id,
        amount: transaction.amount,
        order_executed: transaction.order_executed,
        transaction_type: transaction.transaction_type,
        price: transaction.price || null,
        quantity: transaction.quantity || null,
        ticker_code: stockDetails?.ticker || null,
        stock_name: stockDetails?.longname || null,
        bank: null, // Stock transactions don't include a bank field
      };
    });

    // Format money transactions
    const formattedMoneyTransactions = moneyTransactions.map((transaction) => ({
      id: transaction.id,
      amount: transaction.amount,
      order_executed: transaction.order_executed,
      transaction_type: transaction.transaction_type,
      price: null, // Money transactions don't include a price field
      quantity: null, // Money transactions don't include a quantity field
      ticker_code: null, // Money transactions don't include stock details
      stock_name: null, // Money transactions don't include stock details
      bank: transaction.bank || null,
    }));

    // Combine both transaction types
    const combinedTransactions = [
      ...formattedStockTransactions,
      ...formattedMoneyTransactions,
    ];

    // Sort transactions by order_executed date in descending order
    combinedTransactions.sort(
      (a, b) => new Date(b.order_executed) - new Date(a.order_executed)
    );

    // Send the final response
    res.status(200).json(combinedTransactions);
  } catch (err) {
    console.error("Error fetching transactions:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
