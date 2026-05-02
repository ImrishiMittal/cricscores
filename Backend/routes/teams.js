const express = require("express");
const router  = express.Router();
const Team    = require("../models/Team");
const authMiddleware = require("../middleware/auth");

router.use(authMiddleware);

// ─── GET all teams for the logged-in user ─────────────────────────────────────
router.get("/", async (req, res) => {
  try {
    const teams = await Team.find({ userId: req.userId }).sort({ name: 1 });
    res.json(teams);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── POST — ensure team exists (upsert by name) ───────────────────────────────
// Returns the existing team if already present, creates it if not.
// Called by teamApi.ensureTeam() before every match save.
router.post("/", async (req, res) => {
  try {
    const { name } = req.body;
    if (!name?.trim()) {
      return res.status(400).json({ error: "Team name is required" });
    }
    const team = await Team.findOneAndUpdate(
      { userId: req.userId, name: name.trim() },
      { $setOnInsert: { userId: req.userId, name: name.trim() } },
      { upsert: true, new: true, runValidators: true }
    );
    res.status(200).json(team);
  } catch (err) {
    if (err.code === 11000) {
      try {
        const existing = await Team.findOne({ userId: req.userId, name: req.body.name.trim() });
        return res.status(200).json(existing);
      } catch (e) {
        return res.status(500).json({ error: e.message });
      }
    }
    res.status(400).json({ error: err.message });
  }
});

// ─── PATCH /:id — increment team stats (with matchId deduplication) ───────────
// Called by teamApi.updateTeamStats() at end of every match.
router.patch("/:id", async (req, res) => {
  try {
    const { matches, wins, losses, ties, nr, matchId } = req.body;

    const team = await Team.findOne({ _id: req.params.id, userId: req.userId });
    if (!team) return res.status(404).json({ error: "Team not found" });

    // ✅ Deduplication — skip if this matchId was already counted
    if (matchId && team.matchIds.includes(matchId)) {
      console.log(`⚠️  Duplicate team stat update for matchId ${matchId} — skipped`);
      return res.status(200).json(team);
    }

    const inc = {};
    if (matches) inc.matches = matches;
    if (wins)    inc.wins    = wins;
    if (losses)  inc.losses  = losses;
    if (ties)    inc.ties    = ties;
    if (nr)      inc.nr      = nr;

    const updated = await Team.findByIdAndUpdate(
      req.params.id,
      {
        $inc: inc,
        ...(matchId ? { $addToSet: { matchIds: matchId } } : {}),
      },
      { new: true }
    );

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── DELETE /:id — remove a team ──────────────────────────────────────────────
router.delete("/:id", async (req, res) => {
  try {
    const team = await Team.findOne({ _id: req.params.id, userId: req.userId });
    if (!team) return res.status(404).json({ error: "Team not found or not yours" });
    await team.deleteOne();
    res.json({ message: "Team deleted ✅" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;