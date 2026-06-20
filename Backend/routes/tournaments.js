// routes/tournaments.js
const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Tournament = require("../models/Tournament");
const Fixture = require("../models/Fixture");
const authMiddleware = require("../middleware/auth");

router.use(authMiddleware);

const KNOCKOUT_MINIMUMS = { top2: 3, top4: 4, top8: 8, ipl: 4, none: 2 };

// ─── Helper: generate round-robin pairings ───────────────────────────────────
function generateSingleRoundRobinPairs(teams) {
  const list = [...teams];
  if (list.length % 2 !== 0) list.push("BYE");

  const n = list.length;
  const rounds = n - 1;
  const half = n / 2;
  const pairs = [];
  let rotation = [...list];

  for (let round = 0; round < rounds; round++) {
    for (let i = 0; i < half; i++) {
      const teamA = rotation[i];
      const teamB = rotation[n - 1 - i];
      if (teamA !== "BYE" && teamB !== "BYE") pairs.push({ teamA, teamB });
    }
    const fixed = rotation[0];
    const rest = rotation.slice(1);
    rest.unshift(rest.pop());
    rotation = [fixed, ...rest];
  }
  return pairs;
}

function generateRoundRobinForPool(teams, roundRobinType) {
  const leg1 = generateSingleRoundRobinPairs(teams);
  if (roundRobinType !== "double") return leg1;
  const leg2 = leg1.map(({ teamA, teamB }) => ({ teamA: teamB, teamB: teamA }));
  return [...leg1, ...leg2];
}

function splitIntoGroups(teams, numGroups) {
  const perGroup = teams.length / numGroups;
  const groups = [];
  for (let g = 0; g < numGroups; g++) {
    groups.push(teams.slice(g * perGroup, (g + 1) * perGroup));
  }
  return groups;
}

function generateFixturePairs(tournament) {
  const { teams, roundRobinType, leagueFormat, numGroups } = tournament;

  if (leagueFormat === "groups" && numGroups) {
    const groups = splitIntoGroups(teams, numGroups);
    return groups.flatMap((groupTeams, idx) =>
      generateRoundRobinForPool(groupTeams, roundRobinType).map((pair) => ({
        ...pair,
        group: `Group ${String.fromCharCode(65 + idx)}`,
      }))
    );
  }
  return generateRoundRobinForPool(teams, roundRobinType);
}

function buildInitialStandings(teams) {
  return teams.map((teamName) => ({
    teamName,
    played: 0, wins: 0, losses: 0, ties: 0, nr: 0, points: 0,
    runsFor: 0, ballsFor: 0, runsAgainst: 0, ballsAgainst: 0, nrr: 0,
  }));
}

// ─── Helper: sort standings by points → NRR → name ──────────────────────────
function sortStandings(standings) {
  return [...standings].sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.nrr !== a.nrr) return b.nrr - a.nrr;
    return a.teamName.localeCompare(b.teamName);
  });
}

// ─── Helper: get sorted standings for a group (or whole tournament) ──────────
// For group-stage tournaments we rank within each group separately so we can
// pick "top N from each group" or "top N overall" depending on knockoutFormat.
// This helper returns a map: { overall: [...], groupA: [...], groupB: [...] }
async function computeGroupStandings(tournament) {
  const fixtures = await Fixture.find({
    tournamentId: tournament._id,
    stage: "league",
    status: "completed",
  });

  if (tournament.leagueFormat !== "groups") {
    return { overall: sortStandings(tournament.standings) };
  }

  // Partition standings by group
  const groupMap = {}; // "Group A" -> [teamName, ...]
  fixtures.forEach((f) => {
    if (f.group) {
      if (!groupMap[f.group]) groupMap[f.group] = new Set();
      groupMap[f.group].add(f.teamA);
      groupMap[f.group].add(f.teamB);
    }
  });

  const result = { overall: sortStandings(tournament.standings) };
  Object.entries(groupMap).forEach(([groupLabel, teamSet]) => {
    const key = groupLabel.replace(" ", "").toLowerCase(); // "groupa", "groupb" …
    result[key] = sortStandings(
      tournament.standings.filter((s) => teamSet.has(s.teamName))
    );
  });
  return result;
}

