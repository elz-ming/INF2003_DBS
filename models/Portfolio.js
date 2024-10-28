const mongoose = require("mongoose");

const portfolioSchema = new mongoose.Schema({
  user_id: {
    type: String,
    required: true,
    ref: "User",
  },
  stock_id: {
    type: String,
    required: true,
    ref: "Stock",
  },
  quantity: {
    type: Number,
    required: true,
  },
});

portfolioSchema.index({ user_id: 1, stock_id: 1 }, { unique: true });

const Portfolio = mongoose.model("Portfolio", portfolioSchema);

module.exports = Portfolio;
