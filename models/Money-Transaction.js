const mongoose = require("mongoose");

const moneyTransactionSchema = new mongoose.Schema({
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
    enum: ["deposit", "withdraw"], // Limits the type to 'deposit' or 'withdraw'
  },
  bank: {
    type: String,
    required: true,
  },
});

// Optional: create an index for efficient queries
moneyTransactionSchema.index({ user_id: 1, order_executed: -1 });

const MoneyTransaction = mongoose.model(
  "MoneyTransaction",
  moneyTransactionSchema
);

module.exports = MoneyTransaction;
