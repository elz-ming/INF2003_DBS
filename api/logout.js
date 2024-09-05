const cookie = require("cookie");

module.exports = async (req, res) => {
  if (req.method === "POST") {
    // Clear the auth cookie by setting it with a past expiry date
    res.setHeader(
      "Set-Cookie",
      cookie.serialize("auth", false, {
        httpOnly: true, // Keep it secure from client-side access
        expires: new Date(0), // Set the expiry date to the past to remove the cookie
        path: "/", // Ensure the cookie path is correct
      })
    );

    // Redirect to index.html after successful registration
    res.writeHead(302, { Location: "/screens/login.html" });
    res.end();
  } else {
    res.setHeader("Allow", ["POST"]);
    res.writeHead(405, `Method ${req.method} Not Allowed`);
    res.end();
  }
};
