const http = require('https');
const insertSentimentData = require('../insert'); // Adjust the path as needed

// using a dictionary for the top 20 ticker codes
const ticker_codes = {
    1: "AAPL",
    2: "MSFT",
    3: "NVDA",
    4: "AMZN",
    5: "GOOGL",
    6: "META",
    7: "BRK.B",
    8: "LLY",
    9: "AVGO",
    10: "TSM",
    11: "TSLA",
    12: "WMT",
    13: "NVO",
    14: "JPM",
    15: "UNH",
    16: "V",
    17: "XOM",
    18: "MA",
    19: "ORCL",
    20: "PG"
};

export default async function handler(req, res) {
  const promises = [];

  for (const [key, ticker] of Object.entries(ticker_codes)) {
    const options = {
      method: 'GET',
      hostname: 'us-stocks-news-sentiment-data.p.rapidapi.com',
      port: null,
      path: `/${ticker}?dateTo=2024-09-02&dateFrom=2024-09-02`,
      headers: {
        'x-rapidapi-key': process.env.RAPIDAPI_KEY, // this one will affect zw and i because we using differnt api keys
        'x-rapidapi-host': 'us-stocks-news-sentiment-data.p.rapidapi.com'
      }
    };

    const promise = new Promise((resolve, reject) => {
      const reqSentiment = http.request(options, async (response) => {
        const chunks = [];

        response.on('data', (chunk) => {
          chunks.push(chunk);
        });

        response.on('end', async () => {
          try {
            const body = Buffer.concat(chunks);
            const data = JSON.parse(body.toString());

            if (data.sentiments && data.sentiments.length > 0) {
              for (const sentiment of data.sentiments) {
                const sentimentValue = sentiment.sentimentValue;
                const sentimentDate = sentiment.date;

                // this will help to insert the json data into the database, the insertSentimentData function is defined in the insert.js
                await insertSentimentData(ticker, sentimentDate, sentimentValue);
              }
            }

            resolve(data);
          } catch (err) {
            reject(err);
          }
        });
      });

      reqSentiment.on('error', (error) => {
        reject(error);
      });

      reqSentiment.end();
    });

    promises.push(promise);
  }

  Promise.all(promises)
    .then((responses) => {
      res.status(200).json(responses);
    })
    .catch((error) => {
      res.status(500).json({ error: error.message });
    });
}
