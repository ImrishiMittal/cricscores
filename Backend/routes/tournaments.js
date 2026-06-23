// routes/tournaments.js
const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Tournament = require("../models/Tournament");
const Fixture = require("../models/Fixture");
const Match = require("../models/Match");
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
async function computeGroupStandings(tournament) {
  const fixtures = await Fixture.find({
    tournamentId: tournament._id,
    stage: "league",
    status: "completed",
  });

  if (tournament.leagueFormat !== "groups") {
    return { overall: sortStandings(tournament.standings) };
  }

  const groupMap = {};
  fixtures.forEach((f) => {
    if (f.group) {
      if (!groupMap[f.group]) groupMap[f.group] = new Set();
      groupMap[f.group].add(f.teamA);
      groupMap[f.group].add(f.teamB);
    }
  });

  const result = { overall: sortStandings(tournament.standings) };
  Object.entries(groupMap).forEach(([groupLabel, teamSet]) => {
    const key = groupLabel.replace(" ", "").toLowerCase();
    result[key] = sortStandings(
      tournament.standings.filter((s) => teamSet.has(s.teamName))
    );
  });
  return result;
}

// ─── Knockout bracket templates ──────────────────────────────────────────────
function buildKnockoutFixtures(format, seeds) {
  const s = (n) => seeds[n - 1] || "";

  switch (format) {
    case "top2":
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
               : null;

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
router.post("/:id/knockout/generate", async (req, res) => {
  try {
    const tournament = await Tournament.findOne({ _id: req.params.id, userId: req.userId });
    if (!tournament) return res.status(404).json({ error: "Tournament not found" });

    const { knockoutFormat } = tournament;
    if (!knockoutFormat || knockoutFormat === "none")
      return res.status(400).json({ error: "This tournament has no knockout stage." });

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

    const seedCount = { top2: 2, top4: 4, top8: 8, ipl: 4 }[knockoutFormat];
    if (!seedCount)
      return res.status(400).json({ error: `Unknown knockout format: ${knockoutFormat}` });

    if (tournament.teams.length < seedCount)
      return res.status(400).json({ error: `Need at least ${seedCount} teams for ${knockoutFormat} knockout.` });

    const sorted = sortStandings(tournament.standings);
    const seeds = sorted.slice(0, seedCount).map((s) => s.teamName);

    if (seeds.length < seedCount)
      return res.status(400).json({ error: `Only ${seeds.length} teams in standings, need ${seedCount}.` });

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
      if (fixture.stage === "league") {
        applyFixtureToStandings(tournament, fixture, { reverse: false });
      }

      if (fixture.stage !== "league" && fixture.winner &&
          fixture.winner !== "Tie" && fixture.winner !== "No Result") {
        await propagateKnockoutResult(fixture, tournament);
      }

      if (fixture.stage === "final") {
        tournament.status = "completed";
        tournament.winner = fixture.winner;
      }
      // For no-knockout tournaments, complete when all league fixtures are done
if (tournament.knockoutFormat === "none") {
  const remaining = await Fixture.countDocuments({
    tournamentId: tournament._id,
    status: { $ne: "completed" },
  });
  if (remaining === 0) {
    tournament.status = "completed";
  }
}
    }

    await fixture.save();
    await tournament.save();

    res.json({ fixture, standings: tournament.standings });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ─── GET /:id/awards — aggregate player stats across all scored fixtures ──────
router.get("/:id/awards", async (req, res) => {
  try {
    const tournament = await Tournament.findOne({
      _id: req.params.id,
      userId: req.userId,
    });
    if (!tournament) return res.status(404).json({ error: "Tournament not found" });

    // All completed fixtures that were actually scored (have a matchId)
    const fixtures = await Fixture.find({
      tournamentId: tournament._id,
      status: "completed",
      matchId: { $exists: true, $nin: [null, ""] },
    });
    if (fixtures.length === 0) {
      return res.json({ batting: [], bowling: [], fielding: [], awards: {}, matchesScored: 0 });
    }

    const matchIds = fixtures.map((f) => f.matchId);
    const matches = await Match.find({ matchId: { $in: matchIds }, userId: req.userId });

    // ── Per-player accumulators ──────────────────────────────────────────────
    const batMap = {};
    const bowlMap = {};
    const fieldMap = {};

    const ensureBat = (key, name) => {
      if (!batMap[key]) {
        batMap[key] = {
          jersey: key, playerName: name,
          runs: 0, balls: 0, innings: 0, notOuts: 0,
          fours: 0, sixes: 0, dotBalls: 0,
          highestScore: 0, highestScoreBalls: 0,
          fifties: 0, hundreds: 0,
          matchesPlayed: new Set(),
        };
      }
      return batMap[key];
    };

    const ensureBowl = (key, name) => {
      if (!bowlMap[key]) {
        bowlMap[key] = {
          jersey: key, playerName: name,
          wickets: 0, ballsBowled: 0, runsGiven: 0,
          maidens: 0, dotBalls: 0, wides: 0, noBalls: 0,
          bestFiguresWickets: 0, bestFiguresRuns: 999,
          fiveWicketHauls: 0,
          matchesPlayed: new Set(),
        };
      }
      return bowlMap[key];
    };

    const ensureField = (name) => {
      const key = name.trim().toLowerCase();
      if (!fieldMap[key]) {
        fieldMap[key] = { playerName: name.trim(), catches: 0, stumpings: 0, runOuts: 0 };
      }
      return fieldMap[key];
    };

    // ── Process each match ───────────────────────────────────────────────────
    for (const match of matches) {
      const matchIdStr = match.matchId;

      const allBatting = [
        ...(match.team1Batting || []),
        ...(match.team2Batting || []),
      ];
      const allBowling = [
        ...(match.team1Bowling || []),
        ...(match.team2Bowling || []),
      ];

      // ── Batting aggregation ────────────────────────────────────────────────
      for (const b of allBatting) {
        const name = (b.playerName || "").trim();
        if (!name || name === "Unknown") continue;
        const jersey = String(b.jersey || b.playerId || "").trim() || name;
        const agg = ensureBat(jersey, name);
        agg.matchesPlayed.add(matchIdStr);
        agg.runs += b.runs || 0;
        agg.balls += b.balls || 0;
        agg.fours += b.fours || 0;
        agg.sixes += b.sixes || 0;
        agg.dotBalls += b.dotBalls || 0;

        const facedBall = (b.balls || 0) > 0 || (b.runs || 0) > 0;
        if (facedBall) {
          agg.innings += 1;
          if (!b.isOut) agg.notOuts += 1;

          const score = b.runs || 0;
          const scoreBalls = b.balls || 0;
          if (score >= 100) agg.hundreds += 1;
          else if (score >= 50) agg.fifties += 1;

          if (
            score > agg.highestScore ||
            (score === agg.highestScore && scoreBalls < agg.highestScoreBalls)
          ) {
            agg.highestScore = score;
            agg.highestScoreBalls = scoreBalls;
          }
        }
      }

      // ── Bowling aggregation ────────────────────────────────────────────────
      for (const b of allBowling) {
        const name = (b.playerName || "").trim();
        if (!name || name === "Unknown") continue;
        const balls = b.ballsBowled || 0;
        if (balls === 0) continue;
        const jersey = String(b.jersey || b.playerId || "").trim() || name; // fallback to name as key
        const agg = ensureBowl(jersey, name);
        agg.matchesPlayed.add(matchIdStr);
        agg.wickets += b.wickets || 0;
        agg.ballsBowled += balls;
        agg.runsGiven += b.runsGiven || 0;
        agg.maidens += b.maidens || 0;
        agg.dotBalls += b.dotBallsBowled || 0;
        agg.wides += b.wides || 0;
        agg.noBalls += b.noBalls || 0;

        const w = b.wickets || 0;
        const r = b.runsGiven || 0;
        if (w >= 5) agg.fiveWicketHauls += 1;

        if (
          w > agg.bestFiguresWickets ||
          (w === agg.bestFiguresWickets && r < agg.bestFiguresRuns)
        ) {
          agg.bestFiguresWickets = w;
          agg.bestFiguresRuns = r;
        }
      }

      // ── Fielding aggregation (from dismissal records) ────────────────────
      for (const b of allBatting) {
        console.log("Fielding check:", b.playerName, b.isOut, b.dismissalType, b.fielderName);
        if (!b.isOut || !b.fielderName) continue;
        const fname = b.fielderName.trim();
        if (!fname || fname === "Unknown") continue;

        const fagg = ensureField(fname);
        if (b.dismissalType === "caught") fagg.catches += 1;
        else if (b.dismissalType === "stumped") fagg.stumpings += 1;
        else if (b.dismissalType === "runout") fagg.runOuts += 1;
      }
    }

    // ── Convert accumulators to arrays and compute derived stats ─────────────

    const battingList = Object.values(batMap).map((a) => {
      const dismissals = a.innings - a.notOuts;
      const avg = dismissals > 0 ? a.runs / dismissals : a.runs > 0 ? null : 0;
      const sr = a.balls > 0 ? (a.runs / a.balls) * 100 : 0;
      return {
        jersey: a.jersey,
        playerName: a.playerName,
        runs: a.runs,
        balls: a.balls,
        innings: a.innings,
        notOuts: a.notOuts,
        fours: a.fours,
        sixes: a.sixes,
        avg: avg !== null ? Math.round(avg * 100) / 100 : null,
        sr: Math.round(sr * 10) / 10,
        highestScore: a.highestScore,
        highestScoreBalls: a.highestScoreBalls,
        fifties: a.fifties,
        hundreds: a.hundreds,
        matches: a.matchesPlayed.size,
      };
    }).sort((a, b) => b.runs - a.runs);

    const bowlingList = Object.values(bowlMap).map((a) => {
      const overs = Math.floor(a.ballsBowled / 6);
      const rem = a.ballsBowled % 6;
      const oversFloat = overs + rem / 6;
      const economy = oversFloat > 0 ? Math.round((a.runsGiven / oversFloat) * 100) / 100 : 0;
      const avg = a.wickets > 0 ? Math.round((a.runsGiven / a.wickets) * 100) / 100 : null;
      return {
        jersey: a.jersey,
        playerName: a.playerName,
        wickets: a.wickets,
        ballsBowled: a.ballsBowled,
        overs: `${overs}.${rem}`,
        runsGiven: a.runsGiven,
        economy,
        avg,
        maidens: a.maidens,
        dotBalls: a.dotBalls,
        fiveWicketHauls: a.fiveWicketHauls,
        bestFigures: a.bestFiguresWickets > 0
          ? `${a.bestFiguresWickets}/${a.bestFiguresRuns}`
          : "—",
        bestFiguresWickets: a.bestFiguresWickets,
        bestFiguresRuns: a.bestFiguresRuns,
        matches: a.matchesPlayed.size,
      };
    }).sort((a, b) => b.wickets - a.wickets || a.runsGiven - b.runsGiven);

    const fieldingList = Object.values(fieldMap).map((a) => ({
      ...a,
      total: a.catches + a.stumpings + a.runOuts,
    })).sort((a, b) => b.total - a.total);

    // ── Awards: pick winners for each category ───────────────────────────────
    const BATTING_MIN_INNINGS = 3;
    const BATTING_MIN_RUNS = 100;
    const SR_MIN_BALLS = 50;
    const ECONOMY_MIN_BALLS = 60;
    const BOWLING_MIN_WICKETS = 3;

    const qualifiedBatters = battingList.filter(
      (p) => p.innings >= BATTING_MIN_INNINGS || p.runs >= BATTING_MIN_RUNS
    );
    const qualifiedSR = battingList.filter((p) => p.balls >= SR_MIN_BALLS);
    const qualifiedEconomy = bowlingList.filter(
      (p) => p.ballsBowled >= ECONOMY_MIN_BALLS
    );
    const qualifiedAvgBowl = bowlingList.filter(
      (p) => p.wickets >= BOWLING_MIN_WICKETS
    );

    const pick = (arr, sortFn) => {
      const sorted = [...arr].sort(sortFn);
      return sorted[0] || null;
    };

    const awards = {
      orangeCap: pick(battingList, (a, b) => b.runs - a.runs),
      highestScore: pick(battingList, (a, b) =>
        b.highestScore - a.highestScore ||
        a.highestScoreBalls - b.highestScoreBalls
      ),
      bestBattingAvg: pick(qualifiedBatters, (a, b) => {
        const aA = a.avg ?? a.runs;
        const bA = b.avg ?? b.runs;
        return bA - aA;
      }),
      bestStrikeRate: pick(qualifiedSR, (a, b) => b.sr - a.sr),
      mostSixes: pick(battingList, (a, b) => b.sixes - a.sixes),
      mostFours: pick(battingList, (a, b) => b.fours - a.fours),
      mostFifties: (() => { const p = pick(battingList, (a, b) => b.fifties - a.fifties); return p?.fifties > 0 ? p : null; })(),
mostHundreds: (() => { const p = pick(battingList, (a, b) => b.hundreds - a.hundreds); return p?.hundreds > 0 ? p : null; })(),

      purpleCap: pick(bowlingList, (a, b) =>
        b.wickets - a.wickets || a.runsGiven - b.runsGiven
      ),
      bestBowlingFigures: pick(bowlingList, (a, b) =>
        b.bestFiguresWickets - a.bestFiguresWickets ||
        a.bestFiguresRuns - b.bestFiguresRuns
      ),
      bestBowlingAvg: pick(qualifiedAvgBowl, (a, b) => {
        if (a.avg === null) return 1;
        if (b.avg === null) return -1;
        return a.avg - b.avg;
      }),
      bestEconomy: pick(qualifiedEconomy, (a, b) => a.economy - b.economy),
      mostMaidens: pick(bowlingList, (a, b) => b.maidens - a.maidens),
      mostDotBalls: pick(bowlingList, (a, b) => b.dotBalls - a.dotBalls),
      mostFiveWicketHauls: pick(bowlingList, (a, b) => b.fiveWicketHauls - a.fiveWicketHauls),

      mostCatches: pick(fieldingList, (a, b) => b.catches - a.catches),
      mostRunOuts: pick(fieldingList, (a, b) => b.runOuts - a.runOuts),
      mostStumpings: pick(fieldingList, (a, b) => b.stumpings - a.stumpings),
    };

    // ── Player of Tournament: composite score ────────────────────────────────
    const allJerseys = new Set([
      ...Object.keys(batMap),
      ...Object.keys(bowlMap),
    ]);

    let potPlayer = null;
    let potScore = -Infinity;

    for (const jersey of allJerseys) {
      const bat = batMap[jersey];
      const bowl = bowlMap[jersey];
      const name = bat?.playerName || bowl?.playerName || "";

      const batScore = bat
        ? bat.runs +
          (bat.balls > 0 ? Math.max(0, (bat.runs / bat.balls) * 100 - 100) * 0.1 : 0) +
          bat.fifties * 20 +
          bat.hundreds * 50
        : 0;

      const bowlScore = bowl && bowl.ballsBowled > 0
        ? bowl.wickets * 20 - (bowl.runsGiven / (bowl.ballsBowled / 6)) * 2
        : 0;

      const fieldKey = name.trim().toLowerCase();
      const field = fieldMap[fieldKey];
      const fieldScore = field
        ? field.catches * 5 + field.runOuts * 7 + field.stumpings * 5
        : 0;

      const total = batScore + bowlScore + fieldScore;
      if (total > potScore) {
        potScore = total;
        potPlayer = {
          jersey,
          playerName: name,
          runs: bat?.runs || 0,
          wickets: bowl?.wickets || 0,
          catches: field?.catches || 0,
          compositeScore: Math.round(total),
        };
      }
    }

    awards.playerOfTournament = tournament.status === "completed" ? potPlayer : null;

    // ── Best All-Rounder: min 50 runs AND min 3 wickets ──────────────────────
    const allRounders = [...allJerseys]
      .map((jersey) => {
        const bat = batMap[jersey];
        const bowl = bowlMap[jersey];
        if (!bat || !bowl) return null;
        if (bat.runs < 50 || bowl.wickets < 3) return null;
        return {
          jersey,
          playerName: bat.playerName,
          runs: bat.runs,
          wickets: bowl.wickets,
          avg: bat.innings - bat.notOuts > 0
            ? Math.round((bat.runs / (bat.innings - bat.notOuts)) * 10) / 10
            : null,
          economy: bowl.ballsBowled > 0
            ? Math.round((bowl.runsGiven / (bowl.ballsBowled / 6)) * 10) / 10
            : null,
        };
      })
      .filter(Boolean)
      .sort((a, b) => b.runs + b.wickets * 20 - (a.runs + a.wickets * 20));

    awards.bestAllRounder = allRounders[0] || null;

    res.json({
      batting: battingList,
      bowling: bowlingList,
      fielding: fieldingList,
      awards,
      matchesScored: matches.length,
      totalFixtures: fixtures.length,
    });
  } catch (err) {
    console.error("Awards aggregation error:", err);
    res.status(500).json({ error: err.message });
  }
});

router.get("/:id/loyalty", async (req, res) => {
  try {
    const tournament = await Tournament.findOne({
      _id: req.params.id,
      userId: req.userId,
    });
    if (!tournament) return res.status(404).json({ error: "Tournament not found" });

    const { jerseys, teamName } = req.query;
    if (!jerseys || !teamName) {
      return res.status(400).json({ error: "jerseys and teamName are required" });
    }

    const requestedJerseys = jerseys
      .split(",")
      .map((j) => j.trim())
      .filter(Boolean);

    if (requestedJerseys.length === 0) {
      return res.json({ clashes: [] });
    }

    const Squad = require("../models/Squad");
    const clashMap = {}; // jersey -> claimedBy (team name)

    // ── Step 1: check squads saved for this tournament ────────────────────────
    const otherSquads = await Squad.find({
      userId: req.userId,
      tournamentId: tournament._id,
      teamName: { $ne: teamName },
    });

    for (const squad of otherSquads) {
      for (const player of squad.players) {
        const j = String(player.jersey);
        if (requestedJerseys.includes(j) && !clashMap[j]) {
          clashMap[j] = squad.teamName;
        }
      }
    }

    // ── Step 2: for jerseys still unchecked, scan Match records ───────────────
    const unchecked = requestedJerseys.filter((j) => !clashMap[j]);

    if (unchecked.length > 0) {
      // Find all completed fixtures that were actually scored
      const scoredFixtures = await Fixture.find({
        tournamentId: tournament._id,
        status: "completed",
        matchId: { $exists: true, $nin: [null, ""] },
      });

      if (scoredFixtures.length > 0) {
        const matchIds = scoredFixtures.map((f) => f.matchId);
        const matches = await Match.find({
          matchId: { $in: matchIds },
          userId: req.userId,
        });

        // Build a map: jersey -> team name, from batting + bowling records
        // A jersey belongs to the team whose side it appeared on
        for (const match of matches) {
          // Find the fixture for this match to know which team is which
          const fixture = scoredFixtures.find((f) => f.matchId === match.matchId);
          if (!fixture) continue;

          // team1 batted first — team1Name maps to fixture teamA or teamB
          // We use match.team1Name / match.team2Name directly
          const team1 = match.team1Name;
          const team2 = match.team2Name;

          const scanPlayers = (playerList, teamLabel) => {
            for (const p of playerList || []) {
              const j = String(p.jersey || p.playerId || "").trim();
              if (!j || !unchecked.includes(j)) continue;
              if (teamLabel === teamName) continue; // same team — no clash
              if (!clashMap[j]) clashMap[j] = teamLabel;
            }
          };

          scanPlayers(match.team1Batting, team1);
          scanPlayers(match.team1Bowling, team1);
          scanPlayers(match.team2Batting, team2);
          scanPlayers(match.team2Bowling, team2);
        }
      }
    }

    const clashes = Object.entries(clashMap).map(([jersey, claimedBy]) => ({
      jersey,
      claimedBy,
    }));

    res.json({ clashes });
  } catch (err) {
    res.status(500).json({ error: err.message });
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

module.exports = router;