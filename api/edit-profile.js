const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt"); // To hash passwords
const cookie = require("cookie");
const db = require("../db"); // Your database connection

const SALT_ROUNDS = 10; // Number of salt rounds for bcrypt
const JWT_SECRET_KEY = process.env.JWT_SECRET_KEY;

module.exports = async (req, res) => {
  const cookies = req.headers.cookie ? cookie.parse(req.headers.cookie) : {};
  const token = cookies.authToken;

  // Check if user is authenticated
  if (!token) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  let decoded;
  try {
    decoded = jwt.verify(token, JWT_SECRET_KEY);
  } catch (error) {
    return res.status(401).json({ error: "Invalid token" });
  }

  const userId = decoded.userId;

  if (req.method === "GET") {
    // Handle fetching existing user profile data
    try {
      const result = await db.queryPostgres(
        "SELECT name, email FROM users WHERE id = $1",
        [userId]
      );
      if (result.rows.length === 0) {
        return res.status(404).json({ error: "User not found" });
      }

      // Return the user's name and email
      const { name, email } = result.rows[0];
      res.status(200).json({ name, email });
    } catch (error) {
      console.error("Error fetching user data:", error);
      res.status(500).json({ error: "Failed to fetch profile data" });
    }
  } else if (req.method === "POST") {
    // Handle updating the user's profile data
    const { name, email, password, confirmPassword } = req.body;

    // Validate input
    if (password && password !== confirmPassword) {
      return res.status(400).json({ error: "Passwords do not match" });
    }

    // Prepare fields for update
    const updateFields = [];
    const values = [];
    let index = 1; // For parameterized query placeholders ($1, $2, ...)

    if (name) {
      updateFields.push(`name = $${index}`);
      values.push(name);
      index++;
    }

    if (email) {
      updateFields.push(`email = $${index}`);
      values.push(email);
      index++;
    }

    if (password) {
      const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
      updateFields.push(`password = $${index}`);
      values.push(hashedPassword);
      index++;
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ error: "No changes detected" });
    }

    // Add the userId as the last parameter
    values.push(userId);

    const updateQuery = `
      UPDATE users 
      SET ${updateFields.join(", ")} 
      WHERE id = $${index}
    `;

    try {
      await db.queryPostgres(updateQuery, values);
      res.writeHead(302, { Location: "/screens/profile.html" });
      res.end();
    } catch (error) {
      console.error("Error updating profile:", error);
      res.status(500).json({ error: "Failed to update profile" });
    }
  } else {
    res.setHeader("Allow", ["GET", "POST"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
};
