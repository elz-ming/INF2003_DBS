const db = require("../db");
const jwt = require("jsonwebtoken");
const cookie = require("cookie");

const JWT_SECRET_KEY = process.env.JWT_SECRET_KEY;

module.exports = async (req, res) => {
  try {
    const cookies = cookie.parse(req.headers.cookie || "");
    const token = cookies.authToken;

    if (!token) {
      return res.status(401).json({ error: "Unauthorized, no token provided" });
    }

    const decoded = jwt.verify(token, JWT_SECRET_KEY);
    const userId = decoded.userId;

    // Query the database to get the user's profile picture and its MIME type
    const result = await db.query(
      "SELECT profile_picture, profile_picture_mime_type FROM users WHERE id = $1", 
      [userId]
    );

    if (result.rows.length === 0 || !result.rows[0].profile_picture) {
      return res.status(404).json({ error: "Profile picture not found" });
    }

    const profilePicture = result.rows[0].profile_picture;
    const mimeType = result.rows[0].profile_picture_mime_type;

    // Set the appropriate Content-Type based on the image's MIME type
    res.setHeader("Content-Type", mimeType);
    res.end(profilePicture, "binary");
  } catch (err) {
    console.error("Error fetching profile picture: ", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
