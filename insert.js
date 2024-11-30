const db = require("./db");

// Function to insert or update sentiment analysis data into the database
const insertSentimentData = async (ticker, date, sentimentValue) => {
  try {
    await db.queryPostgres(
      `INSERT INTO sentiments (ticker, date, sentiment)
       VALUES ($1, $2, $3)
       ON CONFLICT (ticker) 
       DO UPDATE SET sentiment = EXCLUDED.sentiment, date = $2`,
      [ticker, date, sentimentValue]
    );
    console.log(
      `Upserted data for ${ticker}: Date=${date}, Sentiment=${sentimentValue}`
    );
  } catch (err) {
    console.error("Error inserting or updating data:", err);
    throw err;
  }
};

// Function to insert price data into the database
const insertPriceData = async (
  ticker,
  regularMarketPrice,
  fiftyTwoWeekHigh,
  fiftyTwoWeekLow,
  regularMarketDayHigh,
  regularMarketDayLow,
  regularMarketVolume,
  date,
  open,
  high,
  low,
  close,
  volume
) => {
  try {
    await db.queryPostgres(
      `INSERT INTO prices 
      (ticker, regularMarketPrice, fiftyTwoWeekHigh, fiftyTwoWeekLow, 
      regularMarketDayHigh, regularMarketDayLow, regularMarketVolume, 
      date, open, high, low, close, volume) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      ON CONFLICT (ticker, date) 
      DO NOTHING`,
      [
        ticker,
        regularMarketPrice,
        fiftyTwoWeekHigh,
        fiftyTwoWeekLow,
        regularMarketDayHigh,
        regularMarketDayLow,
        regularMarketVolume,
        date,
        open,
        high,
        low,
        close,
        volume,
      ]
    );
    console.log(`Inserted price data for ${ticker}`);
  } catch (err) {
    console.error("Error inserting price data:", err);
    throw err;
  }
};

// Function to insert news data into the database
const insertNewsData = async (
  ticker,
  url,
  img,
  title,
  text,
  source,
  type,
  time,
  date,
  ago
) => {
  try {
    await db.queryPostgres(
      `INSERT INTO news (ticker, url, img, title, text, source, type, time, date, ago)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       ON CONFLICT (ticker, url) 
       DO NOTHING`,
      [ticker, url, img, title, text, source, type, time, date, ago]
    );
    console.log(`Inserted news data for ${ticker}: ${title}`);
  } catch (err) {
    console.error("Error inserting news data:", err);
    throw err;
  }
};

// Export all functions
module.exports = {
  insertSentimentData,
  insertPriceData,
  insertNewsData,
};
