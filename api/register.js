const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt"); // To hash passwords
const cookie = require("cookie");
const db = require("../db"); // Your database connection
const SALT_ROUNDS = 10; // Number of salt rounds for bcrypt

const JWT_SECRET_KEY = process.env.JWT_SECRET_KEY;

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
      // Check if the email already exists
      const existingUserResult = await db.query(
        "SELECT * FROM users WHERE email = $1",
        [email]
      );
      if (existingUserResult.rows.length > 0) {
        return res.status(400).send(`
        <p>Email is already registered.</p>
        <a href="/screens/register.html">Go back to the registration page</a>
      `);
      }

      // Hash the password
      const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

      // Insert the new user into the database
      const insertResult = await db.query(
        "INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING id",
        [name, email, hashedPassword]
      );

      const token = jwt.sign(
        { userId: insertResult.rows[0].id },
        JWT_SECRET_KEY,
        {
          expiresIn: "1h",
        }
      );

      // Set the authentication cookie
      res.setHeader(
        "Set-Cookie",
        cookie.serialize("authToken", token, {
          httpOnly: true,
          maxAge: 60 * 60 * 24 * 7, // 1 week
          path: "/",
          sameSite: "Strict",
        })
      );

      // Redirect to the homepage
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
