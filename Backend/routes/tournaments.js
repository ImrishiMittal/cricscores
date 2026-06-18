// routes/tournaments.js
const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Tournament = require("../models/Tournament");
const Fixture = require("../models/Fixture");
const authMiddleware = require("../middleware/auth");

router.use(authMiddleware);

// ─── Helper: generate round-robin pairings ───────────────────────────────────
// Uses the standard "circle method": fix one team, rotate the rest each round.
// If the team count is odd, a virtual "BYE" slot is added so every round still
// pairs everyone up — whoever is paired against "BYE" simply sits that round out.
// Returns an array of { teamA, teamB } pairs for ONE leg (single round-robin).
function generateSingleRoundRobinPairs(teams) {
  const list = [...teams];
  if (list.length % 2 !== 0) {
    list.push("BYE");
  }

  const n = list.length;
  const rounds = n - 1;
  const half = n / 2;
  const pairs = [];

  // Work on a mutable copy we rotate each round.
  let rotation = [...list];

  for (let round = 0; round < rounds; round++) {
    for (let i = 0; i < half; i++) {
      const teamA = rotation[i];
      const teamB = rotation[n - 1 - i];
      if (teamA !== "BYE" && teamB !== "BYE") {
        pairs.push({ teamA, teamB });
      }
    }

    // Rotate: keep rotation[0] fixed, shift everyone else by one position.
    const fixed = rotation[0];
    const rest = rotation.slice(1);
    rest.unshift(rest.pop());
    rotation = [fixed, ...rest];
  }

  return pairs;
}

// Builds the full fixture pair list for a tournament, respecting roundRobinType.
// For "double", the second leg mirrors the first with teamA/teamB swapped —
// this also doubles as a home/away split if venue info is added later.
function generateFixturePairs(teams, roundRobinType) {
  const leg1 = generateSingleRoundRobinPairs(teams);
  if (roundRobinType !== "double") {
    return leg1;
  }
  const leg2 = leg1.map(({ teamA, teamB }) => ({ teamA: teamB, teamB: teamA }));
  return [...leg1, ...leg2];
}

// Builds a fresh standings array (all zeroes) from a team list.
function buildInitialStandings(teams) {
  return teams.map((teamName) => ({
    teamName,
    played: 0,
    wins: 0,
    losses: 0,
    ties: 0,
    nr: 0,
    points: 0,
    runsFor: 0,
    ballsFor: 0,
    runsAgainst: 0,
    ballsAgainst: 0,
    nrr: 0,
  }));
}

