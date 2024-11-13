const https = require("https");
const moment = require("moment");
require("../db");
const Stock = require("../models/Stock"); // Stock schema model

const ticker_codes = {
  1: "AAPL",
  2: "MSFT",
  3: "AMZN",
  4: "GOOGL",
  5: "TSLA",
};
function getLastMarketDay(date) {
  const day = date.getDay();
  if (day === 1) {
    date.setDate(date.getDate() - 3); // Monday -> Friday
  } else if (day === 0) {
    date.setDate(date.getDate() - 2); // Sunday -> Friday
  } else if (day === 6) {
    date.setDate(date.getDate() - 1); // Saturday -> Friday
  } else {
    date.setDate(date.getDate() - 1); // Weekday -> Previous day
  }
  return date;
}

function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

async function fetchApi(options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => {
        data += chunk;
      });
      res.on("end", () => {
        try {
          const parsedData = JSON.parse(data);
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(parsedData);
          } else {
            reject(
              new Error(
                `API Error: ${res.statusCode} - ${
                  parsedData.message || "Unknown Error"
                }`
              )
            );
          }
        } catch (error) {
          reject(new Error(`Error parsing API response: ${error.message}`));
        }
      });
    });

    req.on("error", (error) => {
      reject(new Error(`API Request Failed: ${error.message}`));
    });

    if (postData) {
      req.write(JSON.stringify(postData));
    }
    req.end();
  });
}

module.exports = async (req, res) => {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  let today = new Date();
  today = getLastMarketDay(today);
  const formattedDate = formatDate(today);

  try {
    for (const ticker of Object.values(ticker_codes)) {
      // Step 1: Get stock information
      const infoOptions = {
        method: "POST",
        hostname: "yahoo-finance160.p.rapidapi.com",
        path: "/info",
        headers: {
          "x-rapidapi-key": process.env.RAPIDAPI_KEY,
          "Content-Type": "application/json",
        },
      };

      // Insert longname
      const infoData = await fetchApi(infoOptions, {
        stock: ticker,
      });
      let longname = "Unknown"; // Default value
      if (infoData.longName) {
        longname = infoData.longName;
      }

      const stock = await Stock.findOne({ ticker });
      if (!stock) {
        await Stock.create({
          ticker,
          longname,
          sentiment: null,
          esg: null,
          prices: [],
          news: [],
        });
      } else if (!stock.longname) {
        await Stock.updateOne({ ticker }, { $set: { longname } });
      }

      // // Step 2: Get stock price
      // const priceOptions = {
      //   method: "POST",
      //   hostname: "yahoo-finance160.p.rapidapi.com",
      //   path: "/history",
      //   headers: {
      //     "x-rapidapi-key": process.env.RAPIDAPI_KEY,
      //     "Content-Type": "application/json",
      //   },
      // };

      // // Insert price data
      // const priceData = await fetchApi(priceOptions, {
      //   stock: ticker,
      //   period: "1mo",
      // });
      // if (priceData.metadata && priceData.records) {
      //   const lastRecord = priceData.records[priceData.records.length - 1];
      //   if (lastRecord) {
      //     await Stock.updateOne(
      //       { ticker },
      //       {
      //         $addToSet: {
      //           prices: {
      //             regularmarketprice: lastRecord.Close,
      //             volume: lastRecord.Volume,
      //             fiftytwoweekhigh: priceData.metadata.fiftyTwoWeekHigh,
      //             fiftytwoweeklow: priceData.metadata.fiftyTwoWeekLow,
      //             date: lastRecord.index,
      //           },
      //         },
      //       }
      //     );
      //   }
      // }

      // // Step 3: Get stock news
      // const newsOptions = {
      //   method: "GET",
      //   hostname: "mboum-finance.p.rapidapi.com",
      //   path: `/v2/markets/news?tickers=${ticker}&type=ALL`,
      //   headers: {
      //     "x-rapidapi-key": process.env.RAPIDAPI_KEY,
      //   },
      // };

      // // Insert news data
      // const newsData = await fetchApi(newsOptions);
      // if (newsData.body && Array.isArray(newsData.body)) {
      //   for (let article of newsData.body.slice(0, 10)) {
      //     const { title, source, time, url } = article;
      //     if (!time) continue;

      //     const formattedTime = moment(
      //       time,
      //       "MMM D, YYYY, h:mm A"
      //     ).toISOString();
      //     await Stock.updateOne(
      //       { ticker },
      //       {
      //         $addToSet: {
      //           news: {
      //             date: formattedTime,
      //             source,
      //             title,
      //             url,
      //           },
      //         },
      //       }
      //     );
      //   }
      // }

      // // Step 4: Get stock sentiments
      // const sentimentOptions = {
      //   method: "GET",
      //   hostname: "us-stocks-news-sentiment-data.p.rapidapi.com",
      //   path: `/${ticker}?dateTo=${formattedDate}&dateFrom=${formattedDate}`,
      //   headers: {
      //     "x-rapidapi-key": process.env.RAPIDAPI_KEY,
      //   },
      // };

      // // Update sentiment data
      // const sentimentData = await fetchApi(sentimentOptions);
      // if (sentimentData.sentiments && sentimentData.sentiments.length > 0) {
      //   const sentiment = sentimentData.sentiments[0];
      //   await Stock.updateOne(
      //     { ticker },
      //     {
      //       sentiment: {
      //         value: sentiment.sentimentValue,
      //         date: sentiment.date,
      //       },
      //     }
      //   );
      // }

      // Step 5: Get ESG data
      const esgOptions = {
        method: "GET",
        hostname: "gaialens-esg-scores.p.rapidapi.com",
        port: null,
        path: `/scores?companyname=${encodeURIComponent(longname)}`,
        headers: {
          "x-rapidapi-key": process.env.RAPIDAPI_KEY,
          "x-rapidapi-host": "gaialens-esg-scores.p.rapidapi.com",
        },
      };

      // Update ESG data
      const esgData = await fetchApi(esgOptions);
      if (Array.isArray(esgData) && esgData.length > 0) {
        const esgScore = esgData[0];
        await Stock.updateOne(
          { ticker },
          {
            esg: {
              environment_pillar_score: esgScore["Environmental Pillar Score"],
              social_pillar_score: esgScore["Social Pillar Score"],
              governance_pillar_score: esgScore["Governance Pillar Score"],
              date: esgScore["Latest Score Date"],
            },
          }
        );
      }
    }

    console.log("Data insertion completed.");
    res.status(200).json({
      success: true,
      message: "Data fetched and updated successfully",
    });
  } catch (error) {
    console.error("Error processing request:", error);
    res.status(500).json({ error: "Error processing request" });
  }
};
