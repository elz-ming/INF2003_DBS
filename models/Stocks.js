const mongoose = require("mongoose");
const { Schema } = mongoose;

// Define sub-schemas for embedded documents
const SentimentSchema = new Schema({
  value: { type: Number, required: true },
  date: { type: Date, required: true },
});

const EsgSchema = new Schema({
  environment_pillar_score: { type: Number, required: true },
  social_pillar_score: { type: Number, required: true },
  governance_pillar_score: { type: Number, required: true },
  date: { type: Date, required: true },
});

const PriceSchema = new Schema({
  regularmarketprice: { type: Number, required: true },
  volume: { type: Number, required: true },
  fiftytwoweekhigh: { type: Number, required: true },
  fiftytwoweeklow: { type: Number, required: true },
  date: { type: Date, required: true },
});

const NewsSchema = new Schema({
  date: { type: Date, required: true },
  source: { type: String, required: true },
  title: { type: String, required: true },
  url: { type: String, required: true },
});

// Main Stock Schema
const StockSchema = new Schema({
  _id: { type: String, required: true },
  ticker: { type: String, required: true },
  longname: { type: String, required: true },
  sentiment: SentimentSchema,
  esg: EsgSchema,
  prices: [PriceSchema],
  news: [NewsSchema],
});

// Create and export the model
StockSchema.index({ ticker: 1 }, { unique: true });

const Stock = mongoose.model("Stock", StockSchema);

module.exports = Stock;