// ─── Knockout bracket templates ──────────────────────────────────────────────
// Each entry describes one knockout fixture slot.
// `winnerGoesTo` uses "<targetSlot>:<side>" to tell the progression helper
// which team slot to fill in the next fixture when this one completes.
// Seeds (1-indexed, matching sorted-standings rank) are used to assign teams.
// TBD teams are filled in as "" initially (await progression).

function buildKnockoutFixtures(format, seeds) {
  // seeds[0] = 1st place team, seeds[1] = 2nd, …
  const s = (n) => seeds[n - 1] || ""; // 1-indexed seed → team name

  switch (format) {
    case "top2":
      // League top 2 → Final
      return [
        {
          knockoutSlot: "F",
          stage: "final",
          teamA: s(1),
          teamB: s(2),
          winnerGoesTo: null,
        },
      ];

    case "top4":
      // Semi 1: 1 vs 4, Semi 2: 2 vs 3 → Final
      return [
        {
          knockoutSlot: "SF1",
          stage: "semifinal",
          teamA: s(1),
          teamB: s(4),
          winnerGoesTo: "F:teamA",
        },
        {
          knockoutSlot: "SF2",
          stage: "semifinal",
          teamA: s(2),
          teamB: s(3),
          winnerGoesTo: "F:teamB",
        },
        {
          knockoutSlot: "F",
          stage: "final",
          teamA: "",
          teamB: "",
          winnerGoesTo: null,
        },
      ];

    case "top8":
      // QF: 1v8, 2v7, 3v6, 4v5 → SF1 (winner QF1 vs winner QF2) …
      return [
        { knockoutSlot: "QF1", stage: "quarterfinal", teamA: s(1), teamB: s(8), winnerGoesTo: "SF1:teamA" },
        { knockoutSlot: "QF2", stage: "quarterfinal", teamA: s(2), teamB: s(7), winnerGoesTo: "SF1:teamB" },
        { knockoutSlot: "QF3", stage: "quarterfinal", teamA: s(3), teamB: s(6), winnerGoesTo: "SF2:teamA" },
        { knockoutSlot: "QF4", stage: "quarterfinal", teamA: s(4), teamB: s(5), winnerGoesTo: "SF2:teamB" },
        { knockoutSlot: "SF1", stage: "semifinal",    teamA: "",   teamB: "",   winnerGoesTo: "F:teamA" },
        { knockoutSlot: "SF2", stage: "semifinal",    teamA: "",   teamB: "",   winnerGoesTo: "F:teamB" },
        { knockoutSlot: "F",   stage: "final",        teamA: "",   teamB: "",   winnerGoesTo: null },
      ];

    case "ipl":
      // Q1: 1v2  → winner → Final, loser → Q2
      // EL: 3v4  → winner → Q2, loser → out
      // Q2: loser(Q1) vs winner(EL) → winner → Final
      // F:  winner(Q1) vs winner(Q2)
      return [
        { knockoutSlot: "Q1", stage: "qualifier1", teamA: s(1), teamB: s(2), winnerGoesTo: "F:teamA",  loserGoesTo: "Q2:teamA" },
        { knockoutSlot: "EL", stage: "eliminator", teamA: s(3), teamB: s(4), winnerGoesTo: "Q2:teamB", loserGoesTo: null },
        { knockoutSlot: "Q2", stage: "qualifier2", teamA: "",   teamB: "",   winnerGoesTo: "F:teamB",  loserGoesTo: null },
        { knockoutSlot: "F",  stage: "final",      teamA: "",   teamB: "",   winnerGoesTo: null,       loserGoesTo: null },
      ];

    default:
      return [];
  }
}

