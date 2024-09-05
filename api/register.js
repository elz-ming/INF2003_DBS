const bcrypt = require("bcrypt"); // To hash passwords
const cookie = require("cookie");
const db = require("../db"); // Your database connection
const SALT_ROUNDS = 10; // Number of salt rounds for bcrypt

module.exports = async (req, res) => {
  if (req.method === "POST") {
    const { name, email, password, confirmPassword } = req.body;

    // Check if all fields are provided
    if (!name || !email || !password || !confirmPassword) {
      return res.status(400).send(`
        <p>All fields are required.</p>
        <a href="/screens/register.html">Go back to the sign-up page</a>
      `);
    }

    // Check if passwords match
    if (password !== confirmPassword) {
      return res.status(400).send(`
        <p>All fields are required.</p>
        <a href="/screens/register.html">Go back to the sign-up page</a>
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
          <a href="/screens/register.html">Go back to the sign-up page</a>
        `);
      }

      // Hash the password
      const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

      // Insert the new user into the database
      await db.query(
        "INSERT INTO users (name, email, password) VALUES ($1, $2, $3)",
        [name, email, hashedPassword]
      );

      // Set the authentication cookie
      res.setHeader(
        "Set-Cookie",
        cookie.serialize("auth", true, {
          httpOnly: true,
          maxAge: 60 * 60 * 24 * 7, // 1 week
          path: "/",
        })
      );

      // Redirect to index.html after successful registration
      res.writeHead(302, { Location: "/" });
      res.end();
    } catch (error) {
      console.error("Error during sign-up:", error);
      res.status(500).send(`
        <p>Server error. Please try again later.</p>
        <a href="/screens/register.html">Go back to the sign-up page</a>
      `);
    }
  } else {
    // Method not allowed
    res.setHeader("Allow", ["POST"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
};
