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
