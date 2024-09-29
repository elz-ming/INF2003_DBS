const jwt = require("jsonwebtoken");
const cookie = require("cookie");
const fs = require("fs");
const path = require("path");

const JWT_SECRET_KEY = process.env.JWT_SECRET_KEY;

module.exports = async (req, res) => {
  const cookies = req.headers.cookie ? cookie.parse(req.headers.cookie) : {};
  const token = cookies.authToken;
  const previousURL = cookies.previousURL || "/";

  // Paths for login and register pages
  const loginPaths = ["/screens/login.html", "/screens/register.html"];

  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET_KEY);
      req.userId = decoded.userId;

      // Redirect to the intended page or serve the requested page
      if (loginPaths.includes(previousURL)) {
        res.writeHead(302, { Location: "/" });
        res.end();
      }

      // Serve the requested HTML page
      servePage(previousURL, res);
    } catch (err) {
      // Token verification failed
      handleAuthError(res);
    }
  } else {
    // No token present
    if (loginPaths.includes(previousURL)) {
      // Allow access to login and register pages
      servePage(previousURL, res);
    } else {
      // Redirect to login page for unauthenticated access
      handleAuthError(res);
    }
  }
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
    });
    res.end(data);
  });
}

// Function to handle authentication errors
function handleAuthError(res) {
  res.setHeader(
    "Set-Cookie",
    cookie.serialize("authToken", "", {
      httpOnly: true, // Keep it secure from client-side access
      expires: new Date(0), // Set the expiry date to the past to remove the cookie
      path: "/", // Ensure the cookie path is correct
      sameSite: "Strict", // Improve security by restricting cookie sharing
    })
  );
  res.writeHead(401, { Location: "/screens/login.html" });
  res.end();
}
