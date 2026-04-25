import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getMatches } from "../api/matchApi";
import styles from "./LandingPage.module.css";

// ── helpers ──────────────────────────────────────────────────────────────────
function fmtOvers(balls) {
  if (balls === undefined || balls === null) return "-";
  const ov = Math.floor(balls / 6);
  const b  = balls % 6;
  return b === 0 ? `${ov}.0` : `${ov}.${b}`;
}

function fmtDate(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleString("en-IN", {
    day: "numeric", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function calcEcon(runs, balls) {
  if (!balls) return "-";
  return ((runs / balls) * 6).toFixed(2);
}

function calcSR(runs, balls) {
  if (!balls) return "-";
  return ((runs / balls) * 100).toFixed(1);
}

// ── match card ────────────────────────────────────────────────────────────────
function MatchCard({ match, onClick }) {
  const t1 = match.team1Name || match.team1 || "Team A";
  const t2 = match.team2Name || match.team2 || "Team B";
  const s1 = `${match.team1Score ?? "-"}/${match.team1Wickets ?? "-"}`;
  const s2 = `${match.team2Score ?? "-"}/${match.team2Wickets ?? "-"}`;
  const ov1 = match.team1Balls != null ? `(${fmtOvers(match.team1Balls)})` : "";
  const ov2 = match.team2Balls != null ? `(${fmtOvers(match.team2Balls)})` : "";
  const result = match.resultText || match.result || "Result pending";

  return (
    <div
      onClick={onClick}
      style={{
        background: "rgba(255,255,255,0.05)",
        border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: 14,
        padding: "16px 20px",
        marginBottom: 12,
        cursor: "pointer",
        transition: "background 0.2s",
      }}
      onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.09)"}
      onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.05)"}
    >
      {/* Teams + scores */}
      <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 10 }}>
        <TeamRow name={t1} score={s1} overs={ov1} />
        <TeamRow name={t2} score={s2} overs={ov2} />
      </div>

      {/* Divider */}
      <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)", marginBottom: 10 }} />

      {/* Result + date */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 4 }}>
        <p style={{ margin: 0, color: "#FFD700", fontWeight: 600, fontSize: 13 }}>
          {result}
        </p>
        <p style={{ margin: 0, color: "#666", fontSize: 12 }}>
          {fmtDate(match.createdAt)}
        </p>
      </div>
    </div>
  );
}

function TeamRow({ name, score, overs }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
      <p style={{ margin: 0, color: "#fff", fontWeight: 600, fontSize: 15, flex: 1 }}>{name}</p>
      <p style={{ margin: 0, color: "#4CAF50", fontWeight: 700, fontSize: 15 }}>
        {score} <span style={{ color: "#888", fontWeight: 400, fontSize: 12 }}>{overs}</span>
      </p>
    </div>
  );
}

// ── scorecard detail ──────────────────────────────────────────────────────────
function MatchDetail({ match, onBack }) {
  const [tab, setTab] = useState("scorecard"); // scorecard | info
  const t1 = match.team1Name || match.team1 || "Team A";
  const t2 = match.team2Name || match.team2 || "Team B";
  const result = match.resultText || match.result || "Result pending";

  const tabs = [
    { id: "scorecard", label: "Scorecard" },
    { id: "info",      label: "Match Info" },
  ];

  return (
    <div>
      {/* Back */}
      <button
        onClick={onBack}
        style={{ background: "none", border: "none", color: "#aaa", fontSize: 14, cursor: "pointer", marginBottom: 16, display: "flex", alignItems: "center", gap: 6 }}
      >
        ← Back to list
      </button>

      {/* Title */}
      <h2 style={{ color: "#fff", margin: "0 0 4px", fontSize: 20 }}>{t1} vs {t2}</h2>
      <p style={{ color: "#aaa", margin: "0 0 16px", fontSize: 13 }}>{fmtDate(match.createdAt)}</p>

      {/* Score summary cards */}
      <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
        <ScoreCard team={t1} score={match.team1Score} wickets={match.team1Wickets} balls={match.team1Balls} />
        <ScoreCard team={t2} score={match.team2Score} wickets={match.team2Wickets} balls={match.team2Balls} />
      </div>

      {/* Result banner */}
      <div style={{
        background: "rgba(76,175,80,0.12)", border: "1px solid #4CAF50",
        borderRadius: 10, padding: "12px 18px", marginBottom: 20,
      }}>
        <p style={{ color: "#4CAF50", margin: 0, fontWeight: 600, fontSize: 14 }}>{result}</p>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            background: tab === t.id ? "rgba(76,175,80,0.18)" : "rgba(255,255,255,0.05)",
            border: `1px solid ${tab === t.id ? "#4CAF50" : "rgba(255,255,255,0.12)"}`,
            color: tab === t.id ? "#4CAF50" : "#aaa",
            borderRadius: 8, padding: "7px 16px", cursor: "pointer", fontSize: 13, fontWeight: 600,
          }}>{t.label}</button>
        ))}
      </div>

      {tab === "scorecard" && <ScorecardTab match={match} t1={t1} t2={t2} />}
      {tab === "info"      && <InfoTab match={match} t1={t1} t2={t2} result={result} />}
    </div>
  );
}

