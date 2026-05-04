// src/api/teamApi.js

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

function getHeaders() {
  const token = localStorage.getItem("cricket_token");
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

// ─── GET all teams ────────────────────────────────────────────────────────────
export async function getTeams() {
  const res = await fetch(`${API_BASE}/teams`, { headers: getHeaders() });
  if (!res.ok) throw new Error("Failed to fetch teams");
  return res.json();
}

// ─── POST — ensure team exists (upsert by name) ───────────────────────────────
export async function ensureTeam(name) {
  const res = await fetch(`${API_BASE}/teams`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({ name }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Failed to ensure team");
  }
  return res.json();
}

// ─── PATCH /:id — increment team stats ───────────────────────────────────────
export async function updateTeamStats(teamId, stats) {
  const res = await fetch(`${API_BASE}/teams/${teamId}`, {
    method: "PATCH",
    headers: getHeaders(),
    body: JSON.stringify(stats),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Failed to update team stats");
  }
  return res.json();
}

// ─── DELETE /:id — permanently remove a team ─────────────────────────────────
export async function deleteTeam(teamId) {
  const res = await fetch(`${API_BASE}/teams/${teamId}`, {
    method: "DELETE",
    headers: getHeaders(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Failed to delete team");
  }
  return res.json();
}
