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

  // ✅ Get player by jersey number
  const getPlayer = useCallback((jersey) => {
    const db = loadDB();
    return db[String(jersey)] || null;
  }, []);

  // ✅ Create or get existing player
  // Returns { player, isNew, isDuplicate }
  const createOrGetPlayer = useCallback((name, jersey) => {
    const db = loadDB();
    const key = String(jersey);

    if (db[key]) {
      // Jersey exists — return existing player
      return {
        player: { ...db[key], playerId: key, jersey: key },
        isNew: false,
        isDuplicate: true,
      };
    }

    // New player
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
    };

    const updatedDB = { ...db, [key]: newPlayer };
    saveDB(updatedDB);
    setPlayersDB(updatedDB);

    return { player: newPlayer, isNew: true, isDuplicate: false };
  }, []);

  // ✅ Update player stats after innings
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
    };

    saveDB(db);
    setPlayersDB({ ...db });
  }, []);

  // ✅ Rename player (name only, jersey/playerId never changes)
  const renamePlayerInDB = useCallback((jersey, newName) => {
    const db = loadDB();
    const key = String(jersey);
    if (!db[key]) return false;

    db[key] = { ...db[key], name: newName.trim() };
    saveDB(db);
    setPlayersDB({ ...db });
    return true;
  }, []);

  // ✅ Delete player — frees up jersey number
  const deletePlayer = useCallback((jersey) => {
    const db = loadDB();
    const key = String(jersey);
    if (!db[key]) return false;

    delete db[key];
    saveDB(db);
    setPlayersDB({ ...db });
    return true;
  }, []);

  // ✅ Get all players as array sorted by jersey number
  const getAllPlayers = useCallback(() => {
    const db = loadDB();
    return Object.values(db).sort(
      (a, b) => Number(a.jersey) - Number(b.jersey)
    );
  }, []);

  // ✅ Check if jersey exists
  const jerseyExists = useCallback((jersey) => {
    const db = loadDB();
    return !!db[String(jersey)];
  }, []);

  return {
    playersDB,
    getPlayer,
    createOrGetPlayer,
    updatePlayerStats,
    renamePlayerInDB,
    deletePlayer,
    getAllPlayers,
    jerseyExists,
  };
}

export default usePlayerDatabase;