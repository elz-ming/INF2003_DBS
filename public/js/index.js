// Function to fetch data from /api/data
async function fetchData() {
  console.log("Fetch Data button clicked");
  try {
    const response = await fetch("/api/data");
    if (!response.ok) throw new Error("Network response was not ok");
    const data = await response.json();
    document.getElementById("data").textContent = JSON.stringify(data, null, 2);
  } catch (error) {
    console.error("Error fetching data:", error);
  }
}

// Function to fetch sentiment data from /api/sentimentAPICall
function sentimentAnalysis() {
  console.log("Sentiment Analysis button clicked");
  fetch('/api/sentimentAPICall') 
    .then(response => {
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      return response.json();
    })
    .then(data => {
      document.getElementById('data').textContent = JSON.stringify(data, null, 2);
    })
    .catch(error => {
      console.error('Error fetching sentiment data:', error);
    });
}

async function fetchStockData() {
  console.log("Fetch Stock Data button clicked");
  try {
    const response = await fetch("/api/stockInfoAPI");
    if (!response.ok) throw new Error("Network response was not ok");
    const data = await response.json();
    document.getElementById("data").textContent = JSON.stringify(data, null, 2);
  } catch (error) {
    console.error("Error fetching stock data:", error);
  }
}


