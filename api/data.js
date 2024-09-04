// api/data.js
const db = require("../db"); // Import the database connection

module.exports = async (req, res) => {
  if (req.method === "GET") {
    try {
      const result = await pool.query("SELECT * FROM users"); // Replace with your table name
      res.status(200).json(result.rows);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Server Error" });
    }
  } else {
    res.setHeader("Allow", ["GET"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
};
