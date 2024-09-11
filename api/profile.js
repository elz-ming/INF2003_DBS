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
  } else {
    res.setHeader("Allow", ["GET"]);
    res.writeHead(405, `Method ${req.method} Not Allowed`);
    res.end();
  }
};
