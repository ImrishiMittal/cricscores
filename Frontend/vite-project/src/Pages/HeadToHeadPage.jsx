import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import BrandTitle from "../Components/BrandTitle";
import { getTeams, getHeadToHead } from "../api/headToHeadApi";

export default function HeadToHeadPage() {
  const navigate = useNavigate();
  const [teams, setTeams] = useState([]);
  const [teamA, setTeamA] = useState("");
  const [teamB, setTeamB] = useState("");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [teamsLoading, setTeamsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    getTeams()
      .then((r) => setTeams(r.teams))
      .catch(console.error)
      .finally(() => setTeamsLoading(false));
  }, []);

  const handleSearch = async () => {
    if (!teamA || !teamB || teamA === teamB) return;
    setLoading(true);
    setData(null);
    setActiveTab("overview");
    try {
      const result = await getHeadToHead(teamA, teamB);
      setData(result);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const selStyle = {
    flex: 1,
    background: "#111827",
    border: "1px solid #374151",
    color: "#f9fafb",
    padding: "11px 10px",
    borderRadius: "8px",
    fontSize: "14px",
  };

  const statBox = (label, value, color = "#f9fafb") => (
    <div style={{ textAlign: "center" }}>
      <div style={{ fontSize: "22px", fontWeight: "800", color }}>{value ?? "—"}</div>
      <div style={{ fontSize: "11px", color: "#6b7280", marginTop: "2px" }}>{label}</div>
    </div>
  );

  const WinBar = () => {
    if (!data || data.played === 0) return null;
    const total = data.teamAWins + data.teamBWins + data.ties + data.noResults;
    const aW = total ? (data.teamAWins / total) * 100 : 0;
    const bW = total ? (data.teamBWins / total) * 100 : 0;
    return (
      <div style={{ marginTop: "12px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "#9ca3af", marginBottom: "4px" }}>
          <span>{data.teamA} ({data.teamAWins}W)</span>
          <span>({data.teamBWins}W) {data.teamB}</span>
        </div>
        <div style={{ display: "flex", height: "8px", borderRadius: "4px", overflow: "hidden", background: "#1f2937" }}>
          <div style={{ width: `${aW}%`, background: "#3b82f6" }} />
          {data.ties > 0 && <div style={{ width: `${(data.ties / total) * 100}%`, background: "#f59e0b" }} />}
          <div style={{ width: `${bW}%`, background: "#ef4444" }} />
        </div>
      </div>
    );
  };

  const ScoreCard = ({ label, scores, color }) => (
    <div style={{ background: "#111827", border: "1px solid #1f2937", borderRadius: "10px", padding: "12px 14px", flex: 1 }}>
      <div style={{ fontSize: "12px", fontWeight: "700", color, marginBottom: "10px" }}>{label}</div>
      <div style={{ display: "flex", justifyContent: "space-around" }}>
        {statBox("Avg", scores.average, "#f9fafb")}
        {statBox("High", scores.highest, "#4ade80")}
        {statBox("Low", scores.lowest, "#f87171")}
      </div>
    </div>
  );

  const LeaderTable = ({ rows, columns, emptyMsg }) => {
    if (!rows || rows.length === 0) {
      return <div style={{ color: "#6b7280", fontSize: "13px", textAlign: "center", padding: "24px" }}>{emptyMsg}</div>;
    }
    return (
      <div style={{ background: "#111827", border: "1px solid #1f2937", borderRadius: "12px", overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "360px" }}>
            <thead>
              <tr style={{ background: "#0f172a" }}>
                <th style={{ padding: "8px 10px", color: "#6b7280", fontSize: "11px", fontWeight: "600", textAlign: "left", paddingLeft: "14px", borderBottom: "1px solid #1f2937" }}>#</th>
                <th style={{ padding: "8px 10px", color: "#6b7280", fontSize: "11px", fontWeight: "600", textAlign: "left", borderBottom: "1px solid #1f2937" }}>Player</th>
                {columns.map((c) => (
                  <th key={c.key} style={{ padding: "8px 10px", color: "#6b7280", fontSize: "11px", fontWeight: "600", textAlign: "center", borderBottom: "1px solid #1f2937" }}>{c.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={row.jersey || row.playerName} style={{ background: i % 2 === 0 ? "#0d1117" : "#111827" }}>
                  <td style={{ padding: "9px 10px", paddingLeft: "14px", fontSize: "12px", color: i === 0 ? "#fbbf24" : "#6b7280", fontWeight: i === 0 ? "700" : "400", borderBottom: "1px solid #111827" }}>
                    {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : i + 1}
                  </td>
                  <td style={{ padding: "9px 10px", fontSize: "13px", fontWeight: "600", color: "#f9fafb", borderBottom: "1px solid #111827", maxWidth: "110px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {row.playerName}
                  </td>
                  {columns.map((c) => (
                    <td key={c.key} style={{ padding: "9px 10px", fontSize: "13px", textAlign: "center", color: c.highlight ? "#fbbf24" : "#e5e7eb", fontWeight: c.highlight ? "700" : "400", borderBottom: "1px solid #111827" }}>
                      {c.format ? c.format(row[c.key], row) : (row[c.key] ?? "—")}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0a", color: "#e5e7eb", padding: "20px 16px", paddingBottom: "40px" }}>
      <BrandTitle size="small" />

      <h2 style={{ fontSize: "20px", fontWeight: "700", color: "#f9fafb", margin: "10px 0 4px" }}>⚔️ Head-to-Head</h2>
      <p style={{ fontSize: "13px", color: "#6b7280", margin: "0 0 20px" }}>Compare any two teams across all matches</p>

      {/* Team Selector */}
      <div style={{ background: "#111827", border: "1px solid #1f2937", borderRadius: "12px", padding: "14px", marginBottom: "20px" }}>
        {teamsLoading ? (
          <div style={{ color: "#6b7280", fontSize: "13px", textAlign: "center" }}>Loading teams...</div>
        ) : teams.length < 2 ? (
          <div style={{ color: "#6b7280", fontSize: "13px", textAlign: "center" }}>Need at least 2 completed matches to use Head-to-Head.</div>
        ) : (
          <>
            <div style={{ display: "flex", gap: "8px", alignItems: "center", marginBottom: "12px" }}>
              <select value={teamA} onChange={(e) => setTeamA(e.target.value)} style={selStyle}>
                <option value="">Select Team A</option>
                {teams.filter((t) => t !== teamB).map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
              <span style={{ color: "#4b5563", fontWeight: "800", fontSize: "16px", flexShrink: 0 }}>VS</span>
              <select value={teamB} onChange={(e) => setTeamB(e.target.value)} style={selStyle}>
                <option value="">Select Team B</option>
                {teams.filter((t) => t !== teamA).map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <button
              onClick={handleSearch}
              disabled={!teamA || !teamB || loading}
              style={{
                width: "100%",
                background: !teamA || !teamB ? "#1f2937" : "#1e3a5f",
                border: `1px solid ${!teamA || !teamB ? "#374151" : "#2563eb"}`,
                color: !teamA || !teamB ? "#4b5563" : "#60a5fa",
                padding: "11px",
                borderRadius: "8px",
                fontWeight: "700",
                fontSize: "14px",
                cursor: !teamA || !teamB ? "not-allowed" : "pointer",
              }}
            >
              {loading ? "Loading..." : "🔍 Compare"}
            </button>
          </>
        )}
      </div>

      {/* Results */}
      {data && data.played === 0 && (
        <div style={{ textAlign: "center", color: "#6b7280", padding: "40px 0", fontSize: "14px" }}>
          No completed matches found between {data.teamA} and {data.teamB}.
        </div>
      )}

      {data && data.played > 0 && (
        <>
          {/* Header banner */}
          <div style={{ background: "linear-gradient(135deg, #0f172a, #1e1b4b)", border: "1px solid #312e81", borderRadius: "14px", padding: "18px 16px", marginBottom: "16px" }}>
            <div style={{ display: "flex", justifyContent: "space-around", alignItems: "center" }}>
              <div style={{ textAlign: "center", flex: 1 }}>
                <div style={{ fontSize: "16px", fontWeight: "800", color: "#3b82f6" }}>{data.teamA}</div>
                <div style={{ fontSize: "32px", fontWeight: "900", color: "#60a5fa", marginTop: "4px" }}>{data.teamAWins}</div>
                <div style={{ fontSize: "11px", color: "#6b7280" }}>WINS</div>
              </div>
              <div style={{ textAlign: "center", padding: "0 12px" }}>
                <div style={{ fontSize: "13px", color: "#9ca3af", fontWeight: "700" }}>{data.played} Played</div>
                {data.ties > 0 && <div style={{ fontSize: "12px", color: "#f59e0b", marginTop: "4px" }}>{data.ties} Tied</div>}
                {data.noResults > 0 && <div style={{ fontSize: "12px", color: "#6b7280", marginTop: "2px" }}>{data.noResults} NR</div>}
              </div>
              <div style={{ textAlign: "center", flex: 1 }}>
                <div style={{ fontSize: "16px", fontWeight: "800", color: "#ef4444" }}>{data.teamB}</div>
                <div style={{ fontSize: "32px", fontWeight: "900", color: "#f87171", marginTop: "4px" }}>{data.teamBWins}</div>
                <div style={{ fontSize: "11px", color: "#6b7280" }}>WINS</div>
              </div>
            </div>
            <WinBar />
          </div>

          {/* Sub-tabs */}
          <div style={{ display: "flex", gap: "6px", marginBottom: "16px" }}>
            {[["overview", "📊 Overview"], ["batting", "🏏 Batting"], ["bowling", "🎯 Bowling"], ["matches", "📋 Matches"]].map(([key, label]) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                style={{
                  flex: 1,
                  padding: "8px 4px",
                  borderRadius: "8px",
                  border: `1px solid ${activeTab === key ? "#2563eb" : "#1f2937"}`,
                  background: activeTab === key ? "#1e3a5f" : "#111827",
                  color: activeTab === key ? "#60a5fa" : "#6b7280",
                  fontWeight: "600",
                  fontSize: "11px",
                  cursor: "pointer",
                }}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Overview Tab */}
          {activeTab === "overview" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div style={{ display: "flex", gap: "10px" }}>
                <ScoreCard label={`🔵 ${data.teamA}`} scores={data.teamAScores} color="#60a5fa" />
                <ScoreCard label={`🔴 ${data.teamB}`} scores={data.teamBScores} color="#f87171" />
              </div>

              {/* Margins */}
              <div style={{ background: "#111827", border: "1px solid #1f2937", borderRadius: "12px", padding: "14px 16px" }}>
                <div style={{ fontSize: "13px", fontWeight: "700", color: "#9ca3af", marginBottom: "12px" }}>WIN MARGINS</div>
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {data.margins.biggestWinByRuns && (
                    <div>
                      <div style={{ fontSize: "11px", color: "#6b7280", marginBottom: "2px" }}>BIGGEST WIN BY RUNS</div>
                      <div style={{ fontSize: "14px", fontWeight: "700", color: "#4ade80" }}>{data.margins.biggestWinByRuns.winner}</div>
                      <div style={{ fontSize: "12px", color: "#9ca3af" }}>{data.margins.biggestWinByRuns.resultText}</div>
                    </div>
                  )}
                  {data.margins.biggestWinByWickets && (
                    <div>
                      <div style={{ fontSize: "11px", color: "#6b7280", marginBottom: "2px" }}>BIGGEST WIN BY WICKETS</div>
                      <div style={{ fontSize: "14px", fontWeight: "700", color: "#4ade80" }}>{data.margins.biggestWinByWickets.winner}</div>
                      <div style={{ fontSize: "12px", color: "#9ca3af" }}>{data.margins.biggestWinByWickets.resultText}</div>
                    </div>
                  )}
                  {data.margins.closestMatch && (
                    <div>
                      <div style={{ fontSize: "11px", color: "#6b7280", marginBottom: "2px" }}>CLOSEST MATCH</div>
                      <div style={{ fontSize: "14px", fontWeight: "700", color: "#f59e0b" }}>{data.margins.closestMatch.winner} won</div>
                      <div style={{ fontSize: "12px", color: "#9ca3af" }}>{data.margins.closestMatch.resultText}</div>
                    </div>
                  )}
                  {!data.margins.biggestWinByRuns && !data.margins.biggestWinByWickets && (
                    <div style={{ color: "#6b7280", fontSize: "13px" }}>No margin data available (manually entered results).</div>
                  )}
                </div>
              </div>

              {data.matchesWithPlayerData > 0 && (
                <div style={{ fontSize: "12px", color: "#6b7280", textAlign: "center" }}>
                  Player stats from {data.matchesWithPlayerData} scored match{data.matchesWithPlayerData !== 1 ? "es" : ""}
                </div>
              )}
            </div>
          )}

          {/* Batting Tab */}
          {activeTab === "batting" && (
            <div>
              {data.matchesWithPlayerData === 0 ? (
                <div style={{ color: "#6b7280", fontSize: "13px", textAlign: "center", padding: "40px 0" }}>
                  No scored matches — batting stats only available for matches scored through the app.
                </div>
              ) : (
                <LeaderTable
                  rows={data.batting.slice(0, 15)}
                  emptyMsg="No batting data"
                  columns={[
                    { key: "runs", label: "Runs", highlight: true },
                    { key: "innings", label: "Inn" },
                    { key: "highestScore", label: "HS" },
                    { key: "average", label: "Avg", format: (v) => v ?? "—" },
                    { key: "sr", label: "SR" },
                    { key: "sixes", label: "6s" },
                  ]}
                />
              )}
            </div>
          )}

          {/* Bowling Tab */}
          {activeTab === "bowling" && (
            <div>
              {data.matchesWithPlayerData === 0 ? (
                <div style={{ color: "#6b7280", fontSize: "13px", textAlign: "center", padding: "40px 0" }}>
                  No scored matches — bowling stats only available for matches scored through the app.
                </div>
              ) : (
                <LeaderTable
                  rows={data.bowling.slice(0, 15)}
                  emptyMsg="No bowling data"
                  columns={[
                    { key: "wickets", label: "Wkts", highlight: true },
                    { key: "overs", label: "Overs" },
                    { key: "economy", label: "Econ" },
                    { key: "bestFigures", label: "Best" },
                    { key: "average", label: "Avg", format: (v) => v ?? "—" },
                  ]}
                />
              )}
            </div>
          )}

          {/* Recent Matches Tab */}
          {activeTab === "matches" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {data.recentMatches.map((m, i) => {
                const aIsT1 = m.team1Name === data.teamA;
                const aRuns = aIsT1 ? m.team1Score : m.team2Score;
                const aWkts = aIsT1 ? m.team1Wickets : m.team2Wickets;
                const aBalls = aIsT1 ? m.team1Balls : m.team2Balls;
                const bRuns = aIsT1 ? m.team2Score : m.team1Score;
                const bWkts = aIsT1 ? m.team2Wickets : m.team1Wickets;
                const bBalls = aIsT1 ? m.team2Balls : m.team1Balls;
                const hasScores = aRuns != null && bRuns != null;
                return (
                  <div key={m.matchId || i} style={{ background: "#111827", border: "1px solid #1f2937", borderRadius: "10px", padding: "12px 14px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                      <span style={{ fontWeight: "700", color: m.winner === data.teamA ? "#60a5fa" : "#9ca3af", fontSize: "14px" }}>
                        {data.teamA}
                        {hasScores && <span style={{ fontSize: "12px", fontWeight: "600", color: "#e5e7eb", marginLeft: "6px" }}>{aRuns}/{aWkts} ({Math.floor(aBalls/6)}.{aBalls%6})</span>}
                      </span>
                      <span style={{ color: "#4b5563", fontWeight: "700", fontSize: "12px" }}>vs</span>
                      <span style={{ fontWeight: "700", color: m.winner === data.teamB ? "#f87171" : "#9ca3af", fontSize: "14px", textAlign: "right" }}>
                        {data.teamB}
                        {hasScores && <span style={{ fontSize: "12px", fontWeight: "600", color: "#e5e7eb", marginLeft: "6px" }}>{bRuns}/{bWkts} ({Math.floor(bBalls/6)}.{bBalls%6})</span>}
                      </span>
                    </div>
                    <div style={{ textAlign: "center", fontSize: "12px", color: "#fbbf24", fontWeight: "600" }}>
                      {m.resultText || (m.winner === "Tie" ? "🤝 Tied" : m.winner === "No Result" ? "🌧 No Result" : `${m.winner} won`)}
                    </div>
                    {m.date && (
                      <div style={{ textAlign: "center", fontSize: "11px", color: "#4b5563", marginTop: "4px" }}>
                        {new Date(m.date).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      <button
        onClick={() => navigate(-1)}
        style={{ marginTop: "28px", background: "transparent", border: "1px solid #374151", color: "#6b7280", padding: "10px", borderRadius: "8px", cursor: "pointer", fontSize: "14px", width: "100%" }}
      >
        ← Back
      </button>
    </div>
  );
}