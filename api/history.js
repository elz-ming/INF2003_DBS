const jwt = require("jsonwebtoken");
const cookie = require("cookie");
const db = require("../db"); // Import the database connection

const JWT_SECRET_KEY = process.env.JWT_SECRET_KEY;

module.exports = async (req, res) => {
  if (req.method === "GET") {
    const { types, dateSort, amountSort, startDate, endDate } = req.query;
    const cookies = req.headers.cookie ? cookie.parse(req.headers.cookie) : {};
    const token = cookies.authToken;

    try {
      const decoded = jwt.verify(token, JWT_SECRET_KEY);
      const userId = decoded.userId;
      const dateOrder = dateSort === "latest" ? "DESC" : "ASC";
      const amountOrder = amountSort === "highest" ? "DESC" : "ASC";

      let query = `
        SELECT id, amount, order_executed, transaction_type, price, quantity, ticker_code, stock_name, bank
        FROM (
          SELECT st.id, st.amount, st.order_executed, st.type AS transaction_type, st.price, st.quantity, 
                 s.ticker_code, s.name AS stock_name, NULL AS bank
          FROM stock_transactions st
          LEFT JOIN stocks s ON st.stock_id = s.id
          WHERE st.user_id = $1
          
          UNION ALL
          
          SELECT mt.id, mt.amount, mt.order_executed, mt.type AS transaction_type, NULL AS price, NULL AS quantity, 
                 NULL AS ticker_code, NULL AS stock_name, mt.bank
          FROM money_transactions mt
          WHERE mt.user_id = $1
        ) AS combined_transactions
      `;

      const values = [userId];

      // Apply date range filter if specified
      if (startDate) {
        query += ` WHERE order_executed >= $${values.length + 1}`;
        values.push(new Date(startDate).toISOString());
      }

      if (endDate) {
        query += ` WHERE order_executed <= $${values.length + 1}`;
        values.push(new Date(endDate).toISOString());
      }

      // Apply transaction type filter if specified
      if (types) {
        const typeArray = types.split(",").map((type) => type.trim());
        const typePlaceholders = typeArray.map(
          (_, index) => `$${values.length + index + 1}`
        );
        query += ` WHERE transaction_type IN (${typePlaceholders.join(", ")})`;
        values.push(...typeArray);
      }

      // Apply sorting
      query += ` ORDER BY DATE(order_executed) ${dateOrder}, amount ${amountOrder}`;

      const result = await db.query(query, values);
      res.status(200).json(result.rows);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Server Error", message: err.message });
    }
  } else {
    res.setHeader("Allow", ["GET"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
};
