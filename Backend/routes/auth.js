const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const axios = require("axios");
const User = require("../models/User");
const { getAuth } = require('../firebaseAdmin');

// ─── REGISTER (email/password) ───────────────────────────────────────────────
router.post("/register", async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ error: "Email already registered" });
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
    if (!user.password) return res.status(400).json({ error: "This account uses Google or Phone login" });
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ error: "Invalid email or password" });
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });
    res.json({ token, username: user.username, userId: user._id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── FIREBASE (Google only) ──────────────────────────────────────────────────
router.post("/firebase", async (req, res) => {
  try {
    const { firebaseToken, provider, displayName, email, phone } = req.body;
    const decoded = await getAuth().verifyIdToken(firebaseToken);
    const uid = decoded.uid;
    let user = await User.findOne({ $or: [{ firebaseUid: uid }, { email: decoded.email }] });
    if (!user) {
      const username = displayName || (email ? email.split("@")[0] : null) || `user_${uid.slice(0, 6)}`;
      user = new User({ firebaseUid: uid, username, email: email || decoded.email || null, phone: phone || decoded.phone_number || null, provider });
      await user.save();
    } else if (!user.firebaseUid) {
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

// ─── SEND OTP (Fast2SMS) ─────────────────────────────────────────────────────
const otpStore = {};

router.post("/send-otp", async (req, res) => {
  try {
    const { phone } = req.body;
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    otpStore[phone] = { otp, expiresAt: Date.now() + 5 * 60 * 1000 };

    const { data } = await axios.get("https://www.fast2sms.com/dev/bulkV2", {
  params: {
    authorization: process.env.FAST2SMS_API_KEY,
    route: "q",                          // ← "q" for Quick SMS, not "otp"
    message: `Your CricScorers OTP is ${otp}. Valid for 5 minutes.`,
    language: "english",
    flash: 0,
    numbers: phone,
  }
});
    console.log("Fast2SMS response:", JSON.stringify(data));
    if (!data.return) throw new Error(data.message?.[0] || "SMS sending failed");

    res.json({ success: true });
  } catch (err) {
    console.error("Send OTP error:", err.message);
    console.error("Fast2SMS full error:", err.response?.data);
    res.status(500).json({ error: "Failed to send OTP: " + err.message });
  }
});

// ─── VERIFY OTP (Fast2SMS) ───────────────────────────────────────────────────
router.post("/verify-otp", async (req, res) => {
  try {
    const { phone, otp } = req.body;
    const record = otpStore[phone];
    if (!record) return res.status(400).json({ error: "OTP not requested" });
    if (Date.now() > record.expiresAt) return res.status(400).json({ error: "OTP expired" });
    if (record.otp !== otp) return res.status(400).json({ error: "Invalid OTP" });
    delete otpStore[phone];

    const phone_e164 = `+91${phone}`;
    let user = await User.findOne({ phone: phone_e164 });
    if (!user) {
      user = new User({ username: `user_${phone.slice(-4)}`, phone: phone_e164, provider: "phone" });
      await user.save();
    }
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });
    res.json({ token, username: user.username, userId: user._id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;