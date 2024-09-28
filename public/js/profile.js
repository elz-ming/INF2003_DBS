document.addEventListener("DOMContentLoaded", function () {
  let walletBalance = 0;

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
      if (!data.wallet_balance) {
        console.error("Wallet balance not found.");
        return;
      }

      // Convert wallet_balance to a number, in case it's a string or another type
      walletBalance = parseFloat(data.wallet_balance);

      if (isNaN(walletBalance)) {
        console.error("Wallet balance is not a valid number.");
        return;
      }

      // Display the name and wallet balance on the profile page
      document.getElementById("profile-name").textContent = data.name;
      document.getElementById(
        "wallet-balance"
      ).textContent = `$${walletBalance.toFixed(2)}`;
    })
    .catch((error) => {
      console.error("Error fetching profile data:", error);
    });

  const depositButton = document.getElementById("deposit");
  const withdrawButton = document.getElementById("withdraw");
  const confirmButton = document.getElementById("confirm-button");
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
});
