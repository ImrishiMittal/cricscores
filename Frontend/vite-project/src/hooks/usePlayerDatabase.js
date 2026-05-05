import { useState, useEffect, useCallback, useRef } from "react";
import * as playerApi from "../api/playerApi";
import * as teamApi from "../api/teamApi";

let _cache = {};
let _cacheLoaded = false;

function usePlayerDatabase() {
  const preMatchHighScoresRef = useRef({});
  const [, forceUpdate] = useState(0);
  const refresh = useCallback(() => forceUpdate((v) => v + 1), []);

  // ── Declare refs FIRST so all callbacks can safely close over them ─────────
  const pendingStatsRef = useRef({});
  const fieldingBufferRef = useRef({});

  // ── Load all players into cache on first mount ────────────────────────────
  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const players = await playerApi.getAllPlayers();
        if (cancelled) return;
        _cache = {};
        for (const p of players) {
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
    return () => { cancelled = true; };
  }, []);

  // ── Snapshot helpers (declared after pendingStatsRef) ─────────────────────
  const getPendingStatsSnapshot = useCallback(() => {
    return JSON.parse(JSON.stringify(pendingStatsRef.current));
  }, []);

  const restorePendingStats = useCallback((snapshot) => {
    if (snapshot && typeof snapshot === "object") {
      pendingStatsRef.current = JSON.parse(JSON.stringify(snapshot));
      console.log("↩️ Restored pendingStats buffer from undo snapshot");
    }
  }, []);

  // ── currentMatchId ────────────────────────────────────────────────────────
  const setCurrentMatchId = useCallback((matchId) => {
    if (matchId === null) {
      localStorage.removeItem("current_match_id");
      preMatchHighScoresRef.current = {}; // clear on match end
    } else {
      localStorage.setItem("current_match_id", String(matchId));
      // Snapshot current highest scores from cache
      preMatchHighScoresRef.current = {};
      Object.entries(_cache).forEach(([key, p]) => {
        preMatchHighScoresRef.current[key] = p.highestScore || 0;
      });
    }
  }, []);

  const getCurrentMatchId = useCallback(() => {
    const id = localStorage.getItem("current_match_id");
    return id === "null" || id === null ? null : id;
  }, []);

  // ── Cache reads ───────────────────────────────────────────────────────────
  const getPlayer = useCallback((jersey) => {
    return _cache[String(jersey)] || null;
  }, []);

  const getAllPlayers = useCallback(() => {
    return Object.values(_cache).sort((a, b) => a.name.localeCompare(b.name));
  }, []);

  const searchPlayersByName = useCallback((searchTerm) => {
    if (!searchTerm?.trim()) return [];
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

  // ── Player CRUD ───────────────────────────────────────────────────────────
  const createOrGetPlayer = useCallback(async (jersey, name) => {
    const key = String(jersey);
    const existing = _cache[key];
    if (existing) {
      if (name && existing.name !== name) {
        try {
          const updated = await playerApi.updatePlayer(existing._id, { name, jersey: key });
          _cache[key] = updated;
          refresh();
        } catch (err) {
          console.error("createOrGetPlayer: name update failed", err);
        }
      }
      return _cache[key];
    }
    try {
      const fetched = await playerApi.createOrFindByJersey(key, name || `Player ${jersey}`);
      if (fetched) { _cache[key] = fetched; refresh(); return fetched; }
    } catch (err) {
      console.error("createOrGetPlayer: fetch failed, trying create", err);
    }
    try {
      const created = await playerApi.addPlayer({ name: name || `Player ${jersey}`, jersey: key });
      _cache[key] = created;
      refresh();
      return created;
    } catch (err) {
      console.error("createOrGetPlayer: create failed", err);
      return null;
    }
  }, [refresh]);

  const deletePlayer = useCallback(async (jersey) => {
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
  }, [refresh]);

  const migratePlayer = useCallback(() => {}, []);

  // ── updatePlayerStats (buffers per-ball stats in memory) ──────────────────
  const updatePlayerStats = useCallback((jersey, stats) => {
    const key = String(jersey);
    const currentMatchId = localStorage.getItem("current_match_id");

    if (!pendingStatsRef.current[key]) {
      // Seed highestScore from cache so we don't overwrite with a lower value
      const cachedHS = _cache[key]?.highestScore || 0;
      
      pendingStatsRef.current[key] = {
        jersey: key, name: stats.name, matchId: currentMatchId,
        runs: 0, balls: 0, wickets: 0, runsGiven: 0, ballsBowled: 0,
        fours: 0, sixes: 0, innings: 0, bowlingInnings: 0,
        dotBalls: 0, dotBallsBowled: 0, ducks: 0, ones: 0, twos: 0, threes: 0,
        thirties: 0, fifties: 0, hundreds: 0, wides: 0, noBalls: 0, maidens: 0,
        threeWickets: 0, fiveWickets: 0, tenWickets: 0, highestScore: cachedHS, // ← seed from cache
        dismissals: 0, notOuts: 0, matches: 0,
        captainMatches: 0, captainWins: 0, captainLosses: 0, captainTies: 0, captainNR: 0,
        catches: 0, runouts: 0, stumpings: 0,
      };
    }

    const buf = pendingStatsRef.current[key];
    if (stats.name) buf.name = stats.name;

    const addFields = [
      "runs", "balls", "wickets", "runsGiven", "ballsBowled",
      "fours", "sixes", "innings", "dotBalls", "dotBallsBowled",
      "ones", "twos", "threes", "thirties", "fifties", "hundreds", "ducks",
      "dismissals", "notOuts", "wides", "noBalls", "maidens",
      "threeWickets", "fiveWickets", "tenWickets", "matches",
      "captainMatches", "captainWins", "captainLosses", "captainTies", "captainNR",
      "bowlingInnings",
    ];
    for (const field of addFields) {
      if (stats[field] !== undefined) buf[field] += stats[field];
    }
    if (stats.highestScore !== undefined && stats.highestScore > buf.highestScore) {
      buf.highestScore = stats.highestScore;
    }

    if (_cache[key]) {
      for (const field of addFields) {
        if (stats[field] !== undefined) {
          _cache[key][field] = (_cache[key][field] || 0) + stats[field];
        }
      }
    }
  }, []);

  // ── updateFieldingStats ───────────────────────────────────────────────────
  const updateFieldingStats = useCallback((jersey, wicketType, playerName) => {
    const key = playerName || String(jersey);
    if (!fieldingBufferRef.current[key]) {
      fieldingBufferRef.current[key] = { name: playerName || key, catches: 0, runouts: 0, stumpings: 0 };
    }
    const buf = fieldingBufferRef.current[key];
    if (wicketType === "caught") buf.catches++;
    if (wicketType === "runout") buf.runouts++;
    if (wicketType === "stumped") buf.stumpings++;
  }, []);

  // ── updateMatchMilestones — flushes everything to MongoDB at match end ─────
  const updateMatchMilestones = useCallback(async () => {
    // STEP 1: Warm up cache in parallel
    const warmupPromises = Object.keys(pendingStatsRef.current).map(async (key) => {
      if (!_cache[key]) {
        const buf = pendingStatsRef.current[key];
        const name = buf.name || `Player ${key}`;
        try {
          const player = await playerApi.createOrFindByJersey(key, name);
          if (player) { _cache[key] = player; }
        } catch (err) {
          console.warn(`⚠️ Cache warm failed for jersey ${key}:`, err);
        }
      }
    });
    await Promise.all(warmupPromises);

    // STEP 2: Flush fielding stats (sequential — small list, order matters)
    for (const [name, fielding] of Object.entries(fieldingBufferRef.current)) {
      const player = Object.values(_cache).find((p) => p.name === name);
      if (!player) { console.warn("⚠️ Fielding flush skipped:", name); continue; }
      try {
        await playerApi.updatePlayer(player._id, {
          $inc: { catches: fielding.catches, runouts: fielding.runouts, stumpings: fielding.stumpings },
        });
        const cacheKey = player.jersey || String(player._id);
        _cache[cacheKey] = { ..._cache[cacheKey], ...fielding };
      } catch (err) {
        console.error("Fielding flush failed for", name, err);
      }
    }
    fieldingBufferRef.current = {};

    // STEP 3: Flush player stats — PARALLELIZED ✅
    const flushPromises = Object.entries(pendingStatsRef.current).map(async ([key, buf]) => {
      let player = _cache[key];
      if (!player) {
        try {
          const name = buf.name || `Player ${key}`;
          player = await playerApi.createOrFindByJersey(key, name);
          if (player) _cache[key] = player;
        } catch (err) {
          console.warn("Could not find/create player for jersey", key, err);
        }
      }
      if (!player) {
        console.error(`❌ Skipping flush for jersey ${key}`);
        return;
      }
      try {
        await playerApi.flushStats(player._id, buf);
        const fresh = await playerApi.getPlayer(player._id);
        _cache[key] = fresh;
        console.log(`✅ Flushed stats for ${player.name}`);
      } catch (err) {
        console.error("Stats flush failed for", key, err);
      }
    });

    await Promise.all(flushPromises);
    pendingStatsRef.current = {};
    refresh();
  }, [refresh]);

  // ── setHighestScore / setBestBowling ──────────────────────────────────────
  const setHighestScore = useCallback((jersey, runs) => {
    const key = String(jersey);
    const buf = pendingStatsRef.current[key];
    if (!buf) return;
    
    // Compare against both the buffer AND the pre-match DB value
    const preMatchHS = preMatchHighScoresRef.current[key] || 0;
    const trueCurrentHS = Math.max(buf.highestScore, preMatchHS);
    
    if (runs > trueCurrentHS) {
      buf.highestScore = runs;
      // Also keep cache in sync
      if (_cache[key]) _cache[key].highestScore = runs;
    }
  }, []);

  const setBestBowling = useCallback((jersey, wickets, runs) => {
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

  const updateBestBowlingIfBetter = useCallback(() => {}, []);

  // ── updateTeamStats ───────────────────────────────────────────────────────
  const updateTeamStats = useCallback(async (teamName, stats, matchId) => {
    if (!teamName) return;
    try {
      const team = await teamApi.ensureTeam(teamName.trim());
      await teamApi.updateTeamStats(team._id, { ...stats, matchId: matchId || null });
      console.log(`✅ Team stats saved for "${teamName}":`, stats);
    } catch (err) {
      console.error("updateTeamStats failed, falling back to localStorage", err);
      const raw = localStorage.getItem("cricket_team_stats");
      const db = raw ? JSON.parse(raw) : {};
      const key = teamName.trim();
      if (!db[key]) db[key] = { matches: 0, wins: 0, losses: 0, ties: 0, nr: 0 };
      if (stats.matches !== undefined) db[key].matches += stats.matches;
      if (stats.wins !== undefined) db[key].wins += stats.wins;
      if (stats.losses !== undefined) db[key].losses += stats.losses;
      if (stats.ties !== undefined) db[key].ties += stats.ties;
      if (stats.nr !== undefined) db[key].nr += stats.nr;
      localStorage.setItem("cricket_team_stats", JSON.stringify(db));
    }
  }, []);

  return {
    getPlayer,
    getAllPlayers,
    searchPlayersByName,
    createOrGetPlayer,
    deletePlayer,
    updatePlayerStats,
    updateFieldingStats,
    setHighestScore,
    setBestBowling,
    updateMatchMilestones,
    updateBestBowlingIfBetter,
    setCurrentMatchId,
    getCurrentMatchId,
    migratePlayer,
    updateTeamStats,
    getPendingStatsSnapshot,
    restorePendingStats,
  };
}

export default usePlayerDatabase;