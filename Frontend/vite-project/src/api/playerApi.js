// src/api/playerApi.js
// All requests include JWT token — mirrors the pattern in matchApi.js

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

function getHeaders() {
  const token = localStorage.getItem("cricket_token");
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

// ─── GET all players ──────────────────────────────────────────────────────────
export async function getAllPlayers() {
  const res = await fetch(`${API_BASE}/players`, { headers: getHeaders() });
  if (!res.ok) throw new Error("Failed to fetch players");
  return res.json();
}

// ─── GET single player by MongoDB _id ─────────────────────────────────────────
export async function getPlayer(id) {
  const res = await fetch(`${API_BASE}/players/${id}`, { headers: getHeaders() });
  if (!res.ok) throw new Error("Failed to fetch player");
  return res.json();
}

// ─── POST — create a new player ───────────────────────────────────────────────
export async function addPlayer(data) {
  const res = await fetch(`${API_BASE}/players`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Failed to create player");
  }
  return res.json();
}

// ─── POST /find-or-create — get by jersey, create if missing ─────────────────
export async function createOrFindByJersey(jersey, name) {
  const res = await fetch(`${API_BASE}/players/find-or-create`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({ jersey: String(jersey), name }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Failed to find or create player");
  }
  return res.json();
}

// ─── PATCH /:id — update name, jersey, role, etc. ────────────────────────────
export async function updatePlayer(id, data) {
  const res = await fetch(`${API_BASE}/players/${id}`, {
    method: "PATCH",
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Failed to update player");
  }
  return res.json();
}

// ─── PATCH /:id/stats — flush accumulated match stats ────────────────────────
export async function flushStats(id, stats) {
  const res = await fetch(`${API_BASE}/players/${id}/stats`, {
    method: "PATCH",
    headers: getHeaders(),
    body: JSON.stringify(stats),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Failed to flush player stats");
  }
  return res.json();
}

// ─── DELETE /:id — permanently remove a player ────────────────────────────────
export async function deletePlayer(id) {
  const res = await fetch(`${API_BASE}/players/${id}`, {
    method: "DELETE",
    headers: getHeaders(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Failed to delete player");
  }
  return res.json(); // { success: true, deletedId, name }
}