function ScoreCard({ team, score, wickets, balls }) {
  return (
    <div style={{
      flex: 1, minWidth: 140,
      background: "rgba(255,255,255,0.06)", borderRadius: 10, padding: "14px 18px",
    }}>
      <p style={{ color: "#aaa", margin: 0, fontSize: 12 }}>{team}</p>
      <p style={{ color: "#fff", margin: "6px 0 2px", fontSize: 26, fontWeight: 700 }}>
        {score ?? "-"}<span style={{ fontSize: 16, color: "#aaa" }}>/{wickets ?? "-"}</span>
      </p>
      {balls != null && (
        <p style={{ color: "#888", margin: 0, fontSize: 12 }}>{fmtOvers(balls)} overs</p>
      )}
    </div>
  );
}

// ── scorecard tab ─────────────────────────────────────────────────────────────
function ScorecardTab({ match, t1, t2 }) {
  const [inningsView, setInningsView] = useState(1);

  // ✅ Use blob data if available (always correct), fallback to flat arrays
  const hasBlob = match.innings1DataBlob || match.innings2DataBlob;

  const blobInnings = inningsView === 1 ? match.innings1DataBlob : match.innings2DataBlob;
  const batting = hasBlob
    ? (blobInnings?.battingStats || [])
    : (inningsView === 1 ? (match.team1Batting || []) : (match.team2Batting || []));
  const bowling = hasBlob
    ? (blobInnings?.bowlingStats || [])
    : (inningsView === 1 ? (match.team1Bowling || []) : (match.team2Bowling || []));

  const battingTeam = inningsView === 1 ? t1 : t2;
  const bowlingTeam = inningsView === 1 ? t2 : t1;

  return (
    <div>
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        {[1, 2].map(inn => (
          <button key={inn} onClick={() => setInningsView(inn)} style={{
            background: inningsView === inn ? "rgba(255,215,0,0.15)" : "rgba(255,255,255,0.04)",
            border: `1px solid ${inningsView === inn ? "#FFD700" : "rgba(255,255,255,0.1)"}`,
            color: inningsView === inn ? "#FFD700" : "#aaa",
            borderRadius: 8, padding: "6px 14px", cursor: "pointer", fontSize: 12, fontWeight: 600,
          }}>
            {inn === 1 ? t1 : t2} Innings
          </button>
        ))}
      </div>

      {/* Batting */}
      <SectionHeader label={`${battingTeam} — Batting`} />
      {batting.length === 0
        ? <p style={{ color: "#555", fontSize: 13, marginBottom: 20 }}>No batting data recorded.</p>
        : (
          <div style={{ overflowX: "auto", marginBottom: 24 }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, minWidth: 420 }}>
              <thead>
                <tr style={{ color: "#888" }}>
                  <Th>Batter</Th><Th>Dismissal</Th><Th right>R</Th><Th right>B</Th>
                  <Th right>4s</Th><Th right>6s</Th><Th right>SR</Th>
                </tr>
              </thead>
              <tbody>
                {batting.map((p, i) => {
                  // ✅ Handle both blob format (p.dismissal = "b Rishi") and flat format
                  const dismissalText = hasBlob
                    ? (p.dismissal || null)
                    : (p.isOut ? `${p.dismissalType || "out"}${p.fielderName ? ` (${p.fielderName})` : ""}` : null);

                  return (
                    <tr key={i} style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                      <td style={tdS}>
                        <span style={{ color: "#fff", fontWeight: 600 }}>
                          {p.playerName || p.displayName || p.name}
                        </span>
                      </td>
                      <td style={{ ...tdS, color: "#888", fontSize: 12 }}>
                        {dismissalText
                          ? dismissalText
                          : <span style={{ color: "#4CAF50" }}>not out</span>
                        }
                      </td>
                      <td style={{ ...tdS, textAlign: "right", color: "#fff", fontWeight: 700 }}>{p.runs ?? "-"}</td>
                      <td style={{ ...tdS, textAlign: "right", color: "#aaa" }}>{p.balls ?? "-"}</td>
                      <td style={{ ...tdS, textAlign: "right", color: "#aaa" }}>{p.fours ?? "-"}</td>
                      <td style={{ ...tdS, textAlign: "right", color: "#aaa" }}>{p.sixes ?? "-"}</td>
                      <td style={{ ...tdS, textAlign: "right", color: "#aaa" }}>{calcSR(p.runs, p.balls)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )
      }

      {/* Bowling */}
      <SectionHeader label={`${bowlingTeam} — Bowling`} />
      {bowling.length === 0
        ? <p style={{ color: "#555", fontSize: 13, marginBottom: 20 }}>No bowling data recorded.</p>
        : (
          <div style={{ overflowX: "auto", marginBottom: 8 }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, minWidth: 380 }}>
              <thead>
                <tr style={{ color: "#888" }}>
                  <Th>Bowler</Th><Th right>O</Th><Th right>R</Th>
                  <Th right>W</Th><Th right>Wd</Th><Th right>NB</Th><Th right>Econ</Th>
                </tr>
              </thead>
              <tbody>
                {bowling.map((p, i) => {
                  // ✅ blob uses ballsBowled, flat uses ballsBowled too — consistent
                  const balls = p.ballsBowled || p.balls || 0;
                  const runs  = p.runsGiven  || p.runs  || 0;
                  return (
                    <tr key={i} style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                      <td style={tdS}>
                        <span style={{ color: "#fff", fontWeight: 600 }}>
                          {p.playerName || p.displayName || p.name}
                        </span>
                      </td>
                      <td style={{ ...tdS, textAlign: "right", color: "#aaa" }}>{fmtOvers(balls)}</td>
                      <td style={{ ...tdS, textAlign: "right", color: "#aaa" }}>{runs}</td>
                      <td style={{ ...tdS, textAlign: "right", color: p.wickets > 0 ? "#4CAF50" : "#aaa", fontWeight: p.wickets > 0 ? 700 : 400 }}>{p.wickets ?? "-"}</td>
                      <td style={{ ...tdS, textAlign: "right", color: "#aaa" }}>{p.wides ?? "-"}</td>
                      <td style={{ ...tdS, textAlign: "right", color: "#aaa" }}>{p.noBalls ?? "-"}</td>
                      <td style={{ ...tdS, textAlign: "right", color: "#aaa" }}>{calcEcon(runs, balls)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )
      }
    </div>
  );
}

// ── info tab ──────────────────────────────────────────────────────────────────
function InfoTab({ match, t1, t2, result }) {
    const rows = [
        ["Teams",          `${t1} vs ${t2}`],
        ["Overs",          match.totalOvers ?? match.overs ?? "-"],
        ["Toss",           match.tossWinner ? `${match.tossWinner} won the toss` : "-"],
        ["Result",         result],
        [`${t1} Captain`,  match.team1Captain || "-"],
        [`${t2} Captain`,  match.team2Captain || "-"],
        ["Man of Match",   match.manOfTheMatch || "-"],
        ["Date",           fmtDate(match.createdAt)],
      ];
  return (
    <div style={{
      background: "rgba(255,255,255,0.04)", borderRadius: 10,
      border: "1px solid rgba(255,255,255,0.08)", overflow: "hidden",
    }}>
      {rows.map(([label, value], i) => (
        <div key={i} style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          padding: "12px 16px",
          borderBottom: i < rows.length - 1 ? "1px solid rgba(255,255,255,0.06)" : "none",
        }}>
          <span style={{ color: "#888", fontSize: 13 }}>{label}</span>
          <span style={{ color: "#fff", fontSize: 13, fontWeight: 600, textAlign: "right", maxWidth: "60%" }}>{value}</span>
        </div>
      ))}
    </div>
  );
}

// ── tiny helpers ──────────────────────────────────────────────────────────────
function SectionHeader({ label }) {
  return (
    <h3 style={{
      color: "#FFD700", fontSize: 13, fontWeight: 700, letterSpacing: 0.5,
      textTransform: "uppercase", margin: "0 0 10px",
    }}>{label}</h3>
  );
}

function Th({ children, right }) {
  return (
    <th style={{ padding: "6px 10px", fontWeight: 500, whiteSpace: "nowrap", textAlign: right ? "right" : "left" }}>
      {children}
    </th>
  );
}

const tdS = { padding: "9px 10px", whiteSpace: "nowrap" };

// ── main page ─────────────────────────────────────────────────────────────────
function MatchHistoryPage() {
  const navigate = useNavigate();
  const [matches,  setMatches]  = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);

  useEffect(() => {
    getMatches()
      .then(data => {
        const sorted = [...data].sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        );
        setMatches(sorted);
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className={styles.container}>
      <p style={{ color: "#fff", padding: 32 }}>Loading match history…</p>
    </div>
  );
  if (error) return (
    <div className={styles.container}>
      <p style={{ color: "salmon", padding: 32 }}>Error: {error}</p>
    </div>
  );

  return (
    <div className={styles.container}>
      <div className={styles.leftSection} style={{ maxWidth: 680, width: "100%" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
          <button
            onClick={() => selected ? setSelected(null) : navigate("/home")}
            style={{ background: "none", border: "none", color: "#aaa", fontSize: 22, cursor: "pointer" }}
          >
            ←
          </button>
          <h1 className={styles.title} style={{ margin: 0 }}>
            Match <span>History</span>
          </h1>
        </div>

        {/* List view */}
        {!selected && (
          <>
            {matches.length === 0 && (
              <p style={{ color: "#aaa" }}>No matches recorded yet. Play one!</p>
            )}
            {matches.map(match => (
              <MatchCard
                key={match._id}
                match={match}
                onClick={() => setSelected(match)}
              />
            ))}
          </>
        )}

        {/* Detail view */}
        {selected && (
          <MatchDetail match={selected} onBack={() => setSelected(null)} />
        )}

      </div>
    </div>
  );
}

export default MatchHistoryPage;
