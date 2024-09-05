document.addEventListener("DOMContentLoaded", () => {
  // Set the intended target or previous URL in a cookie before making the request
  document.cookie = `previousURL=${window.location.pathname}; path=/`;

  // Fetch from the serverless function endpoint exposed by Vercel
  fetch("/api/auth") // Correct endpoint
    .then((response) => {
      if (response.redirected) {
        // If the server responds with a redirect, follow it
        window.location.href = response.url;
      } else if (!response.ok) {
        // Redirect to login if not authenticated or on error
        window.location.href = "/screens/login.html";
      } else {
        // Handle successful authentication
        console.log("Authenticated:", response.status);
      }
    })
    .catch((error) => console.error("Error checking auth:", error));
});
