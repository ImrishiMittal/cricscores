import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getPublicTournament } from "../api/tournamentApi";
import { generateScorecardPDF } from "../utils/generateScorecardPDF";

// ── Constants ─────────────────────────────────────────────────────────────────

const LIVE_REFRESH_INTERVAL = 30_000; // 30 seconds

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const STAGE_ORDER = [
  "quarterfinal",
  "semifinal",
  "qualifier1",
  "eliminator",
  "qualifier2",
  "final",
];
const STAGE_LABEL = {
  quarterfinal: "Quarter Finals",
  semifinal: "Semi Finals",
  qualifier1: "Qualifier 1",
  eliminator: "Eliminator",
  qualifier2: "Qualifier 2",
  final: "Final",
};
const SLOT_LABEL = {
  QF1: "QF 1",
  QF2: "QF 2",
  QF3: "QF 3",
  QF4: "QF 4",
  SF1: "SF 1",
  SF2: "SF 2",
  Q1: "Qualifier 1",
  EL: "Eliminator",
  Q2: "Qualifier 2",
  F: "Final",
};

const thStyle = {
  padding: "8px 10px",
  color: "#6b7280",
  fontSize: "12px",
  fontWeight: "600",
  textAlign: "center",
  borderBottom: "1px solid #1f2937",
};
const tdStyle = {
  padding: "10px",
  fontSize: "13px",
  textAlign: "center",
  borderBottom: "1px solid #111827",
};

// ── Public match fetch (no auth) ──────────────────────────────────────────────
// Fetches the scored match data for a fixture so spectators can download the PDF.
async function getPublicMatch(matchId) {
  const res = await fetch(`${API_BASE}/matches/${matchId}/public`);
  if (!res.ok) {
    // Fall back to the standard endpoint — some deployments expose it without auth
    const res2 = await fetch(`${API_BASE}/matches/${matchId}`);
    if (!res2.ok) throw new Error("Scorecard not available");
    return res2.json();
  }
  return res.json();
}

// ── Live indicator dot ────────────────────────────────────────────────────────
function LiveDot() {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}>
      <span
        style={{
          width: "7px",
          height: "7px",
          borderRadius: "50%",
          background: "#4ade80",
          boxShadow: "0 0 0 0 rgba(74,222,128,0.6)",
          animation: "livePulse 1.5s infinite",
          display: "inline-block",
          flexShrink: 0,
        }}
      />
      <style>{`
        @keyframes livePulse {
          0%   { box-shadow: 0 0 0 0 rgba(74,222,128,0.6); }
          70%  { box-shadow: 0 0 0 6px rgba(74,222,128,0); }
          100% { box-shadow: 0 0 0 0 rgba(74,222,128,0); }
        }
      `}</style>
    </span>
  );
}

// ── Countdown bar — shows time until next refresh ─────────────────────────────
function RefreshCountdown({ nextRefreshAt, onRefresh, refreshing }) {
  const [pct, setPct] = useState(100);
  const [secsLeft, setSecsLeft] = useState(LIVE_REFRESH_INTERVAL / 1000);

  useEffect(() => {
    const tick = () => {
      const remaining = Math.max(0, nextRefreshAt - Date.now());
      setPct((remaining / LIVE_REFRESH_INTERVAL) * 100);
      setSecsLeft(Math.ceil(remaining / 1000));
    };
    tick();
    const id = setInterval(tick, 500);
    return () => clearInterval(id);
  }, [nextRefreshAt]);

  return (
    <div style={{ marginBottom: "14px" }}>
      {/* Label row */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "5px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "7px",
            fontSize: "12px",
            color: "#6b7280",
          }}
        >
          <LiveDot />
          Live · refreshes in {secsLeft}s
        </div>
        <button
          onClick={onRefresh}
          disabled={refreshing}
          style={{
            background: "transparent",
            border: "1px solid #374151",
            color: refreshing ? "#4b5563" : "#9ca3af",
            padding: "4px 10px",
            borderRadius: "6px",
            fontSize: "11px",
            fontWeight: "600",
            cursor: refreshing ? "not-allowed" : "pointer",
          }}
        >
          {refreshing ? "⟳ Refreshing…" : "⟳ Refresh now"}
        </button>
      </div>
      {/* Progress bar */}
      <div
        style={{
          background: "#1f2937",
          borderRadius: "4px",
          height: "3px",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            background: "#16a34a",
            height: "100%",
            width: `${pct}%`,
            transition: "width 0.5s linear",
          }}
        />
      </div>
    </div>
  );
}

