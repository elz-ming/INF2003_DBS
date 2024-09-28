document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("title").textContent = `EDIT`;

  // Get the back button element by its ID
  const backButton = document.getElementById("back-button");

  // Add a click event listener to redirect to the homepage
  backButton.addEventListener("click", () => {
    window.location.href = "/screens/profile.html"; // Adjust the path to your homepage if needed
  });

  // Function to fetch the existing user profile data
  async function fetchProfileData() {
    try {
      const response = await fetch("/api/edit-profile", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      // Check if the request was successful
      if (!response.ok) {
        throw new Error(`Error fetching profile data: ${response.statusText}`);
      }

      // Parse the JSON data
      const data = await response.json();

      // Populate the input fields with the existing data
      document.getElementById("name").placeholder = data.name || "";
      document.getElementById("email").placeholder = data.email || "";
    } catch (error) {
      console.error("Failed to fetch profile data:", error);
      alert("Failed to load profile data. Please try again later.");
    }
  }

  // Call the function to fetch profile data on page load
  fetchProfileData();
});
