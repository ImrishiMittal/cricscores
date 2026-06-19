// routes/squads.js
const express = require("express");
const router = express.Router();
const Squad = require("../models/Squad");
const authMiddleware = require("../middleware/auth");

router.use(authMiddleware);

// ─── GET /api/squads — list all squads for the logged-in user ────────────────
// Optional query params:
//   ?teamName=Team A            -> filter to one team
//   ?tournamentId=<id>          -> filter to one tournament's squads
//   ?teamName=Team A&tournamentId=<id> -> the exact lookup MatchSetupPage uses
router.get("/", async (req, res) => {
  try {
    const filter = { userId: req.userId };
    if (req.query.teamName) filter.teamName = req.query.teamName;

    if (req.query.tournamentId === "null") {
      filter.tournamentId = null;
    } else if (req.query.tournamentId) {
      filter.tournamentId = req.query.tournamentId;
    }

    const squads = await Squad.find(filter).sort({ teamName: 1 });
    res.json(squads);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/squads/:id — get a single squad ─────────────────────────────────
router.get("/:id", async (req, res) => {
  try {
    const squad = await Squad.findOne({
      _id: req.params.id,
      userId: req.userId,
    });
    if (!squad) return res.status(404).json({ error: "Squad not found" });
    res.json(squad);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /api/squads — create a squad ────────────────────────────────────────
// body: { teamName, tournamentId (optional), players: [{ jersey, name, role }] }
router.post("/", async (req, res) => {
  try {
    const { teamName, tournamentId, players } = req.body;

    if (!teamName?.trim()) {
      return res.status(400).json({ error: "Team name is required" });
    }

    const cleanPlayers = Array.isArray(players)
      ? players
          .map((p) => ({
            jersey: String(p.jersey || "").trim(),
            name: String(p.name || "").trim(),
            role: p.role || "batsman",
          }))
          .filter((p) => p.jersey && p.name)
      : [];

    const jerseys = cleanPlayers.map((p) => p.jersey);
    if (new Set(jerseys).size !== jerseys.length) {
      return res.status(400).json({ error: "Duplicate jersey numbers in squad" });
    }

    const squad = new Squad({
      userId: req.userId,
      teamName: teamName.trim(),
      tournamentId: tournamentId || null,
      players: cleanPlayers,
    });

    await squad.save();
    res.status(201).json(squad);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({
        error: "A squad for this team (and tournament, if set) already exists",
      });
    }
    res.status(400).json({ error: err.message });
  }
});

// ─── PATCH /api/squads/:id — update a squad's players or name ────────────────
router.patch("/:id", async (req, res) => {
  try {
    const squad = await Squad.findOne({
      _id: req.params.id,
      userId: req.userId,
    });
    if (!squad) return res.status(404).json({ error: "Squad not found" });

    const { teamName, players } = req.body;

    if (teamName !== undefined) {
      if (!teamName.trim()) {
        return res.status(400).json({ error: "Team name cannot be empty" });
      }
      squad.teamName = teamName.trim();
    }

    if (players !== undefined) {
      const cleanPlayers = Array.isArray(players)
        ? players
            .map((p) => ({
              jersey: String(p.jersey || "").trim(),
              name: String(p.name || "").trim(),
              role: p.role || "batsman",
            }))
            .filter((p) => p.jersey && p.name)
        : [];

      const jerseys = cleanPlayers.map((p) => p.jersey);
      if (new Set(jerseys).size !== jerseys.length) {
        return res.status(400).json({ error: "Duplicate jersey numbers in squad" });
      }

      squad.players = cleanPlayers;
    }

    await squad.save();
    res.json(squad);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({
        error: "A squad for this team (and tournament, if set) already exists",
      });
    }
    res.status(400).json({ error: err.message });
  }
});

// ─── DELETE /api/squads/:id — delete a squad ──────────────────────────────────
router.delete("/:id", async (req, res) => {
  try {
    const squad = await Squad.findOne({
      _id: req.params.id,
      userId: req.userId,
    });
    if (!squad) return res.status(404).json({ error: "Squad not found" });

    await squad.deleteOne();
    res.json({ message: "Squad deleted ✅" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;