// ── Scorecard download button ─────────────────────────────────────────────────
function ScorecardButton({ matchId }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleDownload = async () => {
    setLoading(true);
    setError("");
    try {
      const match = await getPublicMatch(matchId);
      generateScorecardPDF(match);
    } catch (err) {
      setError("Scorecard not available");
      setTimeout(() => setError(""), 3000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ marginTop: "8px" }}>
      <button
        onClick={handleDownload}
        disabled={loading}
        style={{
          width: "100%",
          background: "#0d1117",
          border: "1px solid #374151",
          color: loading ? "#4b5563" : "#9ca3af",
          padding: "8px",
          borderRadius: "8px",
          fontSize: "12px",
          fontWeight: "600",
          cursor: loading ? "not-allowed" : "pointer",
        }}
      >
        {loading ? "⟳ Loading scorecard…" : "📄 Download Scorecard PDF"}
      </button>
      {error && (
        <div
          style={{
            fontSize: "11px",
            color: "#ef4444",
            textAlign: "center",
            marginTop: "4px",
          }}
        >
          {error}
        </div>
      )}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function PublicTournamentPage() {
  const { shareId } = useParams();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("points");
  const [copied, setCopied] = useState(false);
  const [nextRefreshAt, setNextRefreshAt] = useState(
    Date.now() + LIVE_REFRESH_INTERVAL
  );

  const intervalRef = useRef(null);

  // ── Fetch data ──────────────────────────────────────────────────────────────
  const fetchData = useCallback(
    async (silent = false) => {
      if (!silent) setLoading(true);
      else setRefreshing(true);
      try {
        const result = await getPublicTournament(shareId);
        setData(result);
        setError("");
      } catch (err) {
        if (!silent) setError(err.message);
      } finally {
        setLoading(false);
        setRefreshing(false);
        setNextRefreshAt(Date.now() + LIVE_REFRESH_INTERVAL);
      }
    },
    [shareId]
  );

  // Initial load
  useEffect(() => {
    fetchData(false);
  }, [fetchData]);

  // Auto-refresh every 30 s when the tab is visible
  useEffect(() => {
    const start = () => {
      intervalRef.current = setInterval(() => {
        if (!document.hidden) fetchData(true);
      }, LIVE_REFRESH_INTERVAL);
    };

    const handleVisibility = () => {
      if (document.hidden) {
        clearInterval(intervalRef.current);
      } else {
        fetchData(true);
        start();
      }
    };

    start();
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      clearInterval(intervalRef.current);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [fetchData]);

  const handleManualRefresh = () => {
    clearInterval(intervalRef.current);
    fetchData(true);
    intervalRef.current = setInterval(() => {
      if (!document.hidden) fetchData(true);
    }, LIVE_REFRESH_INTERVAL);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // ── Loading / error states ──────────────────────────────────────────────────
  if (loading)
    return (
      <div
        style={{
          background: "#0a0a0a",
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#6b7280",
        }}
      >
        Loading tournament…
      </div>
    );

  if (error)
    return (
      <div
        style={{
          background: "#0a0a0a",
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          color: "#ef4444",
          gap: "12px",
        }}
      >
        <div style={{ fontSize: "32px" }}>🔒</div>
        <div style={{ fontWeight: "700" }}>{error}</div>
        <div style={{ color: "#6b7280", fontSize: "13px" }}>
          This tournament may be private or the link may be invalid.
        </div>
      </div>
    );

  const { tournament, fixtures } = data;

  const leagueFixtures = fixtures.filter((f) => f.stage === "league");
  const knockoutFixtures = fixtures.filter((f) => f.stage !== "league");
  const completedFixtures = leagueFixtures.filter(
    (f) => f.status === "completed"
  );
  const upcomingFixtures = leagueFixtures.filter(
    (f) => f.status !== "completed"
  );

  // ── Determine if any match is live (started but not yet completed) ──────────
  // A fixture is "live" if it has a matchId and status is not "completed".
  const hasLiveMatch = fixtures.some(
    (f) => f.matchId && f.status !== "completed"
  );

  // ── Points table ────────────────────────────────────────────────────────────
  const sortedStandings = [...(tournament.standings || [])].sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.nrr !== a.nrr) return b.nrr - a.nrr;
    return a.teamName.localeCompare(b.teamName);
  });

  const hasKnockout =
    tournament.knockoutFormat && tournament.knockoutFormat !== "none";
  const byStage = {};
  knockoutFixtures.forEach((f) => {
    if (!byStage[f.stage]) byStage[f.stage] = [];
    byStage[f.stage].push(f);
  });
  const orderedStages = STAGE_ORDER.filter((s) => byStage[s]);

  const tabs = [
    ["points", "Points Table"],
    ["fixtures", `Fixtures (${upcomingFixtures.length})`],
    ["results", `Results (${completedFixtures.length})`],
    ...(hasKnockout && knockoutFixtures.length > 0
      ? [["bracket", "Bracket"]]
      : []),
  ];

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0a0a0a",
        color: "#e5e7eb",
        padding: "20px 16px",
        paddingBottom: "40px",
      }}
    >
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: "20px" }}>
        <div
          style={{
            fontSize: "13px",
            color: "#16a34a",
            fontWeight: "700",
            letterSpacing: "1px",
            marginBottom: "6px",
          }}
        >
          🏏 CRICSCORERS
        </div>
        <h1
          style={{
            fontSize: "22px",
            fontWeight: "800",
            color: "#f9fafb",
            margin: "0 0 4px",
          }}
        >
          {tournament.name}
        </h1>
        <div style={{ fontSize: "13px", color: "#6b7280" }}>
          {tournament.format === "Test"
            ? "Test Match"
            : `${tournament.overs} overs`}
          {" · "}
          {tournament.teams?.length} teams
          {tournament.status === "completed" && tournament.winner && (
            <span style={{ color: "#fbbf24", marginLeft: "6px" }}>
              · 🏆 {tournament.winner}
            </span>
          )}
        </div>
        {/* Live badge */}
        {hasLiveMatch && (
          <div
            style={{
              marginTop: "8px",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              background: "#14532d",
              border: "1px solid #16a34a",
              borderRadius: "20px",
              padding: "4px 12px",
              fontSize: "12px",
              color: "#4ade80",
              fontWeight: "700",
            }}
          >
            <LiveDot /> LIVE
          </div>
        )}
      </div>

      {/* Live refresh countdown — always shown so spectators know data is fresh */}
      <RefreshCountdown
        nextRefreshAt={nextRefreshAt}
        onRefresh={handleManualRefresh}
        refreshing={refreshing}
      />

      {/* Progress bar */}
      {leagueFixtures.length > 0 && (
        <>
          <div
            style={{
              background: "#1f2937",
              borderRadius: "8px",
              height: "6px",
              marginBottom: "4px",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                background: "#16a34a",
                height: "100%",
                width: `${
                  (completedFixtures.length / leagueFixtures.length) * 100
                }%`,
              }}
            />
          </div>
          <div
            style={{
              fontSize: "11px",
              color: "#6b7280",
              textAlign: "right",
              marginBottom: "16px",
            }}
          >
            {completedFixtures.length}/{leagueFixtures.length} matches done
          </div>
        </>
      )}

      {/* Share / copy button */}
      <button
        onClick={handleCopy}
        style={{
          width: "100%",
          marginBottom: "16px",
          background: "#0d1117",
          border: "1px solid #374151",
          color: copied ? "#4ade80" : "#9ca3af",
          padding: "9px",
          borderRadius: "8px",
          fontSize: "13px",
          fontWeight: "600",
          cursor: "pointer",
        }}
      >
        {copied ? "✅ Link copied!" : "🔗 Copy share link"}
      </button>

      {/* Tabs */}
      <div
        style={{
          display: "flex",
          gap: "6px",
          marginBottom: "18px",
          flexWrap: "wrap",
        }}
      >
        {tabs.map(([key, label]) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            style={{
              flex: 1,
              minWidth: "60px",
              padding: "9px 4px",
              borderRadius: "8px",
              border: `1px solid ${activeTab === key ? "#16a34a" : "#1f2937"}`,
              background: activeTab === key ? "#14532d" : "#111827",
              color: activeTab === key ? "#4ade80" : "#6b7280",
              fontWeight: "600",
              fontSize: "12px",
              cursor: "pointer",
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── Points Table ── */}
      {activeTab === "points" && (
        <div
          style={{
            background: "#111827",
            border: "1px solid #1f2937",
            borderRadius: "12px",
            overflow: "hidden",
          }}
        >
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#0f172a" }}>
                <th
                  style={{ ...thStyle, textAlign: "left", paddingLeft: "14px" }}
                >
                  Team
                </th>
                <th style={thStyle}>P</th>
                <th style={thStyle}>W</th>
                <th style={thStyle}>L</th>
                <th style={thStyle}>NR</th>
                <th style={{ ...thStyle, color: "#60a5fa" }}>NRR</th>
                <th style={{ ...thStyle, color: "#4ade80" }}>Pts</th>
              </tr>
            </thead>
            <tbody>
              {sortedStandings.map((s, i) => (
                <tr
                  key={s.teamName}
                  style={{ background: i % 2 === 0 ? "#0d1117" : "#111827" }}
                >
                  <td
                    style={{
                      ...tdStyle,
                      textAlign: "left",
                      paddingLeft: "14px",
                      fontWeight: "600",
                      color: "#f9fafb",
                    }}
                  >
                    {i === 0 && completedFixtures.length > 0 ? "🥇 " : ""}
                    {s.teamName}
                  </td>
                  <td style={tdStyle}>{s.played}</td>
                  <td style={{ ...tdStyle, color: "#4ade80" }}>{s.wins}</td>
                  <td style={{ ...tdStyle, color: "#f87171" }}>{s.losses}</td>
                  <td style={tdStyle}>{s.nr}</td>
                  <td
                    style={{
                      ...tdStyle,
                      color:
                        s.nrr > 0
                          ? "#4ade80"
                          : s.nrr < 0
                          ? "#f87171"
                          : "#9ca3af",
                      fontWeight: "600",
                    }}
                  >
                    {s.nrr > 0 ? "+" : ""}
                    {(s.nrr || 0).toFixed(3)}
                  </td>
                  <td
                    style={{
                      ...tdStyle,
                      fontWeight: "700",
                      color: "#4ade80",
                      fontSize: "15px",
                    }}
                  >
                    {s.points}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Upcoming Fixtures ── */}
      {activeTab === "fixtures" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {upcomingFixtures.length === 0 && (
            <p
              style={{
                color: "#6b7280",
                textAlign: "center",
                marginTop: "30px",
              }}
            >
              All matches completed!
            </p>
          )}
          {upcomingFixtures.map((f, i) => {
            const isLive = Boolean(f.matchId);
            return (
              <div
                key={f._id}
                style={{
                  background: "#111827",
                  border: `1px solid ${isLive ? "#16a34a" : "#1f2937"}`,
                  borderRadius: "10px",
                  padding: "14px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "6px",
                  }}
                >
                  <div style={{ fontSize: "12px", color: "#6b7280" }}>
                    Match {completedFixtures.length + i + 1}
                  </div>
                  {isLive && (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "5px",
                        fontSize: "11px",
                        color: "#4ade80",
                        fontWeight: "700",
                      }}
                    >
                      <LiveDot /> LIVE
                    </div>
                  )}
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <span
                    style={{
                      fontWeight: "700",
                      color: "#f9fafb",
                      fontSize: "15px",
                    }}
                  >
                    {f.teamA}
                  </span>
                  <span style={{ color: "#4b5563", fontWeight: "700" }}>
                    vs
                  </span>
                  <span
                    style={{
                      fontWeight: "700",
                      color: "#f9fafb",
                      fontSize: "15px",
                    }}
                  >
                    {f.teamB}
                  </span>
                </div>
                {/* Live score — shown when match has been scored but not yet completed */}
                {isLive && <LiveScoreStrip fixture={f} />}
                {!isLive && (
                  <div
                    style={{
                      textAlign: "center",
                      fontSize: "11px",
                      color: "#6b7280",
                      marginTop: "6px",
                    }}
                  >
                    Scheduled
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── Results ── */}
      {activeTab === "results" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {completedFixtures.length === 0 && (
            <p
              style={{
                color: "#6b7280",
                textAlign: "center",
                marginTop: "30px",
              }}
            >
              No results yet.
            </p>
          )}
          {completedFixtures.map((f, i) => (
            <div
              key={f._id}
              style={{
                background: "#111827",
                border: "1px solid #1f2937",
                borderRadius: "10px",
                padding: "12px 14px",
              }}
            >
              <div
                style={{
                  fontSize: "12px",
                  color: "#6b7280",
                  marginBottom: "4px",
                }}
              >
                Match {i + 1}
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span
                  style={{
                    fontWeight: "600",
                    color: f.winner === f.teamA ? "#4ade80" : "#9ca3af",
                  }}
                >
                  {f.teamA}
                </span>
                <span style={{ color: "#4b5563" }}>vs</span>
                <span
                  style={{
                    fontWeight: "600",
                    color: f.winner === f.teamB ? "#4ade80" : "#9ca3af",
                  }}
                >
                  {f.teamB}
                </span>
              </div>
              {f.winner && (
                <div
                  style={{
                    textAlign: "center",
                    fontSize: "12px",
                    color: "#60a5fa",
                    marginTop: "6px",
                    fontWeight: "600",
                  }}
                >
                  {f.winner === "Tie"
                    ? "🤝 Match Tied"
                    : f.winner === "No Result"
                    ? "🌧 No Result"
                    : `🏆 ${f.winner} won`}
                </div>
              )}
              {f.resultText && (
                <div
                  style={{
                    textAlign: "center",
                    fontSize: "11px",
                    color: "#6b7280",
                    marginTop: "3px",
                  }}
                >
                  {f.resultText}
                </div>
              )}
              {/* Scorecard PDF download — only if match was scored through the app */}
              {f.matchId && <ScorecardButton matchId={f.matchId} />}
            </div>
          ))}
        </div>
      )}

      {/* ── Bracket ── */}
      {activeTab === "bracket" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {tournament.status === "completed" && tournament.winner && (
            <div
              style={{
                padding: "12px 16px",
                borderRadius: "10px",
                background: "#14532d",
                border: "1px solid #16a34a",
                fontSize: "15px",
                fontWeight: "700",
                color: "#4ade80",
                textAlign: "center",
              }}
            >
              🥇 {tournament.winner} — Tournament Champions
            </div>
          )}
          {orderedStages.map((stage) => (
            <div key={stage}>
              <div
                style={{
                  fontSize: "11px",
                  fontWeight: "700",
                  color: "#4ade80",
                  letterSpacing: "1px",
                  textTransform: "uppercase",
                  marginBottom: "10px",
                  paddingBottom: "6px",
                  borderBottom: "1px solid #1f2937",
                }}
              >
                {STAGE_LABEL[stage]}
              </div>
              <div
                style={{
                  display: "flex",
                  gap: "10px",
                  overflowX: "auto",
                  paddingBottom: "4px",
                }}
              >
                {byStage[stage].map((f) => {
                  const done = f.status === "completed";
                  return (
                    <div
                      key={f._id}
                      style={{
                        background: "#0d1117",
                        borderRadius: "8px",
                        overflow: "hidden",
                        border: `1px solid ${done ? "#1f2937" : "#374151"}`,
                        minWidth: "190px",
                        flexShrink: 0,
                      }}
                    >
                      <div
                        style={{
                          padding: "4px 10px",
                          background: "#1f2937",
                          fontSize: "10px",
                          color: "#6b7280",
                          fontWeight: "700",
                        }}
                      >
                        {SLOT_LABEL[f.knockoutSlot] || f.knockoutSlot}
                      </div>
                      {[
                        ["teamA", "teamARuns", "teamAWickets", "teamABalls"],
                        ["teamB", "teamBRuns", "teamBWickets", "teamBBalls"],
                      ].map(([teamKey, runsKey, wkKey, ballsKey]) => {
                        const name = f[teamKey];
                        const isWinner = done && f.winner === name;
                        const isTbd = !name;
                        return (
                          <div key={teamKey}>
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                padding: "7px 10px",
                                borderRadius: "4px",
                                background: isWinner
                                  ? "#14532d"
                                  : "transparent",
                              }}
                            >
                              <span
                                style={{
                                  fontSize: "13px",
                                  fontWeight: isWinner ? "700" : "500",
                                  color: isTbd
                                    ? "#6b7280"
                                    : isWinner
                                    ? "#4ade80"
                                    : "#e5e7eb",
                                  fontStyle: isTbd ? "italic" : "normal",
                                }}
                              >
                                {isTbd ? "TBD" : name}
                              </span>
                              {done && !isTbd && (
                                <span
                                  style={{
                                    fontSize: "13px",
                                    fontWeight: "700",
                                    color: isWinner ? "#4ade80" : "#9ca3af",
                                  }}
                                >
                                  {f[runsKey]}/{f[wkKey]}
                                  <span
                                    style={{
                                      fontSize: "11px",
                                      fontWeight: "400",
                                      color: "#6b7280",
                                      marginLeft: "3px",
                                    }}
                                  >
                                    ({Math.floor(f[ballsKey] / 6)}.
                                    {f[ballsKey] % 6})
                                  </span>
                                </span>
                              )}
                            </div>
                            {teamKey === "teamA" && (
                              <div
                                style={{
                                  height: "1px",
                                  background: "#1f2937",
                                  margin: "2px 0",
                                }}
                              />
                            )}
                          </div>
                        );
                      })}
                      <div
                        style={{
                          padding: "4px 10px",
                          borderTop: "1px solid #1f2937",
                          fontSize: "10px",
                          color: done ? "#9ca3af" : "#6b7280",
                          fontStyle: !f.teamA || !f.teamB ? "italic" : "normal",
                        }}
                      >
                        {done
                          ? f.resultText || `${f.winner} won`
                          : !f.teamA || !f.teamB
                          ? "Awaiting teams"
                          : "Scheduled"}
                      </div>
                      {/* Scorecard download in bracket view */}
                      {done && f.matchId && (
                        <div
                          style={{
                            padding: "6px 8px",
                            borderTop: "1px solid #1f2937",
                          }}
                        >
                          <ScorecardButton matchId={f.matchId} />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Footer */}
      <div
        style={{
          marginTop: "40px",
          textAlign: "center",
          fontSize: "12px",
          color: "#374151",
        }}
      >
        Powered by{" "}
        <span style={{ color: "#16a34a", fontWeight: "700" }}>CricScorers</span>
        {" · "}
        <span
          style={{ cursor: "pointer", color: "#4b5563" }}
          onClick={() => navigate("/")}
        >
          cricscorers.in
        </span>
      </div>
    </div>
  );
}

// ── LiveScoreStrip — shows current score for in-progress matches ──────────────
// This reads from the fixture fields that your backend already populates
// when a match is being scored (teamARuns, teamAWickets, etc.).
// ── Live match data fetcher ───────────────────────────────────────────────────
function useLiveMatch(matchId) {
  const [liveData, setLiveData] = useState(null);
  const [loading, setLoading] = useState(false);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (!matchId) {
      setLiveData(null);
      return;
    }

    const fetch = async () => {
      try {
        const res = await getPublicMatch(matchId);
        setLiveData(res);
      } catch {
        // silently ignore — fixture score is the fallback
      } finally {
        setLoading(false);
      }
    };

    setLoading(true);
    fetch();
    intervalRef.current = setInterval(fetch, 15_000); // poll every 15s
    return () => clearInterval(intervalRef.current);
  }, [matchId]);

  return { liveData, loading };
}

// ── LiveScoreStrip — full ball-by-ball live view ──────────────────────────────
function LiveScoreStrip({ fixture: f }) {
    const { liveData } = useLiveMatch(f.matchId);
  
    // ── Full live view from Match document (only available after match ends) ──
    if (liveData) {
      const m = liveData;
      const currentOver = m.currentOver || [];
      const overs = m.overs ?? 0;
      const balls = m.balls ?? 0;
      const score = m.score ?? m.team2Score ?? 0;
      const wickets = m.wickets ?? m.team2Wickets ?? 0;
      const innings = m.innings ?? 1;
  
      const ballSymbol = (ball) => {
        if (!ball) return null;
        if (ball.type === "wide") return <span style={{ color: "#f59e0b" }}>Wd</span>;
        if (ball.type === "noball") return <span style={{ color: "#f59e0b" }}>Nb</span>;
        if (ball.type === "wicket") return <span style={{ color: "#ef4444", fontWeight: "700" }}>W</span>;
        if (ball.runs === 4) return <span style={{ color: "#60a5fa", fontWeight: "700" }}>4</span>;
        if (ball.runs === 6) return <span style={{ color: "#4ade80", fontWeight: "700" }}>6</span>;
        if (ball.runs === 0) return <span style={{ color: "#6b7280" }}>·</span>;
        return <span style={{ color: "#e5e7eb" }}>{ball.runs}</span>;
      };
  
      return (
        <div style={{ marginTop: "10px", background: "#0d1117", borderRadius: "8px", padding: "10px 12px", border: "1px solid #1f2937" }}>
          {m.team1Score !== undefined && (
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
              <span style={{ fontSize: "12px", color: "#6b7280", fontWeight: "600" }}>{m.team1Name}</span>
              <span style={{ fontSize: "13px", color: "#9ca3af", fontWeight: "700" }}>
                {m.team1Score}/{m.team1Wickets}
                <span style={{ fontSize: "10px", color: "#6b7280", marginLeft: "3px" }}>
                  ({Math.floor((m.team1Balls || 0) / 6)}.{(m.team1Balls || 0) % 6})
                </span>
              </span>
            </div>
          )}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "13px", color: "#f9fafb", fontWeight: "700" }}>
              {innings === 1 ? m.team1Name : m.team2Name}
            </span>
            <span style={{ fontSize: "15px", color: "#4ade80", fontWeight: "800" }}>
              {score}/{wickets}
              <span style={{ fontSize: "11px", color: "#6b7280", fontWeight: "400", marginLeft: "4px" }}>
                ({overs}.{balls})
              </span>
            </span>
          </div>
          {currentOver.length > 0 && (
            <div style={{ marginTop: "8px", display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
              <span style={{ fontSize: "10px", color: "#6b7280" }}>This over:</span>
              <div style={{ display: "flex", gap: "4px" }}>
                {currentOver.map((ball, i) => (
                  <div key={i} style={{ width: "22px", height: "22px", borderRadius: "50%", background: "#1f2937", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: "700" }}>
                    {ballSymbol(ball)}
                  </div>
                ))}
              </div>
            </div>
          )}
          {m.target && innings === 2 && (
            <div style={{ marginTop: "6px", fontSize: "11px", color: "#f59e0b", textAlign: "right" }}>
              Target: {m.target} · Need {Math.max(0, m.target - score)} from{" "}
              {parseInt(m.totalOvers || 20) * 6 - (overs * 6 + balls)} balls
            </div>
          )}
        </div>
      );
    }
  
    // ── Fallback: use fixture fields ──────────────────────────────────────────────
  const battingFirst = f.battingFirst;

  if (!battingFirst) {
    const hasAnyScore = f.teamARuns != null || f.teamBRuns != null;
    if (!hasAnyScore) {
      return (
        <div style={{ marginTop: "8px", textAlign: "center", fontSize: "11px", color: "#6b7280", padding: "6px 0" }}>
          ⏳ Match in progress…
        </div>
      );
    }
    const teamName = f.teamARuns != null ? f.teamA : f.teamB;
    const runs = f.teamARuns ?? f.teamBRuns ?? 0;
    const wkts = f.teamARuns != null ? (f.teamAWickets ?? 0) : (f.teamBWickets ?? 0);
    const balls = f.teamARuns != null ? (f.teamABalls ?? 0) : (f.teamBBalls ?? 0);
    return (
      <div style={{ marginTop: "10px", background: "#0d1117", borderRadius: "8px", padding: "10px 12px", border: "1px solid #1f2937" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: "13px", color: "#f9fafb", fontWeight: "700" }}>{teamName}</span>
          <span style={{ fontSize: "15px", color: "#4ade80", fontWeight: "800" }}>
            {runs}/{wkts}
            <span style={{ fontSize: "11px", color: "#6b7280", fontWeight: "400", marginLeft: "4px" }}>
              ({Math.floor(balls / 6)}.{balls % 6})
            </span>
          </span>
        </div>
      </div>
    );
  }

  const inn1IsTeamA = battingFirst === f.teamA;
  const inn1Team    = inn1IsTeamA ? f.teamA : f.teamB;
  const inn2Team    = inn1IsTeamA ? f.teamB : f.teamA;
  const inn1Runs    = inn1IsTeamA ? f.teamARuns    : f.teamBRuns;
  const inn1Wickets = inn1IsTeamA ? f.teamAWickets : f.teamBWickets;
  const inn1Balls   = inn1IsTeamA ? f.teamABalls   : f.teamBBalls;
  const inn2Runs    = inn1IsTeamA ? f.teamBRuns    : f.teamARuns;
  const inn2Wickets = inn1IsTeamA ? f.teamBWickets : f.teamAWickets;
  const inn2Balls   = inn1IsTeamA ? f.teamBBalls   : f.teamABalls;

  const hasInn1 = inn1Runs != null;
  const hasInn2 = inn2Runs != null;

  if (!hasInn1 && !hasInn2) {
    return (
      <div style={{ marginTop: "8px", textAlign: "center", fontSize: "11px", color: "#6b7280", padding: "6px 0" }}>
        ⏳ Match in progress…
      </div>
    );
  }

  return (
    <div style={{ marginTop: "10px", background: "#0d1117", borderRadius: "8px", padding: "10px 12px", border: "1px solid #1f2937" }}>
      {hasInn1 && (
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          marginBottom: hasInn2 ? "6px" : 0,
          opacity: hasInn2 ? 0.7 : 1,
        }}>
          <span style={{ fontSize: hasInn2 ? "12px" : "13px", color: hasInn2 ? "#6b7280" : "#9ca3af", fontWeight: "600" }}>
            {inn1Team}
          </span>
          <span style={{ fontSize: hasInn2 ? "13px" : "14px", color: hasInn2 ? "#9ca3af" : "#f9fafb", fontWeight: "700" }}>
            {inn1Runs}/{inn1Wickets ?? 0}
            <span style={{ fontSize: "11px", color: "#6b7280", marginLeft: "4px" }}>
              ({Math.floor((inn1Balls || 0) / 6)}.{(inn1Balls || 0) % 6})
            </span>
          </span>
        </div>
      )}
      {hasInn2 && (
        <>
          {hasInn1 && (
            <div style={{ fontSize: "10px", color: "#f59e0b", textAlign: "right", marginBottom: "4px" }}>
              Target: {(inn1Runs ?? 0) + 1} · Need {Math.max(0, (inn1Runs ?? 0) + 1 - (inn2Runs ?? 0))} runs
            </div>
          )}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "13px", color: "#f9fafb", fontWeight: "700" }}>{inn2Team}</span>
            <span style={{ fontSize: "15px", color: "#4ade80", fontWeight: "800" }}>
              {inn2Runs}/{inn2Wickets ?? 0}
              <span style={{ fontSize: "11px", color: "#6b7280", fontWeight: "400", marginLeft: "4px" }}>
                ({Math.floor((inn2Balls || 0) / 6)}.{(inn2Balls || 0) % 6})
              </span>
            </span>
          </div>
        </>
      )}
    </div>
  );
}