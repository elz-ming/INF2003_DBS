const db = require("../db"); // Import the database connection

module.exports = async (req, res) => {
  if (req.method === "GET") {
    const { types, sort } = req.query;
    const sortOrder = sort === "ascending" ? "ASC" : "DESC";
    const typeFilters = types
      ? `AND type IN (${types
          .split(",")
          .map((type) => `'${type}'`)
          .join(",")})`
      : "";

    try {
      const query = `
        SELECT type, amount, tickercode, order_executed
        FROM transactions
        WHERE type IN ('Buy', 'Sell', 'Withdrawal', 'Deposit') ${typeFilters}
        ORDER BY order_executed ${sortOrder}
      `;
      const result = await db.query(query);
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
