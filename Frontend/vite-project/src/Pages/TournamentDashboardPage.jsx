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
  const [generating, setGenerating] = useState(false);
  const [fixtureMode, setFixtureMode] = useState("auto"); // "auto" | "manual"
  const [manualTeamA, setManualTeamA] = useState("");
  const [manualTeamB, setManualTeamB] = useState("");
  const [manualPairs, setManualPairs] = useState([]);
  const [manualError, setManualError] = useState("");
  const [savingManual, setSavingManual] = useState(false);

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
    const teamA = fixture.teamA;
    const teamB = fixture.teamB;
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

  const handleGenerateFixtures = async () => {
    setGenerating(true);
    try {
      await tournamentApi.generateFixtures(id);
      refresh();
    } catch (err) {
      console.error(err);
    } finally {
      setGenerating(false);
    }
  };

  const handleAddManualPair = () => {
    if (!manualTeamA || !manualTeamB) {
      setManualError("Select both teams.");
      return;
    }
    if (manualTeamA === manualTeamB) {
      setManualError("A team can't play itself.");
      return;
    }
    const alreadyAdded = manualPairs.some(
      p => (p.teamA === manualTeamA && p.teamB === manualTeamB) ||
           (p.teamA === manualTeamB && p.teamB === manualTeamA)
    );
    if (alreadyAdded) {
      setManualError("That matchup is already in the list.");
      return;
    }
    setManualError("");
    setManualPairs(prev => [...prev, { teamA: manualTeamA, teamB: manualTeamB }]);
    setManualTeamA("");
    setManualTeamB("");
  };

  const handleRemoveManualPair = (idx) => {
    setManualPairs(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSaveManualFixtures = async () => {
    setSavingManual(true);
    setManualError("");
    try {
      await tournamentApi.createManualFixtures(id, manualPairs);
      setManualPairs([]);
      refresh();
    } catch (err) {
      setManualError(err.message || "Failed to save fixtures");
    } finally {
      setSavingManual(false);
    }
  };

  // Checklist: every team must appear the same number of times.
  const manualCounts = {};
  (tournament?.teams || []).forEach(t => { manualCounts[t] = 0; });
  manualPairs.forEach(p => {
    manualCounts[p.teamA] = (manualCounts[p.teamA] || 0) + 1;
    manualCounts[p.teamB] = (manualCounts[p.teamB] || 0) + 1;
  });
  const manualCountValues = Object.values(manualCounts);
  const manualIsBalanced = manualPairs.length > 0 && manualCountValues.every(c => c === manualCountValues[0]);

  if (loading) return <div style={{ background: "#0a0a0a", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: "#6b7280" }}>Loading...</div>;
  if (!tournament) return <div style={{ background: "#0a0a0a", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: "#ef4444" }}>Tournament not found.</div>;

  // Points table: use the standings the backend already computed and returned
  // on the tournament document (it also handles NRR, which we don't duplicate here).
  const pointsTable = (tournament.standings || [])
    .map(s => ({
      team: s.teamName,
      p: s.played,
      w: s.wins,
      l: s.losses,
      t: s.ties,
      nr: s.nr,
      pts: s.points,
    }))
    .sort((a, b) => b.pts - a.pts || b.w - a.w);

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
          {tournament.format === "Test" ? "Test Match" : `${tournament.overs} overs`} · {tournament.teams?.length} teams
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
          {total === 0 && (
            <div style={{ marginTop: "10px" }}>
              <div style={{ display: "flex", gap: "8px", marginBottom: "18px" }}>
                {[["auto", "⚡ Auto-Generate"], ["manual", "✍️ Manual Setup"]].map(([key, label]) => (
                  <button key={key} onClick={() => setFixtureMode(key)} style={{
                    flex: 1, padding: "9px 4px", borderRadius: "8px", border: `1px solid ${fixtureMode === key ? "#16a34a" : "#1f2937"}`,
                    background: fixtureMode === key ? "#14532d" : "#111827",
                    color: fixtureMode === key ? "#4ade80" : "#6b7280",
                    fontWeight: "600", fontSize: "12px", cursor: "pointer"
                  }}>
                    {label}
                  </button>
                ))}
              </div>

              {fixtureMode === "auto" && (
                <div style={{ textAlign: "center", marginTop: "20px" }}>
                  <p style={{ color: "#6b7280", marginBottom: "16px" }}>No fixtures yet. Generate the round-robin schedule to get started.</p>
                  <button
                    onClick={handleGenerateFixtures}
                    disabled={generating}
                    style={{ background: generating ? "#374151" : "#16a34a", color: "#fff", padding: "12px 20px", borderRadius: "8px", border: "none", fontWeight: "700", fontSize: "14px", cursor: generating ? "not-allowed" : "pointer" }}
                  >
                    {generating ? "Generating..." : "📋 Generate Fixtures"}
                  </button>
                </div>
              )}

              {fixtureMode === "manual" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                  <p style={{ color: "#6b7280", fontSize: "13px", margin: 0 }}>Pick a matchup and add it to the schedule. Every team needs the same number of matches before you can save.</p>

                  <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                    <select
                      value={manualTeamA}
                      onChange={e => setManualTeamA(e.target.value)}
                      style={{ flex: 1, background: "#111827", border: "1px solid #374151", color: "#f9fafb", padding: "10px", borderRadius: "8px", fontSize: "13px" }}
                    >
                      <option value="">Team A</option>
                      {(tournament.teams || []).map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                    <span style={{ color: "#4b5563", fontWeight: "700" }}>vs</span>
                    <select
                      value={manualTeamB}
                      onChange={e => setManualTeamB(e.target.value)}
                      style={{ flex: 1, background: "#111827", border: "1px solid #374151", color: "#f9fafb", padding: "10px", borderRadius: "8px", fontSize: "13px" }}
                    >
                      <option value="">Team B</option>
                      {(tournament.teams || []).map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                    <button onClick={handleAddManualPair} style={{ background: "#1e3a5f", color: "#60a5fa", padding: "10px 14px", borderRadius: "8px", border: "1px solid #2563eb", fontWeight: "700", fontSize: "13px", cursor: "pointer" }}>
                      + Add
                    </button>
                  </div>

                  {manualError && <p style={{ color: "#ef4444", fontSize: "13px", margin: 0, textAlign: "center" }}>{manualError}</p>}

                  {manualPairs.length > 0 && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      {manualPairs.map((p, i) => (
                        <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#111827", border: "1px solid #1f2937", borderRadius: "8px", padding: "10px 12px" }}>
                          <span style={{ fontSize: "13px", color: "#e5e7eb" }}>{p.teamA} <span style={{ color: "#4b5563" }}>vs</span> {p.teamB}</span>
                          <button onClick={() => handleRemoveManualPair(i)} style={{ background: "transparent", border: "none", color: "#ef4444", cursor: "pointer", fontSize: "13px" }}>✕</button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Balance checklist */}
                  <div style={{ background: "#111827", border: "1px solid #1f2937", borderRadius: "10px", padding: "14px" }}>
                    <div style={{ fontSize: "13px", color: "#9ca3af", marginBottom: "10px", fontWeight: "600" }}>Checklist</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginBottom: "10px" }}>
                      {(tournament.teams || []).map(t => (
                        <div key={t} style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "#9ca3af" }}>
                          <span>{t}</span>
                          <span>{manualCounts[t] || 0} match{(manualCounts[t] || 0) === 1 ? "" : "es"}</span>
                        </div>
                      ))}
                    </div>
                    <div style={{ fontSize: "13px", fontWeight: "600", color: manualIsBalanced ? "#4ade80" : "#f87171" }}>
                      {manualPairs.length === 0
                        ? "Add at least one matchup to begin."
                        : manualIsBalanced
                          ? "✅ All teams have an equal number of matches."
                          : "⚠️ Uneven schedule — every team must play the same number of matches."}
                    </div>
                  </div>

                  <button
                    onClick={handleSaveManualFixtures}
                    disabled={!manualIsBalanced || savingManual}
                    style={{ background: (!manualIsBalanced || savingManual) ? "#374151" : "#16a34a", color: "#fff", padding: "12px", borderRadius: "8px", border: "none", fontWeight: "700", fontSize: "14px", cursor: (!manualIsBalanced || savingManual) ? "not-allowed" : "pointer" }}
                  >
                    {savingManual ? "Saving..." : "✍️ Save Fixtures"}
                  </button>
                </div>
              )}
            </div>
          )}
          {total > 0 && upcoming.length === 0 && <p style={{ color: "#6b7280", textAlign: "center", marginTop: "30px" }}>All matches completed!</p>}
          {upcoming.map((f, i) => (
            <div key={f._id} style={{ background: "#111827", border: "1px solid #1f2937", borderRadius: "12px", padding: "14px" }}>
              <div style={{ fontSize: "12px", color: "#6b7280", marginBottom: "8px" }}>Match {completed.length + i + 1}</div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                <span style={{ fontWeight: "700", color: "#f9fafb", fontSize: "15px" }}>{f.teamA}</span>
                <span style={{ color: "#4b5563", fontWeight: "700" }}>vs</span>
                <span style={{ fontWeight: "700", color: "#f9fafb", fontSize: "15px" }}>{f.teamB}</span>
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
                    const winner = prompt(`Enter winner:\n1. ${f.teamA}\n2. ${f.teamB}\n3. TIE\n4. NO RESULT`);
                    if (!winner) return;
                    const w = winner.trim() === "1" ? f.teamA : winner.trim() === "2" ? f.teamB : winner.trim() === "3" ? "Tie" : winner.trim() === "4" ? "No Result" : winner.trim();
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
                <span style={{ fontWeight: "600", color: f.winner === f.teamA ? "#4ade80" : "#9ca3af" }}>{f.teamA}</span>
                <span style={{ color: "#4b5563" }}>vs</span>
                <span style={{ fontWeight: "600", color: f.winner === f.teamB ? "#4ade80" : "#9ca3af" }}>{f.teamB}</span>
              </div>
              <div style={{ textAlign: "center", fontSize: "12px", color: "#60a5fa", marginTop: "6px", fontWeight: "600" }}>
                {f.winner === "Tie" ? "🤝 Match Tied" : f.winner === "No Result" ? "🌧 No Result" : `🏆 ${f.winner} won`}
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
