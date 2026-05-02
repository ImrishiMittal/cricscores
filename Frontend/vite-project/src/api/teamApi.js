const BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

function headers() {
  const token = localStorage.getItem("cricket_token"); // ← was "token"
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

// Remove the extra /api from all fetch calls:

export async function getTeams() {
  console.log("🌐 hitting:", `${BASE}/teams`);
  const res = await fetch(`${BASE}/teams`, { headers: headers() });
  if (!res.ok) {
    const body = await res.text();
    console.error("❌ getTeams status:", res.status, "body:", body);
    throw new Error("Failed to fetch teams");
  }
  return res.json();
}

export async function ensureTeam(name) {
  const res = await fetch(`${BASE}/teams`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({ name }),
  });
  if (!res.ok) {
    const errBody = await res.text();
    console.error("ensureTeam failed:", res.status, errBody);
    throw new Error("Failed to create team");
  }
  return res.json();
}

export async function updateTeamStats(teamId, stats) {
  const res = await fetch(`${BASE}/teams/${teamId}`, {
    method: "PATCH",
    headers: headers(),
    body: JSON.stringify(stats),
  });
  if (!res.ok) throw new Error("Failed to update team stats");
  return res.json();
}