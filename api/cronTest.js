// // /api/cronTest.js
// const db = require("../db"); // Import the database connection

// export default async function handler(req, res) {
//   console.log("Cron is running");
//   try {
//     // Add data to the "test" table
//     const testName = "Test Name " + new Date().toISOString();
//     const result = await db.query("INSERT INTO test (test_name) VALUES (?)", [
//       testName,
//     ]);

//     res.status(200).json({ message: "Data inserted successfully", result });
//   } catch (error) {
//     res.status(500).json({ message: "Error inserting data", error });
//   }
// }

export function GET(request) {
  return new Response(`Hello from Me`);
}
