// src/api/squadApi.js
// All squad-related API calls — every request sends the JWT token

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

function getHeaders() {
  const token = localStorage.getItem("cricket_token");
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

// ─── Fetch squads, optionally filtered ─────────────────────────────────────────
// getSquads()                                  -> all squads for this user
// getSquads({ teamName })                       -> all squads for one team
// getSquads({ teamName, tournamentId })         -> exact squad for a team in a tournament
// getSquads({ teamName, tournamentId: null })   -> that team's default (non-tournament) squad
export async function getSquads({ teamName, tournamentId } = {}) {
  const params = new URLSearchParams();
  if (teamName) params.set("teamName", teamName);
  if (tournamentId !== undefined) {
    params.set("tournamentId", tournamentId === null ? "null" : tournamentId);
  }

  const query = params.toString();
  const res = await fetch(`${API_BASE}/squads${query ? `?${query}` : ""}`, {
    headers: getHeaders(),
  });

  if (res.status === 401) {
    localStorage.removeItem("cricket_token");
    window.location.href = "/login";
    return;
  }

  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || "Failed to fetch squads");
  }

  return res.json();
}

// ─── Fetch a single squad by id ─────────────────────────────────────────────────
export async function getSquad(squadId) {
  const res = await fetch(`${API_BASE}/squads/${squadId}`, {
    headers: getHeaders(),
  });

  if (res.status === 401) {
    localStorage.removeItem("cricket_token");
    window.location.href = "/login";
    return;
  }

  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || "Failed to fetch squad");
  }

  return res.json();
}

// ─── Create a squad ─────────────────────────────────────────────────────────────
// squadData shape:
// {
//   teamName: "Team A",
//   tournamentId: null,  // or a tournament _id
//   players: [{ jersey: "7", name: "Rishi", role: "batsman" }, ...]
// }
export async function createSquad(squadData) {
  const res = await fetch(`${API_BASE}/squads`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(squadData),
  });

  if (res.status === 401) {
    localStorage.removeItem("cricket_token");
    window.location.href = "/login";
    return;
  }

  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || "Failed to create squad");
  }

  return res.json();
}

// ─── Update a squad ──────────────────────────────────────────────────────────────
export async function updateSquad(squadId, updates) {
  const res = await fetch(`${API_BASE}/squads/${squadId}`, {
    method: "PATCH",
    headers: getHeaders(),
    body: JSON.stringify(updates),
  });

  if (res.status === 401) {
    localStorage.removeItem("cricket_token");
    window.location.href = "/login";
    return;
  }

  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || "Failed to update squad");
  }

  return res.json();
}

// ─── Delete a squad ──────────────────────────────────────────────────────────────
export async function deleteSquad(squadId) {
  const res = await fetch(`${API_BASE}/squads/${squadId}`, {
    method: "DELETE",
    headers: getHeaders(),
  });

  if (res.status === 401) {
    localStorage.removeItem("cricket_token");
    window.location.href = "/login";
    return;
  }

  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || "Failed to delete squad");
  }

  return res.json();
}

// ─── Convenience helper used by MatchSetupPage ──────────────────────────────────
// Tries to find the best matching squad for a team when entering a tournament
// match: prefers a squad scoped to this specific tournament, falls back to the
// team's default (non-tournament) squad if none exists.
// Returns the squad object, or null if no squad is saved for this team at all.
export async function findSquadForTournamentTeam(teamName, tournamentId) {
  if (!teamName) return null;

  try {
    const tournamentSquads = await getSquads({ teamName, tournamentId });
    if (tournamentSquads && tournamentSquads.length > 0) {
      return tournamentSquads[0];
    }
  } catch (e) {
    // fall through to default squad lookup
  }

  try {
    const defaultSquads = await getSquads({ teamName, tournamentId: null });
    if (defaultSquads && defaultSquads.length > 0) {
      return defaultSquads[0];
    }
  } catch (e) {
    // no squad saved for this team — caller treats this as "nothing to prefill"
  }

  return null;
}