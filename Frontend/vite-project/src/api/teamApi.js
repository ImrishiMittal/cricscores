const BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

function headers() {
  const token = localStorage.getItem("cricket_token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

// Returns all teams for the logged-in user
export async function getTeams() {
  const res = await fetch(`${BASE}/api/teams`, { headers: headers() });
  if (!res.ok) throw new Error("Failed to fetch teams");
  return res.json();
}

// Ensures a team document exists, returns it
export async function ensureTeam(name) {
  const res = await fetch(`${BASE}/api/teams`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({ name }),
  });
  if (!res.ok) {
    const errBody = await res.text();
    console.error("ensureTeam failed:", res.status, errBody); // ← ADD THIS
    throw new Error("Failed to create team");
  }
  return res.json();
}

// Increments stats for a team by its MongoDB _id
export async function updateTeamStats(teamId, stats) {
  const res = await fetch(`${BASE}/api/teams/${teamId}`, {
    method: "PATCH",
    headers: headers(),
    body: JSON.stringify(stats),
  });
  if (!res.ok) throw new Error("Failed to update team stats");
  return res.json();
}