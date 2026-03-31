import { useState, useCallback } from "react";

const DB_KEY = "cricketPlayersDB";

function usePlayerDatabase() {
  const loadDB = () => {
    try {
      const raw = localStorage.getItem(DB_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  };

  const saveDB = (db) => {
    localStorage.setItem(DB_KEY, JSON.stringify(db));
  };

  const [playersDB, setPlayersDB] = useState(loadDB);

  const getPlayer = useCallback((jersey) => {
    const db = loadDB();
    return db[String(jersey)] || null;
  }, []);

  // ✅ NEW: Search players by name (autocomplete)
  const searchPlayersByName = useCallback((searchTerm) => {
    if (!searchTerm || searchTerm.trim().length === 0) return [];

    const db = loadDB();
    const term = searchTerm.toLowerCase().trim();

    return Object.values(db)
      .filter((player) => player.name.toLowerCase().startsWith(term))
      .sort((a, b) => {
        // Sort by: exact match first, then alphabetically
        const aExact = a.name.toLowerCase() === term;
        const bExact = b.name.toLowerCase() === term;
        if (aExact && !bExact) return -1;
        if (!aExact && bExact) return 1;
        return a.name.localeCompare(b.name);
      })
      .slice(0, 5); // Return max 5 suggestions
  }, []);

  const createOrGetPlayer = useCallback((name, jersey) => {
    const db = loadDB();
    const key = String(jersey);

    if (db[key]) {
      return {
        player: { ...db[key], playerId: key, jersey: key },
        isNew: false,
        isDuplicate: true,
      };
    }

    const newPlayer = {
      playerId: key,
      jersey: key,
      name: name.trim(),
      runs: 0,
      balls: 0,
      fours: 0,
      sixes: 0,
      wickets: 0,
      ballsBowled: 0,
      runsGiven: 0,
      matches: 0,
      catches: 0,
      runouts: 0,
      stumpings: 0,
      ones: 0,
      twos: 0,
      threes: 0,
      dotBalls: 0,
      dotBallsBowled: 0,
      innings: 0,
      wides: 0,
      noBalls: 0,
      bowlingInnings: 0,
    };

    const updatedDB = { ...db, [key]: newPlayer };
    saveDB(updatedDB);
    setPlayersDB(updatedDB);

    return { player: newPlayer, isNew: true, isDuplicate: false };
  }, []);

  const updatePlayerStats = useCallback((jersey, statsDelta) => {
    const db = loadDB();
    const key = String(jersey);
    if (!db[key]) return;

    db[key] = {
      ...db[key],
      runs: (db[key].runs || 0) + (statsDelta.runs || 0),
      balls: (db[key].balls || 0) + (statsDelta.balls || 0),
      fours: (db[key].fours || 0) + (statsDelta.fours || 0),
      sixes: (db[key].sixes || 0) + (statsDelta.sixes || 0),
      wickets: (db[key].wickets || 0) + (statsDelta.wickets || 0),
      ballsBowled: (db[key].ballsBowled || 0) + (statsDelta.ballsBowled || 0),
      runsGiven: (db[key].runsGiven || 0) + (statsDelta.runsGiven || 0),
      matches: (db[key].matches || 0) + (statsDelta.matches || 0),

      // ✅ ADD THESE 👇
      thirties: (db[key].thirties || 0) + (statsDelta.thirties || 0),
      fifties: (db[key].fifties || 0) + (statsDelta.fifties || 0),
      hundreds: (db[key].hundreds || 0) + (statsDelta.hundreds || 0),
      ducks: (db[key].ducks || 0) + (statsDelta.ducks || 0),

      ones: (db[key].ones || 0) + (statsDelta.ones || 0),
      twos: (db[key].twos || 0) + (statsDelta.twos || 0),
      threes: (db[key].threes || 0) + (statsDelta.threes || 0),
      dotBalls: (db[key].dotBalls || 0) + (statsDelta.dotBalls || 0),
      dotBallsBowled:
        (db[key].dotBallsBowled || 0) + (statsDelta.dotBallsBowled || 0),
      innings: (db[key].innings || 0) + (statsDelta.innings || 0),
      wides: (db[key].wides || 0) + (statsDelta.wides || 0),
      noBalls: (db[key].noBalls || 0) + (statsDelta.noBalls || 0),
      bowlingInnings:
        (db[key].bowlingInnings || 0) + (statsDelta.bowlingInnings || 0),
    };

    saveDB(db);
    setPlayersDB({ ...db });
  }, []);

  const updateFieldingStats = useCallback((jersey, wicketType) => {
    if (!jersey) return;
    const db = loadDB();
    const key = String(jersey);
    if (!db[key]) return;

    db[key] = {
      ...db[key],
      catches: (db[key].catches || 0) + (wicketType === "caught" ? 1 : 0),
      runouts: (db[key].runouts || 0) + (wicketType === "runout" ? 1 : 0),
      stumpings: (db[key].stumpings || 0) + (wicketType === "stumped" ? 1 : 0),
    };

    saveDB(db);
    setPlayersDB({ ...db });
  }, []);

  const renamePlayerInDB = useCallback((jersey, newName) => {
    const db = loadDB();
    const key = String(jersey);
    if (!db[key]) return false;

    db[key] = { ...db[key], name: newName.trim() };
    saveDB(db);
    setPlayersDB({ ...db });
    return true;
  }, []);

  const deletePlayer = useCallback((jersey) => {
    const db = loadDB();
    const key = String(jersey);
    if (!db[key]) return false;

    delete db[key];
    saveDB(db);
    setPlayersDB({ ...db });
    return true;
  }, []);

  const getAllPlayers = useCallback(() => {
    const db = loadDB();
    return Object.values(db).sort(
      (a, b) => Number(a.jersey) - Number(b.jersey)
    );
  }, []);

  const jerseyExists = useCallback((jersey) => {
    const db = loadDB();
    return !!db[String(jersey)];
  }, []);

  return {
    playersDB,
    getPlayer,
    searchPlayersByName, // ✅ NEW
    createOrGetPlayer,
    updatePlayerStats,
    updateFieldingStats,
    renamePlayerInDB,
    deletePlayer,
    getAllPlayers,
    jerseyExists,
  };
}

export default usePlayerDatabase;
