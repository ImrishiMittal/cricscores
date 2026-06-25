// src/api/tournamentApi.js
// All tournament-related API calls — every request sends the JWT token

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

function getHeaders() {
  const token = localStorage.getItem("cricket_token");
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

// ─── Fetch all tournaments for logged-in user ──────────────────────────────────
export async function getTournaments() {
  const res = await fetch(`${API_BASE}/tournaments`, {
    headers: getHeaders(),
  });

  if (res.status === 401) {
    localStorage.removeItem("cricket_token");
    window.location.href = "/login";
    return;
  }

  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || "Failed to fetch tournaments");
  }

  return res.json();
}

// ─── Fetch single tournament (includes its fixtures) ───────────────────────────
export async function getTournament(tournamentId) {
  const res = await fetch(`${API_BASE}/tournaments/${tournamentId}`, {
    headers: getHeaders(),
  });

  if (res.status === 401) {
    localStorage.removeItem("cricket_token");
    window.location.href = "/login";
    return;
  }

  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || "Failed to fetch tournament");
  }

  const tournament = await res.json();
  const fixtures = await getFixtures(tournamentId);
  return { ...tournament, fixtures };
}

// ─── Create a tournament ───────────────────────────────────────────────────────
// tournamentData shape:
// {
//   name: "Summer League 2026",
//   format: "Limited Overs",      // or "Test"
//   overs: 20,                    // set when format is "Limited Overs"
//   days: null,                   // set when format is "Test"
//   teams: ["Team A", "Team B", "Team C", "Team D"],
//   roundRobinType: "single",     // or "double"
//   pointsRules: { win: 2, loss: 0, tie: 1, noResult: 1 },  // optional
// }
export async function createTournament(tournamentData) {
  const res = await fetch(`${API_BASE}/tournaments`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(tournamentData),
  });

  if (res.status === 401) {
    localStorage.removeItem("cricket_token");
    window.location.href = "/login";
    return;
  }

  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || "Failed to create tournament");
  }

  return res.json();
}

// ─── Delete a tournament ────────────────────────────────────────────────────────
export async function deleteTournament(tournamentId) {
  const res = await fetch(`${API_BASE}/tournaments/${tournamentId}`, {
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
    throw new Error(data.error || "Failed to delete tournament");
  }

  return res.json();
}

// ─── Generate fixtures for a tournament (round robin) ──────────────────────────
// Pass force = true to regenerate and wipe any existing fixtures.
export async function generateFixtures(tournamentId, force = false) {
  const url = `${API_BASE}/tournaments/${tournamentId}/fixtures${force ? "?force=true" : ""}`;
  const res = await fetch(url, {
    method: "POST",
    headers: getHeaders(),
  });

  if (res.status === 401) {
    localStorage.removeItem("cricket_token");
    window.location.href = "/login";
    return;
  }

  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || "Failed to generate fixtures");
  }

  return res.json();
}

// ─── Create fixtures manually (user-defined matchups) ───────────────────────────
// pairs shape: [{ teamA: "Team A", teamB: "Team B" }, ...]
// Every team must appear the same number of times across all pairs — the
// backend enforces this too, but the UI should already validate it before
// calling this so the user gets immediate feedback.
// Pass force = true to wipe any existing fixtures and replace them.
export async function createManualFixtures(tournamentId, pairs, force = false) {
  const res = await fetch(`${API_BASE}/tournaments/${tournamentId}/fixtures/manual`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({ pairs, force }),
  });

  if (res.status === 401) {
    localStorage.removeItem("cricket_token");
    window.location.href = "/login";
    return;
  }

  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || "Failed to create manual fixtures");
  }

  return res.json();
}

// ─── Fetch fixtures for a tournament ────────────────────────────────────────────
export async function getFixtures(tournamentId) {
  const res = await fetch(`${API_BASE}/tournaments/${tournamentId}/fixtures`, {
    headers: getHeaders(),
  });

  if (res.status === 401) {
    localStorage.removeItem("cricket_token");
    window.location.href = "/login";
    return;
  }

  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || "Failed to fetch fixtures");
  }

  return res.json();
}

// ─── Update a fixture's result ──────────────────────────────────────────────────
// resultData shape:
// {
//   matchId: "abc123",
//   winner: "Team A",           // teamA name, teamB name, "Tie", or "No Result"
//   resultText: "Team A won by 5 runs",
//   teamARuns: 180, teamAWickets: 6, teamABalls: 120,
//   teamBRuns: 150, teamBWickets: 8, teamBBalls: 120,
//   status: "completed",
// }
export async function updateFixtureResult(tournamentId, fixtureId, resultData) {
  const res = await fetch(
    `${API_BASE}/tournaments/${tournamentId}/fixtures/${fixtureId}`,
    {
      method: "PATCH",
      headers: getHeaders(),
      body: JSON.stringify(resultData),
    }
  );

  if (res.status === 401) {
    localStorage.removeItem("cricket_token");
    window.location.href = "/login";
    return;
  }

  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || "Failed to update fixture");
  }

  return res.json();
}
// ─── Generate knockout bracket from current standings ──────────────────────────
export async function generateKnockout(tournamentId, force = false) {
  const url = `${API_BASE}/tournaments/${tournamentId}/knockout/generate${force ? "?force=true" : ""}`;
  const res = await fetch(url, {
    method: "POST",
    headers: getHeaders(),
  });

  if (res.status === 401) {
    localStorage.removeItem("cricket_token");
    window.location.href = "/login";
    return;
  }

  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || "Failed to generate knockout bracket");
  }

  return res.json();
}

// ─── Fetch knockout fixtures grouped by stage ───────────────────────────────────
export async function getKnockout(tournamentId) {
  const res = await fetch(`${API_BASE}/tournaments/${tournamentId}/knockout`, {
    headers: getHeaders(),
  });

  if (res.status === 401) {
    localStorage.removeItem("cricket_token");
    window.location.href = "/login";
    return;
  }

  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || "Failed to fetch knockout data");
  }

  return res.json();
}


export async function getTournamentAwards(tournamentId) {
  const res = await fetch(`${API_BASE}/tournaments/${tournamentId}/awards`, {
    headers: getHeaders(),
  });
 
  if (res.status === 401) {
    localStorage.removeItem("cricket_token");
    window.location.href = "/login";
    return;
  }
 
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || "Failed to fetch awards");
  }
 
  return res.json();
}

// ─── Share a tournament (toggle visibility) ───────────────────────────────────
export async function shareTournament(tournamentId, visibility) {
  const token = localStorage.getItem("cricket_token");
  const res = await fetch(`${API_BASE}/tournaments/${tournamentId}/share`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ visibility }),
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || "Failed to update sharing settings");
  }
  return res.json(); // { shareId, visibility, shareUrl }
}

// ─── Fetch a public tournament by shareId (no auth) ───────────────────────────
export async function getPublicTournament(shareId) {
  const res = await fetch(`${API_BASE}/tournaments/public/${shareId}`);
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || "Tournament not found");
  }
  return res.json(); // { tournament, fixtures }
}