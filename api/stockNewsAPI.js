const https = require('https');
const moment = require('moment');
const { insertNewsData } = require('../insert'); // importing the function from the insert file

module.exports = async (req, res) => {
  const ticker = req.query.ticker || 'AAPL';

  const options = {
    method: 'GET',
    hostname: 'mboum-finance.p.rapidapi.com',
    port: null,
    path: `/v2/markets/news?tickers=${ticker}&type=ALL`, // later need to pass in the ticker value when the user clicks the individual page
    headers: {
      'x-rapidapi-key': process.env.RAPIDAPI_KEY,
      'x-rapidapi-host': 'mboum-finance.p.rapidapi.com',
    },
  };

  https.request(options, async (apiRes) => {
    const chunks = [];

    apiRes.on('data', (chunk) => {
      chunks.push(chunk);
    });

    apiRes.on('end', async () => {
      try {
        const body = Buffer.concat(chunks).toString();
        console.log('Full API response body:', body);

        const newsData = JSON.parse(body);
        console.log('Parsed news data:', newsData);

        const processedArticles = [];

        if (newsData.body && Array.isArray(newsData.body)) {
          console.log(`Found ${newsData.body.length} articles.`);

          for (let i = 0; i < Math.min(newsData.body.length, 10); i++) {
            const article = newsData.body[i];
            console.log('Processing article:', article);

            const { title, source, time, url, text, img, type, ago } = article;

            if (!time) {
              console.error('Time is undefined for article:', article);
              continue;
            }

            console.log('Raw time value:', time);

            let formattedTime;
            try {
              formattedTime = moment(time, 'MMM D, YYYY, h:mm A').toISOString();
              if (!moment(formattedTime).isValid()) {
                throw new Error(`Invalid time format: ${time}`);
              }
            } catch (err) {
              console.error('Error parsing time:', err.message);
              continue;
            }

            const formattedDate = moment(formattedTime).format('YYYY-MM-DD');

            const processedArticle = {
              ticker: ticker, 
              url,
              img: img || '', //handle missing img
              title,
              text: text || '', //handle missing text
              source,
              type,
              formattedTime,
              formattedDate,
              ago: ago || '', //handle missing 'ago' field
            };

            // inserting the processed information into the database table
            try {
              await insertNewsData(
                processedArticle.ticker,
                processedArticle.url,
                processedArticle.img,
                processedArticle.title,
                processedArticle.text,
                processedArticle.source,
                processedArticle.type,
                processedArticle.formattedTime,
                processedArticle.formattedDate,
                processedArticle.ago
              );
              console.log(`Inserted news article for ${ticker}: ${title}`);
            } catch (dbError) {
              console.error(`Error inserting news article for ${ticker}:`, dbError);
            }

            processedArticles.push(processedArticle);
          }
        } else {
          console.error('No valid articles found or response body is not an array');
        }

        console.log('Processed articles:', processedArticles);

        // Respond with all processed articles as JSON data
        res.status(200).json({ articles: processedArticles });
      } catch (error) {
        console.error('Error processing news data:', error);
        res.status(500).json({ error: 'Error processing news data' });
      }
    });
  }).on('error', (error) => {
    console.error('Error fetching news:', error);
    res.status(500).json({ error: 'Error fetching news' });
  }).end();
};
