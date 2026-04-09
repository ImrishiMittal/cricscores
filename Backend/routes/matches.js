const express = require("express");
const router = express.Router();
const Match = require("../models/Match");
const Player = require("../models/Player");
const authMiddleware = require("../middleware/auth");

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
    const match = await Match.findOne({ _id: req.params.id, userId: req.userId });
    if (!match) return res.status(404).json({ error: "Match not found." });
    res.json(match);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── POST save match + update all player stats ────────────────────────────────
router.post("/", async (req, res) => {
  try {
    const match = new Match({ ...req.body, userId: req.userId });
    await match.save();

    const matchId = match.matchId;

    // Collect all batting entries from both innings
    const allBatting = [
      ...(match.team1Batting || []).map(e => ({ ...e.toObject(), team: 1 })),
      ...(match.team2Batting || []).map(e => ({ ...e.toObject(), team: 2 })),
    ];

    // Collect all bowling entries from both innings
    const allBowling = [
      ...(match.team1Bowling || []).map(e => ({ ...e.toObject(), team: 1 })),
      ...(match.team2Bowling || []).map(e => ({ ...e.toObject(), team: 2 })),
    ];

    // ── Update batting stats per player ──────────────────────────────────────
    for (const entry of allBatting) {
      if (!entry.playerName) continue;

      // Find the player (by playerId if provided, else by name+userId)
      const query = entry.playerId
        ? { _id: entry.playerId, userId: req.userId }
        : { name: entry.playerName, userId: req.userId };

      const player = await Player.findOne(query);
      if (!player) continue;

      // Match deduplication — count match only once even if player bats + bowls
      const alreadyCounted = player.matchIds.includes(matchId);

      const battingInc = {
        runs:     entry.runs     || 0,
        balls:    entry.balls    || 0,
        fours:    entry.fours    || 0,
        sixes:    entry.sixes    || 0,
        dotBalls: entry.dotBalls || 0,
        ones:     entry.ones     || 0,
        twos:     entry.twos     || 0,
        threes:   entry.threes   || 0,
        innings:  1,
        dismissals: entry.isOut ? 1 : 0,
        notOuts:    entry.isOut ? 0 : 1,
      };

      // Milestones
      if (entry.runs >= 100) battingInc.hundreds = 1;
      else if (entry.runs >= 50) battingInc.fifties = 1;
      else if (entry.runs >= 30) battingInc.thirties = 1;
      if (entry.runs === 0 && entry.isOut) battingInc.ducks = 1;

      if (!alreadyCounted) {
        battingInc.matches = 1;
      }

      // Best bowling figures for this match (used to compare)
      // We'll collect all bowling for this player across the match later

      await Player.findOneAndUpdate(query, {
        $inc:      battingInc,
        $max:      { highestScore: entry.runs || 0 },
        $addToSet: { matchIds: matchId },
      });
    }

    // ── Update bowling stats per player ──────────────────────────────────────
    // First, aggregate per player across both innings of the match
    const bowlingByPlayer = {};
    for (const entry of allBowling) {
      if (!entry.playerName) continue;
      const key = entry.playerId || entry.playerName;
      if (!bowlingByPlayer[key]) {
        bowlingByPlayer[key] = {
          playerId:       entry.playerId,
          playerName:     entry.playerName,
          ballsBowled:    0,
          runsGiven:      0,
          wickets:        0,
          wides:          0,
          noBalls:        0,
          dotBallsBowled: 0,
          maidens:        0,
        };
      }
      const agg = bowlingByPlayer[key];
      agg.ballsBowled    += entry.ballsBowled    || 0;
      agg.runsGiven      += entry.runsGiven      || 0;
      agg.wickets        += entry.wickets        || 0;
      agg.wides          += entry.wides          || 0;
      agg.noBalls        += entry.noBalls        || 0;
      agg.dotBallsBowled += entry.dotBallsBowled || 0;
      agg.maidens        += entry.maidens        || 0;
    }

    for (const agg of Object.values(bowlingByPlayer)) {
      const query = agg.playerId
        ? { _id: agg.playerId, userId: req.userId }
        : { name: agg.playerName, userId: req.userId };

      const player = await Player.findOne(query);
      if (!player) continue;

      const bowlingInc = {
        wickets:          agg.wickets,
        runsGiven:        agg.runsGiven,
        ballsBowled:      agg.ballsBowled,
        wides:            agg.wides,
        noBalls:          agg.noBalls,
        dotBallsBowled:   agg.dotBallsBowled,
        maidens:          agg.maidens,
        bowlingInnings:   1,
      };

      // Bowling milestones
      if (agg.wickets >= 10) bowlingInc.tenWickets = 1;
      else if (agg.wickets >= 5) bowlingInc.fiveWickets = 1;
      else if (agg.wickets >= 3) bowlingInc.threeWickets = 1;

      // Ensure match counted (if player only bowled, not batted)
      const alreadyCounted = player.matchIds.includes(matchId);
      if (!alreadyCounted) bowlingInc.matches = 1;

      // Best bowling: update if this match figures are better
      const bestW = player.bestBowlingWickets || 0;
      const bestR = bestW === 0 ? 9999 : (player.bestBowlingRuns || 0);
      const isBetter = agg.wickets > 0 &&
        (agg.wickets > bestW || (agg.wickets === bestW && agg.runsGiven < bestR));

      const updateOp = {
        $inc:      bowlingInc,
        $addToSet: { matchIds: matchId, bowlingMatchIds: matchId },
      };
      if (isBetter) {
        updateOp.$set = {
          bestBowlingWickets: agg.wickets,
          bestBowlingRuns:    agg.runsGiven,
        };
      }

      await Player.findOneAndUpdate(query, updateOp);
    }

    // ── Captaincy stats ───────────────────────────────────────────────────────
    const captains = [
      { name: match.team1Captain, team: 1 },
      { name: match.team2Captain, team: 2 },
    ].filter(c => c.name);

    for (const { name, team } of captains) {
      const query = { name, userId: req.userId };
      const isWinner = match.winner === (team === 1 ? match.team1Name : match.team2Name);
      const isTie    = match.winner === "Tie" || match.winner === "tie";
      const isNR     = match.winner === "NR"  || match.winner === "No Result";

      await Player.findOneAndUpdate(query, {
        $inc: {
          captainMatches: 1,
          captainWins:    isWinner ? 1 : 0,
          captainLosses:  (!isWinner && !isTie && !isNR) ? 1 : 0,
          captainTies:    isTie ? 1 : 0,
          captainNR:      isNR  ? 1 : 0,
        },
      });
    }

    // ── Fielding stats ────────────────────────────────────────────────────────
    // Derive fielding from batting dismissal entries
    for (const entry of allBatting) {
      if (!entry.isOut || !entry.fielderName) continue;
      const query = { name: entry.fielderName, userId: req.userId };
      const type  = entry.dismissalType;
      if (type === "caught")  await Player.findOneAndUpdate(query, { $inc: { catches:   1 } });
      if (type === "stumped") await Player.findOneAndUpdate(query, { $inc: { stumpings: 1 } });
      if (type === "runout")  await Player.findOneAndUpdate(query, { $inc: { runouts:   1 } });
    }

    res.status(201).json(match);
  } catch (err) {
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
