const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const cookie = require("cookie");
const db = require("../db"); // Assuming you have a database setup

const JWT_SECRET_KEY = process.env.JWT_SECRET_KEY;

module.exports = async (req, res) => {
  if (req.method === "POST") {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).send("Email and password are required.");
    }

    const userResult = await db.queryPostgres(
      "SELECT id, password FROM users WHERE email = $1",
      [email]
    );

    const user = userResult.rows[0];
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).send(`
        <p>Invalid credentials.</p>
        <a href="/screens/login.html">Go back to the login page</a>
      `);
    }

    const token = jwt.sign({ userId: user.id }, JWT_SECRET_KEY, {
      expiresIn: "1h",
    });

    // Set the authentication cookie
    res.setHeader(
      "Set-Cookie",
      cookie.serialize("authToken", token, {
        httpOnly: true,
        maxAge: 60 * 60, // 1 hour
        path: "/",
        sameSite: "Strict",
      })
    );

    // Redirect to the homepage
    res.writeHead(302, { Location: "/" });
    res.end();
  } else {
    res.setHeader("Allow", ["POST"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
    res.end();
  }
};
