const http = require('http');
const express = require('express');
const assert = require('assert');
const jwt = require('jsonwebtoken');
const db = require('./db');
const moneyTransactionHandler = require('./api/money-transaction');

const PORT = 3000;
const JWT_SECRET_KEY = process.env.JWT_SECRET_KEY || 'test_secret_key';
const testUserId = '550e8400-e29b-41d4-a716-446655440000';

// Generate a test JWT token for authentication
const authToken = jwt.sign({ userId: testUserId }, JWT_SECRET_KEY);

const app = express();
app.use(express.json());
app.post('/money-transaction', moneyTransactionHandler);

async function resetUserBalance(userId, amount) {
  // Reset the user's wallet balance before each test
  await db.query("UPDATE users SET wallet_balance = $1 WHERE id = $2", [amount, userId]);
}

// Start the test server
const server = app.listen(PORT, async () => {
  console.log(`Test server running on http://localhost:${PORT}`);

  try {
    // Reset the balance to 1000 before running tests
    await resetUserBalance(testUserId, 1000);

    // Step 1: Test a successful deposit
    const testDeposit = JSON.stringify({
      action: 'deposit',
      amount: 100
    });

    const depositResponse = await sendRequest('/money-transaction', testDeposit);
    assert.strictEqual(depositResponse.statusCode, 200);
    assert.strictEqual(depositResponse.data.success, true);
    console.log('Deposit test passed.');

    // Step 2: Test a withdrawal with insufficient funds
    const testWithdraw = JSON.stringify({
      action: 'withdraw',
      amount: 100000 // Large amount to trigger insufficient balance
    });

    const withdrawResponse = await sendRequest('/money-transaction', testWithdraw);
    assert.strictEqual(withdrawResponse.statusCode, 500);
    assert.strictEqual(withdrawResponse.data.error, 'Transaction failed, rollback executed');
    console.log('Withdrawal rollback test passed.');

    // Step 3: Verify that the balance did not change due to rollback
    const finalBalanceResult = await db.query('SELECT wallet_balance FROM users WHERE id = $1', [testUserId]);
    const finalBalance = finalBalanceResult.rows[0]?.wallet_balance;
    console.log(`Final balance: ${finalBalance}`);
    assert.strictEqual(finalBalance, 1100, 'Balance should be 1100 after deposit');

    console.log('All tests passed!');
  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    // Reset the balance to 1000 after tests are complete
    await resetUserBalance(testUserId, 1000);
    await db.end();
    server.close();
    console.log('Test server closed.');
  }
});

// Helper function to send HTTP requests
function sendRequest(path, body) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: PORT,
      path: path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `authToken=${authToken}`
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          data: JSON.parse(data)
        });
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    req.write(body);
    req.end();
  });
}
