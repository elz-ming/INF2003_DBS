const http = require('https');
const insertSentimentData = require('../insert'); // Adjust the path as needed

// this helps me to check the current date and format it accordingly to the last week day of the market
function getLastMarketDay(date) {
    const day = date.getDay();
    if (day === 6) { // Saturday
        date.setDate(date.getDate() - 1); // Go back to Friday
    } else if (day === 0) { // Sunday
        date.setDate(date.getDate() - 2); // Go back to Friday
    }
    return date;
}

function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are zero-based
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

export default async function handler(req, res) {
    let today = new Date();
    today = getLastMarketDay(today); // Get the last market day if today is a weekend
    const formattedDate = formatDate(today);

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
    const options = {
        method: 'GET',
        hostname: 'us-stocks-news-sentiment-data.p.rapidapi.com',
        port: null,
        path: `/${ticker}?dateTo=${formattedDate}&dateFrom=${formattedDate}`,
        headers: {
            'x-rapidapi-key': process.env.RAPIDAPI_KEY, // retrieving our api key from the env file
            'x-rapidapi-host': 'us-stocks-news-sentiment-data.p.rapidapi.com'
        }
    };

    try {
        const sentimentData = await new Promise((resolve, reject) => {
            const reqSentiment = http.request(options, (response) => {
                const chunks = [];
                response.on('data', (chunk) => chunks.push(chunk));
                response.on('end', async () => {
                    try {
                        const body = Buffer.concat(chunks);
                        const data = JSON.parse(body.toString());
        
                        console.log('API Response:', data); //checking our response value
        
                        if (data.sentiments && data.sentiments.length > 0) {
                            for (const sentiment of data.sentiments) {
                                const sentimentValue = sentiment.sentimentValue;
                                const sentimentDate = sentiment.date;
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
        

        res.status(200).json(sentimentData);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}
