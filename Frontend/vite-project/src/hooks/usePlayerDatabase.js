// src/hooks/usePlayerDatabase.js
//
// Drop-in replacement for the localStorage version.
// Every function has the SAME name and signature — your ScoringPage,
// StatsPage, PlayerDetailPage, etc. call these without any changes.
//
// What changed:
//   • Reads/writes go to MongoDB via playerApi + matchApi
//   • Match deduplication is handled server-side (matchIds stored in DB)
//   • Best bowling, milestones, fielding all computed server-side in matches.js
//   • currentMatchId still lives in localStorage (it's session state, not persistent data)

import { useState, useEffect, useCallback, useRef } from "react";
import * as playerApi from "../api/playerApi";
import * as matchApi from "../api/matchApi";
import * as teamApi from "../api/teamApi";

// ── In-memory cache so callers can read synchronously after first load ────────
let _cache = {}; // { [jersey]: playerObject }
let _cacheLoaded = false;

function usePlayerDatabase() {
  const [, forceUpdate] = useState(0);
  const refresh = useCallback(() => forceUpdate((v) => v + 1), []);

  // ── Load all players into cache on first mount ────────────────────────────
  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const players = await playerApi.getAllPlayers();
        if (cancelled) return;
        _cache = {};
        for (const p of players) {
          // Use jersey as key if present, else fall back to _id
          const key = p.jersey || String(p._id);
          _cache[key] = p;
        }
        _cacheLoaded = true;
        forceUpdate((v) => v + 1);
      } catch (err) {
        console.error("usePlayerDatabase: failed to load players", err);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  // ── currentMatchId — session state, stays in localStorage ────────────────
  const setCurrentMatchId = useCallback((matchId) => {
    if (matchId === null) {
      localStorage.removeItem("current_match_id");
    } else {
      localStorage.setItem("current_match_id", String(matchId));
    }
  }, []);

  const getCurrentMatchId = useCallback(() => {
    const id = localStorage.getItem("current_match_id");
    return id === "null" || id === null ? null : id;
  }, []);

  // ── getPlayer — reads from in-memory cache (fast, sync) ──────────────────
  const getPlayer = useCallback((jersey) => {
    return _cache[String(jersey)] || null;
  }, []);

  // ── getAllPlayers ─────────────────────────────────────────────────────────
  const getAllPlayers = useCallback(() => {
    return Object.values(_cache).sort((a, b) => a.name.localeCompare(b.name));
  }, []);

  // ── searchPlayersByName ───────────────────────────────────────────────────
  const searchPlayersByName = useCallback((searchTerm) => {
    if (!searchTerm || !searchTerm.trim()) return [];
    const term = searchTerm.toLowerCase().trim();
    return Object.values(_cache)
      .filter((p) => p.name.toLowerCase().startsWith(term))
      .sort((a, b) => {
        const aExact = a.name.toLowerCase() === term;
        const bExact = b.name.toLowerCase() === term;
        if (aExact && !bExact) return -1;
        if (!aExact && bExact) return 1;
        return a.name.localeCompare(b.name);
      })
      .slice(0, 5);
  }, []);

  // ── createOrGetPlayer ─────────────────────────────────────────────────────
  // Creates player on server if they don't exist; updates name if changed.
  const createOrGetPlayer = useCallback(
    async (jersey, name) => {
      const key = String(jersey);
      const existing = _cache[key];

      if (existing) {
        // Update name if it changed
        if (name && existing.name !== name) {
          try {
            const updated = await playerApi.updatePlayer(existing._id, {
              name,
              jersey: key,
            });
            _cache[key] = updated;
            refresh();
          } catch (err) {
            console.error("createOrGetPlayer: name update failed", err);
          }
        }
        return _cache[key];
      }

      // Not in cache — try fetching from server first (avoids duplicate creation)
      try {
        const fetched = await playerApi.createOrFindByJersey(
          key,
          name || `Player ${jersey}`
        );
        if (fetched) {
          _cache[key] = fetched;
          refresh();
          return fetched;
        }
      } catch (err) {
        console.error("createOrGetPlayer: fetch failed, trying create", err);
      }

      // Create new player as last resort
      try {
        const created = await playerApi.addPlayer({
          name: name || `Player ${jersey}`,
          jersey: key,
        });
        _cache[key] = created;
        refresh();
        return created;
      } catch (err) {
        console.error("createOrGetPlayer: create failed", err);
        return null;
      }
    },
    [refresh]
  );

  // ── deletePlayer ──────────────────────────────────────────────────────────
  const deletePlayer = useCallback(
    async (jersey) => {
      const key = String(jersey);
      const player = _cache[key];
      if (!player) return;
      try {
        await playerApi.deletePlayer(player._id);
        delete _cache[key];
        refresh();
      } catch (err) {
        console.error("deletePlayer failed", err);
      }
    },
    [refresh]
  );

  // ── migratePlayer — no-op now; migration ran during the localStorage era ──
  const migratePlayer = useCallback(() => {
    // Nothing to migrate; MongoDB stores correct values
  }, []);

  // ────────────────────────────────────────────────────────────────────────────
  // updatePlayerStats
  //
  // Called per ball/wicket from ScoringPage — same signature as before.
  // Strategy: buffer updates in a per-match in-memory accumulator, then
  // flush to the server only when saveMatch() / updateMatchMilestones() is called.
  // This avoids hundreds of HTTP calls during a live match.
  // ────────────────────────────────────────────────────────────────────────────
  const pendingStatsRef = useRef({}); // { [jersey]: { ...cumulativeStats } }

  const updatePlayerStats = useCallback((jersey, stats) => {
    const key = String(jersey);
    const currentMatchId = localStorage.getItem("current_match_id");

    // Merge into pending buffer
    if (!pendingStatsRef.current[key]) {
      pendingStatsRef.current[key] = {
        jersey: key,
        name: stats.name,
        matchId: currentMatchId,
        // all counters start at 0
        runs: 0,
        balls: 0,
        wickets: 0,
        runsGiven: 0,
        ballsBowled: 0,
        fours: 0,
        sixes: 0,
        innings: 0,
        bowlingInnings: 0,
        dotBalls: 0,
        dotBallsBowled: 0,
        ducks: 0,
        ones: 0,
        twos: 0,
        threes: 0,
        thirties: 0,
        fifties: 0,
        hundreds: 0,
        wides: 0,
        noBalls: 0,
        maidens: 0,
        threeWickets: 0,
        fiveWickets: 0,
        tenWickets: 0,
        highestScore: 0,
        dismissals: 0,
        notOuts: 0,
        matches: 0,
        captainMatches: 0,
        captainWins: 0,
        captainLosses: 0,
        captainTies: 0,
        captainNR: 0,
      };
    }

    const buf = pendingStatsRef.current[key];
    if (stats.name) buf.name = stats.name;

    // Accumulate every field exactly like the localStorage version did
    const addFields = [
      "runs",
      "balls",
      "wickets",
      "runsGiven",
      "ballsBowled",
      "fours",
      "sixes",
      "innings",
      "dotBalls",
      "dotBallsBowled",
      "ones",
      "twos",
      "threes",
      "thirties",
      "fifties",
      "hundreds",
      "ducks",
      "dismissals",
      "notOuts",
      "wides",
      "noBalls",
      "maidens",
      "threeWickets",
      "fiveWickets",
      "tenWickets",
      "matches",
      "captainMatches",
      "captainWins",
      "captainLosses",
      "captainTies",
      "captainNR",
      "bowlingInnings",
    ];
    for (const field of addFields) {
      if (stats[field] !== undefined) buf[field] += stats[field];
    }
    if (
      stats.highestScore !== undefined &&
      stats.highestScore > buf.highestScore
    ) {
      buf.highestScore = stats.highestScore;
    }

    // Also update local cache for instant reads (getPlayer returns fresh data)
    if (_cache[key]) {
      for (const field of addFields) {
        if (stats[field] !== undefined) {
          _cache[key][field] = (_cache[key][field] || 0) + stats[field];
        }
      }
    }
  }, []);

  // ── updateFieldingStats ───────────────────────────────────────────────────
  // Called immediately during the match; buffer it too.
  const fieldingBufferRef = useRef({}); // { [name]: { catches, runouts, stumpings } }

  const updateFieldingStats = useCallback((jersey, wicketType, playerName) => {
    const key = playerName || String(jersey);
    if (!fieldingBufferRef.current[key]) {
      fieldingBufferRef.current[key] = {
        name: playerName || key,
        catches: 0,
        runouts: 0,
        stumpings: 0,
      };
    }
    const buf = fieldingBufferRef.current[key];
    if (wicketType === "caught") buf.catches++;
    if (wicketType === "runout") buf.runouts++;
    if (wicketType === "stumped") buf.stumpings++;
  }, []);

  // ── updateMatchMilestones — flush pending stats to MongoDB ────────────────
  // Call this at the end of the match (same place you called it before).
  const updateMatchMilestones = useCallback(async () => {
    // ── STEP 1: Warm up cache for any players not yet loaded ─────────────────
    // This is critical for captains who may not have batted/bowled (not in cache yet).
    const warmupPromises = Object.keys(pendingStatsRef.current).map(
      async (key) => {
        if (!_cache[key]) {
          const buf = pendingStatsRef.current[key];
          const name = buf.name || `Player ${key}`;
          console.log(`🔍 Cache miss for jersey ${key} — fetching/creating...`);
          try {
            const player = await playerApi.createOrFindByJersey(key, name);
            if (player) {
              _cache[key] = player;
              console.log(`✅ Warmed cache for ${name} (jersey ${key})`);
            }
          } catch (err) {
            console.warn(`⚠️ Cache warm failed for jersey ${key}:`, err);
          }
        }
      }
    );
    await Promise.all(warmupPromises);

    // ── STEP 2: Flush fielding stats ─────────────────────────────────────────
    for (const [name, fielding] of Object.entries(fieldingBufferRef.current)) {
      const player = Object.values(_cache).find((p) => p.name === name);
      if (!player) {
        console.warn("⚠️ Fielding flush skipped — player not found:", name);
        continue;
      }
      try {
        await playerApi.updatePlayer(player._id, {
          $inc: {
            catches: fielding.catches,
            runouts: fielding.runouts,
            stumpings: fielding.stumpings,
          },
        });
        const cacheKey = player.jersey || String(player._id);
        _cache[cacheKey] = { ..._cache[cacheKey], ...fielding };
      } catch (err) {
        console.error("Fielding flush failed for", name, err);
      }
    }
    fieldingBufferRef.current = {};

    // ── STEP 3: Flush player stats ───────────────────────────────────────────
    for (const [key, buf] of Object.entries(pendingStatsRef.current)) {
      let player = _cache[key];

      if (!player) {
        // Should have been warmed above, but try one more time as safety net
        try {
          const name = buf.name || `Player ${key}`;
          player = await playerApi.createOrFindByJersey(key, name);
          if (player) _cache[key] = player;
        } catch (err) {
          console.warn("Could not find/create player for jersey", key, err);
        }
      }

      if (!player) {
        console.error(
          `❌ Skipping flush for jersey ${key} — player could not be found or created`
        );
        continue;
      }

      try {
        console.log(
          `💾 Flushing stats for ${player.name} (jersey ${key}):`,
          buf
        );
        await playerApi.flushStats(player._id, buf);
        const fresh = await playerApi.getPlayer(player._id);
        _cache[key] = fresh;
        console.log(`✅ Flushed stats for ${player.name}`);
      } catch (err) {
        console.error("Stats flush failed for", key, err);
      }
    }
    pendingStatsRef.current = {};
    refresh();
  }, [refresh]);

  // ── setHighestScore ───────────────────────────────────────────────────────
  const setHighestScore = useCallback((jersey, runs) => {
    const key = String(jersey);
    const buf = pendingStatsRef.current[key];
    if (buf && runs > buf.highestScore) buf.highestScore = runs;
    if (_cache[key] && runs > (_cache[key].highestScore || 0)) {
      _cache[key].highestScore = runs;
    }
  }, []);

  // ── setBestBowling ────────────────────────────────────────────────────────
  const setBestBowling = useCallback((jersey, wickets, runs) => {
    // Will be applied server-side on flush; update cache for display
    const key = String(jersey);
    if (_cache[key]) {
      const bestW = _cache[key].bestBowlingWickets || 0;
      const bestR = bestW === 0 ? 9999 : _cache[key].bestBowlingRuns || 0;
      if (wickets > bestW || (wickets === bestW && runs < bestR)) {
        _cache[key].bestBowlingWickets = wickets;
        _cache[key].bestBowlingRuns = runs;
      }
    }
  }, []);

  // ── updateBestBowlingIfBetter — no-op (handled server-side on flush) ──────
  const updateBestBowlingIfBetter = useCallback(() => {
    // Server-side matches.js route handles best bowling comparison
  }, []);

  // ── updateTeamStats — writes to MongoDB via teamApi ──────────────────────
  const updateTeamStats = useCallback(async (teamName, stats, matchId) => {
    if (!teamName) return;
    try {
      // ensure the team document exists, get its _id back
      const team = await teamApi.ensureTeam(teamName.trim());
      await teamApi.updateTeamStats(team._id, { ...stats, matchId: matchId || null });
      console.log(`✅ Team stats saved for "${teamName}":`, stats);
    } catch (err) {
      console.error(
        "updateTeamStats failed, falling back to localStorage",
        err
      );
      // graceful fallback so the match isn't broken if the network is down
      const raw = localStorage.getItem("cricket_team_stats");
      const db = raw ? JSON.parse(raw) : {};
      const key = teamName.trim();
      if (!db[key])
        db[key] = { matches: 0, wins: 0, losses: 0, ties: 0, nr: 0 };
      if (stats.matches !== undefined) db[key].matches += stats.matches;
      if (stats.wins !== undefined) db[key].wins += stats.wins;
      if (stats.losses !== undefined) db[key].losses += stats.losses;
      if (stats.ties !== undefined) db[key].ties += stats.ties;
      if (stats.nr !== undefined) db[key].nr += stats.nr;
      localStorage.setItem("cricket_team_stats", JSON.stringify(db));
    }
  }, []);

  return {
    // Core reads
    getPlayer,
    getAllPlayers,
    searchPlayersByName,

    // Write — player CRUD
    createOrGetPlayer,
    deletePlayer,

    // Write — match-time stats (buffered, flushed at end of match)
    updatePlayerStats,
    updateFieldingStats,
    setHighestScore,
    setBestBowling,

    // Write — end of match
    updateMatchMilestones, // ← call this when match ends; flushes everything to DB
    updateBestBowlingIfBetter,

    // Match ID session management (unchanged)
    setCurrentMatchId,
    getCurrentMatchId,

    // Migration (no-op now)
    migratePlayer,

    // Team stats
    updateTeamStats,
  };
}

export default usePlayerDatabase;
