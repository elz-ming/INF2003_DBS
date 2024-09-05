const bcrypt = require("bcrypt");
const cookie = require("cookie");
const db = require("../db"); // Assuming you have a database setup

module.exports = async (req, res) => {
  if (req.method === "POST") {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).send("Email and password are required.");
    }

    const user = await db.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);

    if (
      user.rows.length === 0 ||
      !(await bcrypt.compare(password, user.rows[0].password))
    ) {
      return res.status(401).send(`
        <p>Invalid credentials.</p>
        <a href="/screens/login.html">Go back to the login page</a>
      `);
    }

    // Set the authentication cookie
    res.setHeader(
      "Set-Cookie",
      cookie.serialize("auth", true, {
        httpOnly: true,
        maxAge: 60 * 60 * 24 * 7, // 1 week
        path: "/",
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
