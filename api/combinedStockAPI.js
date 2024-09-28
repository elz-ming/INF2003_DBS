const https = require("https");
const moment = require("moment");
const {
  insertNewsData,
  insertSentimentData,
  insertPriceData,
} = require("../insert"); // Importing the required functions

// This helps to check the current date and format it accordingly to the last weekday of the market
function getLastMarketDay(date) {
  const day = date.getDay();
  if (day === 1) {
    // Monday
    date.setDate(date.getDate() - 3); // Go back to Friday
  } else if (day === 0) {
    // Sunday
    date.setDate(date.getDate() - 2); // Go back to Friday
  } else if (day === 6) {
    // Saturday
    date.setDate(date.getDate() - 1); // Go back to Friday
  } else {
    // Tuesday to Friday
    date.setDate(date.getDate() - 1); // Go back one day
  }
  return date;
}

function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0"); // Months are zero-based
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

const ticker_codes = {
  1: "AAPL",
  2: "MSFT",
  3: "AMZN",
  4: "GOOGL",
  5: "TSLA",
};

module.exports = async (req, res) => {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  let today = new Date();
  today = getLastMarketDay(today); // Get the last market day if today is a weekend
  const formattedDate = formatDate(today);

  try {
    const allProcessedArticles = []; // Array to hold all processed news articles
    const allSentimentData = []; // Array to hold all sentiment data
    const pricePromises = []; // Array to hold promises for price data

    for (const ticker of Object.values(ticker_codes)) {
      // Fetch news data
      const newsOptions = {
        method: "GET",
        hostname: "mboum-finance.p.rapidapi.com",
        port: null,
        path: `/v2/markets/news?tickers=${ticker}&type=ALL`,
        headers: {
          "x-rapidapi-key": process.env.RAPIDAPI_KEY,
          "x-rapidapi-host": "mboum-finance.p.rapidapi.com",
        },
      };

      const newsData = await new Promise((resolve, reject) => {
        https
          .request(newsOptions, (apiRes) => {
            const chunks = [];
            apiRes.on("data", (chunk) => {
              chunks.push(chunk);
            });

            apiRes.on("end", () => {
              try {
                const body = Buffer.concat(chunks).toString();
                resolve(JSON.parse(body));
              } catch (error) {
                reject(error);
              }
            });
          })
          .on("error", reject)
          .end();
      });

      // Process news data
      if (newsData.body && Array.isArray(newsData.body)) {
        for (let i = 0; i < Math.min(newsData.body.length, 10); i++) {
          const article = newsData.body[i];
          const { title, source, time, url, text, img, type, ago } = article;

          if (!time) {
            console.error("Time is undefined for article:", article);
            continue;
          }

          let formattedTime;
          try {
            formattedTime = moment(time, "MMM D, YYYY, h:mm A").toISOString();
            if (!moment(formattedTime).isValid()) {
              throw new Error(`Invalid time format: ${time}`);
            }
          } catch (err) {
            console.error("Error parsing time:", err.message);
            continue;
          }

          const processedArticle = {
            ticker,
            url,
            img: img || "",
            title,
            text: text || "",
            source,
            type,
            formattedTime,
            formattedDate: moment(formattedTime).format("YYYY-MM-DD"),
            ago: ago || "",
          };

          // Inserting the processed information into the database
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

          allProcessedArticles.push(processedArticle);
        }
      }

      // Fetch sentiment data
      const sentimentOptions = {
        method: "GET",
        hostname: "us-stocks-news-sentiment-data.p.rapidapi.com",
        port: null,
        path: `/${ticker}?dateTo=${formattedDate}&dateFrom=${formattedDate}`,
        headers: {
          "x-rapidapi-key": process.env.RAPIDAPI_KEY,
          "x-rapidapi-host": "us-stocks-news-sentiment-data.p.rapidapi.com",
        },
      };

      const sentimentData = await new Promise((resolve, reject) => {
        https
          .request(sentimentOptions, (apiRes) => {
            const chunks = [];
            apiRes.on("data", (chunk) => {
              chunks.push(chunk);
            });

            apiRes.on("end", async () => {
              try {
                const body = Buffer.concat(chunks);
                const data = JSON.parse(body.toString());

                if (data.sentiments && data.sentiments.length > 0) {
                  for (const sentiment of data.sentiments) {
                    const sentimentValue = sentiment.sentimentValue;
                    const sentimentDate = sentiment.date;
                    await insertSentimentData(
                      ticker,
                      sentimentDate,
                      sentimentValue
                    );
                  }
                }

                resolve(data);
              } catch (err) {
                reject(err);
              }
            });
          })
          .on("error", reject)
          .end();
      });

      allSentimentData.push(sentimentData); // Store sentiment data for each ticker

      // Fetch price data
      const priceOptions = {
        method: "POST",
        hostname: "yahoo-finance160.p.rapidapi.com",
        port: null,
        path: "/history",
        headers: {
          "x-rapidapi-key": process.env.RAPIDAPI_KEY,
          "Content-Type": "application/json",
        },
      };

      const pricePromise = new Promise((resolve, reject) => {
        const apiReq = https.request(priceOptions, (apiRes) => {
          const chunks = [];
          apiRes.on("data", (chunk) => {
            chunks.push(chunk);
          });

          apiRes.on("end", async () => {
            const body = Buffer.concat(chunks).toString();
            let data;

            try {
              data = JSON.parse(body);
            } catch (err) {
              console.error(`Error parsing JSON for ${ticker}: ${err.message}`);
              reject(`Error parsing JSON for ${ticker}`);
              return;
            }

            if (!data.metadata) {
              console.error(`Missing metadata for ${ticker}: ${body}`);
              reject(`Missing metadata for ${ticker}`);
              return;
            }

            const lastRecordIndex = data.records[data.records.length - 1];
            if (!lastRecordIndex) {
              console.error(`No records found for ${ticker}`);
              reject(`No records found for ${ticker}`);
              return;
            }

            // Extract relevant price data
            const tickerCode = data.metadata.symbol;
            const {
              regularMarketPrice,
              fiftyTwoWeekHigh,
              fiftyTwoWeekLow,
              regularMarketDayHigh,
              regularMarketDayLow,
              regularMarketVolume,
            } = data.metadata;

            const dateLast = lastRecordIndex.index;
            const openLast = lastRecordIndex.Open;
            const highLast = lastRecordIndex.High;
            const lowLast = lastRecordIndex.Low;
            const closeLast = lastRecordIndex.Close;
            const volumeLast = parseInt(lastRecordIndex.Volume);

            // Inserting price data into the database
            try {
              await insertPriceData(
                tickerCode,
                regularMarketPrice,
                fiftyTwoWeekHigh,
                fiftyTwoWeekLow,
                regularMarketDayHigh,
                regularMarketDayLow,
                regularMarketVolume,
                dateLast,
                openLast,
                highLast,
                lowLast,
                closeLast,
                volumeLast
              );
              resolve({
                tickerCode,
                lastRecord: {
                  date: dateLast,
                  open: openLast,
                  high: highLast,
                  low: lowLast,
                  close: closeLast,
                  volume: volumeLast,
                },
              });
            } catch (err) {
              console.error(
                `Error inserting data for ${tickerCode}: ${err.message}`
              );
              reject(`Error inserting data for ${tickerCode}: ${err.message}`);
            }
          });
        });

        apiReq.on("error", (error) => {
          console.error(
            `Error fetching stock data for ${ticker}: ${error.message}`
          );
          reject(`Error fetching stock data for ${ticker}: ${error.message}`);
        });

        apiReq.write(JSON.stringify({ stock: ticker, period: "1mo" }));
        apiReq.end();
      });

      pricePromises.push(pricePromise);
    }

    const priceResults = await Promise.all(pricePromises); // Wait for all price data promises to resolve

    res.status(200).json({
      articles: allProcessedArticles,
      sentiments: allSentimentData,
      prices: priceResults, // Include price results in the response
    }); // Return all processed articles, sentiment data, and price data
  } catch (error) {
    console.error("Error processing request:", error);
    res.status(500).json({ error: "Error processing request" });
  }
};