// ─── Helper: propagate a completed knockout fixture's winner/loser ───────────
// Finds sibling fixtures by knockoutSlot and fills in the right team slot.
// IPL format needs loser routing for Q1→Q2.
async function propagateKnockoutResult(fixture, tournament) {
  if (!fixture.winnerGoesTo && !fixture.loserGoesTo) return;

  const allKnockout = await Fixture.find({
    tournamentId: tournament._id,
    stage: { $ne: "league" },
  });

  const slotMap = {};
  allKnockout.forEach((f) => { if (f.knockoutSlot) slotMap[f.knockoutSlot] = f; });

  const winner = fixture.winner;
  const loser  = fixture.winner === fixture.teamA ? fixture.teamB
               : fixture.winner === fixture.teamB ? fixture.teamA
               : null; // tie / no result (shouldn't happen in knockouts)

  const fillSlot = async (goesTo, teamName) => {
    if (!goesTo || !teamName) return;
    const [targetSlot, side] = goesTo.split(":");
    const target = slotMap[targetSlot];
    if (!target) return;
    target[side] = teamName;
    await target.save();
  };

  await fillSlot(fixture.winnerGoesTo, winner);
  await fillSlot(fixture.loserGoesTo,  loser);
}

// ─── POST / — create tournament ───────────────────────────────────────────────
router.post("/", async (req, res) => {
  try {
    const {
      name, format, overs, matchDays, oversPerDay,
      teams, roundRobinType, leagueFormat, numGroups,
      knockoutFormat, pointsRules, superOver,
    } = req.body;

    if (!name?.trim()) return res.status(400).json({ error: "Tournament name is required" });
    if (!format || !["Limited Overs", "Test"].includes(format))
      return res.status(400).json({ error: "Valid format is required" });
    if (!Array.isArray(teams) || teams.length < 2)
      return res.status(400).json({ error: "At least 2 teams are required" });

    const cleanTeams = teams.map((t) => String(t).trim()).filter(Boolean);
    const uniqueTeams = new Set(cleanTeams);
    if (uniqueTeams.size !== cleanTeams.length)
      return res.status(400).json({ error: "Team names must be unique" });

    const resolvedLeagueFormat = leagueFormat === "groups" ? "groups" : "roundRobin";

    if (resolvedLeagueFormat === "groups") {
      const g = Number(numGroups);
      if (!g || g < 2) return res.status(400).json({ error: "Number of groups must be at least 2" });
      if (cleanTeams.length % g !== 0)
        return res.status(400).json({ error: `${cleanTeams.length} teams can't be split evenly into ${g} groups` });
      if (cleanTeams.length / g < 3)
        return res.status(400).json({ error: `Each group needs at least 3 teams` });
    }

    const resolvedKnockout = knockoutFormat && KNOCKOUT_MINIMUMS[knockoutFormat] ? knockoutFormat : "none";
    const minRequired = KNOCKOUT_MINIMUMS[resolvedKnockout];
    if (cleanTeams.length < minRequired)
      return res.status(400).json({ error: `Knockout format "${resolvedKnockout}" needs at least ${minRequired} teams` });

    const tournament = new Tournament({
      userId: req.userId,
      name: name.trim(),
      format,
      overs: format === "Limited Overs" ? overs : null,
      matchDays: format === "Test" ? matchDays : null,
      oversPerDay: format === "Test" ? oversPerDay : null,
      teams: cleanTeams,
      leagueFormat: resolvedLeagueFormat,
      roundRobinType: roundRobinType === "double" ? "double" : "single",
      numGroups: resolvedLeagueFormat === "groups" ? Number(numGroups) : null,
      knockoutFormat: resolvedKnockout,
      pointsRules: pointsRules || undefined,
      superOver: superOver || undefined,
      standings: buildInitialStandings(cleanTeams),
      status: "upcoming",
    });

    await tournament.save();
    res.status(201).json(tournament);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ─── GET / — list all tournaments ────────────────────────────────────────────
router.get("/", async (req, res) => {
  try {
    const tournaments = await Tournament.find({ userId: req.userId }).sort({ createdAt: -1 });
    res.json(tournaments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /:id — single tournament ────────────────────────────────────────────
router.get("/:id", async (req, res) => {
  try {
    const tournament = await Tournament.findOne({ _id: req.params.id, userId: req.userId });
    if (!tournament) return res.status(404).json({ error: "Tournament not found" });
    res.json(tournament);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /:id/fixtures — generate league fixtures ───────────────────────────
router.post("/:id/fixtures", async (req, res) => {
  try {
    const tournament = await Tournament.findOne({ _id: req.params.id, userId: req.userId });
    if (!tournament) return res.status(404).json({ error: "Tournament not found" });

    const existingCount = await Fixture.countDocuments({ tournamentId: tournament._id, stage: "league" });
    const force = req.query.force === "true";

    if (existingCount > 0 && !force)
      return res.status(400).json({ error: "League fixtures already exist. Pass ?force=true to regenerate." });
    if (existingCount > 0 && force)
      await Fixture.deleteMany({ tournamentId: tournament._id, stage: "league" });

    const pairs = generateFixturePairs(tournament);
    if (pairs.length === 0)
      return res.status(400).json({ error: "Could not generate fixtures — check team list" });

    const fixtureDocs = pairs.map(({ teamA, teamB, group }) => ({
      userId: req.userId,
      tournamentId: tournament._id,
      teamA,
      teamB,
      stage: "league",
      group: group || null,
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

// ─── POST /:id/fixtures/manual — manually specify league fixtures ─────────────
router.post("/:id/fixtures/manual", async (req, res) => {
  try {
    const tournament = await Tournament.findOne({ _id: req.params.id, userId: req.userId });
    if (!tournament) return res.status(404).json({ error: "Tournament not found" });

    const { pairs, force } = req.body;
    if (!Array.isArray(pairs) || pairs.length === 0)
      return res.status(400).json({ error: "At least one matchup is required" });

    const teamSet = new Set(tournament.teams);
    const matchCount = {};
    tournament.teams.forEach((t) => { matchCount[t] = 0; });

    for (const pair of pairs) {
      if (!teamSet.has(pair?.teamA) || !teamSet.has(pair?.teamB))
        return res.status(400).json({ error: `Unknown team: ${pair?.teamA} vs ${pair?.teamB}` });
      if (pair.teamA === pair.teamB)
        return res.status(400).json({ error: "A team cannot play itself" });
      matchCount[pair.teamA]++;
      matchCount[pair.teamB]++;
    }

    const counts = Object.values(matchCount);
    if (!counts.every((c) => c === counts[0]))
      return res.status(400).json({ error: "Uneven schedule — every team must play the same number of matches", matchCount });

    const existingCount = await Fixture.countDocuments({ tournamentId: tournament._id, stage: "league" });
    const forceFlag = force === true || req.query.force === "true";
    if (existingCount > 0 && !forceFlag)
      return res.status(400).json({ error: "League fixtures already exist. Pass force=true to regenerate." });
    if (existingCount > 0 && forceFlag)
      await Fixture.deleteMany({ tournamentId: tournament._id, stage: "league" });

    const fixtureDocs = pairs.map(({ teamA, teamB }) => ({
      userId: req.userId, tournamentId: tournament._id,
      teamA, teamB, stage: "league", status: "scheduled",
    }));

    const created = await Fixture.insertMany(fixtureDocs);
    tournament.status = "ongoing";
    await tournament.save();

    res.status(201).json(created);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ─── GET /:id/fixtures — list all fixtures ───────────────────────────────────
router.get("/:id/fixtures", async (req, res) => {
  try {
    const tournament = await Tournament.findOne({ _id: req.params.id, userId: req.userId });
    if (!tournament) return res.status(404).json({ error: "Tournament not found" });

    const fixtures = await Fixture.find({ tournamentId: tournament._id }).sort({ createdAt: 1 });
    res.json(fixtures);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /:id/knockout/generate — seed the knockout bracket ─────────────────
//
// Call this once all league fixtures are complete (or whenever the organiser
// decides to lock the table). It reads the tournament's current standings,
// picks the top N teams for the chosen knockoutFormat, and creates the bracket
// fixture documents.
//
// Idempotent-ish: refuses to regenerate if knockout fixtures already exist
// unless ?force=true is passed.
//
// For group-stage tournaments, seeding is done by overall points/NRR across all
// groups (standard practice for most domestic tournaments). If you later want
// "top 1 from each group" seeding you can extend this without changing the model.
router.post("/:id/knockout/generate", async (req, res) => {
  try {
    const tournament = await Tournament.findOne({ _id: req.params.id, userId: req.userId });
    if (!tournament) return res.status(404).json({ error: "Tournament not found" });

    const { knockoutFormat } = tournament;
    if (!knockoutFormat || knockoutFormat === "none")
      return res.status(400).json({ error: "This tournament has no knockout stage." });

    // Check for already-existing knockout fixtures
    const existingKnockout = await Fixture.countDocuments({
      tournamentId: tournament._id,
      stage: { $ne: "league" },
    });
    const force = req.query.force === "true";

    if (existingKnockout > 0 && !force)
      return res.status(400).json({
        error: "Knockout fixtures already exist. Pass ?force=true to regenerate (deletes existing knockout fixtures).",
      });
    if (existingKnockout > 0 && force)
      await Fixture.deleteMany({ tournamentId: tournament._id, stage: { $ne: "league" } });

    // How many seeds do we need?
    const seedCount = { top2: 2, top4: 4, top8: 8, ipl: 4 }[knockoutFormat];
    if (!seedCount)
      return res.status(400).json({ error: `Unknown knockout format: ${knockoutFormat}` });

    if (tournament.teams.length < seedCount)
      return res.status(400).json({ error: `Need at least ${seedCount} teams for ${knockoutFormat} knockout.` });

    // Sort standings overall (points → NRR → name) and take top N
    const sorted = sortStandings(tournament.standings);
    const seeds = sorted.slice(0, seedCount).map((s) => s.teamName);

    if (seeds.length < seedCount)
      return res.status(400).json({ error: `Only ${seeds.length} teams in standings, need ${seedCount}.` });

    // Build fixture template for this format
    const template = buildKnockoutFixtures(knockoutFormat, seeds);
    if (template.length === 0)
      return res.status(400).json({ error: "Could not build knockout bracket — unsupported format." });

    const fixtureDocs = template.map((t) => ({
      userId: req.userId,
      tournamentId: tournament._id,
      teamA: t.teamA,
      teamB: t.teamB,
      stage: t.stage,
      group: null,
      knockoutSlot: t.knockoutSlot,
      winnerGoesTo: t.winnerGoesTo || null,
      loserGoesTo: t.loserGoesTo || null,
      status: "scheduled",
    }));

    const created = await Fixture.insertMany(fixtureDocs);
    res.status(201).json({ seeds, fixtures: created });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ─── GET /:id/knockout — return knockout fixtures grouped by round ────────────
router.get("/:id/knockout", async (req, res) => {
  try {
    const tournament = await Tournament.findOne({ _id: req.params.id, userId: req.userId });
    if (!tournament) return res.status(404).json({ error: "Tournament not found" });

    const fixtures = await Fixture.find({
      tournamentId: tournament._id,
      stage: { $ne: "league" },
    }).sort({ createdAt: 1 });

    // Group by stage for easy frontend rendering
    const grouped = {};
    fixtures.forEach((f) => {
      if (!grouped[f.stage]) grouped[f.stage] = [];
      grouped[f.stage].push(f);
    });

    res.json({ knockoutFormat: tournament.knockoutFormat, grouped, fixtures });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── PATCH /:id/fixtures/:fixtureId — update fixture result ──────────────────
router.patch("/:id/fixtures/:fixtureId", async (req, res) => {
  try {
    const tournament = await Tournament.findOne({ _id: req.params.id, userId: req.userId });
    if (!tournament) return res.status(404).json({ error: "Tournament not found" });

    const fixture = await Fixture.findOne({ _id: req.params.fixtureId, tournamentId: tournament._id });
    if (!fixture) return res.status(404).json({ error: "Fixture not found" });

    const {
      matchId, winner, resultText,
      teamARuns, teamAWickets, teamABalls,
      teamBRuns, teamBWickets, teamBBalls,
      status,
    } = req.body;

    // Back out previous contribution to league standings if re-completing
    if (fixture.status === "completed" && fixture.stage === "league") {
      applyFixtureToStandings(tournament, fixture, { reverse: true });
    }

    if (matchId     !== undefined) fixture.matchId     = matchId;
    if (winner      !== undefined) fixture.winner      = winner;
    if (resultText  !== undefined) fixture.resultText  = resultText;
    if (teamARuns   !== undefined) fixture.teamARuns   = teamARuns;
    if (teamAWickets!== undefined) fixture.teamAWickets= teamAWickets;
    if (teamABalls  !== undefined) fixture.teamABalls  = teamABalls;
    if (teamBRuns   !== undefined) fixture.teamBRuns   = teamBRuns;
    if (teamBWickets!== undefined) fixture.teamBWickets= teamBWickets;
    if (teamBBalls  !== undefined) fixture.teamBBalls  = teamBBalls;
    fixture.status = status || "completed";

    if (fixture.status === "completed") {
      // League: update points table
      if (fixture.stage === "league") {
        applyFixtureToStandings(tournament, fixture, { reverse: false });
      }

      // Knockout: propagate winner (and loser for IPL) into next fixture
      if (fixture.stage !== "league" && fixture.winner &&
          fixture.winner !== "Tie" && fixture.winner !== "No Result") {
        await propagateKnockoutResult(fixture, tournament);
      }

      // Check if the final is done → mark tournament completed
      if (fixture.stage === "final") {
        tournament.status = "completed";
        tournament.winner = fixture.winner;
      }
    }

    await fixture.save();
    await tournament.save();

    res.json({ fixture, standings: tournament.standings });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ─── DELETE /:id — delete tournament and all fixtures ────────────────────────
router.delete("/:id", async (req, res) => {
  try {
    const tournament = await Tournament.findOne({ _id: req.params.id, userId: req.userId });
    if (!tournament) return res.status(404).json({ error: "Tournament not found" });

    await Fixture.deleteMany({ tournamentId: tournament._id });
    await tournament.deleteOne();

    res.json({ message: "Tournament deleted ✅" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Helper: apply (or reverse) a completed league fixture to standings ───────
function applyFixtureToStandings(tournament, fixture, { reverse }) {
  const sign = reverse ? -1 : 1;
  const rules = tournament.pointsRules || {};
  const winPts  = rules.win  ?? 2;
  const lossPts = rules.loss ?? 0;
  const tiePts  = rules.tie  ?? 1;
  const nrPts   = rules.noResult ?? 1;

  const entryA = tournament.standings.find((s) => s.teamName === fixture.teamA);
  const entryB = tournament.standings.find((s) => s.teamName === fixture.teamB);
  if (!entryA || !entryB) return;

  if (fixture.winner !== "No Result") {
    entryA.runsFor      += sign * (fixture.teamARuns   || 0);
    entryA.ballsFor     += sign * (fixture.teamABalls  || 0);
    entryA.runsAgainst  += sign * (fixture.teamBRuns   || 0);
    entryA.ballsAgainst += sign * (fixture.teamBBalls  || 0);

    entryB.runsFor      += sign * (fixture.teamBRuns   || 0);
    entryB.ballsFor     += sign * (fixture.teamBBalls  || 0);
    entryB.runsAgainst  += sign * (fixture.teamARuns   || 0);
    entryB.ballsAgainst += sign * (fixture.teamABalls  || 0);
  }

  entryA.played += sign * 1;
  entryB.played += sign * 1;

  if (fixture.winner === "Tie") {
    entryA.ties   += sign; entryB.ties   += sign;
    entryA.points += sign * tiePts; entryB.points += sign * tiePts;
  } else if (fixture.winner === "No Result") {
    entryA.nr     += sign; entryB.nr     += sign;
    entryA.points += sign * nrPts;  entryB.points += sign * nrPts;
  } else if (fixture.winner === fixture.teamA) {
    entryA.wins   += sign; entryB.losses += sign;
    entryA.points += sign * winPts;  entryB.points += sign * lossPts;
  } else if (fixture.winner === fixture.teamB) {
    entryB.wins   += sign; entryA.losses += sign;
    entryB.points += sign * winPts;  entryA.points += sign * lossPts;
  }

  [entryA, entryB].forEach((entry) => {
    const oversFor      = entry.ballsFor      / 6;
    const oversAgainst  = entry.ballsAgainst  / 6;
    const rateFor       = oversFor     > 0 ? entry.runsFor      / oversFor     : 0;
    const rateAgainst   = oversAgainst > 0 ? entry.runsAgainst  / oversAgainst : 0;
    entry.nrr = Math.round((rateFor - rateAgainst) * 1000) / 1000;
  });
}

module.exports = router;