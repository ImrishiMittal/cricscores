// Backend/routes/players.js
const express = require("express");
const router  = express.Router();
const Player  = require("../models/Player");
const authMiddleware = require("../middleware/auth");

router.use(authMiddleware);

// ── GET all players ───────────────────────────────────────────────────────────
router.get("/", async (req, res) => {
  try {
    const players = await Player.find({ userId: req.userId });
    res.json(players);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
router.get('/jersey/:jersey', async (req, res) => {
  try {
    const player = await Player.findOne({ 
      jersey: String(req.params.jersey),
      userId: req.userId  // ← ADD THIS so it only finds your own players
    });
    if (!player) {
      return res.status(404).json({ error: 'Player not found' });
    }
    res.json(player);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET single player ─────────────────────────────────────────────────────────
router.get("/:id", async (req, res) => {
  try {
    const player = await Player.findOne({ _id: req.params.id, userId: req.userId });
    if (!player) return res.status(404).json({ error: "Player not found." });
    res.json(player);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST create player ────────────────────────────────────────────────────────
router.post("/", async (req, res) => {
  try {
    const player = new Player({ ...req.body, userId: req.userId });
    await player.save();
    res.status(201).json(player);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ── PUT update profile fields only (name, jersey, country, role) ──────────────
// Stats are NEVER updated via PUT — only via PATCH /stats below.
router.put("/:id", async (req, res) => {
  try {
    const { name, jersey, country, role } = req.body;
    const player = await Player.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      { name, jersey, country, role },
      { new: true, runValidators: true }
    );
    if (!player) return res.status(404).json({ error: "Player not found." });
    res.json(player);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ── PATCH /:id/stats — flush one match's accumulated stats ────────────────────
//
// Called ONCE per player at end of match by usePlayerDatabase.updateMatchMilestones().
// The body (buf) contains everything usePlayerDatabase accumulated in pendingStatsRef:
//
//   { jersey, name, matchId,
//     runs, balls, wickets, runsGiven, ballsBowled,
//     fours, sixes, innings, bowlingInnings,
//     dotBalls, dotBallsBowled, ones, twos, threes,
//     thirties, fifties, hundreds, ducks, highestScore,
//     dismissals, notOuts,
//     wides, noBalls, maidens,
//     threeWickets, fiveWickets, tenWickets,
//     matches,
//     captainMatches, captainWins, captainLosses, captainTies, captainNR }
//
router.patch("/:id/stats", async (req, res) => {
  try {
    const player = await Player.findOne({ _id: req.params.id, userId: req.userId });
    if (!player) return res.status(404).json({ error: "Player not found." });

    const buf = req.body;
    const matchId = buf.matchId;

    // ── Match deduplication ─────────────────────────────────────────────────
    // If this matchId was already counted (e.g. double-flush), skip matches $inc
    const alreadyCounted = matchId && player.matchIds.includes(matchId);

    // ── Build $inc for all numeric stats ───────────────────────────────────
    // These field names MUST match Player.js schema exactly.
    const incFields = [
      "runs", "balls", "wickets", "runsGiven", "ballsBowled",
      "fours", "sixes", "innings", "bowlingInnings",
      "dotBalls", "dotBallsBowled", "ones", "twos", "threes",
      "thirties", "fifties", "hundreds", "ducks",
      "dismissals", "notOuts",
      "wides", "noBalls", "maidens",
      "threeWickets", "fiveWickets", "tenWickets",
      "catches", "runouts", "stumpings",
      "captainMatches", "captainWins", "captainLosses", "captainTies", "captainNR",
    ];

    const inc = {};
    for (const field of incFields) {
      const val = buf[field];
      if (val !== undefined && val !== 0) inc[field] = val;
    }

    // Only count match once even if player batted + bowled in same game
    if (!alreadyCounted && buf.matches) {
      inc.matches = buf.matches;
    }

    // ── Build the full update operation ────────────────────────────────────
    const updateOp = {};

    if (Object.keys(inc).length > 0) {
      updateOp.$inc = inc;
    }

    // highestScore — MongoDB $max only updates if new value is greater
    if (buf.highestScore > 0) {
      updateOp.$max = { highestScore: buf.highestScore };
    }

    // Best bowling — update only if this match's figures are better
    if (buf.wickets > 0) {
      const bestW = player.bestBowlingWickets || 0;
      const bestR = bestW === 0 ? 9999 : (player.bestBowlingRuns || 0);
      const isBetter = buf.wickets > bestW ||
        (buf.wickets === bestW && (buf.runsGiven || 0) < bestR);
      if (isBetter) {
        updateOp.$set = {
          bestBowlingWickets: buf.wickets,
          bestBowlingRuns:    buf.runsGiven || 0,
        };
      }
    }

    // Track matchIds for deduplication
    if (matchId) {
      updateOp.$addToSet = { matchIds: matchId };
      if ((buf.ballsBowled || 0) > 0) {
        // addToSet can merge multiple fields like this:
        updateOp.$addToSet.bowlingMatchIds = matchId;
      }
    }

    const updated = await Player.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      updateOp,
      { new: true }
    );

    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// routes/players.js — add this PATCH route for flushing buffered stats
router.patch("/:id/flush", async (req, res) => {
  try {
    const player = await Player.findOne({ _id: req.params.id, userId: req.userId });
    if (!player) return res.status(404).json({ error: "Player not found" });

    const {
      runs, balls, wickets, runsGiven, ballsBowled,
      fours, sixes, innings, bowlingInnings,
      dotBalls, dotBallsBowled, ones, twos, threes,
      ducks, thirties, fifties, hundreds,
      wides, noBalls, maidens,
      threeWickets, fiveWickets, tenWickets,
      dismissals, notOuts, matches,
      captainMatches, captainWins, captainLosses, captainTies, captainNR,
      highestScore,
    } = req.body;

    const inc = {};
    const addFields = [
      "runs","balls","wickets","runsGiven","ballsBowled","fours","sixes",
      "innings","bowlingInnings","dotBalls","dotBallsBowled","ones","twos",
      "threes","ducks","thirties","fifties","hundreds","wides","noBalls",
      "maidens","threeWickets","fiveWickets","tenWickets","dismissals",
      "notOuts","matches","captainMatches","captainWins","captainLosses",
      "captainTies","captainNR",
    ];

    for (const field of addFields) {
      if (req.body[field] !== undefined && req.body[field] !== 0) {
        inc[field] = req.body[field];
      }
    }

    const updateOp = { $inc: inc };

    // ✅ highestScore uses $max so it only updates if new score is higher
    if (highestScore !== undefined) {
      updateOp.$max = { highestScore };
    }

    const updated = await Player.findByIdAndUpdate(
      req.params.id,
      updateOp,
      { new: true }
    );

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
// ── DELETE player ─────────────────────────────────────────────────────────────
router.delete("/:id", async (req, res) => {
  try {
    const player = await Player.findOne({ _id: req.params.id, userId: req.userId });
    if (!player) return res.status(404).json({ error: "Player not found or not yours." });
    await player.deleteOne();
    res.json({ message: "Player deleted ✅" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
