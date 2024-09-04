// api/signup.js
const bcrypt = require("bcrypt"); // To hash passwords
const db = require("../db"); // Your database connection
const SALT_ROUNDS = 10; // Number of salt rounds for bcrypt

module.exports = async (req, res) => {
  if (req.method === "POST") {
    const { name, email, password, confirmPassword } = req.body;

    // Check if all fields are provided
    if (!name || !email || !password || !confirmPassword) {
      console.log(confirmPassword);
      return res.status(400).send(`
        <p>All fields are required.</p>
        <a href="/screens/signup.html">Go back to the sign-up page</a>
      `);
    }

    // Check if passwords match
    if (password !== confirmPassword) {
      return res.status(400).send(`
        <p>All fields are required.</p>
        <a href="/screens/signup.html">Go back to the sign-up page</a>
      `);
    }

    // Check if the user already exists
    try {
      const existingUser = await db.query(
        "SELECT * FROM users WHERE email = $1",
        [email]
      );
      if (existingUser.rows.length > 0) {
        return res.status(409).send(`
          <p>Email already registered.</p>
          <a href="/screens/signup.html">Go back to the sign-up page</a>
        `);
      }

      // Hash the password
      const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

      // Insert the new user into the database
      await db.query(
        "INSERT INTO users (name, email, password) VALUES ($1, $2, $3)",
        [name, email, hashedPassword]
      );

      // Set the token in a cookie or respond with the token
      res.setHeader(
        "Set-Cookie",
        "isLoggedIn=true; HttpOnly; Path=/; Max-Age=3600; SameSite=Lax"
      );

      // Redirect to index.html after successful registration
      res.writeHead(302, { Location: "/" });
      res.end();
    } catch (error) {
      console.error("Error during sign-up:", error);
      res.status(500).send(`
        <p>Server error. Please try again later.</p>
        <a href="/screens/signup.html">Go back to the sign-up page</a>
      `);
    }
  } else {
    // Method not allowed
    res.setHeader("Allow", ["POST"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
};
