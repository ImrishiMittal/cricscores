const express = require("express");
const router  = express.Router();
const Match   = require("../models/Match");
const authMiddleware = require("../middleware/auth");

// ─── PUBLIC (no auth) ─────────────────────────────────────────────────────────

router.get("/:matchId/public", async (req, res) => {
  try {
    const id = req.params.matchId;

    let match = await Match.findOne({ matchId: id }).lean();

    if (!match && id.match(/^[a-f\d]{24}$/i)) {
      match = await Match.findById(id).lean();
    }

    if (!match) return res.status(404).json({ error: "Match not found" });
    res.json(match);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── AUTH WALL ────────────────────────────────────────────────────────────────

router.use(authMiddleware);

// ─── GET all matches ──────────────────────────────────────────────────────────

router.get("/", async (req, res) => {
  try {
    const matches = await Match.find({ userId: req.userId }).sort({ createdAt: -1 });
    res.json(matches);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── GET single match ─────────────────────────────────────────────────────────

router.get("/:id", async (req, res) => {
  try {
    let match = await Match.findOne({ matchId: req.params.id, userId: req.userId });

    if (!match && req.params.id.match(/^[a-f\d]{24}$/i)) {
      match = await Match.findOne({ _id: req.params.id, userId: req.userId });
    }

    if (!match) return res.status(404).json({ error: "Match not found." });
    res.json(match);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── POST save match ──────────────────────────────────────────────────────────

router.post("/", async (req, res) => {
  try {
    if (!req.body.matchId) {
      return res.status(400).json({ error: "matchId is required" });
    }
    const existing = await Match.findOne({
      matchId: req.body.matchId,
      userId: req.userId,
    });
    if (existing) {
      console.log(`⚠️ Duplicate saveMatch for ${req.body.matchId} — skipped`);
      return res.status(200).json(existing);
    }
    const winner = req.body.winner || "";
    const resultText = req.body.resultText ||
      (winner === "TIE" ? "Match Tied" :
       winner === "NO RESULT" ? "No Result" :
       winner ? `${winner} won` : "Result pending");
    const match = new Match({ ...req.body, resultText, userId: req.userId });
    await match.save();
    res.status(201).json(match);
  } catch (err) {
    if (err.code === 11000) {
      const existing = await Match.findOne({
        matchId: req.body.matchId,
        userId: req.userId,
      });
      return res.status(200).json(existing);
    }
    res.status(400).json({ error: err.message });
  }
});

// ─── DELETE match ─────────────────────────────────────────────────────────────

router.delete("/:id", async (req, res) => {
  try {
    const match = await Match.findOne({ _id: req.params.id, userId: req.userId });
    if (!match) return res.status(404).json({ error: "Match not found or not yours." });
    await match.deleteOne();
    res.json({ message: "Match deleted ✅" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;