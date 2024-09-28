const jwt = require("jsonwebtoken");
const cookie = require("cookie");
const db = require("../db"); // Assuming you have a database setup

const JWT_SECRET_KEY = process.env.JWT_SECRET_KEY;

module.exports = async (req, res) => {
  if (req.method === "POST") {
    const { action, amount } = req.body;
    const cookies = req.headers.cookie ? cookie.parse(req.headers.cookie) : {};
    const token = cookies.authToken;
    const decoded = jwt.verify(token, JWT_SECRET_KEY);
    const userId = decoded.userId;

    if (action === "deposit") {
      const depositQuery =
        "UPDATE users SET wallet_balance = wallet_balance + $1 WHERE id = $2";
      const depositValues = [amount, userId];
      await db.query(depositQuery, depositValues);

      const insertTransactionQuery =
        "INSERT INTO money_transactions (amount, user_id, type, bank) VALUES ($1, $2, 'deposit', 'ocbc')";
      const transactionValues = [amount, userId];
      await db.query(insertTransactionQuery, transactionValues);

      return res.status(200).json({ success: true });
    } else if (action === "withdraw") {
      const withdrawQuery =
        "UPDATE users SET wallet_balance = wallet_balance - $1 WHERE id = $2";
      const withdrawValues = [amount, userId];
      await db.query(withdrawQuery, withdrawValues);

      const insertTransactionQuery =
        "INSERT INTO money_transactions (amount, user_id, type, bank) VALUES ($1, $2, 'withdraw', 'ocbc')";
      const transactionValues = [amount, userId];
      await db.query(insertTransactionQuery, transactionValues);

      return res.status(200).json({ success: true });
    }
  }
};
