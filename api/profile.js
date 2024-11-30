const db = require("../db"); // PostgreSQL connection
const jwt = require("jsonwebtoken");
const cookie = require("cookie");
const mongoose = require("mongoose");
const Portfolio = require("../models/Portfolio"); // MongoDB Portfolio model
const Stock = require("../models/Stock"); // MongoDB Portfolio model

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

      // ====== Portfolio-related data retrieval ====== //

      // Step 1: Fetch MongoDB portfolio data for the user
      const mongoPortfolio = await Portfolio.find({ user_id: userId });

      if (!mongoPortfolio || mongoPortfolio.length === 0) {
        return res.status(200).json({
          userData,
          combinedPortfolio: [],
          message: "No portfolio data found for this user.",
        });
      }

      // Step 2: Extract stock IDs from the MongoDB portfolio
      const stockIds = mongoPortfolio
        .map((item) =>
          mongoose.Types.ObjectId.isValid(item.stock_id)
            ? new mongoose.Types.ObjectId(item.stock_id)
            : null
        )
        .filter((id) => id);

      // Step 3: Fetch stock data from MongoDB
      // Ensure all stockIds are treated as strings
      const stocks = await Stock.find({ _id: { $in: stockIds } });

      // Step 4: Merge portfolio and stock data
      const stockMap = stocks.reduce((acc, stock) => {
        acc[stock._id] = stock; // Use string-based IDs as keys
        return acc;
      }, {});

      const combinedPortfolio = mongoPortfolio.map((portfolioItem) => {
        const stock = stockMap[portfolioItem.stock_id];
        if (!stock) {
          console.warn(
            `Stock data not found for stock_id: ${portfolioItem.stock_id}`
          );
          return {
            stock_id: portfolioItem.stock_id,
            ticker: "Unknown",
            quantity: portfolioItem.quantity,
            regularmarketprice: 0,
            total_value: 0,
          };
        }

        const latestPrice =
          stock.prices?.[stock.prices.length - 1]?.regularmarketprice || 0;

        return {
          stock_id: portfolioItem.stock_id,
          ticker: stock.ticker || "Unknown",
          longname: stock.longname || "Unknown",
          quantity: portfolioItem.quantity,
          regularmarketprice: latestPrice,
          total_value: portfolioItem.quantity * latestPrice,
        };
      });

      // Send the response with combined portfolio data
      return res.status(200).json({
        userData,
        combinedPortfolio,
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
