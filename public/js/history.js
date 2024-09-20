let selectedDateSortOrder = "latest"; // Default sort order for date
let selectedAmountSortOrder = "highest"; // Default sort order for amount

async function fetchTransactions(
  selectedTypes = [],
  dateSortOrder = "latest",
  amountSortOrder = "highest",
  startDate = null,
  endDate = null
) {
  try {
    const query = new URLSearchParams();
    if (selectedTypes.length > 0) {
      query.append("types", selectedTypes.join(","));
    }
    query.append("dateSort", dateSortOrder);
    query.append("amountSort", amountSortOrder);
    if (startDate) {
      query.append("startDate", startDate);
    }
    if (endDate) {
      query.append("endDate", endDate);
    }

    console.log("Fetching with query:", query.toString()); // Debug: Check query

    const response = await fetch(`/api/history?${query.toString()}`);
    const data = await response.json();
    console.log("Fetched data:", data); // Debug: Check data
    renderTransactions(data);
  } catch (error) {
    console.error("Error fetching transactions:", error);
  }
}

function renderTransactions(transactions) {
  const container = document.getElementById("transactionHistory");
  container.innerHTML = ""; // Clear previous transactions

  if (transactions.length === 0) {
    const noTransactions = document.createElement("div");
    noTransactions.classList.add("no-transactions");
    noTransactions.textContent = "No transactions found.";
    container.appendChild(noTransactions);
    return;
  }

  const groupedTransactions = groupByDate(transactions);

  Object.keys(groupedTransactions).forEach((date) => {
    const dateGroup = document.createElement("div");
    dateGroup.classList.add("date-group");

    const dateHeader = document.createElement("div");
    dateHeader.classList.add("date-header");
    dateHeader.textContent = date;
    dateGroup.appendChild(dateHeader);

    groupedTransactions[date].forEach((transaction) => {
      const validTypes = ["buy", "sell", "withdrawal", "deposit"];
      if (validTypes.includes(transaction.transaction_type.toLowerCase())) {
        const transactionCard = document.createElement("div");
        transactionCard.classList.add(
          "transaction-card",
          transaction.transaction_type.toLowerCase()
        );

        const details = document.createElement("div");
        details.classList.add("details");

        if (
          transaction.transaction_type.toLowerCase() === "buy" ||
          transaction.transaction_type.toLowerCase() === "sell"
        ) {
          const ticker = document.createElement("div");
          ticker.classList.add("ticker");
          ticker.textContent = transaction.ticker_code || "N/A";
          details.appendChild(ticker);
        }

        const type = document.createElement("div");
        type.classList.add("type");
        type.textContent = transaction.transaction_type.toUpperCase();
        details.appendChild(type);

        const amount = document.createElement("div");
        amount.classList.add("amount");
        amount.textContent = `$${transaction.amount.toFixed(2)}`;

        const icon = document.createElement("div");
        icon.classList.add("icon");
        icon.innerHTML = `
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M5.60001 0.800003L4.48001 2L10.4 8L4.48001 14L5.60001 15.2L12.8 8L5.60001 0.800003Z" fill="#a8a5a5"/>
          </svg>
        `;

        transactionCard.appendChild(details);
        transactionCard.appendChild(amount);
        transactionCard.appendChild(icon);

        transactionCard.addEventListener("click", () => {
          displayPopup(transaction);
        });

        dateGroup.appendChild(transactionCard);
      }
    });

    container.appendChild(dateGroup);
  });
}