// ─── POST / — create tournament ───────────────────────────────────────────────
router.post("/", async (req, res) => {
  try {
    const {
      name,
      format,
      overs,
      days,
      teams,
      roundRobinType,
      pointsRules,
    } = req.body;

    if (!name?.trim()) {
      return res.status(400).json({ error: "Tournament name is required" });
    }
    if (!format || !["Limited Overs", "Test"].includes(format)) {
      return res.status(400).json({ error: "Valid format is required" });
    }
    if (!Array.isArray(teams) || teams.length < 2) {
      return res.status(400).json({ error: "At least 2 teams are required" });
    }

    const cleanTeams = teams.map((t) => String(t).trim()).filter(Boolean);
    const uniqueTeams = new Set(cleanTeams);
    if (uniqueTeams.size !== cleanTeams.length) {
      return res.status(400).json({ error: "Team names must be unique" });
    }

    const tournament = new Tournament({
      userId: req.userId,
      name: name.trim(),
      format,
      overs: format === "Limited Overs" ? overs : null,
      days: format === "Test" ? days : null,
      teams: cleanTeams,
      roundRobinType: roundRobinType === "double" ? "double" : "single",
      pointsRules: pointsRules || undefined,
      standings: buildInitialStandings(cleanTeams),
      status: "upcoming",
    });

    await tournament.save();
    res.status(201).json(tournament);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ─── GET / — list all tournaments for the logged-in user ─────────────────────
router.get("/", async (req, res) => {
  try {
    const tournaments = await Tournament.find({ userId: req.userId }).sort({
      createdAt: -1,
    });
    res.json(tournaments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /:id — get single tournament ─────────────────────────────────────────
router.get("/:id", async (req, res) => {
  try {
    const tournament = await Tournament.findOne({
      _id: req.params.id,
      userId: req.userId,
    });
    if (!tournament) {
      return res.status(404).json({ error: "Tournament not found" });
    }
    res.json(tournament);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /:id/fixtures — generate fixtures (round robin) ────────────────────
// Idempotent-ish: refuses to regenerate if fixtures already exist, unless
// ?force=true is passed, since regenerating would orphan any fixtures that
// already have linked Match data.
router.post("/:id/fixtures", async (req, res) => {
  try {
    const tournament = await Tournament.findOne({
      _id: req.params.id,
      userId: req.userId,
    });
    if (!tournament) {
      return res.status(404).json({ error: "Tournament not found" });
    }

    const existingCount = await Fixture.countDocuments({
      tournamentId: tournament._id,
    });
    const force = req.query.force === "true";

    if (existingCount > 0 && !force) {
      return res.status(400).json({
        error:
          "Fixtures already exist for this tournament. Pass ?force=true to regenerate (this will delete existing fixtures).",
      });
    }

    if (existingCount > 0 && force) {
      await Fixture.deleteMany({ tournamentId: tournament._id });
    }

    const pairs = generateFixturePairs(
      tournament.teams,
      tournament.roundRobinType
    );

    if (pairs.length === 0) {
      return res
        .status(400)
        .json({ error: "Could not generate fixtures — check team list" });
    }

    const fixtureDocs = pairs.map(({ teamA, teamB }) => ({
      userId: req.userId,
      tournamentId: tournament._id,
      teamA,
      teamB,
      stage: "league",
      status: "scheduled",
    }));

    const created = await Fixture.insertMany(fixtureDocs);

    tournament.status = "ongoing";
    await tournament.save();

    res.status(201).json(created);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ─── GET /:id/fixtures — list fixtures for a tournament ──────────────────────
router.get("/:id/fixtures", async (req, res) => {
  try {
    const tournament = await Tournament.findOne({
      _id: req.params.id,
      userId: req.userId,
    });
    if (!tournament) {
      return res.status(404).json({ error: "Tournament not found" });
    }

    const fixtures = await Fixture.find({ tournamentId: tournament._id }).sort({
      createdAt: 1,
    });
    res.json(fixtures);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── PATCH /:id/fixtures/:fixtureId — update fixture result ──────────────────
// Updates the cached result fields on the Fixture and applies the result
// to the tournament's standings array. Designed to be called once a Match
// (scored elsewhere in the app) has been completed and linked via matchId.
router.patch("/:id/fixtures/:fixtureId", async (req, res) => {
  try {
    const tournament = await Tournament.findOne({
      _id: req.params.id,
      userId: req.userId,
    });
    if (!tournament) {
      return res.status(404).json({ error: "Tournament not found" });
    }

    const fixture = await Fixture.findOne({
      _id: req.params.fixtureId,
      tournamentId: tournament._id,
    });
    if (!fixture) {
      return res.status(404).json({ error: "Fixture not found" });
    }

    const {
      matchId,
      winner, // teamA name, teamB name, "Tie", or "No Result"
      resultText,
      teamARuns,
      teamAWickets,
      teamABalls,
      teamBRuns,
      teamBWickets,
      teamBBalls,
      status,
    } = req.body;

    // If this fixture was already completed, back out its previous
    // contribution to standings before applying the new result —
    // keeps PATCH safe to call more than once (e.g. correcting a score).
    if (fixture.status === "completed") {
      applyFixtureToStandings(tournament, fixture, { reverse: true });
    }

    if (matchId !== undefined) fixture.matchId = matchId;
    if (winner !== undefined) fixture.winner = winner;
    if (resultText !== undefined) fixture.resultText = resultText;
    if (teamARuns !== undefined) fixture.teamARuns = teamARuns;
    if (teamAWickets !== undefined) fixture.teamAWickets = teamAWickets;
    if (teamABalls !== undefined) fixture.teamABalls = teamABalls;
    if (teamBRuns !== undefined) fixture.teamBRuns = teamBRuns;
    if (teamBWickets !== undefined) fixture.teamBWickets = teamBWickets;
    if (teamBBalls !== undefined) fixture.teamBBalls = teamBBalls;
    fixture.status = status || "completed";

    if (fixture.status === "completed") {
      applyFixtureToStandings(tournament, fixture, { reverse: false });
    }

    await fixture.save();
    await tournament.save();

    res.json({ fixture, standings: tournament.standings });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ─── DELETE /:id — delete tournament (and its fixtures) ──────────────────────
router.delete("/:id", async (req, res) => {
  try {
    const tournament = await Tournament.findOne({
      _id: req.params.id,
      userId: req.userId,
    });
    if (!tournament) {
      return res.status(404).json({ error: "Tournament not found" });
    }

    await Fixture.deleteMany({ tournamentId: tournament._id });
    await tournament.deleteOne();

    res.json({ message: "Tournament deleted ✅" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Helper: apply (or reverse) a completed fixture's result to standings ────
// Mutates tournament.standings in place. Does NOT save — caller saves.
function applyFixtureToStandings(tournament, fixture, { reverse }) {
  const sign = reverse ? -1 : 1;
  const rules = tournament.pointsRules || {};
  const winPts = rules.win ?? 2;
  const lossPts = rules.loss ?? 0;
  const tiePts = rules.tie ?? 1;
  const nrPts = rules.noResult ?? 1;

  const entryA = tournament.standings.find(
    (s) => s.teamName === fixture.teamA
  );
  const entryB = tournament.standings.find(
    (s) => s.teamName === fixture.teamB
  );
  if (!entryA || !entryB) return;

  // Runs/balls always accrue regardless of result (needed for NRR),
  // except for a true "No Result" where no overs were effectively bowled.
  if (fixture.winner !== "No Result") {
    entryA.runsFor += sign * (fixture.teamARuns || 0);
    entryA.ballsFor += sign * (fixture.teamABalls || 0);
    entryA.runsAgainst += sign * (fixture.teamBRuns || 0);
    entryA.ballsAgainst += sign * (fixture.teamBBalls || 0);

    entryB.runsFor += sign * (fixture.teamBRuns || 0);
    entryB.ballsFor += sign * (fixture.teamBBalls || 0);
    entryB.runsAgainst += sign * (fixture.teamARuns || 0);
    entryB.ballsAgainst += sign * (fixture.teamABalls || 0);
  }

  entryA.played += sign * 1;
  entryB.played += sign * 1;

  if (fixture.winner === "Tie") {
    entryA.ties += sign * 1;
    entryB.ties += sign * 1;
    entryA.points += sign * tiePts;
    entryB.points += sign * tiePts;
  } else if (fixture.winner === "No Result") {
    entryA.nr += sign * 1;
    entryB.nr += sign * 1;
    entryA.points += sign * nrPts;
    entryB.points += sign * nrPts;
  } else if (fixture.winner === fixture.teamA) {
    entryA.wins += sign * 1;
    entryB.losses += sign * 1;
    entryA.points += sign * winPts;
    entryB.points += sign * lossPts;
  } else if (fixture.winner === fixture.teamB) {
    entryB.wins += sign * 1;
    entryA.losses += sign * 1;
    entryB.points += sign * winPts;
    entryA.points += sign * lossPts;
  }

  // Recalculate NRR for both teams: (runsFor/oversFor) - (runsAgainst/oversAgainst).
  // Balls are converted to overs as balls/6 for the standard cricket NRR formula.
  [entryA, entryB].forEach((entry) => {
    const oversFor = entry.ballsFor / 6;
    const oversAgainst = entry.ballsAgainst / 6;
    const rateFor = oversFor > 0 ? entry.runsFor / oversFor : 0;
    const rateAgainst = oversAgainst > 0 ? entry.runsAgainst / oversAgainst : 0;
    entry.nrr = Math.round((rateFor - rateAgainst) * 1000) / 1000;
  });
}

module.exports = router;