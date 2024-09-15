async function fetchTransactions(selectedTypes = [], sortOrder = "desc") {
  try {
    const query = new URLSearchParams();
    if (selectedTypes.length > 0) {
      query.append("types", selectedTypes.join(","));
    }
    query.append("sort", sortOrder);

    console.log("Fetching with query:", query.toString()); // Debug: Check query

    const response = await fetch(`/api/transactions?${query.toString()}`);
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
      if (validTypes.includes(transaction.type.toLowerCase())) {
        const transactionCard = document.createElement("div");
        transactionCard.classList.add(
          "transaction-card",
          transaction.type.toLowerCase()
        );

        const details = document.createElement("div");
        details.classList.add("details");

        if (
          transaction.type.toLowerCase() === "buy" ||
          transaction.type.toLowerCase() === "sell"
        ) {
          const ticker = document.createElement("div");
          ticker.classList.add("ticker");
          ticker.textContent = transaction.tickercode || "N/A";
          details.appendChild(ticker);
        }

        const type = document.createElement("div");
        type.classList.add("type");
        type.textContent = transaction.type.toUpperCase();
        details.appendChild(type);

        const amount = document.createElement("div");
        amount.classList.add("amount");
        amount.textContent = `$${transaction.amount.toFixed(2)}`;
        transactionCard.appendChild(details);
        transactionCard.appendChild(amount);

        dateGroup.appendChild(transactionCard);
      }
    });

    container.appendChild(dateGroup);
  });
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

document.querySelectorAll(".dropdown-button").forEach((button) => {
  button.addEventListener("click", (e) => {
    const dropdownId = e.target.nextElementSibling
      ? e.target.nextElementSibling.id
      : null;
    if (dropdownId) {
      document.getElementById(dropdownId).classList.toggle("show");
    }
  });
});

document
  .querySelectorAll("#typeDropdown input[type='checkbox']")
  .forEach((checkbox) => {
    checkbox.addEventListener("click", (event) => {
      event.stopPropagation(); // Prevents the dropdown from closing when checkbox is clicked
    });
  });

document.addEventListener("click", (event) => {
  if (!event.target.matches(".dropdown-button")) {
    const dropdowns = document.getElementsByClassName("dropdown-content");
    for (let i = 0; i < dropdowns.length; i++) {
      const openDropdown = dropdowns[i];
      if (openDropdown.classList.contains("show")) {
        openDropdown.classList.remove("show");
      }
    }
  }
});

document.getElementById("applyFilters").addEventListener("click", () => {
  const typeFilter = document.querySelectorAll(
    "#typeDropdown input[type='checkbox']:checked"
  );
  const selectedTypes = Array.from(typeFilter).map(
    (checkbox) => checkbox.value
  );

  const sortOrder =
    document.getElementById("sortButton").textContent.toLowerCase() === "latest"
      ? "desc"
      : "asc";

  fetchTransactions(selectedTypes, sortOrder);

  // Close dropdowns when apply filters is clicked
  document.querySelectorAll(".dropdown-content").forEach((dropdown) => {
    dropdown.classList.remove("show");
  });
});

document.getElementById("sortButton").addEventListener("click", () => {
  const currentSort = document
    .getElementById("sortButton")
    .textContent.toLowerCase();
  const newSort = currentSort === "descending" ? "ascending" : "descending";
  document.getElementById("sortButton").textContent =
    newSort.charAt(0).toUpperCase() + newSort.slice(1);
  const typeFilter = document.querySelectorAll(
    "#typeDropdown input[type='checkbox']:checked"
  );
  const selectedTypes = Array.from(typeFilter).map(
    (checkbox) => checkbox.value
  );

  fetchTransactions(selectedTypes, newSort);
});

// Initial fetch
window.onload = () => {
  fetchTransactions(); // Load all transactions initially
};
