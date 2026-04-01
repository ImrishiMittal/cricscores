import { useState, useCallback } from "react";

const DB_KEY = "cricket_player_database";

/**
 * ✅ FIXED: Bowling Innings now only increments ONCE per match
 *
 * How it works:
 * - Each match has a unique matchId (timestamp when match starts)
 * - Player tracks which matchIds they've bowled in
 * - Bowling innings only increments if this is a NEW matchId
 */

function usePlayerDatabase() {
  const [, forceUpdate] = useState(0);

  const loadDB = useCallback(() => {
    const data = localStorage.getItem(DB_KEY);
    return data ? JSON.parse(data) : {};
  }, []);

  const saveDB = useCallback((db) => {
    localStorage.setItem(DB_KEY, JSON.stringify(db));
    forceUpdate((v) => v + 1);
  }, []);

  const getPlayer = useCallback(
    (jersey) => {
      const db = loadDB();
      return db[String(jersey)] || null;
    },
    [loadDB]
  );

  const searchPlayersByName = useCallback(
    (searchTerm) => {
      if (!searchTerm || searchTerm.trim().length === 0) return [];
      const db = loadDB();
      const term = searchTerm.toLowerCase().trim();
      return Object.values(db)
        .filter((player) => player.name.toLowerCase().startsWith(term))
        .sort((a, b) => {
          const aExact = a.name.toLowerCase() === term;
          const bExact = b.name.toLowerCase() === term;
          if (aExact && !bExact) return -1;
          if (!aExact && bExact) return 1;
          return a.name.localeCompare(b.name);
        })
        .slice(0, 5);
    },
    [loadDB]
  );

  // Fix 1: setCurrentMatchId
  const setCurrentMatchId = useCallback((matchId) => {
    if (matchId === null) {
      localStorage.removeItem("current_match_id");
    } else {
      localStorage.setItem("current_match_id", matchId);
    }
  }, []);

  // Fix 2: getCurrentMatchId
  const getCurrentMatchId = useCallback(() => {
    const id = localStorage.getItem("current_match_id");
    return id === "null" || id === null ? null : id;
  }, []);

  const createOrGetPlayer = useCallback(
    (jersey, name) => {
      const db = loadDB();
      const key = String(jersey);

      if (!db[key]) {
        db[key] = {
          jersey: key,
          name: name || `Player ${key}`,
          runs: 0,
          balls: 0,
          wickets: 0,
          runsGiven: 0,
          ballsBowled: 0,
          fours: 0,
          sixes: 0,
          matches: 0,
          innings: 0,
          bowlingInnings: 0,
          catches: 0,
          runouts: 0,
          stumpings: 0,
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
          bestBowlingWickets: 0,
          bestBowlingRuns: 0,
          bowlingMatchIds: [],
        };
        saveDB(db);
      } else if (name && db[key].name !== name) {
        // ✅ Update name if it changed
        db[key].name = name;
        saveDB(db);
      }

      return db[key];
    },
    [loadDB, saveDB]
  );

  const updatePlayerStats = useCallback(
    (jersey, stats) => {
      const db = loadDB();
      const key = String(jersey);
      const currentMatchId = getCurrentMatchId();

      if (!db[key]) {
        db[key] = {
          jersey: key,
          name: stats.name || `Player ${key}`,
          runs: 0,
          balls: 0,
          wickets: 0,
          runsGiven: 0,
          ballsBowled: 0,
          fours: 0,
          sixes: 0,
          matches: 0,
          innings: 0,
          bowlingInnings: 0,
          catches: 0,
          runouts: 0,
          stumpings: 0,
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
          bestBowlingWickets: 0,
          bestBowlingRuns: 0,
          bowlingMatchIds: [],
        };
      }

      const player = db[key];
      if (stats.name) player.name = stats.name;

      // ✅ Batting
      if (stats.runs !== undefined) player.runs += stats.runs;
      if (stats.balls !== undefined) player.balls += stats.balls;
      if (stats.fours !== undefined) player.fours += stats.fours;
      if (stats.sixes !== undefined) player.sixes += stats.sixes;
      if (stats.matches !== undefined) player.matches += stats.matches;
      if (stats.innings !== undefined) player.innings += stats.innings;
      if (stats.dotBalls !== undefined) player.dotBalls += stats.dotBalls;
      if (stats.ones !== undefined) player.ones += stats.ones;
      if (stats.twos !== undefined) player.twos += stats.twos;
      if (stats.threes !== undefined) player.threes += stats.threes;
      if (stats.thirties !== undefined) player.thirties += stats.thirties;
      if (stats.fifties !== undefined) player.fifties += stats.fifties;
      if (stats.hundreds !== undefined) player.hundreds += stats.hundreds;
      if (stats.ducks !== undefined) player.ducks += stats.ducks;

      // ✅ Bowling
      if (stats.wickets !== undefined) {
        // Inside updatePlayerStats, after saving to db:
        // Track per-match bowling for best bowling calculation
        const currentMatchId = getCurrentMatchId();
        if (
          currentMatchId &&
          (stats.wickets !== undefined || stats.runsGiven !== undefined)
        ) {
          const matchKey = `match_bowling_${currentMatchId}_${key}`;
          const existing = localStorage.getItem(matchKey);
          const cur = existing ? JSON.parse(existing) : { w: 0, r: 0 };
          if (stats.wickets) cur.w += stats.wickets;
          if (stats.runsGiven) cur.r += stats.runsGiven;
          localStorage.setItem(matchKey, JSON.stringify(cur));

          // Update best bowling live
          const bestW = player.bestBowlingWickets || 0;
          const bestR = bestW === 0 ? 9999 : player.bestBowlingRuns || 0;
          if (
            cur.w > 0 &&
            (cur.w > bestW || (cur.w === bestW && cur.r < bestR))
          ) {
            player.bestBowlingWickets = cur.w;
            player.bestBowlingRuns = cur.r;
          }
        }
        player.wickets += stats.wickets;
      }
      if (stats.runsGiven !== undefined) {
        // Inside updatePlayerStats, after saving to db:
        // Track per-match bowling for best bowling calculation
        const currentMatchId = getCurrentMatchId();
        if (
          currentMatchId &&
          (stats.wickets !== undefined || stats.runsGiven !== undefined)
        ) {
          const matchKey = `match_bowling_${currentMatchId}_${key}`;
          const existing = localStorage.getItem(matchKey);
          const cur = existing ? JSON.parse(existing) : { w: 0, r: 0 };
          if (stats.wickets) cur.w += stats.wickets;
          if (stats.runsGiven) cur.r += stats.runsGiven;
          localStorage.setItem(matchKey, JSON.stringify(cur));

          // Update best bowling live
          const bestW = player.bestBowlingWickets || 0;
          const bestR = bestW === 0 ? 9999 : player.bestBowlingRuns || 0;
          if (
            cur.w > 0 &&
            (cur.w > bestW || (cur.w === bestW && cur.r < bestR))
          ) {
            player.bestBowlingWickets = cur.w;
            player.bestBowlingRuns = cur.r;
          }
        }
        player.runsGiven += stats.runsGiven;
      }
      if (stats.wides !== undefined) player.wides += stats.wides;
      if (stats.noBalls !== undefined) player.noBalls += stats.noBalls;
      if (stats.dotBallsBowled !== undefined)
        player.dotBallsBowled += stats.dotBallsBowled;
      if (stats.maidens !== undefined)
        player.maidens = (player.maidens || 0) + stats.maidens;
      if (stats.ballsBowled !== undefined) {
        player.ballsBowled += stats.ballsBowled;
        if (
          currentMatchId &&
          !player.bowlingMatchIds.includes(currentMatchId)
        ) {
          player.bowlingInnings += 1;
          player.bowlingMatchIds.push(currentMatchId);
          if (player.bowlingMatchIds.length > 50) {
            player.bowlingMatchIds = player.bowlingMatchIds.slice(-50);
          }
        }
      }

      saveDB(db);
    },
    [loadDB, saveDB, getCurrentMatchId]
  );

  const updateFieldingStats = useCallback(
    (jersey, wicketType, playerName) => {
      const db = loadDB();
      const key = String(jersey);

      if (!db[key]) {
        db[key] = {
          jersey: key,
          name: playerName || `Player ${key}`,
          runs: 0,
          balls: 0,
          wickets: 0,
          runsGiven: 0,
          ballsBowled: 0,
          fours: 0,
          sixes: 0,
          matches: 0,
          innings: 0,
          bowlingInnings: 0,
          catches: 0,
          runouts: 0,
          stumpings: 0,
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
          bestBowlingWickets: 0,
          bestBowlingRuns: 0,
          bowlingMatchIds: [],
        };
      } else if (playerName && db[key].name !== playerName) {
        db[key].name = playerName;
      }

      if (wicketType === "caught") db[key].catches = (db[key].catches || 0) + 1;
      if (wicketType === "runout") db[key].runouts = (db[key].runouts || 0) + 1;
      if (wicketType === "stumped")
        db[key].stumpings = (db[key].stumpings || 0) + 1;

      saveDB(db);
    },
    [loadDB, saveDB]
  );

  const deletePlayer = useCallback(
    (jersey) => {
      const db = loadDB();
      delete db[String(jersey)];
      saveDB(db);
    },
    [loadDB, saveDB]
  );

  const getAllPlayers = useCallback(() => {
    const db = loadDB();
    return Object.values(db).sort((a, b) => a.name.localeCompare(b.name));
  }, [loadDB]);

  const setBestBowling = useCallback(
    (jersey, wickets, runs) => {
      const db = loadDB();
      const key = String(jersey);
      if (!db[key]) return;
      db[key].bestBowlingWickets = wickets;
      db[key].bestBowlingRuns = runs;
      saveDB(db);
    },
    [loadDB, saveDB]
  );
  const updateBestBowlingIfBetter = useCallback(
    (jersey) => {
      const db = loadDB();
      const key = String(jersey);
      const player = db[key];
      if (!player) return;

      const currentMatchId = getCurrentMatchId();
      if (!currentMatchId) return;

      // Read current match wickets/runs from a per-match tracker
      const matchKey = `match_bowling_${currentMatchId}_${key}`;
      const matchData = localStorage.getItem(matchKey);
      const { w = 0, r = 0 } = matchData ? JSON.parse(matchData) : {};

      if (w === 0) return;

      const bestW = player.bestBowlingWickets || 0;
      const bestR = bestW === 0 ? 9999 : player.bestBowlingRuns || 0;

      if (w > bestW || (w === bestW && r < bestR)) {
        db[key].bestBowlingWickets = w;
        db[key].bestBowlingRuns = r;
        saveDB(db);
      }
    },
    [loadDB, saveDB, getCurrentMatchId]
  );

  return {
    getPlayer,
    searchPlayersByName,
    updatePlayerStats,
    updateFieldingStats,
    deletePlayer,
    getAllPlayers,
    setCurrentMatchId, // ✅ Export this
    getCurrentMatchId, // ✅ Export this
    setBestBowling,
    createOrGetPlayer,
  };
}

export default usePlayerDatabase;
