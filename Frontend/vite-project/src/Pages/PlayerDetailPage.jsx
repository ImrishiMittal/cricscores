import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import usePlayerDatabase from "../hooks/usePlayerDatabase";
import styles from "./PlayerDetailPage.module.css";
import * as playerApi from "../api/playerApi";

const TABS = ["Batting", "Bowling", "Fielding", "Captaincy"];
const FORMATS = [
  { key: "all", label: "All" },
  { key: "test", label: "Test" },
  { key: "limitedOvers", label: "T20/ODI" },
];

function StatRow({ label, value, highlight, note }) {
  return (
    <p
      className={
        highlight ? `${styles.statRow} ${styles.highlight}` : styles.statRow
      }
    >
      <span className={styles.statLabel}>{label}</span>
      <span className={styles.statValue}>
        {value}
        {note && <span className={styles.statNote}>{note}</span>}
      </span>
    </p>
  );
}

function PlayerDetailPage() {
  const { jersey } = useParams();
  const { getPlayer, migratePlayer, getAllPlayers, createOrGetPlayer } =
    usePlayerDatabase();
  const [activeTab, setActiveTab] = useState(0);
  const [editingJersey, setEditingJersey] = useState(false);
  const [newJersey, setNewJersey] = useState("");
  const [jerseyError, setJerseyError] = useState("");
  const [format, setFormat] = useState("all");

  useEffect(() => {
    migratePlayer(jersey);
  }, [jersey]);

  const player = getPlayer(jersey);

  const handleJerseyEdit = async () => {
    const trimmed = newJersey.trim();
    if (!trimmed) {
      setJerseyError("Jersey number required");
      return;
    }
    const all = getAllPlayers();
    const conflict = all.find(
      (p) => String(p.jersey) === trimmed && String(p.jersey) !== String(jersey)
    );
    if (conflict) {
      setJerseyError(`#${trimmed} is already taken by ${conflict.name}`);
      return;
    }
    try {
      await playerApi.updatePlayer(player._id, { jersey: trimmed });
      await createOrGetPlayer(trimmed, player.name);
      setEditingJersey(false);
      setJerseyError("");
      window.location.reload();
    } catch (err) {
      setJerseyError("Failed to update jersey");
    }
  };

  if (!player) {
    return <div className={styles.empty}>No Player Found</div>;
  }

  const s = (field) => {
    if (format === "all") return player[field] || 0;
    return player[format]?.[field] || 0;
  };

  // ── Batting derived stats ──────────────────────────────────────────────────
  const totalRuns = s("runs");
  const balls = s("balls");
  const innings = s("innings");
  const dismissals = s("dismissals");
  const strikeRate =
    balls > 0 ? ((totalRuns / balls) * 100).toFixed(2) : "0.00";
  const derivedNotOuts = Math.max(0, innings - dismissals);
  const notOuts =
    format === "all"
      ? Math.max(player.notOuts || 0, derivedNotOuts)
      : s("notOuts");
  const avg =
    dismissals > 0
      ? (totalRuns / dismissals).toFixed(2)
      : totalRuns > 0
      ? "N/O"
      : "0.00";
  const highestScore =
    format === "all"
      ? player.highestScore || 0
      : player[format]?.highestScore || 0;
  const highestScoreDisplay =
    highestScore > 0 ? highestScore : totalRuns > 0 ? "—" : 0;
  const highestScoreIsStale = highestScore === 0 && totalRuns > 0;

  // ── Bowling derived stats ──────────────────────────────────────────────────
  const ballsBowled = s("ballsBowled");
  const runsGiven = s("runsGiven");
  const wickets = s("wickets");
  const overs = ballsBowled
    ? `${Math.floor(ballsBowled / 6)}.${ballsBowled % 6}`
    : "0.0";
  const economy =
    ballsBowled > 0 ? (runsGiven / (ballsBowled / 6)).toFixed(2) : "0.00";
  const bowlingAvg = wickets > 0 ? (runsGiven / wickets).toFixed(2) : "—";

  return (
    <div className={styles.container}>
      {/* ─── NAME CARD ─────────────────────────────────────── */}
      <div className={styles.card}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <h1 className={styles.title}>
            <span className={styles.jersey}>#{player.jersey}</span>
            {player.name}
          </h1>
          {!editingJersey && (
            <button
              onClick={() => {
                setNewJersey(player.jersey || "");
                setEditingJersey(true);
              }}
              title="Edit Jersey Number"
              style={{
                background: "transparent",
                border: "none",
                color: "#4b5563",
                fontSize: "14px",
                cursor: "pointer",
                padding: "4px",
                lineHeight: 1,
                flexShrink: 0,
              }}
            >
              <b>Edit J No.</b>
            </button>
          )}
        </div>

        {editingJersey && (
          <div
            style={{
              display: "flex",
              gap: "8px",
              alignItems: "center",
              marginTop: "10px",
              flexWrap: "wrap",
            }}
          >
            <span style={{ color: "#9ca3af", fontSize: "13px" }}>#</span>
            <input
              value={newJersey}
              onChange={(e) => {
                setNewJersey(e.target.value);
                setJerseyError("");
              }}
              placeholder="New jersey #"
              style={{
                background: "#111",
                border: "1px solid #22c55e",
                color: "#fff",
                borderRadius: "6px",
                padding: "4px 8px",
                width: "80px",
                fontSize: "13px",
              }}
            />
            <button
              onClick={handleJerseyEdit}
              style={{
                background: "#22c55e",
                color: "#000",
                border: "none",
                borderRadius: "6px",
                padding: "4px 12px",
                fontWeight: 600,
                fontSize: "13px",
                cursor: "pointer",
              }}
            >
              Save
            </button>
            <button
              onClick={() => {
                setEditingJersey(false);
                setJerseyError("");
              }}
              style={{
                background: "#374151",
                color: "#e5e7eb",
                border: "none",
                borderRadius: "6px",
                padding: "4px 12px",
                fontSize: "13px",
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
            {jerseyError && (
              <span style={{ color: "#ef4444", fontSize: "12px" }}>
                {jerseyError}
              </span>
            )}
          </div>
        )}
      </div>

      {/* ─── FORMAT FILTER (top) ────────────────────────────── */}
      <div style={{ display: "flex", gap: "8px", margin: "8px 0 0" }}>
        {FORMATS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFormat(key)}
            style={{
              flex: 1,
              padding: "6px",
              borderRadius: "8px",
              border: "1px solid",
              borderColor: format === key ? "#22c55e" : "#374151",
              background:
                format === key ? "rgba(34,197,94,0.12)" : "transparent",
              color: format === key ? "#22c55e" : "#9ca3af",
              fontSize: "12px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ─── TABS (below format) ────────────────────────────── */}
      <div className={styles.tabBar} style={{ marginTop: "8px" }}>
        {TABS.map((tab, i) => (
          <button
            key={tab}
            className={
              i === activeTab ? `${styles.tab} ${styles.tabActive}` : styles.tab
            }
            onClick={() => setActiveTab(i)}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* ─── BATTING ──────────────────────────────────────── */}
      {activeTab === 0 && (
        <div className={styles.card}>
          <h2 className={styles.sectionTitle}>🏏 Batting</h2>
          <StatRow label="Matches" value={s("matches")} />
          <StatRow label="Innings" value={innings} />
          <StatRow label="Not Outs" value={notOuts} />
          <StatRow
            label="Highest Score"
            value={highestScoreDisplay}
            highlight
            note={highestScoreIsStale ? "(older matches)" : null}
          />
          <StatRow label="Runs" value={totalRuns} highlight />
          <StatRow label="Balls" value={balls} />
          <StatRow label="Strike Rate" value={strikeRate} highlight />
          <StatRow label="Average" value={avg} highlight />
          <StatRow label="Dot Balls" value={s("dotBalls")} />
          <StatRow label="Ducks" value={s("ducks")} />
          <StatRow label="1s" value={s("ones")} />
          <StatRow label="2s" value={s("twos")} />
          <StatRow label="3s" value={s("threes")} />
          <StatRow label="4s" value={s("fours")} />
          <StatRow label="6s" value={s("sixes")} />
          <StatRow label="30s" value={s("thirties")} />
          <StatRow label="50s" value={s("fifties")} />
          <StatRow label="100s" value={s("hundreds")} />
        </div>
      )}

      {/* ─── BOWLING ──────────────────────────────────────── */}
      {activeTab === 1 && (
        <div className={styles.card}>
          <h2 className={styles.sectionTitle}>🎯 Bowling</h2>
          <StatRow label="Bowling Innings" value={s("bowlingInnings")} />
          <StatRow label="Wickets" value={wickets} highlight />
          <StatRow label="Economy" value={economy} highlight />
          <StatRow label="Average" value={bowlingAvg} highlight />
          <StatRow label="Overs" value={overs} highlight />
          <StatRow label="Dot Balls Bowled" value={s("dotBallsBowled")} />
          <StatRow label="Wides" value={s("wides")} />
          <StatRow label="No Balls" value={s("noBalls")} />
          <StatRow label="Maiden Overs" value={s("maidens")} />
          <StatRow label="3-Wicket Hauls" value={s("threeWickets")} />
          <StatRow label="5-Wicket Hauls" value={s("fiveWickets")} />
          <StatRow label="10-Wicket Hauls" value={s("tenWickets")} />
        </div>
      )}

      {/* ─── FIELDING ─────────────────────────────────────── */}
      {activeTab === 2 && (
        <div className={styles.card}>
          <h2 className={styles.sectionTitle}>🧤 Fielding</h2>
          <StatRow label="Catches" value={player.catches || 0} highlight />
          <StatRow label="Run Outs" value={player.runouts || 0} highlight />
          <StatRow label="Stumpings" value={player.stumpings || 0} highlight />
        </div>
      )}

      {/* ─── CAPTAINCY ────────────────────────────────────── */}
      {activeTab === 3 && (
        <div className={styles.card}>
          <h2 className={styles.sectionTitle}>🧢 Captaincy</h2>
          {(player.captainMatches || 0) === 0 ? (
            <p className={styles.statRow}>No captaincy record yet.</p>
          ) : (
            <>
              <StatRow
                label="Matches as Captain"
                value={player.captainMatches || 0}
              />
              <StatRow
                label="Win %"
                value={`${(
                  ((player.captainWins || 0) / player.captainMatches) *
                  100
                ).toFixed(1)}%`}
                highlight
              />
              <StatRow label="Wins" value={player.captainWins || 0} highlight />
              <StatRow label="Losses" value={player.captainLosses || 0} />
              <StatRow label="Ties" value={player.captainTies || 0} />
              <StatRow label="No Result" value={player.captainNR || 0} />
              <StatRow label="Draws" value={player.captainDraws || 0} />
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default PlayerDetailPage;
