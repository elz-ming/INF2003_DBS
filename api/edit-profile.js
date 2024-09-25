const db = require("../db");
const jwt = require("jsonwebtoken");
const cookie = require("cookie");
const bcrypt = require("bcrypt");  // Import bcrypt for password hashing

const SALT_ROUNDS = 10;  // Define the salt rounds for hashing
const JWT_SECRET_KEY = process.env.JWT_SECRET_KEY;

module.exports = async (req, res) => {
  if (req.method === "POST") {
    try {
      // Extract form data
      const { name, email, password } = req.body;

      // Check if token exists in the cookies
      const cookies = cookie.parse(req.headers.cookie || "");
      const token = cookies.authToken;

      if (!token) {
        return res.status(401).json({ error: "Unauthorized, no token provided" });
      }

      // Verify the token and get the user ID
      const decoded = jwt.verify(token, JWT_SECRET_KEY);
      const userId = decoded.userId;

      // Check if the user is trying to update the password
      let hashedPassword = null;
      if (password) {
        // If the user has entered a new password, hash it
        hashedPassword = await bcrypt.hash(password, SALT_ROUNDS); // Hash the password
      }

      // Construct the SQL update query, only update the password if it was provided
      let updateQuery;
      let updateValues;
      if (hashedPassword) {
        updateQuery = `
          UPDATE users 
          SET name = $1, email = $2, password = $3
          WHERE id = $4`;
        updateValues = [name, email, hashedPassword, userId];
      } else {
        updateQuery = `
          UPDATE users 
          SET name = $1, email = $2
          WHERE id = $3`;
        updateValues = [name, email, userId];
      }

      // Execute the query
      const result = await db.query(updateQuery, updateValues);

      // Respond with a success message
      return res.status(200).json({
        success: true,
        message: "Profile updated successfully",
      });

    } catch (err) {
      // Log the error for debugging
      console.error("Error updating profile: ", err);
      return res.status(500).json({ error: "Internal Server Error" });
    }
  } else {
    // Only allow POST requests
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }
};
