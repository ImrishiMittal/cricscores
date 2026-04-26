// src/api/playerApi.js
import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api`
  : "http://localhost:5000/api";

const authHeader = () => ({
  headers: {
    Authorization: `Bearer ${localStorage.getItem("cricket_token")}`,
  },
});

// ── Get all players ───────────────────────────────────────────────────────────
export const getAllPlayers = async () => {
  const res = await axios.get(`${BASE_URL}/players`, authHeader());
  return res.data;
};

// ── Get single player ─────────────────────────────────────────────────────────
export const getPlayer = async (id) => {
  const res = await axios.get(`${BASE_URL}/players/${id}`, authHeader());
  return res.data;
};

// ── Add a player ──────────────────────────────────────────────────────────────
export const addPlayer = async (playerData) => {
  // playerData: { name, jersey, country?, role? }
  const res = await axios.post(`${BASE_URL}/players`, playerData, authHeader());
  return res.data;
};

// ── Update player profile (name, jersey, country, role) ───────────────────────
export const updatePlayer = async (id, updates) => {
  const res = await axios.put(`${BASE_URL}/players/${id}`, updates, authHeader());
  return res.data;
};

// ── Flush accumulated match stats to MongoDB ──────────────────────────────────
// Called once at end of match by updateMatchMilestones().
// buf contains all the incremental stats accumulated during the match.
export const flushStats = async (id, buf) => {
  const res = await axios.patch(`${BASE_URL}/players/${id}/stats`, buf, authHeader());
  return res.data;
};

// ── Delete a player ───────────────────────────────────────────────────────────
export const deletePlayer = async (id) => {
  const res = await axios.delete(`${BASE_URL}/players/${id}`, authHeader());
  return res.data;
};

export async function createOrFindByJersey(jersey, name) {
  try {
    const res = await axios.get(
      `${BASE_URL}/players/jersey/${String(jersey)}`,
      authHeader()
    );
    return res.data;
  } catch (err) {
    // 404 means not found — create them
    if (err.response?.status === 404) {
      return await addPlayer({
        jersey: String(jersey),
        name: name || `Player ${jersey}`,
      });
    }
    console.error("createOrFindByJersey failed:", err);
    return null;
  }
}