const https = require("https");
const { insertStockData } = require("../insert");

const ticker_codes = {
  1: "AAPL",
  2: "MSFT",
  3: "AMZN",
  4: "GOOGL",
  5: "TSLA",
};

export default async function handler(req, res) {
  if (req.method === "GET") {
    const promises = [];

    for (const [key, ticker] of Object.entries(ticker_codes)) {
      const options = {
        method: "POST",
        hostname: "yahoo-finance160.p.rapidapi.com",
        port: null,
        path: "/history",
        headers: {
          "x-rapidapi-key": process.env.RAPIDAPI_KEY, // retreiving the api key from the env file
          "Content-Type": "application/json",
        },
      };
      // promises are basically requests
      const apiPromise = new Promise((resolve, reject) => {
        const apiReq = https.request(options, (apiRes) => {
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
            // this stores and looks for the last data item in the list.
            const lastRecordIndex = data.records[data.records.length - 1];
            if (!lastRecordIndex) {
              console.error(`No records found for ${ticker}`);
              reject(`No records found for ${ticker}`);
              return;
            }

            // this stores all of the items we need for database into the respective variables
            const tickerCode = data.metadata.symbol;
            const regularMarketPrice = data.metadata.regularMarketPrice;
            const fiftyTwoWeekHigh = data.metadata.fiftyTwoWeekHigh;
            const fiftyTwoWeekLow = data.metadata.fiftyTwoWeekLow;
            const regularMarketDayHigh = data.metadata.regularMarketDayHigh;
            const regularMarketDayLow = data.metadata.regularMarketDayLow;
            const regularMarketVolume = parseInt(
              data.metadata.regularMarketVolume
            );
            const longName = data.metadata.longName;
            const instrumentType = data.metadata.instrumentType;

            const dateLast = lastRecordIndex.index;
            const openLast = lastRecordIndex.Open;
            const highLast = lastRecordIndex.High;
            const lowLast = lastRecordIndex.Low;
            const closeLast = lastRecordIndex.Close;
            const volumeLast = parseInt(lastRecordIndex.Volume);

            //insertion begins here where it calls the insert.js file and inserts the data into the database
            try {
              await insertStockData(
                tickerCode,
                longName,
                instrumentType,
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
                regularMarketPrice,
                fiftyTwoWeekHigh,
                fiftyTwoWeekLow,
                regularMarketDayHigh,
                regularMarketDayLow,
                regularMarketVolume,
                longName,
                instrumentType,
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

      promises.push(apiPromise);
    }

    Promise.all(promises)
      .then((results) => {
        res.status(200).json(results);
      })
      .catch((error) => {
        console.error(`Error in API calls: ${error}`);
        res.status(500).json({ error });
      });
  } else {
    res.setHeader("Allow", ["GET"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
