const db = require('./db');

// Function to insert or update sentiment analysis data into the database
const insertSentimentData = async (ticker, date, sentimentValue) => {
  try {
    await db.query(
      `INSERT INTO sentiment_analysis (ticker, date, sentiment)
       VALUES ($1, $2, $3)
       ON CONFLICT (ticker) 
       DO UPDATE SET sentiment = EXCLUDED.sentiment, date = $2`, 
      [ticker, date, sentimentValue]
    );
    console.log(`Upserted data for ${ticker}: Date=${date}, Sentiment=${sentimentValue}`);
  } catch (err) {
    console.error('Error inserting or updating data:', err);
    throw err;
  }
};

// Function to insert stock data into the database
const insertStockData = async (ticker, longName, instrumentType, regularMarketPrice, fiftyTwoWeekHigh, fiftyTwoWeekLow, regularMarketDayHigh, regularMarketDayLow, regularMarketVolume, date, open, high, low, close, volume) => {
  try {
    await db.query(
      `INSERT INTO stock_data 
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

// Function to insert news data into the database
const insertNewsData = async (ticker, url, img, title, text, source, type, time, date, ago) => {
  try {
    await db.query(
      `INSERT INTO stock_news (ticker, url, img, title, text, source, type, time, date, ago)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       ON CONFLICT (ticker, url) 
       DO NOTHING`, 
      [ticker, url, img, title, text, source, type, time, date, ago]
    );
    console.log(`Inserted news data for ${ticker}: ${title}`);
  } catch (err) {
    console.error('Error inserting news data:', err);
    throw err;
  }
};

// Export all functions
module.exports = {
  insertSentimentData,
  insertStockData,
  insertNewsData
};
