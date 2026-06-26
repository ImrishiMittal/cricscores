const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { getAuth } = require('../firebaseAdmin');

// ─── REGISTER (email/password) ───────────────────────────────────────────────
router.post("/register", async (req, res) => {
  try {
    const { username, email, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: "Email already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ username, email, password: hashedPassword, provider: "email" });
    await user.save();

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });
    res.status(201).json({ token, username: user.username, userId: user._id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── LOGIN (email/password) ──────────────────────────────────────────────────
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: "Invalid email or password" });

    if (!user.password) {
      return res.status(400).json({ error: "This account uses Google or Phone login" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ error: "Invalid email or password" });

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });
    res.json({ token, username: user.username, userId: user._id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── FIREBASE (Google + Phone OTP) ──────────────────────────────────────────
router.post("/firebase", async (req, res) => {
  try {
    const { firebaseToken, provider, displayName, email, phone } = req.body;

    // Verify Firebase token
    const decoded = await getAuth().verifyIdToken(firebaseToken);
    const uid = decoded.uid;

    // Find or create user
    // In routes/auth.js, replace the firebase route's user lookup:
let user = await User.findOne({ 
  $or: [{ firebaseUid: uid }, { email: decoded.email }] 
});

if (!user) {
  // create new user
  const username = displayName || (email ? email.split("@")[0] : null) || `user_${uid.slice(0, 6)}`;
  user = new User({ firebaseUid: uid, username, email: email || decoded.email || null, phone: phone || decoded.phone_number || null, provider });
  await user.save();
} else if (!user.firebaseUid) {
  // existing email/password user — link their Firebase UID
  user.firebaseUid = uid;
  user.provider = provider;
  await user.save();
}

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });
    res.json({ token, username: user.username, userId: user._id });
  } catch (err) {
    res.status(401).json({ error: "Firebase auth failed: " + err.message });
  }
});

module.exports = router;