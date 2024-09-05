const cookie = require("cookie");
const fs = require("fs");
const path = require("path");

module.exports = (req, res) => {
  const cookies = req.headers.cookie ? cookie.parse(req.headers.cookie) : {};
  const isAuthenticated = cookies.auth === "true";
  const previousURL = cookies.previousURL || "/";

  // Check if this request has already been processed by adding a custom header
  if (req.headers["x-auth-checked"]) {
    // If the header is present, serve the requested page directly
    servePage(req, res);
    return;
  }

  // Paths for login and register pages
  const loginPaths = ["/screens/login.html", "/screens/register.html"];

  if (previousURL.startsWith("/api/")) {
    res.writeHead(400, { "Content-Type": "text/plain" });
    return res.end("Invalid request for API within itself.");
  }

  // If the user is not authenticated and tries to access a protected page, redirect to login
  if (!isAuthenticated && !loginPaths.includes(previousURL)) {
    res.writeHead(302, { Location: "/screens/login.html" });
    return res.end();
  }

  // If the user is authenticated and tries to access login or register pages, redirect them to the intended homepage or current page
  if (isAuthenticated && loginPaths.includes(previousURL)) {
    res.writeHead(302, { Location: "/", "x-auth-checked": "true" });
    return res.end();
  }

  // Serve the requested HTML page
  servePage(previousURL, res);
};

// Function to serve the requested HTML page
function servePage(previousURL, res) {
  const publicPath = path.join(__dirname, "../public");
  const filePath = path.resolve(
    publicPath,
    previousURL === "/" ? "index.html" : previousURL.substring(1) // Adjust for leading slash
  );

  // Read and serve the HTML file
  fs.readFile(filePath, "utf8", (err, data) => {
    if (err) {
      console.error(`Error reading ${filePath}:`, err);
      res.writeHead(404, { "Content-Type": "text/plain" });
      return res.end("Page Not Found");
    }

    // Serve the HTML file with the content type set to text/html
    res.writeHead(200, {
      "Content-Type": "text/html",
      "x-auth-checked": "true",
    });
    res.end(data);
  });
}
