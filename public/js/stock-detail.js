document.addEventListener("DOMContentLoaded", () => {
  let pricePerShare = 0;
  let walletBalance = 0;
  let stockQuantity = 0;

  // Get the back button element by its ID
  const backButton = document.getElementById("back-button");

  // Add a click event listener to redirect to the homepage
  backButton.addEventListener("click", () => {
    window.location.href = "/index.html"; // Adjust the path to your homepage if needed
  });

  // Function to get query parameters from the URL
  function getQueryParams() {
    const params = new URLSearchParams(window.location.search);
    return {
      ticker: params.get("ticker"),
    };
  }

  // Function to fetch data from the server
  async function fetchStockData(ticker) {
    try {
      const response = await fetch(`/api/stock-detail?ticker=${ticker}`);
      if (!response.ok) {
        throw new Error("Failed to fetch stock data");
      }

      const data = await response.json();

      populateStockData(data);
    } catch (error) {
      console.error("Error fetching stock data:", error);
    }
  }

  function populateStockData(data) {
    if (data) {
      document.getElementById("stock-name").textContent =
        data.stockData.longname || "Unknown";
      document.getElementById("stock-price").textContent =
        `$${data.stockData.regularmarketprice}` || "N/A";
      document.getElementById("ADV").textContent =
        data.stockData.volume || "N/A";
      document.getElementById("52whigh").textContent =
        data.stockData.fiftytwoweekhigh || "N/A";
      document.getElementById("52wlow").textContent =
        data.stockData.fiftytwoweeklow || "N/A";

      // Update the ESG scores
      renderProgressBar("env-data", data.esgData.environmental_pillar_score);
      renderProgressBar("soc-data", data.esgData.social_pillar_score);
      renderProgressBar("gov-data", data.esgData.governance_pillar_score);

      renderNews(data.newsData);

      pricePerShare = data.stockData.regularmarketprice;
    }
  }

  function renderProgressBar(elementId, score) {
    const progressBar = document.getElementById(elementId);
    if (progressBar) {
      progressBar.innerHTML = `
        <div class="progress-bar">
          <div class="fill" style="width: ${score}%;"></div>
        </div>
      `;
    }
  }

  function renderNews(newsItems) {
    const newsContainer = document.getElementById("stock-news");
    newsItems.forEach((news) => {
      const newsRow = document.createElement("a");
      newsRow.href = news.url;
      newsRow.classList.add("news-row");

      // Create left part with title and source
      const newsLeft = document.createElement("div");
      newsLeft.classList.add("news-left");
      newsLeft.innerHTML = `<h4>${news.title}</h4><p>${news.source}</p>`;

      // Create right part with date
      const newsRight = document.createElement("div");
      newsRight.classList.add("news-right");
      newsRight.innerHTML = `<p>${new Date(
        news.date
      ).toLocaleDateString()}</p>`;

      // Append left and right to the news row
      newsRow.appendChild(newsLeft);
      newsRow.appendChild(newsRight);

      // Append the news row to the news container
      newsContainer.appendChild(newsRow);
    });
  }

  // Update the header with the ticker value
  const { ticker } = getQueryParams();
  if (ticker) {
    document.getElementById("title").textContent = `${ticker}`;
    fetchStockData(ticker);
  }

  // Fetch the profile data from the API
  fetch("/api/profile")
    .then((response) => {
      if (response.ok) {
        return response.json();
      } else {
        throw new Error("Failed to load profile");
      }
    })
    .then((data) => {
      if (!data.userData.wallet_balance) {
        console.error("Wallet balance not found.");
        return;
      }

      if (!data.portfolioData) {
        console.error("Portfolio data not found.");
        return;
      }

      // Convert wallet_balance to a number, in case it's a string or another type
      walletBalance = parseFloat(data.userData.wallet_balance);
      stock = data.portfolioData.find((item) => item.ticker === ticker);
      stockQuantity = stock.quantity || 0;
    })
    .catch((error) => {
      console.error("Error fetching profile data:", error);
    });

  const sellButton = document.getElementById("sell-button");
  const buyButton = document.getElementById("buy-button");
  const confirmButton = document.getElementById("confirm-button");
  const modal = document.getElementById("modal");
  const modalBackdrop = document.getElementById("modal-backdrop");
  const modalTitle = document.getElementById("modal-title");
  const amountInput = document.getElementById("amount-input");
  const closeButton = document.getElementById("modal-close");
  const modalBalance = document.getElementById("modal-balance");
  const modalQuantity = document.getElementById("modal-quantity");
  const modalAmount = document.getElementById("modal-amount");

  sellButton.addEventListener("click", () => {
    showModal("sell");
  });

  buyButton.addEventListener("click", () => {
    showModal("buy");
  });

  confirmButton.addEventListener("click", async () => {
    const action = confirmButton.textContent.toLowerCase();
    const quantity = parseInt(amountInput.value);
    const amount = parseFloat(modalAmount.textContent.replace("$", ""));

    console.log(amount);
    if (isNaN(amount) || amount <= 0) {
      alert("Please enter a valid amount.");
      return;
    }

    if (walletBalance < amount && action === "buy") {
      alert("Insufficient funds.");
      return;
    }

    try {
      const response = await fetch("/api/stock-transaction", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action, quantity, amount, ticker }),
      });

      if (!response.ok) {
        throw new Error("Network response was not ok.");
      }

      // Show success message if the transaction is successful
      alert("Transaction successful!");

      // Refresh the page to update the wallet balance
      location.reload();
    } catch (error) {
      console.error("Error:", error);
      alert("An error occurred. Please try again.");
    } finally {
      closeModal();
    }
  });

  function showModal(action) {
    modal.style.display = "flex";
    modalTitle.classList.remove("bg-pink", "bg-blue");
    amountInput.classList.remove("pink", "blue");
    confirmButton.classList.remove("pink", "blue");
    modalAmount.classList.remove("pink", "blue");

    modalAmount.textContent = "$0.00";
    modalBalance.textContent = `$${walletBalance.toFixed(2)}`;
    modalQuantity.textContent = `${stockQuantity}`;
    if (action === "sell") {
      modalTitle.classList.add("bg-pink");
      amountInput.classList.add("pink");
      confirmButton.classList.add("pink");
      modalAmount.classList.add("pink");
      confirmButton.textContent = "Sell";
    } else if (action === "buy") {
      modalTitle.classList.add("bg-blue");
      amountInput.classList.add("blue");
      confirmButton.classList.add("blue");
      modalAmount.classList.add("blue");
      confirmButton.textContent = "Buy";
    }
  }

  function updateTotalPrice() {
    const quantity = parseInt(amountInput.value) || 0; // Ensure quantity is a number, fallback to 0
    const totalPrice = (quantity * pricePerShare).toFixed(2); // Calculate total and format to 2 decimal places
    modalAmount.textContent = `$${totalPrice}`; // Display the calculated total
  }

  // Add event listener to update total when quantity input changes
  amountInput.addEventListener("input", updateTotalPrice);

  function closeModal() {
    modal.style.display = "none";
    amountInput.value = "";
  }

  if (modalBackdrop) {
    modalBackdrop.addEventListener("click", closeModal);
  }

  // Assuming you have a close button in your modal
  if (closeButton) {
    closeButton.addEventListener("click", closeModal);
  }
});
