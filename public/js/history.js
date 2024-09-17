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
        transactionCard.appendChild(details);
        transactionCard.appendChild(amount);

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
  const popup = document.getElementById("popup");
  const popupContent = document.getElementById("popupContent");

  // Format the transaction type with only the first letter uppercase
  const transactionType =
    transaction.transaction_type.charAt(0).toUpperCase() +
    transaction.transaction_type.slice(1).toLowerCase();
  const typeClass = `transaction-type-${transaction.transaction_type.toLowerCase()}`;

  // Generate the content for the popup
  let content = `
     <button id="closePopup" class="close-button">Close</button>
     <h3 class="${typeClass}">${transactionType}</h3>`;
  // Populate popup based on transaction type
  if (
    transaction.transaction_type.toLowerCase() === "withdrawal" ||
    transaction.transaction_type.toLowerCase() === "deposit"
  ) {
    content += `
    <div class="popup-row"><strong>Date:</strong> ${new Date(
      transaction.order_executed
    ).toLocaleDateString()}</div>
    <div class="popup-row"><strong>Time:</strong> ${new Date(
      transaction.order_executed
    ).toLocaleTimeString()}</div>
    <div class="popup-row"><strong>Amount:</strong> $${transaction.amount.toFixed(
      2
    )}</div>
    <div class="popup-row"><strong>Bank:</strong> ${
      transaction.bank || "N/A"
    }</div>`;
  } else if (
    transaction.transaction_type.toLowerCase() === "buy" ||
    transaction.transaction_type.toLowerCase() === "sell"
  ) {
    content += `
      <div class="popup-row"><strong>Date:</strong> ${new Date(
        transaction.order_executed
      ).toLocaleDateString()}</div>
      <div class="popup-row"><strong>Time:</strong> ${new Date(
        transaction.order_executed
      ).toLocaleTimeString()}</div>
      <div class="popup-row"><strong>Amount:</strong> $${transaction.amount.toFixed(
        2
      )}</div>
      <div class="popup-row"><strong>Stock Price:</strong> $${transaction.price.toFixed(
        2
      )}</div>
      <div class="popup-row"><strong>Quantity:</strong> ${
        transaction.quantity
      }</div>`;
  }

  popupContent.innerHTML = content;
  popup.style.display = "block";

  document
    .getElementById("closePopup")
    .removeEventListener("click", closePopup);
  document.getElementById("closePopup").addEventListener("click", closePopup);
}

function closePopup() {
  const popup = document.getElementById("popup");
  popup.style.display = "none";
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

document.getElementById("applyFilters").addEventListener("click", () => {
  const dateSortButton = document.getElementById("sortDateButton");
  const dateSortOrder = dateSortButton.textContent.toLowerCase();

  const amountSortButton = document.getElementById("sortAmountButton");
  const amountSortOrder = amountSortButton.textContent.toLowerCase();

  const typeFilter = document.querySelectorAll(
    "#typeDropdown input[type='checkbox']:checked"
  );
  const selectedTypes = Array.from(typeFilter).map(
    (checkbox) => checkbox.value
  );

  const startDate = document.getElementById("startDate").value;
  const endDate = document.getElementById("endDate").value;

  fetchTransactions(
    selectedTypes,
    dateSortOrder,
    amountSortOrder,
    startDate,
    endDate
  );
});

document.getElementById("sortDateButton").addEventListener("click", () => {
  const dateButton = document.getElementById("sortDateButton");
  const currentSort = dateButton.textContent.toLowerCase();
  const newSort = currentSort === "earliest" ? "latest" : "earliest";
  dateButton.textContent = newSort.charAt(0).toUpperCase() + newSort.slice(1);

  const amountSortButton = document.getElementById("sortAmountButton");
  const amountSortOrder = amountSortButton.textContent.toLowerCase();

  const typeFilter = document.querySelectorAll(
    "#typeDropdown input[type='checkbox']:checked"
  );
  const selectedTypes = Array.from(typeFilter).map(
    (checkbox) => checkbox.value
  );

  fetchTransactions(selectedTypes, newSort, amountSortOrder);
});

document.getElementById("sortAmountButton").addEventListener("click", () => {
  const amountButton = document.getElementById("sortAmountButton");
  const currentSort = amountButton.textContent.toLowerCase();
  const newSort = currentSort === "lowest" ? "highest" : "lowest";
  amountButton.textContent = newSort.charAt(0).toUpperCase() + newSort.slice(1);

  const dateSortButton = document.getElementById("sortDateButton");
  const dateSortOrder = dateSortButton.textContent.toLowerCase();

  const typeFilter = document.querySelectorAll(
    "#typeDropdown input[type='checkbox']:checked"
  );
  const selectedTypes = Array.from(typeFilter).map(
    (checkbox) => checkbox.value
  );

  fetchTransactions(selectedTypes, dateSortOrder, newSort);
});

window.onload = () => {
  fetchTransactions();
};
