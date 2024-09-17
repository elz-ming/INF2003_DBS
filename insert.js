const db = require('./db');

// Function to insert sentiment analysis data into the database
const insertSentimentData = async (ticker, date, sentimentValue) => {
  try {
    await db.query(
      'INSERT INTO sentimentAnalysis (ticker, date, sentiment) VALUES ($1, $2, $3)',
      [ticker, date, sentimentValue]
    );
    console.log(`Inserted data for ${ticker}: Date=${date}, Sentiment=${sentimentValue}`);
  } catch (err) {
    console.error('Error inserting data:', err);
    throw err;
  }
};

module.exports = insertSentimentData;

// Function to insert stock data into the database
const insertStockData = async (ticker, longName, instrumentType, regularMarketPrice, fiftyTwoWeekHigh, fiftyTwoWeekLow, regularMarketDayHigh, regularMarketDayLow, regularMarketVolume, date, open, high, low, close, volume) => {
  try {
    await db.query(
      `INSERT INTO stockData 
      (ticker, longName, instrumentType, regularMarketPrice, fiftyTwoWeekHigh, fiftyTwoWeekLow, 
      regularMarketDayHigh, regularMarketDayLow, regularMarketVolume, date, open, high, low, close, volume) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`,
      [ticker, longName, instrumentType, regularMarketPrice, fiftyTwoWeekHigh, fiftyTwoWeekLow, 
      regularMarketDayHigh, regularMarketDayLow, regularMarketVolume, date, open, high, low, close, volume]
    );
    console.log(`Inserted stock data for ${ticker}`);
  } catch (err) {
    console.error('Error inserting stock data:', err);
    throw err;
  }
};

module.exports = insertStockData;
