document.addEventListener("DOMContentLoaded", function () {
  let walletBalance = 0;
  let userData;
  let portfolioData = [];

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
      if (!data.userData) {
        console.error("User Data not found.");
        return;
      }

      if (!data.portfolioData) {
        console.error("Portfolio Data not found.");
        return;
      }

      userData = data.userData;
      portfolioData = data.portfolioData || [];

      // Convert wallet_balance to a number, in case it's a string or another type
      walletBalance = parseFloat(userData.wallet_balance);

      if (isNaN(walletBalance)) {
        console.error("Wallet balance is not a valid number.");
        return;
      }

      // Display the name and wallet balance on the profile page
      document.getElementById("profile-name").textContent = userData.name;
      document.getElementById(
        "wallet-balance"
      ).textContent = `$${walletBalance.toFixed(2)}`;

      // Handle portfolio section rendering based on data availability
      renderPortfolioSection(portfolioData);
    })
    .catch((error) => {
      console.error("Error fetching profile data:", error);
    });

  const depositButton = document.getElementById("deposit");
  const withdrawButton = document.getElementById("withdraw");
  const confirmButton = document.getElementById("confirm-button");
  const deleteButton = document.getElementById("delete-profile-button");
  const modal = document.getElementById("modal");
  const modalBackdrop = document.getElementById("modal-backdrop");
  const modalTitle = document.getElementById("modal-title");
  const amountInput = document.getElementById("amount-input");
  const closeButton = document.getElementById("modal-close");
  const modalBalance = document.getElementById("modal-balance");

  depositButton.addEventListener("click", () => {
    showModal("deposit");
  });

  withdrawButton.addEventListener("click", () => {
    showModal("withdraw");
  });

  deleteButton.addEventListener("click", () => {
    if (confirm("Are you sure you want to delete your profile?")) {
      fetch("/api/profile", {
        method: "DELETE",
      })
        .then((response) => {
          if (response.ok) {
            alert("Profile deleted successfully!");
            window.location.href = "/"; // Redirect to the homepage
          } else {
            alert("Failed to delete profile.");
          }
        })
        .catch((error) => {
          console.error("Error deleting profile:", error);
        });
    }
  });

  confirmButton.addEventListener("click", async () => {
    const action = confirmButton.textContent.toLowerCase();
    const amount = parseFloat(amountInput.value);
    if (isNaN(amount) || amount <= 0) {
      alert("Please enter a valid amount.");
      return;
    }

    if (walletBalance < amount && action === "withdraw") {
      alert("Insufficient funds.");
      return;
    }

    try {
      const response = await fetch("/api/money-transaction", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action, amount }),
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
    modalTitle.classList.remove("bg-green", "bg-red", "bg-black");
    amountInput.classList.remove("green", "red");
    confirmButton.classList.remove("green", "red");

    modalBalance.textContent = `$${walletBalance.toFixed(2)}`;
    if (action === "deposit") {
      modalTitle.classList.add("bg-green");
      amountInput.classList.add("green");
      confirmButton.classList.add("green");
      confirmButton.textContent = "Deposit";
    } else if (action === "withdraw") {
      modalTitle.classList.add("bg-red");
      amountInput.classList.add("red");
      confirmButton.classList.add("red");
      confirmButton.textContent = "Withdraw";
    }
  }

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

  // ================= //
  // ===== CHART ===== //
  // ================= //
  function renderPortfolioSection(portfolioData) {
    const portfolioSection = document.getElementById("portfolio");

    if (!portfolioData || portfolioData.length === 0) {
      // If empty, display a message to prompt the user to make their first purchase
      const message = document.createElement("p");
      message.id = "portfolio-message";
      message.textContent = "Make your first purchase now!";
      portfolioSection.appendChild(message);
      return;
    }

    // If there is data, create and append the canvas element for the chart
    const canvas = document.createElement("canvas");
    canvas.id = "portfolio-chart";
    portfolioSection.appendChild(canvas);

    // Prepare data for the pie chart
    const labels = portfolioData.map((item) => item.ticker);
    const data = portfolioData.map(
      (item) => item.quantity * item.regularmarketprice
    );

    // Define a palette of colors to be used for up to 5 stocks
    const colorPalette = [
      "rgba(75, 192, 192, 0.7)", // Teal
      "rgba(54, 162, 235, 0.7)", // Blue
      "rgba(255, 206, 86, 0.7)", // Yellow
      "rgba(153, 102, 255, 0.7)", // Purple
      "rgba(255, 99, 132, 0.7)", // Pink
    ];

    // Slice the color palette to match the number of stocks dynamically
    const backgroundColor = colorPalette.slice(0, labels.length);

    // Border colors corresponding to the background colors
    const borderColor = backgroundColor.map((color) =>
      color.replace(/0\.7\)$/, "1)")
    );

    // Create the Pie chart using Chart.js
    const ctx = canvas.getContext("2d");
    new Chart(ctx, {
      type: "pie",
      data: {
        labels,
        datasets: [
          {
            label: "Portfolio Distribution",
            data,
            backgroundColor,
            borderColor,
            borderWidth: 2,
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            position: "top",
            labels: {
              color: "#fff",
              font: {
                size: 14,
              },
            },
          },
          tooltip: {
            enabled: true,
          },
          datalabels: {
            color: "#fff",
            font: {
              size: 16,
            },
            formatter: (value, context) => {
              // Calculate the percentage of the total for each slice
              const total = context.dataset.data.reduce(
                (acc, val) => acc + val,
                0
              );
              const percentage = ((value / total) * 100).toFixed(1); // Round to 1 decimal place
              return `${percentage}%`; // Display percentage
            },
          },
        },
      },
      plugins: [ChartDataLabels],
    });
  }
});
