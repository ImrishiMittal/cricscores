// src/api/matchApi.js
// All match-related API calls — every request sends the JWT token

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

function getHeaders() {
    const token = localStorage.getItem("cricket_token");
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

// ─── Fetch all matches for logged-in user ─────────────────────────────────────
export async function getMatches() {
  const res = await fetch(`${API_BASE}/matches`, {
    headers: getHeaders(),
  });

  if (res.status === 401) {
    // Token expired — force logout
    localStorage.removeItem("cricket_token");
    window.location.href = "/login";
    return;
  }

  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || "Failed to fetch matches");
  }

  return res.json();
}

// ─── Fetch single match ───────────────────────────────────────────────────────
export async function getMatch(matchId) {
  const res = await fetch(`${API_BASE}/matches/${matchId}`, {
    headers: getHeaders(),
  });

  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || "Failed to fetch match");
  }

  return res.json();
}

// ─── Save a completed match ───────────────────────────────────────────────────
// matchData shape:
// {
//   overs: 10,
//   team1Name: "Team A", team2Name: "Team B",
//   team1Score: 120, team1Wickets: 5, team1Overs: 10,
//   team2Score: 115, team2Wickets: 8, team2Overs: 10,
//   winner: "Team A",
//   resultText: "Team A won by 5 runs",
//   venue: "Home ground",
//   team1Batting: [...], team2Batting: [...],
//   team1Bowling: [...], team2Bowling: [...],
// }
export async function saveMatch(matchData) {
  const res = await fetch(`${API_BASE}/matches`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(matchData),
  });

  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || "Failed to save match");
  }

  return res.json();
}

// ─── Delete a match ───────────────────────────────────────────────────────────
export async function deleteMatch(matchId) {
  const res = await fetch(`${API_BASE}/matches/${matchId}`, {
    method: "DELETE",
    headers: getHeaders(),
  });

  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || "Failed to delete match");
  }

  return res.json();
}
