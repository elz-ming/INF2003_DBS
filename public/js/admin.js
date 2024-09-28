document.addEventListener("DOMContentLoaded", () => {
  // Set the title of the page
  document.getElementById("title").textContent = "ADMIN";

  // Get the back button element by its ID
  const backButton = document.getElementById("back-button");

  // Ensure the back button exists before adding an event listener
  if (backButton) {
    backButton.addEventListener("click", () => {
      window.location.href = "/screens/home.html"; // Adjust the path to your homepage if needed
    });
  }

  // Fetch data when the "fetch-data-button" is clicked
  const fetchDataButton = document.getElementById("fetch-data-button");
  if (fetchDataButton) {
    fetchDataButton.addEventListener("click", fetchData);
  }
});

async function fetchData() {
  console.log("Fetch Data button clicked");
  try {
    const response = await fetch("/api/combinedStockAPI");
    if (!response.ok) throw new Error("Network response was not ok");

    const data = await response.json();
    console.log("Fetched Data:", data); // Log the entire data object

    // Adjust based on the actual response structure
    document.getElementById("data").textContent = JSON.stringify(data, null, 2);
  } catch (error) {
    console.error("Error in fetchData:", error);
  }
}
