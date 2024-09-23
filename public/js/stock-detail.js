document.addEventListener("DOMContentLoaded", () => {
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

  // Update the header with the ticker value
  function updateHeaderWithTicker() {
    const { ticker } = getQueryParams();
    if (ticker) {
      document.getElementById("title").textContent = `${ticker}`;
    }
  }

  // Call function to update the header when the page loads
  updateHeaderWithTicker();
});