function displayPopup(transaction) {
  const modal = document.getElementById("modal");
  const modalBackdrop = document.getElementById("modal-backdrop");
  const modalTitle = document.getElementById("modal-title");
  const modalType = document.getElementById("modal-type");
  const modalBody = document.getElementById("modal-body");
  const closeButton = document.getElementById("modal-close");

  // Format the transaction type with only the first letter uppercase
  const transactionType =
    transaction.transaction_type.charAt(0).toUpperCase() +
    transaction.transaction_type.slice(1).toLowerCase();
  modalType.innerText = `${transactionType}`;

  modalTitle.classList.remove("buy", "sell", "deposit", "withdraw");
  modalTitle.classList.add(transaction.transaction_type.toLowerCase());

  // Generate the content for the popup
  let content = ``;
  // Populate popup based on transaction type
  if (
    transaction.transaction_type.toLowerCase() === "withdrawal" ||
    transaction.transaction_type.toLowerCase() === "deposit"
  ) {
    content += `
    <div class="modal-row"><strong>Amount:</strong> $${transaction.amount.toFixed(
      2
    )}</div>
    <div class="modal-row"><strong>Bank:</strong> ${
      transaction.bank || "N/A"
    }</div>
        <div class="modal-row"><strong>Date:</strong> ${new Date(
          transaction.order_executed
        ).toLocaleDateString()}</div>
    <div class="modal-row"><strong>Time:</strong> ${new Date(
      transaction.order_executed
    ).toLocaleTimeString()}</div>
    `;
  } else if (
    transaction.transaction_type.toLowerCase() === "buy" ||
    transaction.transaction_type.toLowerCase() === "sell"
  ) {
    content += `
      <div class="modal-row"><strong>Stock Name:</strong> ${
        transaction.stock_name || "N/A"
      }</div>
           <div class="modal-row"><strong>Stock Price:</strong> $${transaction.price.toFixed(
             2
           )}</div>
      <div class="modal-row"><strong>Quantity:</strong> ${
        transaction.quantity
      }</div>
      <div class="modal-row"><strong>Amount:</strong> $${transaction.amount.toFixed(
        2
      )}</div>
      <div class="modal-row"><strong>Date:</strong> ${new Date(
        transaction.order_executed
      ).toLocaleDateString()}</div>
      <div class="modal-row"><strong>Time:</strong> ${new Date(
        transaction.order_executed
      ).toLocaleTimeString()}</div>
      `;
  }

  modalBody.innerHTML = content;
  modal.style.display = "flex";

  if (modalBackdrop) {
    modalBackdrop.addEventListener("click", closeModal);
  }

  // Assuming you have a close button in your modal
  if (closeButton) {
    closeButton.addEventListener("click", closeModal);
  }
}

function closeModal() {
  const modal = document.getElementById("modal");
  modal.style.display = "none";
}

function groupByDate(transactions) {
  return transactions.reduce((grouped, transaction) => {
    const date = new Date(transaction.order_executed).toLocaleDateString(
      "en-GB",
      {
        day: "numeric",
        month: "long",
        year: "numeric",
      }
    );
    if (!grouped[date]) {
      grouped[date] = [];
    }
    grouped[date].push(transaction);
    return grouped;
  }, {});
}

document.getElementById("sortDateButton").addEventListener("click", () => {
  const dateButton = document.getElementById("sortDateButton");
  const currentSort = dateButton.textContent.toLowerCase();
  selectedDateSortOrder = currentSort === "earliest" ? "latest" : "earliest";
  dateButton.textContent =
    selectedDateSortOrder.charAt(0).toUpperCase() +
    selectedDateSortOrder.slice(1);
});

document.getElementById("sortAmountButton").addEventListener("click", () => {
  const amountButton = document.getElementById("sortAmountButton");
  const currentSort = amountButton.textContent.toLowerCase();
  selectedAmountSortOrder = currentSort === "lowest" ? "highest" : "lowest";
  amountButton.textContent =
    selectedAmountSortOrder.charAt(0).toUpperCase() +
    selectedAmountSortOrder.slice(1);
});

// Apply filters and fetch transactions
document.getElementById("applyFilters").addEventListener("click", () => {
  const typeFilter = document.querySelectorAll(
    "#filter input[type='checkbox']:checked"
  );

  const selectedTypes = Array.from(typeFilter).map((checkbox) =>
    checkbox.value.toLowerCase()
  );

  const startDate = document.getElementById("startDate").value;
  const endDate = document.getElementById("endDate").value;

  // Fetch transactions with selected types, date sort order, amount sort order, and date range
  fetchTransactions(
    selectedTypes,
    selectedDateSortOrder,
    selectedAmountSortOrder,
    startDate,
    endDate
  );
});

// Reset filters and sort options to defaults
document.getElementById("resetFilters").addEventListener("click", () => {
  // Reset the sorting order
  selectedDateSortOrder = "latest";
  selectedAmountSortOrder = "highest";
  document.getElementById("sortDateButton").textContent = "Latest";
  document.getElementById("sortAmountButton").textContent = "Highest";

  // Uncheck all type filters
  const checkboxes = document.querySelectorAll(
    ".filter-section input[type='checkbox']"
  );
  checkboxes.forEach((checkbox) => {
    checkbox.checked = false;
  });

  // Clear date range inputs
  document.getElementById("startDate").value = "";
  document.getElementById("endDate").value = "";

  // Fetch transactions with default settings (no filters)
  fetchTransactions();
});

window.onload = () => {
  fetchTransactions();
};
