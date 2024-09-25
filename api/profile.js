const db = require("../db");
const jwt = require("jsonwebtoken");
const cookie = require("cookie");

const JWT_SECRET_KEY = process.env.JWT_SECRET_KEY; // Ensure this is set in your environment

module.exports = async (req, res) => {
  if (req.method === "GET") {
    try {
      // Parse the cookie to get the token
      const cookies = cookie.parse(req.headers.cookie || "");
      const token = cookies.authToken;

      if (!token) {
        return res
          .writeHead(401, { "Content-Type": "application/json" })
          .end(JSON.stringify({ error: "Unauthorized" }));
      }

      // Verify the token and extract the userId
      const decoded = jwt.verify(token, JWT_SECRET_KEY);
      const userId = decoded.userId;

      // Query the database to get the user details
      const result = await db.query(
        "SELECT name, wallet_balance FROM users WHERE id = $1",
        [userId]
      );

      if (result.rows.length === 0) {
        return res
          .writeHead(404, { "Content-Type": "application/json" })
          .end(JSON.stringify({ error: "User not found" }));
      }

      // Respond with user profile data
      const user = result.rows[0];
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({ name: user.name, wallet_balance: user.wallet_balance })
      );
    } catch (err) {
      console.error("Error fetching profile:", err);
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Internal Server Error" }));
    }
  // Handle POST request - Update User Profile
} else if (req.method === "POST") {
  try {
    // Parse the cookie to get the token
    const cookies = cookie.parse(req.headers.cookie || "");
    const token = cookies.authToken;

    if (!token) {
      return res
        .writeHead(401, { "Content-Type": "application/json" })
        .end(JSON.stringify({ error: "Unauthorized" }));
    }

    // Verify the token and extract the userId
    const decoded = jwt.verify(token, JWT_SECRET_KEY);
    const userId = decoded.userId;

    // Parse request body to get the updated profile information
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res
        .writeHead(400, { "Content-Type": "application/json" })
        .end(JSON.stringify({ error: "Name, email, and password are required" }));
    }

    // Update the user profile in the database
    await db.query(
      "UPDATE users SET name = $1, email = $2, password = $3 WHERE id = $4",
      [name, email, password, userId]
    );

    // Respond with success message
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({ success: true, message: "Profile updated successfully" })
    );
  } catch (err) {
    console.error("Error updating profile:", err);
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Internal Server Error" }));
  }

// Handle unsupported methods
} else {
  res.setHeader("Allow", ["GET", "POST"]);
  res.writeHead(405, `Method ${req.method} Not Allowed`);
  res.end();
}
};