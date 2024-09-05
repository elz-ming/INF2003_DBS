const cookie = require("cookie");
const fs = require("fs");
const path = require("path");

module.exports = (req, res) => {
  const cookies = req.headers.cookie ? cookie.parse(req.headers.cookie) : {};
  const isAuthenticated = cookies.auth === "true";

  // Log the request URL and authentication status for debugging
  console.log("Requested URL:", req.url);
  console.log("Is Authenticated:", isAuthenticated);

  // Paths for login and register pages
  const loginPaths = ["/screens/login.html", "/screens/register.html"];

  // If the user is not authenticated, redirect to the login page
  if (!isAuthenticated && !loginPaths.includes(req.url)) {
    console.log("User not authenticated, redirecting to /screens/login.html");
    res.writeHead(302, { Location: "/screens/login.html" });
    return res.end();
  }

  // If the user is authenticated and tries to access login or register pages, redirect to homepage
  if (isAuthenticated && loginPaths.includes(req.url)) {
    console.log("User already authenticated, redirecting to /");
    res.writeHead(302, { Location: "/" });
    return res.end();
  }

  // Serve the homepage or other protected content if authenticated
  if (isAuthenticated) {
    const indexPath = path.join(__dirname, "../public/index.html"); // Path to the homepage
    fs.readFile(indexPath, "utf8", (err, data) => {
      if (err) {
        console.error("Error reading index.html:", err);
        res.writeHead(500, { "Content-Type": "text/plain" });
        return res.end("Internal Server Error");
      }

      res.writeHead(200, { "Content-Type": "text/html" });
      res.end(data); // Serve the actual homepage content
    });
  } else {
    // Handle other pages as needed or serve default response
    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end("Access granted to protected content");
  }
};
