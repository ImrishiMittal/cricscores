const express = require("express");
const router = express.Router();
const Match = require("../models/Match");
const authMiddleware = require("../middleware/auth");

router.use(authMiddleware);

// ─── GET /api/head-to-head?teamA=Mahavir&teamB=Yodha ─────────────────────────
router.get("/", async (req, res) => {
  try {
    const { teamA, teamB } = req.query;
    if (!teamA || !teamB) {
      return res.status(400).json({ error: "teamA and teamB are required" });
    }

    // All matches between these two teams (either order)
    const matches = await Match.find({
      userId: req.userId,
      status: "completed",
      $or: [
        { team1Name: teamA, team2Name: teamB },
        { team1Name: teamB, team2Name: teamA },
      ],
    }).sort({ createdAt: -1 }).lean();

    if (matches.length === 0) {
      return res.json({
        teamA,
        teamB,
        played: 0,
        teamAWins: 0,
        teamBWins: 0,
        ties: 0,
        noResults: 0,
        recentMatches: [],
        teamAScores: { average: null, highest: null, lowest: null },
        teamBScores: { average: null, highest: null, lowest: null },
        margins: { biggestWinByRuns: null, biggestWinByWickets: null, closestMatch: null },
        batting: [],
        bowling: [],
        matchesWithPlayerData: 0,
      });
    }

    // ── Overall record ────────────────────────────────────────────────────────
    let teamAWins = 0, teamBWins = 0, ties = 0, noResults = 0;

    // ── Score tracking ────────────────────────────────────────────────────────
    const teamARunsList = [], teamBRunsList = [];

    // ── Margin tracking ───────────────────────────────────────────────────────
    let biggestWinByRuns = null;       // { winner, margin, matchId }
    let biggestWinByWickets = null;    // { winner, margin, matchId }
    let closestMatch = null;           // { resultText, matchId }

    // ── Player accumulators ───────────────────────────────────────────────────
    const batMap = {};   // jersey -> stats
    const bowlMap = {};  // jersey -> stats
    let matchesWithPlayerData = 0;

    const ensureBat = (jersey, name) => {
      if (!batMap[jersey]) {
        batMap[jersey] = {
          jersey, playerName: name,
          runs: 0, balls: 0, innings: 0, notOuts: 0,
          fours: 0, sixes: 0,
          highestScore: 0, highestScoreBalls: 0,
          fifties: 0, hundreds: 0,
        };
      }
      return batMap[jersey];
    };

    const ensureBowl = (jersey, name) => {
      if (!bowlMap[jersey]) {
        bowlMap[jersey] = {
          jersey, playerName: name,
          wickets: 0, ballsBowled: 0, runsGiven: 0,
          bestWickets: 0, bestRuns: 999,
        };
      }
      return bowlMap[jersey];
    };

    for (const match of matches) {
      const t1IsA = match.team1Name === teamA;
      const aRuns = t1IsA ? match.team1Score : match.team2Score;
      const aBalls = t1IsA ? match.team1Balls : match.team2Balls;
      const aWickets = t1IsA ? match.team1Wickets : match.team2Wickets;
      const bRuns = t1IsA ? match.team2Score : match.team1Score;
      const bBalls = t1IsA ? match.team2Balls : match.team1Balls;
      const bWickets = t1IsA ? match.team2Wickets : match.team1Wickets;

      // Scores
      if (aRuns != null) teamARunsList.push(aRuns);
      if (bRuns != null) teamBRunsList.push(bRuns);

      // Result
      const w = match.winner;
      if (!w || w === "" || w === "Result pending") {
        // skip
      } else if (w === "TIE" || w === "Tie") {
        ties++;
      } else if (w === "NO RESULT" || w === "No Result") {
        noResults++;
      } else if (w === teamA) {
        teamAWins++;

        // Check win margin — by runs (teamA batted first and defended)
        // resultText format: "X won by N runs" or "X won by N wickets"
        const byRuns = match.resultText?.match(/by (\d+) runs?/i);
        const byWkts = match.resultText?.match(/by (\d+) wickets?/i);

        if (byRuns) {
          const margin = parseInt(byRuns[1]);
          if (!biggestWinByRuns || margin > biggestWinByRuns.margin) {
            biggestWinByRuns = { winner: teamA, margin, resultText: match.resultText, matchId: match.matchId };
          }
        }
        if (byWkts) {
          const margin = parseInt(byWkts[1]);
          if (!biggestWinByWickets || margin > biggestWinByWickets.margin) {
            biggestWinByWickets = { winner: teamA, margin, resultText: match.resultText, matchId: match.matchId };
          }
        }
        // Closest match: smallest winning margin
        if (byRuns) {
          const margin = parseInt(byRuns[1]);
          if (!closestMatch || margin < closestMatch.margin) {
            closestMatch = { margin, unit: "runs", winner: teamA, resultText: match.resultText, matchId: match.matchId };
          }
        }
        if (byWkts) {
          const margin = parseInt(byWkts[1]);
          if (!closestMatch || margin < closestMatch.margin) {
            closestMatch = { margin, unit: "wickets", winner: teamA, resultText: match.resultText, matchId: match.matchId };
          }
        }
      } else if (w === teamB) {
        teamBWins++;

        const byRuns = match.resultText?.match(/by (\d+) runs?/i);
        const byWkts = match.resultText?.match(/by (\d+) wickets?/i);

        if (byRuns) {
          const margin = parseInt(byRuns[1]);
          if (!biggestWinByRuns || margin > biggestWinByRuns.margin) {
            biggestWinByRuns = { winner: teamB, margin, resultText: match.resultText, matchId: match.matchId };
          }
        }
        if (byWkts) {
          const margin = parseInt(byWkts[1]);
          if (!biggestWinByWickets || margin > biggestWinByWickets.margin) {
            biggestWinByWickets = { winner: teamB, margin, resultText: match.resultText, matchId: match.matchId };
          }
        }
        if (byRuns) {
          const margin = parseInt(byRuns[1]);
          if (!closestMatch || margin < closestMatch.margin) {
            closestMatch = { margin, unit: "runs", winner: teamB, resultText: match.resultText, matchId: match.matchId };
          }
        }
        if (byWkts) {
          const margin = parseInt(byWkts[1]);
          if (!closestMatch || margin < closestMatch.margin) {
            closestMatch = { margin, unit: "wickets", winner: teamB, resultText: match.resultText, matchId: match.matchId };
          }
        }
      }

      // ── Player stats (only scored matches) ──────────────────────────────────
      const hasPlayerData =
        (match.team1Batting?.length > 0) || (match.team2Batting?.length > 0);
      if (hasPlayerData) matchesWithPlayerData++;

      const allBatting = [...(match.team1Batting || []), ...(match.team2Batting || [])];
      const allBowling = [...(match.team1Bowling || []), ...(match.team2Bowling || [])];

      for (const b of allBatting) {
        const name = (b.playerName || "").trim();
        if (!name || name === "Unknown") continue;
        const jersey = String(b.jersey || b.playerId || "").trim() || name;
        const agg = ensureBat(jersey, name);

        agg.runs += b.runs || 0;
        agg.balls += b.balls || 0;
        agg.fours += b.fours || 0;
        agg.sixes += b.sixes || 0;

        const faced = (b.balls || 0) > 0 || (b.runs || 0) > 0;
        if (faced) {
          agg.innings++;
          if (!b.isOut) agg.notOuts++;
          const score = b.runs || 0;
          const scoreBalls = b.balls || 0;
          if (score >= 100) agg.hundreds++;
          else if (score >= 50) agg.fifties++;
          if (
            score > agg.highestScore ||
            (score === agg.highestScore && scoreBalls < agg.highestScoreBalls)
          ) {
            agg.highestScore = score;
            agg.highestScoreBalls = scoreBalls;
          }
        }
      }

      for (const b of allBowling) {
        const name = (b.playerName || "").trim();
        if (!name || name === "Unknown") continue;
        const balls = b.ballsBowled || 0;
        if (balls === 0) continue;
        const jersey = String(b.jersey || b.playerId || "").trim() || name;
        const agg = ensureBowl(jersey, name);

        agg.wickets += b.wickets || 0;
        agg.ballsBowled += balls;
        agg.runsGiven += b.runsGiven || 0;

        const w = b.wickets || 0;
        const r = b.runsGiven || 0;
        if (w > agg.bestWickets || (w === agg.bestWickets && r < agg.bestRuns)) {
          agg.bestWickets = w;
          agg.bestRuns = r;
        }
      }
    }

    // ── Score averages ────────────────────────────────────────────────────────
    const avg = (arr) => arr.length ? Math.round(arr.reduce((s, v) => s + v, 0) / arr.length) : null;
    const max = (arr) => arr.length ? Math.max(...arr) : null;
    const min = (arr) => arr.length ? Math.min(...arr) : null;

    // ── Batting leaderboard ───────────────────────────────────────────────────
    const battingList = Object.values(batMap).map((a) => {
      const dismissals = a.innings - a.notOuts;
      const average = dismissals > 0 ? Math.round((a.runs / dismissals) * 100) / 100 : null;
      const sr = a.balls > 0 ? Math.round((a.runs / a.balls) * 10000) / 100 : 0;
      return {
        jersey: a.jersey,
        playerName: a.playerName,
        runs: a.runs,
        innings: a.innings,
        notOuts: a.notOuts,
        highestScore: a.highestScore,
        average,
        sr,
        fours: a.fours,
        sixes: a.sixes,
        fifties: a.fifties,
        hundreds: a.hundreds,
      };
    }).sort((a, b) => b.runs - a.runs);

    // ── Bowling leaderboard ───────────────────────────────────────────────────
    const bowlingList = Object.values(bowlMap).map((a) => {
      const overs = Math.floor(a.ballsBowled / 6);
      const rem = a.ballsBowled % 6;
      const oversFloat = overs + rem / 6;
      const economy = oversFloat > 0 ? Math.round((a.runsGiven / oversFloat) * 100) / 100 : 0;
      const average = a.wickets > 0 ? Math.round((a.runsGiven / a.wickets) * 100) / 100 : null;
      return {
        jersey: a.jersey,
        playerName: a.playerName,
        wickets: a.wickets,
        overs: `${overs}.${rem}`,
        runsGiven: a.runsGiven,
        economy,
        average,
        bestFigures: a.bestWickets > 0 ? `${a.bestWickets}/${a.bestRuns}` : "—",
        bestWickets: a.bestWickets,
        bestRuns: a.bestRuns,
      };
    }).sort((a, b) => b.wickets - a.wickets || a.runsGiven - b.runsGiven);

    // ── Recent matches (last 10) ──────────────────────────────────────────────
    const recentMatches = matches.slice(0, 10).map((m) => ({
      matchId: m.matchId,
      winner: m.winner,
      resultText: m.resultText,
      team1Name: m.team1Name,
      team2Name: m.team2Name,
      team1Score: m.team1Score,
      team1Wickets: m.team1Wickets,
      team1Balls: m.team1Balls,
      team2Score: m.team2Score,
      team2Wickets: m.team2Wickets,
      team2Balls: m.team2Balls,
      date: m.matchDate || m.createdAt,
    }));

    res.json({
      teamA,
      teamB,
      played: matches.length,
      teamAWins,
      teamBWins,
      ties,
      noResults,
      teamAScores: { average: avg(teamARunsList), highest: max(teamARunsList), lowest: min(teamARunsList) },
      teamBScores: { average: avg(teamBRunsList), highest: max(teamBRunsList), lowest: min(teamBRunsList) },
      margins: { biggestWinByRuns, biggestWinByWickets, closestMatch },
      batting: battingList,
      bowling: bowlingList,
      recentMatches,
      matchesWithPlayerData,
    });
  } catch (err) {
    console.error("Head-to-head error:", err);
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/head-to-head/teams — list all unique teams the user has played ──
// Used to populate the team selector dropdowns
router.get("/teams", async (req, res) => {
  try {
    const matches = await Match.find(
      { userId: req.userId, status: "completed" },
      { team1Name: 1, team2Name: 1 }
    ).lean();

    const teamSet = new Set();
    matches.forEach((m) => {
      if (m.team1Name) teamSet.add(m.team1Name);
      if (m.team2Name) teamSet.add(m.team2Name);
    });

    res.json({ teams: [...teamSet].sort() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;