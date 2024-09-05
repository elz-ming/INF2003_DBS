async function fetchData() {
  try {
    const response = await fetch("/api/data");
    if (!response.ok) throw new Error("Network response was not ok");
    const data = await response.json();
    document.getElementById("data").textContent = JSON.stringify(data, null, 2);
  } catch (error) {
    console.error("Error fetching data:", error);
  }
}
