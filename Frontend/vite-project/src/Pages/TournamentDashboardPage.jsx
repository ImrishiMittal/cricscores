import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import * as tournamentApi from "../api/tournamentApi";
import BrandTitle from "../Components/BrandTitle";

export default function TournamentDashboardPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [tournament, setTournament] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("fixtures");

  useEffect(() => {
    tournamentApi.getTournament(id)
      .then(setTournament)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  const refresh = () => {
    tournamentApi.getTournament(id).then(setTournament);
  };

  const handleStartMatch = (fixture) => {
    // Build matchData payload matching your ScoringPage format
    const [teamA, teamB] = fixture.teams;
    navigate("/setup", {
      state: {
        fromTournament: true,
        tournamentId: id,
        fixtureId: fixture._id,
        prefillTeamA: teamA,
        prefillTeamB: teamB,
        format: tournament.format,
        overs: tournament.overs,
        matchDays: tournament.matchDays,
        oversPerDay: tournament.oversPerDay,
      }
    });
  };

  const handleMarkResult = async (fixtureId, winner) => {
    await tournamentApi.updateFixtureResult(id, fixtureId, { winner, status: "completed" });
    refresh();
  };

  if (loading) return <div style={{ background: "#0a0a0a", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: "#6b7280" }}>Loading...</div>;
  if (!tournament) return <div style={{ background: "#0a0a0a", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: "#ef4444" }}>Tournament not found.</div>;

  // Build points table
  const pointsMap = {};
  (tournament.teams || []).forEach(team => {
    pointsMap[team] = { team, p: 0, w: 0, l: 0, t: 0, nr: 0, pts: 0 };
  });
  (tournament.fixtures || []).forEach(f => {
    if (f.status !== "completed") return;
    const [a, b] = f.teams;
    if (!pointsMap[a]) pointsMap[a] = { team: a, p: 0, w: 0, l: 0, t: 0, nr: 0, pts: 0 };
    if (!pointsMap[b]) pointsMap[b] = { team: b, p: 0, w: 0, l: 0, t: 0, nr: 0, pts: 0 };
    pointsMap[a].p++; pointsMap[b].p++;
    if (f.winner === "TIE") {
      pointsMap[a].t++; pointsMap[a].pts += tournament.pointsRules?.tie ?? 1;
      pointsMap[b].t++; pointsMap[b].pts += tournament.pointsRules?.tie ?? 1;
    } else if (f.winner === "NO RESULT") {
      pointsMap[a].nr++; pointsMap[a].pts += tournament.pointsRules?.nr ?? 1;
      pointsMap[b].nr++; pointsMap[b].pts += tournament.pointsRules?.nr ?? 1;
    } else {
      const loser = f.winner === a ? b : a;
      pointsMap[f.winner].w++; pointsMap[f.winner].pts += tournament.pointsRules?.win ?? 2;
      pointsMap[loser].l++;
    }
  });
  const pointsTable = Object.values(pointsMap).sort((a, b) => b.pts - a.pts || b.w - a.w);

  const upcoming = (tournament.fixtures || []).filter(f => f.status !== "completed");
  const completed = (tournament.fixtures || []).filter(f => f.status === "completed");
  const total = tournament.fixtures?.length || 0;
  const doneCount = completed.length;

  const thStyle = { padding: "8px 10px", color: "#6b7280", fontSize: "12px", fontWeight: "600", textAlign: "center", borderBottom: "1px solid #1f2937" };
  const tdStyle = { padding: "10px", fontSize: "13px", textAlign: "center", borderBottom: "1px solid #111827" };

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0a", color: "#e5e7eb", padding: "20px 16px", paddingBottom: "40px" }}>
      <BrandTitle size="small" />

      {/* Header */}
      <div style={{ marginTop: "10px", marginBottom: "16px" }}>
        <h2 style={{ fontSize: "20px", fontWeight: "700", color: "#f9fafb", margin: "0 0 4px" }}>{tournament.name}</h2>
        <div style={{ fontSize: "13px", color: "#6b7280" }}>
          {tournament.format === "test" ? "Test Match" : `${tournament.overs} overs`} · {tournament.teams?.length} teams
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ background: "#1f2937", borderRadius: "8px", height: "8px", marginBottom: "6px", overflow: "hidden" }}>
        <div style={{ background: "#16a34a", height: "100%", width: `${total ? (doneCount / total) * 100 : 0}%`, transition: "width 0.4s" }} />
      </div>
      <div style={{ fontSize: "12px", color: "#6b7280", textAlign: "right", marginBottom: "18px" }}>{doneCount}/{total} matches done</div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "18px" }}>
        {[["fixtures", "📋 Fixtures"], ["points", "📊 Points Table"], ["done", `✅ Results (${doneCount})`]].map(([key, label]) => (
          <button key={key} onClick={() => setActiveTab(key)} style={{
            flex: 1, padding: "9px 4px", borderRadius: "8px", border: `1px solid ${activeTab === key ? "#16a34a" : "#1f2937"}`,
            background: activeTab === key ? "#14532d" : "#111827",
            color: activeTab === key ? "#4ade80" : "#6b7280",
            fontWeight: "600", fontSize: "12px", cursor: "pointer"
          }}>
            {label}
          </button>
        ))}
      </div>

      {/* Fixtures Tab */}
      {activeTab === "fixtures" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {upcoming.length === 0 && <p style={{ color: "#6b7280", textAlign: "center", marginTop: "30px" }}>All matches completed!</p>}
          {upcoming.map((f, i) => (
            <div key={f._id} style={{ background: "#111827", border: "1px solid #1f2937", borderRadius: "12px", padding: "14px" }}>
              <div style={{ fontSize: "12px", color: "#6b7280", marginBottom: "8px" }}>Match {completed.length + i + 1}</div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                <span style={{ fontWeight: "700", color: "#f9fafb", fontSize: "15px" }}>{f.teams[0]}</span>
                <span style={{ color: "#4b5563", fontWeight: "700" }}>vs</span>
                <span style={{ fontWeight: "700", color: "#f9fafb", fontSize: "15px" }}>{f.teams[1]}</span>
              </div>
              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  onClick={() => handleStartMatch(f)}
                  style={{ flex: 1, background: "#1e3a5f", color: "#60a5fa", padding: "9px", borderRadius: "8px", border: "1px solid #2563eb", fontWeight: "600", fontSize: "13px", cursor: "pointer" }}
                >
                  🏏 Start Match
                </button>
                <button
                  onClick={() => {
                    const winner = prompt(`Enter winner:\n1. ${f.teams[0]}\n2. ${f.teams[1]}\n3. TIE\n4. NO RESULT`);
                    if (!winner) return;
                    const w = winner.trim() === "1" ? f.teams[0] : winner.trim() === "2" ? f.teams[1] : winner.trim() === "3" ? "TIE" : winner.trim() === "4" ? "NO RESULT" : winner.trim();
                    handleMarkResult(f._id, w);
                  }}
                  style={{ flex: 1, background: "#1a1a1a", color: "#9ca3af", padding: "9px", borderRadius: "8px", border: "1px solid #374151", fontWeight: "600", fontSize: "13px", cursor: "pointer" }}
                >
                  ✏️ Enter Result
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Points Table Tab */}
      {activeTab === "points" && (
        <div style={{ background: "#111827", border: "1px solid #1f2937", borderRadius: "12px", overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#0f172a" }}>
                <th style={{ ...thStyle, textAlign: "left", paddingLeft: "14px" }}>Team</th>
                <th style={thStyle}>P</th>
                <th style={thStyle}>W</th>
                <th style={thStyle}>L</th>
                <th style={thStyle}>T</th>
                <th style={thStyle}>NR</th>
                <th style={{ ...thStyle, color: "#4ade80" }}>Pts</th>
              </tr>
            </thead>
            <tbody>
              {pointsTable.map((row, i) => (
                <tr key={row.team} style={{ background: i % 2 === 0 ? "#0d1117" : "#111827" }}>
                  <td style={{ ...tdStyle, textAlign: "left", paddingLeft: "14px", fontWeight: "600", color: "#f9fafb" }}>
                    {i === 0 && doneCount > 0 ? "🥇 " : ""}{row.team}
                  </td>
                  <td style={tdStyle}>{row.p}</td>
                  <td style={{ ...tdStyle, color: "#4ade80" }}>{row.w}</td>
                  <td style={{ ...tdStyle, color: "#f87171" }}>{row.l}</td>
                  <td style={tdStyle}>{row.t}</td>
                  <td style={tdStyle}>{row.nr}</td>
                  <td style={{ ...tdStyle, fontWeight: "700", color: "#4ade80", fontSize: "15px" }}>{row.pts}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Results Tab */}
      {activeTab === "done" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {completed.length === 0 && <p style={{ color: "#6b7280", textAlign: "center", marginTop: "30px" }}>No completed matches yet.</p>}
          {completed.map((f, i) => (
            <div key={f._id} style={{ background: "#111827", border: "1px solid #1f2937", borderRadius: "10px", padding: "12px 14px" }}>
              <div style={{ fontSize: "12px", color: "#6b7280", marginBottom: "4px" }}>Match {i + 1}</div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontWeight: "600", color: f.winner === f.teams[0] ? "#4ade80" : "#9ca3af" }}>{f.teams[0]}</span>
                <span style={{ color: "#4b5563" }}>vs</span>
                <span style={{ fontWeight: "600", color: f.winner === f.teams[1] ? "#4ade80" : "#9ca3af" }}>{f.teams[1]}</span>
              </div>
              <div style={{ textAlign: "center", fontSize: "12px", color: "#60a5fa", marginTop: "6px", fontWeight: "600" }}>
                {f.winner === "TIE" ? "🤝 Match Tied" : f.winner === "NO RESULT" ? "🌧 No Result" : `🏆 ${f.winner} won`}
              </div>
            </div>
          ))}
        </div>
      )}

      <button onClick={() => navigate("/tournaments")} style={{ marginTop: "28px", background: "transparent", border: "1px solid #374151", color: "#6b7280", padding: "10px", borderRadius: "8px", cursor: "pointer", fontSize: "14px", width: "100%" }}>
        ← Back to Tournaments
      </button>
    </div>
  );
}