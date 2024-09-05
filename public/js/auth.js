document.addEventListener("DOMContentLoaded", () => {
  // Redirect to login if not authenticated
  fetch("/api/auth")
    .then((response) => {
      if (!response.ok) {
        window.location.href = "/screens/login.html";
      }
    })
    .catch((error) => console.error("Error checking auth:", error));
});
