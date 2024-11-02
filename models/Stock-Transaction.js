const mongoose = require("mongoose");

const stockTransactionSchema = new mongoose.Schema({
  amount: {
    type: Number,
    required: true,
  },
  order_executed: {
    type: Date,
    default: Date.now, // Sets the current timestamp
  },
  user_id: {
    type: String, // Use ObjectId for referencing
    required: true,
    ref: "User", // Reference to User collection
  },
  type: {
    type: String,
    required: true,
    enum: ["buy", "sell"], // Limits the type to 'buy' or 'sell'
  },
  stock_id: {
    type: String, // Use ObjectId for referencing
    required: true,
    ref: "Stock", // Reference to Stock collection
  },
  price: {
    type: Number,
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
  },
});

// Optional: create an index for efficient queries
stockTransactionSchema.index({ user_id: 1, stock_id: 1, order_executed: -1 });

const StockTransaction = mongoose.model(
  "StockTransaction",
  stockTransactionSchema
);

module.exports = StockTransaction;
