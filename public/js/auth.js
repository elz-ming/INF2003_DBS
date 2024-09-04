// Function to get a cookie value by name
function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(";").shift();
  return null;
}

// Check if the user is logged in by verifying the presence of the JWT
function checkAuth() {
  const token = getCookie("token"); // Read the JWT token from cookies
  if (!token) {
    window.location.href = "/screens/signup.html"; // Redirect to login if not logged in
  }
}

// Call checkAuth on pages that require authentication
checkAuth();
