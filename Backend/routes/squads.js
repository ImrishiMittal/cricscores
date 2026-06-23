// routes/squads.js
const express = require("express");
const router = express.Router();
const Squad = require("../models/Squad");
const authMiddleware = require("../middleware/auth");

router.use(authMiddleware);

// ─── GET /api/squads/find — find squad by teamName + optional tournamentId ───
// Used by MatchSetupPage / SquadManagerPage to load a saved squad.
// Priority: tournament-scoped squad first, then default squad for the team.
router.get("/find", async (req, res) => {
  try {
    const { teamName, tournamentId } = req.query;
    if (!teamName) return res.status(400).json({ error: "teamName is required" });

    let squad = null;

    // 1. Look for a squad scoped to this tournament
    if (tournamentId) {
      squad = await Squad.findOne({
        userId: req.userId,
        teamName,
        tournamentId,
      });
    }

    // 2. Fall back to the team's default squad (no tournamentId)
    if (!squad) {
      squad = await Squad.findOne({
        userId: req.userId,
        teamName,
        tournamentId: null,
      });
    }

    if (!squad) return res.status(404).json({ error: "Squad not found" });
    res.json(squad);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/squads/:id — fetch a single squad ───────────────────────────────
router.get("/:id", async (req, res) => {
  try {
    const squad = await Squad.findOne({ _id: req.params.id, userId: req.userId });
    if (!squad) return res.status(404).json({ error: "Squad not found" });
    res.json(squad);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/", async (req, res) => {
  try {
    const filter = { userId: req.userId };

    if (req.query.teamName) {
      filter.teamName = req.query.teamName;
    }

    if (req.query.tournamentId !== undefined) {
      filter.tournamentId = req.query.tournamentId === "null"
        ? null
        : req.query.tournamentId;
    }

    const squads = await Squad.find(filter).sort({ createdAt: -1 });
    res.json(squads);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /api/squads — create a squad (with loyalty check) ──────────────────
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

    // ── Within-squad duplicate jersey check ──────────────────────────────────
    const jerseys = cleanPlayers.map((p) => p.jersey);
    if (new Set(jerseys).size !== jerseys.length) {
      return res.status(400).json({ error: "Duplicate jersey numbers in squad" });
    }

    // ── Cross-squad loyalty check (tournament-scoped) ────────────────────────
    // If this squad belongs to a tournament, no jersey number may already
    // appear in any OTHER team's squad for the same tournament.
    if (tournamentId && cleanPlayers.length > 0) {
      const otherSquads = await Squad.find({
        userId: req.userId,
        tournamentId,
        teamName: { $ne: teamName.trim() },
      });

      const clashes = [];
      for (const other of otherSquads) {
        for (const op of other.players) {
          if (jerseys.includes(String(op.jersey))) {
            clashes.push({
              jersey: op.jersey,
              playerName: op.name,
              conflictTeam: other.teamName,
            });
          }
        }
      }

      if (clashes.length > 0) {
        return res.status(409).json({
          error: "Player loyalty conflict — the following players are already registered in another team in this tournament",
          clashes,
        });
      }
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

// ─── PATCH /api/squads/:id — update squad (with loyalty check) ───────────────
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

      // ── Cross-squad loyalty check on update ──────────────────────────────
      const effectiveTournamentId = squad.tournamentId || req.body.tournamentId || null;
if (effectiveTournamentId && cleanPlayers.length > 0) {
  const otherSquads = await Squad.find({
    userId: req.userId,
    tournamentId: effectiveTournamentId,
    teamName: { $ne: teamName?.trim() || squad.teamName },
    _id: { $ne: squad._id },
  });

        const clashes = [];
        for (const other of otherSquads) {
          for (const op of other.players) {
            if (jerseys.includes(String(op.jersey))) {
              clashes.push({
                jersey: op.jersey,
                playerName: op.name,
                conflictTeam: other.teamName,
              });
            }
          }
        }

        if (clashes.length > 0) {
          return res.status(409).json({
            error: "Player loyalty conflict — the following players are already registered in another team in this tournament",
            clashes,
          });
        }
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

// ─── DELETE /api/squads/:id — delete a squad ─────────────────────────────────
router.delete("/:id", async (req, res) => {
  try {
    const squad = await Squad.findOne({ _id: req.params.id, userId: req.userId });
    if (!squad) return res.status(404).json({ error: "Squad not found" });
    await squad.deleteOne();
    res.json({ message: "Squad deleted ✅" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;