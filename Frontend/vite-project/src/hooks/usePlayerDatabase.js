import { useState, useCallback } from "react";

const DB_KEY = "cricket_player_database";

const defaultPlayer = (key, name) => ({
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
  maidens: 0,
  threeWickets: 0,
  fiveWickets: 0,
  tenWickets: 0,
  highestScore: 0,
  dismissals: 0,
  notOuts: 0,
  matchIds: [],
  captainMatches: 0,
  captainWins: 0,
  captainLosses: 0,
  captainTies: 0,
  captainNR: 0,
});

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

  // One-time migration called when PlayerDetailPage opens.
  // Fixes notOuts for ALL past records by deriving: notOuts = innings - dismissals.
  // highestScore cannot be recovered from history, so it stays 0 for old matches
  // and PlayerDetailPage displays "—*" instead of a misleading 0.
  const migratePlayer = useCallback(
    (jersey) => {
      const db = loadDB();
      const key = String(jersey);
      const player = db[key];
      if (!player) return;

      let changed = false;

      // Ensure matchIds array exists (needed for future match deduplication)
      if (!Array.isArray(player.matchIds)) {
        player.matchIds = [];
        changed = true;
      }

      // Fix notOuts: innings - dismissals is the mathematically correct value.
      // If stored notOuts is less than derived, correct it.
      const innings = player.innings || 0;
      const dismissals = player.dismissals || 0;
      const derivedNotOuts = Math.max(0, innings - dismissals);
      if (derivedNotOuts > (player.notOuts || 0)) {
        player.notOuts = derivedNotOuts;
        changed = true;
      }

      if (changed) saveDB(db);
    },
    [loadDB, saveDB]
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

  const setCurrentMatchId = useCallback((matchId) => {
    if (matchId === null) {
      localStorage.removeItem("current_match_id");
    } else {
      localStorage.setItem("current_match_id", matchId);
    }
  }, []);

  const getCurrentMatchId = useCallback(() => {
    const id = localStorage.getItem("current_match_id");
    return id === "null" || id === null ? null : id;
  }, []);

  const createOrGetPlayer = useCallback(
    (jersey, name) => {
      const db = loadDB();
      const key = String(jersey);
      if (!db[key]) {
        db[key] = defaultPlayer(key, name);
        saveDB(db);
      } else if (name && db[key].name !== name) {
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
        db[key] = defaultPlayer(key, stats.name);
      }

      const player = db[key];
      if (stats.name) player.name = stats.name;

      if (!Array.isArray(player.matchIds)) player.matchIds = [];

      // matches — deduplicated per matchId so batter+bowler doesn't double-count
      if (stats.matches !== undefined && currentMatchId) {
        if (!player.matchIds.includes(currentMatchId)) {
          player.matches += stats.matches;
          player.matchIds.push(currentMatchId);
          if (player.matchIds.length > 200) {
            player.matchIds = player.matchIds.slice(-200);
          }
        }
      } else if (stats.matches !== undefined && !currentMatchId) {
        player.matches += stats.matches;
      }

      // Batting
      if (stats.runs !== undefined) player.runs += stats.runs;
      if (stats.balls !== undefined) player.balls += stats.balls;
      if (stats.fours !== undefined) player.fours += stats.fours;
      if (stats.sixes !== undefined) player.sixes += stats.sixes;
      if (stats.innings !== undefined) player.innings += stats.innings;
      if (stats.dotBalls !== undefined) player.dotBalls += stats.dotBalls;
      if (stats.ones !== undefined) player.ones += stats.ones;
      if (stats.twos !== undefined) player.twos += stats.twos;
      if (stats.threes !== undefined) player.threes += stats.threes;
      if (stats.thirties !== undefined) player.thirties += stats.thirties;
      if (stats.fifties !== undefined) player.fifties += stats.fifties;
      if (stats.hundreds !== undefined) player.hundreds += stats.hundreds;
      if (stats.ducks !== undefined) player.ducks += stats.ducks;
      if (stats.dismissals !== undefined)
        player.dismissals = (player.dismissals || 0) + stats.dismissals;
      if (stats.notOuts !== undefined)
        player.notOuts = (player.notOuts || 0) + stats.notOuts;
        if (stats.captainMatches !== undefined)
        player.captainMatches = (player.captainMatches || 0) + stats.captainMatches;
      if (stats.captainWins !== undefined)
        player.captainWins = (player.captainWins || 0) + stats.captainWins;
      if (stats.captainLosses !== undefined)
        player.captainLosses = (player.captainLosses || 0) + stats.captainLosses;
      if (stats.captainTies !== undefined)
        player.captainTies = (player.captainTies || 0) + stats.captainTies;
      if (stats.captainNR !== undefined)
        player.captainNR = (player.captainNR || 0) + stats.captainNR;

      // Bowling
      if (stats.wickets !== undefined) {
        if (currentMatchId) {
          const matchKey = `match_bowling_${currentMatchId}_${key}`;
          const existing = localStorage.getItem(matchKey);
          const cur = existing ? JSON.parse(existing) : { w: 0, r: 0 };
          if (stats.wickets) cur.w += stats.wickets;
          if (stats.runsGiven) cur.r += stats.runsGiven;
          localStorage.setItem(matchKey, JSON.stringify(cur));
          const bestW = player.bestBowlingWickets || 0;
          const bestR = bestW === 0 ? 9999 : player.bestBowlingRuns || 0;
          if (cur.w > 0 && (cur.w > bestW || (cur.w === bestW && cur.r < bestR))) {
            player.bestBowlingWickets = cur.w;
            player.bestBowlingRuns = cur.r;
          }
        }
        player.wickets += stats.wickets;
      }
      if (stats.runsGiven !== undefined) {
        if (currentMatchId) {
          const matchKey = `match_bowling_${currentMatchId}_${key}`;
          const existing = localStorage.getItem(matchKey);
          const cur = existing ? JSON.parse(existing) : { w: 0, r: 0 };
          if (stats.wickets) cur.w += stats.wickets;
          if (stats.runsGiven) cur.r += stats.runsGiven;
          localStorage.setItem(matchKey, JSON.stringify(cur));
          const bestW = player.bestBowlingWickets || 0;
          const bestR = bestW === 0 ? 9999 : player.bestBowlingRuns || 0;
          if (cur.w > 0 && (cur.w > bestW || (cur.w === bestW && cur.r < bestR))) {
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
        if (currentMatchId && !player.bowlingMatchIds.includes(currentMatchId)) {
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
        db[key] = defaultPlayer(key, playerName);
      } else if (playerName && db[key].name !== playerName) {
        db[key].name = playerName;
      }
      if (!Array.isArray(db[key].matchIds)) db[key].matchIds = [];
      if (wicketType === "caught") db[key].catches = (db[key].catches || 0) + 1;
      if (wicketType === "runout") db[key].runouts = (db[key].runouts || 0) + 1;
      if (wicketType === "stumped") db[key].stumpings = (db[key].stumpings || 0) + 1;
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

  const updateMatchMilestones = useCallback(() => {
    const db = loadDB();
    const currentMatchId = getCurrentMatchId();
    if (!currentMatchId) return;
    Object.keys(db).forEach((key) => {
      const matchKey = `match_bowling_${currentMatchId}_${key}`;
      const existing = localStorage.getItem(matchKey);
      if (!existing) return;
      const { w = 0 } = JSON.parse(existing);
      if (w === 0) return;
      const player = db[key];
      if (!player) return;
      if (w >= 10) player.tenWickets = (player.tenWickets || 0) + 1;
      else if (w >= 5) player.fiveWickets = (player.fiveWickets || 0) + 1;
      else if (w >= 3) player.threeWickets = (player.threeWickets || 0) + 1;
    });
    saveDB(db);
  }, [loadDB, saveDB, getCurrentMatchId]);

  const setHighestScore = useCallback(
    (jersey, runs) => {
      const db = loadDB();
      const key = String(jersey);
      if (!db[key]) return;
      if (runs > (db[key].highestScore || 0)) {
        db[key].highestScore = runs;
        saveDB(db);
      }
    },
    [loadDB, saveDB]
  );
  const updateTeamStats = useCallback(
    (teamName, stats) => {
      if (!teamName) return;
      const raw = localStorage.getItem("cricket_team_stats");
      const db = raw ? JSON.parse(raw) : {};
      const key = teamName.trim();
      if (!db[key]) {
        db[key] = { matches: 0, wins: 0, losses: 0, ties: 0, nr: 0 };
      }
      if (stats.matches !== undefined) db[key].matches += stats.matches;
      if (stats.wins    !== undefined) db[key].wins    += stats.wins;
      if (stats.losses  !== undefined) db[key].losses  += stats.losses;
      if (stats.ties    !== undefined) db[key].ties    += stats.ties;
      if (stats.nr      !== undefined) db[key].nr      += stats.nr;
      localStorage.setItem("cricket_team_stats", JSON.stringify(db));
    },
    []
  );

  return {
    getPlayer,
    searchPlayersByName,
    updatePlayerStats,
    updateFieldingStats,
    deletePlayer,
    getAllPlayers,
    setCurrentMatchId,
    getCurrentMatchId,
    setBestBowling,
    createOrGetPlayer,
    updateMatchMilestones,
    setHighestScore,
    updateBestBowlingIfBetter,
    migratePlayer,
    updateTeamStats,
  };
}

export default usePlayerDatabase;
