const jwt = require("jsonwebtoken");

function authMiddleware(req, res, next) {
  // Expect header: Authorization: Bearer <token>
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "No token provided. Please log in." });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId; // attach userId to every protected request
    next();
  } catch (err) {
    return res.status(401).json({ error: "Token expired or invalid. Please log in again." });
  }
}

module.exports = authMiddleware;