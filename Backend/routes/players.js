// Backend/routes/players.js — complete version
const express = require("express");
const router  = express.Router();
const Player  = require("../models/Player");
const authMiddleware = require("../middleware/auth");

router.use(authMiddleware);

// ─── GET all players for logged-in user ───────────────────────────────────────
router.get("/", async (req, res) => {
  try {
    const players = await Player.find({ userId: req.userId }).sort({ name: 1 });
    res.json(players);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── GET single player by _id ─────────────────────────────────────────────────
router.get("/:id", async (req, res) => {
  try {
    const player = await Player.findOne({ _id: req.params.id, userId: req.userId });
    if (!player) return res.status(404).json({ error: "Player not found." });
    res.json(player);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── POST — create a new player ───────────────────────────────────────────────
router.post("/", async (req, res) => {
  try {
    const { name, jersey } = req.body;
    if (!name?.trim()) return res.status(400).json({ error: "Name is required" });

    // Check for jersey conflict within this user's players
    if (jersey) {
      const conflict = await Player.findOne({ userId: req.userId, jersey: String(jersey) });
      if (conflict) {
        return res.status(200).json(conflict); // Return existing — idempotent
      }
    }

    const player = new Player({
      ...req.body,
      userId: req.userId,
      jersey: jersey ? String(jersey) : "",
    });
    await player.save();
    res.status(201).json(player);
  } catch (err) {
    if (err.code === 11000) {
      // Race condition duplicate — return existing
      try {
        const existing = await Player.findOne({
          userId: req.userId,
          jersey: String(req.body.jersey),
        });
        if (existing) return res.status(200).json(existing);
      } catch {}
    }
    res.status(400).json({ error: err.message });
  }
});

// ─── POST /find-or-create — get by jersey, create if missing ─────────────────
// Called by createOrFindByJersey() in playerApi.js
router.post("/find-or-create", async (req, res) => {
  try {
    const { jersey, name } = req.body;
    if (!jersey) return res.status(400).json({ error: "jersey is required" });

    let player = await Player.findOne({ userId: req.userId, jersey: String(jersey) });
    if (!player) {
      player = new Player({
        userId: req.userId,
        jersey: String(jersey),
        name: name || `Player ${jersey}`,
      });
      await player.save();
    }
    res.status(200).json(player);
  } catch (err) {
    if (err.code === 11000) {
      try {
        const existing = await Player.findOne({
          userId: req.userId,
          jersey: String(req.body.jersey),
        });
        if (existing) return res.status(200).json(existing);
      } catch {}
    }
    res.status(500).json({ error: err.message });
  }
});

// ─── PATCH /:id — update player fields (name, jersey, etc.) ──────────────────
router.patch("/:id", async (req, res) => {
  try {
    const player = await Player.findOne({ _id: req.params.id, userId: req.userId });
    if (!player) return res.status(404).json({ error: "Player not found." });

    // If a $inc operation is included (from flushStats), apply it
    if (req.body.$inc) {
      const updated = await Player.findByIdAndUpdate(
        req.params.id,
        { $inc: req.body.$inc },
        { new: true }
      );
      return res.json(updated);
    }

    // Jersey conflict check when changing jersey
    if (req.body.jersey && req.body.jersey !== player.jersey) {
      const conflict = await Player.findOne({
        userId: req.userId,
        jersey: String(req.body.jersey),
        _id: { $ne: req.params.id },
      });
      if (conflict) {
        return res.status(409).json({
          error: `Jersey #${req.body.jersey} is already taken by ${conflict.name}`,
        });
      }
    }

    // Standard field update
    const allowedFields = [
      "name", "jersey", "country", "role",
    ];
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) player[field] = req.body[field];
    });

    await player.save();
    res.json(player);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── PATCH /:id/stats — flush accumulated match stats ($inc) ─────────────────
// Called by playerApi.flushStats() at end of every match.
// Accepts the pendingStats buffer directly; increments all numeric fields.
router.patch("/:id/stats", async (req, res) => {
  try {
    const player = await Player.findOne({ _id: req.params.id, userId: req.userId });
    if (!player) return res.status(404).json({ error: "Player not found." });

    const buf = req.body;
    const inc = {};

    const addFields = [
      "runs", "balls", "wickets", "runsGiven", "ballsBowled",
      "fours", "sixes", "innings", "dotBalls", "dotBallsBowled",
      "ones", "twos", "threes", "thirties", "fifties", "hundreds", "ducks",
      "dismissals", "notOuts", "wides", "noBalls", "maidens",
      "threeWickets", "fiveWickets", "tenWickets", "matches",
      "captainMatches", "captainWins", "captainLosses", "captainTies", "captainNR",
      "bowlingInnings", "catches", "runouts", "stumpings",
    ];

    for (const field of addFields) {
      if (buf[field] !== undefined && buf[field] !== 0) {
        inc[field] = buf[field];
      }
    }

    const updateOp = { $inc: inc };

    // highestScore — only update if new value is higher
    if (buf.highestScore !== undefined && buf.highestScore > 0) {
      updateOp.$max = { highestScore: buf.highestScore };
    }

    // bestBowling — handled separately (complex logic, skip $inc)
    const updated = await Player.findByIdAndUpdate(req.params.id, updateOp, { new: true });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── DELETE /:id — permanently remove a player ────────────────────────────────
// Called by playerApi.deletePlayer() from PlayerDatabaseModal.
// Only deletes if the player belongs to the logged-in user.
router.delete("/:id", async (req, res) => {
  try {
    const player = await Player.findOne({ _id: req.params.id, userId: req.userId });
    if (!player) {
      return res.status(404).json({ error: "Player not found or not yours." });
    }
    await player.deleteOne();
    res.json({ success: true, deletedId: req.params.id, name: player.name });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
