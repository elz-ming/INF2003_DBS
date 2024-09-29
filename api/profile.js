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

      const [userData, portfolioData] = await Promise.all([
        // Query 1: Get User Data
        db.query(
          `
          SELECT name, 
                  wallet_balance 
          FROM users 
          WHERE id = $1;
        `,
          [userId]
        ),

        db.query(
          `
          SELECT s.ticker,
                  p.quantity, 
                  pr.regularmarketprice
          FROM portfolios p
          JOIN stocks s 
          ON p.stock_id = s.id
          JOIN prices pr 
          ON pr.ticker = s.ticker
          WHERE p.user_id = $1
          AND pr.date = (
            SELECT MAX(date) 
            FROM prices 
            WHERE ticker = s.ticker
          );
        `,
          [userId]
        ),
      ]);

      res.status(200).json({
        userData: userData.rows[0], // Only take the latest row if available
        portfolioData: portfolioData.rows, // Can have multiple rows depending on the data
      });
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
          .end(
            JSON.stringify({ error: "Name, email, and password are required" })
          );
      }

      // Update the user profile in the database
      await db.query(
        "UPDATE users SET name = $1, email = $2, password = $3 WHERE id = $4",
        [name, email, password, userId]
      );

      // Respond with success message
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          success: true,
          message: "Profile updated successfully",
        })
      );
    } catch (err) {
      console.error("Error updating profile:", err);
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Internal Server Error" }));
    }

    // Handle unsupported methods
  } else if (req.method === "DELETE") {
    // Handle DELETE request - Delete User Account
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

      // Delete the user from the database
      await db.query("DELETE FROM users WHERE id = $1", [userId]);

      // Clear the authentication cookie to log out the user
      res.setHeader(
        "Set-Cookie",
        cookie.serialize("authToken", "", {
          httpOnly: true,
          path: "/",
          expires: new Date(0), // Expire the cookie immediately
          sameSite: "Strict",
        })
      );

      // Respond with success message
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          success: true,
          message: "Account deleted successfully. Logged out.",
        })
      );
    } catch (err) {
      console.error("Error deleting account:", err);
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Internal Server Error" }));
    }
  } else {
    res.setHeader("Allow", ["GET", "POST"]);
    res.writeHead(405, `Method ${req.method} Not Allowed`);
    res.end();
  }
};
