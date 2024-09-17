// const https = require('https');

// export default function handler(req, res) {
//   if (req.method === 'GET') {
//     const options = {
//       method: 'POST',
//       hostname: 'yahoo-finance160.p.rapidapi.com',
//       port: null,
//       path: '/history',
//       headers: {
//         'x-rapidapi-key': 'c3dd0c1e20mshd942dc8a8d040e9p10f7cbjsnfa66d893170a',
//         'x-rapidapi-host': 'yahoo-finance160.p.rapidapi.com',
//         'Content-Type': 'application/json'
//       }
//     };

//     const req = https.request(options, (apiRes) => {
//       const chunks = [];

//       apiRes.on('data', (chunk) => {
//         chunks.push(chunk);
//       });

//       apiRes.on('end', () => {
//         const body = Buffer.concat(chunks).toString();
//         res.status(200).json(JSON.parse(body));
//       });
//     });

//     req.on('error', (error) => {
//       res.status(500).json({ error: error.message });
//     });

//     req.write(JSON.stringify({ stock: 'TSLA', period: '1mo' }));
//     req.end();
//   } else {
//     res.setHeader('Allow', ['GET']);
//     res.status(405).end(`Method ${req.method} Not Allowed`);
//   }
// }

const https = require('https');

export default function handler(req, res) {
  if (req.method === 'GET') {
    const options = {
      method: 'POST',
      hostname: 'yahoo-finance160.p.rapidapi.com',
      port: null,
      path: '/history',
      headers: {
        'x-rapidapi-key': 'c3dd0c1e20mshd942dc8a8d040e9p10f7cbjsnfa66d893170a',
        'x-rapidapi-host': 'yahoo-finance160.p.rapidapi.com',
        'Content-Type': 'application/json',
      },
    };

    const apiReq = https.request(options, (apiRes) => {
      const chunks = [];

      apiRes.on('data', (chunk) => {
        chunks.push(chunk);
      });

      apiRes.on('end', () => {
        const body = Buffer.concat(chunks).toString();
        const data = JSON.parse(body);

        // Extracting fields from the metadata section
        const tickerCode = data.metadata.symbol;
        const regularMarketPrice = data.metadata.regularMarketPrice;
        const fiftyTwoWeekHigh = data.metadata.fiftyTwoWeekHigh;
        const fiftyTwoWeekLow = data.metadata.fiftyTwoWeekLow;
        const regularMarketDayHigh = data.metadata.regularMarketDayHigh;
        const regularMarketDayLow = data.metadata.regularMarketDayLow;
        const regularMarketVolume = data.metadata.regularMarketVolume;
        const longName = data.metadata.longName;
        const instrumentType = data.metadata.instrumentType;

        // Extracting the 20th key values from the 'records' array
        const recordIndex20 = data.records[19];
        const open20 = recordIndex20.Open;
        const high20 = recordIndex20.High;
        const low20 = recordIndex20.Low;
        const close20 = recordIndex20.Close;
        const volume20 = recordIndex20.Volume;

        // Sending extracted fields as a JSON response
        res.status(200).json({
          tickerCode,
          regularMarketPrice,
          fiftyTwoWeekHigh,
          fiftyTwoWeekLow,
          regularMarketDayHigh,
          regularMarketDayLow,
          regularMarketVolume,
          longName,
          instrumentType,
          record20: {
            date: recordIndex20.index,
            open: open20,
            high: high20,
            low: low20,
            close: close20,
            volume: volume20,
          },
        });
      });
    });

    apiReq.on('error', (error) => {
      res.status(500).json({ error: error.message });
    });

    apiReq.write(JSON.stringify({ stock: 'TSLA', period: '1mo' }));
    apiReq.end();
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
