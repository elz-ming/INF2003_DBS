const db = require("../db"); // PostgreSQL connection
const jwt = require("jsonwebtoken");
const cookie = require("cookie");
const Portfolio = require("../models/Portfolio"); // MongoDB Portfolio model

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

      // Fetch user data from PostgreSQL
      const userDataResult = await db.query(
        "SELECT id, name, wallet_balance FROM users WHERE id = $1",
        [userId]
      );

      if (userDataResult.rows.length === 0) {
        return res.status(404).json({ error: "User not found" });
      }

      const userData = userDataResult.rows[0];

      // Step 1: Fetch MongoDB portfolio data for the user
      const mongoPortfolio = await Portfolio.find({ user_id: userId });

      if (!mongoPortfolio || mongoPortfolio.length === 0) {
        return res.status(200).json({
          message: "No MongoDB portfolio data available.",
        });
      }

      // Step 2: Extract `stock_id` values from MongoDB data
      const stockIds = mongoPortfolio.map((item) => item.stock_id);

      // Step 3: Perform a PostgreSQL query using `stock_id` values from MongoDB
      const portfolioData = await db.query(
        `
        SELECT s.ticker, s.id AS stock_id, pr.regularmarketprice
        FROM stocks s
        JOIN prices pr ON pr.ticker = s.ticker
        WHERE s.id = ANY($1)
        AND pr.date = (
          SELECT MAX(date)
          FROM prices
          WHERE ticker = s.ticker
        );
        `,
        [stockIds]
      );

      // Step 4: Merge PostgreSQL and MongoDB data
      const combinedPortfolio = mongoPortfolio.map((mongoItem) => {
        const pgItem = portfolioData.rows.find(
          (pgRow) => pgRow.stock_id === mongoItem.stock_id
        );

        return {
          stock_id: mongoItem.stock_id,
          ticker: pgItem ? pgItem.ticker : "N/A",
          quantity: mongoItem.quantity["$numberInt"] || mongoItem.quantity,
          regularmarketprice: pgItem ? pgItem.regularmarketprice : 0,
          total_value: pgItem
            ? (mongoItem.quantity["$numberInt"] || mongoItem.quantity) *
              pgItem.regularmarketprice
            : 0,
        };
      });

      // Send the merged data as the response
      res.status(200).json({
        userData, // User data from PostgreSQL
        combinedPortfolio, // Merged portfolio data from PostgreSQL and MongoDB
      });
    } catch (err) {
      console.error("Error fetching profile:", err);
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Internal Server Error" }));
    }
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
