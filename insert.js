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
