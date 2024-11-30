async function loadStocks() {
  try {
    // Fetch the list of stock tickers from the backend API
    const response = await fetch("/api/index");
    const results = await response.json();

    // Get the container where the stock divs will be appended
    const container = document.getElementById("data-body");

    // Loop through each ticker and create a div with class "stock"
    results.data.forEach((result) => {
      console.log(result);
      sentimentValue = parseFloat(result.sentimentValue).toFixed(2);
      price = parseFloat(result.regularmarketprice).toFixed(2);

      const link = document.createElement("a");
      link.href = `/screens/stock-detail.html?ticker=${encodeURIComponent(
        result.ticker
      )}`;
      link.className = "data-row";

      link.innerHTML = `
        <div class="stock">
          <h2>${result.ticker}</h2>
          <h3>${result.longname}</h3>
        </div>
        <div class="sentiment">
          <div class="sentiment-circle" style="--value: ${sentimentValue};">
            <span class="sentiment-value">${sentimentValue}</span>
          </div>
        </div>
        <div class="price">${price}</div>
      `;

      container.appendChild(link);
    });
  } catch (error) {
    console.error("Error fetching stocks:", error);
  }
}

// Call the function when the page loads
window.addEventListener("DOMContentLoaded", loadStocks);
