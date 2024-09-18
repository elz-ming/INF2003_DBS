const https = require('https');
const insertStockNews = require('../insert').insertStockNews;
const moment = require('moment'); 

module.exports = async (req, res) => {
  const options = {
    method: 'GET',
    hostname: 'mboum-finance.p.rapidapi.com',
    port: null,
    path: '/v2/markets/news?tickers=AAPL&type=ALL',
    headers: {
      'x-rapidapi-key': 'c3dd0c1e20mshd942dc8a8d040e9p10f7cbjsnfa66d893170a',
      'x-rapidapi-host': 'mboum-finance.p.rapidapi.com',
    },
  };

  https.request(options, async (apiRes) => {
    const chunks = [];

    apiRes.on('data', (chunk) => {
      chunks.push(chunk);
    });

    apiRes.on('end', async () => {
      const body = Buffer.concat(chunks).toString();
      const newsData = JSON.parse(body);

      // Log the raw data
      console.log('Raw news data:', newsData);

      // Process only the first 10 articles
      for (let i = 0; i < Math.min(newsData.body.length, 10); i++) {
        const article = newsData.body[i];
        const { title, source, time, url, text, img, type, tickers, ago } = article;

        // Print raw time value for debugging
        console.log('Raw time value:', time);

        // Adjust time format parsing
        let formattedTime;
        try {
          formattedTime = moment(time, ["MMM D, YYYY, h:mm A z", "MMM D, YYYY, h:mm A"], true).toISOString();
          if (!moment(formattedTime).isValid()) {
            throw new Error(`Invalid time format: ${time}`);
          }
        } catch (err) {
          console.error('Error parsing time:', err.message);
          continue; // Skip this article if time parsing fails
        }

        const formattedDate = moment(formattedTime).format('YYYY-MM-DD'); 

        // Insert the news data into the database
        try {
          await insertStockNews(tickers[0], url, img, title, text, source, type, formattedTime, formattedDate, formattedAgo);
          console.log(`Inserted news: ${title}`);
        } catch (err) {
          console.error('Error inserting news:', err);
        }
      }

      res.status(200).json({ message: 'Stock news data processed successfully' });
    });
  }).on('error', (error) => {
    console.error('Error fetching news:', error);
    res.status(500).json({ error: 'Error fetching news' });
  }).end();
};
