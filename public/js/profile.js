document.addEventListener("DOMContentLoaded", function () {
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
      const walletBalance = parseFloat(data.wallet_balance);

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
});
