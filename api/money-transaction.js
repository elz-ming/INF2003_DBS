const jwt = require("jsonwebtoken");
const cookie = require("cookie");
const db = require("../db");

const JWT_SECRET_KEY = process.env.JWT_SECRET_KEY;

module.exports = async (req, res) => {
  if (req.method === "POST") {
    const { action, amount } = req.body;
    const cookies = req.headers.cookie ? cookie.parse(req.headers.cookie) : {};
    const token = cookies.authToken;
    const decoded = jwt.verify(token, JWT_SECRET_KEY);
    const userId = decoded.userId;

    console.log("Transaction started");

    // Begin transaction
    try {
      await db.query("BEGIN");

      if (action === "deposit") {
        console.log("Performing deposit...");

        const depositQuery =
          "UPDATE users SET wallet_balance = wallet_balance + $1 WHERE id = $2";
        const depositValues = [amount, userId];
        await db.query(depositQuery, depositValues);

        const insertTransactionQuery =
          "INSERT INTO money_transactions (amount, user_id, type, bank) VALUES ($1, $2, 'deposit', 'ocbc')";
        const transactionValues = [amount, userId];
        await db.query(insertTransactionQuery, transactionValues);

        console.log("Deposit successful, committing transaction");
        await db.query("COMMIT");
        return res.status(200).json({ success: true });

      } else if (action === "withdraw") {
        console.log("Performing withdrawal...");

        // Check if the user has sufficient balance
        const balanceCheckQuery = "SELECT wallet_balance FROM users WHERE id = $1";
        const balanceCheckResult = await db.query(balanceCheckQuery, [userId]);
        const currentBalance = balanceCheckResult.rows[0]?.wallet_balance || 0;

        console.log(`Current balance: ${currentBalance}, Withdrawal amount: ${amount}`);

        if (currentBalance < amount) {
          console.error("Insufficient balance, triggering rollback");
          await db.query("ROLLBACK");
          console.log("Transaction rolled back due to insufficient balance");

          // Move the return after the rollback logs
          return res.status(400).json({ error: "Transaction is voided, withdrawal amount exceeds wallet balance" });
        }

        const withdrawQuery =
          "UPDATE users SET wallet_balance = wallet_balance - $1 WHERE id = $2";
        const withdrawValues = [amount, userId];
        await db.query(withdrawQuery, withdrawValues);

        const insertTransactionQuery =
          "INSERT INTO money_transactions (amount, user_id, type, bank) VALUES ($1, $2, 'withdraw', 'ocbc')";
        const transactionValues = [amount, userId];
        await db.query(insertTransactionQuery, transactionValues);

        console.log("Withdrawal successful, committing transaction");
        await db.query("COMMIT");
        return res.status(200).json({ success: true });
      }
    } catch (error) {
      console.error(`Transaction failed: ${error.message}`);

      // Rollback the transaction if any other error occurs
      try {
        await db.query("ROLLBACK");
        console.log("Transaction rolled back due to error");
      } catch (rollbackError) {
        console.error("Rollback failed:", rollbackError.message);
      }

      return res.status(500).json({ error: "Transaction failed, rollback executed" });
    }
  }
};
