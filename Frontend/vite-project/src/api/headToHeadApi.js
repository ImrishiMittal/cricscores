const BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

const headers = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${localStorage.getItem("cricket_token")}`,
});

export async function getTeams() {
  const res = await fetch(`${BASE}/api/head-to-head/teams`, { headers: headers() });
  if (!res.ok) throw new Error("Failed to fetch teams");
  return res.json(); // { teams: [...] }
}

export async function getHeadToHead(teamA, teamB) {
  const url = `${BASE}/api/head-to-head?teamA=${encodeURIComponent(teamA)}&teamB=${encodeURIComponent(teamB)}`;
  const res = await fetch(url, { headers: headers() });
  if (!res.ok) throw new Error("Failed to fetch head-to-head data");
  return res.json();
}